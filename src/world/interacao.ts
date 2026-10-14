// Interação com baú e loja (§2.1, §2.10). Marco 9A (14/10/2026).
// `interagir` escolhe o interagível mais próximo a Chebyshev ≤ 1 e congela quem interage: o baú por
// 3 s (depois entrega o conteúdo) e a loja pela janela de 5 s (compra e venda em progression/loja.ts).
// O fim da interação é a etapa 5 do tick (congelamentos, §2.2). Fechar a loja, de qualquer jeito,
// arma a recarga dela para aquele jogador; morrer fecha e também arma (§2.12).
// Baú compartilhado tem um abridor por vez (§3.6): a reserva sai com a entrega, a morte ou a saída.

import { celulaOcupada, chebyshev } from '../combat/geometria';
import type { ContextoSimulacao } from '../core/contexto';
import { buscarEntidade, type EstadoJogo, type ObjetoNoMundo } from '../core/estado';
import type { EventoSimulacao, MotivoItem } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import type { Entidade } from '../entities/entidade';
import { processarDescanso } from '../progression/descanso';
import { guardarItem, recusarItem } from '../progression/inventario';
import { interagivel, largarItem, largarPerto } from './objetos';

/** Recarga da loja por jogador e loja, no mesmo mapa monotônico das habilidades. */
export function chaveRecargaLoja(objetoId: string, entidadeId: string): string {
  return `loja:${objetoId}:${entidadeId}`;
}

export function recargaLojaRestante(estado: EstadoJogo, objetoId: string, entidadeId: string): number {
  return Math.max(0, (estado.recargas[chaveRecargaLoja(objetoId, entidadeId)] ?? 0) - estado.tick);
}

/** Baú ainda fechado e sem ninguém abrindo; a loja está sempre disponível (a recarga é por jogador). */
function disponivel(o: ObjetoNoMundo): boolean {
  return o.tipo === 'loja' || (o.abertoTick === 0 && o.abridorId === null);
}

/** O interagível disponível mais próximo no alcance; empate pelo `objetoId` (determinístico). */
export function alvoDeInteracao(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade): ObjetoNoMundo | null {
  const origem = celulaOcupada(e);
  let melhor: ObjetoNoMundo | null = null;
  let melhorDist = Infinity;
  for (const o of estado.objetos) {
    if (!interagivel(o) || !disponivel(o)) continue;
    const d = chebyshev(origem, o);
    if (d > ctx.balance.economia.alcanceInteracao) continue;
    if (d < melhorDist || (d === melhorDist && melhor && o.objetoId < melhor.objetoId)) {
      melhor = o;
      melhorDist = d;
    }
  }
  return melhor;
}

const temItem = (e: Entidade, itemId: string): boolean => e.bolsa?.mochila.some((i) => i.itemId === itemId) ?? false;

/** Comando `interagir`: abre o baú (reserva + congelamento) ou a janela da loja. */
export function interagir(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, saida: EventoSimulacao[]): void {
  const motivo = tentarInteragir(estado, ctx, e, saida);
  if (motivo) recusarItem(e, motivo, estado.tick, saida);
}

function tentarInteragir(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, saida: EventoSimulacao[]): MotivoItem | null {
  const tick = estado.tick;
  if (!e.bolsa) return 'sem_mochila';
  if (e.interacao) return 'congelado';
  const o = alvoDeInteracao(estado, ctx, e);
  if (!o) return 'nada_perto';
  const eco = ctx.balance.economia;
  let ateTick: number;
  if (o.tipo === 'loja') {
    if (recargaLojaRestante(estado, o.objetoId, e.id) > 0) return 'em_recarga';
    ateTick = tick + ticksDe(eco.janelaLojaMs);
  } else {
    if (o.chave && !temItem(e, o.chave)) return 'trancado';
    o.abridorId = e.id;
    ateTick = tick + ticksDe(eco.bauCongelaMs);
  }
  const tipo = o.tipo === 'loja' ? 'loja' : 'bau';
  e.interacao = { tipo, objetoId: o.objetoId, ateTick };
  // Congelado: para onde está (o passo em curso termina, como no atordoamento, D-017).
  e.direcao = 'parado';
  e.caminho = [];
  e.waypoints = [];
  saida.push({ t: 'interacaoIniciada', tick, id: e.id, objetoId: o.objetoId, tipo, ateTick });
  return null;
}

/** Fecha a janela da loja e arma a recarga (fechar, acabar o tempo ou morrer, §2.10). */
export function fecharLoja(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, saida: EventoSimulacao[]): void {
  const i = e.interacao;
  if (i?.tipo !== 'loja') return;
  const recargaAteTick = estado.tick + ticksDe(ctx.balance.economia.recargaLojaMs);
  estado.recargas[chaveRecargaLoja(i.objetoId, e.id)] = recargaAteTick;
  e.interacao = null;
  saida.push({ t: 'lojaFechada', tick: estado.tick, id: e.id, objetoId: i.objetoId, recargaAteTick });
}

/** Morte ou saída: a loja fecha armando a recarga; o baú libera a reserva sem entregar. */
export function encerrarInteracao(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, saida: EventoSimulacao[]): void {
  const i = e.interacao;
  if (!i) return;
  if (i.tipo === 'loja') {
    fecharLoja(estado, ctx, e, saida);
    return;
  }
  if (i.tipo === 'descanso') {
    e.interacao = null;
    return;
  }
  const o = estado.objetos.find((x) => x.objetoId === i.objetoId);
  if (o?.abridorId === e.id) o.abridorId = null;
  e.interacao = null;
}

/**
 * Entrega do baú, como transação no tick: confere a reserva e a chave, consome a chave, guarda os
 * itens (o que não couber cai ao lado) e o ouro, e marca o baú como aberto (ele some depois).
 */
function entregarBau(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, saida: EventoSimulacao[]): void {
  const i = e.interacao;
  e.interacao = null;
  const o = i ? estado.objetos.find((x) => x.objetoId === i.objetoId) : undefined;
  const bolsa = e.bolsa;
  if (!o || o.abridorId !== e.id || !bolsa) return;
  o.abridorId = null;
  if (o.chave) {
    const indice = bolsa.mochila.findIndex((x) => x.itemId === o.chave);
    const entrada = bolsa.mochila[indice];
    if (!entrada) {
      recusarItem(e, 'trancado', estado.tick, saida);
      return;
    }
    entrada.qtd--;
    if (entrada.qtd <= 0) bolsa.mochila.splice(indice, 1);
  }
  for (const itemId of o.itens) {
    const item = ctx.conteudo.itens.get(itemId);
    if (!item) continue;
    if (!guardarItem(bolsa, item, 1, ctx.balance.inventario)) {
      largarPerto(ctx, e.x, e.y, (x, y) => largarItem(estado, itemId, x, y, saida));
    }
  }
  bolsa.ouro += o.ouro;
  saida.push({ t: 'bauAberto', tick: estado.tick, id: e.id, objetoId: o.objetoId, itens: [...o.itens], ouro: o.ouro });
  o.itens = [];
  o.ouro = 0;
  o.abertoTick = estado.tick;
}

/** Etapa 5 do tick: fim dos congelamentos, reservas órfãs e baús abertos que somem. */
export function processarInteracoes(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  for (const e of estado.entidades) {
    const i = e.interacao;
    // O descanso confere a interrupção a cada tick, não só no fim (marco 10A-2).
    if (i?.tipo === 'descanso') processarDescanso(estado, ctx, e, saida);
    if (!i || i.tipo === 'descanso' || estado.tick < i.ateTick) continue;
    if (i.tipo === 'loja') fecharLoja(estado, ctx, e, saida);
    else entregarBau(estado, ctx, e, saida);
  }
  if (!estado.objetos.some((o) => o.tipo === 'bau')) return;
  const some = ticksDe(ctx.balance.economia.bauSomeMs);
  for (const o of estado.objetos) {
    if (o.abridorId === null) continue;
    // Quem reservou saiu do mundo (arena) ou já não está abrindo: a reserva volta a ficar livre.
    const abridor = buscarEntidade(estado, o.abridorId);
    if (abridor?.interacao?.objetoId !== o.objetoId) o.abridorId = null;
  }
  estado.objetos = estado.objetos.filter((o) => o.tipo !== 'bau' || o.abertoTick === 0 || estado.tick < o.abertoTick + some);
}
