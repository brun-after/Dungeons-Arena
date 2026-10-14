// Som posicional (§2.14). Marco 12 (14/10/2026), D-056. Puro: o volume cai linearmente com a distância
// em células até o silêncio a 20 células, com multiplicador global de 0,75; o pan estéreo vem da
// diferença de X entre a fonte e o ouvinte (a câmera), limitada a ±1.

export const DISTANCIA_SILENCIO = 20;
export const MULTIPLICADOR_POSICIONAL = 0.75;
/** Células de diferença horizontal para o pan chegar ao extremo. */
const LARGURA_PAN = 12;

export function volumePorDistancia(distancia: number): number {
  if (distancia >= DISTANCIA_SILENCIO) return 0;
  return MULTIPLICADOR_POSICIONAL * (1 - Math.max(0, distancia) / DISTANCIA_SILENCIO);
}

export function panPorPosicao(fonteX: number, ouvinteX: number): number {
  return Math.max(-1, Math.min(1, (fonteX - ouvinteX) / LARGURA_PAN));
}

export function distancia(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}
