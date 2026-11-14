// A ultimate do par da barra (marco 40, 13/11/2026, D-160): as duas skills das teclas 1 e 2 e a família dos papéis
// delas. Separado do medidor (carga-ultimate.ts) para a runa e os fios consultarem sem depender dele. Puro.

import type { ContextoSimulacao } from '../core/contexto';
import { SLOTS_CLASSE, type Entidade } from '../entities/entidade';
import { ultimateDosPapeis, type Ultimate } from './ultimates';

/** O par da ultimate: as duas skills das teclas 1 e 2 (sem bolsa, como na arena, as duas primeiras habilidades). */
export function parDaUltimate(e: Pick<Entidade, 'bolsa' | 'habilidades'>): readonly [string, string] | null {
  const [a, b] = e.bolsa ? e.bolsa.barra.slice(0, SLOTS_CLASSE) : e.habilidades.slice(0, SLOTS_CLASSE);
  return a && b ? [a, b] : null;
}

/**
 * A ultimate do par nas teclas 1 e 2; null sem par. Marco 40 (13/11/2026, D-160): a família vem dos papéis das duas
 * skills (a skill sem papel, como as dos inimigos, não forma par).
 */
export function ultimateDe(ctx: Pick<ContextoSimulacao, 'conteudo'>, e: Pick<Entidade, 'bolsa' | 'habilidades'>): Ultimate | null {
  const par = parDaUltimate(e);
  const pa = par ? ctx.conteudo.definicoes.get(par[0])?.base.papel : undefined;
  const pb = par ? ctx.conteudo.definicoes.get(par[1])?.base.papel : undefined;
  return pa && pb ? ultimateDosPapeis(ctx.conteudo.ultimates, pa, pb) : null;
}
