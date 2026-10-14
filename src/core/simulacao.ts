// `simular(dt)`: um tick da simulação (§2.2). Não toca DOM nem a camada gráfica e não sabe
// se está em rede. Recebe o contexto (fase, conteúdo, modo e balanceamento) e os comandos do
// tick, e grava eventos numa lista de saída.
//
// Ordem por tick (§2.2). Congelamentos (5) e periódicos de 1 Hz (9) entram com baús, lojas e
// armadilhas; dos gatilhos por célula (7), por enquanto só a coleta de objetos.
//   1. aplicar comandos        2. IA                 3. combate
//   4. efeitos e regeneração   5. congelamentos      6. movimento
//   7. gatilhos por célula     8. mortes e respawns  9. periódicos de 1 Hz e spawner

import { alvoOfensivoValido, iniciarAcao, processarAcoes, processarAutoAtaque } from '../combat/acao';
import { processarEfeitos, processarGatilhosDeEfeito } from '../combat/efeitos';
import { moverProjeteis } from '../combat/projeteis';
import { vivo } from '../entities/entidade';
import { processarIa } from '../entities/ia';
import { desequipar, distribuirPonto, equipar, usarItem } from '../progression/inventario';
import { processarMortes } from '../progression/morte';
import { regenerarRecursos } from '../progression/recursos';
import { definirDirecao, moverEntidades, planejarCaminho } from '../world/movimento';
import { coletarObjetos } from '../world/objetos';
import type { ComandoDoTick } from './comandos';
import type { ContextoSimulacao } from './contexto';
import { buscarEntidade, type EstadoJogo } from './estado';
import type { EventoSimulacao } from './eventos-simulacao';

export type { EventoSimulacao } from './eventos-simulacao';

export function simular(
  estado: EstadoJogo,
  ctx: ContextoSimulacao,
  comandos: readonly ComandoDoTick[],
  saida: EventoSimulacao[],
  dtMs: number,
): void {
  aplicarComandos(estado, ctx, comandos, saida);
  processarIa(estado, ctx, saida);
  processarAcoes(estado, ctx, saida);
  moverProjeteis(estado, ctx, saida, dtMs);
  processarAutoAtaque(estado, ctx, saida);
  processarEfeitos(estado, ctx, saida);
  regenerarRecursos(estado, ctx);
  moverEntidades(estado, ctx, saida, dtMs);
  coletarObjetos(estado, ctx, saida);
  processarGatilhosDeEfeito(estado, ctx, saida);
  processarMortes(estado, ctx, saida);
  estado.tick++;
}

function aplicarComandos(
  estado: EstadoJogo,
  ctx: ContextoSimulacao,
  comandos: readonly ComandoDoTick[],
  saida: EventoSimulacao[],
): void {
  for (const { entidadeId, cmd } of comandos) {
    const ator = buscarEntidade(estado, entidadeId);
    if (!ator || !vivo(ator)) continue;
    switch (cmd.t) {
      case 'mover':
        definirDirecao(ator, cmd.dir);
        break;
      case 'irPara':
        planejarCaminho(ator, { x: cmd.x, y: cmd.y }, ctx, estado.tick, saida);
        break;
      case 'ataqueBasico':
        iniciarAcao(estado, ctx, ator, ator.ataqueBasico, cmd.alvo, saida);
        break;
      case 'usarHabilidade':
        iniciarAcao(estado, ctx, ator, cmd.id, cmd.alvo, saida);
        break;
      case 'selecionarAlvo': {
        const alvo = cmd.alvo === null ? undefined : buscarEntidade(estado, cmd.alvo);
        ator.alvoSelecionado = alvo && alvoOfensivoValido(estado, ctx, ator, alvo) ? alvo.id : null;
        break;
      }
      // Marco 6 (13/10/2026): mochila, equipamento e pontos de atributo.
      case 'equipar':
        equipar(ator, ctx, cmd.invId, cmd.slot, estado.tick, saida);
        break;
      case 'desequipar':
        desequipar(ator, ctx, cmd.slot, estado.tick, saida);
        break;
      case 'usarItem':
        usarItem(estado, ator, ctx, cmd.invId, saida);
        break;
      case 'distribuirPonto':
        distribuirPonto(ator, ctx, cmd.atributo, estado.tick, saida);
        break;
      case 'interagir':
        // Baús, lojas e portas entram no 9A.
        break;
    }
  }
}
