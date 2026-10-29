import { processarAmbientes } from '../world/ambientes';
import { processarEnxame } from '../world/enxame';
import { processarPantanos } from '../combat/sequencias';
import { processarCampos } from '../combat/tatica';
// `simular(dt)`: um tick da simulação (§2.2). Não toca DOM nem a camada gráfica e não sabe
// se está em rede. Recebe o contexto (fase, conteúdo, modo e balanceamento) e os comandos do
// tick, e grava eventos numa lista de saída.
//
// Ordem por tick (§2.2). Marco 9A (14/10/2026): congelamentos de baú e loja (5) e, no 9A-2, o
// spawner dinâmico (9).
//   1. aplicar comandos        2. IA                 3. combate
//   4. efeitos e regeneração   5. congelamentos      6. movimento
//   7. gatilhos por célula     8. mortes e respawns  9. periódicos de 1 Hz e spawner

import { atualizarAparencias, processarBuffsArmados, usarRefugio } from '../progression/buffs';
import { alvoOfensivoValido, iniciarAcao, processarAcoes, processarAutoAtaque, usarUltimate } from '../combat/acao';
import { dispararArmadilhaEm, processarEfeitos, processarGatilhosDeEfeito } from '../combat/efeitos';
import { processarCarcereiros } from '../combat/sintonia-guerreiro';
import { processarMiras } from '../combat/sintonia-arqueiro';
import { processarSinergiasPassivas } from '../combat/sinergias-passivas';
import { dispararGanchosDosEventos } from '../progression/ganchos-do-portador';
import { dispensarInvocacoes } from '../combat/invocacoes';
import { moverProjeteis } from '../combat/projeteis';
import { vivo } from '../entities/entidade';
import { processarIa } from '../entities/ia';
import { desequipar, distribuirPonto, equipar, moverItem, usarItem } from '../progression/inventario';
import { ehDificuldade } from '../modos/dificuldade';
import { acelerarEstudo, avancarEstudos, equiparHabilidade, subirRank } from '../progression/habilidades-personagem';
import { definirPassiva } from '../progression/passivas-gerais';
import { comprar, vender } from '../progression/loja';
import { soltarItem } from '../progression/soltar-item';
import { processarMortes } from '../progression/morte';
import { regenerarRecursos } from '../progression/recursos';
import { definirDirecao, moverEntidades, planejarIrPara, rumoDe } from '../world/movimento';
import { aoMovimentoManual, processarSeguirAlvo } from '../combat/seguir-alvo';
import { fecharLoja, interagir, processarInteracoes } from '../world/interacao';
import { revelarArmadilhas } from '../world/armadilhas-ocultas';
import { atualizarRessonancias } from '../progression/ressonancias';
import { forjar } from '../progression/forja';
import { processarServosNecromantes } from '../combat/necromancia';
import { processarCompanheiros, sincronizarCompanheiros } from '../combat/companheiro';
import { processarEncarnacoes } from '../combat/encarnacao';
import { processarClima } from '../combat/clima';
import { processarMissoes } from '../progression/missoes';
import { registrarDescobertas } from '../progression/diario';
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
  // Marco 18: o que este tick emitir (missões e diário leem só os eventos dele).
  const inicio = saida.length;
  processarServosNecromantes(estado, ctx, saida);
  // Marco 22 (D-089): o falcão do Aventureiro.
  processarCompanheiros(estado, ctx, saida);
  aplicarComandos(estado, ctx, comandos, saida);
  processarIa(estado, ctx, saida);
  processarAcoes(estado, ctx, saida);
  moverProjeteis(estado, ctx, saida, dtMs);
  processarAutoAtaque(estado, ctx, saida);
  // Marco 26 (D-121): o personagem anda atrás do alvo selecionado (opção seguir alvo).
  processarSeguirAlvo(estado, ctx, saida);
  processarEfeitos(estado, ctx, saida);
  // Marco 22 (D-089): o Mago encarnado em fogo queima quem está perto.
  processarEncarnacoes(estado, ctx, saida);
  // Marco 24 (D-095): a vertente Carcereiro enraíza os desafiados que chegam perto.
  processarCarcereiros(estado, ctx, saida);
  // A do Arqueiro: a Mira invisível e o escudo da Sentinela.
  processarMiras(estado, ctx, saida);
  // Marco 24 (D-096): as sinergias passivas por tempo (Bastião de pedra).
  processarSinergiasPassivas(estado, ctx, saida);
  processarCampos(estado, ctx, saida);
  processarPantanos(estado, ctx, saida);
  regenerarRecursos(estado, ctx);
  processarInteracoes(estado, ctx, saida, (a, alvo) => { dispararArmadilhaEm(estado, ctx, a, alvo, saida); });
  // Marco 18 (D-068): a Sabedoria procura armadilhas; o estudo de habilidades anda com o jogo.
  revelarArmadilhas(estado, ctx, saida);
  avancarEstudos(estado, ctx, saida);
  moverEntidades(estado, ctx, saida, dtMs);
  // Gatilhos por célula alcançada (§2.3): portas antes da coleta e das armadilhas.
  processarPortas(estado, ctx, saida);
  coletarObjetos(estado, ctx, saida);
  // Ajuste de 16/10/2026 (D-067): buffs armados começam em combate; a aparência segue o equipamento.
  processarBuffsArmados(estado, ctx, saida);
  atualizarAparencias(estado, ctx);
  atualizarRessonancias(estado, ctx, saida);
  processarAmbientes(estado, ctx, saida, inicio);
  // Marco 23 (D-092): o pulso do clima da fase de tema elemental.
  processarClima(estado, ctx, saida);
  processarGatilhosDeEfeito(estado, ctx, saida);
  // Marco 22: o dano que o falcão levou sai da vida do dono antes das mortes.
  sincronizarCompanheiros(estado, ctx);
  const abates = processarMortes(estado, ctx, saida);
  // Marco 18 (D-070): missões e o diário de descobertas.
  processarMissoes(estado, ctx, saida.slice(inicio), abates, saida);
  registrarDescobertas(estado, ctx, saida.slice(inicio), saida);
  // Marco 24 (D-096): os ganchos da ultimate e do combo (ressonâncias Gladiador, Maestro, Eco ancestral…).
  dispararGanchosDosEventos(estado, ctx, saida.slice(inicio), saida);
  processarEnxame(estado, ctx);
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
        // Marco 26 (D-121): o direcional diante do seguir alvo (contrário cancela, o resto pausa).
        if (cmd.dir !== 'parado') aoMovimentoManual(estado, ator, cmd.dx !== undefined && cmd.dy !== undefined ? { dx: cmd.dx, dy: cmd.dy } : rumoDe(cmd.dir), ctx.balance.seguirAlvo.anguloCancelaGraus);
        definirDirecao(ator, cmd.dir, cmd.dx, cmd.dy);
        break;
      case 'irPara':
        aoMovimentoManual(estado, ator, null, ctx.balance.seguirAlvo.anguloCancelaGraus);
        planejarIrPara(ator, { x: cmd.x, y: cmd.y }, ctx, estado.tick, saida);
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
        // Marco 26 (D-121): escolher um alvo de propósito desfaz o cancelamento do seguir alvo.
        delete ator.seguirCanceladoDe;
        ator.alvoTravado = ator.alvoSelecionado !== null && cmd.travar !== false;
        // Marco 24 (D-097): escolher um alvo de propósito religa o básico (que o Parar ataque desliga).
        if (ator.alvoTravado) ator.autoAtaque = true;
        break;
      }
      case 'autoAtaque':
        ator.autoAtaque = cmd.ligado;
        break;
      case 'seguirAlvo':
        ator.seguirAlvo = cmd.ligado;
        if (!cmd.ligado) delete ator.seguindo;
        break;
      case 'ativarPassiva':
      case 'desativarPassiva':
        definirPassiva(estado, ctx, ator, cmd.id, cmd.t === 'ativarPassiva', saida);
        break;
      case 'usarUltimate':
        usarUltimate(estado, ctx, ator, cmd.alvo, saida);
        break;
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
      case 'soltarItem':
        soltarItem(estado, ctx, ator, cmd.invId, cmd.qtd, saida);
        break;
      case 'distribuirPonto':
        distribuirPonto(ator, ctx, cmd.atributo, estado.tick, saida);
        break;
      // Marco 9A (14/10/2026): baú, loja e ordenação da mochila.
      case 'abrirMenu':
        usarRefugio(estado, ctx, ator, saida);
        break;
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
      // Marco 10A-3: dispensa das invocações (§2.9).
      case 'dispensar':
        dispensarInvocacoes(estado, ator, saida);
        break;
      // Marco 14: ranks, caminhos e a barra de habilidades.
      case 'subirRank':
        subirRank(ator, ctx, cmd.id, cmd.caminho, estado.tick, saida, cmd.invId, cmd.rankEsperado);
        break;
      case 'acelerarEstudo':
        acelerarEstudo(ator, ctx, estado.tick, saida);
        break;
      case 'forjar':
        forjar(estado, ctx, ator, cmd.receita, cmd.invId ?? null, saida);
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
