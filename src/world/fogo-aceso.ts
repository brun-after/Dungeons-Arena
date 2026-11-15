// O fogo aceso (marco 44, 15/11/2026, D-178). Os postes e as fogueiras do ermo queimam sempre; a fogueira de
// acampamento (a que o jogador monta com lenha, mundo/acampamento.ts) queima até o tick em `valor`, e apagada não
// ilumina, não acende tocha nem aquece quem descansa. Puro.

import type { ObjetoNoMundo } from '../core/estado';

/** O `ref` da fogueira e da caixa de acampamento: o prefixo e a chave do dono. */
export const PREFIXO_ACAMPAMENTO = 'acampamento:';

export const ehDeAcampamento = (o: Pick<ObjetoNoMundo, 'ref'>): boolean => o.ref?.startsWith(PREFIXO_ACAMPAMENTO) ?? false;

/** O fogo que ilumina e aquece agora: o poste e a fogueira, a de acampamento só enquanto queima. */
export function fogoAceso(o: Pick<ObjetoNoMundo, 'tipo' | 'ref' | 'valor'>, tick: number): boolean {
  if (o.tipo === 'poste_tocha') return true;
  if (o.tipo !== 'fogueira') return false;
  return !ehDeAcampamento(o) || o.valor > tick;
}
