// Orientação e ataque pelas costas (marco 24, 24/10/2026, D-097). Cada entidade olha para onde deu o último passo ou
// para quem está atacando (`Entidade.olhando`, ausente = sul). Um golpe é pelas costas quando sai de trás desse olhar:
// o ângulo entre o olhar do alvo e a direção do alvo até o atacante passa de 180° − metade do cone das costas.
// Puro e em células: a direção vem do passo ou da mira, nunca do desenho.

import type { Celula, Dir8 } from '../core/comandos';
import type { Entidade } from '../entities/entidade';
import { celulaOcupada } from './geometria';

const DIRECOES: Readonly<Record<Dir8, readonly [number, number]>> = {
  N: [0, -1], NE: [1, -1], E: [1, 0], SE: [1, 1], S: [0, 1], SO: [-1, 1], O: [-1, 0], NO: [-1, -1],
};

/** A direção de 8 que mais se aproxima do vetor (dx, dy); null quando é zero. */
export function direcaoDe(dx: number, dy: number): Dir8 | null {
  if (dx === 0 && dy === 0) return null;
  const sx = Math.abs(dx) * 2 < Math.abs(dy) ? 0 : Math.sign(dx);
  const sy = Math.abs(dy) * 2 < Math.abs(dx) ? 0 : Math.sign(dy);
  for (const [d, [vx, vy]] of Object.entries(DIRECOES) as [Dir8, readonly [number, number]][]) if (vx === sx && vy === sy) return d;
  return null;
}

/** Para onde a entidade olha (saves e entidades antigas: sul). */
export function olharDe(e: Entidade): Dir8 {
  return e.olhando ?? 'S';
}

/** Vira a entidade para a célula (nada muda se é a própria célula). */
export function virarPara(e: Entidade, alvo: Celula): void {
  const c = celulaOcupada(e);
  const d = direcaoDe(alvo.x - c.x, alvo.y - c.y);
  if (d) e.olhando = d;
}

/**
 * O golpe que sai de `de` pega o alvo pelas costas? `coneGraus` é a abertura do cone de trás (135° pega a célula de
 * trás e as duas diagonais de trás). Da mesma célula nunca é pelas costas.
 */
export function pelasCostas(de: Celula, alvo: Entidade, coneGraus: number): boolean {
  const c = celulaOcupada(alvo);
  const ax = de.x - c.x;
  const ay = de.y - c.y;
  if (ax === 0 && ay === 0) return false;
  const [ox, oy] = DIRECOES[olharDe(alvo)];
  const cos = (ax * ox + ay * oy) / (Math.hypot(ax, ay) * Math.hypot(ox, oy));
  return cos <= -Math.cos((coneGraus / 2) * (Math.PI / 180)) + 1e-9;
}
