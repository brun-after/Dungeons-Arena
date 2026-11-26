// As capitulares da fonte do jogo (24/11/2026): corpo romano clássico traçado pela pena (pena.ts), com os ornamentos
// tirados das runas só onde a letra continua legível: o losango do arcano no centro de A, H, O e X, a ponta em V do
// arqueiro no ápice do A e na cauda do Q, os chifres do guerreiro nas pontas do T. Altura das maiúsculas: 700.

import type { Polygon } from 'polygon-clipping';
import { cam, cubica, elipse, losango, poligono, quadratica, reta, serifa, type Pt, type Traco } from './pena';

export interface Glifo {
  nome: string;
  unicode: number;
  avanco: number;
  tracos?: Traco[];
  formas?: Polygon[];
  /** Limites em y para os traços (as formas passam livres). Padrão: [0, 700]. */
  corte?: readonly [number, number];
  /** Recuos à esquerda e à direita do contorno; o avanço sai deles. Sem eles, vale o avanço (algarismos tabulares, centrados). */
  lados?: readonly [number, number];
}

/** Altura das maiúsculas, meia barra fina e meia haste da pena padrão. */
export const C = 700;
export const B = 21;
export const H = 42;
const REDONDO: readonly [number, number] = [-16, 716];
const fina = { angulo: 62 };
// Recuos laterais: haste reta ~56, bojo ~38, diagonal ~14 (o olho mede a área branca, não a distância).
const LADOS: Readonly<Record<string, readonly [number, number]>> = {
  A: [14, 14], B: [56, 40], C: [38, 34], D: [56, 38], E: [56, 30], F: [56, 24], G: [38, 46], J: [20, 56], K: [56, 12],
  L: [56, 20], O: [38, 38], P: [56, 30], Q: [38, 24], R: [56, 14], S: [40, 40], T: [20, 20], U: [50, 50], V: [14, 14],
  W: [14, 14], X: [16, 16], Y: [14, 14], Z: [36, 36],
};
const t = (pts: Pt[], pena?: Traco['pena']): Traco => (pena ? { pts, pena } : { pts });

/** Haste vertical com serifa nas duas pontas. */
function haste(x: number, esqB = 40, dirB = 40, esqT = 40, dirT = 40): { tracos: Traco[]; formas: Polygon[] } {
  return {
    tracos: [t(reta(x, 0, x, C))],
    formas: [
      ...(esqB + dirB > 0 ? [serifa(x, 0, true, esqB, dirB)] : []),
      ...(esqT + dirT > 0 ? [serifa(x, C, false, esqT, dirT)] : []),
    ],
  };
}

/** Bico vertical na ponta de uma barra (E, F, L, T, Z): uma serifa que cai ou sobe. */
function bico(x: number, y: number, desce: boolean, alto = 80): Polygon {
  const s = desce ? -1 : 1;
  return poligono([[x - 34, y], [x + 14, y], [x + 14, y + s * alto], [x + 2, y + s * alto]]);
}

export function maiusculas(): Glifo[] {
  const g: Glifo[] = [];
  const add = (letra: string, avanco: number, tracos: Traco[], formas: Polygon[] = [], corte?: readonly [number, number]) =>
    g.push({ nome: letra, unicode: letra.charCodeAt(0), avanco, tracos, formas, lados: LADOS[letra] ?? [56, 56], ...(corte && { corte }) });

  // A: perna fina à esquerda, grossa à direita, ápice em ponta (a flecha do arqueiro) e o losango na barra.
  add('A', 680, [t(reta(100, 0, 340, 742), fina), t(reta(580, 0, 340, 742)), t(reta(190, 250, 490, 250))],
    [serifa(100, 0, true, 44, 26, 16), serifa(580, 0, true, 30, 48), losango(340, 250, 42, 54)], [0, 746]);

  const sB = haste(90, 40, 0, 40, 0);
  add('B', 580, [...sB.tracos,
    t(cam(reta(90, C - B, 300, C - B), cubica([300, C - B], [440, C - B], [440, 372], [300, 372]), reta(300, 372, 90, 372))),
    t(cam(reta(300, 372, 320, 372), cubica([320, 372], [490, 372], [490, B], [320, B]), reta(320, B, 90, B)))], sB.formas);

  // C: o bico de cima termina na ponta em V; o de baixo, numa curva aberta.
  add('C', 650, [t(elipse(360, 350, 272, 352, 42, 318))], [bico(560, 620, true, 110), bico(565, 110, false, 70)], REDONDO);

  const sD = haste(90, 40, 0, 40, 0);
  add('D', 700, [...sD.tracos, t(cam(reta(90, C - B, 300, C - B), elipse(300, 350, 310, 331, 90, -90), reta(300, B, 90, B)))], sD.formas, REDONDO);

  const sE = haste(90, 40, 0, 40, 0);
  add('E', 570, [...sE.tracos, t(reta(90, C - B, 470, C - B)), t(reta(90, 362, 380, 362)), t(reta(90, B, 500, B))],
    [...sE.formas, bico(470, C, true), bico(500, 0, false, 80), losango(394, 362, 32, 40)]);

  const sF = haste(90, 40, 40, 40, 0);
  add('F', 540, [...sF.tracos, t(reta(90, C - B, 470, C - B)), t(reta(90, 350, 370, 350))],
    [...sF.formas, bico(470, C, true), losango(384, 350, 32, 40)]);

  add('G', 700, [t(elipse(360, 350, 272, 352, 42, 330)), t(reta(596, 300, 596, 0), { angulo: 20 }), t(reta(470, 300, 640, 300))],
    [bico(560, 620, true, 110)], REDONDO);

  const h1 = haste(90), h2 = haste(630);
  add('H', 720, [...h1.tracos, ...h2.tracos, t(reta(90, 360, 630, 360))], [...h1.formas, ...h2.formas, losango(360, 360, 42, 54)]);

  const sI = haste(140);
  add('I', 280, sI.tracos, sI.formas);

  add('J', 340, [t(cam(reta(220, C, 220, 80), cubica([220, 80], [220, -60], [140, -110], [40, -120])))],
    [serifa(220, C, false, 40, 40)], [-160, C]);

  const sK = haste(90, 40, 40, 40, 40);
  add('K', 650, [...sK.tracos, t(reta(100, 300, 560, 700), { angulo: 60 }), t(reta(250, 430, 610, 0))],
    [...sK.formas, serifa(560, C, false, 46, 36, 16), serifa(610, 0, true, 36, 46)]);

  const sL = haste(90, 40, 0, 40, 40);
  add('L', 560, [...sL.tracos, t(reta(90, B, 510, B))], [...sL.formas, bico(510, 0, false, 90)]);

  // M: hastes abertas, o V do meio desce até a base em ponta.
  add('M', 840, [t(reta(100, 0, 130, 744), { angulo: 72 }), t(reta(130, 744, 420, -10)), t(reta(420, -10, 710, 744), fina), t(reta(710, 744, 740, 0))],
    [serifa(100, 0, true, 40, 34, 14), serifa(740, 0, true, 40, 40)], [-14, 746]);

  add('N', 730, [t(reta(90, 0, 90, 744), { angulo: 72 }), t(reta(90, 744, 640, -12)), t(reta(640, -12, 640, 700), { angulo: 72 })],
    [serifa(90, 0, true, 40, 40, 14), serifa(640, C, false, 40, 40, 14)], [-16, 746]);

  add('O', 760, [t(elipse(380, 350, 304, 352))], [losango(380, 350, 34, 46)], REDONDO);

  const sP = haste(90, 40, 40, 40, 0);
  add('P', 570, [...sP.tracos, t(cam(reta(90, C - B, 300, C - B), cubica([300, C - B], [470, C - B], [470, 320], [300, 320]), reta(300, 320, 90, 320)))], sP.formas);

  add('Q', 760, [t(elipse(380, 350, 304, 352)), t(cubica([380, 20], [480, -50], [600, -90], [740, -110]), { angulo: 40 })],
    [losango(380, 350, 34, 46), poligono([[700, -80], [770, -114], [700, -148]])], [-160, 716]);

  const sR = haste(90, 40, 40, 40, 0);
  add('R', 640, [...sR.tracos, t(cam(reta(90, C - B, 300, C - B), cubica([300, C - B], [470, C - B], [470, 340], [300, 340]), reta(300, 340, 90, 340))),
    t(cam(reta(280, 340, 470, 60), quadratica([470, 60], [510, 0], [610, 10], 10)))], sR.formas);

  add('S', 540, [t(cam(
    cubica([460, 600], [430, 680], [350, C - 7], [270, C - 7]),
    cubica([270, C - 7], [150, C - 7], [80, 630], [80, 540]),
    cubica([80, 540], [80, 420], [200, 390], [290, 350]),
    cubica([290, 350], [400, 300], [470, 260], [470, 170]),
    cubica([470, 170], [470, 50], [370, 7], [260, 7]),
    cubica([260, 7], [160, 7], [90, 40], [60, 120]),
  ))], [bico(460, 600, true, 90), bico(60, 110, false, 80)], REDONDO);

  // T: as pontas da barra viram os chifres do guerreiro.
  const sT = haste(320, 44, 44, 0, 0);
  add('T', 640, [t(reta(320, 0, 320, C - B)), t(reta(40, C - B, 600, C - B))],
    [sT.formas[0] as Polygon, poligono([[28, C - 2 * B], [6, 784], [104, C]]), poligono([[612, C - 2 * B], [634, 784], [536, C]])], [0, 790]);

  add('U', 700, [t(cam(reta(90, C, 90, 250), cubica([90, 250], [90, 50], [200, 7], [350, 7]), cubica([350, 7], [500, 7], [610, 50], [610, 250]), reta(610, 250, 610, C)), { angulo: 20 })],
    [serifa(90, C, false, 40, 40), serifa(610, C, false, 40, 40)], [-16, C]);

  add('V', 680, [t(reta(70, C, 340, -12)), t(reta(340, -12, 610, C), fina)], [serifa(70, C, false, 44, 40), serifa(610, C, false, 40, 44, 16)], [-16, C]);

  add('W', 1000, [t(reta(60, C, 280, -12)), t(reta(280, -12, 500, 744), fina), t(reta(500, 744, 720, -12)), t(reta(720, -12, 940, C), fina)],
    [serifa(60, C, false, 44, 40), serifa(940, C, false, 40, 44, 16)], [-16, 746]);

  add('X', 680, [t(reta(80, C, 600, 0)), t(reta(80, 0, 600, C), fina)],
    [serifa(80, C, false, 44, 40), serifa(600, 0, true, 40, 44), serifa(80, 0, true, 44, 40, 16), serifa(600, C, false, 40, 44, 16), losango(340, 350, 42, 54)]);

  add('Y', 660, [t(reta(70, C, 330, 330)), t(reta(330, 330, 590, C), fina), t(reta(330, 340, 330, 0))],
    [serifa(70, C, false, 44, 40), serifa(590, C, false, 40, 44, 16), serifa(330, 0, true, 44, 44)]);

  add('Z', 620, [t(reta(80, C - B, 530, C - B)), t(reta(530, C - B, 80, B), { angulo: -10 }), t(reta(80, B, 550, B))],
    [bico(80, C, true, 80), bico(550, 0, false, 90)]);
  return g;
}

export { cubica, elipse, quadratica, reta };
