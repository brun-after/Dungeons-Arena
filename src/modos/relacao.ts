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

/**
 * - `todos_hostis` (Livre): todos contra todos, exceto o próprio jogador e seus subordinados, que
 *   compartilham a equipe dele; cada jogador entra com a própria equipe (D-028).
 * - `por_equipe` (Equipes, campanha): mesma equipe é aliado.
 * - `todos_aliados` (Horda): ninguém é hostil.
 */
export function relacao(a: Lado, b: Lado, modo: Pick<ModoDeJogo, 'politicaRelacao'>): Relacao {
  if (a.id === b.id) return 'proprio';
  switch (modo.politicaRelacao) {
    case 'todos_aliados':
      return 'aliado';
    case 'todos_hostis':
    case 'por_equipe':
      return a.equipe === b.equipe ? 'aliado' : 'hostil';
  }
}

/** Pode causar dano em `b`? Fogo amigo é parâmetro do modo (§2.5). */
export function podeFerir(a: Lado, b: Lado, modo: Pick<ModoDeJogo, 'politicaRelacao' | 'fogoAmigo'>): boolean {
  const r = relacao(a, b, modo);
  return r === 'hostil' || (r === 'aliado' && modo.fogoAmigo);
}

/** Marco 14: pode ajudar `b` (curar, proteger, fortalecer)? O próprio e os aliados, pela relação do modo. */
export function podeAjudar(a: Lado, b: Lado, modo: Pick<ModoDeJogo, 'politicaRelacao'>): boolean {
  const r = relacao(a, b, modo);
  return r === 'proprio' || r === 'aliado';
}
