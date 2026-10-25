// Medidor da ultimate (marco 24, 24/10/2026, D-094). Enche com golpes que acertam, curas, combos e abates, mais o jeito
// de cada classe (a passiva da classe em classes.json diz quanto cada momento dá). Cheio, a ultimate pode sair; usar
// zera. Só jogadores (com ficha ou classe) têm medidor. Números em balance.ultimate.

import type { ContextoSimulacao, MomentoCargaClasse } from '../core/contexto';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import { SLOTS_CLASSE, type Entidade } from '../entities/entidade';
import { ultimateDoPar, type Ultimate } from './ultimates';

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

/** Soma ao medidor (até o máximo); avisa quando enche. */
export function somarCarga(ctx: ContextoSimulacao, e: Entidade, valor: number, tick: number, saida: EventoSimulacao[]): void {
  if (!temMedidor(e) || valor <= 0) return;
  const max = ctx.balance.ultimate.max;
  const antes = cargaDe(e);
  if (antes >= max) return;
  e.cargaUltimate = Math.min(max, antes + valor);
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

/** A ultimate do par nas teclas 1 e 2 (sem bolsa, como na arena, as duas primeiras habilidades); null sem par. */
export function ultimateDe(ctx: Pick<ContextoSimulacao, 'conteudo'>, e: Entidade): Ultimate | null {
  const [a, b] = e.bolsa ? e.bolsa.barra.slice(0, SLOTS_CLASSE) : e.habilidades.slice(0, SLOTS_CLASSE);
  return a && b ? ultimateDoPar(ctx.conteudo.ultimates, a, b) : null;
}
