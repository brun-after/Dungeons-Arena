// Catálogo dos modelos de criatura (§2.16). Marco 13 (14/10/2026), D-058.
// Os 11 da spec, os das invocações e o do jogador (aventureiro, com 2 quadros por vista). Cada modelo
// diz a sua cor base, o estilo de caminhada (render/caminhada.ts) e como se desenha nas duas vistas.
// Roda no Node, no build (plugin do atlas): nada de DOM aqui.

import type { EstiloCaminhada } from '../caminhada.ts';
import { bipede, type OpcoesBipede } from './bipede.ts';
import { aranha, falcao, lobo, slime } from './feras.ts';
import type { Vista } from './svg.ts';

export interface DefinicaoModelo {
  estilo: EstiloCaminhada;
  /** Quadros por vista (as classes jogáveis têm 2). */
  quadros: number;
  desenhar: (vista: Vista, quadro: number) => string;
}

const OLHO = 0xf5e663;

/**
 * Ajuste de 16/10/2026 (D-067): os modelos das classes jogáveis vêm sem arma e sem escudo; o que o jogador
 * equipa é desenhado por cima (render/adornos.ts, com modelos/adornos.ts), e as proporções ficam aqui para isso.
 */
export const OPCOES_JOGAVEIS = {
  necromante: { pele: 0xb7c7bb, roupa: 0x302439, olho: 0x7ee0bb, perna: 17, tronco: 14, ombro: 8, quadril: 6, cabeca: 6.5, veste: true, capuz: 0x261d32, capa: 0x49345e },
  aventureiro: { pele: 0xf0c8a0, roupa: 0x2e86c1, olho: 0x1b2631, perna: 15, tronco: 14, ombro: 8.5, quadril: 6.5, cabeca: 7 },
  guerreiro: { pele: 0xe8b98f, roupa: 0x7f8c8d, olho: 0x1b2631, perna: 15, tronco: 15, ombro: 10, quadril: 7, cabeca: 7, capa: 0x922b21 },
  mago: { pele: 0xf3d2b3, roupa: 0x2e4a8c, olho: 0x1b2631, perna: 17, tronco: 13, ombro: 7.5, quadril: 6, cabeca: 7, veste: true, chapeu: 0x24396b },
  arqueiro: { pele: 0xd9a77a, roupa: 0x27632a, olho: 0x1b2631, perna: 15, tronco: 14, ombro: 8, quadril: 6, cabeca: 7, capuz: 0x1e5631 },
} as const satisfies Readonly<Record<string, OpcoesBipede>>;

/** D-067: a arma da classe, desenhada enquanto a mão está vazia (as habilidades da classe não pedem item). */
export const ARMA_DE_CLASSE: Readonly<Record<keyof typeof OPCOES_JOGAVEIS, { arma: string; secundaria: string | null }>> = {
  necromante: { arma: 'cajado', secundaria: null },
  aventureiro: { arma: 'espada', secundaria: 'escudo' },
  guerreiro: { arma: 'machado', secundaria: 'escudo' },
  mago: { arma: 'cajado', secundaria: null },
  arqueiro: { arma: 'arco', secundaria: null },
};

export const MODELOS = {
  necromante: { estilo: 'deslizar', quadros: 2, desenhar: bipede(OPCOES_JOGAVEIS.necromante) },
  goblin: {
    estilo: 'passada',
    quadros: 1,
    desenhar: bipede({ pele: 0x6aa84f, roupa: 0x7f6000, olho: 0xffe599, perna: 11, tronco: 11, ombro: 7, quadril: 6, cabeca: 7, orelhas: true, arma: 'adaga' }),
  },
  esqueleto: {
    estilo: 'marcha',
    quadros: 1,
    desenhar: bipede({ pele: 0xe8e2cf, roupa: 0xd8d0b8, olho: 0x5dade2, perna: 16, tronco: 14, ombro: 7.5, quadril: 5, cabeca: 7, costelas: true, arma: 'espada' }),
  },
  orc: {
    estilo: 'marcha',
    quadros: 1,
    desenhar: bipede({ pele: 0x5b7f3a, roupa: 0x6b4f3a, olho: 0xe74c3c, perna: 15, tronco: 15, ombro: 11, quadril: 8, cabeca: 7.5, presas: true, arma: 'machado' }),
  },
  troll: {
    estilo: 'marcha',
    quadros: 1,
    desenhar: bipede({ pele: 0x6f8f7a, roupa: 0x4b5b45, olho: 0xf39c12, perna: 15, tronco: 18, ombro: 13, quadril: 9, cabeca: 7, presas: true, orelhas: true, arma: 'clava' }),
  },
  vampiro: {
    estilo: 'deslizar',
    quadros: 1,
    desenhar: bipede({ pele: 0xe6dde8, roupa: 0x2c2233, olho: 0xe74c3c, perna: 18, tronco: 14, ombro: 8, quadril: 6, cabeca: 6.5, veste: true, capa: 0x8e1b2a, presas: true }),
  },
  demonio: {
    estilo: 'passada',
    quadros: 1,
    desenhar: bipede({ pele: 0xb03a2e, roupa: 0x7b241c, olho: OLHO, perna: 16, tronco: 15, ombro: 10, quadril: 7, cabeca: 7, chifres: 0x2b2b2b, asas: 0x5b1a14, cauda: 0x7b241c, arma: 'foice' }),
  },
  generico: {
    estilo: 'passada',
    quadros: 1,
    desenhar: bipede({ pele: 0xc9b39b, roupa: 0x7f8c8d, olho: 0x222222, perna: 15, tronco: 14, ombro: 8, quadril: 6.5, cabeca: 7, arma: 'clava' }),
  },
  lobo: { estilo: 'quique', quadros: 1, desenhar: lobo(0x7f8a99) },
  aranha: { estilo: 'quique', quadros: 1, desenhar: aranha(0x3d2b4f) },
  slime: { estilo: 'quique', quadros: 1, desenhar: slime(0x58d68d) },
  // Marco 22 (D-089): o falcão do Aventureiro.
  falcao: { estilo: 'flutuar', quadros: 1, desenhar: falcao(0x8b5a2b) },
  cultista: {
    estilo: 'deslizar',
    quadros: 1,
    desenhar: bipede({ pele: 0xc9b39b, roupa: 0x5b2c6f, olho: 0xf1c40f, perna: 18, tronco: 14, ombro: 8, quadril: 6, cabeca: 7, veste: true, capuz: 0x4a235a, arma: 'cajado' }),
  },
  sombra: {
    estilo: 'flutuar',
    quadros: 1,
    desenhar: bipede({ pele: 0x2e2a3a, roupa: 0x1f1b2b, olho: 0x9b59b6, perna: 15, tronco: 13, ombro: 8, quadril: 6, cabeca: 7, veste: true, capuz: 0x1a1724, elevacao: 4 }),
  },
  sentinela: {
    estilo: 'marcha',
    quadros: 1,
    desenhar: bipede({ pele: 0x95a5a6, roupa: 0x7b8a8b, olho: 0x5dade2, perna: 14, tronco: 16, ombro: 12, quadril: 9, cabeca: 6.5, escudo: 0x5d6d7e, arma: 'espada' }),
  },
  fada: {
    estilo: 'flutuar',
    quadros: 1,
    desenhar: bipede({ pele: 0xf5d5c8, roupa: 0x76d7c4, olho: 0x1f618d, perna: 9, tronco: 9, ombro: 5, quadril: 4, cabeca: 5.5, asas: 0xd6eaf8, elevacao: 12 }),
  },
  espantalho: {
    estilo: 'quique',
    quadros: 1,
    desenhar: bipede({ pele: 0xe1c16e, roupa: 0x8d6e3f, olho: 0x111111, perna: 16, tronco: 14, ombro: 11, quadril: 6, cabeca: 7, chapeu: 0xa68a4f, arma: 'foice' }),
  },
  aventureiro: {
    estilo: 'passada',
    quadros: 2,
    desenhar: bipede(OPCOES_JOGAVEIS.aventureiro),
  },
  // Marco 14: as classes jogáveis (2 quadros por vista, §2.16).
  guerreiro: {
    estilo: 'marcha',
    quadros: 2,
    desenhar: bipede(OPCOES_JOGAVEIS.guerreiro),
  },
  mago: {
    estilo: 'deslizar',
    quadros: 2,
    desenhar: bipede(OPCOES_JOGAVEIS.mago),
  },
  arqueiro: {
    estilo: 'passada',
    quadros: 2,
    desenhar: bipede(OPCOES_JOGAVEIS.arqueiro),
  },
} as const satisfies Readonly<Record<string, DefinicaoModelo>>;

export type NomeModelo = keyof typeof MODELOS;

export function ehModelo(nome: string): nome is NomeModelo {
  return Object.hasOwn(MODELOS, nome);
}

/** Modelo do jogador enquanto não há classes com desenho próprio (marco 14). */
export const MODELO_JOGADOR: NomeModelo = 'aventureiro';
