// Refúgios (marco 30, 30/10/2026, D-129): áreas da fase onde os monstros não entram e onde quem está dentro não é
// alvo deles. No Mundo, o círculo dos muros da vila (a região segura). As invocações e os jogadores entram; quem é
// barrado é a IA que não é invocação. A fase sem refúgios (a campanha, a arena) não muda nada. Puro.

import type { Entidade } from '../entities/entidade';
import type { Fase } from './fase';

export interface Refugio {
  x: number;
  y: number;
  raio: number;
}

/** O ponto (em células) está dentro de algum refúgio da fase? */
export function emRefugio(fase: Fase, x: number, y: number): boolean {
  const lista = fase.refugios;
  if (!lista) return false;
  for (const r of lista) if (Math.hypot(x - r.x, y - r.y) <= r.raio) return true;
  return false;
}

/** Quem os refúgios barram: a IA que não é invocação (os monstros). */
export const barradoNoRefugio = (e: Entidade): boolean => e.controlador === 'ia' && !e.invocacao;
