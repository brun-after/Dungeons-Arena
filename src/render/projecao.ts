// Projeção da visão (§2.16, §4.5). Marco 13 (14/10/2026), D-058. Pura e testável.
// Tudo é desenhado em "px de plano" (a fase vista de cima: 1 célula = 48 px). A projeção leva o plano
// para o "mundo da tela", onde a câmera trabalha:
//   de cima     -> identidade;
//   isométrica  -> 2:1 clássica: x = (px − py)·k + deslocamento, y = (px + py)·k/2, com k = 1/√2,
//                 deslocada para o mundo projetado começar em 0 (a câmera limita em [0, tamanho]).
// A mesma matriz vai para o container do chão (transform de container, nunca de DOM); o que fica em pé
// (entidades, projéteis, partículas, números) é posicionado por `projetar` e fica alinhado à tela.

import { CELULA_PX } from './camera-calculo';

export type Visao = 'cima' | 'iso';

/** Matriz afim no formato do PixiJS: x' = a·x + c·y + tx; y' = b·x + d·y + ty. */
export interface Matriz {
  a: number;
  b: number;
  c: number;
  d: number;
  tx: number;
  ty: number;
}

export interface Projecao {
  visao: Visao;
  matriz: Matriz;
  /** Tamanho do mundo projetado, em px. */
  largura: number;
  altura: number;
  /** px de plano -> px do mundo projetado. */
  projetar: (x: number, y: number) => { x: number; y: number };
  /** px do mundo projetado -> px de plano. */
  desprojetar: (x: number, y: number) => { x: number; y: number };
}

const K = Math.SQRT1_2;

/** Centro de uma célula (ou posição contínua em células) em px de plano. */
export function centroDaCelula(cx: number, cy: number): { x: number; y: number } {
  return { x: (cx + 0.5) * CELULA_PX, y: (cy + 0.5) * CELULA_PX };
}

export function criarProjecao(visao: Visao, larguraCelulas: number, alturaCelulas: number): Projecao {
  const lp = larguraCelulas * CELULA_PX;
  const ap = alturaCelulas * CELULA_PX;
  if (visao === 'cima') {
    return {
      visao,
      matriz: { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 },
      largura: lp,
      altura: ap,
      projetar: (x, y) => ({ x, y }),
      desprojetar: (x, y) => ({ x, y }),
    };
  }
  const tx = ap * K;
  return {
    visao,
    matriz: { a: K, b: K / 2, c: -K, d: K / 2, tx, ty: 0 },
    largura: (lp + ap) * K,
    altura: ((lp + ap) * K) / 2,
    projetar: (x, y) => ({ x: (x - y) * K + tx, y: ((x + y) * K) / 2 }),
    desprojetar: (x, y) => {
      const u = (x - tx) / K;
      const v = (2 * y) / K;
      return { x: (u + v) / 2, y: (v - u) / 2 };
    },
  };
}

/** Célula sob um ponto do mundo projetado. */
export function celulaSobProjetado(p: Projecao, x: number, y: number): { x: number; y: number } {
  const plano = p.desprojetar(x, y);
  return { x: Math.floor(plano.x / CELULA_PX), y: Math.floor(plano.y / CELULA_PX) };
}

/**
 * Marco 26 (25/10/2026, D-104): o ponto contínuo da fase sob um ponto do mundo projetado, em células (o centro de
 * uma célula é o inteiro), arredondado a centésimos (o comando irPara vai pela rede).
 */
export function pontoSobProjetado(p: Projecao, x: number, y: number): { x: number; y: number } {
  const plano = p.desprojetar(x, y);
  return { x: Math.round((plano.x / CELULA_PX - 0.5) * 100) / 100, y: Math.round((plano.y / CELULA_PX - 0.5) * 100) / 100 };
}

/** Profundidade de desenho de algo em pé: o Y projetado (no isométrico, cresce com x + y). */
export function profundidade(p: Projecao, cx: number, cy: number): number {
  const c = centroDaCelula(cx, cy);
  return p.projetar(c.x, c.y).y;
}
