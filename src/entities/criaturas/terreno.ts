// Marco 45 (16/11/2026, D-182): o terreno elemental sob a criatura e o que ela ganha nele (`naFenda` do preset).
// Os terrenos não mudam: a criatura só os lê. Puro.

import type { ContextoSimulacao } from '../../core/contexto';
import type { EstadoJogo } from '../../core/estado';
import { celulaOcupada } from '../../combat/geometria';
import { dentroDaArea, type TipoTerrenoVivo } from '../../world/ambiente-tipos';
import { areasEfetivasEm } from '../../world/terrenos-vivos';
import type { Entidade } from '../entidade';
import type { PresetInimigo } from '../presets';
import { REACAO_NEUTRA, type ReacaoNaFenda } from './tipos';

/** O tipo do terreno na célula (o vivo por cima do fixo), ou null. */
export function terrenoNa(estado: EstadoJogo, ctx: ContextoSimulacao, x: number, y: number): TipoTerrenoVivo | null {
  const fixas = ctx.fase.ambientes ?? [];
  if (fixas.length === 0 && !(estado.terrenos ?? []).length) return null;
  return areasEfetivasEm(estado, fixas, x, y).find((a) => dentroDaArea(a, x, y))?.tipo ?? null;
}

export function terrenoSob(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade): TipoTerrenoVivo | null {
  const c = celulaOcupada(e);
  return terrenoNa(estado, ctx, c.x, c.y);
}

export function presetDe(ctx: ContextoSimulacao, e: Entidade): PresetInimigo | undefined {
  return ctx.conteudo.presets.get(e.preset);
}

/** A reação da criatura ao terreno em que está agora (a neutra fora de um terreno que ela leia). */
export function reacaoAgora(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade): ReacaoNaFenda {
  const p = presetDe(ctx, e);
  if (!p || Object.keys(p.naFenda).length === 0) return REACAO_NEUTRA;
  const t = terrenoSob(estado, ctx, e);
  return (t && p.naFenda[t]) || REACAO_NEUTRA;
}

export const temMarca = (estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, marca: string): boolean =>
  reacaoAgora(estado, ctx, e).marcas.includes(marca);

/** O traço do tipo pedido no preset da entidade (o primeiro), ou undefined. */
export function tracoDe<T extends PresetInimigo['tracos'][number]['tipo']>(ctx: ContextoSimulacao, e: Entidade, tipo: T): Extract<PresetInimigo['tracos'][number], { tipo: T }> | undefined {
  const p = presetDe(ctx, e);
  return p?.tracos.find((t): t is Extract<PresetInimigo['tracos'][number], { tipo: T }> => t.tipo === tipo);
}
