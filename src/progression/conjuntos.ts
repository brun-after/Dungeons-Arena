// Conjuntos de equipamento (marco 18, 17/10/2026, D-069): peças de bases diferentes, a partir de uma forma mínima, que
// juntas dão bônus — ganchos e modificadores de habilidade — com 2 e com 3 peças (data/conjuntos.json).

import { MODIFICADORES, type Catalogo } from '../combat/habilidades';
import { Leitor } from '../core/validar';
import type { Bolsa } from '../entities/entidade';
import { lerGanchos, type Gancho } from './ganchos';
import { FORMAS_ITEM, type FormaItem } from './gerar-item-base';
import type { Item, ModificadorDeItem } from './itens';

export interface BonusDeConjunto {
  texto: string;
  ganchos: Gancho[];
  modificadores: ModificadorDeItem[];
}

export interface Conjunto {
  id: string;
  nome: string;
  /** As bases que contam (uma peça por base). */
  pecas: string[];
  formaMin: FormaItem;
  /** Bônus por número de peças. */
  bonus: Readonly<Record<number, BonusDeConjunto>>;
}

export function lerConjuntos(json: unknown): { conjuntos: Map<string, Conjunto>; erros: string[] } {
  const l = new Leitor('conjuntos.json');
  const lista = l.lista(l.objeto(json, 'raiz'), 'conjuntos');
  const conjuntos = new Map<string, Conjunto>();
  for (const bruto of lista) {
    const o = l.objeto(bruto, 'conjunto');
    const id = l.texto(o, 'id');
    const bo = l.objeto(o.bonus, `${id}.bonus`);
    const bonus: Record<number, BonusDeConjunto> = {};
    for (const [k, v] of Object.entries(bo)) {
      const n = Number(k);
      if (!Number.isInteger(n) || n < 2 || n > 6) l.erro(`${id}: número de peças inválido "${k}"`);
      const b = l.objeto(v, `${id}.bonus.${k}`);
      bonus[n] = {
        texto: l.texto(b, 'texto'),
        ganchos: lerGanchos(l, b.ganchos),
        modificadores:
          b.modificadores === undefined
            ? []
            : l.lista(b, 'modificadores').map((m) => {
                const mo = l.objeto(m, 'modificadores[]');
                return { tag: mo.tag === undefined ? null : l.texto(mo, 'tag'), mod: l.opcao(mo, 'mod', MODIFICADORES) };
              }),
      };
    }
    if (conjuntos.has(id)) l.erro(`conjunto "${id}" repetido`);
    conjuntos.set(id, { id, nome: l.texto(o, 'nome'), pecas: l.listaDeTextos(o, 'pecas'), formaMin: l.opcao(o, 'formaMin', FORMAS_ITEM), bonus });
  }
  return { conjuntos, erros: l.erros };
}

/** Quantas peças do conjunto o personagem veste (forma mínima respeitada, uma por base). */
export function pecasVestidas(conjunto: Conjunto, bolsa: Bolsa, itens: Catalogo<Item>): number {
  const bases = new Set<string>();
  for (const entrada of Object.values(bolsa.equipamento)) {
    const item = entrada ? itens.get(entrada.itemId) : undefined;
    if (!item?.base || !item.forma || !conjunto.pecas.includes(item.base)) continue;
    if (FORMAS_ITEM.indexOf(item.forma) < FORMAS_ITEM.indexOf(conjunto.formaMin)) continue;
    bases.add(item.base);
  }
  return bases.size;
}

/** Os bônus valendo: para cada conjunto, todos os degraus alcançados (2 peças, depois 3…). */
export function bonusAtivos(conjuntos: ReadonlyMap<string, Conjunto>, bolsa: Bolsa, itens: Catalogo<Item>): { conjunto: Conjunto; pecas: number; bonus: BonusDeConjunto[] }[] {
  const saida: { conjunto: Conjunto; pecas: number; bonus: BonusDeConjunto[] }[] = [];
  for (const c of conjuntos.values()) {
    const pecas = pecasVestidas(c, bolsa, itens);
    const bonus = Object.entries(c.bonus)
      .filter(([n]) => Number(n) <= pecas)
      .map(([, b]) => b);
    if (bonus.length > 0) saida.push({ conjunto: c, pecas, bonus });
  }
  return saida;
}
