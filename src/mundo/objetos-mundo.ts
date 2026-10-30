// Os objetos do Mundo (marco 29, 30/10/2026, D-128), montados a partir do exterior gerado:
// - as lojas dos NPCs (mercador, ferreiro, alquimista) são objetos `loja` com o papel em `ref` e o estoque do reino;
// - o quadro de missões é um `npc`; as pedras de save e de portal e as portas das estruturas pedem ao servidor
//   (evento `pedidoDoMundo`), porque salvar, viajar e entrar trocam de sala;
// - o nó de coleta canaliza (o dano interrompe), entrega o material e renasce depois de um tempo;
// - o túmulo guarda a mochila e o equipado de quem morreu fora de dungeon. Fora do PvP, só o dono abre por um tempo.
// Puro.

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo, ObjetoNoMundo, TipoObjeto } from '../core/estado';
import type { EventoSimulacao, MotivoItem } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import type { Entidade } from '../entities/entidade';
import { recalcularFicha } from '../progression/derivados';
import { guardarItem, recusarItem } from '../progression/inventario';
import { largarItem, largarPerto } from '../world/objetos';
import { novoObjeto } from '../world/objeto-novo';
import type { ExteriorGerado } from '../world/gerador-exterior';
import type { PapelNpc, Reino } from './reino';

/** Os papéis que atendem como loja (o estoque vem de `reino.lojas`). */
const PAPEIS_DE_LOJA: ReadonlySet<PapelNpc> = new Set(['mercador', 'ferreiro', 'alquimista']);
/** O objeto de cada papel que não é loja. */
const OBJETO_DO_PAPEL: Readonly<Partial<Record<PapelNpc, TipoObjeto>>> = { missoes: 'npc', save: 'pedra_save', portal: 'pedra_portal' };
/** Os que só pedem ao servidor (sem efeito no tick). */
const PEDIDOS: ReadonlySet<TipoObjeto> = new Set(['npc', 'pedra_save', 'pedra_portal', 'porta_estrutura']);
/** Interagíveis do Mundo sempre disponíveis (sem reserva nem estado de aberto). */
export const SEMPRE_DISPONIVEIS: ReadonlySet<TipoObjeto> = new Set([...PEDIDOS, 'tumulo']);
export const TIPOS_DO_MUNDO: ReadonlySet<TipoObjeto> = new Set([...SEMPRE_DISPONIVEIS, 'coleta']);

/** Os objetos da região: lojas e NPCs da vila, pedras, portas das estruturas e nós de coleta. */
export function objetosDoExterior(reino: Reino, exterior: ExteriorGerado): ObjetoNoMundo[] {
  const objetos: ObjetoNoMundo[] = [];
  for (const [i, p] of exterior.pontos.entries()) {
    const id = `m${i}`;
    if (p.tipo === 'estrutura') {
      objetos.push(novoObjeto(id, 'porta_estrutura', p.porta.x, p.porta.y, { ref: p.estruturaId }));
    } else if (p.tipo === 'coleta') {
      objetos.push(novoObjeto(id, 'coleta', p.x, p.y, { itemId: p.itemId }));
    } else if (PAPEIS_DE_LOJA.has(p.papel)) {
      objetos.push(novoObjeto(id, 'loja', p.x, p.y, { ref: p.papel, itens: [...(reino.lojas[p.papel] ?? [])] }));
    } else {
      objetos.push(novoObjeto(id, OBJETO_DO_PAPEL[p.papel] ?? 'npc', p.x, p.y, { ref: p.papel }));
    }
  }
  return objetos;
}

/** A chave do dono do túmulo: o personagem (estável entre salas), ou a entidade sem ficha. */
export function chaveDoDono(e: Entidade): string {
  return e.bolsa?.personagemId || e.id;
}

/** Interação com um objeto do Mundo; devolve o motivo da recusa, ou null. */
export function interagirNoMundo(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, o: ObjetoNoMundo, saida: EventoSimulacao[]): MotivoItem | null {
  const tick = estado.tick;
  if (PEDIDOS.has(o.tipo)) {
    saida.push({ t: 'pedidoDoMundo', tick, id: e.id, tipo: o.tipo, ref: o.ref ?? '' });
    return null;
  }
  if (o.tipo === 'tumulo') return abrirTumulo(estado, ctx, e, o, saida);
  // Coleta: canaliza parado; o fim (ou a interrupção pelo dano) sai em `concluirColeta`.
  o.abridorId = e.id;
  const ateTick = tick + ticksDe(ctx.balance.mundo.coleta.canalMs);
  e.interacao = { tipo: 'coleta', objetoId: o.objetoId, ateTick };
  e.direcao = 'parado';
  e.caminho = [];
  e.waypoints = [];
  saida.push({ t: 'interacaoIniciada', tick, id: e.id, objetoId: o.objetoId, tipo: 'coleta', ateTick });
  return null;
}

/** Fim do canal: quem levou dano durante ele não coleta (o nó fica livre); senão o material vai para a mochila. */
export function concluirColeta(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, saida: EventoSimulacao[]): void {
  const i = e.interacao;
  e.interacao = null;
  const o = i ? estado.objetos.find((x) => x.objetoId === i.objetoId) : undefined;
  if (!i || !o || o.abridorId !== e.id || !e.bolsa) return;
  o.abridorId = null;
  const inicio = i.ateTick - ticksDe(ctx.balance.mundo.coleta.canalMs);
  if (e.participacao.some((p) => p.tick >= inicio)) {
    recusarItem(e, 'interrompido', estado.tick, saida);
    return;
  }
  const item = o.itemId ? ctx.conteudo.itens.get(o.itemId) : undefined;
  if (!item || !o.itemId) return;
  const itemId = o.itemId;
  if (!guardarItem(e.bolsa, item, o.valor, ctx.balance.inventario)) largarPerto(ctx, e.x, e.y, (x, y) => largarItem(estado, itemId, x, y, saida));
  o.abertoTick = estado.tick;
  saida.push({ t: 'coletado', tick: estado.tick, id: e.id, objetoId: o.objetoId, itemId, qtd: o.valor });
}

/**
 * Morte fora de dungeon (regra `tumuloNaMorte` do modo): a mochila e o equipado vão para um túmulo no lugar da
 * morte. Fora do PvP (sem fogo amigo), só o dono abre até `donoExclusivoS`; com PvP, qualquer um, na hora.
 */
export function criarTumulo(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, saida: EventoSimulacao[]): void {
  const bolsa = e.bolsa;
  if (!bolsa) return;
  const itens: string[] = [];
  for (const m of bolsa.mochila) for (let k = 0; k < m.qtd; k++) itens.push(m.itemId);
  for (const [slot, m] of Object.entries(bolsa.equipamento)) {
    if (!m) continue;
    itens.push(m.itemId);
    bolsa.equipamento[slot as keyof typeof bolsa.equipamento] = null;
  }
  bolsa.mochila = [];
  if (itens.length === 0) return;
  recalcularFicha(e, ctx);
  const regras = ctx.balance.mundo.tumulo;
  const liberaTick = ctx.modo.fogoAmigo ? estado.tick : estado.tick + ticksDe(regras.donoExclusivoS * 1000);
  const objetoId = `t${estado.tick}_${e.id}`;
  estado.objetos.push(novoObjeto(objetoId, 'tumulo', e.x, e.y, { itens, ref: chaveDoDono(e), valor: liberaTick, largadoTick: estado.tick }));
  saida.push({ t: 'tumuloCriado', tick: estado.tick, id: e.id, objetoId, x: e.x, y: e.y, itens: itens.length });
}

function abrirTumulo(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, o: ObjetoNoMundo, saida: EventoSimulacao[]): MotivoItem | null {
  const bolsa = e.bolsa;
  if (!bolsa) return 'sem_mochila';
  if (o.ref !== chaveDoDono(e) && estado.tick < o.valor) return 'trancado';
  const sobra: string[] = [];
  for (const itemId of o.itens) {
    const item = ctx.conteudo.itens.get(itemId);
    if (item && !guardarItem(bolsa, item, 1, ctx.balance.inventario)) sobra.push(itemId);
  }
  // O que não coube fica no túmulo (ele só some vazio ou no prazo).
  const pegou = o.itens.length - sobra.length;
  o.itens = sobra;
  saida.push({ t: 'tumuloAberto', tick: estado.tick, id: e.id, objetoId: o.objetoId, itens: pegou });
  if (sobra.length > 0) recusarItem(e, 'mochila_cheia', estado.tick, saida);
  return null;
}

/** Etapa dos objetos do Mundo: os nós coletados renascem e os túmulos vazios ou vencidos somem. */
export function processarObjetosDoMundo(estado: EstadoJogo, ctx: ContextoSimulacao): void {
  const regras = ctx.balance.mundo;
  const renascer = ticksDe(regras.coleta.renascerS * 1000);
  const dura = ticksDe(regras.tumulo.duracaoS * 1000);
  let some = false;
  for (const o of estado.objetos) {
    if (o.tipo === 'coleta' && o.abertoTick > 0 && estado.tick >= o.abertoTick + renascer) o.abertoTick = 0;
    if (o.tipo === 'tumulo' && (o.itens.length === 0 || estado.tick >= (o.largadoTick ?? 0) + dura)) some = true;
  }
  if (some) estado.objetos = estado.objetos.filter((o) => o.tipo !== 'tumulo' || (o.itens.length > 0 && estado.tick < (o.largadoTick ?? 0) + dura));
}
