// Loja (§2.10). Marco 9A (14/10/2026). Compra pelo `valorBase` e venda a `vendaPct`, só com a
// janela aberta (world/interacao.ts). Cada operação é uma transação no tick (§3.6): confere janela,
// estoque, saldo e espaço; só então cobra e entrega. Saldo nunca fica negativo. O estoque é
// ilimitado na v1 (D-050): a loja é o dreno de ouro, não um recurso disputado.

import { ofertasDoMundo } from '../mundo/lojas-mundo';
import { fatorDaNoite } from '../mundo/vila-noite';
import { vitrineDaLoja } from './vitrine';
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

/**
 * D-075: oferta estável inclusive em lojas de saves antigos; não consome o RNG do combate. Marco 47 (20/11/2026,
 * D-190): no fim, a vitrine de armadura gerada (progression/vitrine.ts), que renova a cada dia do Mundo.
 */
export function estoqueDaLoja(estado: EstadoJogo, ctx: ContextoSimulacao, loja: ObjetoNoMundo): string[] {
  if (!estudoAvanca(ctx.modo)) return loja.itens;
  const s = `${estado.faseId}/${loja.objetoId}/${loja.x}/${loja.y}`;
  const r = ctx.balance.progressaoItens;
  const extras = ['aceleracao_mente_comum', 'tomo_potencial'];
  if (hashTexto(`${s}/incomum`) % 100 < r.aceleracaoIncomumChancePct) extras.push('aceleracao_mente_incomum');
  if (hashTexto(`${s}/rara`) % 100 < r.aceleracaoRaraChancePct) extras.push('aceleracao_mente_rara');
  const livros = [...ctx.conteudo.itens.values()].filter((i) => i.ensina && ctx.conteudo.habilidades.get(i.ensina)?.tags.includes('expansao19'));
  livros.sort((a, b) => hashTexto(`${s}/${a.id}`) - hashTexto(`${s}/${b.id}`));
  extras.push(...livros.slice(0, 3).map((i) => i.id));
  return [...new Set([...loja.itens, ...extras, ...ofertasDoMundo(estado, ctx, loja), ...vitrineDaLoja(estado, ctx, loja)])];
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
  const preco = precoDoItem(item, e, ctx, fatorDaNoite(ctx, loja));
  if (bolsa.ouro < preco) return 'sem_ouro';
  const ref = preco === 0 && item.id === 'pergaminho_retorno' ? 'resgate_dungeon' : null;
  if (!cabeNaMochila(bolsa, item, 1, ctx.balance.inventario, ref)) return 'mochila_cheia';
  bolsa.ouro -= preco;
  guardarItem(bolsa, item, 1, ctx.balance.inventario, ref);
  if (item.progressao?.tipo === 'ponto') bolsa.tomosComprados = (bolsa.tomosComprados ?? 0) + 1;
  saida.push({ t: 'comprou', tick: estado.tick, id: e.id, itemId, preco });
  return null;
}

/**
 * Vende unidades de uma entrada da mochila (o equipado não está na mochila: não é vendável). Marco 53 (22/11/2026,
 * D-203): `qtd` unidades de uma vez (no máximo a pilha); sem ela, uma.
 */
export function vender(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, invId: string, saida: EventoSimulacao[], qtd = 1): void {
  const motivo = tentarVender(estado, ctx, e, invId, saida, qtd);
  if (motivo) recusarItem(e, motivo, estado.tick, saida);
}

function tentarVender(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, invId: string, saida: EventoSimulacao[], qtd: number): MotivoItem | null {
  const bolsa = e.bolsa;
  if (!bolsa) return 'sem_mochila';
  if (!lojaAberta(estado, e)) return 'loja_fechada';
  const indice = bolsa.mochila.findIndex((i) => i.invId === invId);
  const entrada = bolsa.mochila[indice];
  const item = entrada ? ctx.conteudo.itens.get(entrada.itemId) : undefined;
  if (!entrada || !item) return 'nao_encontrado';
  if (!vendavel(item) || entrada.ref === 'resgate_dungeon') return 'nao_vendavel';
  const unidades = Math.max(1, Math.min(entrada.qtd, Math.floor(qtd)));
  const preco = precoDeVenda(item, ctx.balance.economia.vendaPct) * unidades;
  entrada.qtd -= unidades;
  if (entrada.qtd <= 0) bolsa.mochila.splice(indice, 1);
  bolsa.ouro += preco;
  // Marco 53 (D-203): a venda fica desfazível até a loja fechar (a mesma pilha vendida de novo soma na mesma linha).
  const i = e.interacao;
  if (i?.tipo === 'loja') {
    const vendas = (i.vendas ??= []);
    const ultima = vendas[vendas.length - 1];
    if (ultima && ultima.itemId === item.id && ultima.ref === entrada.ref) {
      ultima.qtd += unidades;
      ultima.preco += preco;
    } else if (vendas.length < MAX_VENDAS_DESFAZIVEIS) vendas.push({ itemId: item.id, qtd: unidades, ref: entrada.ref, preco });
  }
  saida.push({ t: 'vendeu', tick: estado.tick, id: e.id, itemId: item.id, preco });
  return null;
}

/** Marco 53 (D-203): quantas vendas diferentes uma janela da loja guarda para desfazer. */
const MAX_VENDAS_DESFAZIVEIS = 50;

/**
 * Marco 53 (22/11/2026, D-203): desfaz uma venda desta janela da loja: o ouro volta à loja e o item à mochila. Pede o
 * ouro recebido (gastou, não desfaz) e espaço na mochila. Fechada a loja, as vendas estão feitas.
 */
export function desfazerVenda(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, indice: number, saida: EventoSimulacao[]): void {
  const motivo = tentarDesfazer(estado, ctx, e, indice, saida);
  if (motivo) recusarItem(e, motivo, estado.tick, saida);
}

function tentarDesfazer(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, indice: number, saida: EventoSimulacao[]): MotivoItem | null {
  const bolsa = e.bolsa;
  if (!bolsa) return 'sem_mochila';
  if (!lojaAberta(estado, e)) return 'loja_fechada';
  const vendas = e.interacao?.vendas;
  const venda = vendas?.[indice];
  const item = venda ? ctx.conteudo.itens.get(venda.itemId) : undefined;
  if (!vendas || !venda || !item) return 'nao_encontrado';
  if (bolsa.ouro < venda.preco) return 'sem_ouro';
  if (!cabeNaMochila(bolsa, item, venda.qtd, ctx.balance.inventario, venda.ref)) return 'mochila_cheia';
  bolsa.ouro -= venda.preco;
  guardarItem(bolsa, item, venda.qtd, ctx.balance.inventario, venda.ref);
  vendas.splice(indice, 1);
  saida.push({ t: 'vendaDesfeita', tick: estado.tick, id: e.id, itemId: item.id, preco: venda.preco });
  return null;
}
