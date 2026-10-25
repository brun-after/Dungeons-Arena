// O anel das invocações do Necromante (marco 25, 25/10/2026, D-103). Puro: roxo, e o arco é a contagem regressiva da
// duração (cheio ao nascer, vazio ao sumir). No último terço, mistura para o branco e apaga até quase sumir. A
// invocação permanente (o servo do ossuário) fica com o anel roxo inteiro.

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

export function anelDaInvocacao(inv: Pick<DadosInvocacao, 'criadoTick' | 'expiraTick'>, tick: number): AnelDaInvocacao {
  const total = inv.expiraTick - inv.criadoTick;
  if (inv.expiraTick >= PERMANENTE_TICKS || total <= 0) return { fracao: 1, cor: COR_ANEL_NECROMANTE, alpha: 0.95 };
  const fracao = Math.max(0, Math.min(1, (inv.expiraTick - tick) / total));
  // No último terço, de roxo a branco e de 0,95 a 0,25 de opacidade.
  const fim = fracao < 1 / 3 ? 1 - fracao * 3 : 0;
  return { fracao, cor: misturarCor(COR_ANEL_NECROMANTE, 0xffffff, fim), alpha: 0.95 - 0.7 * fim };
}
