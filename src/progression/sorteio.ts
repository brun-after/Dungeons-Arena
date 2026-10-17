// Sorteio de item por raridade (§2.10), usado pelos drops e pelo spawner (marco 9A-2, 14/10/2026).
// Pelo PRNG do estado: determinístico e reproduzível no harness.

import { formaMinimaDe, sortearItemBase } from './gerar-item-base';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { aleatorio } from '../core/rng';
import { RARIDADES } from '../modos/modo';
import { dropaveisDe, type Item } from './itens';

/** Raridade por peso (o boss tem raridade mínima) e item uniforme entre os dessa raridade. */
/**
 * Marco 18 (D-069): a parte gerada sai dos itens base com forma (base, forma e, às vezes, elemento).
 * Marco 17 (D-063): parte dos drops de equipamento é gerada no nível de quem caiu (`chanceGerado`), com as raridades
 * altas mais prováveis quanto maior o nível; o resto vem do catálogo fixo, como antes.
 */
export function sortearItem(estado: EstadoJogo, ctx: ContextoSimulacao, boss: boolean, nivel = 1): Item | null {
  const d = ctx.balance.drops;
  const g = ctx.balance.itensGerados;
  if (aleatorio(estado.rng) < g.chanceGerado) {
    // Marco 18 (D-069): o equipamento gerado agora é dos itens base com forma (os `gi_` antigos só resolvem).
    const id = sortearItemBase(estado.rng, nivel, ctx.conteudo.itensComFormas, g, g.chanceElemental, formaMinimaDe(boss ? d.raridadeMinBoss : 'comum'));
    const gerado = id ? ctx.conteudo.itens.get(id) : undefined;
    if (gerado) return gerado;
  }
  const candidatas = RARIDADES.slice(boss ? RARIDADES.indexOf(d.raridadeMinBoss) : 0);
  const total = candidatas.reduce((s, r) => s + d.pesoRaridade[r], 0);
  if (total <= 0) return null;
  let sorteio = aleatorio(estado.rng) * total;
  let indice = 0;
  for (const [i, r] of candidatas.entries()) {
    indice = i;
    sorteio -= d.pesoRaridade[r];
    if (sorteio < 0) break;
  }
  // Sem item da raridade sorteada no catálogo, desce até achar.
  for (let i = indice; i >= 0; i--) {
    const raridade = candidatas[i];
    const pool = raridade ? dropaveisDe(ctx.conteudo.itens, raridade) : [];
    if (pool.length > 0) return pool[Math.floor(aleatorio(estado.rng) * pool.length)] ?? null;
  }
  return null;
}
