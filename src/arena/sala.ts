// Sala autoritativa da arena (§3.6). Só ela decide movimento, combate, loot e pontuação; o cliente
// envia intenções. O mesmo código roda em loopback (marco 4) e no servidor dedicado (marco 5).
//
// Por comando: a entidade vem da sessão (nunca do payload), época e seq são conferidos (seq repetido
// é ignorado: deduplicação), há balde de fichas (60/s, burst 20) e fila limitada; o comando vale no
// `tickCliente` se ainda não passou, senão no tick atual (D-033). Nenhum jogador acelera a simulação
// mandando mais mensagens, e o criador da sala não tem prioridade nenhuma.

import type { Comando, ComandoDoTick, Dir8 } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import { criarEstado, type EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { criarRng, proximoU32, type EstadoRng } from '../core/rng';
import { simular } from '../core/simulacao';
import { ticksDe } from '../core/tempo';
import { povoarFase } from '../world/populacao';
import { entrarNaArena } from './entrada';
import { estadoPublico } from './estado-publico';
import { GeradorDePatches } from './patches';
import { construirFichaDeSessao } from './ficha-sessao';
import { lerMensagemCliente, type MensagemCliente, type MensagemServidor, type MotivoRejeicao } from './protocolo';

export const COMANDOS_POR_SEGUNDO = 60;
export const BURST_COMANDOS = 20;
export const MAX_FILA_POR_SESSAO = 64;
/** Quanto à frente do servidor um comando pode ser agendado. */
export const MAX_ADIANTAMENTO_TICKS = 30;
export const EXPIRACAO_MOVIMENTO_MS = 500;
export const RESERVA_RECONEXAO_MS = 30_000;
/** Estado público (completo ou patch) a 20 Hz: a cada 3 ticks de 60 Hz (§3.6). */
export const TICKS_POR_ESTADO = 3;

interface Sessao {
  sessaoId: string;
  jogadorId: string;
  entidadeId: string;
  enviar: (texto: string) => void;
  ultimoSeq: number;
  fichas: number;
  ultimaRecargaTick: number;
  direcao: Dir8 | 'parado';
  ultimoMoverTick: number;
  naFila: number;
  conectada: boolean;
  desconectadaEmTick: number;
  /** Próxima transmissão vai completa (entrada, reconexão, ressincronização). */
  precisaCompleto: boolean;
  bytesEnviados: number;
  rejeicoes: number;
}

interface ComandoAgendado {
  tickAplicacao: number;
  ordem: number;
  sessaoId: string;
  entidadeId: string;
  cmd: Comando;
}

export interface Conexao {
  receber: (texto: string) => void;
  /** Queda: o personagem para e a sessão fica reservada por 30 s (§2.13). */
  fechar: () => void;
  /** Reconexão dentro da reserva: volta a receber, começando por um estado completo. */
  retomar: () => void;
  /** Saída definitiva: a entidade sai do mundo agora. */
  encerrar: () => void;
}

export interface MetricasSala {
  jogadores: number;
  bytesEnviados: number;
  rejeicoes: number;
}

export interface OpcoesSala {
  semente: number;
  versaoConteudo: string;
}

export class SalaArena {
  readonly estado: EstadoJogo;
  readonly epoca = 1;
  private readonly sessoes = new Map<string, Sessao>();
  private agenda: ComandoAgendado[] = [];
  private ordemChegada = 0;
  private proximoJogador = 1;
  /** PRNG só para IDs de sessão: não consome a sequência da simulação. */
  private readonly rngSessoes: EstadoRng;
  private readonly eventosDoTick: EventoSimulacao[] = [];
  private readonly patches = new GeradorDePatches();

  constructor(
    readonly ctx: ContextoSimulacao,
    private readonly opcoes: OpcoesSala,
  ) {
    this.estado = criarEstado({ semente: opcoes.semente, faseId: ctx.fase.id });
    this.rngSessoes = criarRng(opcoes.semente ^ 0x5e55a0);
    povoarFase(this.estado, ctx);
  }

  get jogadores(): number {
    return this.sessoes.size;
  }

  metricas(): MetricasSala {
    let bytesEnviados = 0;
    let rejeicoes = 0;
    for (const s of this.sessoes.values()) {
      bytesEnviados += s.bytesEnviados;
      rejeicoes += s.rejeicoes;
    }
    return { jogadores: this.sessoes.size, bytesEnviados, rejeicoes };
  }

  conectar(enviarBruto: (texto: string) => void): Conexao {
    let sessao: Sessao | null = null;
    const enviar = (texto: string) => {
      if (sessao) sessao.bytesEnviados += texto.length;
      enviarBruto(texto);
    };
    const responder = (msg: MensagemServidor) => {
      if (sessao && msg.t === 'rejeitado') sessao.rejeicoes++;
      enviar(JSON.stringify(msg));
    };
    return {
      receber: (texto) => {
        const leitura = lerMensagemCliente(texto);
        if (!leitura.ok) {
          // Comando rejeitado conta como recebido, para o ack andar (D-034).
          if (sessao && leitura.seq !== null && leitura.seq > sessao.ultimoSeq) sessao.ultimoSeq = leitura.seq;
          responder({ t: 'rejeitado', seq: leitura.seq, motivo: leitura.motivo });
          return;
        }
        const nova = this.tratar(leitura.msg, sessao, enviar, responder);
        if (nova) sessao = nova;
      },
      fechar: () => {
        if (!sessao) return;
        sessao.conectada = false;
        sessao.desconectadaEmTick = this.estado.tick;
        // Personagem desconectado fica parado e vulnerável (§2.13).
        this.agendar(sessao, { t: 'mover', dir: 'parado' }, this.estado.tick);
        sessao.direcao = 'parado';
      },
      retomar: () => {
        if (!sessao || !this.sessoes.has(sessao.sessaoId)) return;
        sessao.conectada = true;
        sessao.desconectadaEmTick = 0;
        sessao.precisaCompleto = true;
      },
      encerrar: () => {
        if (!sessao) return;
        this.sessoes.delete(sessao.sessaoId);
        const id = sessao.entidadeId;
        this.estado.entidades = this.estado.entidades.filter((e) => e.id !== id);
        sessao = null;
      },
    };
  }

  private tratar(
    msg: MensagemCliente,
    sessao: Sessao | null,
    enviar: (texto: string) => void,
    responder: (m: MensagemServidor) => void,
  ): Sessao | null {
    switch (msg.t) {
      case 'ping':
        responder({ t: 'pong', id: msg.id, enviadoMs: msg.enviadoMs, tickServidor: this.estado.tick });
        return null;
      case 'entrar':
        return this.entrar(msg, sessao, enviar, responder);
      case 'ressincronizar':
        if (sessao) sessao.precisaCompleto = true;
        return null;
      case 'cmd': {
        const rejeitar = (motivo: MotivoRejeicao) => {
          responder({ t: 'rejeitado', seq: msg.pacote.seq, motivo });
        };
        if (!sessao) {
          rejeitar('nao_entrou');
          return null;
        }
        const p = msg.pacote;
        if (p.sessaoId !== sessao.sessaoId) {
          rejeitar('sessao');
          return null;
        }
        if (p.epocaSala !== this.epoca) {
          rejeitar('epoca');
          return null;
        }
        // seq repetido ou antigo: já aplicado (ou rejeitado); não reaplica (deduplicação, §3.6).
        if (p.seq <= sessao.ultimoSeq) return null;
        sessao.ultimoSeq = p.seq;
        this.recarregarFichas(sessao);
        if (sessao.fichas < 1) {
          rejeitar('taxa');
          return null;
        }
        if (sessao.naFila >= MAX_FILA_POR_SESSAO) {
          rejeitar('fila');
          return null;
        }
        sessao.fichas -= 1;
        const tick = Math.min(this.estado.tick + MAX_ADIANTAMENTO_TICKS, Math.max(this.estado.tick, p.tickCliente));
        this.agendar(sessao, p.cmd, tick);
        return null;
      }
    }
  }

  private entrar(
    msg: Extract<MensagemCliente, { t: 'entrar' }>,
    sessao: Sessao | null,
    enviar: (texto: string) => void,
    responder: (m: MensagemServidor) => void,
  ): Sessao | null {
    if (sessao) {
      responder({ t: 'erro', motivo: 'ja_entrou' });
      return null;
    }
    if (msg.versaoConteudo !== this.opcoes.versaoConteudo) {
      responder({ t: 'erro', motivo: 'versao_conteudo' });
      return null;
    }
    if (this.sessoes.size >= this.ctx.modo.maxJogadores) {
      responder({ t: 'erro', motivo: 'sala_cheia' });
      return null;
    }
    const n = this.proximoJogador++;
    const jogadorId = `jogador-${n}`;
    const entidadeId = `p${n}`;
    const previa = construirFichaDeSessao(msg.pedidoFicha, this.ctx.modo, this.ctx.conteudo, this.ctx.balance);
    entrarNaArena(this.estado, this.ctx, jogadorId, entidadeId, previa.ficha, msg.nome || `Jogador ${n}`);
    const nova: Sessao = {
      sessaoId: `s${proximoU32(this.rngSessoes).toString(36)}${proximoU32(this.rngSessoes).toString(36)}`,
      jogadorId,
      entidadeId,
      enviar,
      ultimoSeq: 0,
      fichas: BURST_COMANDOS,
      ultimaRecargaTick: this.estado.tick,
      direcao: 'parado',
      ultimoMoverTick: this.estado.tick,
      naFila: 0,
      conectada: true,
      desconectadaEmTick: 0,
      precisaCompleto: true,
      bytesEnviados: 0,
      rejeicoes: 0,
    };
    this.sessoes.set(nova.sessaoId, nova);
    responder({
      t: 'bemVindo',
      sessaoId: nova.sessaoId,
      entidadeId,
      epocaSala: this.epoca,
      tick: this.estado.tick,
      faseId: this.ctx.fase.id,
      modoId: this.ctx.modo.id,
      previa,
      estado: estadoPublico(this.estado),
    });
    return nova;
  }

  /** Balde de fichas: 60 por segundo de simulação, até o burst (§3.6). */
  private recarregarFichas(s: Sessao): void {
    const decorrido = this.estado.tick - s.ultimaRecargaTick;
    s.fichas = Math.min(BURST_COMANDOS, s.fichas + (decorrido * COMANDOS_POR_SEGUNDO) / ticksDe(1000));
    s.ultimaRecargaTick = this.estado.tick;
  }

  private agendar(s: Sessao, cmd: Comando, tickAplicacao: number): void {
    this.agenda.push({ tickAplicacao, ordem: this.ordemChegada++, sessaoId: s.sessaoId, entidadeId: s.entidadeId, cmd });
    s.naFila++;
    if (cmd.t === 'mover') {
      s.direcao = cmd.dir;
      s.ultimoMoverTick = tickAplicacao;
    }
  }

  /** Um tick de 60 Hz: comandos vencidos → simulação → eventos; estado público a 20 Hz. */
  tick(dtMs: number): void {
    this.expirarMovimentoMantido();
    this.removerDesconectados();

    const vencidos = this.agenda.filter((c) => c.tickAplicacao <= this.estado.tick);
    this.agenda = this.agenda.filter((c) => c.tickAplicacao > this.estado.tick);
    vencidos.sort((a, b) => a.tickAplicacao - b.tickAplicacao || a.ordem - b.ordem);
    const comandos: ComandoDoTick[] = [];
    for (const c of vencidos) {
      const s = this.sessoes.get(c.sessaoId);
      if (s) s.naFila--;
      comandos.push({ tick: this.estado.tick, entidadeId: c.entidadeId, cmd: c.cmd });
    }

    this.eventosDoTick.length = 0;
    simular(this.estado, this.ctx, comandos, this.eventosDoTick, dtMs);
    if (this.eventosDoTick.length > 0) {
      this.transmitir({ t: 'eventos', tick: this.estado.tick, eventos: this.eventosDoTick });
    }
    if (this.estado.tick % TICKS_POR_ESTADO === 0) this.transmitirEstado();
  }

  /**
   * Estado a 20 Hz (§3.6): completo para quem acabou de entrar, reconectou ou pediu; patch para os
   * demais. O patch é o mesmo para todos (parte da transmissão anterior); só o ack muda por sessão.
   */
  private transmitirEstado(): void {
    const publico = estadoPublico(this.estado);
    const patch = this.patches.gerar(publico);
    const tick = this.estado.tick;
    // Serializa o corpo uma vez só; por sessão muda apenas o ack (o maior custo do tick era repetir o JSON).
    let textoPatch: string | null = null;
    let textoEstado: string | null = null;
    for (const s of this.sessoes.values()) {
      if (!s.conectada) continue;
      const cabecalho = `"tick":${tick},"epocaSala":${this.epoca},"ackSeq":${s.ultimoSeq}`;
      if (s.precisaCompleto) {
        textoEstado ??= JSON.stringify(publico);
        s.enviar(`{"t":"estado",${cabecalho},"estado":${textoEstado}}`);
      } else {
        textoPatch ??= JSON.stringify(patch);
        s.enviar(`{"t":"patch",${cabecalho},"patch":${textoPatch}}`);
      }
      s.precisaCompleto = false;
    }
  }

  /** Entrada mantida sem renovação expira (§2.13): o servidor manda parar. */
  private expirarMovimentoMantido(): void {
    const limite = ticksDe(EXPIRACAO_MOVIMENTO_MS);
    for (const s of this.sessoes.values()) {
      if (s.direcao !== 'parado' && this.estado.tick - s.ultimoMoverTick > limite) {
        this.agendar(s, { t: 'mover', dir: 'parado' }, this.estado.tick);
      }
    }
  }

  /** A reserva de reconexão dura 30 s (§2.13); depois a entidade sai do mundo. */
  private removerDesconectados(): void {
    const limite = ticksDe(RESERVA_RECONEXAO_MS);
    for (const s of [...this.sessoes.values()]) {
      if (s.conectada || this.estado.tick - s.desconectadaEmTick < limite) continue;
      this.sessoes.delete(s.sessaoId);
      this.estado.entidades = this.estado.entidades.filter((e) => e.id !== s.entidadeId);
    }
  }

  private transmitir(msg: MensagemServidor): void {
    const texto = JSON.stringify(msg);
    for (const s of this.sessoes.values()) if (s.conectada) s.enviar(texto);
  }
}
