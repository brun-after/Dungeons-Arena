// Barra e chip de identidade da classe no HUD (marco 22, 23/10/2026, D-089): a fúria do Guerreiro (marco 21) e a Mira
// firme do Arqueiro usam a mesma barra; a encarnação elemental do Mago aparece como chip. Lido do núcleo a cada quadro.

import { encarnacaoDe, type ElementoEncarnado } from '../combat/encarnacao';
import { fracaoFuria } from '../combat/furia';
import { fracaoMira } from '../combat/mira';
import type { ContextoSimulacao } from '../core/contexto';
import type { Entidade } from '../entities/entidade';

export interface BarraClasse {
  tipo: 'furia' | 'mira';
  fracao: number;
}

export interface IdentidadeClasse {
  barra: BarraClasse | null;
  encarnacao: ElementoEncarnado | null;
}

export function identidadeDaClasse(ctx: ContextoSimulacao, j: Entidade | undefined, tick: number): IdentidadeClasse {
  if (!j) return { barra: null, encarnacao: null };
  const furia = fracaoFuria(ctx, j, tick);
  const mira = furia === null ? fracaoMira(ctx, j, tick) : null;
  const barra: BarraClasse | null = furia !== null ? { tipo: 'furia', fracao: furia } : mira !== null ? { tipo: 'mira', fracao: mira } : null;
  return { barra, encarnacao: encarnacaoDe(j) };
}
