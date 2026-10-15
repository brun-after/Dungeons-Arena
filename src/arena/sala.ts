// Sala autoritativa da arena (§3.6). Só ela decide movimento, combate, loot e pontuação; o cliente
// envia intenções. O mesmo código roda em loopback (marco 4) e no servidor dedicado (marco 5).
//
// Por comando: a entidade vem da sessão (nunca do payload), época e seq são conferidos (seq repetido
// é ignorado: deduplicação), há balde de fichas (60/s, burst 20) e fila limitada; o comando vale no
// `tickCliente` se ainda não passou, senão no tick atual (D-033). Nenhum jogador acelera a simulação
// mandando mais mensagens, e o criador da sala não tem prioridade nenhuma.
// Marco 15 (15/10/2026): a campanha cooperativa (coop/sala-campanha.ts) estende esta sala pelos ganchos
// `criarPersonagem`, `motivoParaRecusar`, `depoisDoTick`, `aoRemoverSessao` e `trocarMundo`; os comandos aceitos
// pela rede vêm do modo (`comandosDeRede`).

import type { Comando, ComandoDoTick, Dir8, EntidadeId } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import { criarEstado, type EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { criarRng, proximoU32, type EstadoRng } from '../core/rng';
import { simular } from '../core/simulacao';
import { ticksDe } from '../core/tempo';
import { comandoAceitoEmRede } from '../modos/regras';
import { povoarFase } from '../world/populacao';
import { entrarNaArena } from './entrada';
import { estadoPublico } from './estado-publico';
import { GeradorDePatches } from './patches';
import { construirFichaDeSessao, type PreviaDeFicha } from './ficha-sessao';
import { lerMensagemCliente, type MensagemCliente, type MensagemServidor, type MotivoErro, type MotivoRejeicao } from './protocolo';

export const COMANDOS_POR_SEGUNDO = 60;
export const BURST_COMANDOS = 20;
export const MAX_FILA_POR_SESSAO = 64;
/** Quanto à frente do servidor um comando pode ser agendado. */
export const MAX_ADIANTAMENTO_TICKS = 30;
export const EXPIRACAO_MOVIMENTO_MS = 500;
export const RESERVA_RECONEXAO_MS = 30_000;
/** Estado público (completo ou patch) a 20 Hz: a cada 3 ticks de 60 Hz (§3.6). */
export const TICKS_POR_ESTADO = 3;

export interface Sessao {
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

/** O que o gancho de entrada devolve: a prévia da ficha, ou o motivo da recusa. */
export type EntradaDePersonagem = { ok: true; previa: PreviaDeFicha } | { ok: false; motivo: MotivoErro };

export class SalaArena {
  /** Marco 15: a campanha cooperativa troca o mundo (e o contexto) a cada fase; a época sobe junto. */
  estado: EstadoJogo;
  epoca = 1;
  protected readonly sessoes = new Map<string, Sessao>();
  private agenda: ComandoAgendado[] = [];
  private ordemChegada = 0;
  private proximoJogador = 1;
  /** PRNG só para IDs de sessão: não consome a sequência da simulação. */
  private readonly rngSessoes: EstadoRng;
  private readonly eventosDoTick: EventoSimulacao[] = [];
  private patches = new GeradorDePatches();
  private bytesTotais = 0;
  private rejeicoesTotais = 0;

  constructor(
    public ctx: ContextoSimulacao,
    private readonly opcoes: OpcoesSala,
    estadoInicial?: EstadoJogo,
  ) {
    this.rngSessoes = criarRng(opcoes.semente ^ 0x5e55a0);
    if (estadoInicial) {
      this.estado = estadoInicial;
    } else {
      this.estado = criarEstado({ semente: opcoes.semente, faseId: ctx.fase.id });
      povoarFase(this.estado, ctx);
    }
  }

  get jogadores(): number {
    return this.sessoes.size;
  }

  /**
   * Contadores acumulados da sala desde a criação. São monotônicos: quem sai não tira o que já
   * foi enviado (a soma por sessão ficava negativa quando um jogador saía).
   */
  metricas(): MetricasSala {
    return { jogadores: this.sessoes.size, bytesEnviados: this.bytesTotais, rejeicoes: this.rejeicoesTotais };
  }

  conectar(enviarBruto: (texto: string) => void): Conexao {
    let sessao: Sessao | null = null;
    const enviar = (texto: string) => {
      this.bytesTotais += texto.length;
      if (sessao) sessao.bytesEnviados += texto.length;
      enviarBruto(texto);
    };
    const responder = (msg: MensagemServidor) => {
      if (msg.t === 'rejeitado') {
        this.rejeicoesTotais++;
        if (sessao) sessao.rejeicoes++;
      }
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
        this.removerSessao(sessao);
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
        // Marco 15: o modo diz o que a rede pode mandar (e a sala cooperativa, o que só o anfitrião pode).
        const motivo = this.motivoParaRecusar(sessao, p.cmd);
        if (motivo) {
          rejeitar(motivo);
          return null;
        }
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
    const n = this.proximoJogador;
    const jogadorId = `jogador-${n}`;
    const entidadeId = `p${n}`;
    const entrada = this.criarPersonagem(msg, jogadorId, entidadeId, n);
    if (!entrada.ok) {
      responder({ t: 'erro', motivo: entrada.motivo });
      return null;
    }
    this.proximoJogador++;
    const { previa } = entrada;
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
    this.aoEntrar?.(nova);
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

  /** Gancho de entrada: cria a entidade do jogador no mundo. Na arena, pela ficha de sessão com o clamp do modo. */
  protected criarPersonagem(msg: Extract<MensagemCliente, { t: 'entrar' }>, jogadorId: string, entidadeId: EntidadeId, n: number): EntradaDePersonagem {
    const previa = construirFichaDeSessao(msg.pedidoFicha, this.ctx.modo, this.ctx.conteudo, this.ctx.balance);
    entrarNaArena(this.estado, this.ctx, jogadorId, entidadeId, previa.ficha, msg.nome || `Jogador ${n}`);
    return { ok: true, previa };
  }

  /** Gancho: a sessão acabou de entrar (já está em `sessoes`). */
  protected aoEntrar?(s: Sessao): void;

  /** Gancho: por que recusar o comando desta sessão (null = aceita). Na base, só o que o modo aceita pela rede. */
  protected motivoParaRecusar(s: Sessao, cmd: Comando): MotivoRejeicao | null {
    return comandoAceitoEmRede(this.ctx.modo, cmd) ? null : 'nao_permitido';
  }

  /** Gancho: depois de cada tick (a sala cooperativa manda o canal privado e confere a saída). */
  protected depoisDoTick?(): void;

  /** Gancho: a sessão saiu de vez (a entidade já saiu do mundo). */
  protected aoRemoverSessao?(s: Sessao): void;

  protected removerSessao(s: Sessao): void {
    this.sessoes.delete(s.sessaoId);
    this.estado.entidades = this.estado.entidades.filter((e) => e.id !== s.entidadeId);
    this.aoRemoverSessao?.(s);
  }

  protected estadoPublicoAtual(): EstadoJogo {
    return estadoPublico(this.estado);
  }

  protected enviarPara(s: Sessao, msg: MensagemServidor): void {
    if (s.conectada) s.enviar(JSON.stringify(msg));
  }

  /**
   * Marco 15: troca o mundo inteiro (fase nova da campanha cooperativa). A época sobe — comandos em trânsito da fase
   * anterior são recusados — e a agenda esvazia. O gerador de patches parte do estado novo, que quem chama manda
   * completo (`novaFase`).
   */
  protected trocarMundo(ctx: ContextoSimulacao, estado: EstadoJogo): EstadoJogo {
    // O mundo novo tem o próprio relógio: os ticks guardados nas sessões andam junto (reserva, taxa, movimento).
    const delta = estado.tick - this.estado.tick;
    this.ctx = ctx;
    this.estado = estado;
    this.epoca++;
    this.agenda = [];
    for (const s of this.sessoes.values()) {
      s.desconectadaEmTick += delta;
      s.ultimaRecargaTick += delta;
      s.ultimoMoverTick += delta;
      s.naFila = 0;
      s.direcao = 'parado';
      s.precisaCompleto = false;
    }
    this.patches = new GeradorDePatches();
    const publico = estadoPublico(estado);
    this.patches.gerar(publico);
    return publico;
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
    this.depoisDoTick?.();
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
      this.removerSessao(s);
    }
  }

  private transmitir(msg: MensagemServidor): void {
    const texto = JSON.stringify(msg);
    for (const s of this.sessoes.values()) if (s.conectada) s.enviar(texto);
  }
}
