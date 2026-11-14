// Marco 40 (13/11/2026, D-164): o corpo de quem usa o movimento da classe. Antes, o movimento era só o token mais rápido,
// uns pixels acima ou piscando; agora cada mecânica conta a fantasia dela no próprio corpo:
// - o Voo arcano sobe alto (passa por cima dos telhados), deitado no ar, e desce no fim;
// - o Salto de Guerra e o Salto para trás fazem o arco do pulo, com a pose de salto;
// - a Marcha corre (a animação de corrida, não o andar acelerado);
// - a Arremetida é a investida da espada, com o corpo cruzando o caminho quadro a quadro;
// - o lobo e o urso aparecem embaixo do Aventureiro montado (o companheiro igual some, porque é ele que carrega);
// - o falcão carrega o Aventureiro pelo ar no Falcão carregador;
// - a Forma de névoa some com o corpo do Necromante e dos servos (a nuvem de escuridão é de rastros-movimento.ts);
// - a Chegada (D-168) balança o Arqueiro na corda, em arcos; a camuflagem tinge e apaga o corpo;
// - quem chega de um teletransporte se materializa em vez de surgir de uma vez.
// Só apresentação: lê os eventos e o estado; a simulação não muda.

import type { TipoMovimento } from '../../combat/movimento-classe';
import { petDoCompanheiro } from '../../combat/pets';
import { buscarEntidade, type EstadoJogo } from '../../core/estado';
import type { Barramento } from '../../core/events';
import type { EventosDaSimulacao } from '../../core/eventos-simulacao';
import { DT_MS } from '../../core/loop';
import type { Entidade, PontoVisual } from '../../entities/entidade';
import type { AjusteVisual } from '../sprites';

/** Um movimento em curso ou recém-feito, visto pelo desenho. */
export interface Lance {
  mov: string;
  tipo: TipoMovimento;
  inicioMs: number;
  de: PontoVisual;
  para: PontoVisual | null;
  /** Quanto dura o deslize do corpo (avanço, recuo), em ms. */
  durMs: number;
  fimMs: number | null;
  /** A tirolesa: o comprimento da corda (células) e o rumo. */
  corda?: { rumoX: number; rumoY: number; total: number };
}

export interface OpcoesCorpoMovimento {
  tipoDe: (mov: string) => TipoMovimento | null;
  /** A posição desenhada (com os deslizes). */
  posicao: (e: Entidade) => PontoVisual;
  /** Marco 40 (14/11/2026): o companheiro dono da mecânica (o falcão, o lobo, o urso do Aventureiro), ou null. */
  petDoMovimento: (mov: string) => string | null;
}

/** Alturas em px de tela. */
const ALTURA_VOO = 62;
/** O salto sobe com a distância (um pulo de 10 células passa de 90 px): um arco de verdade, não um pulinho. */
const ALTURA_SALTO_POR_CELULA = 9;
const ALTURA_SALTO_MINIMA = 40;
const ALTURA_RECUO = 30;
/** O Aventureiro levado pelo falcão voa mais baixo que o Mago, pendurado pelos ombros. */
const ALTURA_CARREGADO = 46;
/** D-168: o falcão que carrega fica do tamanho dele, com as garras nos ombros de quem leva. */
const FALCAO_CARREGANDO = { escala: 1, acimaPx: 26 } as const;
/** A altura da sela sobre o chão (o assento da pose de montar fica na altura do joelho). */
const SELA = { lobo: 18, urso: 32 } as const;
/** Muito acima de tudo: quem voa ou salta passa à frente dos telhados. */
const NO_AR = 100_000;
const MATERIALIZAR_MS = 280;
const RECUO_MS = 380;
const MS_POR_CELULA_AVANCO = 70;

const suave = (t: number) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};
export const duracaoDoAvanco = (de: PontoVisual, para: PontoVisual): number => Math.max(140, MS_POR_CELULA_AVANCO * Math.hypot(para.x - de.x, para.y - de.y));

export class CorpoEmMovimento {
  readonly lances = new Map<string, Lance>();
  /** O último teletransporte de cada um (a chegada se materializa). */
  readonly chegadas = new Map<string, { ms: number; de: PontoVisual; para: PontoVisual }>();
  private readonly passos = new Map<string, { x: number; y: number; ateMs: number; angulo: number }>();
  /**
   * 14/11/2026: a distância de cada salto, vista no primeiro quadro dele (pela simulação, não pelo evento: online o
   * evento do movimento pode não chegar, e o arco sumia).
   */
  private readonly saltos = new Map<string, { desdeTick: number; total: number }>();
  private readonly ultimoDesloc = new Map<string, { de: PontoVisual; para: PontoVisual; causa: string; tick: number }>();

  constructor(private readonly o: OpcoesCorpoMovimento) {}

  ligar(bus: Barramento<EventosDaSimulacao>, estado: () => EstadoJogo, agora: () => number): void {
    bus.on('deslocado', (ev) => {
      if (ev.origemId !== ev.id) return;
      const de = { x: ev.deX, y: ev.deY };
      const para = { x: ev.paraX, y: ev.paraY };
      this.ultimoDesloc.set(ev.id, { de, para, causa: ev.causa, tick: ev.tick });
      if (ev.causa === 'teleporte') this.chegadas.set(ev.id, { ms: agora(), de, para });
    });
    bus.on('movimentoClasse', (ev) => {
      const ms = agora();
      if (ev.fase === 'fim' || ev.fase === 'perdeu') {
        const l = this.lances.get(ev.id);
        if (l && l.fimMs === null && ev.fase === 'fim') l.fimMs = ms;
        return;
      }
      if (ev.fase !== 'inicio') return;
      const tipo = this.o.tipoDe(ev.mov);
      const e = buscarEntidade(estado(), ev.id);
      if (!tipo || !e) return;
      const d = this.ultimoDesloc.get(ev.id);
      const desloc = d && d.tick === ev.tick ? d : null;
      const de = desloc?.de ?? { x: e.px, y: e.py };
      const m = e.movimentoClasse?.modo;
      const l: Lance = { mov: ev.mov, tipo, inicioMs: ms, de, para: desloc?.para ?? (m?.x !== undefined && m.y !== undefined ? { x: m.x, y: m.y } : null), durMs: 0, fimMs: null };
      if (tipo === 'avanco' && l.para) l.durMs = duracaoDoAvanco(de, l.para);
      if (tipo === 'recuo') l.durMs = RECUO_MS;
      if (tipo === 'tirolesa' && m?.rumoX !== undefined && m.rumoY !== undefined) l.corda = { rumoX: m.rumoX, rumoY: m.rumoY, total: m.restante ?? 1 };
      this.lances.set(ev.id, l);
    });
  }

  /** Quem está se movendo agora (o atlas corre só andando) e para onde olha (a montaria vira junto). */
  private passo(e: Entidade, p: PontoVisual, agoraMs: number): { andando: boolean; angulo: number } {
    const s = this.passos.get(e.id) ?? { x: p.x, y: p.y, ateMs: 0, angulo: 0 };
    const dx = p.x - s.x;
    const dy = p.y - s.y;
    if (dx * dx + dy * dy > 1e-6) {
      s.ateMs = agoraMs + 140;
      s.angulo = Math.atan2(dy, dx);
    }
    s.x = p.x;
    s.y = p.y;
    this.passos.set(e.id, s);
    return { andando: agoraMs < s.ateMs, angulo: s.angulo };
  }

  /** O ajuste do corpo pelo movimento (null: o corpo de sempre). */
  ajuste(e: Entidade, agoraMs: number, estado: EstadoJogo): AjusteVisual | null {
    const pos = this.o.posicao(e);
    const { andando, angulo } = this.passo(e, pos, agoraMs);
    const a: AjusteVisual = { alturaPx: 0, inclina: 0, escala: 1, tinta: null, quadro: null, zMais: 0, estado: null, alfa: 1 };
    let mudou = this.doCompanheiro(e, estado, agoraMs, a);
    const m = e.movimentoClasse?.modo;
    const l = this.lances.get(e.id);
    // O tempo do modo vem da simulação (o início dele em ticks), não do evento.
    const desde = m ? (estado.tick - m.desdeTick) * DT_MS : l ? agoraMs - l.inicioMs : Infinity;
    if (m && !e.morto) {
      mudou = true;
      switch (m.tipo) {
        case 'voo': {
          // Levado pelo falcão: pendurado (a pose do salto), mais baixo; o Mago voa deitado e alto.
          const carregado = this.o.petDoMovimento(m.id) !== null;
          const h = (carregado ? ALTURA_CARREGADO : ALTURA_VOO) * subidaDoVoo(m, estado, desde);
          a.alturaPx = h + 3 * Math.sin(agoraMs / 260);
          a.estado = h > 14 ? (carregado ? 'saltar' : 'voar') : null;
          a.desdeMs = desde;
          a.zMais = NO_AR;
          break;
        }
        case 'salto': {
          const falta = m.x !== undefined && m.y !== undefined ? Math.hypot(m.x - e.px, m.y - e.py) : 0;
          let s = this.saltos.get(e.id);
          if (s?.desdeTick !== m.desdeTick) {
            // Visto pela primeira vez já no ar: a distância já percorrida volta pela velocidade do salto.
            const andou = ((estado.tick - m.desdeTick) * DT_MS * (m.velocidade ?? 16)) / 1000;
            s = { desdeTick: m.desdeTick, total: falta + Math.max(0, andou) };
            this.saltos.set(e.id, s);
          }
          const total = s.total;
          const t = total > 0 ? Math.min(1, Math.max(0, 1 - falta / total)) : 1;
          // A parábola do lançamento: a velocidade no chão é constante, então a altura é 4·H·t·(1 − t).
          const h = Math.max(ALTURA_SALTO_MINIMA, ALTURA_SALTO_POR_CELULA * total);
          a.alturaPx = 4 * h * t * (1 - t);
          // O corpo sobe inclinado para a frente e cai endireitando (o peso da queda).
          a.inclina = 0.12 * (1 - 2 * t) * (Math.cos(angulo) >= 0 ? 1 : -1);
          a.estado = 'saltar';
          a.zMais = NO_AR;
          break;
        }
        case 'montado': {
          // A montaria é o próprio companheiro (o veículo, desenhado embaixo); sem ele em campo, a figura dele.
          a.alturaPx = m.pesada ? SELA.urso : SELA.lobo;
          a.estado = 'montar';
          a.zMais = 1;
          if (!this.veiculoDe(e, estado)) a.acompanhante = { modelo: m.pesada ? 'urso_companheiro' : 'lobo_companheiro', x: pos.x, y: pos.y, alturaPx: 0, angulo, tinta: null, parado: !andando };
          break;
        }
        case 'marcha':
          a.estado = andando ? 'correr' : null;
          break;
        case 'nevoa':
          a.alfa = 1 - suave(desde / 300);
          break;
        case 'tirolesa': {
          // D-168: o balanço na corda, como quem se lança de teia em teia: desce no meio do arco e sobe nas pontas,
          // inclinado para onde vai.
          const b = balancoDaCorda(m, l?.corda?.total ?? 1);
          a.alturaPx = ALTURA_BALANCO.baixo + ALTURA_BALANCO.arco * (2 * b.u - 1) ** 2;
          a.inclina = 0.3 * (2 * b.u - 1) * (Math.cos(angulo) >= 0 ? 1 : -1);
          a.estado = 'saltar';
          a.zMais = NO_AR;
          break;
        }
        case 'camuflado':
          a.tinta = 0x8fa87a;
          break;
        default:
          break;
      }
    } else if (l && !e.morto) {
      // Os movimentos de um instante: o corpo cruza o caminho (o deslize) com a pose do movimento.
      const t = l.durMs > 0 ? desde / l.durMs : 1;
      if (t < 1 && l.tipo === 'avanco') {
        mudou = true;
        a.estado = 'correr';
      } else if (t < 1 && l.tipo === 'recuo') {
        mudou = true;
        a.alturaPx = Math.sin(Math.PI * t) * ALTURA_RECUO;
        a.estado = 'saltar';
        a.inclina = -0.12 * Math.sin(Math.PI * t);
        a.zMais = NO_AR;
      } else if (l.tipo === 'nevoa' && l.fimMs !== null && agoraMs - l.fimMs < 320) {
        // Fim da névoa: o corpo volta a se formar da escuridão.
        mudou = true;
        a.alfa = suave((agoraMs - l.fimMs) / 320);
      }
    }
    const chegada = this.chegadas.get(e.id);
    if (chegada && agoraMs - chegada.ms < MATERIALIZAR_MS) {
      mudou = true;
      const u = suave((agoraMs - chegada.ms) / MATERIALIZAR_MS);
      a.alfa = (a.alfa ?? 1) * u;
      a.escala = 0.82 + 0.18 * u;
    }
    return mudou ? a : null;
  }

  /**
   * Marco 40 (14/11/2026): o companheiro que é o veículo do dono agora (o lobo ou o urso montado, o falcão que carrega):
   * o da mecânica em curso, pelo companheiro dela.
   */
  veiculoDe(dono: Entidade, estado: EstadoJogo): Entidade | undefined {
    const m = dono.movimentoClasse?.modo;
    const pet = m && (m.tipo === 'montado' || m.tipo === 'voo') ? this.o.petDoMovimento(m.id) : null;
    if (!pet) return undefined;
    return estado.entidades.find((c) => !c.morto && c.invocacao?.companheiro && c.invocacao.donoId === dono.id && petDoCompanheiro(c) === pet);
  }

  /** O dono de quem o companheiro é o veículo agora (ele vai junto, embaixo ou em cima). */
  private carregado(e: Entidade, estado: EstadoJogo): Entidade | undefined {
    if (!e.invocacao?.companheiro || e.morto) return undefined;
    const dono = buscarEntidade(estado, e.invocacao.donoId);
    return dono && this.veiculoDe(dono, estado) === e ? dono : undefined;
  }

  /** O veículo fica na posição desenhada do dono (o lobo embaixo dele, o falcão por cima). */
  posicaoForcada(e: Entidade, estado: EstadoJogo, posicao: (x: Entidade) => PontoVisual): PontoVisual | null {
    const dono = this.carregado(e, estado);
    return dono ? posicao(dono) : null;
  }

  /** O ajuste do veículo: o lobo e o urso galopam com o dono na sela; o falcão cresce e o leva pelos ombros. */
  ajusteForcado(e: Entidade, agoraMs: number, estado: EstadoJogo): AjusteVisual | null {
    const dono = this.carregado(e, estado);
    const m = dono?.movimentoClasse?.modo;
    if (!dono || !m) return null;
    const { andando } = this.passo(e, this.o.posicao(e), agoraMs);
    const a: AjusteVisual = { alturaPx: 0, inclina: 0, escala: 1, tinta: null, quadro: null, zMais: 0, estado: null, alfa: 1 };
    if (m.tipo === 'montado') {
      a.estado = andando ? 'correr' : null;
      return a;
    }
    const h = ALTURA_CARREGADO * subidaDoVoo(m, estado, (estado.tick - m.desdeTick) * DT_MS);
    a.alturaPx = h + 3 * Math.sin(agoraMs / 260) + FALCAO_CARREGANDO.acimaPx;
    a.escala = FALCAO_CARREGANDO.escala;
    a.zMais = NO_AR + 1;
    return a;
  }

  /** Os servos na névoa somem do corpo próprio (a nuvem é deles). */
  private doCompanheiro(e: Entidade, estado: EstadoJogo, agoraMs: number, a: AjusteVisual): boolean {
    const inv = e.invocacao;
    if (!inv || e.morto) return false;
    const dono = buscarEntidade(estado, inv.donoId);
    const m = dono?.movimentoClasse?.modo;
    if (!dono || !m) return false;
    if (m.tipo === 'nevoa' && naNevoa(e, estado)) {
      a.alfa = 1 - suave((agoraMs - (this.lances.get(dono.id)?.inicioMs ?? agoraMs)) / 300);
      return true;
    }
    return false;
  }

  limpar(): void {
    this.lances.clear();
    this.chegadas.clear();
    this.passos.clear();
    this.saltos.clear();
    this.ultimoDesloc.clear();
  }
}

/** Quanto do voo já subiu: sobe em 450 ms e desce nos 500 ms finais. */
function subidaDoVoo(m: { ateTick?: number }, estado: EstadoJogo, desde: number): number {
  const resta = m.ateTick !== undefined ? (m.ateTick - estado.tick) * DT_MS : 1000;
  return Math.min(suave(desde / 450), suave(resta / 500));
}

/** O servo vai na névoa do dono (D-168: o núcleo marca quem entrou, e ele vai até o fim, longe ou perto). */
export function naNevoa(servo: Entidade, estado: EstadoJogo): boolean {
  return (servo.invocacao?.nevoaAteTick ?? 0) > estado.tick;
}

/** Está dentro da névoa (o próprio Necromante ou um servo dele)? As auras não piscam em quem virou nuvem. */
export function viradoNevoa(e: Entidade, estado: EstadoJogo): boolean {
  return e.movimentoClasse?.modo?.tipo === 'nevoa' || naNevoa(e, estado);
}

/** D-168: as alturas do balanço (px): a do meio do arco e quanto sobe nas pontas. */
const ALTURA_BALANCO = { baixo: 16, arco: 40 } as const;
/** D-168: o comprimento de cada arco do balanço (células): a corda é lançada de novo a cada um. */
export const ARCO_DO_BALANCO = 3.5;

/** Em que arco do balanço o Arqueiro está e quanto dele já fez (0 a 1), pelo que falta da corrida. */
export function balancoDaCorda(m: { restante?: number }, total: number): { arco: number; u: number; andou: number } {
  const andou = Math.max(0, total - (m.restante ?? 0));
  const arco = Math.floor(andou / ARCO_DO_BALANCO);
  return { arco, u: (andou - arco * ARCO_DO_BALANCO) / ARCO_DO_BALANCO, andou };
}

