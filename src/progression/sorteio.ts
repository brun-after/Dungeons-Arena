// Sorteio de item por raridade (§2.10), usado pelos drops e pelo spawner (marco 9A-2, 14/10/2026).
// Pelo PRNG do estado: determinístico e reproduzível no harness.

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { aleatorio } from '../core/rng';
import { RARIDADES } from '../modos/modo';
import { dropaveisDe, type Item } from './itens';

/** Raridade por peso (o boss tem raridade mínima) e item uniforme entre os dessa raridade. */
export function sortearItem(estado: EstadoJogo, ctx: ContextoSimulacao, boss: boolean): Item | null {
  const d = ctx.balance.drops;
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
