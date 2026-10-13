// Eventos que a simulação grava a cada tick. O adaptador de apresentação os publica no
// barramento (events.ts) depois do tick; a simulação nunca chama a interface.
// Eventos visuais não são autoridade sobre HP: o estado basta para reconstruir a tela (§3.6).

import type { EntidadeId } from './comandos';
import type { TipoObjeto } from './estado';
import type { TipoEfeito } from '../combat/efeitos';
import type { StatusCaminho } from '../world/navegacao';

export type MotivoRecusa =
  | 'sem_habilidade'
  | 'ocupado'
  | 'bloqueado'
  | 'recarga'
  | 'recurso'
  | 'sem_alvo'
  | 'fora_de_alcance';

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
  | { t: 'morreu'; tick: number; id: EntidadeId; porId: EntidadeId | null }
  | { t: 'xpGanho'; tick: number; id: EntidadeId; xp: number }
  | { t: 'iaNotou'; tick: number; id: EntidadeId; alvoId: EntidadeId; hesitacaoAteTick: number }
  | { t: 'iaPerseguindo'; tick: number; id: EntidadeId; alvoId: EntidadeId }
  | { t: 'iaDesistiu'; tick: number; id: EntidadeId; alvoId: EntidadeId }
  | { t: 'objetoSurgiu'; tick: number; objetoId: string; tipo: TipoObjeto; x: number; y: number }
  | { t: 'coletou'; tick: number; id: EntidadeId; objetoId: string; tipo: TipoObjeto; ganho: number }
  | { t: 'reviveu'; tick: number; id: EntidadeId }
  | { t: 'surgiu'; tick: number; id: EntidadeId };

/** Mapa evento → payload para o `Barramento`. */
export type EventosDaSimulacao = { [E in EventoSimulacao as E['t']]: E };
