// Refúgios (marco 30, 30/10/2026, D-129): áreas da fase onde os monstros não entram e onde quem está dentro não é
// alvo deles. No Mundo, o círculo dos muros da vila (a região segura). As invocações e os jogadores entram; quem é
// barrado é a IA que não é invocação. A fase sem refúgios (a campanha, a arena) não muda nada. Puro.
// 08/11/2026 (D-138): o refúgio não é mais esconderijo de quem luta. Em combate (um golpe dado ou levado entre os dois
// nos últimos `balance.mundo.refugio.combateS`), o monstro segue quem fugiu para dentro e o ataca lá; sem combate, quem
// está dentro não fere o monstro de fora (nada de bater da beirada da vila). O monstro que entrou sai livre.

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { ticksDe } from '../core/tempo';
import type { Entidade } from '../entities/entidade';
import type { Fase } from './fase';

export interface Refugio {
  x: number;
  y: number;
  raio: number;
}

/** O ponto (em células) está dentro de algum refúgio da fase? */
export function emRefugio(fase: Fase, x: number, y: number): boolean {
  const lista = fase.refugios;
  if (!lista) return false;
  for (const r of lista) if (Math.hypot(x - r.x, y - r.y) <= r.raio) return true;
  return false;
}

/** Quem os refúgios barram: a IA que não é invocação (os monstros). */
export const barradoNoRefugio = (e: Entidade): boolean => e.controlador === 'ia' && !e.invocacao;

/** Um golpe entre os dois (dado ou levado, por eles ou pelas invocações deles) há pouco? */
export function emCombateCom(estado: Pick<EstadoJogo, 'tick'>, ctx: Pick<ContextoSimulacao, 'balance'>, a: Entidade, b: Entidade): boolean {
  const janela = ticksDe(ctx.balance.mundo.refugio.combateS * 1000);
  const ladoA = new Set([a.id, a.invocacao?.donoId].filter((x): x is string => !!x));
  const ladoB = new Set([b.id, b.invocacao?.donoId].filter((x): x is string => !!x));
  const recente = (tick: number) => estado.tick - tick <= janela;
  return a.participacao.some((p) => ladoB.has(p.id) && recente(p.tick)) || b.participacao.some((p) => ladoA.has(p.id) && recente(p.tick));
}

/**
 * O refúgio impede este golpe? O monstro não fere quem está dentro, nem quem está dentro fere o monstro de fora, a menos
 * que os dois estejam em combate.
 */
export function refugioProtege(estado: Pick<EstadoJogo, 'tick'>, ctx: Pick<ContextoSimulacao, 'balance' | 'fase'>, ator: Entidade, alvo: Entidade): boolean {
  if (!ctx.fase.refugios?.length) return false;
  const monstroNaVila = barradoNoRefugio(ator) && emRefugio(ctx.fase, alvo.x, alvo.y);
  const daVilaNoMonstro = barradoNoRefugio(alvo) && !barradoNoRefugio(ator) && emRefugio(ctx.fase, ator.x, ator.y) && !emRefugio(ctx.fase, alvo.x, alvo.y);
  return (monstroNaVila || daVilaNoMonstro) && !emCombateCom(estado, ctx, ator, alvo);
}

/** O monstro pode pisar em (x, y)? Fora do refúgio, sim; dentro, se já está lá dentro (sai livre) ou se persegue o alvo com quem luta. */
export function podePisarNoRefugio(estado: EstadoJogo, ctx: Pick<ContextoSimulacao, 'balance' | 'fase'>, e: Entidade, x: number, y: number): boolean {
  if (!barradoNoRefugio(e) || !emRefugio(ctx.fase, x, y) || emRefugio(ctx.fase, e.px, e.py)) return true;
  const alvoId = e.ia?.alvoId;
  const alvo = alvoId ? estado.entidades.find((o) => o.id === alvoId) : undefined;
  return !!alvo && emCombateCom(estado, ctx, e, alvo);
}

