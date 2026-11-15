// As luzes do Mundo em pé (marco 43, 15/11/2026, D-177): o poste de tocha e a fogueira deixam o desenho chapado e
// usam os modelos pré-renderizados do cenário (src/assets/cenario, tools/objetos/receitas-cenario.ts), da mesma luz e
// do mesmo traço das árvores e das casas; a chama viva (animada) fica por cima, na boca do braseiro ou no meio da
// lenha. A textura carrega uma vez, sob demanda; até lá, quem chama desenha como antes.

import { Assets, type Sprite, type Texture } from 'pixi.js';
import CATALOGO from '../assets/cenario/catalogo.json';

export type TipoDeLuz = 'poste_tocha' | 'fogueira';

/**
 * As URLs dos modelos vêm de render/cenario-iso.ts (que as lista com o `import.meta.glob` do Vite); aqui não, para quem
 * empacota o render sem o Vite (as galerias dos testes de ponta a ponta) seguir funcionando: sem URL, desenha como antes.
 */
const URLS = new Map<TipoDeLuz, string>();
export function registrarUrlDaLuz(tipo: TipoDeLuz, url: string): void {
  URLS.set(tipo, url);
}

/** O cenário é renderizado a 96 px por célula e o jogo desenha a 48 (a metade). */
const RESOLUCAO = 2;

/** Onde a chama nasce (px acima dos pés) e o tamanho dela, por tipo. */
const CHAMA: Readonly<Record<TipoDeLuz, { base: number; alto: number }>> = {
  poste_tocha: { base: (CATALOGO.poste_tocha.ancoraY - 12) / RESOLUCAO, alto: 13 },
  fogueira: { base: 3, alto: 20 },
};

const texturas = new Map<TipoDeLuz, Texture>();
const pedidas = new Set<TipoDeLuz>();

export const ehLuzDoMundo = (tipo: string): tipo is TipoDeLuz => tipo === 'poste_tocha' || tipo === 'fogueira';

/** Põe a textura do modelo no sprite (âncora nos pés, metade da escala); false enquanto ela não carregou. */
export function aplicarLuzDoMundo(s: Sprite, tipo: TipoDeLuz): boolean {
  const t = texturas.get(tipo);
  if (!t) {
    if (!pedidas.has(tipo) && URLS.has(tipo)) {
      pedidas.add(tipo);
      const url = URLS.get(tipo);
      if (url) void Assets.load<Texture>(url).then((tx) => { texturas.set(tipo, tx); }).catch(() => undefined);
    }
    return false;
  }
  const c = CATALOGO[tipo];
  if (s.texture !== t) s.texture = t;
  s.anchor.set(c.ancoraX / c.largura, c.ancoraY / c.altura);
  s.scale.set(1 / RESOLUCAO);
  return true;
}

/** A chama da luz: px acima dos pés e a altura. */
export const chamaDaLuz = (tipo: TipoDeLuz): { base: number; alto: number } => CHAMA[tipo];
