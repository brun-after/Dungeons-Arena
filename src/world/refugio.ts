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
import { emPassagem } from './passagem';

export interface Refugio {
  x: number;
  y: number;
  raio: number;
}

/** O ponto (em células) está dentro de algum refúgio da fase? */
export function emRefugio(fase: Fase, x: number, y: number): boolean {
  const lista = fase.refugios;
  if (!lista) return false;
  // Marco 54 (D-207): o atlas tem os refúgios de todas as regiões; a caixa descarta antes da raiz.
  for (const r of lista) if (Math.abs(x - r.x) <= r.raio && Math.abs(y - r.y) <= r.raio && Math.hypot(x - r.x, y - r.y) <= r.raio) return true;
  return false;
}

/**
 * Marco 44 (15/11/2026, D-178): à noite os portões da vila fecham e só a guarda deixa entrar: o monstro não segue
 * ninguém para dentro nem fere quem está lá, mesmo em combate (de dia, a regra de D-138 vale).
 */
export const portoesFechados = (ctx: Pick<ContextoSimulacao, 'balance' | 'modo'>): boolean => (ctx.modo.noite ?? 0) >= ctx.balance.mundo.vilaNoite.fechaDesde;

/** Quem os refúgios barram: a IA que não é invocação (os monstros). */
export const barradoNoRefugio = (e: Entidade): boolean => e.controlador === 'ia' && !e.invocacao;

/** Um golpe entre os dois (dado ou levado, por eles ou pelas invocações deles) há pouco? */
export function emCombateCom(estado: Pick<EstadoJogo, 'tick'>, ctx: Pick<ContextoSimulacao, 'balance'>, a: Entidade, b: Entidade): boolean {
  const janela = ticksDe(ctx.balance.mundo.refugio.combateS * 1000);
  // Marco 54 (26/11/2026, D-207): sem montar conjuntos a cada pergunta (vem por par de entidades a cada tique).
  const doLado = (x: Entidade, id: string) => id === x.id || (!!x.invocacao?.donoId && id === x.invocacao.donoId);
  const recente = (tick: number) => estado.tick - tick <= janela;
  return a.participacao.some((p) => doLado(b, p.id) && recente(p.tick)) || b.participacao.some((p) => doLado(a, p.id) && recente(p.tick));
}

/**
 * O refúgio impede este golpe? O monstro não fere quem está dentro, nem quem está dentro fere o monstro de fora, a menos
 * que os dois estejam em combate.
 */
export function refugioProtege(estado: Pick<EstadoJogo, 'tick'>, ctx: Pick<ContextoSimulacao, 'balance' | 'fase' | 'modo'>, ator: Entidade, alvo: Entidade): boolean {
  // Marco 41 (14/11/2026, D-169): na passagem entre as regiões, a trégua vale para todos (monstros e jogadores), sem
  // exceção de combate: ninguém de dentro é alvo, e ninguém de dentro fere quem está fora.
  if (ator.id !== alvo.id && (emPassagem(ctx.fase, alvo.x, alvo.y) || emPassagem(ctx.fase, ator.x, ator.y))) return true;
  if (!ctx.fase.refugios?.length) return false;
  const monstroNaVila = barradoNoRefugio(ator) && emRefugio(ctx.fase, alvo.x, alvo.y);
  const daVilaNoMonstro = barradoNoRefugio(alvo) && !barradoNoRefugio(ator) && emRefugio(ctx.fase, ator.x, ator.y) && !emRefugio(ctx.fase, alvo.x, alvo.y);
  return (monstroNaVila && portoesFechados(ctx)) || ((monstroNaVila || daVilaNoMonstro) && !emCombateCom(estado, ctx, ator, alvo));
}

/** O monstro pode pisar em (x, y)? Fora do refúgio, sim; dentro, se já está lá dentro (sai livre) ou se persegue o alvo com quem luta. */
export function podePisarNoRefugio(estado: EstadoJogo, ctx: Pick<ContextoSimulacao, 'balance' | 'fase' | 'modo'>, e: Entidade, x: number, y: number): boolean {
  // Marco 41 (D-169): o monstro nunca pisa na passagem (nem perseguindo); o que já estiver dentro sai livre.
  if (barradoNoRefugio(e) && emPassagem(ctx.fase, x, y) && !emPassagem(ctx.fase, e.px, e.py)) return false;
  if (!barradoNoRefugio(e) || !emRefugio(ctx.fase, x, y) || emRefugio(ctx.fase, e.px, e.py)) return true;
  const alvoId = e.ia?.alvoId;
  const alvo = alvoId ? estado.entidades.find((o) => o.id === alvoId) : undefined;
  return !!alvo && !portoesFechados(ctx) && emCombateCom(estado, ctx, e, alvo);
}

