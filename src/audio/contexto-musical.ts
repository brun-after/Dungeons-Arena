// Contexto musical (§2.14). Marco 12 (14/10/2026), D-056. Puro: exploração, combate ou chefe, a partir
// do estado. Combate: algum hostil vivo perseguindo o jogador; chefe: esse hostil é um boss. A música
// só "desce" (chefe → combate → exploração) depois de 4 s sem o sinal, para não piscar entre faixas.

import type { EstadoJogo } from '../core/estado';
import { vivo } from '../entities/entidade';

export type Clima = 'exploracao' | 'combate' | 'chefe';
const PESO: Readonly<Record<Clima, number>> = { exploracao: 0, combate: 1, chefe: 2 };

export const PERMANENCIA_MS = 4000;

/** O clima pedido agora, sem histerese. */
export function climaDoEstado(estado: EstadoJogo, idLocal: string): Clima {
  let clima: Clima = 'exploracao';
  for (const e of estado.entidades) {
    if (!vivo(e) || e.ia?.modo !== 'perseguindo' || e.ia.alvoId !== idLocal) continue;
    if (e.arquetipo === 'boss') return 'chefe';
    clima = 'combate';
  }
  return clima;
}

export class ContextoMusical {
  clima: Clima = 'exploracao';
  private ultimoSinalMs = -Infinity;

  /** Atualiza com o clima pedido; devolve o clima a tocar. */
  atualizar(pedido: Clima, agoraMs: number): Clima {
    if (PESO[pedido] >= PESO[this.clima]) {
      if (PESO[pedido] > 0) this.ultimoSinalMs = agoraMs;
      this.clima = pedido;
      return this.clima;
    }
    if (agoraMs - this.ultimoSinalMs >= PERMANENCIA_MS) this.clima = pedido;
    return this.clima;
  }
}
