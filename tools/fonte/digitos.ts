// Os algarismos e a pontuação da fonte do jogo (24/11/2026). Algarismos alinhados e todos com a mesma largura (560),
// para o dano e o d20 não dançarem; o zero leva o losango do arcano no centro (e não se confunde com o O).

import type { Polygon } from 'polygon-clipping';
import { B, C, type Glifo } from './maiusculas';
import { cam, cubica, elipse, losango, poligono, reta, serifa, type Pt, type Traco } from './pena';

const L = 560;
const R: readonly [number, number] = [-16, 716];
const t = (pts: Pt[], pena?: Traco['pena']): Traco => (pena ? { pts, pena } : { pts });
const girar = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [L - x, C - y] as Pt);

export function digitos(): Glifo[] {
  const g: Glifo[] = [];
  const add = (c: string, tracos: Traco[], formas: Polygon[] = [], corte: readonly [number, number] = [0, C], avanco = L) =>
    g.push({ nome: c, unicode: c.charCodeAt(0), avanco, tracos, formas, corte, ...(avanco !== L && { lados: [40, 40] as const }) });

  add('0', [t(elipse(280, 350, 206, 352))], [losango(280, 350, 30, 42)], R);
  add('1', [t(reta(290, 0, 290, C)), t(reta(290, C - 10, 160, 600), { angulo: 50 })], [serifa(290, 0, true, 90, 90)], [0, C + 10]);
  add('2', [t(cam(cubica([100, 560], [120, 660], [200, C - 7], [290, C - 7]), cubica([290, C - 7], [400, C - 7], [470, 640], [470, 540]), cubica([470, 540], [470, 400], [330, 300], [96, B]))),
    t(reta(96, B, 490, B))], [poligono([[490, 0], [500, 90], [470, 2 * B]])], R);
  const tres = cam(
    cubica([96, 600], [130, 670], [200, C - 7], [280, C - 7]), cubica([280, C - 7], [390, C - 7], [450, 640], [450, 555]),
    cubica([450, 555], [450, 455], [370, 395], [250, 395]),
  );
  add('3', [t(tres), t(cam(cubica([250, 395], [400, 395], [480, 320], [480, 200]), cubica([480, 200], [480, 70], [390, 7], [270, 7]), cubica([270, 7], [170, 7], [100, 40], [70, 120])))], [], R);
  add('4', [t(reta(400, C, 50, 220), { angulo: 50 }), t(reta(50, 220, 520, 220)), t(reta(400, C, 400, 0))], [serifa(400, 0, true, 70, 70)]);
  add('5', [t(reta(170, C - B, 470, C - B)), t(reta(170, C - B, 140, 400), { angulo: 60 }),
    t(cam(cubica([140, 400], [200, 440], [260, 452], [300, 452]), cubica([300, 452], [420, 452], [490, 370], [490, 230]), cubica([490, 230], [490, 80], [390, 7], [270, 7]), cubica([270, 7], [170, 7], [100, 40], [70, 120])))],
  [poligono([[470, C], [480, 620], [450, C - 2 * B]])], R);
  const seis = cam(
    cubica([450, 630], [400, 690], [350, C - 7], [300, C - 7]), cubica([300, C - 7], [150, C - 7], [80, 560], [80, 330]),
    cubica([80, 330], [80, 100], [160, 7], [290, 7]), cubica([290, 7], [410, 7], [490, 100], [490, 225]),
    cubica([490, 225], [490, 350], [410, 440], [290, 440]), cubica([290, 440], [190, 440], [110, 380], [86, 300]),
  );
  add('6', [t(seis)], [], R);
  add('7', [t(reta(70, C - B, 500, C - B)), t(reta(500, C - B, 220, 0))], [poligono([[70, C], [58, 610], [92, C - 2 * B]])], [0, C]);
  add('8', [t(elipse(280, 530, 165, 172)), t(elipse(280, 196, 205, 196))], [], R);
  add('9', [t(girar(seis))], [], R);

  // Pontuação dos títulos e dos números (dano, nível, porcentagem).
  const ponto = (x: number, y: number) => losango(x, y, 42, 52);
  g.push({ nome: ' ', unicode: 32, avanco: 240 });
  add('.', [], [ponto(110, 40)], [0, C], 220);
  add(',', [t(cubica([120, 60], [130, 20], [110, -60], [70, -110]), { angulo: 40 })], [ponto(110, 40)], [-140, C], 220);
  add(':', [], [ponto(110, 40), ponto(110, 420)], [0, C], 220);
  add(';', [t(cubica([120, 60], [130, 20], [110, -60], [70, -110]), { angulo: 40 })], [ponto(110, 40), ponto(110, 420)], [-140, C], 220);
  add('·', [], [ponto(110, 330)], [0, C], 220);
  add('-', [t(reta(60, 280, 300, 280))], [], [0, C], 360);
  add('–', [t(reta(40, 280, 520, 280))], [], [0, C], 560);
  add('+', [t(reta(60, 300, 500, 300)), t(reta(280, 80, 280, 520))], [], [0, C]);
  add('×', [t(reta(110, 130, 450, 470)), t(reta(110, 470, 450, 130), { angulo: 60 })], [], [0, C]);
  add('/', [t(reta(60, -60, 400, C))], [], [-60, C], 460);
  add('!', [t(reta(120, C, 120, 200), { angulo: 0, largura: 70 })], [ponto(120, 40)], [0, C], 240);
  add('?', [t(cam(cubica([80, 580], [110, 670], [190, C - 7], [270, C - 7]), cubica([270, C - 7], [380, C - 7], [440, 640], [440, 550]), cubica([440, 550], [440, 420], [270, 400], [270, 200])))],
    [ponto(270, 40)], [0, 716], 520);
  add("'", [t(reta(110, C, 100, 480), { angulo: 0, largura: 60 })], [], [0, C + 10], 220);
  add('(', [t(cubica([280, 760], [100, 600], [100, 100], [280, -60]), { angulo: 10 })], [], [-60, 760], 340);
  add(')', [t(cubica([60, 760], [240, 600], [240, 100], [60, -60]), { angulo: 10 })], [], [-60, 760], 340);
  add('%', [t(elipse(180, 540, 90, 140)), t(elipse(560, 160, 90, 140)), t(reta(170, 0, 570, C), { angulo: 60 })], [], [-16, 716], 740);
  return g;
}
