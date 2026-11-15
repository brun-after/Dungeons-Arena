// A luz própria (marco 42, 15/11/2026, D-176): a tocha é um efeito com o gancho `ilumina` (combat/registro-efeitos.ts).
// Quem nada ou leva uma rajada de vento fica sem luz. Puro.

import type { ContextoSimulacao } from '../core/contexto';
import { ticksDe } from '../core/tempo';
import type { Entidade } from '../entities/entidade';
import { REGISTRO_EFEITOS } from './registro-efeitos';

/** O portador leva luz própria agora. */
export function temLuzPropria(e: Pick<Entidade, 'efeitos'>): boolean {
  return e.efeitos.some((f) => REGISTRO_EFEITOS[f.tipo].ilumina);
}

/** Apaga toda luz própria do portador (devolve se apagou alguma). */
export function apagarLuz(e: Entidade): boolean {
  const antes = e.efeitos.length;
  e.efeitos = e.efeitos.filter((f) => !REGISTRO_EFEITOS[f.tipo].ilumina);
  return e.efeitos.length < antes;
}

/**
 * Marco 44 (15/11/2026, D-178): a tocha que chega ao fim do tempo passa a queimar a mana do portador, um segundo por vez;
 * quando a mana não paga o segundo, ela apaga. Chamado antes da expiração dos efeitos.
 */
export function sustentarLuzComMana(ctx: ContextoSimulacao, e: Entidade, tick: number): void {
  const t = ctx.balance.mundo.tocha;
  for (const f of e.efeitos) {
    if (f.ateTick > tick || !REGISTRO_EFEITOS[f.tipo].ilumina) continue;
    const custo = Math.max(t.manaMin, Math.ceil((e.manaMax * t.manaPct) / 100));
    if (e.mana < custo) continue;
    e.mana -= custo;
    f.ateTick = tick + ticksDe(1000);
  }
}
