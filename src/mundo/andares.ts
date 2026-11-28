// Marco 56 (27/11/2026, D-209): os andares das masmorras do Mundo. Cada andar é uma fase gerada à parte (a semente
// leva o andar), com as salas da masmorra repartidas entre eles: o chefe só no último; nos de cima, a saída é livre e
// é a escada para baixo. Todo andar tem a escada para cima ao lado de onde se chega (a porta de retorno): no primeiro
// ela sai da masmorra, nos outros volta ao andar de cima. Puro.

import { BALANCE_PADRAO, type Balance } from '../core/contexto';
import type { Celula } from '../core/comandos';
import { passavel, type Fase } from '../world/fase';
import type { MasmorraDoMundo } from './reino';

/** O andar só existe com pelo menos 3 salas (o último precisa de 3 para ter o chefe). */
const SALAS_MIN_POR_ANDAR = 3;

/** Quantos andares a masmorra tem: o do reino, ou um a cada `salasPorAndar` salas. */
export function andaresDe(m: Pick<MasmorraDoMundo, 'salas' | 'andares'>, balance: Balance = BALANCE_PADRAO): number {
  const pedido = m.andares ?? Math.ceil(m.salas / Math.max(1, balance.mundo.andares.salasPorAndar));
  return Math.max(1, Math.min(pedido, Math.floor(m.salas / SALAS_MIN_POR_ANDAR)));
}

/** As salas do andar `n` (1 é o de cima): a divisão por igual, a sobra nos de cima. */
export function salasDoAndar(salas: number, n: number, total: number): number {
  const base = Math.floor(salas / total);
  return base + (n <= salas % total ? 1 : 0);
}

/** A escada para cima: uma célula andável ao lado da chegada (quem chega não pisa nela). */
export function escadaPerto(fase: Fase, spawn: Celula): Celula {
  for (const [dx, dy] of [[-1, -1], [-1, 0], [0, -1], [1, -1], [-1, 1], [1, 0], [0, 1], [1, 1]] as const) {
    if (passavel(fase, spawn.x + dx, spawn.y + dy)) return { x: spawn.x + dx, y: spawn.y + dy };
  }
  return { ...spawn };
}
