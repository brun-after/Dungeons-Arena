// A luz própria (marco 42, 15/11/2026, D-176): a tocha é um efeito com o gancho `ilumina` (combat/registro-efeitos.ts).
// Quem nada ou leva uma rajada de vento fica sem luz. Puro.

import type { Entidade } from '../entities/entidade';
import { REGISTRO_EFEITOS } from './registro-efeitos';

/** O portador leva luz própria agora. */
export function temLuzPropria(e: Pick<Entidade, 'efeitos'>): boolean {
  return e.efeitos.some((f) => REGISTRO_EFEITOS[f.tipo].ilumina);
}

/** Apaga toda luz própria do portador (devolve se apagou alguma). */
export function apagarLuz(e: Entidade): boolean {
  const antes = e.efeitos.length;
  e.efeitos = e.efeitos.filter((f) => !REGISTRO_EFEITOS[f.tipo].ilumina);
  return e.efeitos.length < antes;
}
