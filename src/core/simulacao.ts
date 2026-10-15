// `simular(dt)`: um tick da simulação (§2.2). Não toca DOM nem a camada gráfica e não sabe
// se está em rede. Recebe o contexto (fase, conteúdo, modo e balanceamento) e os comandos do
// tick, e grava eventos numa lista de saída.
//
// Ordem por tick (§2.2). Marco 9A (14/10/2026): congelamentos de baú e loja (5) e, no 9A-2, o
// spawner dinâmico (9).
//   1. aplicar comandos        2. IA                 3. combate
//   4. efeitos e regeneração   5. congelamentos      6. movimento
//   7. gatilhos por célula     8. mortes e respawns  9. periódicos de 1 Hz e spawner

import { alvoOfensivoValido, iniciarAcao, processarAcoes, processarAutoAtaque } from '../combat/acao';
import { processarEfeitos, processarGatilhosDeEfeito } from '../combat/efeitos';
import { dispensarInvocacoes } from '../combat/invocacoes';
import { moverProjeteis } from '../combat/projeteis';
import { vivo } from '../entities/entidade';
import { processarIa } from '../entities/ia';
import { descansar } from '../progression/descanso';
import { desequipar, distribuirPonto, equipar, moverItem, usarItem } from '../progression/inventario';
import { ehDificuldade } from '../modos/dificuldade';
import { equiparHabilidade, subirRank } from '../progression/habilidades-personagem';
import { comprar, vender } from '../progression/loja';
import { processarMortes } from '../progression/morte';
import { regenerarRecursos } from '../progression/recursos';
import { definirDirecao, moverEntidades, planejarCaminho } from '../world/movimento';
import { fecharLoja, interagir, processarInteracoes } from '../world/interacao';
import { coletarObjetos } from '../world/objetos';
import { processarPortas } from '../world/portas';
import { processarSpawner } from '../world/spawner';
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
  processarInteracoes(estado, ctx, saida);
  moverEntidades(estado, ctx, saida, dtMs);
  // Gatilhos por célula alcançada (§2.3): portas antes da coleta e das armadilhas.
  processarPortas(estado, ctx, saida);
  coletarObjetos(estado, ctx, saida);
  processarGatilhosDeEfeito(estado, ctx, saida);
  processarMortes(estado, ctx, saida);
  processarSpawner(estado, ctx, saida);
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
      // Marco 9A (14/10/2026): baú, loja e ordenação da mochila.
      case 'interagir':
        interagir(estado, ctx, ator, saida);
        break;
      case 'comprar':
        comprar(estado, ctx, ator, cmd.itemId, saida);
        break;
      case 'vender':
        vender(estado, ctx, ator, cmd.invId, saida);
        break;
      case 'fecharLoja':
        fecharLoja(estado, ctx, ator, saida);
        break;
      case 'moverItem':
        moverItem(ator, cmd.invId, cmd.posicao, estado.tick, saida);
        break;
      // Marco 10A-2: descanso (§2.12).
      case 'descansar':
        descansar(estado, ctx, ator, cmd.tipo, saida);
        break;
      // Marco 10A-3: dispensa das invocações (§2.9).
      case 'dispensar':
        dispensarInvocacoes(estado, ator, saida);
        break;
      // Marco 14: ranks, caminhos e a barra de habilidades.
      case 'subirRank':
        subirRank(ator, ctx, cmd.id, cmd.caminho, estado.tick, saida);
        break;
      case 'equiparHabilidade':
        equiparHabilidade(ator, ctx, cmd.id, cmd.slot, estado.tick, saida);
        break;
      // Marco 15: dificuldade (só quem tem ficha de campanha; a arena nem decodifica o comando).
      case 'definirDificuldade':
        if (ator.bolsa && ehDificuldade(cmd.nivel) && estado.dificuldade !== cmd.nivel) {
          estado.dificuldade = cmd.nivel;
          saida.push({ t: 'dificuldadeMudou', tick: estado.tick, nivel: cmd.nivel });
        }
        break;
    }
  }
}
