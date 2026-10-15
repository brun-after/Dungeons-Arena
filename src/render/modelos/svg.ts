// Peças de desenho dos modelos de criatura (§2.16). Marco 13 (14/10/2026), D-058.
// Funções puras que devolvem trechos de SVG; rodam no Node durante o build (plugin do atlas) e nos testes.
// Cada quadro mede 64 × 64 unidades. Na vista 3/4 os pés ficam em (32, 60); na vista de cima o centro é
// (32, 32) e a criatura olha para a direita (+x), o ângulo 0 da cena.

export type Vista = 'cima' | '34';

export const LADO_QUADRO = 64;
export const PES_Y = 60;
export const MEIO = 32;

const n = (v: number) => (Math.round(v * 10) / 10).toString();

/** `#rrggbb` de uma cor numérica. */
export function hex(cor: number): string {
  return `#${(cor & 0xffffff).toString(16).padStart(6, '0')}`;
}

/** Sombreamento por escurecimento paramétrico (§2.16): `f` de 0 (igual) a 1 (preto). */
export function escurecer(cor: number, f: number): number {
  const k = Math.max(0, Math.min(1, 1 - f));
  const r = Math.round(((cor >> 16) & 0xff) * k);
  const g = Math.round(((cor >> 8) & 0xff) * k);
  const b = Math.round((cor & 0xff) * k);
  return (r << 16) | (g << 8) | b;
}

/** Clareia em direção ao branco: `f` de 0 (igual) a 1 (branco). */
export function clarear(cor: number, f: number): number {
  const k = Math.max(0, Math.min(1, f));
  const canal = (c: number) => Math.round(c + (255 - c) * k);
  return (canal((cor >> 16) & 0xff) << 16) | (canal((cor >> 8) & 0xff) << 8) | canal(cor & 0xff);
}

const CONTORNO = '#0d0b12';

function estilo(cor: number, contorno: boolean): string {
  return contorno ? `fill="${hex(cor)}" stroke="${CONTORNO}" stroke-width="1.6" stroke-linejoin="round"` : `fill="${hex(cor)}"`;
}

export function elipse(cx: number, cy: number, rx: number, ry: number, cor: number, contorno = true): string {
  return `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" ${estilo(cor, contorno)}/>`;
}

export function circulo(cx: number, cy: number, r: number, cor: number, contorno = true): string {
  return elipse(cx, cy, r, r, cor, contorno);
}

export function retangulo(x: number, y: number, l: number, a: number, cor: number, raio = 1.5, contorno = true): string {
  return `<rect x="${n(x)}" y="${n(y)}" width="${n(l)}" height="${n(a)}" rx="${n(raio)}" ${estilo(cor, contorno)}/>`;
}

/** Polígono por lista de pontos `[x0, y0, x1, y1, …]`. */
export function poligono(pontos: readonly number[], cor: number, contorno = true): string {
  const pares: string[] = [];
  for (let i = 0; i + 1 < pontos.length; i += 2) pares.push(`${n(pontos[i] ?? 0)},${n(pontos[i + 1] ?? 0)}`);
  return `<polygon points="${pares.join(' ')}" ${estilo(cor, contorno)}/>`;
}

/** Traço sem preenchimento (pernas de aranha, cajados). */
export function linha(pontos: readonly number[], cor: number, largura: number): string {
  const pares: string[] = [];
  for (let i = 0; i + 1 < pontos.length; i += 2) pares.push(`${n(pontos[i] ?? 0)},${n(pontos[i + 1] ?? 0)}`);
  return `<polyline points="${pares.join(' ')}" fill="none" stroke="${hex(cor)}" stroke-width="${n(largura)}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

/** Par de olhos; na vista 3/4 ficam lado a lado, de frente para quem olha. */
export function olhos(cx: number, cy: number, distancia: number, raio: number, cor: number): string {
  return circulo(cx - distancia, cy, raio, cor, false) + circulo(cx + distancia, cy, raio, cor, false);
}

/** Espelha um trecho de SVG no eixo vertical do quadro (para desenhar um lado e reaproveitar). */
export function espelhar(conteudo: string): string {
  return `<g transform="translate(${LADO_QUADRO} 0) scale(-1 1)">${conteudo}</g>`;
}
