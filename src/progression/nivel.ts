// Subida de nível (§2.12). Marco 6 (13/10/2026). Em laço, preservando o XP excedente: cada nível
// dá pontos de atributo e o aumento automático de HP base; a ficha é recalculada no fim.

import type { Balance, ContextoSimulacao } from '../core/contexto';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import type { Entidade } from '../entities/entidade';
import { recalcularFicha } from './derivados';

/** XP para passar do nível `nivel` ao seguinte: tabela configurável, com fallback `nivel × 100`. */
export function xpParaProximo(nivel: number, xp: Balance['xp']): number {
  return xp.tabela[nivel - 1] ?? nivel * xp.fallbackPorNivel;
}

export function aplicarSubidas(e: Entidade, ctx: ContextoSimulacao, tick: number, saida: EventoSimulacao[]): void {
  if (!e.bolsa) return;
  const regras = ctx.balance.xp;
  let subiu = false;
  while (e.nivel < regras.nivelMax && e.xp >= xpParaProximo(e.nivel, regras)) {
    e.xp -= xpParaProximo(e.nivel, regras);
    e.nivel++;
    e.bolsa.pontosAtributo += regras.pontosPorNivel;
    subiu = true;
    saida.push({ t: 'subiuNivel', tick, id: e.id, nivel: e.nivel });
  }
  if (subiu) recalcularFicha(e, ctx);
}
