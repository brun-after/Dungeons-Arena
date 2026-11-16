// Os troncos (marco 44, 15/11/2026, D-178). A árvore não é mais parede: anda-se por entre elas, e só o tronco, fino,
// barra o corpo (um círculo de `movimento.raioTronco` no centro da célula da árvore). Quem já está encostado no tronco
// pode sempre se afastar (só não pode chegar mais perto). A navegação contorna as células com tronco (as árvores têm
// sempre uma célula livre entre elas, world/geografia.ts). Puro.

import type { Fase } from './fase';
import { OBSTACULO } from './geografia';

/** A célula tem uma árvore (o tronco no centro dela). */
export function temTronco(fase: Fase, x: number, y: number): boolean {
  const o = fase.obstaculos;
  if (!o || x < 0 || y < 0 || x >= fase.largura || y >= fase.altura) return false;
  return o[y * fase.largura + x] === OBSTACULO.arvore;
}

/**
 * Ir de (ax, ay) a (bx, by) bate num tronco? Bate quando o corpo (raio `r`) chegaria a menos de `r + tronco` de um
 * tronco e mais perto dele do que estava.
 */
export function troncoBarra(fase: Fase, ax: number, ay: number, bx: number, by: number, r: number, tronco: number): boolean {
  if (!fase.obstaculos) return false;
  const limite = (r + tronco) * (r + tronco);
  for (let j = Math.round(by) - 1; j <= Math.round(by) + 1; j++) {
    for (let i = Math.round(bx) - 1; i <= Math.round(bx) + 1; i++) {
      if (!temTronco(fase, i, j)) continue;
      const depois = (bx - i) * (bx - i) + (by - j) * (by - j);
      if (depois < limite && depois < (ax - i) * (ax - i) + (ay - j) * (ay - j)) return true;
    }
  }
  return false;
}
