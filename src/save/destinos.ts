// Para onde levam os portais da fase (marco 26, 26/10/2026, D-112): o tema da fase seguinte (pela saída) e o da
// anterior (pelo retorno), para a moldura do portal mostrar o destino. A sequência das geradas é determinística, então
// o tema é conhecido antes de entrar. Fase oficial e aventura não têm tema: o portal fica neutro.

import type { RefFase } from './esquema';
import { faseSeguinte } from './fases-campanha';
import { faseAnterior, referenciaConhecida } from './retorno';

export interface TemasDosPortais {
  saida: string | null;
  retorno: string | null;
}

const temaDe = (ref: RefFase | null): string | null => (ref?.tipo === 'gerada' ? (ref.params.tema ?? null) : null);

export function temasDosPortais(ref: RefFase, conhecidas: Readonly<Record<string, RefFase>> = {}): TemasDosPortais {
  const seguinte = faseSeguinte(ref);
  const anterior = faseAnterior(ref, conhecidas);
  return {
    saida: temaDe(seguinte ? referenciaConhecida(seguinte, conhecidas) : null),
    retorno: temaDe(anterior ? referenciaConhecida(anterior, conhecidas) : null),
  };
}
