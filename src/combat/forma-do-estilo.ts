// A forma do estilo, gradual (marco 39, 12/11/2026, D-156). Substitui a forma desperta de D-152, que ligava inteira em
// 35%. Agora ela aparece a partir de 10% da ponta e cresce em 10 faixas até 100%. A faixa vem na chave da skill, como
// a da runa, e cada modificador tem a sua versão crescente. Na faixa 10, ela é igual ao modificador do equipamento:
// - ecoar: o eco repete o golpe 600 ms depois, com 5% do dano por faixa (50% na 10);
// - encadear: 1 salto (faixas 1 a 4) e 2 (da 5), com 5% do dano por faixa cada (50% na 10);
// - atravessar: o projétil passa por 1 alvo (faixas 1 a 3), 2 (4 a 6), 3 (7 a 9) e 4 (10);
// - maior e mais lenta: dano ×1,025 a ×1,25 e conjuração ×1,05 a ×1,5; o raio cresce +1 da faixa 4 em diante.
// O que o equipamento já dá vale inteiro e a forma do mesmo modificador não entra. Puro.

import type { Modificador, Saltos } from './habilidades';

export const FAIXA_MAXIMA_DA_FORMA = 10;

export interface FormaNaChave {
  mod: Modificador;
  faixa: number;
}

/** A fração da forma (0,1 a 1) pela faixa. */
export function fracaoDaForma(faixa: number): number {
  return Math.max(0, Math.min(FAIXA_MAXIMA_DA_FORMA, faixa)) / FAIXA_MAXIMA_DA_FORMA;
}

/** A faixa (0 a 10) pela intensidade da ponta: 0 antes de `inicio`, 1 em `inicio` e 10 em `plena` ou acima. */
export function faixaDaForma(intensidade: number, inicio: number, plena: number): number {
  if (intensidade + 1e-9 < inicio) return 0;
  const f = Math.min(1, Math.max(0, (intensidade - inicio) / Math.max(1e-9, plena - inicio)));
  return Math.min(FAIXA_MAXIMA_DA_FORMA, 1 + Math.floor(f * (FAIXA_MAXIMA_DA_FORMA - 1) + 1e-9));
}

export function saltosDaForma(faixa: number): Saltos {
  return { quantidade: faixa >= 5 ? 2 : 1, raio: 3, pct: 5 * Math.max(1, faixa) };
}

/** Quantos alvos o projétil atravessa antes de parar. */
export function perfuracaoDaForma(faixa: number): number {
  return Math.max(1, Math.ceil(faixa / 3));
}

export function areaDaForma(faixa: number): { raioExtra: number; conjuracaoMult: number; danoMult: number } {
  const g = fracaoDaForma(faixa);
  return { raioExtra: faixa >= 4 ? 1 : 0, conjuracaoMult: 1 + 0.5 * g, danoMult: 1 + 0.25 * g };
}

/** A fração do golpe que o eco repete. */
export function ecoDaForma(faixa: number): number {
  return 0.5 * fracaoDaForma(faixa);
}
