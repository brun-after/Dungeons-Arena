// Cliente da arena (§3.6): envia intenções com `seq`, prevê só o próprio movimento e reconcilia de
// forma contínua com o estado autoritativo:
//   1. guarda e envia o comando com seq e tick estimado, e prevê o movimento;
//   2. ao receber estado + ackSeq: adota a base, descarta os confirmados e reaplica os pendentes;
//   3. a correção lógica é imediata; a apresentação converge suave (ou reposiciona se o erro é grande).
// O cliente roda alguns ticks à frente do servidor, para que os comandos cheguem a tempo (D-033).
// Marco 15 (15/10/2026): na campanha cooperativa, o canal privado traz a própria bolsa (posta na entidade prevista,
// para a mochila, a loja e a barra funcionarem como no solo) e `novaFase` troca o mundo e o contexto.

import { aplicarPatch } from '../arena/patches';
import { versaoDoConteudo, type MensagemServidor } from '../arena/protocolo';
import type { Bolsa } from '../entities/entidade';
import type { Certificado } from '../integridade/certificado';
import type { RefFase } from '../save/esquema';
import type { Comando, ComandoEmpacotado } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import { buscarEntidade, clonarEstado, type Armadilha, type EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { DT_MS } from '../core/loop';
import { ticksDe } from '../core/tempo';
import { posicaoNoPasso, type PontoVisual } from '../entities/entidade';
import { definirDirecao, integrarEntidade, planejarIrPara } from '../world/movimento';
import { BufferRemoto } from './interpolacao-remota';
import type { Transporte } from './transporte';
import type { AvisoDoMundo } from '../mundo/avisos';

/** Margem, em ticks, além do RTT, para o comando chegar antes do seu tick. */
const MARGEM_TICKS = 2;
/**
 * Renovação do movimento mantido (a sala expira o mantido em 500 ms). 13/10/2026 (marco 7B): de 3
 * para 6 ticks (100 ms). Com 3, eram 20 comandos/s só de renovação, e uma parada de retransmissão
 * TCP no perfil degradado entregava tudo de uma vez, estourando o balde de 20 (D-047).
 */
const RENOVACAO_MOVIMENTO_TICKS = 6;
const INTERVALO_PING_TICKS = ticksDe(2000);
const ATRASO_REMOTOS_TICKS = ticksDe(100);
const LIMITE_REPOSICIONAR = 2;
const SUAVIZACAO_MS = 100;
const MAX_HISTORICO = 600;

export interface OpcoesCliente {
  ctx: ContextoSimulacao;
  transporte: Transporte;
  nome: string;
  pedidoFicha: unknown;
  agoraMs: () => number;
  aoEventos?: (eventos: EventoSimulacao[]) => void;
  /** Marco 15: o contexto de uma fase da campanha (para a predição depois de `novaFase`). */
  contextoDe?: (ref: RefFase) => ContextoSimulacao | null;
}

export type NovaFase = Extract<MensagemServidor, { t: 'novaFase' }>;

export class ClienteArena {
  sessaoId: string | null = null;
  entidadeId: string | null = null;
  epoca = 0;
  base: EstadoJogo | null = null;
  baseTick = 0;
  previsto: EstadoJogo | null = null;
  tickLocal = 0;
  rttMs = 0;
  /** Erros de correção (células) medidos em cada reconciliação. */
  readonly erros: number[] = [];
  readonly remotos = new BufferRemoto();
  rejeitados = 0;
  /** Rejeições por motivo, para diagnóstico (carga e testes de rede, marco 7B). */
  readonly motivosRejeicao: Record<string, number> = {};
  ressincronizacoes = 0;
  private aguardandoCompleto = false;
  /** Recebe os eventos transitórios da sala (dano, coleta, mortes) para a apresentação. */
  aoEventos: ((eventos: EventoSimulacao[]) => void) | null;
  /** Marco 15 (cooperativo): a própria bolsa, pelo canal privado; e se esta sessão é a do anfitrião. */
  bolsaPropria: Bolsa | null = null;
  private armadilhasProprias: Armadilha[] | null = null;
  anfitriao = false;
  /** A entidade do anfitrião (para o painel do grupo). */
  anfitriaoId: string | null = null;
  ctx: ContextoSimulacao;
  aoPrivado: (() => void) | null = null;
  aoNovaFase: ((msg: NovaFase) => void) | null = null;
  aoFimDaCampanha: (() => void) | null = null;
  /** Marco 17: o personagem certificado pela sala, em resposta a `pedirCertificado` (null: ficha de treino). */
  aoCertificado: ((c: Certificado | null) => void) | null = null;
  /** Marco 29 (D-128): os avisos do Mundo (o lugar, o save, o portal, a troca de sala). */
  aoMundo: ((aviso: AvisoDoMundo) => void) | null = null;
  /** Recusas de entrada (sala cheia, personagem inválido...), para a tela explicar. */
  erro: string | null = null;
  /** Marco 15: os campos da ficha que a sala ajustou na entrada. */
  previaAlteracoes: string[] = [];

  private seq = 0;
  private pendentes: ComandoEmpacotado[] = [];
  private readonly historico = new Map<number, PontoVisual>();
  private alvoTickLocal = 0;
  private direcaoMantida: Comando | null = null;
  private ticksDesdeEstado = 0;
  private proximoPingId = 1;
  private deslocamento: PontoVisual = { x: 0, y: 0 };
  private readonly descarte: EventoSimulacao[] = [];

  constructor(private readonly o: OpcoesCliente) {
    this.aoEventos = o.aoEventos ?? null;
    this.ctx = o.ctx;
    o.transporte.aoReceber((texto) => {
      this.receber(JSON.parse(texto) as MensagemServidor);
    });
  }

  entrar(): void {
    this.o.transporte.enviar(JSON.stringify({ t: 'entrar', nome: this.o.nome, pedidoFicha: this.o.pedidoFicha, versaoConteudo: versaoDoConteudo() }));
    this.ping();
  }

  get conectado(): boolean {
    return this.previsto !== null;
  }

  /** Intenção do jogador: vai para a fila de pendentes e para o servidor. */
  enviarComando(cmd: Comando): void {
    if (!this.sessaoId) return;
    const pacote: ComandoEmpacotado = { sessaoId: this.sessaoId, epocaSala: this.epoca, seq: ++this.seq, tickCliente: this.tickLocal, cmd };
    this.pendentes.push(pacote);
    if (cmd.t === 'mover') this.direcaoMantida = cmd.dir === 'parado' ? null : cmd;
    this.o.transporte.enviar(JSON.stringify({ t: 'cmd', pacote }));
  }

  /** Marco 17: pede à sala o personagem como está agora, certificado (resposta em `aoCertificado`). */
  pedirCertificado(): void {
    this.o.transporte.enviar(JSON.stringify({ t: 'pedirCertificado' }));
  }

  /** Marco 29 (D-128): viajar pelo portal do Mundo até a vila descoberta. */
  viajar(destino: string, pagamento: 'ouro' | 'pergaminho'): void {
    this.o.transporte.enviar(JSON.stringify({ t: 'viajar', destino, pagamento }));
  }

  private ping(): void {
    this.o.transporte.enviar(JSON.stringify({ t: 'ping', id: this.proximoPingId++, enviadoMs: this.o.agoraMs() }));
  }

  private receber(msg: MensagemServidor): void {
    switch (msg.t) {
      case 'bemVindo':
        this.sessaoId = msg.sessaoId;
        this.entidadeId = msg.entidadeId;
        this.previaAlteracoes = msg.previa.alteracoes.map((a) => a.campo);
        this.epoca = msg.epocaSala;
        this.adotarBase(msg.tick, msg.estado);
        this.tickLocal = msg.tick + MARGEM_TICKS;
        this.alvoTickLocal = this.tickLocal;
        this.previsto = clonarEstado(msg.estado);
        this.reaplicar();
        break;
      case 'novaFase': {
        this.armadilhasProprias = null;
        // Mundo novo, relógio novo: nada da fase anterior vale (pendentes, histórico, interpolação).
        const ctx = this.o.contextoDe?.(msg.faseRef);
        if (ctx) this.ctx = ctx;
        this.epoca = msg.epocaSala;
        this.pendentes = [];
        this.historico.clear();
        this.remotos.limpar();
        this.aguardandoCompleto = false;
        this.deslocamento = { x: 0, y: 0 };
        this.adotarBase(msg.tick, msg.estado);
        this.tickLocal = msg.tick + MARGEM_TICKS;
        this.alvoTickLocal = this.tickLocal;
        this.previsto = clonarEstado(msg.estado);
        this.reaplicar();
        this.aoNovaFase?.(msg);
        break;
      }
      case 'privado':
        this.armadilhasProprias = msg.armadilhas ?? null;
        this.bolsaPropria = msg.bolsa;
        this.anfitriao = msg.anfitriao;
        this.anfitriaoId = msg.anfitriaoId;
        this.porBolsa();
        this.aoPrivado?.();
        break;
      case 'fimDaCampanha':
        this.aoFimDaCampanha?.();
        break;
      case 'certificado':
        this.aoCertificado?.(msg.certificado);
        break;
      case 'mundo':
        this.aoMundo?.(msg.aviso);
        break;
      case 'estado':
        if (msg.epocaSala !== this.epoca) return;
        this.aguardandoCompleto = false;
        this.reconciliar(msg.tick, msg.ackSeq, msg.estado);
        break;
      case 'patch':
        if (msg.epocaSala !== this.epoca || this.aguardandoCompleto) return;
        // Furo na sequência (mensagem perdida ou base diferente): pede o estado completo.
        if (!this.base || this.baseTick !== msg.patch.base) {
          this.aguardandoCompleto = true;
          this.ressincronizacoes++;
          this.o.transporte.enviar(JSON.stringify({ t: 'ressincronizar' }));
          return;
        }
        this.reconciliar(msg.tick, msg.ackSeq, aplicarPatch(this.base, msg.patch));
        break;
      case 'eventos':
        this.aoEventos?.(msg.eventos);
        break;
      case 'pong': {
        const amostra = this.o.agoraMs() - msg.enviadoMs;
        this.rttMs = this.rttMs === 0 ? amostra : this.rttMs * 0.8 + amostra * 0.2;
        break;
      }
      case 'rejeitado':
        this.rejeitados++;
        this.motivosRejeicao[msg.motivo] = (this.motivosRejeicao[msg.motivo] ?? 0) + 1;
        break;
      case 'erro':
        this.erro = msg.motivo;
        break;
    }
  }

  private adotarBase(tick: number, estado: EstadoJogo): void {
    this.base = estado;
    this.baseTick = tick;
    this.remotos.registrar(tick, estado);
    this.ticksDesdeEstado = 0;
    // O cliente mira ficar RTT + margem à frente do servidor (D-033).
    this.alvoTickLocal = tick + Math.ceil(this.rttMs / DT_MS) + MARGEM_TICKS;
  }

  /** Reconciliação contínua (§3.6): base autoritativa + reaplicação dos pendentes. */
  private reconciliar(tick: number, ackSeq: number, estado: EstadoJogo): void {
    const antes = this.posicaoPropria();
    this.adotarBase(tick, estado);
    this.pendentes = this.pendentes.filter((p) => p.seq > ackSeq);

    const id = this.entidadeId;
    const autoritativa = id ? buscarEntidade(estado, id) : undefined;
    const prevista = this.historico.get(tick);
    if (autoritativa && prevista) {
      const real = posicaoNoPasso(autoritativa);
      this.erros.push(Math.hypot(real.x - prevista.x, real.y - prevista.y));
    }

    this.previsto = clonarEstado(estado);
    this.reaplicar();
    const depois = this.posicaoPropria();
    if (antes && depois) {
      // Correção lógica imediata; a apresentação converge (ou reposiciona se o salto é grande).
      const dx = this.deslocamento.x + antes.x - depois.x;
      const dy = this.deslocamento.y + antes.y - depois.y;
      this.deslocamento = Math.abs(dx) + Math.abs(dy) > LIMITE_REPOSICIONAR ? { x: 0, y: 0 } : { x: dx, y: dy };
    }
  }

  /** Reaplica os pendentes da base até o tick local, só para a própria entidade. */
  private reaplicar(): void {
    if (!this.previsto) return;
    this.previsto.tick = this.baseTick;
    while (this.previsto.tick < this.tickLocal) this.preverTick();
    this.porBolsa();
  }

  /** O estado público vem sem bolsas: a própria volta pelo canal privado (só no cooperativo). */
  private porBolsa(): void {
    if (this.previsto && this.armadilhasProprias) this.previsto.armadilhas = this.armadilhasProprias.map((a) => ({ ...a, reveladaPara: [...a.reveladaPara] }));
    const id = this.entidadeId;
    const e = this.bolsaPropria && this.previsto && id ? buscarEntidade(this.previsto, id) : undefined;
    if (e) e.bolsa = this.bolsaPropria;
  }

  private preverTick(): void {
    const estado = this.previsto;
    const id = this.entidadeId;
    if (!estado || !id) return;
    const e = buscarEntidade(estado, id);
    if (e) {
      const k = estado.tick;
      // Pendentes atrasados (tick já passado na base) entram no primeiro tick reaplicado.
      for (const p of this.pendentes) {
        if (p.tickCliente !== k && !(k === this.baseTick && p.tickCliente < k)) continue;
        if (p.cmd.t === 'mover') definirDirecao(e, p.cmd.dir, p.cmd.dx, p.cmd.dy);
        else if (p.cmd.t === 'irPara') planejarIrPara(e, { x: p.cmd.x, y: p.cmd.y }, this.ctx, k, this.descarte);
      }
      this.descarte.length = 0;
      if (!e.morto) integrarEntidade(e, estado, this.ctx, this.descarte, DT_MS);
      this.descarte.length = 0;
    }
    estado.tick++;
    const pos = e ? posicaoNoPasso(e) : null;
    if (pos) this.historico.set(estado.tick, pos);
    this.historico.delete(estado.tick - MAX_HISTORICO);
  }

  /** Um quadro de 60 Hz do cliente: avança a predição, renova o movimento mantido e mede o RTT. */
  passo(): void {
    if (!this.previsto) return;
    this.ticksDesdeEstado++;
    this.alvoTickLocal++;
    // Ajuste fino do relógio: no máximo 1 tick a mais ou a menos por quadro.
    const diferenca = this.alvoTickLocal - this.tickLocal;
    const passos = diferenca > 1 ? 2 : diferenca < -1 ? 0 : 1;
    for (let i = 0; i < passos; i++) {
      if (this.direcaoMantida && this.tickLocal % RENOVACAO_MOVIMENTO_TICKS === 0) this.enviarComando(this.direcaoMantida);
      this.tickLocal++;
      this.preverTick();
    }
    if (this.tickLocal % INTERVALO_PING_TICKS === 0) this.ping();
    const decaimento = Math.exp(-DT_MS / SUAVIZACAO_MS);
    this.deslocamento = { x: this.deslocamento.x * decaimento, y: this.deslocamento.y * decaimento };
  }

  posicaoPropria(): PontoVisual | null {
    const e = this.previsto && this.entidadeId ? buscarEntidade(this.previsto, this.entidadeId) : undefined;
    return e ? posicaoNoPasso(e) : null;
  }

  /** Posição a desenhar para o próprio jogador: prevista + correção suavizada. */
  posicaoVisualPropria(): PontoVisual | null {
    const p = this.posicaoPropria();
    return p ? { x: p.x + this.deslocamento.x, y: p.y + this.deslocamento.y } : null;
  }

  /** Posição a desenhar para os outros: interpolada ~100 ms atrás do último estado. */
  posicaoRemota(id: string): PontoVisual | null {
    return this.remotos.posicao(id, this.baseTick + this.ticksDesdeEstado - ATRASO_REMOTOS_TICKS);
  }
}
