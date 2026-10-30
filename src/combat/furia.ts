// Fúria do Guerreiro (marco 21, 23/10/2026, D-088): cada ataque básico que fere enche a barra; cheia, as curas do
// próprio Guerreiro (aura, básico e abate) dobram. Sem bater por alguns segundos, ela esvazia aos poucos.
// O esvaziamento é calculado na leitura (sem sistema por tick): o valor guardado vale no `ultimoTick` e perde
// `perdaPorS` por segundo depois da carência. Tudo em ticks, números em balance.json.

import type { ContextoSimulacao } from '../core/contexto';
import { ticksDe } from '../core/tempo';
import type { Entidade } from '../entities/entidade';
import { fatorDeDominio } from '../progression/dominio';

/** Tem fúria? Só o Guerreiro (não as invocações dele). A classe é lida como em `classeDe` (sem importar o módulo). */
export function temFuria(e: Entidade): boolean {
  return (e.bolsa?.classeId ?? e.classeId ?? '') === 'guerreiro' && !e.invocacao;
}

/** A fúria agora (0..max), já descontado o esvaziamento. */
export function furiaAtual(ctx: Pick<ContextoSimulacao, 'balance'>, e: Entidade, tick: number): number {
  const f = e.furia;
  if (!f) return 0;
  const r = ctx.balance.ajustesClasses.guerreiro.furia;
  // Marco 24 (D-094): no Frenesi a barra fica cheia; no fim, zera (o que veio depois soma do zero).
  if (f.frenesiAteTick !== undefined) {
    if (tick < f.frenesiAteTick) return r.max;
    if (f.ultimoTick < f.frenesiAteTick) return 0;
  }
  const parado = tick - f.ultimoTick - ticksDe(r.carenciaMs);
  if (parado <= 0) return f.valor;
  return Math.max(0, f.valor - (parado * r.perdaPorS) / ticksDe(1000));
}

/** Fração da barra (0..1) para o HUD; null quando a entidade não tem fúria. */
export function fracaoFuria(ctx: ContextoSimulacao, e: Entidade, tick: number): number | null {
  if (!temFuria(e)) return null;
  return furiaAtual(ctx, e, tick) / ctx.balance.ajustesClasses.guerreiro.furia.max;
}

/**
 * Um ataque básico que feriu: soma à barra (até o máximo) e renova a carência. Marco 24 (24/10/2026): `quanto` vem do
 * efeito `furia` (Desafio, Contragolpe); sem ele, vale o do básico. Devolve se a barra encheu agora.
 */
export function acumularFuria(ctx: ContextoSimulacao, e: Entidade, tick: number, quanto?: number): boolean {
  if (!temFuria(e)) return false;
  const r = ctx.balance.ajustesClasses.guerreiro.furia;
  const antes = furiaAtual(ctx, e, tick);
  if (emFrenesi(e, tick)) return false;
  // Marco 28 (D-127): a Bravura enche a barra mais rápido.
  e.furia = { valor: Math.min(r.max, antes + (quanto ?? r.porBasico) * fatorDeDominio(ctx, e, 'furia')), ultimoTick: tick };
  // Marco 24 (D-094): devolve se a barra acabou de encher (a fúria cheia enche a ultimate).
  return antes < r.max && e.furia.valor >= r.max;
}

/** Multiplicador das curas do próprio Guerreiro: `curaMult` com a barra cheia, senão 1. */
export function multiplicadorFuria(ctx: ContextoSimulacao, e: Entidade, tick: number): number {
  if (!temFuria(e)) return 1;
  const r = ctx.balance.ajustesClasses.guerreiro.furia;
  return furiaAtual(ctx, e, tick) >= r.max ? r.curaMult : 1;
}

/** Marco 24 (24/10/2026, D-094): o Guerreiro está em Frenesi (fúria cheia, por `frenesi.duracaoMs`). */
export function emFrenesi(e: Entidade, tick: number): boolean {
  return e.furia?.frenesiAteTick !== undefined && tick < e.furia.frenesiAteTick;
}

/** No Frenesi, o ataque básico fica tanto % mais rápido (somado à redução de recarga do básico). */
export function velocidadeFrenesiPct(ctx: Pick<ContextoSimulacao, 'balance'>, e: Entidade, tick: number): number {
  return emFrenesi(e, tick) ? ctx.balance.ajustesClasses.guerreiro.furia.frenesi.velocidadeAtaquePct : 0;
}

/** Marca o início do Frenesi na barra (o estado `frenesi`, com o dano e as variantes, vem de `encherFuria`). */
export function marcarFrenesi(ctx: Pick<ContextoSimulacao, 'balance'>, e: Entidade, tick: number): void {
  const r = ctx.balance.ajustesClasses.guerreiro.furia;
  e.furia = { valor: r.max, ultimoTick: tick, frenesiAteTick: tick + ticksDe(r.frenesi.duracaoMs) };
}
