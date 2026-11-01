// 01/11/2026: mortos com reservas mostram o menor saldo; outras invocações mantêm o prazo.

import type { DadosInvocacao } from '../entities/entidade';
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
