// Catálogo de itens (§2.10), lido e validado de src/data/itens.json. Marco 6 (13/10/2026):
// equipamento com bônus de atributo (absoluto ou percentual) e de defesa, e consumíveis com
// efeitos. Marco 8A: os efeitos vêm do registro (§2.8), normalizados como os das habilidades.
// Marco 9A (14/10/2026): tipo `chave` (abre baú trancado; nem equipa nem consome) e venda à loja.
// Marco 14 (14/10/2026): tipo `livro` (ensina uma habilidade; `ensina: null` é o livro raro, cujo conteúdo — uma
// habilidade gerada — vem no `ref` da entrada da mochila) e `modificadores` de habilidade no equipamento.

import { MODIFICADORES, type Catalogo, type Modificador } from '../combat/habilidades';
import { normalizarEfeitos } from '../combat/normalizar-efeito';
import type { EfeitoCanonico } from '../combat/registro-efeitos';
import { ehObjeto, Leitor, type Objeto } from '../core/validar';
import { ATRIBUTOS_NEUTROS, type Atributos } from '../entities/entidade';
import { RARIDADES, SLOTS_DE_EQUIPAMENTO, type Raridade, type Slot } from '../modos/modo';

export type NomeAtributo = keyof Atributos;
export const NOMES_ATRIBUTOS = Object.keys(ATRIBUTOS_NEUTROS) as NomeAtributo[];

export type TipoItem = 'equipamento' | 'consumivel' | 'chave' | 'livro';

/** Marco 14: modificador que o equipamento dá às habilidades com a etiqueta (null = todas). */
export interface ModificadorDeItem {
  tag: string | null;
  mod: Modificador;
}

export interface Bonus {
  modo: 'abs' | 'pct';
  valor: number;
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
  efeitos: EfeitoCanonico[];
  dropavel: boolean;
  /** Marco 14: a habilidade que o livro ensina (null no livro raro e nos outros tipos). */
  ensina: string | null;
  modificadores: ModificadorDeItem[];
}

function lerModificadores(l: Leitor, o: Objeto): ModificadorDeItem[] {
  if (o.modificadores === undefined) return [];
  return l.lista(o, 'modificadores').flatMap((v) => {
    const m = l.objeto(v, 'modificadores[]');
    const mod = l.opcao(m, 'mod', MODIFICADORES);
    return [{ tag: m.tag === undefined ? null : l.texto(m, 'tag'), mod }];
  });
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

function lerEfeitos(l: Leitor, o: Objeto): EfeitoCanonico[] {
  return normalizarEfeitos(l.lista(o, 'efeitos'), l);
}

export function lerItens(json: unknown): { itens: Map<string, Item>; erros: string[] } {
  const raiz = new Leitor('itens.json');
  const lista = raiz.lista(raiz.objeto(json, 'raiz'), 'itens');
  const erros = [...raiz.erros];
  const itens = new Map<string, Item>();
  for (const bruto of lista) {
    const l = new Leitor(`item ${ehObjeto(bruto) && typeof bruto.id === 'string' ? bruto.id : '?'}`);
    const o = l.objeto(bruto, 'item');
    const tipo = l.opcao(o, 'tipo', ['equipamento', 'consumivel', 'chave', 'livro'] as const);
    const item: Item = {
      id: l.texto(o, 'id'),
      nome: l.texto(o, 'nome'),
      tipo,
      descricao: l.texto(o, 'descricao'),
      icone: l.icone(o, 'icone'),
      raridade: l.opcao(o, 'raridade', RARIDADES),
      valorBase: l.numero(o, 'valorBase', { min: 0, inteiro: true }),
      slotPadrao: o.slotPadrao === null ? null : l.opcao(o, 'slotPadrao', SLOTS_DE_EQUIPAMENTO),
      nivelMinimo: l.numero(o, 'nivelMinimo', { min: 1, max: 20, inteiro: true }),
      bonusAtributos: lerBonus(l, o),
      bonusDefesa: l.numero(o, 'bonusDefesa', { min: -20, max: 50, inteiro: true }),
      efeitos: o.efeitos === undefined && tipo === 'livro' ? [] : lerEfeitos(l, o),
      dropavel: l.booleano(o, 'dropavel'),
      ensina: o.ensina === undefined || o.ensina === null ? null : l.texto(o, 'ensina'),
      modificadores: lerModificadores(l, o),
    };
    if (tipo === 'equipamento' && item.slotPadrao === null) l.erro('equipamento precisa de slotPadrao');
    if (tipo === 'consumivel' && item.slotPadrao !== null) l.erro('consumível não tem slotPadrao');
    if (tipo === 'consumivel' && item.efeitos.length === 0) l.erro('consumível precisa de ao menos um efeito');
    if (tipo === 'chave' && (item.slotPadrao !== null || item.efeitos.length > 0)) l.erro('chave não tem slotPadrao nem efeitos');
    if (tipo === 'livro' && (item.slotPadrao !== null || item.efeitos.length > 0)) l.erro('livro não tem slotPadrao nem efeitos');
    if (tipo !== 'livro' && item.ensina !== null) l.erro('só livro ensina');
    if (tipo !== 'equipamento' && item.modificadores.length > 0) l.erro('só equipamento dá modificadores');
    if (itens.has(item.id)) l.erro('id repetido');
    erros.push(...l.erros);
    itens.set(item.id, item);
  }
  return { itens, erros };
}

/** A loja só compra o que tem valor (marco 9A): uma chave de valor 0 não é vendável. */
export function vendavel(item: Item): boolean {
  return item.valorBase > 0;
}

/** Preço que a loja paga por uma unidade: `floor(valorBase × vendaPct / 100)`. */
export function precoDeVenda(item: Item, vendaPct: number): number {
  return Math.floor((item.valorBase * vendaPct) / 100);
}

/** Itens que podem cair de uma raridade, na ordem do catálogo (determinística). */
export function dropaveisDe(itens: Catalogo<Item>, raridade: Raridade): Item[] {
  return [...itens.values()].filter((i) => i.dropavel && i.raridade === raridade);
}

/** Marco 14: o livro raro do catálogo; o conteúdo (uma habilidade gerada) vem no `ref` (D-057). */
export const ID_LIVRO_RARO = 'livro_raro';
