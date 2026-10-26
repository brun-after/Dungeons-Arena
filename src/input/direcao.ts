// Conversões de direção usadas por teclado, joystick e D-pad (§4.3, §4.5). Funções puras.
// Marco 26 (25/10/2026, D-105): a entrada manda o vetor exato (`Rumo`), levado da tela à fase pela inversa da
// projeção; no isométrico, empurrar ao longo da inclinação do corredor anda exatamente no eixo da fase.

import type { Comando, Dir8 } from '../core/comandos';
import { direcaoDe } from '../combat/orientacao';
import { ESCALA_RUMO } from '../world/movimento';

/** A direção pedida: o octante (para quem só entende 8 direções) e o vetor exato, inteiro em ±`ESCALA_RUMO`. */
export interface Rumo {
  dir: Dir8 | 'parado';
  dx: number;
  dy: number;
}

export const PARADO: Rumo = { dir: 'parado', dx: 0, dy: 0 };

/**
 * Vetor de tela (y para baixo) -> vetor na fase, normalizado e quantizado. De cima é a identidade; no isométrico, a
 * inversa da projeção 2:1 (`tela = ((x − y)·k, (x + y)·k/2)`): `x = sx + 2·sy`, `y = 2·sy − sx`, a menos da escala.
 */
export function vetorDaTela(sx: number, sy: number, isometrico: boolean): Rumo {
  const wx = isometrico ? sx + 2 * sy : sx;
  const wy = isometrico ? 2 * sy - sx : sy;
  const n = Math.hypot(wx, wy);
  if (n === 0) return PARADO;
  // `|| 0`: sem −0 (o mesmo comando de um lado e do outro da rede).
  const dx = Math.round((wx / n) * ESCALA_RUMO) || 0;
  const dy = Math.round((wy / n) * ESCALA_RUMO) || 0;
  return { dir: direcaoDe(dx, dy) ?? 'parado', dx, dy };
}

/** O rumo de um octante da fase (o D-pad girado com o mapa manda o eixo da fase direto). */
export function rumoDoOctante(dir: Dir8 | 'parado'): Rumo {
  if (dir === 'parado') return PARADO;
  const [x, y] = VETOR[dir];
  return vetorDaTela(x, y, false);
}

/** O comando `mover` do rumo (parar não leva vetor). */
export function comandoMover(r: Rumo): Comando {
  return r.dir === 'parado' ? { t: 'mover', dir: 'parado' } : { t: 'mover', dir: r.dir, dx: r.dx, dy: r.dy };
}

/** Os dois rumos diferem mais que `cos` (o joystick só reemite quando o ângulo muda de verdade, poupando rede). */
export function rumoMudou(a: Rumo, b: Rumo, cos = COS_REEMITIR): boolean {
  if (a.dir === 'parado' || b.dir === 'parado') return a.dir !== b.dir;
  return (a.dx * b.dx + a.dy * b.dy) / (ESCALA_RUMO * ESCALA_RUMO) < cos;
}

/** Cerca de 3°: abaixo disso, o joystick não reemite. */
const COS_REEMITIR = Math.cos((3 * Math.PI) / 180);

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

/** Uma direção de tela (teclado: setas e WASD) levada à fase (§4.5, marco 26: pela inversa da projeção). */
export function rumoDaTela(dir: Dir8 | 'parado', isometrico: boolean): Rumo {
  if (dir === 'parado') return PARADO;
  const [tx, ty] = VETOR[dir];
  return vetorDaTela(tx, ty, isometrico);
}

/** Sentido do sprite pelo X de tela (§4.5): no isométrico, `movTelaX = dx − dy`. */
export function movimentoTelaX(dx: number, dy: number, isometrico: boolean): number {
  return isometrico ? dx - dy : dx;
}
