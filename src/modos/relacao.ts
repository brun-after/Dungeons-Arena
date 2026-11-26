// Hostilidade é por equipe, nunca por tipo (§2.5). Uma única função decide; mira, auto-alvo,
// IA, colisão configurável, efeitos, dano em área e XP passam por ela. Critério de aceite 7.

import { pvpEm } from './regras-por-zona';
import type { EntidadeId } from '../core/comandos';
import type { ModoDeJogo } from './modo';

export type Relacao = 'proprio' | 'aliado' | 'neutro' | 'hostil';

/** O mínimo que a relação precisa saber de cada lado. */
export interface Lado {
  id: EntidadeId;
  equipe: string;
  /** Vínculo com o invocador, independente do fogo amigo da região. */
  invocacao?: { donoId: EntidadeId } | null;
  /** Marco 30 (D-129): o grupo do Mundo; quem é do mesmo grupo nunca se fere, nem com fogo amigo. */
  grupo?: string | null;
  /** Marco 54 (D-207): onde está (no Mundo contínuo, o PvP é da zona dos dois). */
  x?: number;
  y?: number;
  /** Marco 49 (D-195): os estados ativos (o enfeitiçado vira a relação). */
  efeitos?: readonly { tipo: string }[];
}

/** Marco 49 (21/11/2026, D-195): a mente tomada pelo psíquico. */
const enfeiticado = (l: Lado): boolean => !!l.efeitos?.some((f) => f.tipo === 'enfeiticado');

/**
 * - `todos_hostis` (Livre): todos contra todos, exceto o próprio jogador e seus subordinados, que
 *   compartilham a equipe dele; cada jogador entra com a própria equipe (D-028).
 * - `por_equipe` (Equipes, campanha): mesma equipe é aliado.
 * - `todos_aliados` (Horda): ninguém é hostil.
 */
export function relacao(a: Lado, b: Lado, modo: Pick<ModoDeJogo, 'politicaRelacao'>): Relacao {
  if (a.id === b.id) return 'proprio';
  const r = relacaoDaEquipe(a, b, modo);
  // Marco 49 (D-195): o enfeitiçado (só um dos lados) vira contra os seus e deixa de ver os de fora como inimigos.
  if (enfeiticado(a) !== enfeiticado(b)) return r === 'aliado' ? 'hostil' : 'neutro';
  return r;
}

function relacaoDaEquipe(a: Lado, b: Lado, modo: Pick<ModoDeJogo, 'politicaRelacao'>): Relacao {
  switch (modo.politicaRelacao) {
    case 'todos_aliados':
      return 'aliado';
    case 'todos_hostis':
    case 'por_equipe':
      return a.equipe === b.equipe ? 'aliado' : 'hostil';
  }
}

/** Pode causar dano em `b`? Fogo amigo é parâmetro do modo (§2.5). */
export function podeFerir(a: Lado, b: Lado, modo: Pick<ModoDeJogo, 'politicaRelacao' | 'fogoAmigo' | 'zonas'>): boolean {
  // Correção de 02/11/2026: PvP não torna o dono e seu próprio exército alvos entre si.
  const donoA = a.invocacao?.donoId;
  const donoB = b.invocacao?.donoId;
  if (donoA === b.id || donoB === a.id || (donoA !== undefined && donoA === donoB)) return false;
  const r = relacao(a, b, modo);
  if (r === 'aliado' && !!a.grupo && a.grupo === b.grupo) return false;
  // Marco 54 (26/11/2026, D-207): no Mundo contínuo, o fogo amigo só vale com os dois numa zona de PvP.
  return r === 'hostil' || (r === 'aliado' && pvpEm(modo, a) && pvpEm(modo, b));
}

/** Marco 14: pode ajudar `b` (curar, proteger, fortalecer)? O próprio e os aliados, pela relação do modo. */
export function podeAjudar(a: Lado, b: Lado, modo: Pick<ModoDeJogo, 'politicaRelacao'>): boolean {
  const r = relacao(a, b, modo);
  return r === 'proprio' || r === 'aliado';
}
