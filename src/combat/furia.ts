// Fúria do Guerreiro (marco 21, 23/10/2026, D-088): cada ataque básico que fere enche a barra; cheia, as curas do
// próprio Guerreiro (aura, básico e abate) dobram. Sem bater por alguns segundos, ela esvazia aos poucos.
// O esvaziamento é calculado na leitura (sem sistema por tick): o valor guardado vale no `ultimoTick` e perde
// `perdaPorS` por segundo depois da carência. Tudo em ticks, números em balance.json.

import type { ContextoSimulacao } from '../core/contexto';
import { ticksDe } from '../core/tempo';
import type { Entidade } from '../entities/entidade';

/** Tem fúria? Só o Guerreiro (não as invocações dele). A classe é lida como em `classeDe` (sem importar o módulo). */
export function temFuria(e: Entidade): boolean {
  return (e.bolsa?.classeId ?? e.classeId ?? '') === 'guerreiro' && !e.invocacao;
}

/** A fúria agora (0..max), já descontado o esvaziamento. */
export function furiaAtual(ctx: ContextoSimulacao, e: Entidade, tick: number): number {
  const f = e.furia;
  if (!f) return 0;
  const r = ctx.balance.ajustesClasses.guerreiro.furia;
  const parado = tick - f.ultimoTick - ticksDe(r.carenciaMs);
  if (parado <= 0) return f.valor;
  return Math.max(0, f.valor - (parado * r.perdaPorS) / ticksDe(1000));
}

/** Fração da barra (0..1) para o HUD; null quando a entidade não tem fúria. */
export function fracaoFuria(ctx: ContextoSimulacao, e: Entidade, tick: number): number | null {
  if (!temFuria(e)) return null;
  return furiaAtual(ctx, e, tick) / ctx.balance.ajustesClasses.guerreiro.furia.max;
}

/** Um ataque básico que feriu: soma à barra (até o máximo) e renova a carência. */
export function acumularFuria(ctx: ContextoSimulacao, e: Entidade, tick: number): void {
  if (!temFuria(e)) return;
  const r = ctx.balance.ajustesClasses.guerreiro.furia;
  e.furia = { valor: Math.min(r.max, furiaAtual(ctx, e, tick) + r.porBasico), ultimoTick: tick };
}

/** Multiplicador das curas do próprio Guerreiro: `curaMult` com a barra cheia, senão 1. */
export function multiplicadorFuria(ctx: ContextoSimulacao, e: Entidade, tick: number): number {
  if (!temFuria(e)) return 1;
  const r = ctx.balance.ajustesClasses.guerreiro.furia;
  return furiaAtual(ctx, e, tick) >= r.max ? r.curaMult : 1;
}
