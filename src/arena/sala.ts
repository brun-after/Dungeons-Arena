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
import { construirFichaDeSessao } from './ficha-sessao';
import { lerMensagemCliente, type MensagemCliente, type MensagemServidor, type MotivoRejeicao } from './protocolo';

export const COMANDOS_POR_SEGUNDO = 60;
export const BURST_COMANDOS = 20;
export const MAX_FILA_POR_SESSAO = 64;
/** Quanto à frente do servidor um comando pode ser agendado. */
export const MAX_ADIANTAMENTO_TICKS = 30;
export const EXPIRACAO_MOVIMENTO_MS = 500;
export const RESERVA_RECONEXAO_MS = 30_000;
/** Estado público a 20 Hz: a cada 3 ticks de 60 Hz (§3.6). */
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
  fechar: () => void;
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

  conectar(enviar: (texto: string) => void): Conexao {
    let sessao: Sessao | null = null;
    const responder = (msg: MensagemServidor) => {
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
    if (this.estado.tick % TICKS_POR_ESTADO === 0) {
      const publico = estadoPublico(this.estado);
      for (const s of this.sessoes.values()) {
        if (!s.conectada) continue;
        s.enviar(JSON.stringify({ t: 'estado', tick: this.estado.tick, epocaSala: this.epoca, ackSeq: s.ultimoSeq, estado: publico } satisfies MensagemServidor));
      }
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
