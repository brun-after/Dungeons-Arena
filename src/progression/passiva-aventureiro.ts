// A passiva do Aventureiro e os pergaminhos de invocação (marco 27, 29/10/2026, D-126). Com o arremessável na mão
// principal, o Aventureiro compra pergaminhos mais baratos, acha mais deles, as invocações deles duram mais e o básico
// bate mais (combat/basico.ts). A arma dele na mão de outra classe dá só a duração extra. Os pergaminhos acumulam:
// cada um soma criaturas, do mesmo tipo ou não, até o teto próprio do modo. Números em balance.armas. Puro.

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { Entidade } from '../entities/entidade';
import { passivaAtiva, temEmprestimo } from './armas';
import type { Item } from './itens';

/** O pergaminho de invocação: um consumível que invoca alguém. */
export function ehPergaminho(item: Pick<Item, 'tipo' | 'efeitos'>): boolean {
  return item.tipo === 'consumivel' && item.efeitos.some((ef) => ef.tipo === 'invocar');
}

/** Quanto a mais duram as invocações de pergaminho de quem as chama (a passiva e a fração emprestada somam). */
export function duracaoDePergaminhoPct(ctx: ContextoSimulacao, e: Entidade): number {
  const a = ctx.balance.armas;
  return (passivaAtiva(ctx, e, 'pergaminhos') ? a.aventureiro.duracaoInvocacaoPct : 0) + (temEmprestimo(ctx, e, 'invocacaoDuracao') ? a.emprestimo.invocacaoDuracaoPct : 0);
}

/** O desconto na compra de pergaminhos na loja, em %. */
export function descontoDePergaminhoPct(ctx: ContextoSimulacao, e: Entidade): number {
  return passivaAtiva(ctx, e, 'pergaminhos') ? ctx.balance.armas.aventureiro.descontoPergaminhoPct : 0;
}

/** O peso extra dos pergaminhos nos drops de quem abate, em %. */
export function sorteDePergaminhoPct(ctx: ContextoSimulacao, e: Entidade | undefined): number {
  return e && passivaAtiva(ctx, e, 'pergaminhos') ? ctx.balance.armas.aventureiro.sortePergaminhoPct : 0;
}

/** Marca as invocações que o pergaminho acabou de chamar (as novas desde `antes`) e estende a duração delas. */
export function marcarPergaminhos(estado: EstadoJogo, ctx: ContextoSimulacao, dono: Entidade, antes: number): void {
  const pct = duracaoDePergaminhoPct(ctx, dono);
  for (const e of estado.entidades.slice(antes)) {
    const inv = e.invocacao;
    if (!inv || inv.donoId !== dono.id) continue;
    inv.pergaminho = true;
    if (pct > 0) inv.expiraTick += Math.round(((inv.expiraTick - estado.tick) * pct) / 100);
  }
}
