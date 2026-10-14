// Cálculo de dano (§2.7), passos 4 a 9:
//   rolagem → + atributo → crítico (d20) → − defesa plana → buffs de saída → arredonda uma vez,
//   com dano acertado ≥ 1. Falha crítica (×0) e imunidade dão zero e nunca viram dano 1.
// Bloqueios, alvo e área (passos 1–3) e a aplicação (passo 10) ficam em acao.ts e golpe.ts.

import type { EstadoRng } from '../core/rng';
import { multiplicadorD20, rolarD20, type FaixaCritico } from './critico';
import { rolar } from './dados';

export interface FonteDeDano {
  id: string;
  equipe: string;
  /** `floor(atributo × multiplicador)`, já calculado (§2.7, passo 5). */
  bonusAtributo: number;
  carisma: number;
  /** Marco 8A: `bonus_dano` e `modificar_dano` do atacante, no momento do lançamento. */
  multDano: number;
}

export interface RegrasDano {
  critico: readonly FaixaCritico[];
  carismaNeutro: number;
}

export interface ResultadoGolpe {
  dano: number;
  rolagem: number;
  d20: number;
  mult: number;
  /** Falha crítica (×0): sem dano e sem efeitos dependentes de acerto. */
  falha: boolean;
  critico: boolean;
  imune: boolean;
}

export interface AlvoDoGolpe {
  defesa: number;
  imune: boolean;
}

export function resolverGolpe(
  rng: EstadoRng,
  formula: string,
  fonte: FonteDeDano,
  alvo: AlvoDoGolpe,
  regras: RegrasDano,
  multiplicadorSaida = 1,
): ResultadoGolpe {
  const rolagem = rolar(rng, formula).total;
  const d20 = rolarD20(rng, fonte.carisma, regras.carismaNeutro);
  const mult = multiplicadorD20(d20, regras.critico);
  const base = { rolagem, d20, mult, critico: mult > 1 };
  if (mult === 0) return { ...base, dano: 0, falha: true, imune: false };
  if (alvo.imune) return { ...base, dano: 0, falha: false, imune: true };
  const bruto = ((rolagem + fonte.bonusAtributo) * mult - alvo.defesa) * multiplicadorSaida;
  return { ...base, dano: Math.max(1, Math.round(bruto)), falha: false, imune: false };
}
