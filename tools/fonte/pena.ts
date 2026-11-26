// A pena da fonte do jogo (24/11/2026). As letras são traçadas como na caligrafia: uma pena de bico chato, inclinada,
// percorre o esqueleto da letra, e a forma é a união de cada passo dela. É isso que dá o contraste das capitulares
// romanas (haste grossa, barra fina, bojo com o eixo inclinado) sem desenhar contorno à mão. As runas usam uma pena
// redonda, o mesmo traço monolinear de render/runas.ts. Coordenadas em unidades da fonte (1000 por eme), y para cima.

import clip, { type MultiPolygon, type Pair, type Polygon, type Ring } from 'polygon-clipping';

const { intersection, union } = clip;

export type Pt = readonly [number, number];

/** A pena: largura do bico, espessura e ângulo (graus). `redonda` usa um círculo de diâmetro `largura`. */
export interface Pena {
  largura: number;
  espessura: number;
  angulo: number;
  redonda?: boolean;
}

/** A pena padrão das letras: haste ~84, barra ~42 (contraste 2:1). */
export const PENA: Pena = { largura: 86, espessura: 14, angulo: 20 };

export interface Traco {
  pts: readonly Pt[];
  pena?: Partial<Pena>;
}

const PASSOS = 28;

export function reta(x1: number, y1: number, x2: number, y2: number): Pt[] {
  return [[x1, y1], [x2, y2]];
}

/** Bézier cúbica amostrada (inclui as duas pontas). */
export function cubica(p0: Pt, p1: Pt, p2: Pt, p3: Pt, passos = PASSOS): Pt[] {
  const r: Pt[] = [];
  for (let i = 0; i <= passos; i++) {
    const t = i / passos;
    const u = 1 - t;
    const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
    r.push([a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]]);
  }
  return r;
}

/** Bézier quadrática amostrada. */
export function quadratica(p0: Pt, c: Pt, p1: Pt, passos = PASSOS): Pt[] {
  return cubica(p0, [p0[0] + (2 / 3) * (c[0] - p0[0]), p0[1] + (2 / 3) * (c[1] - p0[1])], [p1[0] + (2 / 3) * (c[0] - p1[0]), p1[1] + (2 / 3) * (c[1] - p1[1])], p1, passos);
}

/** Arco de elipse de `a0` a `a1` graus (anti-horário quando a1 > a0). */
export function elipse(cx: number, cy: number, rx: number, ry: number, a0 = 0, a1 = 360, passos = 72): Pt[] {
  const r: Pt[] = [];
  const n = Math.max(8, Math.round((passos * Math.abs(a1 - a0)) / 360));
  for (let i = 0; i <= n; i++) {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    r.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return r;
}

/** Junta trechos de esqueleto num só (o fim de um é o começo do próximo). */
export function cam(...trechos: readonly (readonly Pt[])[]): Pt[] {
  const r: Pt[] = [];
  for (const t of trechos) for (const p of t) {
    const u = r[r.length - 1];
    if (!u || Math.hypot(u[0] - p[0], u[1] - p[1]) > 0.01) r.push(p);
  }
  return r;
}

function bico(p: Pena): Pt[] {
  if (p.redonda) return elipse(0, 0, p.largura / 2, p.largura / 2, 0, 360, 20).slice(0, -1);
  const a = (p.angulo * Math.PI) / 180;
  const ux = Math.cos(a) * (p.largura / 2), uy = Math.sin(a) * (p.largura / 2);
  const vx = -Math.sin(a) * (p.espessura / 2), vy = Math.cos(a) * (p.espessura / 2);
  return [[ux + vx, uy + vy], [-ux + vx, -uy + vy], [-ux - vx, -uy - vy], [ux - vx, uy - vy]];
}

/** Casco convexo (cadeia monótona), anti-horário. */
function casco(pts: Pt[]): Pt[] {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cruz = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const baixo: Pt[] = [];
  for (const q of p) {
    while (baixo.length >= 2 && cruz(baixo[baixo.length - 2] as Pt, baixo[baixo.length - 1] as Pt, q) <= 0) baixo.pop();
    baixo.push(q);
  }
  const cima: Pt[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i] as Pt;
    while (cima.length >= 2 && cruz(cima[cima.length - 2] as Pt, cima[cima.length - 1] as Pt, q) <= 0) cima.pop();
    cima.push(q);
  }
  return [...baixo.slice(0, -1), ...cima.slice(0, -1)];
}

const anel = (pts: readonly Pt[]): Ring => {
  const r: Pair[] = pts.map(([x, y]) => [Math.round(x * 4) / 4, Math.round(y * 4) / 4]);
  const f = r[0];
  if (f) r.push([f[0], f[1]]);
  return r;
};

/** A forma varrida pela pena ao longo do esqueleto. */
export function varrer(t: Traco, base: Pena = PENA): Polygon[] {
  const p = { ...base, ...t.pena };
  const b = bico(p);
  const partes: Polygon[] = [];
  const em = (q: Pt) => b.map(([x, y]) => [q[0] + x, q[1] + y] as Pt);
  if (t.pts.length === 1 && t.pts[0]) partes.push([anel(casco(em(t.pts[0])))]);
  for (let i = 1; i < t.pts.length; i++) {
    const a = t.pts[i - 1], c = t.pts[i];
    if (a && c) partes.push([anel(casco([...em(a), ...em(c)]))]);
  }
  return partes;
}

/** Losango (o núcleo do arcano), centrado. */
export function losango(cx: number, cy: number, rx: number, ry = rx): Polygon {
  return [anel([[cx, cy - ry], [cx + rx, cy], [cx, cy + ry], [cx - rx, cy]])];
}

/** Polígono livre a partir de pontos (amostras de curvas inclusive). */
export function poligono(pts: readonly Pt[]): Polygon {
  return [anel(pts)];
}

/**
 * Serifa com apoio curvo, na ponta de uma haste em (x, y). `cima` = a haste sobe a partir da serifa (pé na linha de
 * base); senão ela desce (serifa no topo). `meia` é a meia largura da haste; `esq` e `dir`, quanto a serifa passa dela.
 */
export function serifa(x: number, y: number, cima: boolean, esq: number, dir: number, meia = 42, alta = 26, apoio = 84): Polygon {
  const s = cima ? 1 : -1;
  const l = x - meia, r = x + meia;
  return poligono(cam(
    quadratica([l, y + s * apoio], [l, y + s * alta], [l - esq, y + s * alta], 10),
    [[l - esq, y], [r + dir, y]],
    quadratica([r + dir, y + s * alta], [r, y + s * alta], [r, y + s * apoio], 10),
  ));
}

/** Une traços e formas; `corte` limita só os traços (y mínimo e máximo), para as hastes terminarem retas. */
export function montar(tracos: readonly Traco[], formas: readonly Polygon[], corte?: readonly [number, number], pena: Pena = PENA): MultiPolygon {
  const varridos = tracos.flatMap((t) => varrer(t, pena));
  let corpo: MultiPolygon = varridos.length ? union(varridos[0] as Polygon, ...varridos.slice(1)) : [];
  if (corte && corpo.length) corpo = intersection(corpo, [anel([[-5000, corte[0]], [5000, corte[0]], [5000, corte[1]], [-5000, corte[1]]])]);
  return formas.length || corpo.length ? union(corpo, ...formas) : [];
}

/** Caixa (x mínimo e máximo) de uma forma montada. */
export function caixaX(forma: MultiPolygon): [number, number] {
  let a = Infinity, b = -Infinity;
  for (const poli of forma) for (const [x] of poli[0] ?? []) { a = Math.min(a, x); b = Math.max(b, x); }
  return a <= b ? [a, b] : [0, 0];
}

/** Desloca a forma em x. */
export function deslocar(forma: MultiPolygon, dx: number): MultiPolygon {
  return forma.map((poli) => poli.map((r) => r.map(([x, y]) => [x + dx, y] as Pair)));
}

/** União de duas formas montadas (a letra-base e o acento). */
export function unir(a: MultiPolygon, b: MultiPolygon): MultiPolygon {
  return a.length && b.length ? union(a, b) : a.length ? a : b;
}
