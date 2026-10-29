// Base da pintura das texturas ricas (marco 26, 29/10/2026, D-124): o lado da célula, o PRNG fixo e os atalhos de
// gradiente e cor usados pelos desenhos.

export const LADO_RICO = 64;

/** PRNG fixo: o atlas sai igual em toda abertura (e não toca o PRNG da simulação). */
export function sorteador(semente: number): () => number {
  let s = semente >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type C2D = CanvasRenderingContext2D;
export const C = LADO_RICO / 2;

export function radial(g: C2D, x: number, y: number, r: number, paradas: readonly [number, string][]): CanvasGradient {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  for (const [o, c] of paradas) gr.addColorStop(o, c);
  return gr;
}

export const branco = (a: number) => `rgba(255,255,255,${a})`;
export const cinza = (v: number, a = 1) => `rgba(${v},${v},${v},${a})`;
