// Eventos que a simulação grava a cada tick. O adaptador de apresentação os publica no
// barramento (events.ts) depois do tick; a simulação nunca chama a interface.

import type { EntidadeId } from './comandos';
import type { StatusCaminho } from '../world/navegacao';

export type EventoSimulacao =
  | { t: 'moveu'; tick: number; id: EntidadeId; x: number; y: number }
  | { t: 'caminhoFalhou'; tick: number; id: EntidadeId; status: Exclude<StatusCaminho, 'alcancado'> }
  // Marco 2: o ataque ainda não resolve dano; o evento só confirma a intenção (marco 3).
  | { t: 'ataqueSolicitado'; tick: number; id: EntidadeId };

/** Mapa evento → payload para o `Barramento`. */
export type EventosDaSimulacao = { [E in EventoSimulacao as E['t']]: E };
