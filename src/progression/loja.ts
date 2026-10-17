// Loja (§2.10). Marco 9A (14/10/2026). Compra pelo `valorBase` e venda a `vendaPct`, só com a
// janela aberta (world/interacao.ts). Cada operação é uma transação no tick (§3.6): confere janela,
// estoque, saldo e espaço; só então cobra e entrega. Saldo nunca fica negativo. O estoque é
// ilimitado na v1 (D-050): a loja é o dreno de ouro, não um recurso disputado.

import { precoDoItem } from './itens-progressao';
import { hashTexto } from '../core/rng';
import { estudoAvanca } from '../modos/regras';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo, ObjetoNoMundo } from '../core/estado';
import type { EventoSimulacao, MotivoItem } from '../core/eventos-simulacao';
import type { Entidade } from '../entities/entidade';
import { cabeNaMochila, guardarItem, recusarItem } from './inventario';
import { precoDeVenda, vendavel } from './itens';

/** A loja cuja janela está aberta para esta entidade, ou null. */
export function lojaAberta(estado: EstadoJogo, e: Entidade): ObjetoNoMundo | null {
  const i = e.interacao;
  if (i?.tipo !== 'loja' || estado.tick >= i.ateTick) return null;
  return estado.objetos.find((o) => o.objetoId === i.objetoId && o.tipo === 'loja') ?? null;
}

/** D-075: oferta estável inclusive em lojas de saves antigos; não consome o RNG do combate. */
export function estoqueDaLoja(estado: EstadoJogo, ctx: ContextoSimulacao, loja: ObjetoNoMundo): string[] {
  if (!estudoAvanca(ctx.modo)) return loja.itens;
  const s = `${estado.faseId}/${loja.objetoId}/${loja.x}/${loja.y}`;
  const r = ctx.balance.progressaoItens;
  const extras = ['aceleracao_mente_comum', 'tomo_potencial'];
  if (hashTexto(`${s}/incomum`) % 100 < r.aceleracaoIncomumChancePct) extras.push('aceleracao_mente_incomum');
  if (hashTexto(`${s}/rara`) % 100 < r.aceleracaoRaraChancePct) extras.push('aceleracao_mente_rara');
  return [...new Set([...loja.itens, ...extras])];
}

export function comprar(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, itemId: string, saida: EventoSimulacao[]): void {
  const motivo = tentarComprar(estado, ctx, e, itemId, saida);
  if (motivo) recusarItem(e, motivo, estado.tick, saida);
}

function tentarComprar(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, itemId: string, saida: EventoSimulacao[]): MotivoItem | null {
  const bolsa = e.bolsa;
  if (!bolsa) return 'sem_mochila';
  const loja = lojaAberta(estado, e);
  if (!loja) return 'loja_fechada';
  if (!estoqueDaLoja(estado, ctx, loja).includes(itemId)) return 'fora_do_estoque';
  const item = ctx.conteudo.itens.get(itemId);
  if (!item) return 'nao_encontrado';
  // Marco 17: o Carisma acima de 10 dá desconto.
  const preco = precoDoItem(item, e, ctx);
  if (bolsa.ouro < preco) return 'sem_ouro';
  if (!cabeNaMochila(bolsa, item, 1, ctx.balance.inventario)) return 'mochila_cheia';
  bolsa.ouro -= preco;
  guardarItem(bolsa, item, 1, ctx.balance.inventario);
  if (item.progressao?.tipo === 'ponto') bolsa.tomosComprados = (bolsa.tomosComprados ?? 0) + 1;
  saida.push({ t: 'comprou', tick: estado.tick, id: e.id, itemId, preco });
  return null;
}

/** Vende uma unidade de uma entrada da mochila (o equipado não está na mochila: não é vendável). */
export function vender(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, invId: string, saida: EventoSimulacao[]): void {
  const motivo = tentarVender(estado, ctx, e, invId, saida);
  if (motivo) recusarItem(e, motivo, estado.tick, saida);
}

function tentarVender(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, invId: string, saida: EventoSimulacao[]): MotivoItem | null {
  const bolsa = e.bolsa;
  if (!bolsa) return 'sem_mochila';
  if (!lojaAberta(estado, e)) return 'loja_fechada';
  const indice = bolsa.mochila.findIndex((i) => i.invId === invId);
  const entrada = bolsa.mochila[indice];
  const item = entrada ? ctx.conteudo.itens.get(entrada.itemId) : undefined;
  if (!entrada || !item) return 'nao_encontrado';
  if (!vendavel(item)) return 'nao_vendavel';
  const preco = precoDeVenda(item, ctx.balance.economia.vendaPct);
  entrada.qtd--;
  if (entrada.qtd <= 0) bolsa.mochila.splice(indice, 1);
  bolsa.ouro += preco;
  saida.push({ t: 'vendeu', tick: estado.tick, id: e.id, itemId: item.id, preco });
  return null;
}
