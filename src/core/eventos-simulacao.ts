// Eventos que a simulação grava a cada tick. O adaptador de apresentação os publica no
// barramento (events.ts) depois do tick; a simulação nunca chama a interface.
// Eventos visuais não são autoridade sobre HP: o estado basta para reconstruir a tela (§3.6).

import type { EntidadeId } from './comandos';
import type { TipoObjeto } from './estado';
import type { TipoEfeito } from '../combat/registro-efeitos';
import type { Slot } from '../modos/modo';
import type { StatusCaminho } from '../world/navegacao';

export type MotivoRecusa =
  | 'sem_habilidade'
  | 'ocupado'
  | 'bloqueado'
  | 'recarga'
  | 'recurso'
  | 'sem_alvo'
  | 'fora_de_alcance'
  /** Marco 8A-2: limite de invocações ou armadilhas do modo, recusado antes de cobrar (§5.6). */
  | 'limite';

/** Recusas de mochila, equipamento e pontos (marco 6). */
export type MotivoItem =
  | 'sem_mochila'
  | 'nao_encontrado'
  | 'slot_invalido'
  | 'nivel_insuficiente'
  | 'mochila_cheia'
  | 'nao_consumivel'
  | 'sem_efeito'
  | 'sem_pontos'
  | 'atributo_no_maximo'
  /** Marco 9A: interação, loja e baú. */
  | 'nada_perto'
  | 'congelado'
  | 'em_recarga'
  | 'loja_fechada'
  | 'fora_do_estoque'
  | 'sem_ouro'
  | 'nao_vendavel'
  | 'trancado';

export type MotivoCancelamento = 'morte' | 'interrompido' | 'alvo_invalido' | 'substituido';

export type EventoSimulacao =
  | { t: 'moveu'; tick: number; id: EntidadeId; x: number; y: number }
  | { t: 'caminhoFalhou'; tick: number; id: EntidadeId; status: Exclude<StatusCaminho, 'alcancado'> }
  | {
      t: 'acaoIniciada';
      tick: number;
      acaoId: number;
      atorId: EntidadeId;
      habilidadeId: string;
      alvoId: EntidadeId | null;
      alvoX: number;
      alvoY: number;
      inicioTick: number;
      lancamentoTick: number;
      impactoPrevistoTick: number;
    }
  | { t: 'acaoRecusada'; tick: number; atorId: EntidadeId; habilidadeId: string; motivo: MotivoRecusa }
  | { t: 'acaoCancelada'; tick: number; acaoId: number; atorId: EntidadeId; motivo: MotivoCancelamento }
  | { t: 'projetilLancado'; tick: number; projetilId: number; acaoId: number; donoId: EntidadeId; habilidadeId: string }
  | { t: 'projetilFim'; tick: number; projetilId: number; motivo: 'acertou' | 'parede' | 'expirou' }
  | {
      t: 'impacto';
      tick: number;
      acaoId: number;
      fonteId: EntidadeId;
      alvoId: EntidadeId;
      habilidadeId: string;
      dano: number;
      cura: number;
      d20: number;
      mult: number;
      falha: boolean;
      critico: boolean;
      imune: boolean;
      /** Ordem do alvo no impacto em área, para escalonar os números (§2.7). */
      indice: number;
    }
  | { t: 'esquivou'; tick: number; acaoId: number; atorId: EntidadeId; alvoId: EntidadeId }
  | { t: 'efeitoAplicado'; tick: number; alvoId: EntidadeId; origemId: EntidadeId; tipo: TipoEfeito; ateTick: number }
  /** Marco 8A-2: invocação, dominação e armadilhas. */
  | { t: 'invocou'; tick: number; donoId: EntidadeId; id: EntidadeId }
  | { t: 'dominou'; tick: number; donoId: EntidadeId; id: EntidadeId }
  | { t: 'armadilhaArmada'; tick: number; donoId: EntidadeId; armadilhaId: number; x: number; y: number }
  | { t: 'armadilhaDisparou'; tick: number; donoId: EntidadeId; armadilhaId: number; alvoId: EntidadeId }
  /** Marco 8A: o que um efeito periódico ou instantâneo fez (números na tela). */
  | { t: 'efeitoResultado'; tick: number; alvoId: EntidadeId; origemId: EntidadeId; tipo: TipoEfeito; dano: number; cura: number; mana: number }
  | { t: 'morreu'; tick: number; id: EntidadeId; porId: EntidadeId | null }
  | { t: 'xpGanho'; tick: number; id: EntidadeId; xp: number }
  | { t: 'iaNotou'; tick: number; id: EntidadeId; alvoId: EntidadeId; hesitacaoAteTick: number }
  | { t: 'iaPerseguindo'; tick: number; id: EntidadeId; alvoId: EntidadeId }
  | { t: 'iaDesistiu'; tick: number; id: EntidadeId; alvoId: EntidadeId }
  | { t: 'objetoSurgiu'; tick: number; objetoId: string; tipo: TipoObjeto; x: number; y: number }
  | { t: 'coletou'; tick: number; id: EntidadeId; objetoId: string; tipo: TipoObjeto; ganho: number; itemId: string | null }
  | { t: 'equipou'; tick: number; id: EntidadeId; itemId: string; slot: Slot }
  | { t: 'usouItem'; tick: number; id: EntidadeId; itemId: string; hp: number; mana: number }
  | { t: 'itemRecusado'; tick: number; id: EntidadeId; motivo: MotivoItem }
  /** Marco 9A: baú e loja. `ateTick` é o fim do congelamento (anel de progresso, contagem da janela). */
  | { t: 'interacaoIniciada'; tick: number; id: EntidadeId; objetoId: string; tipo: 'bau' | 'loja'; ateTick: number }
  | { t: 'bauAberto'; tick: number; id: EntidadeId; objetoId: string; itens: string[]; ouro: number }
  | { t: 'lojaFechada'; tick: number; id: EntidadeId; objetoId: string; recargaAteTick: number }
  | { t: 'comprou'; tick: number; id: EntidadeId; itemId: string; preco: number }
  | { t: 'vendeu'; tick: number; id: EntidadeId; itemId: string; preco: number }
  /** Marco 10A-1: portas internas e porta de saída. */
  | { t: 'teleportou'; tick: number; id: EntidadeId; numero: number; x: number; y: number }
  | { t: 'saidaAlcancada'; tick: number; id: EntidadeId }
  | { t: 'saidaTrancada'; tick: number; id: EntidadeId; motivo: 'chave' | 'boss' }
  | { t: 'saidaDestrancada'; tick: number; motivo: 'chave' | 'boss'; x: number; y: number }
  | { t: 'subiuNivel'; tick: number; id: EntidadeId; nivel: number }
  | { t: 'reviveu'; tick: number; id: EntidadeId }
  | { t: 'surgiu'; tick: number; id: EntidadeId };

/** Mapa evento → payload para o `Barramento`. */
export type EventosDaSimulacao = { [E in EventoSimulacao as E['t']]: E };
