// PRNG semeado e serializável (§2.1 "Tudo é semeado", §3.6 checkpoint inclui PRNG).
// O estado é dado puro: pode ser clonado, comparado no digest e gravado em checkpoint.
// Algoritmo: sfc32 (Small Fast Counter), 128 bits de estado, saída de 32 bits.

export interface EstadoRng {
  a: number;
  b: number;
  c: number;
  d: number;
}

/** Hash de texto em 32 bits (FNV-1a). Usado para `semente = hash(faseId)`. */
export function hashTexto(texto: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function criarRng(semente: number): EstadoRng {
  const rng: EstadoRng = {
    a: 0x9e3779b9,
    b: 0x243f6a88,
    c: 0xb7e15162,
    d: semente >>> 0,
  };
  // Descarta as primeiras saídas para espalhar sementes próximas.
  for (let i = 0; i < 15; i++) proximoU32(rng);
  return rng;
}

export function clonarRng(rng: EstadoRng): EstadoRng {
  return { a: rng.a, b: rng.b, c: rng.c, d: rng.d };
}

/** Próximo inteiro sem sinal de 32 bits. Avança o estado. */
export function proximoU32(rng: EstadoRng): number {
  const t = (((rng.a + rng.b) | 0) + rng.d) | 0;
  rng.d = (rng.d + 1) | 0;
  rng.a = rng.b ^ (rng.b >>> 9);
  rng.b = (rng.c + (rng.c << 3)) | 0;
  rng.c = (rng.c << 21) | (rng.c >>> 11);
  rng.c = (rng.c + t) | 0;
  return t >>> 0;
}

/** Real em [0, 1). */
export function aleatorio(rng: EstadoRng): number {
  return proximoU32(rng) / 4294967296;
}

/** Inteiro em [min, max], inclusivo nas duas pontas. */
export function inteiro(rng: EstadoRng, min: number, max: number): number {
  if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
    throw new RangeError(`intervalo inválido: [${min}, ${max}]`);
  }
  return min + Math.floor(aleatorio(rng) * (max - min + 1));
}

export function escolher<T>(rng: EstadoRng, lista: readonly T[]): T {
  if (lista.length === 0) throw new RangeError('lista vazia');
  return lista[inteiro(rng, 0, lista.length - 1)] as T;
}
