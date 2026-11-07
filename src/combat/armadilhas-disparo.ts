// O disparo das armadilhas (06/11/2026, D-135). Toda armadilha fere o valor dela mais uma parte da vida atual de quem
// pisou e puxa a vítima na direção do hostil a ela mais perto: o jogador cai perto do inimigo; o inimigo atraído cai
// perto do jogador. A de explosão (sem elemento) ainda atordoa um instante; a elemental aplica o estado do elemento.
// O Passo leve (orbe) gasta-se na próxima armadilha, de fase ou de monstro: ela some sem ferir. As runas do
// armadilheiro (entities/ia-especiais.ts) ficam de pé e à vista e levam o elemento da afinidade dele. Puro.

import type { ContextoSimulacao } from '../core/contexto';
import type { Armadilha, EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { vivo, type Entidade } from '../entities/entidade';
import { podeFerir } from '../modos/relacao';
import { passivosDe } from '../progression/ganchos-do-portador';
import type { Elemento } from './elementos';
import { puxar } from './efeitos-instantaneos';
import { celulaOcupada, chebyshev } from './geometria';
import { construirEfeito, REGISTRO_EFEITOS, type EfeitoCanonico } from './registro-efeitos';

/** Quem pisou tem o Passo leve ativo? Se tem, gasta (a armadilha some sem ferir). */
export function gastarPassoLeve(estado: EstadoJogo, alvo: Entidade): boolean {
  const i = alvo.efeitos.findIndex((f) => f.ateTick > estado.tick && REGISTRO_EFEITOS[f.tipo].protegeDeArmadilha);
  if (i < 0) return false;
  alvo.efeitos.splice(i, 1);
  return true;
}

/** O valor da armadilha mais `vidaAtualPct` da vida atual de quem pisou (menos nos chefes). */
export function danoDaArmadilha(ctx: ContextoSimulacao, a: Armadilha, alvo: Entidade): number {
  const r = ctx.balance.armadilhas;
  const pct = r.semPctArquetipos.includes(alvo.arquetipo) ? 0 : r.vidaAtualPct;
  return a.valor + (Math.max(0, alvo.hp) * pct) / 100;
}

/** O estado do elemento (o que a armadilha elemental aplica) ou, na de explosão, o atordoamento curto. */
export function efeitoDoDisparo(ctx: ContextoSimulacao, a: Armadilha): EfeitoCanonico | null {
  if (a.elemento) {
    const estado = ctx.conteudo.elementos.get(a.elemento)?.estado;
    return estado && estado.duracaoMs > 0 ? { ...estado, interno: null } : null;
  }
  const ms = ctx.balance.armadilhas.explosaoAtordoarMs;
  return ms > 0 ? construirEfeito('atordoar', { duracaoMs: ms }) : null;
}

/** O hostil a `alvo` mais perto dele, até `puxaoRaio` (empate pelo id). */
function hostilMaisPerto(estado: EstadoJogo, ctx: ContextoSimulacao, alvo: Entidade): Entidade | null {
  const raio = ctx.balance.armadilhas.puxaoRaio;
  const origem = celulaOcupada(alvo);
  let melhor: Entidade | null = null;
  let melhorD = Infinity;
  for (const e of estado.entidades) {
    if (e === alvo || !vivo(e) || e.invocacao?.companheiro || !podeFerir(e, alvo, ctx.modo)) continue;
    const d = chebyshev(origem, celulaOcupada(e));
    if (d > raio || d <= 1) continue;
    if (d < melhorD || (d === melhorD && melhor && e.id < melhor.id)) {
      melhor = e;
      melhorD = d;
    }
  }
  return melhor;
}

/** O puxão do disparo: a vítima vai até `puxaoCelulas` na direção do hostil mais perto (o inamovível fica). */
export function puxarAoHostil(estado: EstadoJogo, ctx: ContextoSimulacao, alvo: Entidade, origemId: string, saida: EventoSimulacao[]): void {
  if (!vivo(alvo) || passivosDe(ctx, alvo).inamovivel) return;
  const hostil = hostilMaisPerto(estado, ctx, alvo);
  if (!hostil) return;
  const { x, y } = alvo;
  if (!puxar(estado, ctx, alvo, celulaOcupada(hostil), ctx.balance.armadilhas.puxaoCelulas)) return;
  saida.push({ t: 'deslocado', tick: estado.tick, id: alvo.id, deX: x, deY: y, paraX: alvo.x, paraY: alvo.y, origemId, causa: 'arremesso' });
}

/** As armadilhas de quem planta runas ficam de pé, à vista, com o elemento da afinidade (sem afinidade: explosão). */
export function estiloDaArmadilha(ctx: ContextoSimulacao, dono: Entidade): { runa: boolean; elemento: Elemento | undefined } {
  const runa = ctx.conteudo.presets.get(dono.preset)?.comportamento === 'armadilheiro';
  return { runa, elemento: runa ? dono.afinidade?.elemento : undefined };
}
