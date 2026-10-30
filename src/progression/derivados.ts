// Equipamento derivado (§2.10, v4.0). Marco 6 (13/10/2026). Para cada atributo:
//   efetivo = clamp(round((base + Σ fixos) × (1 + Σ percentuais / 100)), mínimo, máximo)
// Percentuais somam entre si, sem compor; arredonda uma vez, no final. A ficha é sempre
// recalculada da base: a ordem de equipar não muda o resultado e não há deltas guardados.
// Marco 14 (14/10/2026): as passivas conhecidas somam vida, mana e defesa; as habilidades da entidade derivam da
// barra (habilidades-personagem.ts).

import type { Catalogo } from '../combat/habilidades';
import { passivasDaBolsa } from '../combat/perfil';
import type { ContextoSimulacao } from '../core/contexto';
import type { Atributos, Bolsa, Entidade } from '../entities/entidade';
import { basicoDoPersonagem, basicoSecundario } from './armas';
import { pontosUteis } from './efeitos-atributo';
import { hpMaximo, manaMaxima } from './ficha';
import { NOMES_ATRIBUTOS, type Item } from './itens';

export interface FichaDerivada {
  atributos: Atributos;
  defesa: number;
  hpMax: number;
  manaMax: number;
  /** Marco 28 (D-127): a soma do % de dano dos itens equipados. */
  danoPct: number;
  /** A soma do % de defesa (armaduras), aplicada sobre a defesa total. */
  defesaPct: number;
}

/**
 * Marco 28 (30/10/2026, D-127): todo equipamento tem o valor base (atributos e defesa, que param de crescer no
 * `nivelPontosMax`) e um multiplicador que cresce com o nível do item e a raridade (ou a forma):
 * `porNivelPct × nível × poder × peso do slot`. Derivado na hora, então itens e saves antigos ganham sozinhos.
 */
export function multiplicadoresDoItem(item: Pick<Item, 'tipo' | 'slotPadrao' | 'nivelMinimo' | 'raridade'>, balance: ContextoSimulacao['balance']): { danoPct: number; defesaPct: number } {
  const r = balance.itensGerados;
  if (item.tipo !== 'equipamento' || !item.slotPadrao) return { danoPct: 0, defesaPct: 0 };
  const base = Math.max(1, item.nivelMinimo) * r.multiplicador[item.raridade];
  const arred = (v: number) => Math.round(v * 10) / 10;
  return {
    danoPct: arred((base * r.danoPorNivelPct * (r.pesoPorSlot[item.slotPadrao] ?? 0)) / 100),
    defesaPct: arred((base * r.defesaPorNivelPct * (r.defesaPorSlot[item.slotPadrao] ?? 0)) / 100),
  };
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
export function derivarFicha(bolsa: Bolsa, nivel: number, ctx: Pick<ContextoSimulacao, 'balance' | 'conteudo'>): FichaDerivada {
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
  const passivas = passivasDaBolsa(ctx, bolsa);
  const soma = (f: (p: (typeof passivas)[number]) => number) => passivas.reduce((s, p) => s + f(p), 0);
  const mults = equipados.map((i) => multiplicadoresDoItem(i, balance));
  const danoPct = mults.reduce((s, m) => s + m.danoPct, 0);
  const defesaPct = mults.reduce((s, m) => s + m.defesaPct, 0);
  const defesaBruta = bolsa.defesaBase + equipados.reduce((s, i) => s + i.bonusDefesa, 0) + soma((p) => p.defesa);
  const defesa = Math.max(0, Math.round(defesaBruta * (1 + defesaPct / 100)));
  const hpBase = bolsa.hpBase + (nivel - 1) * balance.xp.hpPorNivel;
  // Marco 28 (D-127): acima de 30, a Constituição e a Sabedoria rendem menos na vida e na mana.
  const hp = hpMaximo(hpBase, pontosUteis(atributos.constituicao, balance), balance.hp.hpAtributoMult, balance.hp.dificuldadeMult);
  const mana = manaMaxima(pontosUteis(atributos.sabedoria, balance));
  return {
    atributos,
    defesa,
    hpMax: Math.max(1, Math.round(hp * (1 + soma((p) => p.hpMaxPct) / 100))),
    manaMax: Math.max(1, Math.round(mana * (1 + soma((p) => p.manaMaxPct) / 100))),
    danoPct,
    defesaPct,
  };
}

/** Reaplica a ficha derivada na entidade. HP e mana atuais só são cortados no novo máximo. */
export function recalcularFicha(e: Entidade, ctx: Pick<ContextoSimulacao, 'balance' | 'conteudo'>): void {
  if (!e.bolsa) return;
  const f = derivarFicha(e.bolsa, e.nivel, ctx);
  e.atributos = f.atributos;
  e.defesa = f.defesa;
  e.hpMax = f.hpMax;
  e.manaMax = f.manaMax;
  if (f.danoPct > 0) e.danoItensPct = f.danoPct;
  else delete e.danoItensPct;
  e.hp = Math.min(e.hp, e.hpMax);
  e.mana = Math.min(e.mana, e.manaMax);
  // Marco 14: as teclas 1–4 são as habilidades da entidade.
  e.habilidades = e.bolsa.barra.filter((id): id is string => id !== null && e.bolsa?.conhecidas.some((c) => c.id === id) === true);
  // Marco 27 (D-126): o básico vem da arma principal; o da mão secundária sai a cada 3º (progression/armas.ts).
  e.ataqueBasico = basicoDoPersonagem(ctx, e);
  const secundario = basicoSecundario(ctx, e);
  if (secundario || e.armas) {
    const a = (e.armas ??= { contador: 0, golpes: 0 });
    if (a.secundario !== (secundario ?? undefined)) a.contador = 0;
    if (secundario) a.secundario = secundario;
    else delete a.secundario;
  }
}
