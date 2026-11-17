// 16/11/2026 (D-184): o desenho da luz de XP (progression/orbe-xp.ts). Uma luzinha dourada-clara que flutua: o halo e
// o núcleo crescem e ficam mais opacos com o `brilho` (0,15 a 1, pela quantidade de XP); com a sorte (3× ou 5×), um
// anel de faíscas gira em volta, mais cheio no 5×.

import type { Graphics } from 'pixi.js';

export const COR_ORBE_XP = 0xffe27a;

/** `pulso` em px (0 com movimento reduzido); `tMs` 0 com movimento reduzido (as faíscas param). */
export function desenharOrbeXp(g: Graphics, cx: number, cy: number, brilho: number, sorte: number, pulso: number, tMs: number): void {
  const b = Math.max(0.15, Math.min(1, brilho));
  const r = 2.5 + 4.5 * b;
  g.circle(cx, cy, r * 3.2 + pulso).fill({ color: COR_ORBE_XP, alpha: 0.06 + 0.12 * b });
  g.circle(cx, cy, r * 1.9 + pulso * 0.5).fill({ color: COR_ORBE_XP, alpha: 0.12 + 0.22 * b });
  g.circle(cx, cy, r).fill({ color: COR_ORBE_XP, alpha: 0.55 + 0.45 * b });
  g.circle(cx - r * 0.25, cy - r * 0.3, r * 0.45).fill({ color: 0xffffff, alpha: 0.6 + 0.35 * b });
  if (sorte <= 1) return;
  const n = sorte >= 5 ? 8 : 5;
  const raio = r * 2.6;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + tMs / 600;
    g.circle(cx + Math.cos(a) * raio, cy + Math.sin(a) * raio * 0.7, sorte >= 5 ? 1.8 : 1.4).fill({ color: 0xfff6d0, alpha: 0.9 });
  }
}
