// Catálogo dos modelos de criatura (§2.16). Marco 13 (14/10/2026), D-058.
// Os 11 da spec, os das invocações e os das classes (marco 26: 6 quadros de braços e pernas por vista). Cada modelo
// diz a sua cor base, o estilo de caminhada (render/caminhada.ts) e como se desenha nas duas vistas.
// Roda no Node, no build (plugin do atlas): nada de DOM aqui.

import type { EstiloCaminhada } from '../caminhada.ts';
import { bipede, type OpcoesBipede } from './bipede.ts';
import { aranha, dragao, falcao, lobo, slime } from './feras.ts';
import { cartola, pombo } from './magico.ts';
import { QUADROS_MEMBROS } from './membros.ts';
import type { Vista } from './svg.ts';

export interface DefinicaoModelo {
  estilo: EstiloCaminhada;
  /** Quadros por vista. Marco 26 (D-108): 6 nos que mexem braços e pernas (modelos/membros.ts). */
  quadros: number;
  /** Os quadros são a passada e o golpe (escolhidos pela fase do passo), não uma sequência própria (o falcão). */
  membros: boolean;
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
  // Marco 27 (D-126): a família de cada classe (o tomo do Mago, o bumerangue do Aventureiro).
  necromante: { arma: 'cajado', secundaria: null },
  aventureiro: { arma: 'bumerangue', secundaria: null },
  guerreiro: { arma: 'machado', secundaria: 'escudo' },
  mago: { arma: 'tomo', secundaria: null },
  arqueiro: { arma: 'arco', secundaria: null },
};

export const MODELOS = {
  dragao_fogo: { estilo: 'deslizar', quadros: QUADROS_MEMBROS, membros: true, desenhar: dragao(0x45474e) },
  dragao_gelo: { estilo: 'deslizar', quadros: QUADROS_MEMBROS, membros: true, desenhar: dragao(0x45474e) },
  dragao_raio: { estilo: 'deslizar', quadros: QUADROS_MEMBROS, membros: true, desenhar: dragao(0x45474e) },
  dragao_veneno: { estilo: 'deslizar', quadros: QUADROS_MEMBROS, membros: true, desenhar: dragao(0x45474e) },
  necromante: { estilo: 'deslizar', quadros: QUADROS_MEMBROS, membros: true, desenhar: bipede(OPCOES_JOGAVEIS.necromante) },
  goblin: {
    estilo: 'passada',
    quadros: QUADROS_MEMBROS, membros: true,
    desenhar: bipede({ pele: 0x6aa84f, roupa: 0x7f6000, olho: 0xffe599, perna: 11, tronco: 11, ombro: 7, quadril: 6, cabeca: 7, orelhas: true, arma: 'adaga' }),
  },
  esqueleto: {
    estilo: 'marcha',
    quadros: QUADROS_MEMBROS, membros: true,
    desenhar: bipede({ pele: 0xe8e2cf, roupa: 0xd8d0b8, olho: 0x5dade2, perna: 16, tronco: 14, ombro: 7.5, quadril: 5, cabeca: 7, costelas: true, arma: 'espada' }),
  },
  orc: {
    estilo: 'marcha',
    quadros: QUADROS_MEMBROS, membros: true,
    desenhar: bipede({ pele: 0x5b7f3a, roupa: 0x6b4f3a, olho: 0xe74c3c, perna: 15, tronco: 15, ombro: 11, quadril: 8, cabeca: 7.5, presas: true, arma: 'machado' }),
  },
  troll: {
    estilo: 'marcha',
    quadros: QUADROS_MEMBROS, membros: true,
    desenhar: bipede({ pele: 0x6f8f7a, roupa: 0x4b5b45, olho: 0xf39c12, perna: 15, tronco: 18, ombro: 13, quadril: 9, cabeca: 7, presas: true, orelhas: true, arma: 'clava' }),
  },
  vampiro: {
    estilo: 'deslizar',
    quadros: QUADROS_MEMBROS, membros: true,
    desenhar: bipede({ pele: 0xe6dde8, roupa: 0x2c2233, olho: 0xe74c3c, perna: 18, tronco: 14, ombro: 8, quadril: 6, cabeca: 6.5, veste: true, capa: 0x8e1b2a, presas: true }),
  },
  demonio: {
    estilo: 'passada',
    quadros: QUADROS_MEMBROS, membros: true,
    desenhar: bipede({ pele: 0xb03a2e, roupa: 0x7b241c, olho: OLHO, perna: 16, tronco: 15, ombro: 10, quadril: 7, cabeca: 7, chifres: 0x2b2b2b, asas: 0x5b1a14, cauda: 0x7b241c, arma: 'foice' }),
  },
  generico: {
    estilo: 'passada',
    quadros: QUADROS_MEMBROS, membros: true,
    desenhar: bipede({ pele: 0xc9b39b, roupa: 0x7f8c8d, olho: 0x222222, perna: 15, tronco: 14, ombro: 8, quadril: 6.5, cabeca: 7, arma: 'clava' }),
  },
  lobo: { estilo: 'quique', quadros: QUADROS_MEMBROS, membros: true, desenhar: lobo(0x7f8a99) },
  // Marco 40 (13/11/2026, D-165): o lobo e o urso do Aventureiro (o desenho de reserva; o principal é o 3D, feras-vivas.ts).
  lobo_companheiro: { estilo: 'quique', quadros: QUADROS_MEMBROS, membros: true, desenhar: lobo(0x7d6c5a) },
  urso_companheiro: { estilo: 'marcha', quadros: QUADROS_MEMBROS, membros: true, desenhar: lobo(0x5e3c25) },
  aranha: { estilo: 'quique', quadros: QUADROS_MEMBROS, membros: true, desenhar: aranha(0x3d2b4f) },
  slime: { estilo: 'quique', quadros: QUADROS_MEMBROS, membros: true, desenhar: slime(0x58d68d) },
  // Marco 22 (D-089): o falcão do Aventureiro.
  // Marco 24 (D-098): 3 quadros de asas (abertas, batendo e fechadas no ombro).
  falcao: { estilo: 'flutuar', quadros: 3, membros: false, desenhar: falcao(0x8b5a2b) },
  // 06/11/2026: o falcão da skin Mágico (render/voo-falcao.ts): a cartola, a cartola virada com a varinha e o pombo.
  cartola: { estilo: 'flutuar', quadros: 3, membros: false, desenhar: cartola(false) },
  cartola_magica: { estilo: 'flutuar', quadros: 3, membros: false, desenhar: cartola(true) },
  pombo: { estilo: 'flutuar', quadros: 3, membros: false, desenhar: pombo() },
  cultista: {
    estilo: 'deslizar',
    quadros: QUADROS_MEMBROS, membros: true,
    desenhar: bipede({ pele: 0xc9b39b, roupa: 0x5b2c6f, olho: 0xf1c40f, perna: 18, tronco: 14, ombro: 8, quadril: 6, cabeca: 7, veste: true, capuz: 0x4a235a, arma: 'cajado' }),
  },
  sombra: {
    estilo: 'flutuar',
    quadros: QUADROS_MEMBROS, membros: true,
    desenhar: bipede({ pele: 0x2e2a3a, roupa: 0x1f1b2b, olho: 0x9b59b6, perna: 15, tronco: 13, ombro: 8, quadril: 6, cabeca: 7, veste: true, capuz: 0x1a1724, elevacao: 4 }),
  },
  sentinela: {
    estilo: 'marcha',
    quadros: QUADROS_MEMBROS, membros: true,
    desenhar: bipede({ pele: 0x95a5a6, roupa: 0x7b8a8b, olho: 0x5dade2, perna: 14, tronco: 16, ombro: 12, quadril: 9, cabeca: 6.5, escudo: 0x5d6d7e, arma: 'espada' }),
  },
  fada: {
    estilo: 'flutuar',
    quadros: QUADROS_MEMBROS, membros: true,
    desenhar: bipede({ pele: 0xf5d5c8, roupa: 0x76d7c4, olho: 0x1f618d, perna: 9, tronco: 9, ombro: 5, quadril: 4, cabeca: 5.5, asas: 0xd6eaf8, elevacao: 12 }),
  },
  espantalho: {
    estilo: 'quique',
    quadros: QUADROS_MEMBROS, membros: true,
    desenhar: bipede({ pele: 0xe1c16e, roupa: 0x8d6e3f, olho: 0x111111, perna: 16, tronco: 14, ombro: 11, quadril: 6, cabeca: 7, chapeu: 0xa68a4f, arma: 'foice' }),
  },
  aventureiro: {
    estilo: 'passada',
    quadros: QUADROS_MEMBROS, membros: true,
    desenhar: bipede(OPCOES_JOGAVEIS.aventureiro),
  },
  // Marco 14: as classes jogáveis (§2.16).
  guerreiro: {
    estilo: 'marcha',
    quadros: QUADROS_MEMBROS, membros: true,
    desenhar: bipede(OPCOES_JOGAVEIS.guerreiro),
  },
  mago: {
    estilo: 'deslizar',
    quadros: QUADROS_MEMBROS, membros: true,
    desenhar: bipede(OPCOES_JOGAVEIS.mago),
  },
  arqueiro: {
    estilo: 'passada',
    quadros: QUADROS_MEMBROS, membros: true,
    desenhar: bipede(OPCOES_JOGAVEIS.arqueiro),
  },
} as const satisfies Readonly<Record<string, DefinicaoModelo>>;

export type NomeModelo = keyof typeof MODELOS;

export function ehModelo(nome: string): nome is NomeModelo {
  return Object.hasOwn(MODELOS, nome);
}

/**
 * Marco 45 (16/11/2026, D-182): as criaturas de Filo só têm o desenho 3D pré-renderizado; na vista 2D (sem o atlas
 * 3D, ou a de cima) cada uma usa o desenho vetorial mais parecido, para nunca sumir da tela.
 */
const MODELO_2D: Readonly<Record<string, NomeModelo>> = {
  ...Object.fromEntries(['ticaozinho', 'floquinho', 'gosminho', 'breuzinho', 'sonequinha', 'candelinha', 'pedrico', 'pluminha', 'casulo', 'cogumelo_pulmao', 'pedregulho'].map((n) => [n, 'slime'] as const)),
  ...Object.fromEntries(['zunzum', 'bobinadora', 'tecela_do_vazio', 'enxame_putrido', 'mae_colmeia'].map((n) => [n, 'aranha'] as const)),
  ...Object.fromEntries(['faminto', 'galgo_do_vendaval'].map((n) => [n, 'lobo'] as const)),
  ...Object.fromEntries(['dragao_da_fornalha', 'dragao_das_ruinas'].map((n) => [n, 'dragao_fogo'] as const)),
  ...Object.fromEntries(['dragao_do_silencio'].map((n) => [n, 'dragao_gelo'] as const)),
  ...Object.fromEntries(['dragao_engrenado'].map((n) => [n, 'dragao_raio'] as const)),
  ...Object.fromEntries(['dragao_fermentado'].map((n) => [n, 'dragao_veneno'] as const)),
  ...Object.fromEntries(['obelisco_vigia', 'torre_engrenada', 'cabo_voltaico', 'braseiro', 'coluna_antiga', 'pilar_de_cristal', 'estatua_de_gelo'].map((n) => [n, 'sentinela'] as const)),
  ...Object.fromEntries(['fagulheiro', 'saltafaisca', 'rei_das_fagulhas', 'riscador'].map((n) => [n, 'goblin'] as const)),
  ...Object.fromEntries(['quebra_gelo', 'fornalheiro', 'para_raios', 'fundeiro'].map((n) => [n, 'orc'] as const)),
  ...Object.fromEntries(['colosso_de_geodo', 'monarca_de_geodo', 'guardiao_de_marmore'].map((n) => [n, 'troll'] as const)),
  ...Object.fromEntries(['arqueiro_de_osso'].map((n) => [n, 'esqueleto'] as const)),
  ...Object.fromEntries(['bebedor', 'silente', 'espelhante'].map((n) => [n, 'vampiro'] as const)),
  ...Object.fromEntries(['sombra_roubada', 'o_apagador', 'reflexo_do_sonho'].map((n) => [n, 'sombra'] as const)),
  ...Object.fromEntries(['arauto_caido', 'harpia_soberana', 'almirante_dos_ventos'].map((n) => [n, 'demonio'] as const)),
  ...Object.fromEntries(['vidraceiro', 'escultor_de_geada', 'esporeiro', 'marionetista', 'pregador', 'penitente', 'velejador', 'ciclonista', 'imperatriz_das_estatuas', 'maquinista_voltaico', 'necromante_ancestral', 'bruxa_dos_sonhos', 'rei_das_mascaras', 'hierofante'].map((n) => [n, 'cultista'] as const)),
};

/** O desenho 2D do modelo: o próprio, se houver; senão o parecido (as criaturas de Filo); senão null. */
export function modelo2d(nome: string): NomeModelo | null {
  return ehModelo(nome) ? nome : (MODELO_2D[nome] ?? null);
}

/** Modelo do jogador enquanto não há classes com desenho próprio (marco 14). */
export const MODELO_JOGADOR: NomeModelo = 'aventureiro';
