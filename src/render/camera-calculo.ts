// Cálculo da câmera (§2.4), em funções puras e testáveis. Unidades:
//   mundo: px de mundo (1 célula = CELULA_PX); tela: px CSS; zoom: tela/mundo.
// A câmera guarda o canto superior esquerdo visível, em mundo, como float; arredonda só no desenho.

export const CELULA_PX = 48;
export const ZOOM_MIN = 0.3;
export const ZOOM_MAX = 3;
export const MARGEM_DESKTOP = 0.2;
export const MARGEM_TOQUE = 0.3;
export const HISTERESE_CELULA = 0.25;

export interface Vista {
  /** Tamanho útil em px de tela (no toque, sem a faixa de controles). */
  largura: number;
  altura: number;
}

export interface PosicaoCamera {
  x: number;
  y: number;
}

/** Tamanho na tela de uma célula: `SZ = round(48 × zoom)` (§2.1). */
export function tamanhoCelulaTela(zoom: number): number {
  return Math.round(CELULA_PX * zoom);
}

export interface LimitesZoom {
  min: number;
  max: number;
}

/** O jogo usa 0.3–3; o editor, 0.1–6 (§3.10). */
export const LIMITES_JOGO: LimitesZoom = { min: ZOOM_MIN, max: ZOOM_MAX };

export function limitarZoom(zoom: number, limites: LimitesZoom = LIMITES_JOGO): number {
  return Math.min(limites.max, Math.max(limites.min, zoom));
}

/**
 * Janela morta num eixo: só desloca quando o centro da célula do jogador sai da margem,
 * com histerese de 25% da célula para absorver arredondamento. Retorna a nova origem do eixo.
 */
export function janelaMortaEixo(
  origem: number,
  centroJogador: number,
  tamanhoVistaMundo: number,
  fracaoMargem: number,
): number {
  const margem = tamanhoVistaMundo * fracaoMargem;
  const histerese = CELULA_PX * HISTERESE_CELULA;
  if (centroJogador < origem + margem - histerese) return centroJogador - margem;
  if (centroJogador > origem + tamanhoVistaMundo - margem + histerese) {
    return centroJogador - (tamanhoVistaMundo - margem);
  }
  return origem;
}

/**
 * Marco 26 (28/10/2026, D-117): a câmera solta (o jogador arrastou) só reenquadra o boneco que saiu inteiro da vista,
 * num eixo: põe a caixa dele logo dentro da borda por onde saiu, com `margem`. Ainda visível, a origem não muda.
 */
export function acomodarNaBorda(origem: number, caixaMin: number, caixaMax: number, tamanhoVista: number, margem: number, presa: -1 | 0 | 1 = 0): { origem: number; presa: -1 | 0 | 1 } {
  // Saiu inteiro (ou já vinha preso àquela borda e passou dela): volta para logo dentro, e a borda fica presa.
  if (caixaMax < origem || (presa === -1 && caixaMin < origem + margem)) return { origem: caixaMin - margem, presa: -1 };
  if (caixaMin > origem + tamanhoVista || (presa === 1 && caixaMax > origem + tamanhoVista - margem)) return { origem: caixaMax + margem - tamanhoVista, presa: 1 };
  // Preso, mas voltou para dentro: solta a borda (o arrasto do jogador vale de novo).
  return { origem, presa: 0 };
}

/** Limita um eixo à fase; se a fase for menor que a vista, centraliza. */
export function limitarEixo(origem: number, tamanhoMundo: number, tamanhoVistaMundo: number): number {
  if (tamanhoMundo <= tamanhoVistaMundo) return (tamanhoMundo - tamanhoVistaMundo) / 2;
  return Math.min(tamanhoMundo - tamanhoVistaMundo, Math.max(0, origem));
}

/** Velocidade máxima da suavização em px de mundo/s: `max(15, v × 1.5)` células/s (§2.4). */
export function velocidadeMaximaCamera(velocidadeJogadorCelulas: number): number {
  return Math.max(15, velocidadeJogadorCelulas * 1.5) * CELULA_PX;
}

/** Aproxima linearmente do alvo, sem passar da velocidade máxima. */
export function aproximar(atual: number, alvo: number, velocidadeMax: number, dtS: number): number {
  const delta = alvo - atual;
  const passo = velocidadeMax * dtS;
  if (Math.abs(delta) <= passo) return alvo;
  return atual + Math.sign(delta) * passo;
}

/**
 * Zoom ancorado (§2.4): o ponto do mundo sob a âncora (px de tela relativos à vista) fica parado.
 */
export function zoomAncorado(
  camera: PosicaoCamera,
  zoomAtual: number,
  zoomNovo: number,
  ancoraX: number,
  ancoraY: number,
  limites: LimitesZoom = LIMITES_JOGO,
): PosicaoCamera & { zoom: number } {
  const zoom = limitarZoom(zoomNovo, limites);
  const mundoX = camera.x + ancoraX / zoomAtual;
  const mundoY = camera.y + ancoraY / zoomAtual;
  return { x: mundoX - ancoraX / zoom, y: mundoY - ancoraY / zoom, zoom };
}

/** Converte px de tela (relativos à vista) em célula da grade. */
export function telaParaCelula(camera: PosicaoCamera, zoom: number, sx: number, sy: number): { x: number; y: number } {
  return {
    x: Math.floor((camera.x + sx / zoom) / CELULA_PX),
    y: Math.floor((camera.y + sy / zoom) / CELULA_PX),
  };
}
