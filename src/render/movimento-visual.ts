// Marco 40 (13/11/2026, D-164): a transparência de base do corpo desenhado. A altura do voo e do salto, a névoa e a
// montaria saem de render/movimento/corpo-movimento.ts (o ajuste do corpo), que multiplica esta transparência.

import type { Entidade } from '../entities/entidade';
import type { ModoDeJogo } from '../modos/modo';
import { relacao } from '../modos/relacao';

/** D-170: o invisível (o Arqueiro camuflado) some para o jogador hostil; o aliado o vê translúcido. */
export function sumidoPara(e: Entidade, local: Entidade | undefined, tick: number, modo: ModoDeJogo): boolean {
  return e.invisivelAteTick > tick && !!local && local.id !== e.id && relacao(local, e, modo) === 'hostil';
}

/** A transparência do corpo: morto apagado, invisível ou camuflado translúcido, eco do Necromante. */
export function alfaDoCorpo(e: Entidade, tick: number): number {
  if (e.morto) return 0.25;
  if (e.invisivelAteTick > tick) return 0.5;
  return e.invocacao?.necromancia === 'eco' ? 0.7 : 1;
}
