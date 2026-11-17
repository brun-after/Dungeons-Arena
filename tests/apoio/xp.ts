// 16/11/2026 (D-184): o XP do abate fica no chão como a luz do dono. Nos testes da conta do XP, o dono recolhe as
// luzes dele como se tivesse chegado perto (a coleta de verdade tem o próprio teste em orbe-xp.test.ts).
import type { ContextoSimulacao } from '../../src/core/contexto';
import type { EstadoJogo } from '../../src/core/estado';
import { concederXpDeProgressao } from '../../src/progression/nivel';

export function recolherXp(estado: EstadoJogo, ctx: ContextoSimulacao): void {
  for (const o of estado.objetos) {
    if (o.tipo !== 'orbe_xp') continue;
    const dono = estado.entidades.find((e) => e.id === o.ref);
    if (dono) concederXpDeProgressao(dono, ctx, o.valor, estado.tick, []);
  }
  estado.objetos = estado.objetos.filter((o) => o.tipo !== 'orbe_xp');
}
