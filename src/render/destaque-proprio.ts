// O destaque do personagem do jogador (marco 53, 22/11/2026, D-203): no meio de outros jogadores e de monstros, o
// seu boneco tem uma aura dourada no chão, que pulsa devagar, com quatro pontas viradas para fora. A barra de vida
// dele ganha a moldura dourada (render/sprites.ts). Desenha no Graphics dos anéis, redesenhado a cada quadro.

import type { Graphics } from 'pixi.js';

const COR = 0xf5c542;
const PERIODO_MS = 1800;

/** `r`: o raio do anel do chão; `k`: o achatamento (0,5 no isométrico); `agoraMs` 0 sem animação. */
export function desenharDestaqueProprio(g: Graphics, r: number, k: number, agoraMs: number): void {
  const fase = agoraMs > 0 ? (agoraMs % PERIODO_MS) / PERIODO_MS : 0.5;
  const pulso = 0.5 + 0.5 * Math.sin(fase * Math.PI * 2);
  const raio = r + 4 + pulso * 2;
  g.ellipse(0, 0, raio + 3, (raio + 3) * k).fill({ color: COR, alpha: 0.08 + 0.06 * pulso });
  g.ellipse(0, 0, raio, raio * k).stroke({ width: 2, color: COR, alpha: 0.55 + 0.35 * pulso });
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
    const x = dx * (raio + 2);
    const y = dy * (raio + 2) * k;
    const l = 5;
    g.moveTo(x + dy * l * 0.6, y - dx * l * 0.6 * k)
      .lineTo(x + dx * l, y + dy * l * k)
      .lineTo(x - dy * l * 0.6, y + dx * l * 0.6 * k)
      .closePath()
      .fill({ color: COR, alpha: 0.75 });
  }
}
