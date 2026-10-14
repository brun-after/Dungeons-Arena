// Catálogo de itens (§2.10), lido e validado de src/data/itens.json. Marco 6 (13/10/2026):
// equipamento com bônus de atributo (absoluto ou percentual) e de defesa, e consumíveis com os
// efeitos `curar` e `restaurarMana`. O registro completo de efeitos entra no 8A.

import type { Catalogo } from '../combat/habilidades';
import { ehObjeto, Leitor, type Objeto } from '../core/validar';
import { ATRIBUTOS_NEUTROS, type Atributos } from '../entities/entidade';
import { RARIDADES, SLOTS_DE_EQUIPAMENTO, type Raridade, type Slot } from '../modos/modo';

export type NomeAtributo = keyof Atributos;
export const NOMES_ATRIBUTOS = Object.keys(ATRIBUTOS_NEUTROS) as NomeAtributo[];

export type TipoItem = 'equipamento' | 'consumivel';

export interface Bonus {
  modo: 'abs' | 'pct';
  valor: number;
}

export interface EfeitoItem {
  tipo: 'curar' | 'restaurarMana';
  valor: number;
  modo: 'abs' | 'pct';
}

export interface Item {
  id: string;
  nome: string;
  tipo: TipoItem;
  descricao: string;
  icone: string;
  raridade: Raridade;
  valorBase: number;
  /** Slot em que o equipamento entra; null para consumíveis. */
  slotPadrao: Slot | null;
  nivelMinimo: number;
  bonusAtributos: Partial<Record<NomeAtributo, Bonus>>;
  bonusDefesa: number;
  efeitos: EfeitoItem[];
  dropavel: boolean;
}

function lerBonus(l: Leitor, o: Objeto): Partial<Record<NomeAtributo, Bonus>> {
  const bonus: Partial<Record<NomeAtributo, Bonus>> = {};
  const fonte = l.objeto(o.bonusAtributos, 'bonusAtributos');
  for (const [chave, v] of Object.entries(fonte)) {
    if (!(NOMES_ATRIBUTOS as string[]).includes(chave)) {
      l.erro(`bonusAtributos: atributo desconhecido "${chave}"`);
      continue;
    }
    const nome = chave as NomeAtributo;
    if (typeof v === 'number' && Number.isInteger(v)) bonus[nome] = { modo: 'abs', valor: v };
    else if (ehObjeto(v) && v.modo === 'pct') bonus[nome] = { modo: 'pct', valor: l.numero(v, 'valor', { min: -100, max: 1000 }) };
    else l.erro(`bonusAtributos.${chave} precisa ser inteiro ou { "modo": "pct", "valor": n }`);
  }
  return bonus;
}

function lerEfeitos(l: Leitor, o: Objeto): EfeitoItem[] {
  return l.lista(o, 'efeitos').map((item) => {
    const e = l.objeto(item, 'efeito');
    return {
      tipo: l.opcao(e, 'tipo', ['curar', 'restaurarMana'] as const),
      valor: l.numero(e, 'valor', { min: 1 }),
      modo: l.opcao(e, 'modo', ['abs', 'pct'] as const),
    };
  });
}

export function lerItens(json: unknown): { itens: Map<string, Item>; erros: string[] } {
  const raiz = new Leitor('itens.json');
  const lista = raiz.lista(raiz.objeto(json, 'raiz'), 'itens');
  const erros = [...raiz.erros];
  const itens = new Map<string, Item>();
  for (const bruto of lista) {
    const l = new Leitor(`item ${ehObjeto(bruto) && typeof bruto.id === 'string' ? bruto.id : '?'}`);
    const o = l.objeto(bruto, 'item');
    const tipo = l.opcao(o, 'tipo', ['equipamento', 'consumivel'] as const);
    const item: Item = {
      id: l.texto(o, 'id'),
      nome: l.texto(o, 'nome'),
      tipo,
      descricao: l.texto(o, 'descricao'),
      icone: l.texto(o, 'icone'),
      raridade: l.opcao(o, 'raridade', RARIDADES),
      valorBase: l.numero(o, 'valorBase', { min: 0, inteiro: true }),
      slotPadrao: o.slotPadrao === null ? null : l.opcao(o, 'slotPadrao', SLOTS_DE_EQUIPAMENTO),
      nivelMinimo: l.numero(o, 'nivelMinimo', { min: 1, max: 20, inteiro: true }),
      bonusAtributos: lerBonus(l, o),
      bonusDefesa: l.numero(o, 'bonusDefesa', { min: -20, max: 50, inteiro: true }),
      efeitos: lerEfeitos(l, o),
      dropavel: l.booleano(o, 'dropavel'),
    };
    if (tipo === 'equipamento' && item.slotPadrao === null) l.erro('equipamento precisa de slotPadrao');
    if (tipo === 'consumivel' && item.slotPadrao !== null) l.erro('consumível não tem slotPadrao');
    if (tipo === 'consumivel' && item.efeitos.length === 0) l.erro('consumível precisa de ao menos um efeito');
    if (itens.has(item.id)) l.erro('id repetido');
    erros.push(...l.erros);
    itens.set(item.id, item);
  }
  return { itens, erros };
}

/** Itens que podem cair de uma raridade, na ordem do catálogo (determinística). */
export function dropaveisDe(itens: Catalogo<Item>, raridade: Raridade): Item[] {
  return [...itens.values()].filter((i) => i.dropavel && i.raridade === raridade);
}
