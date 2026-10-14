// Presets de partícula (§2.16, D-055/D-056). Marco 12 (14/10/2026). Dado puro: cada preset é uma lista
// de emissões (textura, quantidade, vida, velocidade, gravidade, escala, transparência, mistura). As
// habilidades escolhem presets pelo nome no bloco `visual`; nada aqui é código por efeito.

import type { PresetVisual } from '../combat/habilidades';

export type TexturaParticula = 'ponto' | 'brilho' | 'fumaca' | 'anel' | 'estrela' | 'faisca';

export interface Emissao {
  textura: TexturaParticula;
  quantidade: number;
  vidaMs: readonly [number, number];
  /** Velocidade em px de mundo por segundo. */
  velocidade: readonly [number, number];
  /** `livre`: qualquer direção; `cima`: leque para cima. */
  direcao: 'livre' | 'cima';
  /** px/s² (positivo puxa para baixo na tela). */
  gravidade: number;
  escala: readonly [number, number];
  alpha: readonly [number, number];
  aditivo: boolean;
  /** Espalhamento inicial em px em torno da origem. */
  raio: number;
  /** null = usa a cor pedida pela habilidade. */
  cor: number | null;
}

export type NomePreset = PresetVisual | 'poeira' | 'aura';

const faiscas: Emissao = { textura: 'faisca', quantidade: 10, vidaMs: [200, 360], velocidade: [120, 260], direcao: 'livre', gravidade: 300, escala: [0.7, 0.2], alpha: [1, 0], aditivo: true, raio: 4, cor: null };
const brilho: Emissao = { textura: 'brilho', quantidade: 8, vidaMs: [300, 520], velocidade: [20, 60], direcao: 'cima', gravidade: 0, escala: [0.8, 0.1], alpha: [0.9, 0], aditivo: true, raio: 10, cor: null };
const fumaca: Emissao = { textura: 'fumaca', quantidade: 6, vidaMs: [600, 900], velocidade: [10, 30], direcao: 'cima', gravidade: -10, escala: [0.5, 1.4], alpha: [0.5, 0], aditivo: false, raio: 8, cor: 0x777777 };
const anel: Emissao = { textura: 'anel', quantidade: 1, vidaMs: [380, 420], velocidade: [0, 0], direcao: 'livre', gravidade: 0, escala: [0.3, 2.2], alpha: [0.9, 0], aditivo: true, raio: 0, cor: null };

export const PRESETS_PARTICULA: Readonly<Record<NomePreset, readonly Emissao[]>> = {
  faiscas: [faiscas],
  brilho: [brilho],
  fumaca: [fumaca],
  anel: [anel],
  rastro: [{ ...brilho, quantidade: 2, vidaMs: [180, 280], velocidade: [0, 12], escala: [0.5, 0.1], raio: 2 }],
  estrelas: [{ textura: 'estrela', quantidade: 3, vidaMs: [500, 800], velocidade: [15, 35], direcao: 'cima', gravidade: 0, escala: [0.6, 0.3], alpha: [1, 0], aditivo: true, raio: 12, cor: 0xf1c40f }],
  brasas: [{ textura: 'ponto', quantidade: 4, vidaMs: [500, 900], velocidade: [20, 50], direcao: 'cima', gravidade: -40, escala: [0.5, 0.1], alpha: [1, 0], aditivo: true, raio: 10, cor: 0xff7a1a }],
  explosao: [{ ...anel, escala: [0.4, 3] }, { ...faiscas, quantidade: 16, velocidade: [160, 320] }, { ...fumaca, quantidade: 8, raio: 14 }],
  raio: [{ ...brilho, quantidade: 14, vidaMs: [160, 260], velocidade: [0, 20], escala: [0.6, 0.2], raio: 3 }],
  poeira: [{ textura: 'ponto', quantidade: 1, vidaMs: [2500, 4000], velocidade: [3, 10], direcao: 'livre', gravidade: 0, escala: [0.25, 0.25], alpha: [0.25, 0], aditivo: false, raio: 220, cor: 0xd8cfb8 }],
  aura: [{ ...brilho, quantidade: 2, vidaMs: [400, 700], velocidade: [10, 25], escala: [0.5, 0.1], raio: 12 }],
};
