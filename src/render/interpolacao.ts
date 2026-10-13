// Interpolação da apresentação (§2.2): guarda a posição visual de cada entidade antes do último
// tick e mistura com a atual pelo `alpha` do laço. Nunca altera o estado da simulação.

import type { EstadoJogo } from '../core/estado';
import type { Entidade } from '../entities/entidade';

export interface PontoVisual {
  x: number;
  y: number;
}

/** Posição contínua em células: origem do passo + fração do caminho até o destino. */
export function posicaoNoPasso(e: Entidade): PontoVisual {
  return {
    x: e.x + (e.destinoX - e.x) * e.progressoPasso,
    y: e.y + (e.destinoY - e.y) * e.progressoPasso,
  };
}

/** Saltos maiores que isso (teleporte, correção) não são animados. */
const SALTO_MAXIMO = 2;

export class Interpolador {
  private readonly anteriores = new Map<string, PontoVisual>();

  /** Chamar imediatamente antes de cada `simular()`. */
  registrarAntesDoTick(estado: EstadoJogo): void {
    for (const e of estado.entidades) this.anteriores.set(e.id, posicaoNoPasso(e));
  }

  posicao(e: Entidade, alpha: number): PontoVisual {
    const atual = posicaoNoPasso(e);
    const anterior = this.anteriores.get(e.id);
    if (!anterior || Math.abs(atual.x - anterior.x) + Math.abs(atual.y - anterior.y) > SALTO_MAXIMO) return atual;
    return {
      x: anterior.x + (atual.x - anterior.x) * alpha,
      y: anterior.y + (atual.y - anterior.y) * alpha,
    };
  }

  esquecer(id: string): void {
    this.anteriores.delete(id);
  }
}
