// Partículas do mundo (marco 26, 26/10/2026): o ar em volta dos portais, um preset por estilo de destino (D-112), e
// as lascas dos quebráveis (D-113). Dado puro, no formato de presets-particula.ts. Os portais emitem pouco e devagar
// (render/portas.ts), e a cor vem do destino quando o preset não fixa uma.

import type { EstiloPortal } from '../world/temas';
import type { Emissao } from './presets-particula';

export type NomePresetMundo = `portal_${EstiloPortal}` | 'portal_par' | 'quebra_madeira' | 'quebra_barro' | 'quebra_cristal' | 'quebra_folhas';

/** As lascas de cada quebrável (D-113): madeira, barro, cristal ou folhas. */
export function presetDaQuebra(forma: string): NomePresetMundo {
  if (forma === 'vaso') return 'quebra_barro';
  if (forma === 'cristal') return 'quebra_cristal';
  if (forma === 'cogumelo' || forma === 'arbusto') return 'quebra_folhas';
  return 'quebra_madeira';
}

export const PRESETS_MUNDO: Readonly<Record<NomePresetMundo, readonly Emissao[]>> = {
  portal_pedra: [{ textura: 'brilho', quantidade: 1, vidaMs: [900, 1300], velocidade: [6, 14], direcao: 'cima', gravidade: 0, escala: [0.4, 0.05], alpha: [0.5, 0], aditivo: true, raio: 12, cor: null }],
  portal_gelo: [
    { textura: 'floco', quantidade: 1, vidaMs: [1200, 1800], velocidade: [6, 14], direcao: 'baixo', gravidade: 8, escala: [0.35, 0.2], alpha: [0.9, 0], aditivo: false, raio: 14, cor: 0xf2f8ff, giro: [-1, 1], alturaInicial: 22 },
    { textura: 'cristal', quantidade: 1, vidaMs: [600, 900], velocidade: [2, 6], direcao: 'livre', gravidade: 0, escala: [0.3, 0.1], alpha: [0.7, 0], aditivo: true, raio: 12, cor: 0xbfe8ff },
  ],
  portal_fogo: [{ textura: 'ponto', quantidade: 2, vidaMs: [600, 1000], velocidade: [18, 40], direcao: 'cima', gravidade: -30, escala: [0.45, 0.1], alpha: [1, 0], aditivo: true, raio: 10, cor: 0xffb347, corFinal: 0xc0392b }],
  portal_veneno: [{ textura: 'bolha', quantidade: 1, vidaMs: [900, 1400], velocidade: [6, 14], direcao: 'cima', gravidade: -8, escala: [0.25, 0.4], alpha: [0.7, 0], aditivo: false, raio: 12, cor: null }],
  portal_raio: [{ textura: 'faisca', quantidade: 2, vidaMs: [160, 280], velocidade: [60, 120], direcao: 'livre', gravidade: 0, escala: [0.5, 0.1], alpha: [1, 0], aditivo: true, raio: 12, cor: null, arrasto: 0.7 }],
  portal_trevas: [{ textura: 'fumaca', quantidade: 1, vidaMs: [1200, 1800], velocidade: [4, 10], direcao: 'cima', gravidade: -3, escala: [0.4, 1.0], alpha: [0.45, 0], aditivo: false, raio: 12, cor: 0x2a1840 }],
  portal_sagrado: [{ textura: 'estrela', quantidade: 1, vidaMs: [700, 1100], velocidade: [8, 18], direcao: 'cima', gravidade: -4, escala: [0.4, 0.1], alpha: [0.9, 0], aditivo: true, raio: 12, cor: 0xffe9a8, giro: [-2, 2] }],
  portal_terra: [{ textura: 'ponto', quantidade: 1, vidaMs: [900, 1400], velocidade: [3, 8], direcao: 'baixo', gravidade: 12, escala: [0.3, 0.2], alpha: [0.6, 0], aditivo: false, raio: 14, cor: 0xb89a6a, alturaInicial: 26 }],
  portal_psiquico: [{ textura: 'runa', quantidade: 1, vidaMs: [900, 1300], velocidade: [6, 14], direcao: 'livre', gravidade: 0, escala: [0.35, 0.15], alpha: [0.8, 0], aditivo: true, raio: 14, cor: null, giro: [-2, 2] }],
  /** O portal interno: brilhos subindo na cor do par. */
  portal_par: [{ textura: 'brilho', quantidade: 2, vidaMs: [700, 1100], velocidade: [10, 22], direcao: 'cima', gravidade: -6, escala: [0.45, 0.05], alpha: [0.85, 0], aditivo: true, raio: 10, cor: null }],
  quebra_madeira: [
    { textura: 'lasca', quantidade: 10, vidaMs: [400, 700], velocidade: [60, 130], direcao: 'cima', gravidade: 380, escala: [0.6, 0.3], alpha: [1, 0], aditivo: false, raio: 6, cor: 0x8a5a30, giro: [-8, 8], arrasto: 0.3 },
    { textura: 'fumaca', quantidade: 3, vidaMs: [400, 700], velocidade: [10, 30], direcao: 'cima', gravidade: -10, escala: [0.4, 0.9], alpha: [0.35, 0], aditivo: false, raio: 6, cor: 0x9a8a70 },
  ],
  quebra_barro: [
    { textura: 'lasca', quantidade: 9, vidaMs: [380, 650], velocidade: [60, 120], direcao: 'livre', gravidade: 400, escala: [0.5, 0.3], alpha: [1, 0], aditivo: false, raio: 5, cor: 0xb0643a, giro: [-6, 6], arrasto: 0.3 },
    { textura: 'fumaca', quantidade: 3, vidaMs: [400, 700], velocidade: [10, 25], direcao: 'cima', gravidade: -8, escala: [0.4, 0.9], alpha: [0.3, 0], aditivo: false, raio: 6, cor: 0xc8a080 },
  ],
  quebra_cristal: [{ textura: 'cristal', quantidade: 10, vidaMs: [350, 600], velocidade: [70, 140], direcao: 'livre', gravidade: 300, escala: [0.5, 0.2], alpha: [1, 0], aditivo: true, raio: 5, cor: null, giro: [-6, 6], arrasto: 0.3 }],
  quebra_folhas: [{ textura: 'lasca', quantidade: 9, vidaMs: [500, 900], velocidade: [30, 80], direcao: 'cima', gravidade: 120, escala: [0.5, 0.3], alpha: [1, 0], aditivo: false, raio: 8, cor: 0x5f8f3a, corFinal: 0x8aa04a, giro: [-4, 4], arrasto: 0.5 }],
};
