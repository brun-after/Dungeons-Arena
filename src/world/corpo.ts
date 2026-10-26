// Marco 26 (25/10/2026, D-104): o corpo redondo do movimento livre. Puro e determinístico (só soma, produto, divisão
// e raiz): o mesmo resultado no cliente (predição) e no servidor.
// - a célula (i, j) ocupa o quadrado [i − 0,5, i + 0,5] × [j − 0,5, j + 0,5]; o centro é o inteiro;
// - o corpo é um círculo de raio r; ele cabe num ponto se não encosta em nenhuma célula bloqueada;
// - a linha de visão do corpo é a faixa do segmento com o raio, amostrada a cada `PASSO_AMOSTRA`;
// - suavizar o caminho é puxar a corda: de cada ponto, o nó mais distante que o corpo alcança em linha reta.

import type { Celula } from '../core/comandos';
import { passavel, type Fase } from './fase';

/** Distância entre amostras da linha de visão, em células (menor que o raio: nenhuma quina passa entre duas). */
const PASSO_AMOSTRA = 0.2;
/** Quantos nós à frente a suavização olha de cada ponto (trechos retos de até ~24 células). */
const ALCANCE_SUAVIZAR = 24;

/** Quais células barram o corpo além do terreno (as muralhas táticas, o perigo que a IA evita). */
export type Barreira = (x: number, y: number) => boolean;

/** O círculo de raio `r` em (x, y) encosta na célula (i, j)? (Distância ao quadrado até o ponto mais próximo.) */
function encosta(x: number, y: number, r: number, i: number, j: number): boolean {
  const qx = Math.max(i - 0.5, Math.min(x, i + 0.5));
  const qy = Math.max(j - 0.5, Math.min(y, j + 0.5));
  const dx = x - qx;
  const dy = y - qy;
  return dx * dx + dy * dy < r * r;
}

/** O corpo de raio `r` cabe em (x, y): não encosta em célula intransitável nem barrada. */
export function corpoCabe(fase: Fase, x: number, y: number, r: number, barreira: Barreira | null = null): boolean {
  for (let j = Math.round(y - r); j <= Math.round(y + r); j++) {
    for (let i = Math.round(x - r); i <= Math.round(x + r); i++) {
      if ((!passavel(fase, i, j) || barreira?.(i, j)) && encosta(x, y, r, i, j)) return false;
    }
  }
  return true;
}

/** O corpo vai de `a` a `b` em linha reta sem encostar em nada (amostrado ao longo do segmento). */
export function linhaLivre(fase: Fase, a: Celula, b: Celula, r: number, barreira: Barreira | null = null): boolean {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const n = Math.max(1, Math.ceil(Math.sqrt(dx * dx + dy * dy) / PASSO_AMOSTRA));
  for (let k = 1; k <= n; k++) {
    if (!corpoCabe(fase, a.x + (dx * k) / n, a.y + (dy * k) / n, r, barreira)) return false;
  }
  return true;
}

/**
 * Puxa a corda do caminho de células (sem a origem): devolve só os pontos onde o corpo muda de rumo, cada trecho em
 * linha reta. Sem atalho possível, o caminho fica nó a nó (o corpo nunca é mandado por onde não passa).
 */
export function suavizarCaminho(fase: Fase, origem: Celula, celulas: readonly Celula[], r: number, barreira: Barreira | null = null): Celula[] {
  const saida: Celula[] = [];
  let de = origem;
  let i = 0;
  while (i < celulas.length) {
    // Avança enquanto o nó seguinte ainda é visível a partir de `de` (até `ALCANCE_SUAVIZAR` nós: custo linear).
    let ate = i;
    for (let k = i + 1; k < Math.min(celulas.length, i + ALCANCE_SUAVIZAR); k++) {
      const c = celulas[k];
      if (!c || !linhaLivre(fase, de, c, r, barreira)) break;
      ate = k;
    }
    const ponto = celulas[ate];
    if (!ponto) break;
    saida.push({ x: ponto.x, y: ponto.y });
    de = ponto;
    i = ate + 1;
  }
  return saida;
}
