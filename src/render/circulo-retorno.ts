// O círculo da Pedra de retorno (marco 38, 08/11/2026, D-142), no chão em volta de quem conjura: três anéis de runas
// azuis girando em sentidos opostos, o arco do progresso dos 5 s fechando por fora e as faíscas subindo do anel.
// No último segundo (sair desvia a magia) o círculo fica âmbar e pulsa mais rápido. Só desenho, no plano (o
// isométrico o deita no chão).

import type { Graphics } from 'pixi.js';
import type { ObjetoNoMundo } from '../core/estado';
import { CELULA_PX } from './camera-calculo';

const AZUL = 0x7fd8ff;
const AMBAR = 0xffb347;

/** `fracao` (0 a 1) do progresso; `perigo`: o último segundo; `tMs` 0 com movimento reduzido. */
export function desenharCirculoDeRetorno(g: Graphics, cx: number, cy: number, raioCelulas: number, fracao: number, perigo: boolean, tMs: number): void {
  const R = raioCelulas * CELULA_PX;
  const cor = perigo ? AMBAR : AZUL;
  const pulso = 0.5 + 0.5 * Math.sin(tMs / (perigo ? 90 : 260));
  const giro = tMs / 1800;
  g.circle(cx, cy, R).fill({ color: cor, alpha: 0.08 + 0.08 * pulso });
  g.circle(cx, cy, R).stroke({ width: 2.4, color: cor, alpha: 0.85 });
  g.circle(cx, cy, R * 0.78).stroke({ width: 1.4, color: cor, alpha: 0.7 });
  g.circle(cx, cy, R * 0.42).stroke({ width: 1.2, color: cor, alpha: 0.6 });
  // As runas entre os dois anéis de fora, girando; o hexagrama no meio, ao contrário.
  for (let i = 0; i < 12; i++) {
    const ang = giro + (i * Math.PI) / 6;
    const x = cx + Math.cos(ang) * R * 0.89;
    const y = cy + Math.sin(ang) * R * 0.89;
    const t = ang + Math.PI / 2;
    g.moveTo(x - Math.cos(t) * 4, y - Math.sin(t) * 4).lineTo(x + Math.cos(t) * 4, y + Math.sin(t) * 4).stroke({ width: 1.5, color: cor, alpha: 0.9 });
    if (i % 3 === 0) g.circle(x, y, 1.6).fill({ color: 0xffffff, alpha: 0.8 });
  }
  for (const desloca of [0, Math.PI / 3]) {
    const pontos: number[] = [];
    for (let k = 0; k < 3; k++) {
      const ang = -giro * 1.4 + desloca + (k * 2 * Math.PI) / 3;
      pontos.push(cx + Math.cos(ang) * R * 0.72, cy + Math.sin(ang) * R * 0.72);
    }
    g.poly(pontos).stroke({ width: 1.2, color: cor, alpha: 0.65 });
  }
  // O progresso: o arco por fora, do topo no sentido horário.
  if (fracao > 0) {
    const ini = -Math.PI / 2;
    g.moveTo(cx + Math.cos(ini) * (R + 5), cy + Math.sin(ini) * (R + 5));
    g.arc(cx, cy, R + 5, ini, ini + Math.PI * 2 * Math.min(1, fracao)).stroke({ width: 3, color: 0xffffff, alpha: 0.9 });
  }
  // As faíscas subindo (no plano, para o norte; deitado no isométrico, parecem correr em volta).
  for (let i = 0; i < 10; i++) {
    const ang = i * 2.39996 + giro * 2;
    const vida = ((tMs / 900 + i * 0.137) % 1 + 1) % 1;
    const r = R * (0.3 + 0.65 * ((i * 0.618) % 1));
    g.circle(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r - vida * 10, 1.8 * (1 - vida) + 0.6).fill({ color: cor, alpha: 0.9 * (1 - vida) });
  }
}

/** A fração e o perigo do círculo no tick. */
export function progressoDoCirculo(o: ObjetoNoMundo, tick: number, ultimoTicks: number): { fracao: number; perigo: boolean } {
  const total = Math.max(1, o.valor - o.abertoTick);
  const passou = tick - o.abertoTick;
  return { fracao: Math.max(0, Math.min(1, passou / total)), perigo: o.valor - tick <= ultimoTicks };
}
