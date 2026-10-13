// Hostilidade é por equipe, nunca por tipo (§2.5). Uma única função decide; mira, auto-alvo,
// IA, colisão configurável, efeitos, dano em área e XP passam por ela. Critério de aceite 7.

import type { EntidadeId } from '../core/comandos';
import type { ModoDeJogo } from './modo';

export type Relacao = 'proprio' | 'aliado' | 'neutro' | 'hostil';

/** O mínimo que a relação precisa saber de cada lado. */
export interface Lado {
  id: EntidadeId;
  equipe: string;
}

export function relacao(a: Lado, b: Lado, modo: ModoDeJogo): Relacao {
  if (a.id === b.id) return 'proprio';
  switch (modo.politicaRelacao) {
    case 'todos_hostis':
      return 'hostil';
    case 'todos_aliados':
      return 'aliado';
    case 'por_equipe':
      return a.equipe === b.equipe ? 'aliado' : 'hostil';
  }
}

/** Pode causar dano em `b`? Fogo amigo é parâmetro do modo (§2.5). */
export function podeFerir(a: Lado, b: Lado, modo: ModoDeJogo): boolean {
  const r = relacao(a, b, modo);
  return r === 'hostil' || (r === 'aliado' && modo.fogoAmigo);
}
