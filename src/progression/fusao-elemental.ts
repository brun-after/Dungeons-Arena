// A fusão elemental (marco 38, 08/11/2026, D-142): o ferreiro funde o troféu elemental de um chefe (o núcleo do
// dragão de fogo, o amuleto do necromante…) numa peça equipável. Como os itens gerados, a peça fundida nasce do id —
// `fu_<elemento>_<grau>__<id da peça>` — e o catálogo a resolve sob demanda: mochila, banco, mercado e save funcionam
// sem saber dela. Na arma, os golpes físicos aplicam o estado do elemento (chance pelo grau); nas outras peças, o
// portador resiste ao elemento (% pelo grau). Uma peça funde uma vez só. Puro.

import { ehElemento, type DefinicaoElemento, type Elemento } from '../combat/elementos';
import type { Gancho } from './ganchos';
import type { Item } from './itens';

const PREFIXO = 'fu_';
export const GRAUS_DE_FUSAO = [1, 2, 3] as const;

export interface RegrasDeFusao {
  chanceArmaPct: readonly number[];
  resistenciaPct: readonly number[];
  valorPct: readonly number[];
}

export const ehIdFundido = (id: string): boolean => id.startsWith(PREFIXO);

export function idFundido(elemento: Elemento, grau: number, id: string): string {
  return `${PREFIXO}${elemento}_${grau}__${id}`;
}

export function lerIdFundido(id: string): { elemento: Elemento; grau: number; base: string } | null {
  const m = /^fu_([a-z]+)_([1-3])__(.+)$/.exec(id);
  if (!m?.[1] || !m[2] || !m[3] || !ehElemento(m[1]) || ehIdFundido(m[3])) return null;
  return { elemento: m[1], grau: Number(m[2]), base: m[3] };
}

/** A peça aceita a fusão? (equipável e ainda não fundida). */
export const fundivel = (item: Item | undefined): item is Item => !!item && item.tipo === 'equipamento' && item.slotPadrao !== null && !ehIdFundido(item.id);

const ehArma = (item: Item): boolean => item.slotPadrao === 'arma_principal' || item.base === 'aljava' || !!item.arma;

const ROMANOS = ['I', 'II', 'III'] as const;

/** A peça fundida a partir da base (null: id fora da forma, base desconhecida ou que não funde). */
export function gerarItemFundido(id: string, base: (id: string) => Item | undefined, elementos: ReadonlyMap<Elemento, DefinicaoElemento>, r: RegrasDeFusao): Item | null {
  const p = lerIdFundido(id);
  const item = p ? base(p.base) : undefined;
  const def = p ? elementos.get(p.elemento) : undefined;
  if (!p || !fundivel(item) || !def) return null;
  const i = p.grau - 1;
  const arma = ehArma(item);
  const gancho: Gancho = arma
    ? {
        quando: 'aoAcertar',
        se: { tag: null, habilidade: null, elemento: null, tipoAtaque: 'fisico', estadoDoAlvo: null, chancePct: r.chanceArmaPct[i] ?? 10 },
        efeito: { tipo: 'aplicar', efeito: { ...def.estado }, em: 'alvo' },
      }
    : {
        quando: 'passivo',
        se: { tag: null, habilidade: null, elemento: null, tipoAtaque: null, estadoDoAlvo: null, chancePct: 100 },
        efeito: { tipo: 'passivo', passivo: { resistencias: [{ elemento: p.elemento, pct: r.resistenciaPct[i] ?? 10 }] } },
      };
  return {
    ...item,
    id,
    nome: `${item.nome} · ${p.elemento} ${ROMANOS[i] ?? ''}`,
    elemento: arma ? p.elemento : item.elemento,
    ganchos: [...item.ganchos, gancho],
    valorBase: Math.round(item.valorBase * (1 + (r.valorPct[i] ?? 0) / 100)),
  };
}

