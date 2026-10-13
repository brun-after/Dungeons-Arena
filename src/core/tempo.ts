// Conversão de durações de conteúdo (ms) para ticks da simulação (§2.7: recargas e efeitos em tick).

import { DT_MS } from './loop';

/** Arredonda para cima: uma conjuração nunca fica mais curta que o telegrafado. */
export function ticksDe(ms: number): number {
  return Math.max(0, Math.ceil(ms / DT_MS - 1e-9));
}

export function msDe(ticks: number): number {
  return ticks * DT_MS;
}
