// As minúsculas da fonte do jogo (24/11/2026): a mesma pena das capitulares, altura-x 470, ascendentes até 740 e
// descendentes até -220. O ornamento rúnico aqui é contido: o pingo do i e do j é o losango do arcano e o braço do r
// termina num losango pequeno; o resto é romano, para o texto dos títulos ler de primeira.

import type { Polygon } from 'polygon-clipping';
import type { Glifo } from './maiusculas';
import { B } from './maiusculas';
import { cam, cubica, elipse, losango, poligono, quadratica, reta, serifa, type Pt, type Traco } from './pena';

export const X = 470;
export const ASC = 740;
export const DESC = -220;
const fina = { angulo: 62 };
const R: readonly [number, number] = [-16, X + 16];
const t = (pts: Pt[], pena?: Traco['pena']): Traco => (pena ? { pts, pena } : { pts });
/** Serifa de cabeça (só à esquerda), no topo de uma haste. */
const cabeca = (x: number, y: number) => serifa(x, y, false, 44, 0);
const pe = (x: number, y = 0, esq = 36, dir = 36) => serifa(x, y, true, esq, dir);
const bico = (x: number, y: number, desce: boolean, alto = 70): Polygon => {
  const s = desce ? -1 : 1;
  return poligono([[x - 30, y], [x + 12, y], [x + 12, y + s * alto], [x + 2, y + s * alto]]);
};
const pingo = (x: number) => losango(x, 640, 40, 52);

const LADOS: Readonly<Record<string, readonly [number, number]>> = {
  a: [40, 30], b: [40, 38], c: [38, 26], d: [38, 40], e: [38, 34], f: [30, 10], g: [36, 36], h: [40, 40], i: [40, 40],
  ı: [40, 40], j: [10, 40], k: [40, 10], l: [40, 40], m: [40, 40], n: [40, 40], o: [38, 38], p: [40, 38], q: [38, 40],
  r: [40, 14], s: [36, 36], t: [20, 18], u: [36, 40], v: [12, 12], w: [12, 12], x: [16, 16], y: [12, 12], z: [32, 32],
};

/** O esqueleto do S das capitulares, encolhido para a altura-x. */
function sPequeno(): Pt[] {
  const kx = 0.8, ky = X / 700;
  const s = (p: Pt): Pt => [p[0] * kx, p[1] * ky];
  return cam(
    cubica(s([460, 600]), s([430, 680]), s([350, 693]), s([270, 693])),
    cubica(s([270, 693]), s([150, 693]), s([80, 630]), s([80, 540])),
    cubica(s([80, 540]), s([80, 420]), s([200, 390]), s([290, 350])),
    cubica(s([290, 350]), s([400, 300]), s([470, 260]), s([470, 170])),
    cubica(s([470, 170]), s([470, 50]), s([370, 10]), s([260, 10])),
    cubica(s([260, 10]), s([160, 10]), s([90, 40]), s([60, 120])),
  );
}

export function minusculas(): Glifo[] {
  const g: Glifo[] = [];
  const add = (c: string, tracos: Traco[], formas: Polygon[] = [], corte: readonly [number, number] = [0, ASC]) =>
    g.push({ nome: c, unicode: c.codePointAt(0) ?? 0, avanco: 0, tracos, formas, corte, lados: LADOS[c] ?? [40, 40] });
  const arco = (x0: number, x1: number): Pt[] => cam(
    cubica([x0, 330], [x0 + 30, 420], [x0 + 90, X - 7], [(x0 + x1) / 2 + 10, X - 7]),
    cubica([(x0 + x1) / 2 + 10, X - 7], [x1 - 40, X - 7], [x1, 420], [x1, 320]), reta(x1, 320, x1, 0),
  );

  add('a', [t(cam(cubica([100, 390], [130, 440], [180, X - 7], [240, X - 7]), cubica([240, X - 7], [330, X - 7], [380, 420], [380, 330]), reta(380, 330, 380, 0))),
    t(cam(cubica([380, 250], [230, 240], [80, 200], [80, 115]), cubica([80, 115], [80, 40], [130, 7], [200, 7]), cubica([200, 7], [280, 7], [350, 50], [380, 110])))],
  [serifa(380, 0, true, 0, 36)], R);
  add('b', [t(reta(90, 0, 90, ASC)), t(elipse(300, 235, 210, 228, 150, -150))], [cabeca(90, ASC)], [-16, ASC]);
  add('c', [t(elipse(260, 235, 200, 228, 40, 320))], [bico(400, 420, true, 80)], R);
  add('d', [t(reta(470, 0, 470, ASC)), t(elipse(260, 235, 210, 228, 30, 330))], [cabeca(470, ASC), serifa(470, 0, true, 0, 36)], [-16, ASC]);
  add('e', [t(elipse(260, 235, 205, 228, 0, 320)), t(reta(70, 235, 465, 235))], [], R);
  add('f', [t(cam(reta(170, 0, 170, 560), cubica([170, 560], [170, 690], [250, ASC - 7], [330, ASC - 7])), { angulo: 20 }), t(reta(60, X - B, 320, X - B))],
    [pe(170), bico(330, ASC, true, 70)], [0, ASC]);
  add('g', [t(elipse(255, 250, 195, 222)), t(cam(reta(450, X, 450, -40), cubica([450, -40], [450, -170], [350, DESC + 7], [240, DESC + 7]), cubica([240, DESC + 7], [150, DESC + 7], [90, -180], [70, -140])))],
    [serifa(450, X, false, 0, 40)], [DESC - 16, X + 16]);
  add('h', [t(reta(90, 0, 90, ASC)), t(arco(90, 430))], [cabeca(90, ASC), pe(90), pe(430)]);
  add('i', [t(reta(100, 0, 100, X))], [cabeca(100, X), pe(100), pingo(100)], [0, 700]);
  add('ı', [t(reta(100, 0, 100, X))], [cabeca(100, X), pe(100)]);
  add('j', [t(cam(reta(180, X, 180, -100), cubica([180, -100], [180, -190], [120, DESC + 7], [40, DESC + 7])))], [cabeca(180, X), pingo(180)], [DESC - 10, 700]);
  add('k', [t(reta(90, 0, 90, ASC)), t(reta(100, 170, 400, X), fina), t(reta(210, 270, 450, 0))],
    [cabeca(90, ASC), pe(90), serifa(400, X, false, 36, 36, 14), serifa(450, 0, true, 30, 40)]);
  add('l', [t(reta(100, 0, 100, ASC))], [cabeca(100, ASC), pe(100)]);
  add('m', [t(reta(90, 0, 90, X)), t(arco(90, 370)), t(arco(370, 650))], [cabeca(90, X), pe(90), pe(370), pe(650)], [0, X + 16]);
  add('n', [t(reta(90, 0, 90, X)), t(arco(90, 430))], [cabeca(90, X), pe(90), pe(430)], [0, X + 16]);
  add('o', [t(elipse(250, 235, 212, 228))], [], R);
  add('p', [t(reta(90, DESC, 90, X)), t(elipse(300, 235, 210, 228, 150, -150))], [cabeca(90, X), pe(90, DESC)], [DESC, X + 16]);
  add('q', [t(reta(470, DESC, 470, X)), t(elipse(260, 235, 210, 228, 30, 330))], [pe(470, DESC)], [DESC, X + 16]);
  add('r', [t(reta(90, 0, 90, X)), t(cam(cubica([90, 330], [130, 420], [200, X - 7], [270, X - 7]), quadratica([270, X - 7], [320, X - 7], [340, 440])))],
    [cabeca(90, X), pe(90, 0, 36, 60), losango(346, 430, 26, 34)], [0, X + 16]);
  add('s', [t(sPequeno())], [bico(368, 400, true, 60), bico(50, 80, false, 60)], R);
  add('t', [t(cam(reta(150, 620, 150, 110), cubica([150, 110], [150, 30], [200, 7], [260, 7]), cubica([260, 7], [300, 7], [330, 20], [350, 40]))), t(reta(50, X - B, 320, X - B))],
    [], [-16, 620]);
  add('u', [t(cam(reta(90, X, 90, 140), cubica([90, 140], [90, 40], [150, 7], [240, 7]), cubica([240, 7], [330, 7], [400, 60], [430, 140]))), t(reta(430, X, 430, 0))],
    [cabeca(90, X), cabeca(430, X), serifa(430, 0, true, 0, 36)], R);
  add('v', [t(reta(60, X, 260, -10)), t(reta(260, -10, 460, X), fina)], [serifa(60, X, false, 36, 36), serifa(460, X, false, 36, 36, 16)], [-14, X]);
  add('w', [t(reta(50, X, 210, -10)), t(reta(210, -10, 360, X + 20), fina), t(reta(360, X + 20, 520, -10)), t(reta(520, -10, 680, X), fina)],
    [serifa(50, X, false, 36, 36), serifa(680, X, false, 36, 36, 16)], [-14, X + 22]);
  add('x', [t(reta(70, X, 450, 0)), t(reta(70, 0, 450, X), fina)],
    [serifa(70, X, false, 36, 30), serifa(450, 0, true, 30, 36), serifa(70, 0, true, 36, 30, 16), serifa(450, X, false, 30, 36, 16)]);
  add('y', [t(reta(60, X, 270, 0)), t(cam(reta(470, X, 200, -150), quadratica([200, -150], [170, DESC + 10], [70, DESC + 10])), fina)],
    [serifa(60, X, false, 36, 36), serifa(470, X, false, 36, 36, 16)], [DESC, X]);
  add('z', [t(reta(70, X - B, 420, X - B)), t(reta(420, X - B, 70, B), { angulo: -10 }), t(reta(70, B, 440, B))],
    [bico(70, X, true, 60), bico(440, 0, false, 70)], [0, X]);
  return g;
}
