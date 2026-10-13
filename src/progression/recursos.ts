// Regeneração contínua de recurso (§2.12), etapa 4 do tick. A regeneração por célula caminhada
// entra com a progressão completa (10A).

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { ticksDe } from '../core/tempo';
import { vivo } from '../entities/entidade';

export function regenerarRecursos(estado: EstadoJogo, ctx: ContextoSimulacao): void {
  // Ao fim de cada segundo completo de simulação (nunca no tick 0).
  if ((estado.tick + 1) % ticksDe(1000) !== 0) return;
  const ganho = ctx.balance.recursos.regenManaPorSegundo;
  for (const e of estado.entidades) {
    if (vivo(e) && e.mana < e.manaMax) e.mana = Math.min(e.manaMax, e.mana + ganho);
  }
}
