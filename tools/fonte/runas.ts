// As runas como caracteres da fonte (24/11/2026), na área de uso privado: os traços são os mesmos de render/runas.ts e
// render/runas-elementos.ts (quadro de 100 × 100, traço 5), então o texto e o desenho no Pixi nunca divergem.
// A ordem e os códigos ficam em src/ui/runa-texto.ts (U+E000 os elementos, U+E010 as classes).

import type { Polygon } from 'polygon-clipping';
import { RUNAS, TRACO_RUNA, type Traco as TracoRuna } from '../../src/render/runas';
import { TRACOS_ELEMENTOS } from '../../src/render/runas-elementos';
import { CLASSES_DA_FONTE, ELEMENTOS_DA_FONTE, PRIMEIRA_CLASSE, PRIMEIRA_RUNA } from '../../src/ui/runa-texto';
import type { Glifo } from './maiusculas';
import { elipse, poligono, quadratica, type Pt, type Traco } from './pena';


const E = 7;
const MARGEM = 50;
const p = (x: number, y: number): Pt => [MARGEM + x * E, (100 - y) * E];

function glifo(nome: string, unicode: number, tracos: readonly TracoRuna[]): Glifo {
  const pena = { redonda: true, largura: TRACO_RUNA * E };
  const tr: Traco[] = [];
  const formas: Polygon[] = [];
  for (const r of tracos) {
    if (r.t === 'circulo') {
      const c = elipse(p(r.x, r.y)[0], p(r.x, r.y)[1], r.r * E, r.r * E, 0, 360, 40);
      if (r.cheio) formas.push(poligono(c.slice(0, -1)));
      else tr.push({ pts: c, pena });
    } else if (r.t === 'curva') {
      tr.push({ pts: quadratica(p(...r.de), p(...r.controle), p(...r.ate)), pena });
    } else {
      const pts: Pt[] = [];
      for (let i = 0; i + 1 < r.p.length; i += 2) pts.push(p(r.p[i] ?? 0, r.p[i + 1] ?? 0));
      if (r.fechar && pts[0]) pts.push(pts[0]);
      tr.push({ pts, pena });
    }
  }
  return { nome, unicode, avanco: 100 * E + 2 * MARGEM, tracos: tr, formas, corte: [-200, 900] };
}

export function runas(): Glifo[] {
  return [
    ...ELEMENTOS_DA_FONTE.map((el, i) => glifo(`runa_${el}`, PRIMEIRA_RUNA + i, TRACOS_ELEMENTOS[el])),
    ...CLASSES_DA_FONTE.map((cl, i) => glifo(`runa_${cl}`, PRIMEIRA_CLASSE + i, RUNAS[cl]?.tracos ?? [])),
  ];
}
