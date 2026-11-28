// Marco 56 (27/11/2026, D-209): as escadas das masmorras do Mundo, no lugar dos portais da saída e do retorno quando
// a fase tem andares (`fase.andar`). A de descer é um poço de pedra com os degraus sumindo no escuro; a de subir, quatro
// degraus em pé. Desenhadas à mão com Graphics: no isométrico em pé (os pés no centro da célula, na camada das
// entidades), de cima no chão.

import type { Graphics } from 'pixi.js';

export type SentidoDaEscada = 'descer' | 'subir';

const PEDRA = 0x6b6470;
const PEDRA_ESCURA = 0x3c3742;
const BORDA = 0x8d8592;
const BREU = 0x07060a;

/** Um losango (o chão de uma célula no isométrico) de meia largura `l` e meia altura `a`, centrado em (x, y). */
function losango(g: Graphics, x: number, y: number, l: number, a: number): Graphics {
  return g.poly([x, y - a, x + l, y, x, y + a, x - l, y]);
}

/** Mistura duas cores (k = 0, a primeira; 1, a segunda). */
function misturar(a: number, b: number, k: number): number {
  const canal = (d: number) => Math.round(((a >> d) & 0xff) * (1 - k) + ((b >> d) & 0xff) * k);
  return (canal(16) << 16) | (canal(8) << 8) | canal(0);
}

/** A escada no isométrico, com os pés em (0, 0); `cor` tinge a borda de leve (o tema do andar). */
export function escadaEmPe(g: Graphics, sentido: SentidoDaEscada, cor: number): void {
  const borda = misturar(BORDA, cor, 0.25);
  if (sentido === 'descer') {
    // O poço: a borda de pedra, o vão escuro e os degraus descendo para o fundo (para trás e mais escuros).
    losango(g, 0, 0, 26, 15).fill({ color: borda });
    losango(g, 0, 0, 21, 12).fill({ color: BREU });
    for (let i = 0; i < 4; i++) {
      const k = i / 4;
      const y = 6 - i * 4.5;
      const x = 4 - i * 3;
      const l = 15 - i * 2.5;
      g.poly([x - l, y, x + l * 0.35, y - l * 0.6, x + l * 0.55, y - l * 0.48, x - l * 0.8, y + l * 0.12]).fill({ color: misturar(PEDRA, BREU, 0.25 + k * 0.6) });
    }
    losango(g, 0, 0, 21, 12).stroke({ width: 1.5, color: misturar(PEDRA_ESCURA, BREU, 0.4), alpha: 0.9 });
    return;
  }
  // Os degraus em pé: cada um com a face da frente e o topo, menor e mais alto que o de baixo.
  g.ellipse(0, 2, 26, 10).fill({ color: 0x000000, alpha: 0.3 });
  for (let i = 0; i < 4; i++) {
    const y = -i * 7;
    const x = -i * 3;
    const l = 20 - i * 2.5;
    const a = 11 - i * 1.2;
    const frente = misturar(PEDRA_ESCURA, cor, 0.1);
    g.poly([x - l, y, x, y + a, x, y + a + 6, x - l, y + 6]).fill({ color: frente });
    g.poly([x, y + a, x + l, y, x + l, y + 6, x, y + a + 6]).fill({ color: misturar(frente, 0x000000, 0.25) });
    losango(g, x, y, l, a).fill({ color: i === 3 ? borda : PEDRA }).stroke({ width: 1, color: PEDRA_ESCURA, alpha: 0.7 });
  }
}

/** A escada vista de cima, centrada em (cx, cy) numa célula de `lado` px. */
export function escadaDeCima(g: Graphics, cx: number, cy: number, lado: number, sentido: SentidoDaEscada, cor: number): void {
  const m = lado / 2 - 2;
  g.rect(cx - m, cy - m, m * 2, m * 2).fill({ color: sentido === 'descer' ? BREU : PEDRA_ESCURA }).stroke({ width: 2, color: misturar(BORDA, cor, 0.25) });
  const passo = (m * 2) / 5;
  for (let i = 1; i < 5; i++) {
    const k = sentido === 'descer' ? i / 5 : 1 - i / 5;
    g.rect(cx - m + 2, cy - m + i * passo - 2, m * 2 - 4, 3).fill({ color: misturar(PEDRA, BREU, k * 0.8) });
  }
}
