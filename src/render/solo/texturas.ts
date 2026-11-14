// As texturas do chão (marco 31, 31/10/2026, D-130): os webp de src/assets/texturas (CC0, ambientCG; licenças em
// LICENCAS.md), com hash do build e no cache do PWA. Cada cena carrega só as que o tema usa.

import { TEXTURAS_SOLO, type TexturaSolo } from '../../world/solo';

const URLS = import.meta.glob<string>('../../assets/texturas/*.webp', { eager: true, query: '?url', import: 'default' });

export function urlDaTextura(id: TexturaSolo): string | undefined {
  return Object.entries(URLS).find(([caminho]) => caminho.endsWith(`/${id}.webp`))?.[1];
}

export type TexturasDoSolo = ReadonlyMap<TexturaSolo, ImageBitmap>;

/**
 * Marco 41 (14/11/2026, D-169): as texturas decodificadas ficam guardadas entre as cenas (a troca de região montava
 * tudo de novo e decodificava cada webp outra vez). Uma que alguém fechou (largura 0) é carregada de novo.
 */
const guardadas = new Map<TexturaSolo, Promise<ImageBitmap | null>>();

async function decodificar(id: TexturaSolo): Promise<ImageBitmap | null> {
  const url = urlDaTextura(id);
  if (!url) return null;
  try {
    const resposta = await fetch(url);
    if (!resposta.ok) return null;
    return await createImageBitmap(await resposta.blob());
  } catch {
    // Sem a textura (offline sem cache, por exemplo): a cor lisa de antes.
    return null;
  }
}

async function texturaGuardada(id: TexturaSolo): Promise<ImageBitmap | null> {
  const antes = await guardadas.get(id);
  if (antes && antes.width > 0) return antes;
  const pedido = decodificar(id);
  guardadas.set(id, pedido);
  const img = await pedido;
  if (!img) guardadas.delete(id);
  return img;
}

/** Carrega as texturas pedidas; a que falhar fica de fora (o chão cai na cor lisa onde ela faltaria). */
export async function carregarTexturasDoSolo(ids: Iterable<TexturaSolo>): Promise<TexturasDoSolo> {
  const mapa = new Map<TexturaSolo, ImageBitmap>();
  const pedidos = [...new Set(ids)].filter((id) => (TEXTURAS_SOLO as readonly string[]).includes(id));
  await Promise.all(
    pedidos.map(async (id) => {
      const img = await texturaGuardada(id);
      if (img) mapa.set(id, img);
    }),
  );
  return mapa;
}
