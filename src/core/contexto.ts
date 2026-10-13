// Contexto injetado em `simular()`: conteúdo imutável (fase e catálogos), modo de jogo e números
// de balanceamento. Fica fora do estado: não entra no digest nem no checkpoint (D-007).

import balanceJson from '../data/balance.json';
import type { FaixaCritico } from '../combat/critico';
import type { ModoDeJogo } from '../modos/modo';
import type { RegrasColisao } from '../world/colisao';
import type { Fase } from '../world/fase';
import type { Conteudo } from './conteudo';

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
  combate: {
    multiplicadorAtributoPadrao: number;
    autoAtaqueMs: number;
    janelaParticipacaoS: number;
    carismaNeutro: number;
    critico: FaixaCritico[];
  };
  hp: {
    hpAtributoMult: number;
    dificuldadeMult: number;
    fallback: number;
  };
  recursos: {
    regenManaPorSegundo: number;
  };
  respawn: {
    inimigoS: number;
    bossS: number;
  };
  morte: {
    reviverMs: number;
    invisivelMs: number;
  };
  xp: {
    decaimentoAntifarm: number;
  };
}

export const BALANCE_PADRAO: Balance = balanceJson;

export interface ContextoSimulacao {
  readonly fase: Fase;
  readonly balance: Balance;
  readonly conteudo: Conteudo;
  readonly modo: ModoDeJogo;
}
