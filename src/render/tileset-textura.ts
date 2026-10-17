// Texturas do tileset do jogador (§2.16). Marco 11A (16/10/2026), D-066: decodifica a imagem do atlas uma vez,
// recorta as células pelo fatiamento puro (world/tileset.ts) e materializa cada transformação D4 pedida num canvas
// próprio, com amostragem NEAREST (pixel art nítida). Também mede a cor média da parede (os prismas do isométrico).

import { CanvasSource, Texture } from 'pixi.js';
import { fatiar, matrizD4, resolverPeca, type Peca, type RecorteAtlas, type Vinculos } from '../world/tileset';

export interface TexturasTileset {
  readonly id: string;
  /** A textura da peça (com a reserva de rotação quando falta a própria); null se o atlas não tem. */
  textura: (p: Peca) => Texture | null;
  readonly corParede: number;
  destruir: () => void;
}

export interface FonteTileset {
  id: string;
  imagem: Blob;
  grade: 4 | 5;
  separacao: number;
  vinculos: Vinculos;
}

function corMedia(ctx: CanvasRenderingContext2D, r: RecorteAtlas): number {
  try {
    const dados = ctx.getImageData(r.x, r.y, r.largura, r.altura).data;
    let rs = 0;
    let gs = 0;
    let bs = 0;
    let n = 0;
    for (let i = 0; i < dados.length; i += 16) {
      if ((dados[i + 3] ?? 0) < 128) continue;
      rs += dados[i] ?? 0;
      gs += dados[i + 1] ?? 0;
      bs += dados[i + 2] ?? 0;
      n++;
    }
    if (n === 0) return 0x4a4458;
    return (Math.round(rs / n) << 16) | (Math.round(gs / n) << 8) | Math.round(bs / n);
  } catch {
    return 0x4a4458;
  }
}

/** Carrega um tileset; null se a imagem não decodifica ou a separação não deixa células. */
export async function carregarTexturasTileset(fonte: FonteTileset): Promise<TexturasTileset | null> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(fonte.imagem);
  } catch {
    return null;
  }
  const recortes = fatiar(bitmap.width, bitmap.height, fonte.grade, fonte.separacao);
  if (!recortes) {
    bitmap.close();
    return null;
  }
  const base = document.createElement('canvas');
  base.width = bitmap.width;
  base.height = bitmap.height;
  const ctxBase = base.getContext('2d', { willReadFrequently: true });
  if (!ctxBase) {
    bitmap.close();
    return null;
  }
  ctxBase.drawImage(bitmap, 0, 0);
  bitmap.close();
  const recorteDe = (chave: string): RecorteAtlas | undefined => {
    const c = fonte.vinculos[chave];
    if (!c) return undefined;
    const [col, lin] = c.split(',').map(Number);
    return recortes.find((r) => r.coluna === col && r.linha === lin);
  };
  const paredeBase = recorteDe('parede_N') ?? recorteDe('parede_int');
  const corParede = paredeBase ? corMedia(ctxBase, paredeBase) : 0x4a4458;
  const cache = new Map<string, Texture | null>();

  const materializar = (p: Peca): Texture | null => {
    const r = recorteDe(p.chave);
    if (!r) return null;
    const lado = Math.max(r.largura, r.altura);
    const canvas = document.createElement('canvas');
    canvas.width = lado;
    canvas.height = lado;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.imageSmoothingEnabled = false;
    const [a, b, c, d] = matrizD4(p.t);
    ctx.setTransform(a, b, c, d, lado / 2, lado / 2);
    ctx.drawImage(base, r.x, r.y, r.largura, r.altura, -lado / 2, -lado / 2, lado, lado);
    const source = new CanvasSource({ resource: canvas, scaleMode: 'nearest' });
    return new Texture({ source });
  };

  return {
    id: fonte.id,
    corParede,
    textura: (pedida) => {
      const p = resolverPeca(pedida, fonte.vinculos);
      if (!p) return null;
      const chave = `${p.chave}@${p.t}`;
      if (!cache.has(chave)) cache.set(chave, materializar(p));
      return cache.get(chave) ?? null;
    },
    destruir: () => {
      for (const t of cache.values()) t?.destroy(true);
      cache.clear();
    },
  };
}
