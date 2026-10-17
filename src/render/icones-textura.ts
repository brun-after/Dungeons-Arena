// Ícones do conjunto no canvas (ajuste de 16/10/2026, D-067): o SVG vira imagem e textura uma vez por ícone e cor.
// Usado onde o Pixi desenha símbolos (marcadores do editor), no lugar dos emojis em `Text`.

import { Texture } from 'pixi.js';
import { svgDoIcone } from '../data/icones';

const cache = new Map<string, Texture>();

/** Carrega (e guarda) as texturas dos ícones pedidos, na cor dada; falha de decodificação deixa o ícone de fora. */
export async function carregarTexturasDeIcones(ids: readonly string[], cor = '#ffffff', tamanho = 64): Promise<void> {
  await Promise.all(
    ids.map(async (id) => {
      const chave = `${id}:${cor}`;
      if (cache.has(chave)) return;
      const img = new Image();
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgDoIcone(id, cor, tamanho))}`;
      try {
        await img.decode();
        cache.set(chave, Texture.from(img));
      } catch {
        // Sem a textura, quem desenha usa a forma de reserva.
      }
    }),
  );
}

/** A textura já carregada (ou undefined). */
export function texturaDoIcone(id: string, cor = '#ffffff'): Texture | undefined {
  return cache.get(`${id}:${cor}`);
}
