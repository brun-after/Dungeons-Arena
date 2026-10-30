// Os marcos do atributo de classe que agem numa morte (marco 28, 30/10/2026, D-127):
// - Ritual 100 (Necromante), Legião: o morto do Necromante que cai abre um solo amaldiçoado onde morreu;
// - Engenho 75 (Aventureiro), Faro do falcão: o abate do Aventureiro (ou do falcão dele) tem chance de render um
//   pergaminho comum direto na mochila.
// Números em `balance.dominio`. Puro.

import type { ContextoSimulacao } from '../core/contexto';
import { buscarEntidade, novoId, type EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { aleatorio } from '../core/rng';
import { vivo, type Entidade } from '../entities/entidade';
import { podeFerir } from '../modos/relacao';
import { marcoDe } from '../progression/dominio';
import { guardarItem } from '../progression/inventario';
import { ehPergaminho } from '../progression/passiva-aventureiro';
import { fonteDaHabilidade } from './acao';
import { resolverHabilidade } from './compilar-habilidade';
import { celulaOcupada } from './geometria';
import { lancarSolo } from './solos';

const SOLO = 'solo_amaldicoado';

export function marcosNaMorte(estado: EstadoJogo, ctx: ContextoSimulacao, morto: Entidade, quemAbateu: Entidade | undefined, saida: EventoSimulacao[]): void {
  legiao(estado, ctx, morto, saida);
  faroDoFalcao(estado, ctx, morto, quemAbateu, saida);
}

function legiao(estado: EstadoJogo, ctx: ContextoSimulacao, morto: Entidade, saida: EventoSimulacao[]): void {
  if (!morto.invocacao?.necromancia) return;
  const dono = buscarEntidade(estado, morto.invocacao.donoId);
  if (!dono || !vivo(dono) || marcoDe(ctx, dono, 'legiao') <= 0) return;
  const hab = resolverHabilidade(ctx, SOLO);
  if (!hab) return;
  const onde = celulaOcupada(morto);
  saida.push({ t: 'marcoDeClasse', tick: estado.tick, id: dono.id, marco: 'legiao', celulas: [onde] });
  lancarSolo(estado, dono, hab, novoId(estado), fonteDaHabilidade(dono, ctx, estado.tick, hab), null, onde, saida);
}

function faroDoFalcao(estado: EstadoJogo, ctx: ContextoSimulacao, morto: Entidade, quemAbateu: Entidade | undefined, saida: EventoSimulacao[]): void {
  if (!quemAbateu || morto.invocacao || morto.controlador !== 'ia') return;
  const dono = quemAbateu.invocacao?.companheiro ? buscarEntidade(estado, quemAbateu.invocacao.donoId) : quemAbateu;
  const chance = dono ? marcoDe(ctx, dono, 'faroChancePct') : 0;
  if (!dono?.bolsa || chance <= 0 || !podeFerir(dono, morto, ctx.modo) || aleatorio(estado.rng) * 100 >= chance) return;
  const comuns = [...ctx.conteudo.itens.values()].filter((i) => ehPergaminho(i) && i.raridade === 'comum').sort((a, b) => (a.id < b.id ? -1 : 1));
  const item = comuns[Math.floor(aleatorio(estado.rng) * comuns.length)];
  if (!item || !guardarItem(dono.bolsa, item, 1, ctx.balance.inventario)) return;
  saida.push({ t: 'marcoDeClasse', tick: estado.tick, id: dono.id, marco: 'faro', celulas: [celulaOcupada(dono)], itemId: item.id });
}
