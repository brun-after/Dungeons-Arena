// O deslize de quem se move sozinho (14/11/2026, D-170). A simulação põe o corpo no destino de uma vez (o recuo do
// Arqueiro, a Arremetida do Guerreiro, os avanços e teleportes curtos das skills) e o desenho desliza do ponto de
// partida até lá. Antes, no tick seguinte o corpo já andava (o clique ou a tecla para a frente, o seguir alvo) ou
// começava um golpe virando para o alvo, e a animação era cortada no meio. Enquanto dura o deslize:
// - não anda contra o rumo do deslize (no mesmo rumo, segue junto: recuar depois do salto para trás é fácil);
// - não começa golpe; a skill pedida no meio fica guardada e sai quando o deslize acaba.
// A intenção de andar (o caminho, a direção) fica guardada e volta no fim. Números em balance.movimento.deslize. Puro.

import type { ContextoSimulacao } from '../core/contexto';
import type { CausaDeslocamento } from '../core/eventos-simulacao';
import { buscarEntidade, type EstadoJogo } from '../core/estado';
import { ticksDe } from '../core/tempo';
import type { Celula, EntidadeId } from '../core/comandos';
import type { Entidade } from '../entities/entidade';

type Ctx = Pick<ContextoSimulacao, 'balance'>;

/** Quanto dura o deslize próprio desta causa, nesta distância (0: não trava). */
export function duracaoDoDeslizeMs(ctx: Ctx, causa: CausaDeslocamento, distancia: number): number {
  const d = ctx.balance.movimento.deslize;
  if (causa === 'recuo') return d.recuoMs;
  if (causa === 'avanco') return Math.max(d.avancoMinMs, d.avancoMsPorCelula * distancia);
  if (causa === 'teleporte') return d.teleporteMs;
  return 0;
}

/** O corpo `e` acabou de se mover sozinho de (deX, deY) até onde está: começa o deslize. */
export function comecarDeslize(ctx: Ctx, e: Entidade, tick: number, causa: CausaDeslocamento, deX: number, deY: number): void {
  const dist = Math.hypot(e.x - deX, e.y - deY);
  const ms = dist > 0 ? duracaoDoDeslizeMs(ctx, causa, dist) : 0;
  if (ms <= 0) return;
  e.deslize = { ateTick: tick + ticksDe(ms), dx: (e.x - deX) / dist, dy: (e.y - deY) / dist };
}

/** No meio do deslize próprio? */
export function noDeslize(e: Entidade, tick: number): boolean {
  return (e.deslize?.ateTick ?? 0) > tick;
}

/** Pode andar no rumo (ux, uy) agora? Fora do deslize, sempre; no deslize, só no mesmo rumo dele. */
export function andarCabeNoDeslize(ctx: Ctx, e: Entidade, tick: number, ux: number, uy: number): boolean {
  const d = e.deslize;
  if (!d || d.ateTick <= tick) return true;
  const n = Math.hypot(ux, uy);
  return n > 0 && (ux * d.dx + uy * d.dy) / n >= ctx.balance.movimento.deslize.mesmoRumoCos;
}

/** A skill pedida no meio do deslize fica guardada (a última pedida vale). */
export function guardarPedido(e: Entidade, id: string, alvo: EntidadeId | Celula | undefined): void {
  if (!e.deslize) return;
  e.deslize.pedido = { id, ...(alvo === undefined ? {} : { alvo: typeof alvo === 'object' ? { x: alvo.x, y: alvo.y } : alvo }) };
}

/** Acabou o deslize: devolve a skill guardada (uma vez) e limpa. */
export function pedidoAoFimDoDeslize(e: Entidade, tick: number): { id: string; alvo?: EntidadeId | Celula } | null {
  const d = e.deslize;
  if (!d || d.ateTick > tick) return null;
  delete e.deslize;
  return d.pedido ?? null;
}

/**
 * O salto para trás para longe do alvo seguido larga o seguir alvo dele (como o direcional contrário, D-121): sem isso,
 * a automação puxava o Arqueiro de volta para a frente logo depois do salto.
 */
export function largarSeguirNoRecuo(estado: EstadoJogo, ctx: Pick<ContextoSimulacao, 'balance'>, e: Entidade, rumo: { dx: number; dy: number }): void {
  const s = e.seguindo;
  if (!s) return;
  s.andando = false;
  const alvo = buscarEntidade(estado, s.id);
  if (!alvo) return;
  const vx = alvo.px - e.px;
  const vy = alvo.py - e.py;
  const n = Math.hypot(vx, vy) * Math.hypot(rumo.dx, rumo.dy);
  if (n > 0 && (vx * rumo.dx + vy * rumo.dy) / n > Math.cos((ctx.balance.seguirAlvo.anguloCancelaGraus * Math.PI) / 180)) return;
  e.seguirCanceladoDe = s.id;
}
