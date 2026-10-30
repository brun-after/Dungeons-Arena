// O mercado do Mundo (marco 30, 30/10/2026, D-129): um quadro de anúncios que vale para o reino todo (todas as
// vilas e salas). O vendedor deixa o item no mercado e paga a taxa de anúncio; quem compra paga o preço; o vendedor
// recebe o preço menos a taxa de venda no banco, quando passa num quadro de mercado ("receber"). As duas taxas tiram
// ouro da economia. O anúncio vence em `mundo.mercado.duracaoH` e o item volta ao vendedor no "receber", como o
// cancelado. Os anúncios ficam no servidor (server/mercado-mundo.ts); aqui, os tipos e as contas. Puro.

import type { Balance } from '../core/contexto';
import type { ItemNaMochila } from '../entities/entidade';
import type { AnuncioVisto } from './avisos';

export type EstadoDoAnuncio = 'aberto' | 'vendido' | 'cancelado' | 'recebido';

export interface Anuncio {
  id: string;
  /** A identidade do vendedor (conta#slot): nunca vai para os clientes. */
  vendedor: string;
  vendedorNome: string;
  item: ItemNaMochila;
  preco: number;
  /** O que o vendedor recebe (o preço menos a taxa de venda). */
  liquido: number;
  criadoEm: number;
  expiraEm: number;
  estado: EstadoDoAnuncio;
}

type RegrasDoMercado = Balance['mundo']['mercado'];

export const taxaDeAnuncio = (preco: number, r: RegrasDoMercado): number => Math.max(1, Math.ceil((preco * r.taxaAnuncioPct) / 100));

export const liquidoDaVenda = (preco: number, r: RegrasDoMercado): number => preco - Math.floor((preco * r.taxaVendaPct) / 100);

/** Aberto e dentro da validade: aparece no quadro e pode ser comprado. */
export const anuncioAtivo = (a: Anuncio, agora: number): boolean => a.estado === 'aberto' && a.expiraEm > agora;

/** O que o vendedor tem a receber: o ouro dos vendidos e os itens dos cancelados e dos vencidos. */
export function aReceber(a: Anuncio, agora: number): boolean {
  return a.estado === 'vendido' || a.estado === 'cancelado' || (a.estado === 'aberto' && a.expiraEm <= agora);
}

export function anuncioVisto(a: Anuncio, meu: boolean): AnuncioVisto {
  return {
    id: a.id,
    itemId: a.item.itemId,
    qtd: a.item.qtd,
    preco: a.preco,
    vendedor: a.vendedorNome,
    expiraEm: a.expiraEm,
    ...(meu && { vendido: a.estado === 'vendido' }),
  };
}

/** A busca do quadro: pelo id do item ou pelo nome (sem caixa nem acento), contida. */
export function casaBusca(a: Anuncio, busca: string, nomeDoItem: string): boolean {
  if (busca.trim() === '') return true;
  const normal = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  const b = normal(busca.trim());
  return normal(a.item.itemId).includes(b) || normal(nomeDoItem).includes(b);
}
