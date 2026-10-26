// Marco 26 (25/10/2026, D-107): as teclas de movimento. WASD e as setas são direções de tela (no isométrico, pela
// inversa da projeção). EWAS, opcional nas Configurações, segue a inclinação do isométrico: as quatro teclas formam
// o losango inclinado do teclado e cada uma anda exatamente num eixo da fase — E cima-direita (N), W cima-esquerda
// (O), A baixo-esquerda (S), S baixo-direita (E). Nesse modo, interagir passa para o D. De cima, EWAS vale como
// WASD. Funções puras.

import type { TeclasMovimento } from '../plataforma/preferencias';
import { dirDeVetor, PARADO, rumoDaTela, vetorDaTela, type Rumo } from './direcao';

export type { TeclasMovimento };

/** Direções de tela (y para baixo). */
const TELA: Readonly<Record<string, readonly [number, number]>> = {
  KeyW: [0, -1],
  KeyS: [0, 1],
  KeyA: [-1, 0],
  KeyD: [1, 0],
};
const SETAS: Readonly<Record<string, readonly [number, number]>> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
};
/** EWAS no isométrico: eixos da fase. */
const FASE_EWAS: Readonly<Record<string, readonly [number, number]>> = {
  KeyE: [0, -1],
  KeyW: [-1, 0],
  KeyA: [0, 1],
  KeyS: [1, 0],
};

/** EWAS só vale no isométrico (de cima, a tela já é a fase). */
function inclinado(modo: TeclasMovimento, isometrico: boolean): boolean {
  return modo === 'ewas' && isometrico;
}

/** A tecla de interagir: o E, ou o D quando o E anda (EWAS no isométrico). */
export function teclaInteragir(modo: TeclasMovimento, isometrico: boolean): 'KeyE' | 'KeyD' {
  return inclinado(modo, isometrico) ? 'KeyD' : 'KeyE';
}

/** A letra que os textos mostram para interagir. */
export function letraInteragir(modo: TeclasMovimento, isometrico: boolean): string {
  return teclaInteragir(modo, isometrico) === 'KeyD' ? 'D' : 'E';
}

/** A tecla move o personagem neste modo e nesta visão? */
export function ehTeclaDeMovimento(codigo: string, modo: TeclasMovimento, isometrico: boolean): boolean {
  return codigo in SETAS || (inclinado(modo, isometrico) ? codigo in FASE_EWAS : codigo in TELA);
}

/** O rumo das teclas mantidas: as de tela pela inversa da projeção, as de EWAS direto nos eixos da fase. */
export function rumoDasTeclas(pressionadas: Iterable<string>, modo: TeclasMovimento, isometrico: boolean): Rumo {
  const ewas = inclinado(modo, isometrico);
  let tx = 0;
  let ty = 0;
  let fx = 0;
  let fy = 0;
  for (const codigo of pressionadas) {
    const tela = SETAS[codigo] ?? (ewas ? undefined : TELA[codigo]);
    if (tela) {
      tx += tela[0];
      ty += tela[1];
    }
    const fase = ewas ? FASE_EWAS[codigo] : undefined;
    if (fase) {
      fx += fase[0];
      fy += fase[1];
    }
  }
  const daTela = rumoDaTela(dirDeVetor(tx, ty), isometrico);
  if (fx === 0 && fy === 0) return daTela;
  // Soma as duas fontes já na fase (as setas e o EWAS juntos são raros, mas não se anulam por acaso).
  const n = Math.hypot(fx, fy);
  const r = vetorDaTela(fx / n + daTela.dx / 1000, fy / n + daTela.dy / 1000, false);
  return r.dir === 'parado' ? PARADO : r;
}
