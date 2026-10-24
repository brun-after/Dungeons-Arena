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
    // Inclui as células tocadas pela margem, mesmo quando o centro delas está fora do efeito.
    // Assim a poça tem contorno contínuo e não revela uma cruz de blocos.
    if ((x - a.x) ** 2 + (y - a.y) ** 2 > (a.raio + 1) ** 2) continue;
    const cor = CORES_AMBIENTE[a.tipo];
    const cx = (x + 0.5) * p, cy = (y + 0.5) * p;
    const borda = margem(a, x, y);
    if (borda.length < 6) continue;
    g.poly(borda).fill({ color: cor, alpha: 0.28 });
    if (!dentroDaArea(a, x, y)) continue;
    if (a.tipo === 'agua') {
      g.moveTo(cx - 9, cy - 3).quadraticCurveTo(cx - 2, cy - 6, cx + 7, cy - 3).stroke({ width: 1.5, color: 0x93d6df, alpha: 0.48 });
    } else if (a.tipo === 'brasas') {
      g.moveTo(cx - 9, cy + 4).lineTo(cx - 3, cy - 2).lineTo(cx + 3, cy + 2).lineTo(cx + 8, cy - 6).stroke({ width: 2, color: 0xffab5c, alpha: 0.7 });
      g.circle(cx + 5, cy + 6, 1.6).fill(0xffce7e);
    } else if (a.tipo === 'miasma') {
      for (const [dx, dy] of [[-6, 2], [5, -4], [8, 6]]) g.circle(cx + (dx ?? 0), cy + (dy ?? 0), 2.5).stroke({ width: 1.5, color: 0xa6d583, alpha: 0.6 });
    } else if (a.tipo === 'gelo_fino') {
      // Marco 23 (D-092): as cinco áreas novas, cada uma com o seu traço.
      g.moveTo(cx - 10, cy - 6).lineTo(cx - 1, cy + 1).lineTo(cx + 9, cy - 4).moveTo(cx - 1, cy + 1).lineTo(cx + 2, cy + 10);
      g.stroke({ width: 1.3, color: 0xffffff, alpha: 0.6 });
    } else if (a.tipo === 'campo_eletrico') {
      g.moveTo(cx - 9, cy - 5).lineTo(cx - 2, cy + 1).lineTo(cx - 5, cy + 3).lineTo(cx + 6, cy + 9).stroke({ width: 1.6, color: 0xfff3a0, alpha: 0.75 });
    } else if (a.tipo === 'lama') {
      for (const [dx, dy, r] of [[-6, 3, 4], [6, -3, 3], [3, 8, 2.5]] as const) g.ellipse(cx + dx, cy + dy, r * 1.4, r).fill({ color: 0x4a3a24, alpha: 0.5 });
    } else if (a.tipo === 'nevoa_sombria') {
      for (const [dx, dy] of [[-7, -2], [6, 3]] as const) g.ellipse(cx + dx, cy + dy, 9, 4).fill({ color: 0x2a1840, alpha: 0.35 });
    } else {
      g.circle(cx, cy, 5).fill({ color: 0xfff6c8, alpha: 0.35 });
      g.moveTo(cx, cy - 9).lineTo(cx, cy + 9).moveTo(cx - 9, cy).lineTo(cx + 9, cy).stroke({ width: 1.2, color: 0xfff6c8, alpha: 0.5 });
    }
  }
}
