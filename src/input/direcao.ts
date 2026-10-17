// Conversões de direção usadas por teclado, joystick e D-pad (§4.3, §4.5). Funções puras.

import type { Dir8 } from '../core/comandos';

/** Eixo Y da tela cresce para baixo, como o da grade. */
export function dirDeVetor(dx: number, dy: number): Dir8 | 'parado' {
  const sx = Math.sign(dx);
  const sy = Math.sign(dy);
  if (sx === 0 && sy === 0) return 'parado';
  if (sy < 0) return sx > 0 ? 'NE' : sx < 0 ? 'NO' : 'N';
  if (sy > 0) return sx > 0 ? 'SE' : sx < 0 ? 'SO' : 'S';
  return sx > 0 ? 'E' : 'O';
}

const SETORES: readonly Dir8[] = ['E', 'SE', 'S', 'SO', 'O', 'NO', 'N', 'NE'];

export const ZONA_MORTA_JOYSTICK_PX = 14;

/**
 * Setor do joystick (§4.3): 8 setores de 45°, a partir do deslocamento do botão em px de tela.
 * `setor = round(((atan2(y, x) × 180/π) + 360) % 360 / 45) % 8`.
 */
export function setorJoystick(dx: number, dy: number, zonaMorta = ZONA_MORTA_JOYSTICK_PX): Dir8 | 'parado' {
  if (Math.hypot(dx, dy) < zonaMorta) return 'parado';
  const graus = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
  return SETORES[Math.round(graus / 45) % 8] ?? 'parado';
}

/** Limita o deslocamento do botão do joystick ao raio máximo (§4.3: 50 px). */
export function limitarRaio(dx: number, dy: number, raio: number): { x: number; y: number } {
  const d = Math.hypot(dx, dy);
  if (d <= raio || d === 0) return { x: dx, y: dy };
  return { x: (dx / d) * raio, y: (dy / d) * raio };
}

const VETOR: Readonly<Record<Dir8, readonly [number, number]>> = {
  N: [0, -1],
  NE: [1, -1],
  E: [1, 0],
  SE: [1, 1],
  S: [0, 1],
  SO: [-1, 1],
  O: [-1, 0],
  NO: [-1, -1],
};

/**
 * Remapeamento tela -> grade (§4.5). No isométrico, "para cima" na tela é NO na grade:
 * grade = (tx + ty, −tx + ty), com sinais normalizados. Fora do isométrico é identidade.
 */
export function remapearParaGrade(dir: Dir8 | 'parado', isometrico: boolean): Dir8 | 'parado' {
  if (!isometrico || dir === 'parado') return dir;
  const [tx, ty] = VETOR[dir];
  return dirDeVetor(tx + ty, -tx + ty);
}

/** Sentido do sprite pelo X de tela (§4.5): no isométrico, `movTelaX = dx − dy`. */
export function movimentoTelaX(dx: number, dy: number, isometrico: boolean): number {
  return isometrico ? dx - dy : dx;
}
