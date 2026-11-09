// 09/11/2026 (D-143): monstros que se estranham. Onde a região liga o fogo amigo (o PvP do Mundo), `podeFerir` deixa
// os monstros da mesma equipe se ferirem, e a IA tratava todos como alvo: brigavam o tempo todo. Agora a IA só mira
// outro monstro com quem se estranhou, por sorteio (`balance.ia.estranhamento`). O golpe em área ainda pega quem
// estiver no caminho, mas não vira revide. A hostilidade continua decidida por `relacao()` (§2.5).

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { aleatorio } from '../core/rng';
import { ticksDe } from '../core/tempo';
import { alvoOfensivoValido } from '../combat/acao';
import { chebyshev } from '../combat/geometria';
import { relacao } from '../modos/relacao';
import { vivo, type Entidade, type EstadoIa } from './entidade';

/** Dois monstros que só se ferem pelo fogo amigo (aliados pela relação do modo, ambos da IA). */
export function entreMonstros(ctx: ContextoSimulacao, a: Entidade, b: Entidade): boolean {
  return a.controlador === 'ia' && b.controlador === 'ia' && relacao(a, b, ctx.modo) === 'aliado';
}

function estranhou(a: Entidade, b: Entidade, tick: number): boolean {
  return a.ia?.estranhoId === b.id && (a.ia.estranhoAteTick ?? 0) > tick;
}

/** O alvo que a IA pode escolher: o ofensivo válido, e outro monstro só se um estranhou o outro. */
export function alvoDaIa(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, alvo: Entidade): boolean {
  if (!alvoOfensivoValido(estado, ctx, e, alvo)) return false;
  return !entreMonstros(ctx, e, alvo) || estranhou(e, alvo, estado.tick) || estranhou(alvo, e, estado.tick);
}

/**
 * O sorteio da vez: devolve o monstro com quem `e` passa a brigar (null: nada mudou). Só sorteia com outro monstro
 * por perto e quando o fogo amigo do modo permite feri-lo.
 */
export function sortearEstranhamento(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, ia: EstadoIa): Entidade | null {
  if (!ctx.modo.fogoAmigo || e.invocacao) return null;
  const r = ctx.balance.ia.estranhamento;
  if (estado.tick < (ia.proximoEstranhamentoTick ?? 0)) return null;
  ia.proximoEstranhamentoTick = estado.tick + ticksDe(r.intervaloMs);
  if (estranhoAtivo(estado, ia)) return null;
  let perto: Entidade | null = null;
  for (const o of estado.entidades) {
    if (o === e || !vivo(o) || o.invocacao || chebyshev(o, e) > r.raio || !entreMonstros(ctx, e, o) || !alvoOfensivoValido(estado, ctx, e, o)) continue;
    if (!perto || chebyshev(o, e) < chebyshev(perto, e) || (chebyshev(o, e) === chebyshev(perto, e) && o.id < perto.id)) perto = o;
  }
  if (!perto) return null;
  const alvo = ia.modo === 'perseguindo' && ia.alvoId ? estado.entidades.find((x) => x.id === ia.alvoId) : undefined;
  const pct = alvo && alvo.controlador !== 'ia' ? r.perseguindoPct : r.foraPct;
  if (aleatorio(ia.rng) * 100 >= pct) return null;
  ia.estranhoId = perto.id;
  ia.estranhoAteTick = estado.tick + ticksDe(r.duracaoMs);
  return perto;
}

function estranhoAtivo(estado: EstadoJogo, ia: EstadoIa): boolean {
  return !!ia.estranhoId && (ia.estranhoAteTick ?? 0) > estado.tick;
}
