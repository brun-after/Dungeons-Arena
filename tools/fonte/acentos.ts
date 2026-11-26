// Os acentos do português na fonte do jogo (24/11/2026). Cada letra acentuada é composta: a base mais o acento,
// centrado na caixa da base (gerar.ts monta). O trema é um par de losangos, como o pingo do i.

import { C } from './maiusculas';
import { X } from './minusculas';
import { cam, cubica, losango, reta, type Pt, type Traco } from './pena';
import type { Polygon } from 'polygon-clipping';

export type Acento = 'agudo' | 'grave' | 'circunflexo' | 'til' | 'trema' | 'cedilha';

export interface Composto {
  base: string;
  acento: Acento;
}

const pena = { largura: 56, espessura: 12, angulo: 20 };

/** O acento centrado em `cx`, sobre uma base de altura `topo` (a cedilha vai sob a linha de base). */
export function desenharAcento(a: Acento, cx: number, topo: number): { tracos: Traco[]; formas: Polygon[] } {
  const y = topo + 60;
  const tr = (pts: Pt[]): Traco => ({ pts, pena });
  switch (a) {
    case 'agudo': return { tracos: [tr(reta(cx - 30, y, cx + 50, y + 120))], formas: [] };
    case 'grave': return { tracos: [tr(reta(cx + 30, y, cx - 50, y + 120))], formas: [] };
    case 'circunflexo': return { tracos: [tr(cam(reta(cx - 76, y, cx, y + 110), reta(cx, y + 110, cx + 76, y)))], formas: [] };
    case 'til': return { tracos: [tr(cubica([cx - 90, y + 20], [cx - 50, y + 110], [cx + 50, y + 10], [cx + 90, y + 100]))], formas: [] };
    case 'trema': return { tracos: [], formas: [losango(cx - 70, y + 50, 34, 44), losango(cx + 70, y + 50, 34, 44)] };
    case 'cedilha': return { tracos: [{ pts: cam(reta(cx, 10, cx, -50), cubica([cx, -50], [cx + 80, -50], [cx + 80, -170], [cx - 60, -170])), pena: { largura: 44, espessura: 10, angulo: 20 } }], formas: [] };
  }
}

const MINUSCULAS: readonly [string, string, Acento][] = [
  ['á', 'a', 'agudo'], ['à', 'a', 'grave'], ['â', 'a', 'circunflexo'], ['ã', 'a', 'til'], ['ä', 'a', 'trema'],
  ['é', 'e', 'agudo'], ['è', 'e', 'grave'], ['ê', 'e', 'circunflexo'], ['ë', 'e', 'trema'],
  ['í', 'ı', 'agudo'], ['ì', 'ı', 'grave'], ['î', 'ı', 'circunflexo'], ['ï', 'ı', 'trema'],
  ['ó', 'o', 'agudo'], ['ò', 'o', 'grave'], ['ô', 'o', 'circunflexo'], ['õ', 'o', 'til'], ['ö', 'o', 'trema'],
  ['ú', 'u', 'agudo'], ['ù', 'u', 'grave'], ['û', 'u', 'circunflexo'], ['ü', 'u', 'trema'],
  ['ç', 'c', 'cedilha'], ['ñ', 'n', 'til'],
];

/** As letras compostas: [caractere, base, acento, altura do topo da base]. */
export function compostos(): [string, Composto, number][] {
  const r: [string, Composto, number][] = MINUSCULAS.map(([c, base, acento]) => [c, { base, acento }, X]);
  for (const [c, base, acento] of MINUSCULAS) {
    const C1 = c.toUpperCase(), B1 = base === 'ı' ? 'I' : base.toUpperCase();
    if (C1 !== c) r.push([C1, { base: B1, acento }, C]);
  }
  return r;
}
