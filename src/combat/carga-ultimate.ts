// Medidor da ultimate (marco 24, 24/10/2026, D-094). Enche com golpes que acertam, curas, combos e abates, mais o jeito
// de cada classe (a passiva da classe em classes.json diz quanto cada momento dá). Cheio, a ultimate pode sair; usar
// zera. Só jogadores (com ficha ou classe) têm medidor. Números em balance.ultimate.

import type { ContextoSimulacao, MomentoCargaClasse } from '../core/contexto';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import type { Entidade } from '../entities/entidade';
import { passivosDe } from '../progression/ganchos-do-portador';

/** Momentos que enchem o medidor, com o ganho base em balance.ultimate.ganhos. */
export type MomentoCarga = 'habilidade' | 'basico' | 'cura' | 'abate' | 'combo';

export function temMedidor(e: Entidade): boolean {
  return !e.invocacao && e.controlador !== 'ia' && (e.bolsa !== null || !!e.classeId);
}

export function cargaDe(e: Entidade): number {
  return e.cargaUltimate ?? 0;
}

export function medidorCheio(ctx: ContextoSimulacao, e: Entidade): boolean {
  return cargaDe(e) >= ctx.balance.ultimate.max;
}

/**
 * Soma ao medidor (até o máximo); avisa quando enche. Marco 24 (D-096): as ressonâncias Oráculo (mais rápido) e
 * Sobrevivente (mais ainda com pouca vida) multiplicam o ganho.
 */
export function somarCarga(ctx: ContextoSimulacao, e: Entidade, valor: number, tick: number, saida: EventoSimulacao[]): void {
  if (!temMedidor(e) || valor <= 0) return;
  const max = ctx.balance.ultimate.max;
  const antes = cargaDe(e);
  if (antes >= max) return;
  const p = passivosDe(ctx, e);
  const vidaBaixa = e.hp * 100 < e.hpMax * ctx.balance.ultimate.vidaBaixaPct;
  const ganho = valor * (1 + p.cargaUltimatePct / 100) * (vidaBaixa ? 1 + p.cargaVidaBaixaPct / 100 : 1);
  e.cargaUltimate = Math.min(max, antes + ganho);
  if (e.cargaUltimate >= max) saida.push({ t: 'ultimateCheia', tick, id: e.id });
}

/** O ganho de um momento comum (golpe, cura, abate, combo). */
export function cargaPorMomento(ctx: ContextoSimulacao, e: Entidade, momento: MomentoCarga, tick: number, saida: EventoSimulacao[]): void {
  somarCarga(ctx, e, ctx.balance.ultimate.ganhos[momento], tick, saida);
}

/**
 * O ganho do jeito da classe (fúria cheia, troca de encarnação, tiro da Mira firme, morto que cai lutando, acerto do
 * falcão), com o intervalo mínimo do balance entre dois ganhos do mesmo momento.
 */
export function cargaDaClasse(ctx: ContextoSimulacao, e: Entidade, momento: MomentoCargaClasse, tick: number, saida: EventoSimulacao[]): void {
  if (!temMedidor(e)) return;
  const regra = ctx.balance.ultimate.classe[momento];
  const ultimo = e.cargaClasseTick?.[momento];
  if (ultimo !== undefined && tick - ultimo < ticksDe(regra.intervaloMs)) return;
  e.cargaClasseTick = { ...e.cargaClasseTick, [momento]: tick };
  somarCarga(ctx, e, regra.valor, tick, saida);
}

// Marco 40 (D-160): a ultimate do par fica em ultimate-do-par.ts (sem o medidor, para a runa e os fios consultarem).
export { parDaUltimate, ultimateDe } from './ultimate-do-par';
