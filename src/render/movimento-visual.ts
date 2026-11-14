// Marco 40 (13/11/2026, D-164): o que o movimento da classe muda no corpo desenhado — quem voa sobe, a névoa e a
// camuflagem ficam translúcidas. Só lê a entidade (o núcleo emite o modo; o desenho fica aqui).

import type { Entidade } from '../entities/entidade';

/** Quantos pixels o corpo sobe na tela (o voo; decolando, meio caminho). */
export function elevacaoNaTela(e: Entidade): number {
  const m = e.movimentoClasse?.modo;
  if (!m) return 0;
  if (m.tipo === 'voo') return 18;
  return m.tipo === 'preparo' && m.destino === 'voo' ? 8 : 0;
}

/** A transparência do corpo: morto apagado, invisível ou camuflado translúcido, névoa quase sumida, eco do Necromante. */
export function alfaDoCorpo(e: Entidade, tick: number): number {
  if (e.morto) return 0.25;
  if (e.movimentoClasse?.modo?.tipo === 'nevoa') return 0.35;
  if (e.invisivelAteTick > tick) return 0.5;
  return e.invocacao?.necromancia === 'eco' ? 0.7 : 1;
}
