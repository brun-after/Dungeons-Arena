// Regeneração contínua de recurso (§2.12), etapa 4 do tick, e por célula caminhada (10A-2).

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { ticksDe } from '../core/tempo';
import { vivo, type Entidade } from '../entities/entidade';
import { regeneraPorCelula } from '../modos/regras';
import { manaPorSegundo, vidaPorCelula } from './efeitos-atributo';

export function regenerarRecursos(estado: EstadoJogo, ctx: ContextoSimulacao): void {
  // Ao fim de cada segundo completo de simulação (nunca no tick 0).
  if ((estado.tick + 1) % ticksDe(1000) !== 0) return;
  // Marco 17: a Sabedoria acima de 10 regenera mais (em mana inteira, distribuída pelos segundos).
  const segundo = (estado.tick + 1) / ticksDe(1000);
  for (const e of estado.entidades) {
    if (vivo(e) && e.mana < e.manaMax) e.mana = Math.min(e.manaMax, e.mana + manaPorSegundo(e.atributos, segundo, ctx.balance));
    // D-071 (17/10/2026): o chefe se recupera após a retirada, nunca durante perseguição ou dano periódico.
    if (!vivo(e) || e.controlador !== 'ia' || e.arquetipo !== 'boss' || e.invocacao || e.hp >= e.hpMax) continue;
    const espera = ticksDe(ctx.balance.recursos.regenBossEsperaMs);
    if (e.acao || (e.ia && (e.ia.modo !== 'patrulha' || estado.tick - e.ia.modoDesdeTick < espera))) continue;
    const recente = (tick: number) => estado.tick - tick < espera;
    if (e.participacao.some((p) => recente(p.tick)) || perseguido(estado, e)) continue;
    if (estado.entidades.some((outro) => outro.participacao.some((p) => p.id === e.id && recente(p.tick)))) continue;
    e.hp = Math.min(e.hpMax, e.hp + Math.max(1, Math.round(e.hpMax * ctx.balance.recursos.regenBossPorSegundoPct / 100)));
  }
}

/** Algum hostil vivo está perseguindo esta entidade (§2.12: bloqueia a regeneração e a loja)? */
export function perseguido(estado: EstadoJogo, e: Entidade): boolean {
  return estado.entidades.some((x) => vivo(x) && x.ia?.modo === 'perseguindo' && x.ia.alvoId === e.id);
}

/**
 * Marco 10A-2 (14/10/2026): 1 de vida e 1 de mana por célula caminhada (§2.12), só para jogadores,
 * onde o modo liga, e bloqueada com hostil em perseguição. Chamada ao completar um passo.
 */
export function regenerarPorPasso(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade): void {
  if (e.controlador === 'ia' || !vivo(e) || !regeneraPorCelula(ctx.modo)) return;
  if ((e.hp >= e.hpMax && e.mana >= e.manaMax) || perseguido(estado, e)) return;
  const r = ctx.balance.recursos;
  // Marco 17: a Constituição acima de 10 dá mais vida por célula.
  e.hp = Math.min(e.hpMax, e.hp + vidaPorCelula(e.atributos, ctx.balance));
  e.mana = Math.min(e.manaMax, e.mana + r.regenManaPorCelula);
}
