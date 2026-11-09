// Barra e chip de identidade da classe no HUD (marco 22, 23/10/2026, D-089): a fúria do Guerreiro (marco 21) e a Mira
// firme do Arqueiro usam a mesma barra; a encarnação elemental do Mago aparece como chip. Lido do núcleo a cada quadro.

import { encarnacaoDe, restanteEncarnacaoMs, type ElementoEncarnado } from '../combat/encarnacao';
import { fracaoFuria } from '../combat/furia';
import { fracaoMira } from '../combat/mira';
import type { ContextoSimulacao } from '../core/contexto';
import type { Entidade } from '../entities/entidade';
import type { EstadoJogo } from '../core/estado';
import { contarInvocacoes, limiteDeInvocacoes } from '../combat/efeitos-fluxo';
import { vivo } from '../entities/entidade';

export interface BarraClasse {
  tipo: 'furia' | 'mira';
  fracao: number;
}

export interface IdentidadeClasse {
  barra: BarraClasse | null;
  encarnacao: ElementoEncarnado | null;
  /** Ajuste de 24/10/2026 (D-091): segundos que faltam da encarnação. */
  encarnacaoS?: number;
  /** 09/11/2026 (D-143): os mortos de pé do Necromante (os que contam no teto, o teto e os de fora dele). */
  invocacoes?: ContagemInvocacoes | null;
}

export interface ContagemInvocacoes {
  vivas: number;
  limite: number;
  extras: number;
}

export function identidadeDaClasse(ctx: ContextoSimulacao, j: Entidade | undefined, tick: number): IdentidadeClasse {
  if (!j) return { barra: null, encarnacao: null };
  const furia = fracaoFuria(ctx, j, tick);
  const mira = furia === null ? fracaoMira(ctx, j, tick) : null;
  const barra: BarraClasse | null = furia !== null ? { tipo: 'furia', fracao: furia } : mira !== null ? { tipo: 'mira', fracao: mira } : null;
  return { barra, encarnacao: encarnacaoDe(j), encarnacaoS: Math.ceil(restanteEncarnacaoMs(j, tick) / 1000) };
}

/** 09/11/2026 (D-143): a contagem de invocações do Necromante, ao lado da vida (null nas outras classes). */
export function invocacoesDoNecromante(estado: EstadoJogo, ctx: ContextoSimulacao, j: Entidade | undefined): ContagemInvocacoes | null {
  if (!j || j.invocacao || (j.bolsa?.classeId ?? j.classeId) !== 'necromante') return null;
  const vivas = contarInvocacoes(estado, j.id);
  const todas = estado.entidades.filter((e) => vivo(e) && e.invocacao?.donoId === j.id && !e.invocacao.companheiro && !e.invocacao.avatar).length;
  return { vivas, limite: limiteDeInvocacoes(ctx, j), extras: Math.max(0, todas - vivas) };
}
