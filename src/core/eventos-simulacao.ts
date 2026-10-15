// Eventos que a simulação grava a cada tick. O adaptador de apresentação os publica no
// barramento (events.ts) depois do tick; a simulação nunca chama a interface.
// Eventos visuais não são autoridade sobre HP: o estado basta para reconstruir a tela (§3.6).

import type { Dificuldade } from '../modos/dificuldade';
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
  | 'trancado'
  /** Marco 10A-2: descanso com hostil perseguindo, ou num modo sem descanso. */
  | 'em_perigo'
  | 'sem_descanso'
  /** Marco 10A-3: pergaminho de invocação acima do limite do modo (recusado antes de gastar). */
  | 'limite'
  /** Marco 14: livro de uma habilidade que o personagem já conhece. */
  | 'ja_conhece';

/** Marco 14: por que a habilidade não subiu de rank ou não foi para a barra. */
export type MotivoHabilidade =
  | 'sem_ficha'
  | 'desconhecida'
  | 'nao_aprendivel'
  | 'rank_maximo'
  | 'sem_pontos'
  | 'nivel_baixo'
  | 'caminho_invalido'
  | 'tecla_invalida'
  | 'passiva';

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
      chave: string;
      alvoId: EntidadeId | null;
      alvoX: number;
      alvoY: number;
      inicioTick: number;
      lancamentoTick: number;
      impactoPrevistoTick: number;
    }
  | { t: 'acaoRecusada'; tick: number; atorId: EntidadeId; habilidadeId: string; motivo: MotivoRecusa }
  | { t: 'acaoCancelada'; tick: number; acaoId: number; atorId: EntidadeId; motivo: MotivoCancelamento }
  | { t: 'projetilLancado'; tick: number; projetilId: number; acaoId: number; donoId: EntidadeId; habilidadeId: string; chave: string }
  | { t: 'projetilFim'; tick: number; projetilId: number; motivo: 'acertou' | 'parede' | 'expirou' }
  | {
      t: 'impacto';
      tick: number;
      acaoId: number;
      fonteId: EntidadeId;
      alvoId: EntidadeId;
      habilidadeId: string;
      /** Marco 14: a chave compilada (o visual escala com o rank). */
      chave: string;
      dano: number;
      cura: number;
      d20: number;
      mult: number;
      falha: boolean;
      critico: boolean;
      imune: boolean;
      /** Ordem do alvo no impacto em área, para escalonar os números (§2.7). */
      indice: number;
      /** Marco 14: sinergias de elemento disparadas neste golpe (ids de interacoes.json). */
      sinergias: string[];
    }
  | { t: 'esquivou'; tick: number; acaoId: number; atorId: EntidadeId; alvoId: EntidadeId }
  /** Marco 14: habilidade aprendida ou com rank novo (e o caminho escolhido, nos ranks de evolução). */
  | { t: 'habilidadeMudou'; tick: number; id: EntidadeId; habilidadeId: string; rank: number; caminho: string | null }
  | { t: 'habilidadeRecusada'; tick: number; id: EntidadeId; habilidadeId: string; motivo: MotivoHabilidade }
  | { t: 'barraMudou'; tick: number; id: EntidadeId }
  /** Marco 15: a dificuldade do mundo mudou. */
  | { t: 'dificuldadeMudou'; tick: number; nivel: Dificuldade }
  | { t: 'efeitoAplicado'; tick: number; alvoId: EntidadeId; origemId: EntidadeId; tipo: TipoEfeito; ateTick: number }
  /** Marco 8A-2: invocação, dominação e armadilhas. */
  | { t: 'invocou'; tick: number; donoId: EntidadeId; id: EntidadeId }
  | { t: 'dominou'; tick: number; donoId: EntidadeId; id: EntidadeId }
  /** Marco 10A-3: cura do curador, explosão da isca e dispensa. */
  | { t: 'invocacaoCurou'; tick: number; id: EntidadeId; donoId: EntidadeId; cura: number }
  | { t: 'explodiu'; tick: number; id: EntidadeId; x: number; y: number; raio: number }
  | { t: 'dispensou'; tick: number; id: EntidadeId; quantidade: number }
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
  | { t: 'interacaoIniciada'; tick: number; id: EntidadeId; objetoId: string; tipo: 'bau' | 'loja' | 'descanso'; ateTick: number }
  /** Marco 10A-2: descanso e penalidade de morte (§2.12). */
  | { t: 'descansou'; tick: number; id: EntidadeId; tipo: 'curto' | 'longo'; hp: number; mana: number }
  | { t: 'descansoInterrompido'; tick: number; id: EntidadeId }
  | { t: 'penalidadeMorte'; tick: number; id: EntidadeId; xp: number; ouro: number; niveis: number }
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
