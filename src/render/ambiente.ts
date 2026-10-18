// 17/10/2026: superfícies orgânicas estáticas, desenhadas uma vez nos blocos já sujeitos ao culling.
import type { Graphics } from 'pixi.js';
import type { Fase } from '../world/fase';
import { CORES_AMBIENTE, dentroDaArea, type AreaAmbiente } from '../world/ambiente-tipos';
import { CELULA_PX } from './camera-calculo';

/** Recorta a mesma margem orgânica em cada célula: os pedaços se unem, sem círculos repetidos. */
function margem(a: AreaAmbiente, x: number, y: number): number[] {
  const p = CELULA_PX, cx = (a.x + 0.5) * p, cy = (a.y + 0.5) * p;
  let pontos = Array.from({ length: 32 }, (_, i) => {
    const angulo = i * Math.PI / 16;
    const raio = (a.raio + 0.38 + Math.sin(angulo * 3 + a.x) * 0.07) * p;
    return { x: cx + Math.cos(angulo) * raio, y: cy + Math.sin(angulo) * raio * 0.94 };
  });
  for (const [eixo, limite, sinal] of [['x', x * p, 1], ['x', (x + 1) * p, -1], ['y', y * p, 1], ['y', (y + 1) * p, -1]] as const) {
    const entrada = pontos; pontos = [];
    for (let i = 0; i < entrada.length; i++) {
      const de = entrada[i], para = entrada[(i + 1) % entrada.length];
      if (!de || !para) continue;
      const dentroDe = (de[eixo] - limite) * sinal >= 0, dentroPara = (para[eixo] - limite) * sinal >= 0;
      if (dentroDe) pontos.push(de);
      if (dentroDe !== dentroPara) {
        const t = (limite - de[eixo]) / (para[eixo] - de[eixo]);
        pontos.push({ x: de.x + (para.x - de.x) * t, y: de.y + (para.y - de.y) * t });
      }
    }
  }
  return pontos.flatMap((ponto) => [ponto.x, ponto.y]);
}
export function desenharAmbiente(g: Graphics, fase: Fase, x: number, y: number): void {
  const p = CELULA_PX;
  for (const a of fase.ambientes ?? []) {
    if (!dentroDaArea(a, x, y)) continue;
    const cor = CORES_AMBIENTE[a.tipo];
    const cx = (x + 0.5) * p, cy = (y + 0.5) * p;
    const borda = margem(a, x, y);
    if (borda.length >= 6) g.poly(borda).fill({ color: cor, alpha: 0.28 });
    if (a.tipo === 'agua') {
      g.moveTo(cx - 9, cy - 3).quadraticCurveTo(cx - 2, cy - 6, cx + 7, cy - 3).stroke({ width: 1.5, color: 0x93d6df, alpha: 0.48 });
    } else if (a.tipo === 'brasas') {
      g.moveTo(cx - 9, cy + 4).lineTo(cx - 3, cy - 2).lineTo(cx + 3, cy + 2).lineTo(cx + 8, cy - 6).stroke({ width: 2, color: 0xffab5c, alpha: 0.7 });
      g.circle(cx + 5, cy + 6, 1.6).fill(0xffce7e);
    } else {
      for (const [dx, dy] of [[-6, 2], [5, -4], [8, 6]]) g.circle(cx + (dx ?? 0), cy + (dy ?? 0), 2.5).stroke({ width: 1.5, color: 0xa6d583, alpha: 0.6 });
    }
  }
}
