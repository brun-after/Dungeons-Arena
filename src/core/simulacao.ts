// `simular(dt)`: um tick da simulação (§2.2). Não toca DOM nem a camada gráfica e não sabe
// se está em rede. Recebe o contexto (fase e balanceamento) e os comandos do tick, e grava
// eventos numa lista de saída.
//
// Ordem por tick (§2.2). Marco 2 implementa as etapas 1 e 6; as outras entram nos marcos
// seguintes, cada uma no seu lugar desta sequência.
//   1. aplicar comandos        2. IA                 3. combate
//   4. efeitos                 5. congelamentos      6. movimento
//   7. gatilhos por célula     8. mortes e respawns  9. periódicos de 1 Hz e spawner

import type { ComandoDoTick } from './comandos';
import type { ContextoSimulacao } from './contexto';
import { buscarEntidade, type EstadoJogo } from './estado';
import type { EventoSimulacao } from './eventos-simulacao';
import { definirDirecao, moverEntidades, planejarCaminho } from '../world/movimento';

export type { EventoSimulacao } from './eventos-simulacao';

export function simular(
  estado: EstadoJogo,
  ctx: ContextoSimulacao,
  comandos: readonly ComandoDoTick[],
  saida: EventoSimulacao[],
  dtMs: number,
): void {
  aplicarComandos(estado, ctx, comandos, saida);
  moverEntidades(estado, ctx, saida, dtMs);
  estado.tick++;
}

function aplicarComandos(
  estado: EstadoJogo,
  ctx: ContextoSimulacao,
  comandos: readonly ComandoDoTick[],
  saida: EventoSimulacao[],
): void {
  for (const { entidadeId, cmd } of comandos) {
    const entidade = buscarEntidade(estado, entidadeId);
    if (!entidade || entidade.hp <= 0) continue;
    switch (cmd.t) {
      case 'mover':
        definirDirecao(entidade, cmd.dir);
        break;
      case 'irPara':
        planejarCaminho(entidade, { x: cmd.x, y: cmd.y }, ctx, estado.tick, saida);
        break;
      case 'ataqueBasico':
        saida.push({ t: 'ataqueSolicitado', tick: estado.tick, id: entidade.id });
        break;
      default:
        // Habilidades, itens e interação entram nos marcos 3 a 6.
        break;
    }
  }
}
