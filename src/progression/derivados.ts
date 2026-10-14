// Equipamento derivado (§2.10, v4.0). Marco 6 (13/10/2026). Para cada atributo:
//   efetivo = clamp(round((base + Σ fixos) × (1 + Σ percentuais / 100)), mínimo, máximo)
// Percentuais somam entre si, sem compor; arredonda uma vez, no final. A ficha é sempre
// recalculada da base: a ordem de equipar não muda o resultado e não há deltas guardados.

import type { Catalogo } from '../combat/habilidades';
import type { ContextoSimulacao } from '../core/contexto';
import type { Atributos, Bolsa, Entidade } from '../entities/entidade';
import { hpMaximo, manaMaxima } from './ficha';
import { NOMES_ATRIBUTOS, type Item } from './itens';

export interface FichaDerivada {
  atributos: Atributos;
  defesa: number;
  hpMax: number;
  manaMax: number;
}

const limitar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function itensEquipados(bolsa: Bolsa, itens: Catalogo<Item>): Item[] {
  const lista: Item[] = [];
  for (const entrada of Object.values(bolsa.equipamento)) {
    const item = entrada ? itens.get(entrada.itemId) : undefined;
    if (item) lista.push(item);
  }
  return lista;
}

/** Ficha efetiva de quem tem `bolsa`, só a partir da base, do nível e do equipamento. */
export function derivarFicha(bolsa: Bolsa, nivel: number, ctx: ContextoSimulacao): FichaDerivada {
  const { balance } = ctx;
  const equipados = itensEquipados(bolsa, ctx.conteudo.itens);
  const atributos = { ...bolsa.atributosBase };
  for (const nome of NOMES_ATRIBUTOS) {
    let fixos = 0;
    let pct = 0;
    for (const item of equipados) {
      const b = item.bonusAtributos[nome];
      if (!b) continue;
      if (b.modo === 'abs') fixos += b.valor;
      else pct += b.valor;
    }
    atributos[nome] = limitar(
      Math.round((bolsa.atributosBase[nome] + fixos) * (1 + pct / 100)),
      balance.atributos.minimo,
      balance.atributos.maximo,
    );
  }
  const defesa = Math.max(0, bolsa.defesaBase + equipados.reduce((s, i) => s + i.bonusDefesa, 0));
  const hpBase = bolsa.hpBase + (nivel - 1) * balance.xp.hpPorNivel;
  return {
    atributos,
    defesa,
    hpMax: hpMaximo(hpBase, atributos.constituicao, balance.hp.hpAtributoMult, balance.hp.dificuldadeMult),
    manaMax: manaMaxima(atributos.sabedoria),
  };
}

/** Reaplica a ficha derivada na entidade. HP e mana atuais só são cortados no novo máximo. */
export function recalcularFicha(e: Entidade, ctx: ContextoSimulacao): void {
  if (!e.bolsa) return;
  const f = derivarFicha(e.bolsa, e.nivel, ctx);
  e.atributos = f.atributos;
  e.defesa = f.defesa;
  e.hpMax = f.hpMax;
  e.manaMax = f.manaMax;
  e.hp = Math.min(e.hp, e.hpMax);
  e.mana = Math.min(e.mana, e.manaMax);
}
