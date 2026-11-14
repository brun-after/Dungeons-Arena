// Marco 40 (13/11/2026, D-164): o corpo de quem usa o movimento da classe. Antes, o movimento era só o token mais rápido,
// uns pixels acima ou piscando; agora cada mecânica conta a fantasia dela no próprio corpo:
// - o Voo arcano sobe alto (passa por cima dos telhados), deitado no ar, e desce no fim;
// - o Salto de Guerra e o Salto para trás fazem o arco do pulo, com a pose de salto;
// - a Marcha corre (a animação de corrida, não o andar acelerado);
// - a Arremetida é a investida da espada, com o corpo cruzando o caminho quadro a quadro;
// - o lobo e o urso aparecem embaixo do Aventureiro montado (o companheiro igual some, porque é ele que carrega);
// - o falcão carrega o Aventureiro pelo ar no Falcão carregador;
// - a Forma de névoa some com o corpo do Necromante e dos servos (a nuvem de escuridão é de rastros-movimento.ts);
// - a tirolesa pendura o Arqueiro na corda; a camuflagem tinge e apaga o corpo;
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
  raioNevoa: number;
}

/** Alturas em px de tela. */
const ALTURA_VOO = 62;
const ALTURA_SALTO = 46;
const ALTURA_RECUO = 30;
const ALTURA_CARREGADO = 30;
const SELA = { lobo: 14, urso: 24 } as const;
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

/** O companheiro que é a montaria (o mesmo bicho) some enquanto carrega o dono. */
const MONTARIA = (pesada: boolean | undefined) => (pesada ? 'urso' : 'lobo');

export class CorpoEmMovimento {
  readonly lances = new Map<string, Lance>();
  /** O último teletransporte de cada um (a chegada se materializa). */
  readonly chegadas = new Map<string, { ms: number; de: PontoVisual; para: PontoVisual }>();
  private readonly passos = new Map<string, { x: number; y: number; ateMs: number; angulo: number }>();
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
    const desde = l ? agoraMs - l.inicioMs : Infinity;
    if (m && !e.morto) {
      mudou = true;
      switch (m.tipo) {
        case 'voo': {
          const resta = m.ateTick !== undefined ? (m.ateTick - estado.tick) * DT_MS : 1000;
          const h = ALTURA_VOO * Math.min(suave(desde / 450), suave(resta / 500));
          a.alturaPx = h + 3 * Math.sin(agoraMs / 260);
          a.estado = h > 14 ? 'voar' : null;
          a.zMais = NO_AR;
          break;
        }
        case 'salto': {
          const total = l?.para ? Math.hypot(l.para.x - l.de.x, l.para.y - l.de.y) : 1;
          const falta = m.x !== undefined && m.y !== undefined ? Math.hypot(m.x - e.px, m.y - e.py) : 0;
          const t = total > 0 ? Math.min(1, Math.max(0, 1 - falta / total)) : 1;
          a.alturaPx = 4 * ALTURA_SALTO * t * (1 - t);
          a.estado = 'saltar';
          a.zMais = NO_AR;
          break;
        }
        case 'montado': {
          a.alturaPx = m.pesada ? SELA.urso : SELA.lobo;
          a.estado = 'montar';
          a.acompanhante = { modelo: m.pesada ? 'urso_companheiro' : 'lobo_companheiro', x: pos.x, y: pos.y, alturaPx: 0, angulo, tinta: null, parado: !andando };
          break;
        }
        case 'marcha':
          a.estado = andando ? 'correr' : null;
          break;
        case 'nevoa':
          a.alfa = 1 - suave(desde / 300);
          break;
        case 'tirolesa': {
          const total = l?.corda?.total ?? 1;
          const p = Math.min(1, Math.max(0, 1 - (m.restante ?? 0) / total));
          a.alturaPx = Math.max(6, 44 - 20 * p - 22);
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
        if (e.bolsa?.classeId === 'aventureiro') {
          // O falcão agarra o Aventureiro pelos ombros e o leva no ar.
          a.alturaPx = Math.sin(Math.PI * t) * ALTURA_CARREGADO;
          a.estado = 'saltar';
          a.zMais = NO_AR;
          a.acompanhante = { modelo: 'falcao', x: pos.x, y: pos.y, alturaPx: a.alturaPx + 58, angulo, tinta: null, parado: false };
        } else a.estado = 'correr';
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

  /** O companheiro do dono montado no mesmo bicho, o falcão que carrega e os servos na névoa somem do corpo próprio. */
  private doCompanheiro(e: Entidade, estado: EstadoJogo, agoraMs: number, a: AjusteVisual): boolean {
    const inv = e.invocacao;
    if (!inv || e.morto) return false;
    const dono = buscarEntidade(estado, inv.donoId);
    const m = dono?.movimentoClasse?.modo;
    if (!dono || !m) {
      const l = dono ? this.lances.get(dono.id) : undefined;
      if (inv.companheiro && l?.tipo === 'avanco' && dono?.bolsa?.classeId === 'aventureiro' && agoraMs - l.inicioMs < l.durMs && petDoCompanheiro(e) === 'falcao') {
        a.alfa = 0;
        return true;
      }
      return false;
    }
    if (inv.companheiro && m.tipo === 'montado' && petDoCompanheiro(e) === MONTARIA(m.pesada)) {
      a.alfa = 0;
      return true;
    }
    if (m.tipo === 'nevoa' && naNevoa(e, dono, this.o.raioNevoa)) {
      a.alfa = 1 - suave((agoraMs - (this.lances.get(dono.id)?.inicioMs ?? agoraMs)) / 300);
      return true;
    }
    return false;
  }

  limpar(): void {
    this.lances.clear();
    this.chegadas.clear();
    this.passos.clear();
    this.ultimoDesloc.clear();
  }
}

/** O servo vira névoa com o dono (perto dele). */
export function naNevoa(servo: Entidade, dono: Entidade, raio: number): boolean {
  return Math.max(Math.abs(servo.x - dono.x), Math.abs(servo.y - dono.y)) <= raio;
}

/** Está dentro da névoa (o próprio Necromante ou um servo perto dele)? As auras não piscam em quem virou nuvem. */
export function viradoNevoa(e: Entidade, estado: EstadoJogo, raio: number): boolean {
  if (e.movimentoClasse?.modo?.tipo === 'nevoa') return true;
  const dono = e.invocacao ? buscarEntidade(estado, e.invocacao.donoId) : undefined;
  return !!dono && dono.movimentoClasse?.modo?.tipo === 'nevoa' && naNevoa(e, dono, raio);
}

