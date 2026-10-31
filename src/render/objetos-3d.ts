// Objetos pré-renderizados de modelos 3D CC0 (marco 31, 31/10/2026, D-130). As imagens saem de tools/objetos/ (KayKit
// Dungeon Remastered e Quaternius Fantasy Props MegaKit, licenças em src/assets/objetos/LICENCAS.md), no ângulo do
// isométrico e com a luz do clima sombrio; aqui viram texturas do Pixi, com a âncora nos pés (o centro da célula).
// Renderizadas a 96 px por célula: o jogo desenha na metade (48 px), nítido em tela de alta densidade. Enquanto a
// textura não chega (ou se falhar), quem pede recebe null e desenha como antes.

import { Assets, Sprite, type Texture } from 'pixi.js';
import CATALOGO from '../assets/objetos/catalogo.json';

const URLS = import.meta.glob<string>('../assets/objetos/*.webp', { eager: true, query: '?url', import: 'default' });
/** Pixels da imagem por pixel do jogo. */
const RESOLUCAO = 2;

export type NomeObjeto3d = keyof typeof CATALOGO;

export function ehObjeto3d(nome: string): nome is NomeObjeto3d {
  return Object.hasOwn(CATALOGO, nome);
}

export class ObjetosPreRenderizados {
  private readonly texturas = new Map<NomeObjeto3d, Texture>();
  private destruido = false;

  /** Carrega todas (são poucas e pequenas); as que falharem ficam de fora. */
  async carregar(): Promise<void> {
    await Promise.all(
      Object.keys(CATALOGO).map(async (nome) => {
        const url = Object.entries(URLS).find(([caminho]) => caminho.endsWith(`/${nome}.webp`))?.[1];
        if (!url || !ehObjeto3d(nome)) return;
        try {
          const t = await Assets.load<Texture>(url);
          if (!this.destruido) this.texturas.set(nome, t);
        } catch {
          // Sem a imagem: o desenho de antes.
        }
      }),
    );
  }

  tem(nome: string): boolean {
    return ehObjeto3d(nome) && this.texturas.has(nome);
  }

  /** Ajusta o sprite para mostrar o objeto com os pés em (0, 0) do sprite; false se a textura não está pronta. */
  aplicar(sprite: Sprite, nome: string): boolean {
    if (!ehObjeto3d(nome)) return false;
    const t = this.texturas.get(nome);
    if (!t) return false;
    const c = CATALOGO[nome];
    if (sprite.texture !== t) sprite.texture = t;
    sprite.anchor.set(c.ancoraX / c.largura, c.ancoraY / c.altura);
    sprite.scale.set(1 / RESOLUCAO);
    return true;
  }

  /** Um sprite novo do objeto, ou null. */
  sprite(nome: string): Sprite | null {
    const s = new Sprite();
    if (this.aplicar(s, nome)) return s;
    s.destroy();
    return null;
  }

  /** O tamanho do objeto no jogo (px de mundo), para quem posiciona coisas sobre ele. */
  medidas(nome: string): { largura: number; altura: number; ancoraX: number; ancoraY: number } | null {
    if (!ehObjeto3d(nome)) return null;
    const c = CATALOGO[nome];
    return { largura: c.largura / RESOLUCAO, altura: c.altura / RESOLUCAO, ancoraX: c.ancoraX / RESOLUCAO, ancoraY: c.ancoraY / RESOLUCAO };
  }

  destruir(): void {
    // As texturas ficam no cache do Assets (a próxima cena reaproveita).
    this.destruido = true;
    this.texturas.clear();
  }
}
