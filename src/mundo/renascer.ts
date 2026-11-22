// Onde renascer no Mundo (marco 53, 22/11/2026, D-203). Quem morre fora de dungeon escolhe, na tela da morte, voltar
// pelo acampamento (a fogueira dele, se ainda vale), pela vila salva (o último save) ou pela vila central do reino.
// Sem escolha, fica o de antes: o acampamento, se houver, e senão a vila salva. Puro.

import type { Celula } from '../core/comandos';
import { renascerNoAcampamento } from './acampamento-sala';
import type { FichaDoMundo } from './ficha-mundo';
import type { Reino } from './reino';

export const LUGARES_DE_RENASCER = ['acampamento', 'save', 'central'] as const;
export type LugarDeRenascer = (typeof LUGARES_DE_RENASCER)[number];

/** A região e o ponto de chegada (null: a entrada da região, como na viagem). */
export function ondeRenascer(ficha: FichaDoMundo, escolha: LugarDeRenascer | undefined, reino: Pick<Reino, 'inicio'>, agoraMs: number): { regiao: string; chegada: Celula | null } {
  const acamp = escolha === undefined || escolha === 'acampamento' ? renascerNoAcampamento(ficha, agoraMs) : null;
  if (acamp) return { regiao: acamp.regiao, chegada: { x: acamp.x, y: acamp.y } };
  if (escolha === 'central') return { regiao: reino.inicio, chegada: null };
  return { regiao: ficha.vilaSalva, chegada: null };
}
