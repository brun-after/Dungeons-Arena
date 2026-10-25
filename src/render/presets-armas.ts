// Rastros e impactos dos golpes de arma (marco 24, 25/10/2026, D-098). Dado puro, no formato de presets-particula.ts:
// - corte: lâminas em leque, orientadas pela direção do golpe (a meia-lua com o lado convexo para o alvo);
// - machadada: o corte grosso, lascas e um tranco de poeira;
// - esmagar: o anel de choque no chão, poeira pesada e rachaduras curtas;
// - estocada: o traço longo da ponta e farpas;
// - o giro (Redemoinho): o vento girando junto do corpo e o anel de lâminas na borda;
// - as formas da arma: o brilho da gema (Épica), as brasas (Lendária) e o eco do golpe (Última).
// A cor do rastro vem de quem golpeia (elemento da arma, fúria do Guerreiro ou o aço).

import type { Emissao } from './presets-particula';

export type NomePresetArma =
  | 'golpe_corte'
  | 'golpe_machado'
  | 'golpe_esmagar'
  | 'golpe_cajado'
  | 'golpe_estocada'
  | 'golpe_estocada_rapida'
  | 'golpe_faiscas'
  | 'forma_epica'
  | 'forma_lendaria'
  | 'forma_ultima'
  | 'vento_giro'
  | 'laminas_giro';

/** A lâmina do corte: meia-lua que cresce e some, orientada pelo golpe (com `abertura`, um leque). */
const lamina = (quantidade: number, escala: readonly [number, number], abertura: number, vidaMs: readonly [number, number]): Emissao => ({
  textura: 'corte', quantidade, vidaMs, velocidade: [30, 70], direcao: 'orientada', abertura, gravidade: 0, escala, alpha: [1, 0], aditivo: true, raio: 2, cor: null, arrasto: 0.8,
});

const faiscaDoMetal: Emissao = { textura: 'faisca', quantidade: 8, vidaMs: [140, 260], velocidade: [160, 300], direcao: 'orientada', abertura: 0.9, gravidade: 380, escala: [0.7, 0.15], alpha: [1, 0], aditivo: true, raio: 3, cor: 0xfff1c9, arrasto: 0.5 };
const poeira: Emissao = { textura: 'fumaca', quantidade: 6, vidaMs: [500, 800], velocidade: [40, 80], direcao: 'fora', gravidade: 0, escala: [0.4, 1.2], alpha: [0.45, 0], aditivo: false, raio: 8, cor: 0xa1887f, forma: 'anel', arrasto: 0.9 };

export const PRESETS_ARMAS: Readonly<Record<NomePresetArma, readonly Emissao[]>> = {
  golpe_corte: [lamina(3, [1.1, 1.9], 0.45, [170, 230]), { ...faiscaDoMetal, quantidade: 5 }],
  golpe_machado: [
    lamina(2, [1.6, 2.6], 0.3, [200, 260]),
    { textura: 'lasca', quantidade: 6, vidaMs: [300, 520], velocidade: [90, 180], direcao: 'orientada', abertura: 0.8, gravidade: 520, escala: [0.7, 0.4], alpha: [1, 0], aditivo: false, raio: 4, cor: 0x9e8a78, giro: [-8, 8] },
    { ...poeira, quantidade: 4 },
  ],
  golpe_esmagar: [
    { textura: 'anel', quantidade: 2, vidaMs: [260, 360], velocidade: [0, 0], direcao: 'livre', gravidade: 0, escala: [0.4, 2.4], alpha: [0.95, 0], aditivo: true, raio: 0, cor: null },
    poeira,
    { textura: 'lasca', quantidade: 8, vidaMs: [380, 600], velocidade: [70, 150], direcao: 'cima', gravidade: 560, escala: [0.8, 0.5], alpha: [1, 0.2], aditivo: false, raio: 6, cor: 0x8d6e63, giro: [-6, 6] },
    { textura: 'arco', quantidade: 4, vidaMs: [900, 1200], velocidade: [0, 0], direcao: 'fora', gravidade: 0, escala: [0.7, 0.7], alpha: [0.8, 0], aditivo: true, raio: 10, cor: 0xd8c3a5, corFinal: 0x3a2a20, forma: 'anel' },
  ],
  golpe_cajado: [
    { textura: 'anel', quantidade: 1, vidaMs: [220, 300], velocidade: [0, 0], direcao: 'livre', gravidade: 0, escala: [0.3, 1.5], alpha: [0.9, 0], aditivo: true, raio: 0, cor: null },
    { ...poeira, quantidade: 3, escala: [0.3, 0.8] },
  ],
  golpe_estocada: [
    { textura: 'faisca', quantidade: 3, vidaMs: [160, 220], velocidade: [220, 320], direcao: 'orientada', abertura: 0.05, gravidade: 0, escala: [1.6, 0.4], alpha: [1, 0], aditivo: true, raio: 1, cor: null, arrasto: 0.6 },
    { textura: 'lasca', quantidade: 4, vidaMs: [200, 340], velocidade: [80, 160], direcao: 'orientada', abertura: 0.5, gravidade: 300, escala: [0.45, 0.25], alpha: [1, 0], aditivo: false, raio: 2, cor: 0xc9b79c },
  ],
  golpe_estocada_rapida: [
    { textura: 'faisca', quantidade: 4, vidaMs: [110, 170], velocidade: [200, 300], direcao: 'orientada', abertura: 0.25, gravidade: 0, escala: [1.1, 0.3], alpha: [1, 0], aditivo: true, raio: 3, cor: null, arrasto: 0.6 },
  ],
  golpe_faiscas: [faiscaDoMetal],
  // As formas da arma por cima do golpe.
  forma_epica: [{ textura: 'estrela', quantidade: 2, vidaMs: [300, 460], velocidade: [20, 50], direcao: 'cima', gravidade: 0, escala: [0.45, 0.1], alpha: [1, 0], aditivo: true, raio: 6, cor: 0xc39bd3, giro: [-4, 4] }],
  forma_lendaria: [
    { textura: 'ponto', quantidade: 6, vidaMs: [400, 700], velocidade: [30, 70], direcao: 'cima', gravidade: -40, escala: [0.4, 0.05], alpha: [1, 0], aditivo: true, raio: 8, cor: 0xffc266, corFinal: 0xd35400 },
    { textura: 'brilho', quantidade: 3, vidaMs: [200, 320], velocidade: [0, 10], direcao: 'livre', gravidade: 0, escala: [1, 0.3], alpha: [0.8, 0], aditivo: true, raio: 4, cor: 0xf39c12 },
  ],
  forma_ultima: [
    lamina(2, [2.2, 3.2], 0.6, [260, 340]),
    { textura: 'brilho', quantidade: 5, vidaMs: [260, 420], velocidade: [10, 40], direcao: 'livre', gravidade: 0, escala: [1.1, 0.2], alpha: [0.9, 0], aditivo: true, raio: 8, cor: 0xff4d6d },
  ],
  // O Redemoinho: o vento girando com o corpo (reemitido a cada quadro) e as lâminas tangentes na borda.
  vento_giro: [
    { textura: 'faisca', quantidade: 3, vidaMs: [220, 340], velocidade: [140, 200], direcao: 'fora', gravidade: 0, escala: [1, 0.3], alpha: [0.85, 0], aditivo: true, raio: 26, cor: 0xeef6f8, forma: 'espiral', arrasto: 0.4 },
    { textura: 'fumaca', quantidade: 1, vidaMs: [380, 560], velocidade: [60, 100], direcao: 'fora', gravidade: 0, escala: [0.4, 1], alpha: [0.25, 0], aditivo: false, raio: 18, cor: 0xdfe6e9, forma: 'espiral', arrasto: 0.6 },
  ],
  laminas_giro: [{ textura: 'corte', quantidade: 10, vidaMs: [200, 280], velocidade: [10, 30], direcao: 'fora', gravidade: 0, escala: [1.2, 1.8], alpha: [1, 0], aditivo: true, raio: 40, cor: null, forma: 'espiral' }],
};
