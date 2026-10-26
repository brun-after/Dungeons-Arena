// Marco 26 (25/10/2026, D-108): braços e pernas animados por quadros do atlas. Os geradores (bipede.ts, feras.ts)
// desenham cada quadro com os membros girados em torno do quadril e do ombro; o jogo escolhe o quadro pela fase da
// passada (render/caminhada.ts), e no golpe mostra o braço da arma estendido. Roda no Node no build (atlas) e no
// cliente: só números, sem DOM.

/** Quadros por vista dos modelos animados: 0 parado, 1–2 a perna esquerda à frente, 3–4 a direita, 5 o golpe. */
export const QUADROS_MEMBROS = 6;
export const QUADRO_GOLPE = 5;

/** O balanço de cada quadro, de −1 a 1 (positivo: a perna esquerda à frente e o braço direito também). */
export const BALANCO: readonly number[] = [0, 0.5, 1, -0.5, -1, 0.35];

/** Ângulos máximos, em graus: a perna e o braço no pico da passada; o braço da arma no golpe. */
export const GRAUS_PERNA = 34;
export const GRAUS_BRACO = 30;
export const GRAUS_GOLPE = 78;

/** O quadro da passada para o balanço `s` (−1 a 1): o ciclo sai 1, 2, 1, 0, 3, 4, 3, 0 com `s` senoidal. */
export function quadroDoBalanco(s: number): number {
  if (s >= 0.75) return 2;
  if (s >= 0.25) return 1;
  if (s <= -0.75) return 4;
  if (s <= -0.25) return 3;
  return 0;
}

/** Os ângulos (rad) dos membros num quadro: positivo gira para +x (a frente do modelo, que olha para a direita). */
export function angulosDoQuadro(quadro: number): { pernaE: number; pernaD: number; bracoE: number; bracoD: number } {
  const b = BALANCO[quadro] ?? 0;
  const rad = Math.PI / 180;
  if (quadro === QUADRO_GOLPE) {
    return { pernaE: GRAUS_PERNA * b * rad, pernaD: -GRAUS_PERNA * b * rad, bracoE: -20 * rad, bracoD: GRAUS_GOLPE * rad };
  }
  return { pernaE: GRAUS_PERNA * b * rad, pernaD: -GRAUS_PERNA * b * rad, bracoE: -GRAUS_BRACO * b * rad, bracoD: GRAUS_BRACO * b * rad };
}

/** A ponta de um membro que pende de (x, y), com `comprimento` e girado `angulo` (0: para baixo). */
export function pontaDoMembro(x: number, y: number, comprimento: number, angulo: number): { x: number; y: number } {
  return { x: x + Math.sin(angulo) * comprimento, y: y + Math.cos(angulo) * comprimento };
}

/** Os quatro cantos do membro (um retângulo de `largura`), da raiz em (x, y) até a ponta. */
export function cantosDoMembro(x: number, y: number, comprimento: number, largura: number, angulo: number): number[] {
  const ux = Math.sin(angulo);
  const uy = Math.cos(angulo);
  const px = (uy * largura) / 2;
  const py = (-ux * largura) / 2;
  const fx = x + ux * comprimento;
  const fy = y + uy * comprimento;
  return [x - px, y - py, x + px, y + py, fx + px, fy + py, fx - px, fy - py];
}
