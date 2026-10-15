// Texturas dos tokens (§2.16). Marco 13 (14/10/2026), D-058.
// O atlas dos modelos vem pronto do build (`virtual:atlas-criaturas`): aqui o navegador só decodifica a
// imagem e recorta quadros e tiras. A imagem do personagem (token próprio) passa pelo mesmo fatiamento.
// Cada borda das tiras é arredondada de forma independente, para não acumular deriva (§2.16, fatiamento).

import atlas from 'virtual:atlas-criaturas';
import { Rectangle, Texture, type TextureSource } from 'pixi.js';
import { chaveQuadro } from './modelos/atlas';
import type { Vista } from './modelos/svg';
import { TIRAS } from './caminhada';

export interface FonteToken {
  /** O quadro inteiro (atalho de qualidade e vista de cima). */
  inteiro: Texture;
  /** 18 tiras horizontais, de cima para baixo. */
  tiras: Texture[];
  /** As mesmas tiras divididas em duas colunas (pernas do motor bípede). */
  colunas: [Texture, Texture][];
  /** Bordas de cada tira em px do quadro (TIRAS + 1 valores) e o meio das colunas. */
  bordas: number[];
  meio: number;
  largura: number;
  altura: number;
  ancoraX: number;
  ancoraY: number;
}

export function fatiar(source: TextureSource, quadro: { x: number; y: number; l: number; a: number }, ancoraX: number, ancoraY: number): FonteToken {
  const recorte = (x: number, y: number, l: number, a: number) => new Texture({ source, frame: new Rectangle(quadro.x + x, quadro.y + y, Math.max(1, l), Math.max(1, a)) });
  const bordas = Array.from({ length: TIRAS + 1 }, (_, i) => Math.round((i * quadro.a) / TIRAS));
  const meio = Math.round(quadro.l / 2);
  const tiras: Texture[] = [];
  const colunas: [Texture, Texture][] = [];
  for (let i = 0; i < TIRAS; i++) {
    const y0 = bordas[i] ?? 0;
    const a = (bordas[i + 1] ?? quadro.a) - y0;
    tiras.push(recorte(0, y0, quadro.l, a));
    colunas.push([recorte(0, y0, meio, a), recorte(meio, y0, quadro.l - meio, a)]);
  }
  return { inteiro: recorte(0, 0, quadro.l, quadro.a), tiras, colunas, bordas, meio, largura: quadro.l, altura: quadro.a, ancoraX, ancoraY };
}

export function destruirFonte(f: FonteToken): void {
  f.inteiro.destroy(false);
  for (const t of f.tiras) t.destroy(false);
  for (const [a, b] of f.colunas) {
    a.destroy(false);
    b.destroy(false);
  }
}

export interface BibliotecaCriaturas {
  fonte: (modelo: string, vista: Vista, quadro: number) => FonteToken | null;
}

/** Decodifica o atlas. Se falhar, devolve null e a cena usa as silhuetas (substituto visível). */
export async function carregarBiblioteca(): Promise<BibliotecaCriaturas | null> {
  try {
    const img = new Image();
    img.src = atlas.url;
    await img.decode();
    const source = Texture.from(img).source;
    const cache = new Map<string, FonteToken>();
    return {
      fonte: (modelo, vista, quadro) => {
        const chave = chaveQuadro(modelo, vista, quadro);
        const pronto = cache.get(chave);
        if (pronto) return pronto;
        const q = atlas.quadros[chave];
        if (!q) return null;
        const f = fatiar(source, q, q.ancoraX, q.ancoraY);
        cache.set(chave, f);
        return f;
      },
    };
  } catch {
    return null;
  }
}

/** Token próprio: a imagem já recortada vira duas fontes (em pé, pelos pés; de cima, pelo centro). */
export function fontesDoToken(imagem: HTMLCanvasElement): { emPe: FonteToken; cima: FonteToken; source: TextureSource } {
  const source = Texture.from(imagem).source;
  const q = { x: 0, y: 0, l: imagem.width, a: imagem.height };
  return { emPe: fatiar(source, q, 0.5, 1), cima: fatiar(source, q, 0.5, 0.5), source };
}
