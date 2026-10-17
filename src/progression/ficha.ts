// Ficha derivada (§2.5, §2.7, §2.12): HP máximo, mana e bônus de atributo no dano.
// HP máximo é sempre derivado de bases validadas, nunca aceito da ficha enviada (§3.7).

import type { Atributos } from '../entities/entidade';

/** `hpMax = max(1, round((hpBase + constituição × mult) × dificuldade))` (§2.5). */
export function hpMaximo(hpBase: number, constituicao: number, hpAtributoMult: number, dificuldadeMult: number): number {
  return Math.max(1, Math.round((hpBase + constituicao * hpAtributoMult) * dificuldadeMult));
}

/** `mana = max(1, round(10 × (1 + (sabedoria − 10) × 10 / 100)))` (§2.12). */
export function manaMaxima(sabedoria: number): number {
  return Math.max(1, Math.round(10 * (1 + ((sabedoria - 10) * 10) / 100)));
}

/**
 * Bônus aditivo de atributo no dano (§2.7, passo 5): `floor(atributo × multiplicador)`.
 * Marco 18 (17/10/2026, D-068): o atributo é o da habilidade (`escalaCom`; físico usa Força, mágico usa Inteligência),
 * não mais o da classe — a Destreza deixa de ser dano do arqueiro.
 */
export function bonusDeAtributo(atributos: Atributos, atributo: keyof Atributos, multiplicador: number): number {
  return Math.floor(atributos[atributo] * multiplicador);
}
