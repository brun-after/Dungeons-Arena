// Ruído de valor em coordenadas de mundo (marco 31, 31/10/2026, D-130). O chão texturizado (render/solo/) usa o
// ruído para entortar as bordas entre os tipos de chão e para a variação de escala grande; como é função da
// posição no mundo (não do bloco), dois blocos vizinhos calculam o mesmo valor na borda e não há emenda. Puro.

/** Hash de um ponto inteiro com semente, em [0, 1). */
export function hash2(x: number, y: number, semente: number): number {
  let h = Math.imul(x, 0x27d4eb2d) ^ Math.imul(y, 0x165667b1) ^ Math.imul(semente, 0x9e3779b1);
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  h = Math.imul(h, 0x297a2d39);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

const suave = (t: number) => t * t * (3 - 2 * t);

/** Ruído de valor 2D, contínuo, em [0, 1). */
export function ruidoValor(x: number, y: number, semente: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = suave(x - x0);
  const ty = suave(y - y0);
  const a = hash2(x0, y0, semente);
  const b = hash2(x0 + 1, y0, semente);
  const c = hash2(x0, y0 + 1, semente);
  const d = hash2(x0 + 1, y0 + 1, semente);
  return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
}

/** Três oitavas somadas (fbm), em [0, 1). */
export function fbm(x: number, y: number, semente: number): number {
  return (ruidoValor(x, y, semente) * 0.57 + ruidoValor(x * 2.03, y * 2.03, semente + 17) * 0.29 + ruidoValor(x * 4.1, y * 4.1, semente + 31) * 0.14);
}

export function smoothstep(a: number, b: number, v: number): number {
  const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
