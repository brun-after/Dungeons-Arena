// Armadilhas ocultas e a Sabedoria (marco 18, 17/10/2026, D-068). As armadilhas alheias são invisíveis; a cada
// `balance.armadilhas.revelarIntervaloMs`, quem tem ficha testa (pelo RNG da simulação) as que estão no raio da
// Sabedoria e, se passar, passa a vê-la (`reveladaPara`). Uma armadilha revelada pode ser desarmada com `interagir`:
// leva `desarmeMs` parado e, no fim, a Sabedoria decide — sucesso tira a armadilha e dá um pouco de XP; falha a dispara.
// O modo decide se vale (`sobrevivencia.revelarArmadilhas`; a arena não mostra armadilhas a ninguém).

import { celulaOcupada, chebyshev } from '../combat/geometria';
import type { ContextoSimulacao } from '../core/contexto';
import type { Armadilha, EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { aleatorio } from '../core/rng';
import { ticksDe } from '../core/tempo';
import { vivo, type Entidade } from '../entities/entidade';
import { revelaArmadilhas } from '../modos/regras';
import { podeFerir } from '../modos/relacao';
import { chanceDeDesarmarPct, chanceDeRevelarPct, raioDeRevelar } from '../progression/efeitos-atributo';
import { aplicarSubidas } from '../progression/nivel';
import { passivosDe } from '../progression/ganchos-do-portador';

/** A armadilha é perigosa para `e` (do dono hostil) — só essas contam para revelar e desarmar. */
function ameaca(ctx: ContextoSimulacao, a: Armadilha, e: Entidade): boolean {
  return a.donoId !== e.id && podeFerir({ id: a.donoId, equipe: a.equipeDono }, e, ctx.modo);
}

/** Etapa do tick: os testes de Sabedoria para revelar armadilhas próximas. */
export function revelarArmadilhas(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  if (estado.armadilhas.length === 0 || !revelaArmadilhas(ctx.modo)) return;
  const intervalo = Math.max(1, ticksDe(ctx.balance.armadilhas.revelarIntervaloMs));
  if (estado.tick % intervalo !== 0) return;
  for (const e of estado.entidades) {
    if (!e.bolsa || !vivo(e)) continue;
    const raio = raioDeRevelar(e.atributos, ctx.balance);
    // Marco 18 (D-069): o Elmo Lendário revela mais.
    const chance = Math.min(1, (chanceDeRevelarPct(e.atributos, ctx.balance) * (1 + passivosDe(ctx, e).revelarPct / 100)) / 100);
    const origem = celulaOcupada(e);
    for (const a of estado.armadilhas) {
      if (a.reveladaPara.includes(e.id) || chebyshev(origem, a) > raio || !ameaca(ctx, a, e)) continue;
      if (aleatorio(estado.rng) >= chance) continue;
      a.reveladaPara.push(e.id);
      saida.push({ t: 'armadilhaRevelada', tick: estado.tick, id: e.id, armadilhaId: a.id, x: a.x, y: a.y });
    }
  }
}

/** A armadilha revelada (para `e`) mais próxima no alcance de interação; empate pelo id. */
export function armadilhaParaDesarmar(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade): Armadilha | null {
  if (!revelaArmadilhas(ctx.modo)) return null;
  const origem = celulaOcupada(e);
  let melhor: Armadilha | null = null;
  let melhorDist = Infinity;
  for (const a of estado.armadilhas) {
    if (!a.reveladaPara.includes(e.id) || !ameaca(ctx, a, e)) continue;
    const d = chebyshev(origem, a);
    if (d > ctx.balance.economia.alcanceInteracao) continue;
    if (d < melhorDist || (d === melhorDist && melhor && a.id < melhor.id)) {
      melhor = a;
      melhorDist = d;
    }
  }
  return melhor;
}

/** Fim do desarme: a Sabedoria decide. Sucesso tira a armadilha (e dá XP); falha a dispara em quem tentou. */
export function concluirDesarme(
  estado: EstadoJogo,
  ctx: ContextoSimulacao,
  e: Entidade,
  armadilhaId: number,
  disparar: (a: Armadilha, alvo: Entidade) => void,
  saida: EventoSimulacao[],
): void {
  e.interacao = null;
  const a = estado.armadilhas.find((x) => x.id === armadilhaId);
  if (!a || !vivo(e)) return;
  const sucesso = aleatorio(estado.rng) < Math.min(0.99, (chanceDeDesarmarPct(e.atributos, ctx.balance) + passivosDe(ctx, e).desarmarPct) / 100);
  saida.push({ t: 'armadilhaDesarmada', tick: estado.tick, id: e.id, armadilhaId: a.id, sucesso });
  if (!sucesso) {
    disparar(a, e);
    return;
  }
  estado.armadilhas = estado.armadilhas.filter((x) => x.id !== a.id);
  const xp = ctx.balance.armadilhas.xpDesarme;
  if (xp > 0) {
    e.xp += xp;
    saida.push({ t: 'xpGanho', tick: estado.tick, id: e.id, xp });
    aplicarSubidas(e, ctx, estado.tick, saida);
  }
}
