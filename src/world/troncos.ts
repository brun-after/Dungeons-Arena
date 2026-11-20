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
 * 20/11/2026: se o ponto cai onde o corpo (raio `r`) não cabe por causa de um tronco, leva-o para rente ao tronco, do
 * lado de `de` (quem chega). Mira o centro da árvore era o que fazia o corpo girar em volta dela para sempre: o tronco
 * nunca deixa chegar, e o escorregar vira uma órbita. Devolve se mudou o ponto.
 */
export function renteAoTronco(fase: Fase, de: { x: number; y: number }, ponto: { x: number; y: number }, r: number, tronco: number): boolean {
  if (!fase.obstaculos) return false;
  const raio = r + tronco + FOLGA_DO_TRONCO;
  let mudou = false;
  for (let j = Math.round(ponto.y) - 1; j <= Math.round(ponto.y) + 1; j++) {
    for (let i = Math.round(ponto.x) - 1; i <= Math.round(ponto.x) + 1; i++) {
      if (!temTronco(fase, i, j)) continue;
      const dx = ponto.x - i;
      const dy = ponto.y - j;
      if (dx * dx + dy * dy >= raio * raio) continue;
      // Do tronco para quem chega (se quem chega está no próprio tronco, do tronco para o ponto).
      let ux = de.x - i;
      let uy = de.y - j;
      let d = Math.sqrt(ux * ux + uy * uy);
      if (d < 1e-6) {
        ux = dx;
        uy = dy;
        d = Math.sqrt(ux * ux + uy * uy);
      }
      if (d < 1e-6) {
        ux = 0;
        uy = 1;
        d = 1;
      }
      ponto.x = i + (ux / d) * raio;
      ponto.y = j + (uy / d) * raio;
      mudou = true;
    }
  }
  return mudou;
}

/** A folga (células) entre o corpo e o tronco onde o ponto rente termina. */
const FOLGA_DO_TRONCO = 0.02;

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
