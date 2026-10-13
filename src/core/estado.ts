// Estado raiz da simulação (§3.3). Um único objeto tipado, só com dados: sem classes,
// sem funções e sem referências cíclicas, para clonar, comparar (digest) e gravar em checkpoint.
// Marco 1: só o necessário para o laço, os comandos e o harness. Os domínios (fase, combate,
// efeitos, itens) entram nos marcos seguintes como sub-estados.

import type { Dir8, EntidadeId } from './comandos';
import { clonarRng, criarRng, type EstadoRng } from './rng';

export interface Entidade {
  id: EntidadeId;
  /** Posição lógica em células (§2.2). A apresentação guarda renderX/renderY à parte. */
  x: number;
  y: number;
  hp: number;
  hpMax: number;
  direcao: Dir8 | 'parado';
  /** Tempo acumulado em direção à próxima célula. */
  progressoPassoMs: number;
  /** Alternância X/Y do movimento diagonal (§2.3): true = próximo passo diagonal vai em X. */
  proximoEixoX: boolean;
}

export interface Mundo {
  largura: number;
  altura: number;
}

export interface EstadoJogo {
  versao: 1;
  tick: number;
  rng: EstadoRng;
  mundo: Mundo;
  entidades: Entidade[];
}

export interface OpcoesEstado {
  semente: number;
  largura: number;
  altura: number;
}

export function criarEstado(opcoes: OpcoesEstado): EstadoJogo {
  return {
    versao: 1,
    tick: 0,
    rng: criarRng(opcoes.semente),
    mundo: { largura: opcoes.largura, altura: opcoes.altura },
    entidades: [],
  };
}

export function criarEntidade(id: EntidadeId, x: number, y: number, hpMax = 100): Entidade {
  return {
    id,
    x,
    y,
    hp: hpMax,
    hpMax,
    direcao: 'parado',
    progressoPassoMs: 0,
    proximoEixoX: true,
  };
}

export function buscarEntidade(estado: EstadoJogo, id: EntidadeId): Entidade | undefined {
  return estado.entidades.find((e) => e.id === id);
}

// Clone explícito, campo a campo (§5.3 regra 4): nada de ida e volta por JSON em estado vivo.
export function clonarEntidade(e: Entidade): Entidade {
  return {
    id: e.id,
    x: e.x,
    y: e.y,
    hp: e.hp,
    hpMax: e.hpMax,
    direcao: e.direcao,
    progressoPassoMs: e.progressoPassoMs,
    proximoEixoX: e.proximoEixoX,
  };
}

export function clonarEstado(estado: EstadoJogo): EstadoJogo {
  return {
    versao: estado.versao,
    tick: estado.tick,
    rng: clonarRng(estado.rng),
    mundo: { largura: estado.mundo.largura, altura: estado.mundo.altura },
    entidades: estado.entidades.map(clonarEntidade),
  };
}
