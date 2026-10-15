// Dificuldade e tamanho do grupo (marco 15, 15/10/2026, D-061). Puro.
// O mesmo personagem joga em qualquer dificuldade: ela só muda o mundo à volta dele — a vida e o dano dos
// inimigos, quanto eles hesitam, o aviso extra dos golpes e a recompensa. O tamanho do grupo (campanha
// cooperativa, até 6) escala pela mesma conta. Tudo em dados (balance.dificuldades e balance.grupo).
//
// "Lado do jogador" é a equipe de quem tem bolsa (o personagem de campanha) — invocações e dominados entram por
// estarem na equipe dele. Nada olha o `tipo` da entidade (§2.5). Sem nenhum personagem com bolsa (arena), tudo é
// neutro.

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { Lado } from './relacao';

export const DIFICULDADES = ['facil', 'normal', 'dificil', 'pesadelo'] as const;
export type Dificuldade = (typeof DIFICULDADES)[number];

export function ehDificuldade(v: unknown): v is Dificuldade {
  return typeof v === 'string' && (DIFICULDADES as readonly string[]).includes(v);
}

export interface RegrasDificuldade {
  vidaPct: number;
  danoPct: number;
  hesitacaoPct: number;
  avisoExtraMs: number;
  recompensaPct: number;
}

export interface RegrasGrupo {
  vidaPorJogadorPct: number;
  danoPorJogadorPct: number;
  recompensaPorJogadorPct: number;
  spawnerPorJogadorPct: number;
}

/** A equipe é do lado do jogador (há um personagem com bolsa nela)? */
export function equipeDoJogador(estado: EstadoJogo, equipe: string): boolean {
  return estado.entidades.some((e) => e.bolsa !== null && e.equipe === equipe);
}

export function ladoDoJogador(estado: EstadoJogo, lado: Pick<Lado, 'equipe'>): boolean {
  return equipeDoJogador(estado, lado.equipe);
}

/** Quantos personagens com bolsa estão na fase (o grupo da campanha cooperativa; 1 no solo). */
export function tamanhoDoGrupo(estado: EstadoJogo): number {
  return Math.max(1, estado.entidades.filter((e) => e.bolsa !== null).length);
}

export interface FatoresDoMundo {
  /** Multiplica o dano que o lado do jogador causa no resto (mais vida para os inimigos = menos dano efetivo). */
  danoContraInimigos: number;
  /** Multiplica o dano que o resto causa no lado do jogador. */
  danoContraJogador: number;
  hesitacao: number;
  avisoExtraMs: number;
  recompensa: number;
  spawner: number;
}

export const FATORES_NEUTROS: FatoresDoMundo = { danoContraInimigos: 1, danoContraJogador: 1, hesitacao: 1, avisoExtraMs: 0, recompensa: 1, spawner: 1 };

export function fatoresDoMundo(estado: EstadoJogo, ctx: Pick<ContextoSimulacao, 'balance'>): FatoresDoMundo {
  const d = ctx.balance.dificuldades[estado.dificuldade];
  const g = ctx.balance.grupo;
  const extras = tamanhoDoGrupo(estado) - 1;
  const vida = (d.vidaPct / 100) * (1 + (g.vidaPorJogadorPct / 100) * extras);
  return {
    danoContraInimigos: 1 / vida,
    danoContraJogador: (d.danoPct / 100) * (1 + (g.danoPorJogadorPct / 100) * extras),
    hesitacao: d.hesitacaoPct / 100,
    avisoExtraMs: d.avisoExtraMs,
    recompensa: (d.recompensaPct / 100) * (1 + (g.recompensaPorJogadorPct / 100) * extras),
    spawner: 1 + (g.spawnerPorJogadorPct / 100) * extras,
  };
}

/** Multiplicador do dano de um golpe, pelos lados de quem bate e de quem apanha. */
export function fatorDoGolpe(estado: EstadoJogo, ctx: Pick<ContextoSimulacao, 'balance'>, fonte: Pick<Lado, 'equipe'>, alvo: Pick<Lado, 'equipe'>): number {
  const deFonte = ladoDoJogador(estado, fonte);
  const deAlvo = ladoDoJogador(estado, alvo);
  if (deFonte === deAlvo) return 1;
  const f = fatoresDoMundo(estado, ctx);
  return deFonte ? f.danoContraInimigos : f.danoContraJogador;
}
