// Geometria de combate na grade: alcance por Chebyshev (§2.7, §4.7) e a célula que uma
// entidade ocupa para fins de acerto (marco 26: a do centro dela, que anda livre).

import type { Celula } from '../core/comandos';
import type { Entidade } from '../entities/entidade';

export function chebyshev(a: Celula, b: Celula): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

/** A célula onde está o centro da entidade (marco 26, D-104: o arredondamento da posição contínua). */
export function celulaOcupada(e: Pick<Entidade, 'x' | 'y'>): Celula {
  return { x: e.x, y: e.y };
}

export function dentroDoQuadrado(c: Celula, centro: Celula, raio: number): boolean {
  return Math.abs(c.x - centro.x) <= raio && Math.abs(c.y - centro.y) <= raio;
}
