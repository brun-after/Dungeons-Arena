// Presets de partícula (§2.16, D-055/D-056). Marco 12 (14/10/2026). Dado puro: cada preset é uma lista
// de emissões (textura, quantidade, vida, velocidade, gravidade, escala, transparência, mistura). As
// habilidades escolhem presets pelo nome no bloco `visual`; nada aqui é código por efeito.
// Marco 11A (16/10/2026, D-066): mais partículas e menos formas desenhadas — formas de emissão (anel, linha, cone,
// espiral), cor ao longo da vida, giro, arrasto e texturas novas (gota, floco, runa, bolha, lasca, corte, chama).
// Os anéis e ondas viraram explosões de partículas. Um preset por fantasia: corte, runas, cristais, bolhas, sombra,
// sangue, sagrado, pedra, vento, chamas e relâmpago.

import type { PresetVisual } from '../combat/habilidades';

export const TEXTURAS_PARTICULA = ['ponto', 'brilho', 'fumaca', 'anel', 'estrela', 'faisca', 'gota', 'floco', 'runa', 'bolha', 'lasca', 'corte', 'chama'] as const;
export type TexturaParticula = (typeof TEXTURAS_PARTICULA)[number];

/** Onde as partículas nascem: no ponto (com `raio` de espalhamento), num anel, ao longo do segmento, num cone, ou em espiral. */
export type FormaEmissao = 'ponto' | 'anel' | 'linha' | 'cone' | 'espiral';

export interface Emissao {
  textura: TexturaParticula;
  quantidade: number;
  vidaMs: readonly [number, number];
  /** Velocidade em px de mundo por segundo. */
  velocidade: readonly [number, number];
  /** `livre`: qualquer direção; `cima`/`baixo`: leque; `fora`: para longe do centro (anel e espiral). */
  direcao: 'livre' | 'cima' | 'baixo' | 'fora';
  /** px/s² (positivo puxa para baixo na tela). */
  gravidade: number;
  escala: readonly [number, number];
  alpha: readonly [number, number];
  aditivo: boolean;
  /** Espalhamento inicial em px em torno da origem (no anel e na espiral, o raio do círculo). */
  raio: number;
  /** null = usa a cor pedida pela habilidade. */
  cor: number | null;
  forma?: FormaEmissao;
  /** Cor no fim da vida (interpola do início); null/ausente = não muda. */
  corFinal?: number | null;
  /** Giro em rad/s (sorteado no intervalo); desligado com movimento reduzido. */
  giro?: readonly [number, number];
  /** Freio por segundo (0 a 1): 0,8 perde 80% da velocidade em 1 s. */
  arrasto?: number;
}

/** `onda` (a explosão pela área, D-060), `poeira` e `aura` são internos; os demais, os das habilidades. */
export type NomePreset = PresetVisual | 'poeira' | 'aura' | 'onda';

const faiscas: Emissao = { textura: 'faisca', quantidade: 12, vidaMs: [180, 340], velocidade: [140, 300], direcao: 'livre', gravidade: 320, escala: [0.8, 0.2], alpha: [1, 0], aditivo: true, raio: 4, cor: null, arrasto: 0.6 };
const brilho: Emissao = { textura: 'brilho', quantidade: 10, vidaMs: [300, 520], velocidade: [20, 60], direcao: 'cima', gravidade: 0, escala: [0.9, 0.1], alpha: [0.9, 0], aditivo: true, raio: 10, cor: null };
const fumaca: Emissao = { textura: 'fumaca', quantidade: 7, vidaMs: [600, 1000], velocidade: [10, 30], direcao: 'cima', gravidade: -10, escala: [0.5, 1.5], alpha: [0.45, 0], aditivo: false, raio: 8, cor: 0x777777, arrasto: 0.4 };
/** O "anel" em partículas: pontos de luz saindo em círculo. */
const anelDeLuz: Emissao = { textura: 'brilho', quantidade: 18, vidaMs: [320, 420], velocidade: [70, 90], direcao: 'fora', gravidade: 0, escala: [0.7, 0.2], alpha: [1, 0], aditivo: true, raio: 10, cor: null, forma: 'anel', arrasto: 0.5 };

export const PRESETS_PARTICULA: Readonly<Record<NomePreset, readonly Emissao[]>> = {
  faiscas: [faiscas],
  brilho: [brilho],
  fumaca: [fumaca],
  anel: [anelDeLuz, { ...brilho, quantidade: 4, raio: 4 }],
  rastro: [{ ...brilho, quantidade: 4, vidaMs: [220, 360], velocidade: [0, 10], escala: [0.6, 0.05], raio: 3 }],
  estrelas: [{ textura: 'estrela', quantidade: 5, vidaMs: [500, 800], velocidade: [15, 40], direcao: 'cima', gravidade: 0, escala: [0.7, 0.3], alpha: [1, 0], aditivo: true, raio: 12, cor: 0xf1c40f, giro: [-3, 3] }],
  brasas: [{ textura: 'ponto', quantidade: 6, vidaMs: [500, 900], velocidade: [20, 50], direcao: 'cima', gravidade: -40, escala: [0.5, 0.1], alpha: [1, 0], aditivo: true, raio: 10, cor: 0xffb347, corFinal: 0xc0392b }],
  explosao: [
    { ...anelDeLuz, quantidade: 26, velocidade: [140, 180], vidaMs: [300, 380] },
    { ...faiscas, quantidade: 18, velocidade: [160, 340] },
    { textura: 'chama', quantidade: 10, vidaMs: [260, 420], velocidade: [40, 120], direcao: 'livre', gravidade: -60, escala: [0.9, 0.3], alpha: [1, 0], aditivo: true, raio: 10, cor: 0xffd27a, corFinal: 0xc0392b, arrasto: 0.7 },
    { ...fumaca, quantidade: 8, raio: 14 },
  ],
  raio: [{ ...brilho, quantidade: 16, vidaMs: [140, 240], velocidade: [0, 20], escala: [0.6, 0.2], raio: 3 }],
  // --- Marco 11A: um por fantasia.
  corte: [
    { textura: 'corte', quantidade: 1, vidaMs: [180, 220], velocidade: [0, 0], direcao: 'livre', gravidade: 0, escala: [0.9, 1.5], alpha: [1, 0], aditivo: true, raio: 0, cor: null },
    { ...faiscas, quantidade: 6, vidaMs: [140, 240], velocidade: [120, 220] },
  ],
  runas: [
    { textura: 'runa', quantidade: 4, vidaMs: [500, 800], velocidade: [10, 30], direcao: 'cima', gravidade: -15, escala: [0.6, 0.9], alpha: [0.9, 0], aditivo: true, raio: 14, cor: null, giro: [-1.5, 1.5] },
    { ...brilho, quantidade: 8, raio: 12 },
  ],
  cristais: [
    { textura: 'lasca', quantidade: 10, vidaMs: [300, 520], velocidade: [90, 200], direcao: 'livre', gravidade: 260, escala: [0.8, 0.3], alpha: [1, 0], aditivo: true, raio: 4, cor: 0xe8f6ff, corFinal: 0x74b9ff, giro: [-8, 8], arrasto: 0.5 },
    { textura: 'floco', quantidade: 6, vidaMs: [700, 1100], velocidade: [8, 22], direcao: 'baixo', gravidade: 12, escala: [0.6, 0.3], alpha: [0.9, 0], aditivo: true, raio: 16, cor: 0xffffff, giro: [-2, 2] },
  ],
  bolhas: [
    { textura: 'bolha', quantidade: 8, vidaMs: [600, 1000], velocidade: [15, 40], direcao: 'cima', gravidade: -30, escala: [0.4, 0.8], alpha: [0.9, 0], aditivo: false, raio: 14, cor: null, arrasto: 0.3 },
    { textura: 'gota', quantidade: 6, vidaMs: [300, 500], velocidade: [60, 140], direcao: 'livre', gravidade: 300, escala: [0.6, 0.3], alpha: [1, 0], aditivo: false, raio: 4, cor: null },
  ],
  sombra: [
    { textura: 'fumaca', quantidade: 10, vidaMs: [600, 1000], velocidade: [15, 45], direcao: 'livre', gravidade: -8, escala: [0.6, 1.6], alpha: [0.6, 0], aditivo: false, raio: 10, cor: 0x2b1838, arrasto: 0.6 },
    { textura: 'ponto', quantidade: 10, vidaMs: [300, 500], velocidade: [60, 110], direcao: 'fora', gravidade: 0, escala: [0.4, 0.1], alpha: [1, 0], aditivo: true, raio: 26, cor: null, forma: 'espiral', arrasto: 0.4 },
  ],
  sangue: [
    { textura: 'gota', quantidade: 10, vidaMs: [320, 560], velocidade: [80, 180], direcao: 'livre', gravidade: 380, escala: [0.7, 0.4], alpha: [1, 0], aditivo: false, raio: 4, cor: 0xc0392b, corFinal: 0x5b0e0e },
    { textura: 'fumaca', quantidade: 4, vidaMs: [400, 700], velocidade: [10, 25], direcao: 'livre', gravidade: 0, escala: [0.5, 1.1], alpha: [0.35, 0], aditivo: false, raio: 6, cor: 0x8b1a1a },
  ],
  sagrado: [
    { textura: 'brilho', quantidade: 14, vidaMs: [500, 800], velocidade: [40, 80], direcao: 'cima', gravidade: -20, escala: [0.7, 0.1], alpha: [1, 0], aditivo: true, raio: 14, cor: 0xfff3c4, corFinal: null },
    { ...anelDeLuz, quantidade: 14, cor: 0xfff3c4 },
    { textura: 'estrela', quantidade: 3, vidaMs: [500, 700], velocidade: [10, 25], direcao: 'cima', gravidade: 0, escala: [0.5, 0.2], alpha: [1, 0], aditivo: true, raio: 12, cor: null, giro: [-2, 2] },
  ],
  pedra: [
    { textura: 'lasca', quantidade: 10, vidaMs: [400, 640], velocidade: [80, 180], direcao: 'cima', gravidade: 520, escala: [0.9, 0.6], alpha: [1, 0.2], aditivo: false, raio: 6, cor: 0x8d6e63, giro: [-6, 6] },
    { ...fumaca, quantidade: 6, cor: 0xa1887f, raio: 12 },
  ],
  vento: [
    { textura: 'faisca', quantidade: 16, vidaMs: [300, 460], velocidade: [90, 150], direcao: 'fora', gravidade: 0, escala: [0.9, 0.3], alpha: [0.8, 0], aditivo: true, raio: 22, cor: 0xe8f8f5, forma: 'espiral' },
    { ...fumaca, quantidade: 4, cor: 0xdfe6e9, alpha: [0.25, 0] },
  ],
  chamas: [
    { textura: 'chama', quantidade: 10, vidaMs: [380, 640], velocidade: [30, 70], direcao: 'cima', gravidade: -80, escala: [0.9, 0.2], alpha: [1, 0], aditivo: true, raio: 10, cor: 0xffd27a, corFinal: 0xc0392b },
    { textura: 'ponto', quantidade: 6, vidaMs: [500, 900], velocidade: [20, 50], direcao: 'cima', gravidade: -40, escala: [0.4, 0.1], alpha: [1, 0], aditivo: true, raio: 10, cor: 0xffb347 },
  ],
  relampago: [
    { textura: 'faisca', quantidade: 24, vidaMs: [90, 180], velocidade: [10, 60], direcao: 'livre', gravidade: 0, escala: [1, 0.4], alpha: [1, 0], aditivo: true, raio: 2, cor: 0xf7fbff, corFinal: null },
    { ...brilho, quantidade: 10, vidaMs: [120, 220], velocidade: [0, 30], escala: [0.9, 0.3], raio: 3 },
  ],
  poeira: [{ textura: 'ponto', quantidade: 1, vidaMs: [2500, 4000], velocidade: [3, 10], direcao: 'livre', gravidade: 0, escala: [0.25, 0.25], alpha: [0.25, 0], aditivo: false, raio: 220, cor: 0xd8cfb8 }],
  aura: [{ ...brilho, quantidade: 3, vidaMs: [400, 700], velocidade: [10, 25], escala: [0.5, 0.1], raio: 12 }],
  onda: [
    { ...anelDeLuz, quantidade: 36, velocidade: [200, 260], vidaMs: [340, 420], escala: [0.8, 0.3] },
    { ...anelDeLuz, textura: 'ponto', quantidade: 20, velocidade: [120, 160], vidaMs: [300, 380], escala: [0.5, 0.1] },
  ],
};
