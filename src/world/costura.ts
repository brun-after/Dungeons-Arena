// Marco 54 (26/11/2026, D-207): a costura entre duas regiões vizinhas do Mundo contínuo. Puro.
// Cada região é gerada sozinha; para o chão seguir de uma para a outra, as duas puxam a borda comum para o mesmo
// perfil, que só depende do par e da posição ao longo da borda (em coordenadas do atlas). Assim a altura bate nos dois
// lados sem um conhecer o outro, como a passagem do marco 41 fazia na faixa de 28 células.
// - a altura da borda ondula devagar (0 a `alturaMax` níveis);
// - em trechos, uma serra fecha a borda (a montanha passa de um lado para o outro); nunca perto do cruzamento, onde as
//   estradas das duas se encontram;
// - fora do trecho comum (a borda de uma região mais longa que a da vizinha), a borda é serra.

import { hashTexto } from '../core/rng';

export interface PontoDaCostura {
  /** A altura (níveis) que os dois lados têm na borda. */
  altura: number;
  /** Ali a borda é serra (fechada). */
  serra: boolean;
}

export interface PerfilDaCostura {
  /** O ponto da borda na posição `t` (coordenada do atlas ao longo dela). */
  em(t: number): PontoDaCostura;
  /** Onde as estradas das duas se encontram (coordenada do atlas ao longo da borda). */
  cruzamento: number;
}

/** A faixa (células para dentro de cada lado) em que o chão é puxado para o perfil. */
export const FAIXA_DA_COSTURA = 16;
/** A borda sem serra em volta do cruzamento (para cada lado dele). */
const LIVRE_NO_CRUZAMENTO = 24;
const ALTURA_MAX = 3;
/** A fração da borda fechada por serra. */
const SERRA = 0.3;

function hash1(i: number, s: number): number {
  let h = (Math.imul(i, 374_761_393) + Math.imul(s, 668_265_263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1_274_126_177);
  return ((h ^ (h >>> 16)) >>> 0) / 4_294_967_296;
}

/** Ruído de valor suave em 1D (0 a 1), com nós a cada `passo`. */
function ruido1(t: number, passo: number, s: number): number {
  const i = Math.floor(t / passo);
  let f = t / passo - i;
  f = f * f * (3 - 2 * f);
  const a = hash1(i, s);
  return a + (hash1(i + 1, s) - a) * f;
}

/** O perfil da borda comum `[inicio, fim)` do par (a chave do par vem de `Costura.par`, `mundo/atlas.ts`). */
export function perfilDaCostura(par: string, inicio: number, fim: number): PerfilDaCostura {
  const s = hashTexto(`costura:${par}`);
  const cruzamento = Math.floor((inicio + fim) / 2);
  return {
    cruzamento,
    em(t: number): PontoDaCostura {
      const altura = Math.round(ruido1(t, 40, s) * ALTURA_MAX);
      if (t < inicio + 8 || t >= fim - 8) return { altura, serra: true };
      const serra = Math.abs(t - cruzamento) > LIVRE_NO_CRUZAMENTO && ruido1(t, 30, s + 1) > 1 - SERRA;
      return { altura, serra };
    },
  };
}

/** O retângulo da região dentro do quadrado gerado (o resto do quadrado é cortado). */
export interface Recorte {
  x: number;
  y: number;
  largura: number;
  altura: number;
}

export type LadoDoRecorte = 'norte' | 'sul' | 'leste' | 'oeste';

/** Um lado aberto do recorte e o perfil dele em coordenada local ao longo do lado (y em leste/oeste; x em norte/sul). */
export interface LadoAberto {
  lado: LadoDoRecorte;
  em(i: number): PontoDaCostura;
}

/** Quantas células a célula está para dentro do lado do recorte (negativo: fora). */
export function distanciaAoLado(r: Recorte, lado: LadoDoRecorte, x: number, y: number): number {
  switch (lado) {
    case 'oeste': return x - r.x;
    case 'leste': return r.x + r.largura - 1 - x;
    case 'norte': return y - r.y;
    case 'sul': return r.y + r.altura - 1 - y;
  }
}

/** A posição ao longo do lado (a que o perfil recebe). */
export function aoLongoDoLado(lado: LadoDoRecorte, x: number, y: number): number {
  return lado === 'leste' || lado === 'oeste' ? y : x;
}

/** O lado aberto mais perto da célula e a distância a ele, ou null se nenhum está a menos de `faixa`. */
export function costuraPerto(r: Recorte, abertos: readonly LadoAberto[], x: number, y: number, faixa = FAIXA_DA_COSTURA): { lado: LadoAberto; d: number } | null {
  let melhor: { lado: LadoAberto; d: number } | null = null;
  for (const l of abertos) {
    const d = distanciaAoLado(r, l.lado, x, y);
    if (d >= 0 && d < faixa && (!melhor || d < melhor.d)) melhor = { lado: l, d };
  }
  return melhor;
}

/**
 * Depois do relevo (que mexe na altura), a borda aberta volta ao perfil: nas 4 células de cada lado, a altura desce
 * do perfil até a de dentro. Assim as duas vizinhas encostam no mesmo nível, onde a borda não é serra.
 */
export function fixarCostura(alturas: Uint8Array, n: number, r: Recorte, abertos: readonly LadoAberto[]): void {
  const faixa = 4;
  for (let y = r.y; y < r.y + r.altura; y++) {
    for (let x = r.x; x < r.x + r.largura; x++) {
      const c = costuraPerto(r, abertos, x, y, faixa);
      if (!c) continue;
      const ponto = c.lado.em(aoLongoDoLado(c.lado.lado, x, y));
      if (ponto.serra) continue;
      const k = y * n + x;
      const t = c.d / faixa;
      alturas[k] = Math.round(ponto.altura * (1 - t) + (alturas[k] ?? 0) * t);
    }
  }
}

/** O limite das zonas não é a reta da borda: ele ondula até este tanto para cada lado (mundo/zonas.ts). */
export const DESVIO_DA_ZONA = 8;

/** Quanto o limite das zonas sai da borda na posição `t` (negativo: para o lado de `a`; positivo: para o de `b`). */
export function desvioDaZona(par: string, t: number): number {
  return Math.round((ruido1(t, 22, hashTexto(`zona:${par}`)) * 2 - 1) * DESVIO_DA_ZONA);
}
