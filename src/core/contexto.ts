// Contexto injetado em `simular()`: conteúdo imutável (fase) e números de balanceamento.
// Fica fora do estado: não entra no digest nem no checkpoint, que guardam só o `faseId`.

import balanceJson from '../data/balance.json';
import type { RegrasColisao } from '../world/colisao';
import type { Fase } from '../world/fase';

export interface Balance {
  versao: number;
  movimento: {
    /** Milissegundos por célula na destreza 10 (§2.3). */
    velocidadeBaseMs: number;
    /** Tamanho máximo da fila de waypoints do jogador (§2.3). */
    filaMaxWaypoints: number;
  };
  navegacao: {
    /** Limite da busca para toque no mapa (§2.3). */
    maxPassosToque: number;
  };
  colisao: RegrasColisao;
}

export const BALANCE_PADRAO: Balance = balanceJson;

export interface ContextoSimulacao {
  readonly fase: Fase;
  readonly balance: Balance;
}
