// As medidas da arte da Sombra Rubra (06/11/2026), tiradas em pixels sobre a imagem de referência (1024×1024, grade de
// 25 px) e convertidas em frações da altura do personagem. A skin (skin-mago.ts) e o cajado (skin-cajado.ts) se montam
// só a partir daqui: cada peça tem a caixa (x0, y0, x1, y1) ou os pontos que ocupa na arte.
//
// A régua da arte: o topo do cabelo em y = 22, a sola da bota em y = 1020 (H = 998 px) e o eixo do corpo em x = 530.
// A conversão:
// - altura: (1020 − y) / H;
// - lado: (x − 530) / H;
// - tamanho: px / H.
// A arte segura o cajado na mão esquerda (o lado direito da imagem). O rig e os golpes usam a direita, então o desenho vai
// espelhado no lado: `lado()` troca o sinal. Assim, o que na arte fica do lado do cajado fica do lado do cajado no 3D.

export const ARTE = { chao: 1020, topo: 22, eixo: 530 } as const;
const H = ARTE.chao - ARTE.topo;

/** A altura (fração de H, do chão para cima) de um y da arte. */
export const altura = (y: number): number => (ARTE.chao - y) / H;
/** O lado (fração de H) de um x da arte, já espelhado: o lado do cajado sai negativo, como a mão direita do rig (−x). */
export const lado = (x: number): number => -(x - ARTE.eixo) / H;
/** Um comprimento em px da arte em fração de H. */
export const tam = (px: number): number => px / H;

type Caixa = readonly [number, number, number, number];

/** As caixas de cada peça na arte (x0, y0, x1, y1) em px. */
export const PECAS = {
  // a cabeça: a massa de cabelo (o crânio com volume), o rosto em sombra e o queixo, que fica escondido pelo cachecol
  cabeloMassa: [400, 22, 610, 235],
  rosto: [375, 125, 550, 225],
  // o cachecol: das laterais da cabeça até os ombros, em dobras que descem na diagonal
  cachecol: [340, 120, 690, 330],
  ombros: [300, 300, 700, 330],
  // os braços: a braçadeira do braço livre, a do braço do cajado e a manopla fechada no cajado
  bracadeiraLivre: [325, 390, 375, 500],
  bracadeiraCajado: [650, 350, 750, 440],
  manopla: [750, 415, 815, 475],
  // o cinto: a placa ornada, inclinada 35° (do alto do lado livre para baixo do lado do cajado)
  placaDoCinto: [525, 390, 640, 550],
  // a perna: a placa da coxa com a runa ᛉ, a joelheira sextavada, a greva com runas e a bota de placas
  placaDaCoxa: [505, 510, 600, 655],
  joelheira: [475, 640, 590, 745],
  greva: [495, 745, 555, 850],
  bota: [470, 875, 545, 1020],
} as const satisfies Record<string, Caixa>;

/** O ângulo da placa do cinto na arte (graus; o sinal já espelhado). */
export const INCLINACAO_DO_CINTO = 35;

/** O cabelo ao vento: de onde as mechas saem e até onde vão (as pontas carmesim), e os fios soltos no alto. */
export const CABELO = {
  raiz: { x: 470, y0: 60, y1: 200 },
  pontas: { x0: 230, x1: 330, y0: 60, y1: 230 },
  fiosDoAlto: { x0: 330, x1: 560, y0: 22, y1: 100 },
  // a cor muda para carmesim no último terço do comprimento
  carmesimDesde: 0.62,
} as const;

/** As faíscas vermelhas: duas nuvens, uma atrás das pontas do cabelo e outra do lado do cajado, na altura da cabeça. */
export const FAISCAS: readonly Caixa[] = [[200, 180, 330, 260], [630, 70, 680, 160]];

/**
 * O manto, em pontos da arte. Ele abre em duas asas, e cada uma termina num gancho como de foice.
 * - Asa do lado livre: a borda de cima chega a `pontaLivre`, e o gancho desce até `ganchoLivre`.
 * - Asa do lado do cajado: chega a `pontaCajado`, e o gancho desce até `ganchoCajado`.
 * - O roxo vai de `roxo` para baixo.
 * - O vermelho fica só nos ganchos, de `vermelho` para baixo.
 * - A borda vermelha do forro corre da frente do ombro do lado do cajado (`forroDe`) até a asa do lado livre (`forroAte`).
 */
export const MANTO = {
  ombro: 320,
  pontaLivre: [20, 390],
  ganchoLivre: [220, 890],
  pontaCajado: [990, 560],
  ganchoCajado: [710, 840],
  roxo: 500,
  vermelho: 640,
  forroDe: [580, 300],
  forroAte: [250, 650],
  larguraDoForro: 12,
} as const;

type Estacao = readonly [readonly [number, number], readonly [number, number]];
/**
 * As asas do manto, estação por estação, do ombro até a ponta do gancho. Cada estação dá a borda de dentro e a de fora
 * (px da arte). Entre o gancho e o corpo a arte fica vazia, por isso as asas são lâminas soltas, não uma parede.
 */
export const ASAS: { livre: readonly Estacao[]; cajado: readonly Estacao[] } = {
  livre: [
    [[420, 330], [300, 310]],
    [[330, 400], [20, 390]],
    [[300, 520], [40, 520]],
    [[240, 640], [90, 650]],
    [[170, 720], [120, 760]],
    [[216, 886], [220, 890]],
  ],
  cajado: [
    [[650, 350], [700, 330]],
    [[700, 480], [850, 470]],
    [[720, 560], [990, 540]],
    [[760, 640], [950, 630]],
    [[750, 700], [820, 740]],
    [[712, 838], [710, 840]],
  ],
};

/** O pano de trás: do ombro até a barra rasgada atrás das pernas, com a largura de cima e a de baixo (px). */
export const COSTAS = { ombro: 320, barra: 800, larguraEmCima: 280, larguraEmbaixo: 310 } as const;

/**
 * O cajado na arte. A base e a ponta definem o eixo (1040 px, 1,05 H, inclinado 21° para fora). Os outros pontos ficam
 * em coordenadas do próprio cajado: `ao` é a fração do comprimento a partir da base, e `de` é o desvio lateral, também
 * em fração do comprimento (+ = para fora do corpo na arte).
 */
export const CAJADO = {
  base: [565, 980],
  ponta: [935, 5],
  inclinacao: 21,
  mao: 0.56,
  espessura: 25,
  espessuraDaBase: 15,
  espessuraDasPontas: 22,
  // onde a haste se divide: as esporas baixas e as três pontas
  esporas: [{ ao: 0.677, ate: { ao: 0.744, de: -0.036 } }, { ao: 0.69, ate: { ao: 0.755, de: 0.059 } }],
  divisao: { ao: 0.77, de: -0.009 },
  pontas: [
    [{ ao: 0.83, de: -0.03 }, { ao: 0.893, de: -0.061 }],
    [{ ao: 0.88, de: -0.01 }, { ao: 1, de: -0.006 }],
    [{ ao: 0.83, de: 0.045 }, { ao: 0.962, de: 0.077 }],
  ],
} as const;

/** O comprimento do cajado em px da arte (da base à ponta). */
export const COMPRIMENTO_DO_CAJADO = Math.hypot(CAJADO.ponta[0] - CAJADO.base[0], CAJADO.ponta[1] - CAJADO.base[1]);

/** A largura e a altura de uma caixa em fração de H, e o centro (lado, altura). */
export function caixa(c: Caixa): { largura: number; alto: number; lado: number; altura: number } {
  return { largura: tam(c[2] - c[0]), alto: tam(c[3] - c[1]), lado: lado((c[0] + c[2]) / 2), altura: altura((c[1] + c[3]) / 2) };
}
