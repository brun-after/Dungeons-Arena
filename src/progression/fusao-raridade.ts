// Marco 52 (21/11/2026, D-198): os níveis de raridade da fusão. Ao transmutar, a fusão sai do 3º nível (o comum), do
// 2º ou do 1º (o mais raro). O 2º e o 1º têm uma chance base, que a Inteligência acima de 10 sobe até um teto; com
// pouca Inteligência, a chance cai à base, mas nunca a zero. O nível fica no id (`__g2`, `__g1`) e sobe o dano, a cura
// e a força dos estados (combat/fusao/fundir.ts); o visual ganha detalhe a cada nível.
// Refazer a mesma fórmula é tentar de novo: o que fica é o melhor nível entre a fusão que o personagem já tem e a nova.
// Quando o estudo da melhor termina, ela toma o lugar da antiga (o maior rank, a tecla e a compreensão). Puro.

import { formulaDaFusao, raridadeDaFusao, type RaridadeFusao } from '../combat/fusao/receita';
import type { RegrasAlquimia } from '../combat/fusao/regras';
import { aleatorio, type EstadoRng } from '../core/rng';
import type { Atributos, Bolsa } from '../entities/entidade';

/**
 * As chances (%) de cada nível para esta Inteligência e para as tentativas anteriores da mesma fórmula; somam 100.
 * Cada tentativa soma por cima da Inteligência, até o teto da tentativa (nunca abaixo do que a Inteligência já dá).
 */
export function chancesDeRaridade(r: Pick<RegrasAlquimia, 'raridade'>, atributos: Pick<Atributos, 'inteligencia'>, tentativas = 0): Record<RaridadeFusao, number> {
  const acima = Math.max(0, atributos.inteligencia - 10);
  const t = r.raridade.tentativa;
  const chance = (n: RegrasAlquimia['raridade']['primeiro'], porTentativa: number, teto: number) => {
    const pelaInt = Math.max(n.chancePct, Math.min(n.maxPct, n.chancePct + acima * n.porIntPct));
    return Math.max(pelaInt, Math.min(teto, pelaInt + Math.max(0, tentativas) * porTentativa));
  };
  const primeiro = chance(r.raridade.primeiro, t.primeiroPct, t.primeiroTetoPct);
  const segundo = Math.min(100 - primeiro, chance(r.raridade.segundo, t.segundoPct, t.segundoTetoPct));
  return { 1: primeiro, 2: segundo, 3: Math.max(0, 100 - primeiro - segundo) };
}

/** Sorteia o nível pelas chances. */
export function sortearRaridade(rng: EstadoRng, chances: Readonly<Record<RaridadeFusao, number>>): RaridadeFusao {
  const x = aleatorio(rng) * 100;
  if (x < chances[1]) return 1;
  if (x < chances[1] + chances[2]) return 2;
  return 3;
}

/** A fusão conhecida com a mesma fórmula, em qualquer nível (null = nenhuma). */
export function mesmaFormulaConhecida(bolsa: Pick<Bolsa, 'conhecidas'>, id: string): string | null {
  const formula = formulaDaFusao(id);
  if (!formula) return null;
  return bolsa.conhecidas.find((c) => c.id !== id && formulaDaFusao(c.id) === formula)?.id ?? null;
}

/** As tentativas já feitas da fórmula (pelo id, com ou sem o nível). */
export function tentativasDaFormula(bolsa: Pick<Bolsa, 'tentativasFusao'>, id: string): number {
  const f = formulaDaFusao(id);
  return f ? (bolsa.tentativasFusao?.[f] ?? 0) : 0;
}

/**
 * Quando a fusão de nível melhor termina o estudo, a antiga da mesma fórmula sai: a nova fica com o maior rank, os
 * caminhos dela, a tecla dela e a compreensão dela. Devolve o rank com que a nova entra (null = não havia antiga;
 * 'descartada' = a antiga é de nível igual ou melhor, e fica: um resultado inferior nunca toma o lugar do superior).
 */
export function substituirFusaoAntiga(bolsa: Bolsa, novoId: string, rankNovo: number): number | 'descartada' | null {
  const antigoId = mesmaFormulaConhecida(bolsa, novoId);
  const antiga = antigoId ? bolsa.conhecidas.find((c) => c.id === antigoId) : undefined;
  if (!antigoId || !antiga) return null;
  if (raridadeDaFusao(antigoId) <= raridadeDaFusao(novoId)) return 'descartada';
  const rank = Math.max(rankNovo, antiga.rank);
  const i = bolsa.conhecidas.indexOf(antiga);
  bolsa.conhecidas[i] = { id: novoId, rank, caminhos: rank === antiga.rank ? [...antiga.caminhos] : [] };
  bolsa.barra = bolsa.barra.map((b) => (b === antigoId ? novoId : b));
  if (bolsa.compreensao?.[antigoId] !== undefined) {
    const { [antigoId]: compreensao, ...resto } = bolsa.compreensao;
    bolsa.compreensao = { ...resto, [novoId]: Math.max(compreensao ?? 0, resto[novoId] ?? 0) };
  }
  return rank;
}
