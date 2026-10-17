// O que cada atributo faz além do básico (marco 17, 15/10/2026, D-063). Antes, Sabedoria só dava mana; Destreza,
// velocidade e o dano do atirador; Carisma, o d20. Agora cada ponto acima de 10 também vale (balance.atributos.efeitos):
// - Sabedoria: mais regeneração de mana por segundo (em mana inteira, distribuída pelos segundos);
// - Destreza: recarga do ataque básico menor (com teto);
// - Constituição: mais vida por célula caminhada;
// - Carisma: desconto na loja (com teto).
// Puro: quem aplica é o tick (recursos.ts, acao.ts) e a loja.
// Marco 18 (17/10/2026, D-068): Força e Inteligência dividem o multiplicador da rolagem; a Inteligência também dá a
// potência dos efeitos, reações e combos e encurta o estudo; a Destreza do arqueiro rende mais na recarga do básico.

import type { Balance, ContextoSimulacao } from '../core/contexto';
import type { Atributos, Entidade } from '../entities/entidade';
import type { PerfilDestreza } from '../entities/presets';

const acimaDe10 = (v: number) => Math.max(0, v - 10);

/** D-071 (17/10/2026): pontos ofensivos acima do patamar de ressonância, incluindo builds híbridas FOR/INT. */
export function bonusDeEspecializacao(atributos: Atributos, atributo: keyof Atributos, b: Balance): number {
  const e = b.atributos.efeitos;
  if (atributo !== 'forca' && atributo !== 'inteligencia') return 0;
  const pontos = Math.max(0, atributos.forca - e.especializacaoInicio) + Math.max(0, atributos.inteligencia - e.especializacaoInicio);
  return Math.min(e.especializacaoMax, Math.floor(pontos * e.especializacaoPorPonto));
}

/** Mana regenerada no segundo `segundo` (contado desde o tick 0): a base mais a parte inteira do bônus da Sabedoria. */
export function manaPorSegundo(atributos: Atributos, segundo: number, b: Balance): number {
  const base = b.recursos.regenManaPorSegundo;
  const bonus = (base * acimaDe10(atributos.sabedoria) * b.atributos.efeitos.regenManaPorSabedoriaPct) / 100;
  // 17/10/2026: distribui também a base fracionária, mantendo mana inteira por segundo.
  const total = base + bonus;
  return Math.floor(segundo * total) - Math.floor((segundo - 1) * total);
}

/** Marco 18 (D-068): o perfil de Destreza da classe de quem tem ficha (null = o padrão do balance). */
export function perfilDestreza(ctx: ContextoSimulacao, e: Entidade): PerfilDestreza | null {
  const classe = e.bolsa ? ctx.conteudo.classes.get(e.bolsa.classeId) : undefined;
  return classe?.destreza ?? null;
}

/** Redução da recarga do ataque básico pela Destreza, em % (até o teto; marco 18: o teto vem da classe). */
export function reducaoRecargaBasicoPct(atributos: Atributos, b: Balance, perfil?: PerfilDestreza | null): number {
  const e = b.atributos.efeitos;
  const porPonto = perfil?.recargaBasicoPorPontoPct ?? e.recargaBasicoPorDestrezaPct;
  const teto = perfil?.recargaBasicoMaxPct ?? e.recargaBasicoMaxPct;
  return Math.min(teto, acimaDe10(atributos.destreza) * porPonto);
}

/** Marco 18 (D-068): a rolagem bruta × `1 + ((FOR−10) + (INT−10)) / 2 × k` (com piso), igual para todo mundo. */
export function multiplicadorDeRolagem(atributos: Atributos, b: Balance): number {
  const e = b.atributos.efeitos;
  const pontos = (atributos.forca - 10 + (atributos.inteligencia - 10)) / 2;
  return Math.max(e.rolagemMin, 1 + (pontos * e.rolagemPorPontoPct) / 100);
}

/** Marco 18 (D-068): potência dos efeitos, reações e combos pela Inteligência (com piso e teto). */
export function potenciaDeEfeito(atributos: Atributos, b: Balance): number {
  const e = b.atributos.efeitos;
  return Math.min(e.potenciaMax, Math.max(e.potenciaMin, 1 + ((atributos.inteligencia - 10) * e.efeitoPorIntPct) / 100));
}

/** Marco 18 (D-068): redução do tempo de estudo pela Inteligência, em % (até o teto). */
export function reducaoEstudoPct(atributos: Atributos, b: Balance): number {
  const e = b.habilidades.estudo;
  return Math.min(e.reducaoMaxPct, acimaDe10(atributos.inteligencia) * e.reducaoPorIntPct);
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

/** Marco 18 (D-068): raio (células) em que a Sabedoria procura armadilhas. */
export function raioDeRevelar(atributos: Atributos, b: Balance): number {
  const a = b.armadilhas;
  return a.raioBase + Math.floor(acimaDe10(atributos.sabedoria) / Math.max(1, a.raioPorPontos));
}

/** Marco 18 (D-068): chance (%) de revelar cada armadilha no raio, por teste; abaixo de 10 de Sabedoria, menos. */
export function chanceDeRevelarPct(atributos: Atributos, b: Balance): number {
  const a = b.armadilhas;
  return Math.min(a.chanceMaxPct, Math.max(0, a.chanceBasePct + (atributos.sabedoria - 10) * a.chancePorPontoPct));
}

/** Marco 18 (D-068): chance (%) de desarmar uma armadilha revelada. */
export function chanceDeDesarmarPct(atributos: Atributos, b: Balance): number {
  const a = b.armadilhas;
  return Math.min(a.desarmeMaxPct, Math.max(5, a.desarmeBasePct + (atributos.sabedoria - 10) * a.desarmePorPontoPct));
}
