// Marco 49 (21/11/2026, D-195): o psíquico toma a mente. O golpe psíquico que fere pode (pela chance, com espera por
// alvo) deixar o alvo:
// - enfeitiçado: vira contra os seus (a relação vira em modos/relacao.ts) e deixa de ver os de fora como inimigos;
// - confuso: só anda (vaga, na IA), sem agir;
// - aterrorizado: foge de quem o aterrorizou, sem agir;
// - iludido: as skills ofensivas caem nele mesmo (o jogador seleciona a si mesmo ao usar);
// - sem visão: ninguém é alvo para ele (a IA vaga; na tela do jogador, os outros somem).
// Entre personagens, o estado dura menos. Números em `balance.elementosFerem.mente`. Puro.

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { aleatorio } from '../core/rng';
import { ticksDe } from '../core/tempo';
import type { Entidade } from '../entities/entidade';
import { aplicarEfeito } from './efeitos';
import { construirEfeito, REGISTRO_EFEITOS, type TipoEfeito } from './registro-efeitos';

/** Os cinco estados da mente, na ordem do sorteio. */
export const ESTADOS_DA_MENTE = ['enfeiticado', 'confuso', 'aterrorizado', 'iludido', 'sem_visao'] as const satisfies readonly TipoEfeito[];
export type EstadoDaMente = (typeof ESTADOS_DA_MENTE)[number];

const temFlag = (e: Entidade, tick: number, flag: 'contraSi' | 'semVisao'): boolean =>
  e.efeitos.some((f) => f.ateTick > tick && REGISTRO_EFEITOS[f.tipo][flag]);

/** As skills do portador caem nele mesmo (iludido)? */
export const contraSi = (e: Entidade, tick: number): boolean => temFlag(e, tick, 'contraSi');

/** O portador não enxerga ninguém (sem visão)? */
export const semVisao = (e: Entidade, tick: number): boolean => temFlag(e, tick, 'semVisao');

type Origem = Parameters<typeof aplicarEfeito>[4];

/** O golpe psíquico que feriu: talvez tome a mente do alvo. Devolve o estado aplicado (ou null). */
export function tomarAMente(estado: EstadoJogo, ctx: ContextoSimulacao, alvo: Entidade, origem: Origem, entrePersonagens: boolean, saida: EventoSimulacao[]): EstadoDaMente | null {
  const r = ctx.balance.elementosFerem.mente;
  const ate = alvo.reacoesAte?.['el:mente'] ?? 0;
  if (ate > estado.tick || aleatorio(estado.rng) * 100 >= r.chancePct) return null;
  (alvo.reacoesAte ??= {})['el:mente'] = estado.tick + ticksDe(r.intervaloMs);
  const tipo = ESTADOS_DA_MENTE[Math.min(ESTADOS_DA_MENTE.length - 1, Math.floor(aleatorio(estado.rng) * ESTADOS_DA_MENTE.length))] ?? 'confuso';
  const duracaoMs = Math.round((r.duracaoMs[tipo] * (entrePersonagens ? r.entrePersonagensPct : 100)) / 100);
  aplicarEfeito(estado, ctx, alvo, construirEfeito(tipo, { duracaoMs }), origem, null, saida);
  return tipo;
}
