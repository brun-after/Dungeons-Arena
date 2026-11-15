// A visão no escuro (marco 44, 15/11/2026, D-178). No exterior do Mundo, quando escurece (a noite, a mata fechada), só se
// enxerga os inimigos perto: a `visaoSemTocha` células sem luz, a `visaoComTocha` com a tocha acesa ou perto de um poste
// ou fogueira. O inimigo parado na luz de um fogo também aparece. De dia, vê-se tudo, como antes. Some no desenho, no
// minimapa e no mapa do lugar (os aliados e os do grupo continuam à vista).

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { Entidade } from '../entities/entidade';
import { iluminado } from '../entities/ia-mundo';
import { escuroBaseEm, escuroDoLugar, horaDoMundo } from '../mundo/ciclo';
import { relacao } from '../modos/relacao';
import { agoraDoMundo } from './hora-do-mundo';

/** O escuro (0 a 1) onde está o jogador, pela hora deste aparelho. */
export function escuroAqui(ctx: ContextoSimulacao, x: number, y: number): number {
  if (!ctx.fase.exterior) return 0;
  return escuroDoLugar(horaDoMundo(agoraDoMundo(), ctx.balance.mundo.ciclo), escuroBaseEm(ctx.fase, x, y), false);
}

/**
 * Quanto do inimigo se vê (0 a 1): 1 de dia, fora do Mundo, para o próprio e para quem não é hostil; no escuro, some
 * além do raio de visão, com uma célula de borda macia.
 */
export function alfaNoEscuro(ctx: ContextoSimulacao, estado: EstadoJogo, eu: Entidade | undefined, e: Entidade, escuro?: number): number {
  if (!eu || e.id === eu.id || !ctx.fase.exterior) return 1;
  if (relacao(eu, e, ctx.modo) !== 'hostil') return 1;
  const t = ctx.balance.mundo.tocha;
  if ((escuro ?? escuroAqui(ctx, eu.x, eu.y)) < t.visaoDesdeEscuro) return 1;
  if (iluminado(estado, ctx, e)) return 1;
  const raio = iluminado(estado, ctx, eu) ? t.visaoComTocha : t.visaoSemTocha;
  const d = Math.hypot(e.x - eu.x, e.y - eu.y);
  return Math.max(0, Math.min(1, raio + 1 - d));
}
