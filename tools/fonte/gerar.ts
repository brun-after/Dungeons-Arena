// Gera a fonte do jogo, Runas de Filo (24/11/2026): `npm run fonte` grava src/assets/fontes/runas-de-filo.otf.
// Cada glifo é montado pela pena (pena.ts) e gravado como contorno CFF: o externo anti-horário, os furos horários.

import { writeFileSync } from 'node:fs';
import opentype from 'opentype.js';
import type { MultiPolygon, Ring } from 'polygon-clipping';
import { digitos } from './digitos';
import { maiusculas, C, type Glifo } from './maiusculas';
import { compostos, desenharAcento } from './acentos';
import { minusculas } from './minusculas';
import { caixaX, deslocar, montar, unir } from './pena';
import { runas } from './runas';
import { FONTE_DO_JOGO } from '../../src/ui/runa-texto';

export const FAMILIA = FONTE_DO_JOGO;

function area(r: Ring): number {
  let s = 0;
  for (let i = 1; i < r.length; i++) {
    const a = r[i - 1], b = r[i];
    if (a && b) s += a[0] * b[1] - b[0] * a[1];
  }
  return s / 2;
}

function caminho(forma: MultiPolygon): opentype.Path {
  const path = new opentype.Path();
  for (const poli of forma) poli.forEach((anel, i) => {
    const externo = i === 0;
    const pts = (area(anel) > 0) === externo ? anel : [...anel].reverse();
    pts.slice(0, -1).forEach(([x, y], j) => (j ? path.lineTo(Math.round(x), Math.round(y)) : path.moveTo(Math.round(x), Math.round(y))));
    path.close();
  });
  return path;
}

export function glifos(): Glifo[] {
  return [...maiusculas(), ...minusculas(), ...digitos(), ...runas()];
}

/** A forma do glifo já no lugar (recuos aplicados) e o avanço. */
function posicionar(g: Glifo, forma: MultiPolygon): { forma: MultiPolygon; avanco: number } {
  if (!forma.length) return { forma, avanco: g.avanco };
  const [a, b] = caixaX(forma);
  // Com recuos, o avanço sai do contorno; sem eles (algarismos, runas), o desenho fica centrado no avanço fixo.
  const esq = g.lados ? g.lados[0] : (g.avanco - (b - a)) / 2;
  return { forma: deslocar(forma, esq - a), avanco: g.lados ? Math.round(b - a + g.lados[0] + g.lados[1]) : g.avanco };
}

const nomeDe = (unicode: number) => (unicode === 32 ? 'space' : `uni${unicode.toString(16).toUpperCase().padStart(4, '0')}`);

export function gerarFonte(): opentype.Font {
  const lista: opentype.Glyph[] = [new opentype.Glyph({ name: '.notdef', unicode: 0, advanceWidth: 500, path: new opentype.Path() })];
  const brutos = new Map<string, { g: Glifo; forma: MultiPolygon }>();
  for (const g of glifos()) {
    const forma = montar(g.tracos ?? [], g.formas ?? [], g.corte ?? [0, C]);
    brutos.set(String.fromCodePoint(g.unicode), { g, forma });
    const p = posicionar(g, forma);
    lista.push(new opentype.Glyph({ name: nomeDe(g.unicode), unicode: g.unicode, advanceWidth: p.avanco, path: caminho(p.forma) }));
  }
  for (const [c, { base, acento }, topo] of compostos()) {
    const b = brutos.get(base);
    if (!b) throw new Error(`Sem a base ${base} para ${c}`);
    const [x0, x1] = caixaX(b.forma);
    const ac = desenharAcento(acento, (x0 + x1) / 2, topo);
    const forma = unir(b.forma, montar(ac.tracos, ac.formas, [-300, 1000]));
    // A caixa da base manda nos recuos: o acento não alarga a letra.
    const p = posicionar(b.g, b.forma);
    const desloc = caixaX(p.forma)[0] - x0;
    const unicode = c.codePointAt(0) ?? 0;
    lista.push(new opentype.Glyph({ name: nomeDe(unicode), unicode, advanceWidth: p.avanco, path: caminho(deslocar(forma, desloc)) }));
  }
  return new opentype.Font({
    familyName: FAMILIA, styleName: 'Regular', unitsPerEm: 1000, ascender: 900, descender: -250,
    designer: 'Dungeons Dimensions', glyphs: lista,
    // Criação fixa (a modificação o opentype.js carimba com a hora; o teste compara os glifos, não os bytes).
    createdTimestamp: 1795651200,
  });
}

const saida = process.argv[2];
if (saida && process.argv[1]?.endsWith('gerar.ts')) {
  const buf = gerarFonte().toArrayBuffer();
  writeFileSync(saida, Buffer.from(buf));
  console.log(`${saida}: ${glifos().length + compostos().length} glifos, ${(buf.byteLength / 1024).toFixed(1)} KB`);
}
