// O registro das assinaturas visuais (marco 26, 29/10/2026, D-124). Uma entrada por nome da lista fechada de
// combat/assinaturas-visuais.ts — o tipo garante que nenhuma falta. As variantes são os toques que se somam ao acerto
// e à área (duas ultimates da mesma classe com a mesma assinatura se distinguem por eles).

import type { AssinaturaVisual, VarianteVisual } from '../../combat/assinaturas-visuais';
import type { Emissao } from '../presets-particula';
import type { DefAssinatura } from './cena';
import { brasas, em, faiscasMetal } from './emissoes';
import { ARCANO } from './familias/arcano';
import { ARMAS_VFX } from './familias/armas';
import { COMBATE } from './familias/combate';
import { CORRENTE } from './familias/corrente';
import { ELEMENTOS_VFX } from './familias/elementos';
import { FOGO } from './familias/fogo';
import { TREVAS } from './familias/trevas';

const TODAS = { ...FOGO, ...CORRENTE, ...ELEMENTOS_VFX, ...TREVAS, ...ARCANO, ...COMBATE, ...ARMAS_VFX };

/** Todas as assinaturas: o tipo exige uma por nome da lista fechada (e o teste confere que nenhuma sobra). */
export const ASSINATURAS: Readonly<Record<AssinaturaVisual, DefAssinatura>> = TODAS;

export const VARIANTES: Readonly<Record<VarianteVisual, readonly Emissao[]>> = {
  brasas: [brasas(5)],
  faiscas: [faiscasMetal(6)],
  penas: [em({ textura: 'pena', quantidade: 5, vidaMs: [600, 900], velocidade: [40, 110], gravidade: 40, arrasto: 1.5, escala: [0.4, 0.3], alpha: [1, 0], raio: 6, cor: 0xe8e0d0, giro: [-4, 4] })],
  ossos: [em({ textura: 'osso', quantidade: 4, vidaMs: [450, 700], velocidade: [100, 200], direcao: 'cima', abertura: 1.1, gravidade: 600, escala: [0.28, 0.22], alpha: [1, 0.6], raio: 6, cor: 0xece4d0, giro: [-10, 10] })],
  gelo: [em({ textura: 'gelo', quantidade: 5, vidaMs: [380, 600], velocidade: [90, 180], gravidade: 380, escala: [0.35, 0.22], alpha: [1, 0], raio: 4, cor: 0xe8f6ff, giro: [-8, 8] })],
  sangue: [em({ textura: 'gota_viva', quantidade: 6, vidaMs: [300, 500], velocidade: [80, 170], direcao: 'cima', abertura: 1.2, gravidade: 600, escala: [0.2, 0.12], alpha: [1, 0.3], raio: 3, cores: [0xd83040, 0x7a1020], esticar: 0.2 })],
  estrelas: [em({ textura: 'estrela', quantidade: 5, vidaMs: [400, 600], velocidade: [40, 100], direcao: 'cima', gravidade: 160, escala: [0.35, 0.15], alpha: [1, 0], aditivo: true, raio: 6, cor: 0xffe070, giro: [-6, 6] })],
  runas: [em({ textura: 'runa2', quantidade: 3, vidaMs: [500, 800], velocidade: [10, 30], direcao: 'cima', escala: [0.25, 0.4], alpha: [1, 0], aditivo: true, raio: 14, cor: null })],
  pedras: [em({ textura: 'rocha', quantidade: 5, vidaMs: [450, 700], velocidade: [100, 200], direcao: 'cima', abertura: 1.1, gravidade: 620, escala: [0.28, 0.2], alpha: [1, 0.7], raio: 6, cor: 0x8a7258, giro: [-6, 6] })],
  almas: [em({ textura: 'alma', quantidade: 3, vidaMs: [600, 900], velocidade: [30, 70], direcao: 'cima', gravidade: -50, escala: [0.35, 0.5], alpha: [0.9, 0], aditivo: true, raio: 8, cor: null })],
  laminas: [em({ textura: 'lamina', quantidade: 4, vidaMs: [300, 500], velocidade: [120, 220], arrasto: 1, escala: [0.4, 0.3], alpha: [1, 0], raio: 4, cor: 0xe8eef4, giro: [-12, 12] })],
  folhas: [em({ textura: 'folha', quantidade: 5, vidaMs: [700, 1000], velocidade: [20, 60], direcao: 'cima', gravidade: -10, escala: [0.3, 0.2], alpha: [1, 0], raio: 10, cor: 0x7ad07a, giro: [-3, 3] })],
  bolhas: [em({ textura: 'bolha', quantidade: 5, vidaMs: [500, 900], velocidade: [10, 40], direcao: 'cima', gravidade: -30, escala: [0.15, 0.4], alpha: [0.9, 0], raio: 10, cor: null })],
  som: [em({ textura: 'onda_som', quantidade: 3, vidaMs: [300, 450], velocidade: [60, 120], direcao: 'fora', forma: 'anel', escala: [0.3, 0.8], alpha: [1, 0], aditivo: true, raio: 6, cor: null })],
};

/** As texturas que cada assinatura usa (para o teste: nenhuma é só brilho e ponto). */
export function texturasDe(def: DefAssinatura): Set<string> {
  const s = new Set<string>();
  for (const lista of [def.conjuracao, def.corpo, def.rastro, def.impacto]) for (const e of lista ?? []) s.add(e.textura);
  return s;
}
