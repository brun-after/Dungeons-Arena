// Interação com baú e loja (§2.1, §2.10). Marco 9A (14/10/2026).
// `interagir` escolhe o interagível mais próximo a Chebyshev ≤ 1 e congela quem interage: o baú por
// 3 s (depois entrega o conteúdo) e a loja pela janela de 5 s (compra e venda em progression/loja.ts).
// O fim da interação é a etapa 5 do tick (congelamentos, §2.2). Fechar a loja, de qualquer jeito,
// arma a recarga dela para aquele jogador; morrer fecha e também arma (§2.12).
// Baú compartilhado tem um abridor por vez (§3.6): a reserva sai com a entrega, a morte ou a saída.

import { usarRefugio } from '../progression/buffs';
import { perseguido } from '../progression/recursos';
import { celulaOcupada, chebyshev } from '../combat/geometria';
import type { ContextoSimulacao } from '../core/contexto';
import { buscarEntidade, type Armadilha, type EstadoJogo, type ObjetoNoMundo } from '../core/estado';
import type { EventoSimulacao, MotivoItem } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import type { Entidade } from '../entities/entidade';
import { guardarItem, recusarItem } from '../progression/inventario';
import { armadilhaParaDesarmar, concluirDesarme } from './armadilhas-ocultas';
import { interagivel, largarItem, largarPerto } from './objetos';
import { concluirColeta, interagirNoMundo, processarObjetosDoMundo, SEMPRE_DISPONIVEIS, TIPOS_DO_MUNDO } from '../mundo/objetos-mundo';

/** Recarga da loja por jogador e loja, no mesmo mapa monotônico das habilidades. */
export function chaveRecargaLoja(objetoId: string, entidadeId: string): string {
  return `loja:${objetoId}:${entidadeId}`;
}

export function recargaLojaRestante(estado: EstadoJogo, objetoId: string, entidadeId: string): number {
  return Math.max(0, (estado.recargas[chaveRecargaLoja(objetoId, entidadeId)] ?? 0) - estado.tick);
}

/** Baú ainda fechado e sem ninguém abrindo; a loja está sempre disponível (a recarga é por jogador). */
function disponivel(o: ObjetoNoMundo): boolean {
  return o.tipo === 'loja' || SEMPRE_DISPONIVEIS.has(o.tipo) || (o.abertoTick === 0 && o.abridorId === null);
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
    // D-079: em empate, um santuário novo não toma a interação de um baú/loja existente.
    const prioridade = o.tipo === 'santuario' ? 1 : 0;
    const prioridadeAtual = melhor?.tipo === 'santuario' ? 1 : 0;
    if (d < melhorDist || (d === melhorDist && melhor && (prioridade < prioridadeAtual || prioridade === prioridadeAtual && o.objetoId < melhor.objetoId))) {
      melhor = o;
      melhorDist = d;
    }
  }
  return melhor;
}

const temItem = (e: Entidade, itemId: string): boolean => e.bolsa?.mochila.some((i) => i.itemId === itemId) ?? false;

/** Marco 24 (25/10/2026, D-099): o item do santuário de Engenho (converte uma armadilha revelada e se gasta). */
export const KIT_ENGENHO = 'kit_de_engenho';

/** Converte a armadilha revelada: com o efeito Engenho ativo (orbe) ou gastando um kit. */
export function podeConverterArmadilha(e: Entidade, tick: number): boolean {
  return e.efeitos.some((f) => f.tipo === 'engenho' && f.ateTick > tick) || temItem(e, KIT_ENGENHO);
}

function gastarItem(e: Entidade, itemId: string): void {
  const mochila = e.bolsa?.mochila ?? [];
  const indice = mochila.findIndex((i) => i.itemId === itemId);
  const entrada = mochila[indice];
  if (!entrada) return;
  entrada.qtd--;
  if (entrada.qtd <= 0) mochila.splice(indice, 1);
}

/** D-067: a janela da loja não tem prazo (fecha pelo jogador ou pela perseguição). */
export const LOJA_SEM_PRAZO = 2 ** 31 - 1;

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
  if (!o) {
    // Marco 18 (D-068): sem baú nem loja perto, uma armadilha revelada pode ser desarmada.
    const a = armadilhaParaDesarmar(estado, ctx, e);
    if (!a) return 'nada_perto';
    // 17/10/2026: Engenho converte somente armadilhas descobertas, preservando o valor da Sabedoria.
    // Marco 24 (D-099): o efeito do orbe converte à vontade enquanto dura; sem ele, o kit do santuário converte uma.
    if (podeConverterArmadilha(e, tick)) {
      if (!e.efeitos.some((f) => f.tipo === 'engenho' && f.ateTick > tick)) gastarItem(e, KIT_ENGENHO);
      a.donoId = e.id;
      a.equipeDono = e.equipe;
      a.reveladaPara = [...new Set([...a.reveladaPara, e.id])];
      saida.push({ t: 'armadilhaArmada', tick, donoId: e.id, armadilhaId: a.id, x: a.x, y: a.y });
      return null;
    }
    const ateTick = tick + ticksDe(ctx.balance.armadilhas.desarmeMs);
    e.interacao = { tipo: 'desarme', objetoId: String(a.id), ateTick };
    e.direcao = 'parado';
    e.caminho = [];
    e.waypoints = [];
    saida.push({ t: 'interacaoIniciada', tick, id: e.id, objetoId: String(a.id), tipo: 'desarme', ateTick });
    return null;
  }
  // Marco 29 (D-128): os objetos do Mundo (coleta, túmulo, NPCs, pedras e portas).
  if (TIPOS_DO_MUNDO.has(o.tipo)) return interagirNoMundo(estado, ctx, e, o, saida);
  // Marco 24 (25/10/2026, D-099): o santuário entrega o kit de engenho (na mochila, ou ao lado se não couber).
  if (o.tipo === 'santuario') {
    const kit = ctx.conteudo.itens.get(KIT_ENGENHO);
    if (!kit) return 'nada_perto';
    o.abertoTick = tick + 1;
    if (!guardarItem(e.bolsa, kit, 1, ctx.balance.inventario)) largarPerto(ctx, e.x, e.y, (x, y) => largarItem(estado, KIT_ENGENHO, x, y, saida));
    saida.push({ t: 'santuarioUsado', tick, id: e.id, itemId: KIT_ENGENHO });
    return null;
  }
  const eco = ctx.balance.economia;
  let ateTick: number;
  if (o.tipo === 'loja') {
    if (recargaLojaRestante(estado, o.objetoId, e.id) > 0) return 'em_recarga';
    // Ajuste de 16/10/2026 (D-067): a loja não atende sendo perseguido, e não fecha sozinha (sem prazo).
    if (perseguido(estado, e)) return 'em_perigo';
    ateTick = LOJA_SEM_PRAZO;
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
  // D-067: abrir a loja gasta a carga de refúgio (imune enquanto compra).
  if (tipo === 'loja') usarRefugio(estado, ctx, e, saida);
  return null;
}

/** Fecha a janela da loja e arma a recarga (fechar, acabar o tempo ou morrer, §2.10). */
export function fecharLoja(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, saida: EventoSimulacao[], perigo = false): void {
  const i = e.interacao;
  if (i?.tipo !== 'loja') return;
  const recargaAteTick = estado.tick + ticksDe(ctx.balance.economia.recargaLojaMs);
  estado.recargas[chaveRecargaLoja(i.objetoId, e.id)] = recargaAteTick;
  e.interacao = null;
  saida.push({ t: 'lojaFechada', tick: estado.tick, id: e.id, objetoId: i.objetoId, recargaAteTick, ...(perigo && { perigo }) });
}

/** Morte ou saída: a loja fecha armando a recarga; o baú libera a reserva sem entregar. */
export function encerrarInteracao(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, saida: EventoSimulacao[]): void {
  const i = e.interacao;
  if (!i) return;
  if (i.tipo === 'loja') {
    fecharLoja(estado, ctx, e, saida);
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
export function processarInteracoes(
  estado: EstadoJogo,
  ctx: ContextoSimulacao,
  saida: EventoSimulacao[],
  disparar: (a: Armadilha, alvo: Entidade) => void = () => undefined,
): void {
  for (const e of estado.entidades) {
    const i = e.interacao;
    // D-067: a loja fecha se um hostil começar a perseguir (e só por isso, ou pelo jogador).
    if (i?.tipo === 'loja' && perseguido(estado, e)) {
      fecharLoja(estado, ctx, e, saida, true);
      continue;
    }
    if (!i || estado.tick < i.ateTick) continue;
    if (i.tipo === 'loja') fecharLoja(estado, ctx, e, saida);
    else if (i.tipo === 'desarme') concluirDesarme(estado, ctx, e, Number(i.objetoId), disparar, saida);
    else if (i.tipo === 'coleta') concluirColeta(estado, ctx, e, saida);
    else entregarBau(estado, ctx, e, saida);
  }
  processarObjetosDoMundo(estado, ctx);
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
