// Presets de partícula (§2.16, D-055/D-056). Marco 12 (14/10/2026). Dado puro: cada preset é uma lista
// de emissões (textura, quantidade, vida, velocidade, gravidade, escala, transparência, mistura). As
// habilidades escolhem presets pelo nome no bloco `visual`; nada aqui é código por efeito.
// Marco 11A (16/10/2026, D-066): mais partículas e menos formas desenhadas — formas de emissão (anel, linha, cone,
// espiral), cor ao longo da vida, giro, arrasto e texturas novas (gota, floco, runa, bolha, lasca, corte, chama).
// Os anéis e ondas viraram explosões de partículas. Um preset por fantasia: corte, runas, cristais, bolhas, sombra,
// sangue, sagrado, pedra, vento, chamas e relâmpago.

import type { PresetVisual } from '../combat/habilidades';

// Ajuste de 16/10/2026 (D-067): `flecha` (haste, ponta e penas) e `teia`; a direção `orientada` (para onde o
// projétil voa) e a `alturaInicial` (a chuva nasce no alto e cai); presets esteira, farpas, chuva e leque.
import type { ParticulaClima } from '../world/temas';
import { PRESETS_ELEMENTOS, type NomePresetElemento } from './presets-elementos';
import { PRESETS_ARMAS, type NomePresetArma } from './presets-armas';
import { PRESETS_MUNDO, type NomePresetMundo } from './presets-mundo';
import type { TexturaRica } from './vfx/texturas';

// Marco 24 (25/10/2026): `arco` (o raio ramificado, também a rachadura no chão) e `cristal` (o gelo facetado).
export const TEXTURAS_PARTICULA = ['ponto', 'brilho', 'fumaca', 'anel', 'estrela', 'faisca', 'gota', 'floco', 'runa', 'bolha', 'lasca', 'corte', 'chama', 'flecha', 'teia', 'arco', 'cristal'] as const;
export type TexturaParticula = (typeof TEXTURAS_PARTICULA)[number];

/** Onde as partículas nascem: no ponto (com `raio` de espalhamento), num anel, ao longo do segmento, num cone, ou em espiral. */
export type FormaEmissao = 'ponto' | 'anel' | 'linha' | 'cone' | 'espiral';

/**
 * Marco 26 (29/10/2026, D-124): a forma da escala e da transparência ao longo da vida (no lugar da reta de `de` a
 * `para`). `sai`: chega rápido ao fim e assenta; `pulso`: cresce e volta; `sino`: sobe até o meio e desce.
 */
export type CurvaVida = 'linear' | 'sai' | 'entra' | 'pulso' | 'sino';

export interface Emissao {
  /** Marco 26 (D-124): também as texturas ricas (vfx/texturas.ts), pintadas em canvas com gradiente. */
  textura: TexturaParticula | TexturaRica;
  quantidade: number;
  vidaMs: readonly [number, number];
  /** Velocidade em px de mundo por segundo. */
  velocidade: readonly [number, number];
  /**
   * `livre`: qualquer direção; `cima`/`baixo`: leque; `fora`: para longe do centro (anel e espiral); `orientada`: a
   * direção pedida na emissão (a do projétil), ou para trás dela com velocidade negativa.
   */
  direcao: 'livre' | 'cima' | 'baixo' | 'fora' | 'orientada';
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
  /** D-067: nasce esta altura (px) acima da origem — a flecha da chuva cai até o chão. */
  alturaInicial?: number;
  /** D-067: espalhamento da direção em rad (padrão: 0,5 no cone, 0 na orientada). */
  abertura?: number;
  // --- Marco 26 (29/10/2026, D-124): partículas mais ricas.
  /** Flipbook: os quadros, trocados pela idade (a chama tremula, a fumaça se desfaz). Mesma família de atlas. */
  quadros?: readonly TexturaRica[];
  /** Estica no sentido da velocidade (faísca, rastro, chuva): o comprimento cresce com a rapidez. */
  esticar?: number;
  curvaEscala?: CurvaVida;
  curvaAlpha?: CurvaVida;
  /** Cores ao longo da vida, em paradas iguais (branco › amarelo › laranja › vermelho › fumaça). null = a da skill. */
  cores?: readonly (number | null)[];
  /** Turbulência em px/s: o fogo e a fumaça sobem ondulando. */
  turbulencia?: number;
  /** Ao morrer, solta estas emissões onde estava (a brasa vira fumaça, a gota respinga). Sem encadear de novo. */
  aoMorrer?: readonly Emissao[];
}

/**
 * `onda` (a explosão pela área, D-060), `poeira` e `aura` são internos; os demais, os das habilidades. Marco 11A: a
 * forma do ataque também é partícula — `telegrafo` (o miolo da área enchendo), `borda` (o contorno, na cor de quem
 * ataca), `mira` (a linha do golpe e do projétil), `projetil` (o núcleo que voa) e `chao` (os rastros no chão).
 */
export type NomePreset = PresetVisual | 'poeira' | 'aura' | 'onda' | 'telegrafo' | 'borda' | 'mira' | 'projetil' | 'chao' | 'projetil_flecha' | 'projetil_teia' | 'aura_forma' | 'trilha_elemental' | 'aura_sutil' | 'esteira_carregada' | NomeClima | 'aura_afinidade' | 'aura_afinidade_extrema' | NomePresetElemento | NomePresetArma | NomePresetMundo;

/** Marco 23 (D-092): as partículas do ar de cada tema (render/efeitos-habilidade.ts, perto do jogador). */
export type NomeClima = `clima_${ParticulaClima}`;

const faiscas: Emissao = { textura: 'faisca', quantidade: 12, vidaMs: [180, 340], velocidade: [140, 300], direcao: 'livre', gravidade: 320, escala: [0.8, 0.2], alpha: [1, 0], aditivo: true, raio: 4, cor: null, arrasto: 0.6 };
const brilho: Emissao = { textura: 'brilho', quantidade: 10, vidaMs: [300, 520], velocidade: [20, 60], direcao: 'cima', gravidade: 0, escala: [0.9, 0.1], alpha: [0.9, 0], aditivo: true, raio: 10, cor: null };
const fumaca: Emissao = { textura: 'fumaca', quantidade: 7, vidaMs: [600, 1000], velocidade: [10, 30], direcao: 'cima', gravidade: -10, escala: [0.5, 1.5], alpha: [0.45, 0], aditivo: false, raio: 8, cor: 0x777777, arrasto: 0.4 };
/** O "anel" em partículas: pontos de luz saindo em círculo. */
/** D-067: o corpo da flecha, na cor da madeira e do ferro (a cor da habilidade fica na esteira). */
const COR_FLECHA = 0xeadfc8;
const anelDeLuz: Emissao = { textura: 'brilho', quantidade: 18, vidaMs: [320, 420], velocidade: [70, 90], direcao: 'fora', gravidade: 0, escala: [0.7, 0.2], alpha: [1, 0], aditivo: true, raio: 10, cor: null, forma: 'anel', arrasto: 0.5 };

export const PRESETS_PARTICULA: Readonly<Record<NomePreset, readonly Emissao[]>> = {
  // Marco 24 (25/10/2026): os materiais por elemento e estado, a ultimate e o Frenesi (presets-elementos.ts).
  ...PRESETS_ELEMENTOS,
  // Marco 24 (D-098): os golpes de arma e o giro.
  ...PRESETS_ARMAS,
  // Marco 26 (26/10/2026): o ar dos portais e as lascas dos quebráveis (presets-mundo.ts).
  ...PRESETS_MUNDO,
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
  // Ajuste de 24/10/2026 (D-091): a encarnação do Mago. Parado, um respiro discreto; andando, a trilha que fica para trás
  // (partículas longas e lentas, que se apagam devagar, em vez de rajadas que piscam).
  aura_sutil: [{ ...brilho, quantidade: 1, vidaMs: [900, 1300], velocidade: [6, 14], escala: [0.45, 0.1], alpha: [0.35, 0], raio: 10 }],
  trilha_elemental: [
    { textura: 'brilho', quantidade: 2, vidaMs: [700, 1100], velocidade: [0, 6], direcao: 'livre', gravidade: -6, escala: [0.55, 0.05], alpha: [0.55, 0], aditivo: true, raio: 5, cor: null },
    { textura: 'ponto', quantidade: 1, vidaMs: [500, 800], velocidade: [2, 8], direcao: 'cima', gravidade: 0, escala: [0.35, 0.05], alpha: [0.7, 0], aditivo: true, raio: 3, cor: 0xffffff },
  ],
  telegrafo: [{ textura: 'brilho', quantidade: 1, vidaMs: [420, 680], velocidade: [4, 14], direcao: 'cima', gravidade: 0, escala: [0.7, 0.25], alpha: [0.55, 0], aditivo: true, raio: 16, cor: null }],
  borda: [{ textura: 'ponto', quantidade: 1, vidaMs: [260, 420], velocidade: [0, 6], direcao: 'livre', gravidade: 0, escala: [0.45, 0.15], alpha: [0.95, 0], aditivo: true, raio: 14, cor: null }],
  mira: [{ textura: 'ponto', quantidade: 5, vidaMs: [220, 340], velocidade: [0, 8], direcao: 'livre', gravidade: 0, escala: [0.35, 0.1], alpha: [0.8, 0], aditivo: true, raio: 2, cor: null }],
  projetil: [
    { textura: 'brilho', quantidade: 2, vidaMs: [90, 150], velocidade: [0, 12], direcao: 'livre', gravidade: 0, escala: [1, 0.3], alpha: [1, 0], aditivo: true, raio: 2, cor: null },
    { textura: 'ponto', quantidade: 1, vidaMs: [60, 90], velocidade: [0, 0], direcao: 'livre', gravidade: 0, escala: [0.45, 0.3], alpha: [1, 0], aditivo: true, raio: 0, cor: 0xffffff },
  ],
  chao: [{ textura: 'ponto', quantidade: 2, vidaMs: [500, 800], velocidade: [6, 18], direcao: 'cima', gravidade: -10, escala: [0.45, 0.1], alpha: [0.7, 0], aditivo: true, raio: 18, cor: null }],
  // --- Ajuste de 16/10/2026 (D-067): flechas.
  /** O traço fino que fica atrás da flecha, alinhado com o voo (no lugar das bolinhas de brilho). */
  esteira: [{ textura: 'faisca', quantidade: 2, vidaMs: [140, 220], velocidade: [-30, -10], direcao: 'orientada', gravidade: 0, escala: [0.55, 0.15], alpha: [0.6, 0], aditivo: true, raio: 1, cor: null }],
  /**
   * Ajuste de 24/10/2026 (D-091): o tiro carregado da Mira firme, entre a flecha simples e um mini cometa: um núcleo
   * luminoso colado na ponta, a cauda fina e longa alinhada com o voo, um halo suave em volta da cauda e fagulhas
   * que se soltam e caem.
   */
  esteira_carregada: [
    { textura: 'brilho', quantidade: 1, vidaMs: [90, 140], velocidade: [0, 4], direcao: 'livre', gravidade: 0, escala: [0.85, 0.45], alpha: [0.95, 0], aditivo: true, raio: 0, cor: null },
    { textura: 'faisca', quantidade: 4, vidaMs: [320, 520], velocidade: [-34, -10], direcao: 'orientada', abertura: 0.06, gravidade: 0, escala: [0.95, 0.15], alpha: [0.9, 0], aditivo: true, raio: 1, cor: null },
    { textura: 'brilho', quantidade: 2, vidaMs: [280, 460], velocidade: [-18, -4], direcao: 'orientada', abertura: 0.2, gravidade: 0, escala: [0.55, 0.1], alpha: [0.4, 0], aditivo: true, raio: 3, cor: null },
    { textura: 'ponto', quantidade: 1, vidaMs: [380, 620], velocidade: [-45, -15], direcao: 'orientada', abertura: 0.7, gravidade: 40, escala: [0.3, 0.05], alpha: [0.85, 0], aditivo: true, raio: 2, cor: 0xffffff },
  ],

  /** O acerto da flecha: lascas de madeira e um pouco de pó, sem brilho. */
  farpas: [
    { textura: 'lasca', quantidade: 6, vidaMs: [220, 380], velocidade: [60, 140], direcao: 'livre', gravidade: 420, escala: [0.45, 0.25], alpha: [1, 0], aditivo: false, raio: 3, cor: 0xb08d5a, giro: [-8, 8], arrasto: 0.4 },
    { textura: 'fumaca', quantidade: 3, vidaMs: [300, 500], velocidade: [8, 20], direcao: 'cima', gravidade: 0, escala: [0.35, 0.7], alpha: [0.35, 0], aditivo: false, raio: 4, cor: 0xb8a98a },
  ],
  /** A chuva: flechas que nascem no alto e caem retas na célula, com pó no chão. */
  chuva: [
    { textura: 'flecha', quantidade: 4, vidaMs: [170, 210], velocidade: [330, 380], direcao: 'baixo', abertura: 0.08, gravidade: 0, escala: [0.8, 0.8], alpha: [1, 0.9], aditivo: false, raio: 9, cor: COR_FLECHA, alturaInicial: 64 },
    { textura: 'fumaca', quantidade: 3, vidaMs: [380, 600], velocidade: [10, 26], direcao: 'cima', gravidade: 0, escala: [0.3, 0.8], alpha: [0.4, 0], aditivo: false, raio: 9, cor: 0xb8a98a },
  ],
  /** O leque: flechas saindo em cone de quem atira, na direção da mira. */
  leque: [
    { textura: 'flecha', quantidade: 7, vidaMs: [200, 260], velocidade: [380, 440], direcao: 'livre', abertura: 0.55, gravidade: 0, escala: [0.75, 0.75], alpha: [1, 0.7], aditivo: false, raio: 2, cor: COR_FLECHA, forma: 'cone' },
    { textura: 'faisca', quantidade: 7, vidaMs: [160, 220], velocidade: [300, 380], direcao: 'livre', abertura: 0.55, gravidade: 0, escala: [0.45, 0.15], alpha: [0.5, 0], aditivo: true, raio: 2, cor: null, forma: 'cone' },
  ],
  /** O corpo da flecha em voo: uma flecha orientada (reemitida a cada quadro, por isso a vida curta). */
  projetil_flecha: [{ textura: 'flecha', quantidade: 1, vidaMs: [40, 50], velocidade: [0, 0], direcao: 'orientada', gravidade: 0, escala: [0.8, 0.8], alpha: [1, 0.85], aditivo: false, raio: 0, cor: COR_FLECHA }],
  /** O corpo da teia em voo: a rede girando devagar. */
  projetil_teia: [{ textura: 'teia', quantidade: 1, vidaMs: [40, 50], velocidade: [0, 0], direcao: 'orientada', gravidade: 0, escala: [0.75, 0.75], alpha: [0.95, 0.8], aditivo: false, raio: 0, cor: 0xe5e8ea }],
  /** Marco 18 (D-069): a aura leve de quem veste Lendária ou Última (na cor da forma). */
  // Marco 23 (D-092): o ar de cada tema, uma partícula por emissão espalhada em volta do jogador (raio grande).
  clima_poeira: [{ textura: 'ponto', quantidade: 1, vidaMs: [2500, 4000], velocidade: [3, 10], direcao: 'livre', gravidade: 0, escala: [0.25, 0.25], alpha: [0.25, 0], aditivo: false, raio: 260, cor: 0xd8cfb8 }],
  clima_folhas: [{ textura: 'lasca', quantidade: 1, vidaMs: [3000, 4500], velocidade: [10, 24], direcao: 'baixo', gravidade: 6, escala: [0.5, 0.4], alpha: [0.7, 0], aditivo: false, raio: 280, cor: 0x7aa04a, corFinal: 0xc08a3a, giro: [-2, 2] }],
  clima_brilhos: [{ textura: 'brilho', quantidade: 1, vidaMs: [1800, 2800], velocidade: [4, 12], direcao: 'cima', gravidade: -4, escala: [0.35, 0.05], alpha: [0.6, 0], aditivo: true, raio: 260, cor: null }],
  clima_bolhas: [{ textura: 'bolha', quantidade: 1, vidaMs: [1500, 2500], velocidade: [6, 14], direcao: 'cima', gravidade: -10, escala: [0.25, 0.4], alpha: [0.5, 0], aditivo: false, raio: 240, cor: 0x9ad08a }],
  clima_cinzas: [{ textura: 'ponto', quantidade: 2, vidaMs: [2500, 4000], velocidade: [6, 18], direcao: 'baixo', gravidade: 4, escala: [0.3, 0.2], alpha: [0.55, 0], aditivo: false, raio: 280, cor: 0x7a7470, corFinal: 0xff7a3a }],
  clima_faiscas: [{ textura: 'faisca', quantidade: 1, vidaMs: [500, 900], velocidade: [20, 60], direcao: 'cima', gravidade: 40, escala: [0.4, 0.1], alpha: [0.9, 0], aditivo: true, raio: 260, cor: 0xffd070, arrasto: 0.5 }],
  clima_areia: [{ textura: 'ponto', quantidade: 2, vidaMs: [1500, 2500], velocidade: [40, 70], direcao: 'orientada', gravidade: 0, escala: [0.25, 0.15], alpha: [0.45, 0], aditivo: false, raio: 280, cor: 0xe0c08a }],
  clima_neve: [{ textura: 'floco', quantidade: 2, vidaMs: [3500, 5000], velocidade: [8, 20], direcao: 'baixo', gravidade: 5, escala: [0.35, 0.25], alpha: [0.85, 0], aditivo: false, raio: 300, cor: 0xffffff, giro: [-1, 1] }],
  clima_vagalumes: [{ textura: 'brilho', quantidade: 1, vidaMs: [2000, 3200], velocidade: [6, 16], direcao: 'livre', gravidade: 0, escala: [0.3, 0.05], alpha: [0.9, 0], aditivo: true, raio: 260, cor: 0xd8f070 }],
  clima_esporos: [{ textura: 'ponto', quantidade: 1, vidaMs: [3000, 4500], velocidade: [3, 9], direcao: 'cima', gravidade: -3, escala: [0.3, 0.3], alpha: [0.6, 0], aditivo: true, raio: 260, cor: 0xc89aff }],
  clima_sombras: [{ textura: 'fumaca', quantidade: 1, vidaMs: [2500, 3800], velocidade: [4, 10], direcao: 'cima', gravidade: -2, escala: [0.6, 1.4], alpha: [0.25, 0], aditivo: false, raio: 260, cor: 0x2a1840 }],
  // Marco 23: o inimigo afim solta o elemento (o extremo, mais forte e com estrelas).
  aura_afinidade: [{ textura: 'brilho', quantidade: 2, vidaMs: [500, 800], velocidade: [8, 22], direcao: 'cima', gravidade: -8, escala: [0.45, 0.05], alpha: [0.7, 0], aditivo: true, raio: 12, cor: null }],
  aura_afinidade_extrema: [
    { textura: 'brilho', quantidade: 3, vidaMs: [600, 900], velocidade: [12, 30], direcao: 'cima', gravidade: -10, escala: [0.6, 0.05], alpha: [0.85, 0], aditivo: true, raio: 16, cor: null },
    { textura: 'anel', quantidade: 1, vidaMs: [700, 900], velocidade: [0, 2], direcao: 'livre', gravidade: 0, escala: [0.4, 1.1], alpha: [0.5, 0], aditivo: true, raio: 0, cor: null },
  ],
  aura_forma: [
    { textura: 'brilho', quantidade: 2, vidaMs: [500, 800], velocidade: [10, 28], direcao: 'cima', gravidade: -10, escala: [0.45, 0.05], alpha: [0.8, 0], aditivo: true, raio: 12, cor: null },
    { textura: 'estrela', quantidade: 1, vidaMs: [500, 700], velocidade: [6, 16], direcao: 'cima', gravidade: 0, escala: [0.35, 0.1], alpha: [0.9, 0], aditivo: true, raio: 10, cor: null, giro: [-2, 2] },
  ],
  onda: [
    { ...anelDeLuz, quantidade: 36, velocidade: [200, 260], vidaMs: [340, 420], escala: [0.8, 0.3] },
    { ...anelDeLuz, textura: 'ponto', quantidade: 20, velocidade: [120, 160], vidaMs: [300, 380], escala: [0.5, 0.1] },
  ],
};
