// A visão no escuro (marco 44, 15/11/2026, D-178). No exterior do Mundo, o inimigo escondido só é visto de perto: a
// `visaoSemTocha` células sem luz, a `visaoComTocha` com a tocha acesa ou perto de um poste ou fogueira. Escondido é quem
// está no escuro da noite ou na sombra de uma árvore (a zona de fácil camuflagem, world/camuflagem.ts): conta o lugar do
// inimigo, não o do jogador. O inimigo parado na luz de um fogo aparece. Some no desenho, no minimapa e no mapa do
// lugar (os aliados e os do grupo continuam à vista).

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { Entidade } from '../entities/entidade';
import { iluminado } from '../entities/ia-mundo';
import { escuroDoLugar, horaDoMundo } from '../mundo/ciclo';
import { relacao } from '../modos/relacao';
import { naSombra } from '../world/camuflagem';
import { agoraDoMundo } from './hora-do-mundo';

/** O escuro (0 a 1) da hora, pela hora deste aparelho (o mesmo na região inteira). */
export function escuroAqui(ctx: ContextoSimulacao): number {
  if (!ctx.fase.exterior) return 0;
  return escuroDoLugar(horaDoMundo(agoraDoMundo(), ctx.balance.mundo.ciclo), 0, false);
}

/**
 * Quanto do inimigo se vê (0 a 1): 1 fora do Mundo, para o próprio e para quem não é hostil, e para quem não está
 * escondido; o escondido some além do raio de visão, com uma célula de borda macia.
 */
export function alfaNoEscuro(ctx: ContextoSimulacao, estado: EstadoJogo, eu: Entidade | undefined, e: Entidade, escuro?: number): number {
  if (!eu || e.id === eu.id || !ctx.fase.exterior) return 1;
  if (relacao(eu, e, ctx.modo) !== 'hostil') return 1;
  const t = ctx.balance.mundo.tocha;
  const noite = (escuro ?? escuroAqui(ctx)) >= t.visaoDesdeEscuro;
  if (!noite && !naSombra(ctx.fase, e.x, e.y, ctx.balance.mundo.noite.camuflagem)) return 1;
  if (iluminado(estado, ctx, e)) return 1;
  const raio = iluminado(estado, ctx, eu) ? t.visaoComTocha : t.visaoSemTocha;
  const d = Math.hypot(e.x - eu.x, e.y - eu.y);
  return Math.max(0, Math.min(1, raio + 1 - d));
}
