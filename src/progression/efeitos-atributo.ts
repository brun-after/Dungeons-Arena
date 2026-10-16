// O que cada atributo faz além do básico (marco 17, 15/10/2026, D-063). Antes, Sabedoria só dava mana; Destreza,
// velocidade e o dano do atirador; Carisma, o d20. Agora cada ponto acima de 10 também vale (balance.atributos.efeitos):
// - Sabedoria: mais regeneração de mana por segundo (em mana inteira, distribuída pelos segundos);
// - Destreza: recarga do ataque básico menor (com teto);
// - Constituição: mais vida por célula caminhada;
// - Carisma: desconto na loja (com teto).
// Puro: quem aplica é o tick (recursos.ts, acao.ts) e a loja.

import type { Balance } from '../core/contexto';
import type { Atributos } from '../entities/entidade';

const acimaDe10 = (v: number) => Math.max(0, v - 10);

/** Mana regenerada no segundo `segundo` (contado desde o tick 0): a base mais a parte inteira do bônus da Sabedoria. */
export function manaPorSegundo(atributos: Atributos, segundo: number, b: Balance): number {
  const base = b.recursos.regenManaPorSegundo;
  const bonus = (base * acimaDe10(atributos.sabedoria) * b.atributos.efeitos.regenManaPorSabedoriaPct) / 100;
  return base + Math.floor(segundo * bonus) - Math.floor((segundo - 1) * bonus);
}

/** Redução da recarga do ataque básico pela Destreza, em % (até o teto). */
export function reducaoRecargaBasicoPct(atributos: Atributos, b: Balance): number {
  const e = b.atributos.efeitos;
  return Math.min(e.recargaBasicoMaxPct, acimaDe10(atributos.destreza) * e.recargaBasicoPorDestrezaPct);
}

/** Vida por célula caminhada, com o bônus da Constituição. */
export function vidaPorCelula(atributos: Atributos, b: Balance): number {
  const mult = 1 + (acimaDe10(atributos.constituicao) * b.atributos.efeitos.regenPorCelulaPorConstituicaoPct) / 100;
  return Math.round(b.recursos.regenHpPorCelula * mult);
}

/** Desconto na loja pelo Carisma, em % (até o teto). */
export function descontoNaLojaPct(atributos: Atributos, b: Balance): number {
  const e = b.atributos.efeitos;
  return Math.min(e.descontoMaxPct, acimaDe10(atributos.carisma) * e.descontoPorCarismaPct);
}

/** O preço de compra para quem compra (nunca menos de 1). */
export function precoDeCompra(valorBase: number, atributos: Atributos, b: Balance): number {
  return Math.max(1, Math.round(valorBase * (1 - descontoNaLojaPct(atributos, b) / 100)));
}
