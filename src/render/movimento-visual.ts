// Marco 40 (13/11/2026, D-164): o que o movimento da classe muda no corpo desenhado — quem voa sobe, a névoa e a
// camuflagem ficam translúcidas. Só lê a entidade (o núcleo emite o modo; o desenho fica aqui).

import type { Entidade } from '../entities/entidade';

/** Quantos pixels o corpo sobe na tela (o voo; o salto, em arco até a queda). */
export function elevacaoNaTela(e: Entidade): number {
  const m = e.movimentoClasse?.modo;
  if (!m) return 0;
  if (m.tipo === 'voo') return 18;
  if (m.tipo !== 'salto' || m.x === undefined || m.y === undefined) return 0;
  // O salto: um arco que sobe no meio do caminho (pela distância que falta até a queda).
  const falta = Math.hypot(m.x - e.px, m.y - e.py);
  return Math.min(28, falta * 6);
}

/** A transparência do corpo: morto apagado, invisível ou camuflado translúcido, névoa quase sumida, eco do Necromante. */
export function alfaDoCorpo(e: Entidade, tick: number): number {
  if (e.morto) return 0.25;
  if (e.movimentoClasse?.modo?.tipo === 'nevoa') return 0.35;
  if (e.invisivelAteTick > tick) return 0.5;
  return e.invocacao?.necromancia === 'eco' ? 0.7 : 1;
}
