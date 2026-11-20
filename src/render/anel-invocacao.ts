// 01/11/2026: mortos com reservas mostram o menor saldo; outras invocações mantêm o prazo.

import type { Graphics } from 'pixi.js';
import type { DadosInvocacao, EstadoFera } from '../entities/entidade';
import { misturarCor } from './decoracao';

export const COR_ANEL_NECROMANTE = 0x8e44ad;
/** Prazo acima disto é "permanente" (o servo expira em Number.MAX_SAFE_INTEGER). */
const PERMANENTE_TICKS = 1_000_000_000;

export interface AnelDaInvocacao {
  /** Fração do círculo que ainda resta (1 = inteiro). */
  fracao: number;
  cor: number;
  alpha: number;
}

export function anelDaInvocacao(inv: Pick<DadosInvocacao, 'criadoTick' | 'expiraTick' | 'ataquesRestantes' | 'ataquesTotal' | 'resistenciaRestante' | 'resistenciaTotal'>, tick: number): AnelDaInvocacao {
  const total = inv.expiraTick - inv.criadoTick;
  const reserva = inv.ataquesTotal && inv.resistenciaTotal ? Math.min((inv.ataquesRestantes ?? 0) / inv.ataquesTotal, (inv.resistenciaRestante ?? 0) / inv.resistenciaTotal) : undefined;
  if (reserva === undefined && (inv.expiraTick >= PERMANENTE_TICKS || total <= 0)) return { fracao: 1, cor: COR_ANEL_NECROMANTE, alpha: 0.95 };
  const fracao = Math.max(0, Math.min(1, reserva ?? ((inv.expiraTick - tick) / total)));
  // No último terço, de roxo a branco e de 0,95 a 0,25 de opacidade.
  const fim = fracao < 1 / 3 ? 1 - fracao * 3 : 0;
  return { fracao, cor: misturarCor(COR_ANEL_NECROMANTE, 0xffffff, fim), alpha: 0.95 - 0.7 * fim };
}

/**
 * D-188 (19/11/2026): o anel preto do fôlego da fera do Aventureiro, que esvazia como o dos mortos do Necromante; o
 * contorno claro o separa do chão escuro. Cansada, o anel vira um tracejado cinza (descansando). `k`, o achatamento.
 */
export function desenharFolego(g: Graphics, r: number, k: number, fera: EstadoFera | undefined): void {
  const inicio = -Math.PI / 2;
  const cansada = fera?.cansado === true;
  const fracao = cansada ? 0 : (fera?.energia ?? 100) / 100;
  g.ellipse(0, 0, r, r * k).stroke({ width: 5, color: 0xd8d2c4, alpha: 0.18 });
  if (fracao >= 0.999) g.ellipse(0, 0, r, r * k).stroke({ width: 3, color: 0x000000, alpha: 0.92 });
  else if (fracao > 0) arcoNaElipse(g, r, k, fracao).stroke({ width: 3, color: 0x000000, alpha: 0.92 });
  if (!cansada) return;
  for (let i = 0; i < 12; i += 2) {
    const a0 = inicio + (i * Math.PI) / 6;
    g.moveTo(Math.cos(a0) * r, Math.sin(a0) * r * k).lineTo(Math.cos(a0 + Math.PI / 8) * r, Math.sin(a0 + Math.PI / 8) * r * k).stroke({ width: 2, color: 0x8a8a8a, alpha: 0.7 });
  }
}

/** O arco na elipse do chão (achatada por `k` no isométrico), do topo, ponto a ponto; quem chama dá o traço. */
export function arcoNaElipse(g: Graphics, r: number, k: number, fracao: number): Graphics {
  const passos = Math.max(2, Math.ceil(48 * fracao));
  for (let i = 0; i <= passos; i++) {
    const ang = -Math.PI / 2 + Math.PI * 2 * fracao * (i / passos);
    if (i === 0) g.moveTo(Math.cos(ang) * r, Math.sin(ang) * r * k);
    else g.lineTo(Math.cos(ang) * r, Math.sin(ang) * r * k);
  }
  return g;
}
