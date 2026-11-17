// O cenário baixo (16/11/2026). O que na vida real se passa por cima sem esforço não trava o jogador: o arbusto, a
// moita, os juncos, a pedra miúda, o toco, a tora caída, o entulho, o saco, o feno, o marco de pedra e a placa. Só o
// que é alto ou grande barra (a árvore pelo tronco, world/troncos.ts; o rochedo no pé do penhasco; o barril, a cerca,
// o poço). As regras ficam aqui para o gerador (o que ocupa a célula) e o desenho (o que aparece nela) concordarem.
// Puro.

import CENARIO from '../data/mundo/cenario.json';
import { OBSTACULO } from './geografia';

/** As séries do cenário que se atravessam (`passaPorCima` em cenario.json). */
export const PASSA_POR_CIMA: ReadonlySet<string> = new Set(CENARIO.passaPorCima);

/** O hash do cenário (o mesmo do desenho: a mesma célula dá a mesma escolha nos dois). */
export function hashDoCenario(x: number, y: number, s: number): number {
  let h = (Math.imul(x, 374_761_393) + Math.imul(y, 668_265_263) + Math.imul(s, 1_013_904_223)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1_274_126_177);
  return ((h ^ (h >>> 16)) >>> 0) / 4_294_967_296;
}

const VIZ8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]] as const;

/**
 * Na borda da mata (poucas árvores em volta), parte das árvores é arbusto: vira `OBSTACULO.arbusto`, sem tronco. A
 * escolha olha o mapa de antes (as trocas não mudam a conta das vizinhas). Muda `obstaculos` no lugar.
 */
export function marcarArbustos(obstaculos: Uint8Array, n: number): void {
  const em = (x: number, y: number) => (x < 0 || y < 0 || x >= n || y >= n ? 0 : (obstaculos[y * n + x] ?? 0));
  const arbustos: number[] = [];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (em(x, y) !== OBSTACULO.arvore) continue;
      const vizinhas = VIZ8.filter(([dx, dy]) => em(x + dx, y + dy) === OBSTACULO.arvore).length;
      if (vizinhas <= 2 && hashDoCenario(x, y, 15) < 0.45) arbustos.push(y * n + x);
    }
  }
  for (const k of arbustos) obstaculos[k] = OBSTACULO.arbusto;
}

/** O rochedo no pé do penhasco (o vizinho bem mais alto) ou da serra é grande e barra; o do plano é pedra miúda. */
export function rochaDoPenhasco(obstaculoEm: (x: number, y: number) => number, alturaEm: (x: number, y: number) => number, x: number, y: number): boolean {
  return VIZ8.some(([dx, dy]) => obstaculoEm(x + dx, y + dy) === OBSTACULO.montanha || alturaEm(x + dx, y + dy) - alturaEm(x, y) >= 3);
}
