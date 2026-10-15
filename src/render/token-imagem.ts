// Personagem por imagem (§2.16, D-055, D-058). Marco 13 (14/10/2026).
// Valida e prepara uma imagem qualquer como token: limites de tamanho, recorte da transparência pela caixa
// dos pixels visíveis e origem nos pés (base da caixa). Qualquer falha vira um motivo em linguagem simples, e
// quem chama mostra o substituto (a silhueta). As funções puras ficam no topo, testáveis sem navegador.

export const LIMITE_BYTES = 2 * 1024 * 1024;
export const LIMITE_LADO_PX = 1024;
/** Alfa mínimo para um pixel contar como visível (bordas quase transparentes de antialias não contam). */
export const ALFA_VISIVEL = 8;
const TIPOS_ACEITOS = ['image/png', 'image/webp', 'image/jpeg', 'image/gif'] as const;

export type MotivoRecusa = 'formato' | 'grande' | 'dimensoes' | 'corrompida' | 'vazia';

export interface Caixa {
  x: number;
  y: number;
  l: number;
  a: number;
}

/** Recusa antes de decodificar: formato e tamanho do arquivo. */
export function validarArquivo(tipo: string, bytes: number): MotivoRecusa | null {
  if (!(TIPOS_ACEITOS as readonly string[]).includes(tipo)) return 'formato';
  if (bytes > LIMITE_BYTES) return 'grande';
  if (bytes === 0) return 'corrompida';
  return null;
}

export function validarDimensoes(largura: number, altura: number): MotivoRecusa | null {
  if (largura <= 0 || altura <= 0) return 'corrompida';
  if (largura > LIMITE_LADO_PX || altura > LIMITE_LADO_PX) return 'dimensoes';
  return null;
}

/** Caixa dos pixels visíveis (RGBA por linha). `null` quando a imagem é toda transparente. */
export function caixaVisivel(rgba: Uint8ClampedArray, largura: number, altura: number, limiar = ALFA_VISIVEL): Caixa | null {
  let x0 = largura;
  let y0 = altura;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < altura; y++) {
    for (let x = 0; x < largura; x++) {
      if ((rgba[(y * largura + x) * 4 + 3] ?? 0) < limiar) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  return x1 < 0 ? null : { x: x0, y: y0, l: x1 - x0 + 1, a: y1 - y0 + 1 };
}

/**
 * Escala para a altura visível virar `alturaAlvoPx` (1,12 célula × tamanho do aparelho), com a proporção
 * mantida. A origem fica no centro da base da caixa (os pés).
 */
export function encaixar(caixa: Caixa, alturaAlvoPx: number): { escala: number; ancoraX: number; ancoraY: number } {
  return { escala: alturaAlvoPx / caixa.a, ancoraX: 0.5, ancoraY: 1 };
}

export type ResultadoToken = { ok: true; imagem: HTMLCanvasElement } | { ok: false; motivo: MotivoRecusa };

/** Decodifica (dentro de `try`), confere os limites e recorta a transparência. Só no navegador. */
export async function prepararToken(arquivo: Blob): Promise<ResultadoToken> {
  const recusa = validarArquivo(arquivo.type, arquivo.size);
  if (recusa) return { ok: false, motivo: recusa };
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(arquivo);
  } catch {
    return { ok: false, motivo: 'corrompida' };
  }
  try {
    const dimensoes = validarDimensoes(bitmap.width, bitmap.height);
    if (dimensoes) return { ok: false, motivo: dimensoes };
    const origem = document.createElement('canvas');
    origem.width = bitmap.width;
    origem.height = bitmap.height;
    const g = origem.getContext('2d', { willReadFrequently: true });
    if (!g) return { ok: false, motivo: 'corrompida' };
    g.drawImage(bitmap, 0, 0);
    const caixa = caixaVisivel(g.getImageData(0, 0, origem.width, origem.height).data, origem.width, origem.height);
    if (!caixa) return { ok: false, motivo: 'vazia' };
    const recorte = document.createElement('canvas');
    recorte.width = caixa.l;
    recorte.height = caixa.a;
    recorte.getContext('2d')?.drawImage(origem, caixa.x, caixa.y, caixa.l, caixa.a, 0, 0, caixa.l, caixa.a);
    return { ok: true, imagem: recorte };
  } finally {
    bitmap.close();
  }
}
