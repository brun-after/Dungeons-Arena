// A pintura dos desenhos procedurais (marco 31, 31/10/2026, D-130). Os enfeites e os objetos eram Graphics chapados,
// com cores saturadas e contorno: o ar de desenho infantil. Aqui cada desenho é renderizado uma vez numa textura e
// repintado no canvas: menos saturação, a luz vindo de cima (o pé mais escuro), um grão de pedra e uma borda escura
// macia no lugar do traço. O que brilha (chama, cristal, brasa) fica aceso. Cada desenho vira um sprite; a mesma
// chave reaproveita a textura (o cache vive com a cena).

import { CanvasSource, Graphics, Rectangle, Texture, type Renderer } from 'pixi.js';
import { hash2 } from './solo/ruido';

/** O quanto tira da saturação e escurece; a luz de cima e de baixo; o grão; a borda. */
const DESSATURA = 0.38;
const ESCURECE = 0.86;
const LUZ_TOPO = 1.12;
const LUZ_PE = 0.7;
const GRAO = 0.09;
const BORDA = 0.62;
/** Pixels da textura por pixel do desenho (nitidez no zoom). */
const RESOLUCAO = 2;
/** Folga em volta do desenho, em px. */
const FOLGA = 2;

/** A variante de um enfeite em 6 passos (o meio de cada faixa): os enfeites iguais dividem a textura. */
export function varianteEmPassos(v: number): number {
  return (Math.min(5, Math.floor(v * 6)) + 0.5) / 6;
}

/** Uma textura pintada e onde o canto dela fica no desenho original (a origem do Graphics). */
export interface Pintura {
  textura: Texture;
  x: number;
  y: number;
  largura: number;
  altura: number;
}

/** Repinta os pixels (RGBA) de uma imagem `l` × `a`. Puro (testável sem DOM). */
export function repintar(px: Uint8ClampedArray, l: number, a: number): void {
  const alfa = (x: number, y: number) => (x < 0 || y < 0 || x >= l || y >= a ? 0 : (px[(y * l + x) * 4 + 3] ?? 0));
  const original = new Uint8ClampedArray(px);
  for (let y = 0; y < a; y++) {
    const luz = LUZ_TOPO + (LUZ_PE - LUZ_TOPO) * (y / Math.max(1, a - 1));
    for (let x = 0; x < l; x++) {
      const i = (y * l + x) * 4;
      if ((original[i + 3] ?? 0) === 0) continue;
      let r = original[i] ?? 0;
      let g = original[i + 1] ?? 0;
      let b = original[i + 2] ?? 0;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      // O que brilha (claro e saturado, ou quase branco) fica como está: chama, brasa, cristal.
      const aceso = max > 225 && (max - min > 90 || min > 215);
      if (!aceso) {
        const lum = 0.3 * r + 0.59 * g + 0.11 * b;
        r = (r + (lum - r) * DESSATURA) * ESCURECE * luz;
        g = (g + (lum - g) * DESSATURA) * ESCURECE * luz;
        b = (b + (lum - b) * DESSATURA) * ESCURECE * luz;
        const grao = 1 + (hash2(x >> 1, y >> 1, 41) - 0.5) * 2 * GRAO;
        r *= grao;
        g *= grao;
        b *= grao;
        // A borda: perto do transparente (2 px), escurece; no lugar do contorno chapado.
        let perto = false;
        for (let dy = -2; dy <= 2 && !perto; dy++) for (let dx = -2; dx <= 2 && !perto; dx++) perto = alfa(x + dx, y + dy) < 60;
        if (perto) {
          r *= BORDA;
          g *= BORDA;
          b *= BORDA;
        }
      }
      px[i] = r;
      px[i + 1] = g;
      px[i + 2] = b;
    }
  }
}

export class PintorDeDesenhos {
  private readonly cache = new Map<string, Pintura | null>();

  constructor(private readonly renderer: Renderer) {}

  /** A pintura do desenho de `chave` (desenhado por `desenhar` uma vez); null se o desenho é vazio. */
  pintura(chave: string, desenhar: (g: Graphics) => void): Pintura | null {
    const pronta = this.cache.get(chave);
    if (pronta !== undefined) return pronta;
    const g = new Graphics();
    desenhar(g);
    const b = g.getLocalBounds();
    let resultado: Pintura | null = null;
    if (b.width > 0 && b.height > 0) {
      const quadro = new Rectangle(Math.floor(b.x) - FOLGA, Math.floor(b.y) - FOLGA, Math.ceil(b.width) + FOLGA * 2, Math.ceil(b.height) + FOLGA * 2);
      const extraido = this.renderer.extract.canvas({ target: g, frame: quadro, resolution: RESOLUCAO, clearColor: [0, 0, 0, 0] });
      const canvas = document.createElement('canvas');
      canvas.width = extraido.width;
      canvas.height = extraido.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(extraido as CanvasImageSource, 0, 0);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        repintar(img.data, canvas.width, canvas.height);
        ctx.putImageData(img, 0, 0);
        const textura = new Texture({ source: new CanvasSource({ resource: canvas, resolution: RESOLUCAO }) });
        resultado = { textura, x: quadro.x, y: quadro.y, largura: quadro.width, altura: quadro.height };
      }
    }
    g.destroy();
    this.cache.set(chave, resultado);
    return resultado;
  }

  destruir(): void {
    for (const p of this.cache.values()) p?.textura.destroy(true);
    this.cache.clear();
  }
}
