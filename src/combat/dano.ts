// Cálculo de dano (§2.7), passos 4 a 9:
//   rolagem × (Força e Inteligência, meio a meio) -> + atributo -> crítico (d20) -> − defesa plana -> buffs de saída ->
//   arredonda uma vez,
//   com dano acertado ≥ 1. Falha crítica (×0) e imunidade dão zero e nunca viram dano 1.
// Bloqueios, alvo e área (passos 1–3) e a aplicação (passo 10) ficam em acao.ts e golpe.ts.

import type { EstadoRng } from '../core/rng';
import { multiplicadorD20, rolarD20, type FaixaCritico } from './critico';
import { rolar } from './dados';

export interface FonteDeDano {
  id: string;
  equipe: string;
  /** `floor(atributo × multiplicador)`, já calculado (§2.7, passo 5); o atributo é o da habilidade (marco 18). */
  bonusAtributo: number;
  /** Marco 18 (17/10/2026, D-068): a rolagem bruta escala com Força e Inteligência, metade de cada. */
  multRolagem: number;
  /** Marco 18 (D-068): a Inteligência fortalece os efeitos, as reações e os combos (1 = neutro). */
  potencia: number;
  /** Marco 18: o combo pode garantir um d20 mínimo (20 = crítico garantido). */
  d20Minimo?: number;
  carisma: number;
  /** Marco 8A: `bonus_dano` e `modificar_dano` do atacante, no momento do lançamento. */
  multDano: number;
  /** Marco 14: rank, caminhos e perfil multiplicam a cura da habilidade. */
  multCura: number;
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
  /** Marco 14: exposto, resistência ao elemento e sinergias (1 = neutro). */
  multRecebido?: number;
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
  const d20 = Math.max(fonte.d20Minimo ?? 0, rolarD20(rng, fonte.carisma, regras.carismaNeutro));
  const mult = multiplicadorD20(d20, regras.critico);
  const base = { rolagem, d20, mult, critico: mult > 1 };
  if (mult === 0) return { ...base, dano: 0, falha: true, imune: false };
  if (alvo.imune) return { ...base, dano: 0, falha: false, imune: true };
  const bruto = ((rolagem * fonte.multRolagem + fonte.bonusAtributo) * mult - alvo.defesa) * multiplicadorSaida * (alvo.multRecebido ?? 1);
  return { ...base, dano: Math.max(1, Math.round(bruto)), falha: false, imune: false };
}
