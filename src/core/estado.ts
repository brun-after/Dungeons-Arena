// Estado raiz da simulação (§3.3). Um único objeto tipado, só com dados: sem classes,
// sem funções e sem referências cíclicas, para clonar, comparar (digest) e gravar em checkpoint.
// O terreno da fase é conteúdo imutável e fica no contexto (D-007); aqui só o `faseId`.

import type { EntidadeId } from './comandos';
import { clonarEntidade, type Entidade } from '../entities/entidade';
import { clonarRng, criarRng, type EstadoRng } from './rng';

export { criarEntidade, clonarEntidade, type Entidade } from '../entities/entidade';

export interface EstadoJogo {
  versao: 1;
  faseId: string;
  tick: number;
  rng: EstadoRng;
  entidades: Entidade[];
}

export interface OpcoesEstado {
  semente: number;
  faseId: string;
}

export function criarEstado(opcoes: OpcoesEstado): EstadoJogo {
  return {
    versao: 1,
    faseId: opcoes.faseId,
    tick: 0,
    rng: criarRng(opcoes.semente),
    entidades: [],
  };
}

export function buscarEntidade(estado: EstadoJogo, id: EntidadeId): Entidade | undefined {
  return estado.entidades.find((e) => e.id === id);
}

// Clone explícito, campo a campo (§5.3 regra 4): nada de ida e volta por JSON em estado vivo.
export function clonarEstado(estado: EstadoJogo): EstadoJogo {
  return {
    versao: estado.versao,
    faseId: estado.faseId,
    tick: estado.tick,
    rng: clonarRng(estado.rng),
    entidades: estado.entidades.map(clonarEntidade),
  };
}
