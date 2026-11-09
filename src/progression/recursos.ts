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
    if (e.participacao.some((p) => recente(p.tick)) || perseguido(estado, ctx, e)) continue;
    if (estado.entidades.some((outro) => outro.participacao.some((p) => p.id === e.id && recente(p.tick)))) continue;
    e.hp = Math.min(e.hpMax, e.hp + Math.max(1, Math.round(e.hpMax * ctx.balance.recursos.regenBossPorSegundoPct / 100)));
  }
}

/**
 * Algum hostil vivo está perseguindo esta entidade (§2.12: bloqueia a regeneração)? 09/11/2026 (D-144): só conta
 * quem está a até `perseguicaoMaxCelulas` (o monstro longe dos jogadores dorme sem rodar a IA e ficava marcado como
 * perseguindo para sempre) e ninguém persegue um morto.
 */
export function perseguido(estado: EstadoJogo, ctx: Pick<ContextoSimulacao, 'balance'>, e: Entidade): boolean {
  if (!vivo(e)) return false;
  const max = ctx.balance.ia.perseguicaoMaxCelulas;
  return estado.entidades.some((x) => vivo(x) && x.ia?.modo === 'perseguindo' && x.ia.alvoId === e.id
    && Math.max(Math.abs(x.x - e.x), Math.abs(x.y - e.y)) <= max);
}

/** 09/11/2026 (D-144): quem morre deixa de ser perseguido (os perseguidores voltam a patrulhar). */
export function esquecerPerseguidores(estado: EstadoJogo, e: Entidade): void {
  for (const x of estado.entidades) {
    const ia = x.ia;
    if (!ia || ia.alvoId !== e.id) continue;
    ia.alvoId = null;
    if (ia.modo === 'perseguindo' || ia.modo === 'hesitando') {
      ia.modo = 'patrulha';
      ia.modoDesdeTick = estado.tick;
    }
  }
}

/**
 * Marco 10A-2 (14/10/2026): 1 de vida e 0,5 de mana por célula caminhada (ajuste de 17/10/2026) (§2.12), só para jogadores,
 * onde o modo liga, e bloqueada com hostil em perseguição. Chamada ao completar um passo.
 */
export function regenerarPorPasso(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade): void {
  if (e.controlador === 'ia' || !vivo(e) || !regeneraPorCelula(ctx.modo)) return;
  if ((e.hp >= e.hpMax && e.mana >= e.manaMax) || perseguido(estado, ctx, e)) return;
  const r = ctx.balance.recursos;
  // Marco 17: a Constituição acima de 10 dá mais vida por célula.
  e.hp = Math.min(e.hpMax, e.hp + vidaPorCelula(e.atributos, ctx.balance));
  e.mana = Math.min(e.manaMax, e.mana + r.regenManaPorCelula);
}
