// 20/11/2026 (D-191): o corpo que anda de frente contra o relevo escala o muro ou desce a queda num pulo curto, em vez
// de travar (as regras em world/escalada.ts). Aqui sai o começo da travessia (a célula da frente, o ponto de chegada
// e a duração) e o andamento dela a cada tick. Puro e determinístico: o cliente (predição) e o servidor chegam igual.

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { msDe, ticksDe } from '../core/tempo';
import type { Entidade } from '../entities/entidade';
import { duracaoDaSubidaMs, lentidaoDaQuedaPct, progressoDaEscalada, travessiaAPe } from './escalada';
import { passavel } from './fase';
import { alturaEm } from './relevo';
import { temTronco } from './troncos';

/** Folga além do raio para achar a célula que a frente do corpo toca. */
const FOLGA_DA_FRENTE = 0.05;
/** O passo da busca da borda da célula de chegada ao longo do rumo (células) e até onde procura. */
const PASSO_BORDA = 0.05;
const ALCANCE_BORDA = 1.5;

/** O corpo cabe em (x, y) para quem fica na altura `h0` (o relevo medido de lá). */
export type CabeNaAltura = (x: number, y: number, h0: number) => boolean;

/**
 * O passo (sx, sy) não coube: se a frente do corpo toca uma célula de chão que se escala ou se desce num pulo, começa a
 * travessia até um pouco dentro dela. Devolve se começou.
 */
export function iniciarTravessia(e: Entidade, sx: number, sy: number, estado: EstadoJogo, ctx: ContextoSimulacao, raio: number, velocidade: number, cabe: CabeNaAltura): boolean {
  const fase = ctx.fase;
  if (!fase.alturas) return false;
  const s = Math.sqrt(sx * sx + sy * sy);
  if (s < 1e-9) return false;
  const ux = sx / s;
  const uy = sy / s;
  const i0 = Math.round(e.px);
  const j0 = Math.round(e.py);
  const ci = Math.round(e.px + ux * (raio + FOLGA_DA_FRENTE));
  const cj = Math.round(e.py + uy * (raio + FOLGA_DA_FRENTE));
  if (ci === i0 && cj === j0) return false;
  // Só o chão: a árvore, a rocha e o resto do cenário seguem barrando pela célula.
  if (!passavel(fase, ci, cj) || temTronco(fase, ci, cj)) return false;
  const h0 = alturaEm(fase, e.px, e.py);
  const h1 = alturaEm(fase, ci, cj);
  const regras = ctx.balance.relevo;
  const tipo = travessiaAPe(regras, h1 - h0);
  if (tipo !== 'subir' && tipo !== 'descer') return false;
  // A borda da célula pelo rumo; o centro entra `entradaNaCelula` além dela (o corpo inteiro em cima, sem encostar
  // na borda de baixo). Se ali não cabe, o meio da célula.
  let t = 0;
  while (t <= ALCANCE_BORDA && (Math.round(e.px + ux * t) !== ci || Math.round(e.py + uy * t) !== cj)) t += PASSO_BORDA;
  if (t > ALCANCE_BORDA) return false;
  let px = e.px + ux * (t + regras.escalada.entradaNaCelula);
  let py = e.py + uy * (t + regras.escalada.entradaNaCelula);
  if (Math.round(px) !== ci || Math.round(py) !== cj || !cabe(px, py, h1)) {
    if (!cabe(ci, cj, h1)) return false;
    px = ci;
    py = cj;
  }
  const niveis = Math.abs(h1 - h0);
  let ms: number;
  if (tipo === 'subir') ms = duracaoDaSubidaMs(regras.escalada, niveis, e.atributos);
  else {
    // O pulo curto: o caminho no ar mais lento que o passo, pela altura.
    const dist = Math.hypot(px - e.px, py - e.py);
    ms = (1000 * dist) / Math.max(0.1, velocidade * (1 - lentidaoDaQuedaPct(regras, niveis) / 100));
  }
  e.escalada = { tipo, deX: e.px, deY: e.py, paraX: px, paraY: py, desdeTick: estado.tick, ateTick: estado.tick + Math.max(1, ticksDe(ms)), niveis };
  return true;
}

/**
 * O tick da travessia: o corpo segue do começo ao fim (a subida devagar no início, o pulo reto). No fim, o pulo cobra
 * o impacto (a lentidão da queda por `impactoMs`). Devolve se acabou.
 */
export function andarNaTravessia(e: Entidade, estado: EstadoJogo, ctx: ContextoSimulacao): boolean {
  const s = e.escalada;
  if (!s) return true;
  // O tick que acaba de passar conta (o integrador roda antes de o relógio avançar).
  const p = progressoDaEscalada(s, estado.tick + 1);
  // A subida: as mãos acham a borda e o corpo se ergue (devagar no começo, mais rápido no fim).
  const u = s.tipo === 'subir' ? p * p : p;
  e.px = s.deX + (s.paraX - s.deX) * u;
  e.py = s.deY + (s.paraY - s.deY) * u;
  if (p < 1) return false;
  e.px = s.paraX;
  e.py = s.paraY;
  e.escalada = null;
  if (s.tipo === 'descer') {
    const regras = ctx.balance.relevo;
    const pct = lentidaoDaQuedaPct(regras, s.niveis);
    const ate = estado.tick + ticksDe(regras.escalada.impactoMs);
    const vale = (e.recuoAteTick ?? 0) > estado.tick;
    e.recuoPct = Math.max(pct, vale ? (e.recuoPct ?? 0) : 0);
    e.recuoAteTick = Math.max(ate, vale ? (e.recuoAteTick ?? 0) : 0);
  }
  return true;
}

/** Quanto falta da travessia (ms), para a tela e os testes. */
export const faltaDaTravessiaMs = (s: { ateTick: number }, tick: number): number => msDe(Math.max(0, s.ateTick - tick));
