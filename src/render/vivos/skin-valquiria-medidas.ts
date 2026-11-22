// As medidas da arte da Valquíria Glacial (21/11/2026), tiradas em pixels sobre a imagem de referência (1024×1536,
// grade de 50 px) e convertidas em frações da altura. A skin (skin-valquiria.ts) e o arco (skin-arco.ts) se montam
// a partir daqui, no mesmo processo da Sombra Rubra (skin-mago-medidas.ts).
//
// A régua da arte: o topo do cabelo em y = 342, o calcanhar em y = 1200 (H = 858 px; a ponta do pé esticado desce
// até 1232, porque ela flutua) e o eixo do corpo em x = 505. A conversão:
// - altura: (1200 − y) / H;
// - lado: (x − 505) / H, com o sinal trocado;
// - tamanho: px / H.
// A arte segura o arco na mão esquerda (o lado direito da imagem). O rig e os golpes usam a direita, então o desenho vai
// espelhado no lado, como na Sombra Rubra: o cabelo, que voa para o lado livre, fica no +x.

export const ARTE = { chao: 1200, topo: 342, eixo: 505 } as const;
const H = ARTE.chao - ARTE.topo;

/** A altura (fração de H, do chão para cima) de um y da arte. */
export const altura = (y: number): number => (ARTE.chao - y) / H;
/** O lado (fração de H) de um x da arte, já espelhado: o lado do arco sai negativo, como a mão direita do rig (−x). */
export const lado = (x: number): number => -(x - ARTE.eixo) / H;
/** Um comprimento em px da arte em fração de H. */
export const tam = (px: number): number => px / H;

/** Os marcos do corpo na arte (y): o joelho, a virilha, a cintura, o peito, a linha dos ombros, o queixo e os olhos. */
export const MARCOS = { joelho: 925, virilha: 818, quadril: 700, cintura: 632, peito: 560, ombro: 495, queixo: 462, olhos: 422, testa: 392 } as const;

type Caixa = readonly [number, number, number, number];
/** As caixas de cada peça na arte (x0, y0, x1, y1) em px. */
export const PECAS = {
  cabeca: [455, 342, 560, 470],
  // o diadema dourado com a pedra rubra no meio da testa e as asinhas brancas e douradas das têmporas
  diadema: [450, 360, 560, 400],
  pedra: [500, 375, 520, 398],
  asaDoElmo: [420, 295, 470, 400],
  // a ombreira em camadas, com os espinhos para cima e para fora
  ombreira: [570, 440, 665, 515],
  espinhoDaOmbreira: [610, 405, 645, 450],
  // o peitoral de prata com as taças azul-aço de borda dourada e as placas douradas da barriga em chevron
  taca: [455, 525, 505, 585],
  barriga: [470, 590, 545, 690],
  // as tassetes de ouro e prata, curtas, que abrem em pontas sobre o quadril
  tassetes: [400, 680, 610, 800],
  // a braçadeira de ouro com as pontas no cotovelo e a luva
  bracadeira: [650, 560, 720, 700],
  // a perna: a coxa à mostra, a liga escura, a joelheira de ouro em ponta, a greva de prata e o pé de placas em ponta
  coxa: [430, 815, 575, 880],
  joelheira: [470, 880, 560, 985],
  greva: [470, 985, 560, 1130],
  pe: [480, 1130, 545, 1232],
} as const satisfies Record<string, Caixa>;

/** O cabelo louro: a franja repartida, as mechas que descem às costas e as que voam para o lado livre. */
export const CABELO = {
  raiz: { y0: 350, y1: 430 },
  // as pontas das que voam para o lado livre (o lado esquerdo da imagem) e até onde descem atrás
  pontas: { x0: 300, x1: 380, y0: 520, y1: 700 },
  costas: 700,
} as const;

type Estacao = readonly [readonly [number, number], readonly [number, number]];
/**
 * As asas de gelo do lado esquerdo da imagem (o outro lado é o espelho: a arte é quase simétrica), estação por
 * estação da raiz até a ponta. Cada estação dá a borda de baixo e a de cima (px da arte). São quatro por lado: a de
 * cima, que sobe em diagonal, a do meio, quase deitada, e as duas de baixo, que caem atrás da capa.
 */
export const ASAS: readonly (readonly Estacao[])[] = [
  [[[470, 500], [455, 435]], [[330, 440], [330, 300]], [[200, 345], [200, 225]], [[110, 240], [105, 180]], [[76, 152], [74, 150]]],
  [[[465, 565], [460, 485]], [[300, 575], [300, 460]], [[170, 565], [170, 515]], [[72, 556], [70, 554]]],
  [[[450, 650], [445, 590]], [[300, 720], [300, 610]], [[220, 745], [220, 680]], [[152, 762], [150, 760]]],
  [[[430, 720], [430, 660]], [[330, 840], [320, 745]], [[260, 875], [250, 820]], [[212, 886], [210, 884]]],
];
/** De onde as asas saem nas costas (o meio entre as omoplatas). */
export const RAIZ_DAS_ASAS = [505, 540] as const;

/** A capa de pelo branco: da cintura de trás até a barra, com a largura de cima e a de baixo (px). */
export const CAPA = { cintura: 700, barra: 1045, larguraEmCima: 240, larguraEmbaixo: 460 } as const;

/**
 * O arco na arte: dourado, de galhos com espinhos, cristais de gelo no punho e nas pontas e a corda de gelo. A ponta de
 * cima, o punho (na mão) e a ponta de baixo; a corda vai de ponta a ponta.
 */
export const ARCO = {
  pontaDeCima: [945, 480],
  punho: [725, 690],
  pontaDeBaixo: [305, 810],
  // a barriga do arco: o quanto ele se afasta da corda no punho
  curva: 95,
  espessura: 18,
} as const;
/** O comprimento do arco em px da arte (de ponta a ponta). */
export const COMPRIMENTO_DO_ARCO = Math.hypot(ARCO.pontaDeCima[0] - ARCO.pontaDeBaixo[0], ARCO.pontaDeCima[1] - ARCO.pontaDeBaixo[1]);

/** A largura e a altura de uma caixa em fração de H, e o centro (lado, altura). */
export function caixa(c: Caixa): { largura: number; alto: number; lado: number; altura: number } {
  return { largura: tam(c[2] - c[0]), alto: tam(c[3] - c[1]), lado: lado((c[0] + c[2]) / 2), altura: altura((c[1] + c[3]) / 2) };
}
