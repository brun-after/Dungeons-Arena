// Crítico pelo d20 (§2.7). A tabela vem do balance.json; Carisma dá chance de converter a
// rolagem em 20: cada ponto acima do neutro acumula 1% + i × 0,5%.

import { aleatorio, inteiro, type EstadoRng } from '../core/rng';

export interface FaixaCritico {
  /** Maior rolagem da faixa, inclusiva. */
  ate: number;
  mult: number;
}

export function multiplicadorD20(d20: number, tabela: readonly FaixaCritico[]): number {
  for (const faixa of tabela) if (d20 <= faixa.ate) return faixa.mult;
  return 1;
}

export function chanceDeVinte(carisma: number, neutro: number): number {
  let chance = 0;
  for (let i = 1; i <= carisma - neutro; i++) chance += 0.01 + i * 0.005;
  return Math.min(1, chance);
}

export function rolarD20(rng: EstadoRng, carisma: number, neutro: number): number {
  const d20 = inteiro(rng, 1, 20);
  if (d20 === 20 || carisma <= neutro) return d20;
  return aleatorio(rng) < chanceDeVinte(carisma, neutro) ? 20 : d20;
}
