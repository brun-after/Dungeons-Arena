// Contexto injetado em `simular()`: conteúdo imutável (fase e catálogos), modo de jogo e números
// de balanceamento. Fica fora do estado: não entra no digest nem no checkpoint (D-007).

import balanceJson from '../data/balance.json';
import type { FaixaCritico } from '../combat/critico';
import type { ModoDeJogo, Raridade } from '../modos/modo';
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
  /** Drops na primeira morte de um inimigo (§2.10). */
  drops: {
    chanceOrbeHp: number;
    chanceOrbeRecurso: number;
    orbeHpPct: number;
    orbeRecursoPct: number;
    /** Sorteio de item, independente do de orbe (§2.10); boss tem chance própria. */
    chanceItem: number;
    chanceItemBoss: number;
    /** Orbe de efeito (§2.10, 8%), sorteado à parte; o efeito vem do registro, por peso. */
    chanceOrbeEfeito: number;
    raridadeMinBoss: Raridade;
    pesoRaridade: Record<Raridade, number>;
  };
  /** Progressão (§2.12). XP para passar do nível N: `tabela[N-1]` ou `N × fallbackPorNivel`. */
  xp: {
    decaimentoAntifarm: number;
    tabela: number[];
    fallbackPorNivel: number;
    nivelMax: number;
    pontosPorNivel: number;
    /** Aumento automático de HP base por nível acima do 1º. */
    hpPorNivel: number;
  };
  /** Efeitos (§2.8): dano, cura e recurso periódicos aplicam a cada intervalo. */
  efeitos: {
    intervaloPeriodicoMs: number;
    /** Quanto dura cada célula de rastro (§2.8). */
    rastroCelulaMs: number;
    /** Dominação (§2.9): duração e HP com que o dominado volta. */
    dominacaoMs: number;
    dominacaoHpPct: number;
  };
  /** Limites do atributo efetivo (§2.10, equipamento derivado). */
  atributos: {
    minimo: number;
    maximo: number;
  };
  inventario: {
    /** Entradas na mochila; consumíveis iguais empilham até `pilhaMax`. */
    capacidade: number;
    pilhaMax: number;
  };
  ia: RegrasIa;
}

/** Números da IA (§2.6). */
export interface RegrasIa {
  patrulhaAvaliacaoMs: number;
  patrulhaPassoMs: number;
  chanceAproximar: number;
  chanceManter: number;
  /** Opções mais curtas que a base, com a chance de cada uma (a base fica com o restante). */
  hesitacao: { s: number; chance: number }[];
  hesitacaoBaseS: number;
  /** Cada ponto de Carisma acima do neutro multiplica as chances por este fator. */
  fatorCarisma: number;
  maxPassosPerseguicao: number;
  recalcularDistancia: number;
  maxFalhasCaminho: number;
  desistirAposMs: number;
  checagemDesistenciaMs: number;
  chanceDesistir: number;
  distanciaMinAtirador: number;
  distanciaMaxAtirador: number;
}

// O JSON importado tipa `raridadeMinBoss` como string; o leitor de conteúdo confere o valor nos testes.
export const BALANCE_PADRAO: Balance = balanceJson as Balance;

export interface ContextoSimulacao {
  readonly fase: Fase;
  readonly balance: Balance;
  readonly conteudo: Conteudo;
  readonly modo: ModoDeJogo;
}
