// As medidas da arte do Ceifador (06/11/2026), tiradas em pixels sobre a imagem de referência (768×1344, grade de
// 25 px) e convertidas em frações da altura do personagem. A skin (skin-ceifador.ts) e a gadanha (skin-gadanha.ts) se
// montam a partir daqui. Cada peça é descrita pela caixa (x0, y0, x1, y1) ou pelos pontos que ocupa na arte.
//
// A régua da arte:
// - o alto do capuz em y = 100 e o chão (a sola sob a barra) em y = 1300, então H = 1200 px;
// - o eixo do corpo em x = 430.
// O Ceifador segura a gadanha na mão direita (o lado esquerdo da imagem), a mesma do rig, por isso não há espelhamento:
// o lado direito da imagem é o +x do rig (o lado esquerdo dele).

export const ARTE = { chao: 1300, topo: 100, eixo: 430 } as const;
/** A altura do Ceifador no mundo, em células (06/11/2026: 1,4, alto e esguio como a arte; a gadanha mede por ela). */
export const ALTURA_DO_CEIFADOR = 1.4;
const H = ARTE.chao - ARTE.topo;

/** A altura (fração de H, do chão para cima) de um y da arte. */
export const altura = (y: number): number => (ARTE.chao - y) / H;
/** O lado (fração de H; + = o lado esquerdo dele, o direito da imagem) de um x da arte. */
export const lado = (x: number): number => (x - ARTE.eixo) / H;
/** Um comprimento em px da arte em fração de H. */
export const tam = (px: number): number => px / H;

type Caixa = readonly [number, number, number, number];
type Ponto = readonly [number, number];

/** Os marcos do corpo na arte (y): os ombros e o queixo (a boca do capuz). Do queixo ao topo vale a proporção da arte. */
export const MARCOS = { ombro: 400, queixo: 300 } as const;

/** As caixas de cada peça na arte (x0, y0, x1, y1), em px. */
export const PECAS = {
  // o capuz: a cúpula, o vazio do rosto (virado para a direita dele) e a boca
  capuz: [325, 100, 565, 400],
  rosto: [330, 195, 470, 320],
  olhoDireito: [355, 220, 382, 236],
  olhoEsquerdo: [398, 205, 422, 222],
  dentes: [378, 243, 446, 276],
  // a gola de pano em camadas, entre o queixo e os ombros
  gola: [318, 300, 485, 405],
  // a ombreira do ombro esquerdo (três placas) e o medalhão da frente
  ombreira: [440, 320, 662, 470],
  medalhao: [463, 318, 507, 362],
  // o espartilho laceado (cinco cruzes) e as tachas em losango
  espartilho: [340, 430, 445, 600],
  // a mão solta (a esquerda): a palma e os dedos compridos, que descem em frente ao corpo
  maoSolta: [330, 640, 425, 852],
  // a boca da manga de cada braço
  mangaSolta: [425, 590, 565, 705],
  mangaDaGadanha: [155, 430, 295, 705],
  // o tabardo da frente e a ponta ornada dele
  tabardo: [330, 600, 425, 1000],
  // a barra do manto: a largura no chão (com o vento), e a faixa onde ela se rasga
  barra: [160, 1180, 690, 1300],
} as const satisfies Record<string, Caixa>;

/** As tachas em losango do espartilho, e a ponta ornada do tabardo. */
export const TACHAS: readonly Ponto[] = [[378, 440], [457, 452], [375, 606]];

/**
 * A largura do casaco em cada altura (px da arte, de um lado ao outro), entre os braços: sem as mangas, que ficam por
 * fora, e sem as fitas que voam.
 */
export const MANTO: readonly (readonly [number, number])[] = [
  [400, 290], [500, 255], [700, 300], [900, 400], [1100, 480], [1290, 530],
];

/**
 * As fitas da capa que voam (pontos da arte, da raiz à ponta). As da direita da imagem saem do ombro e das costas,
 * e as da esquerda saem da barra.
 */
export const FITAS: readonly (readonly Ponto[])[] = [
  [[560, 300], [640, 230], [720, 250], [745, 300]],
  [[600, 420], [680, 450], [760, 480]],
  [[600, 560], [700, 600], [768, 580]],
  [[620, 800], [700, 850], [760, 830]],
  [[600, 980], [690, 1010], [760, 980]],
  [[220, 700], [120, 720], [40, 760]],
  [[200, 900], [110, 960], [20, 1000]],
  [[180, 1100], [80, 1150], [10, 1240]],
];

/** As faixas verticais de bordado em gavinhas no manto: a coluna (x) e de onde até onde (y). */
export const BORDADOS: readonly (readonly [number, number, number])[] = [[275, 750, 1250], [450, 900, 1260]];

/**
 * A gadanha na arte. O cabo vai do colar do alto até a ponta de baixo, quase em pé, e a mão o segura a 90% dele. No
 * rig, a mão fica bem mais baixa (o braço não sobe), então a pegada desliza para o cabo encostar no chão; o comprimento
 * e o desenho são os medidos.
 */
export const GADANHA = {
  colar: [125, 290],
  ponta: [205, 1335],
  espessura: 22,
  // a cabeça ornada (a guarda com volutas) e o colar de ferro
  guarda: [25, 210, 175, 300],
  // o lombo da lâmina (a borda de fora), da raiz à ponta, e a largura da lâmina em cada ponto
  lombo: [[95, 215], [150, 130], [250, 65], [400, 25], [560, 25], [680, 55], [760, 105]],
  larguras: [70, 66, 60, 55, 42, 26, 2],
  // o gancho de trás: o esporão curvo que desce da raiz da lâmina
  gancho: [[70, 240], [20, 290], [10, 350], [25, 410]],
  // a ponteira de ferro: do começo dela até a ponta, com as espirais para o lado da lâmina
  ponteira: [[175, 960], [205, 1335]],
  espirais: [[100, 1040], [140, 1150]],
} as const;

/** O comprimento do cabo da gadanha (do colar à ponta) em px da arte. */
export const CABO = Math.hypot(GADANHA.ponta[0] - GADANHA.colar[0], GADANHA.ponta[1] - GADANHA.colar[1]);

/** A largura e a altura de uma caixa em fração de H, e o centro (lado, altura). */
export function caixa(c: Caixa): { largura: number; alto: number; lado: number; altura: number } {
  return { largura: tam(c[2] - c[0]), alto: tam(c[3] - c[1]), lado: lado((c[0] + c[2]) / 2), altura: altura((c[1] + c[3]) / 2) };
}
