// Contexto musical (§2.14). Marco 12 (14/10/2026), D-056. Puro: exploração, combate ou chefe, a partir
// do estado. Combate: algum hostil vivo perseguindo o jogador; chefe: esse hostil é um boss. A música
// só "desce" (chefe -> combate -> exploração) depois de 4 s sem o sinal, para não piscar entre faixas.
// Marco 11A (16/10/2026, D-066): a "sombra" da música, de 0 (casual) a 1 (dark fantasy), pela profundidade da fase,
// pela dificuldade e pelo clima; ela desliza devagar (sem saltos) e o motor a usa para a faixa e o timbre.

import type { EstadoJogo } from '../core/estado';
import type { Dificuldade } from '../modos/dificuldade';
import type { Fase } from '../world/fase';
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

const SOMBRA_DIFICULDADE: Readonly<Record<Dificuldade, number>> = { facil: -0.1, normal: 0, dificil: 0.15, pesadelo: 0.25 };
const SOMBRA_CLIMA: Readonly<Record<Clima, number>> = { exploracao: 0, combate: 0.2, chefe: 0.35 };

/**
 * Profundidade da fase, de 0 a 1: as oficiais e as das aventuras pela ordem (a primeira é 0); as geradas pelo número
 * (`gerada-N`), começando um pouco abaixo do meio e chegando ao fundo na oitava.
 */
export function profundidadeDaFase(fase: Pick<Fase, 'id' | 'ordem'>): number {
  const gerada = /^gerada-(\d+)$/.exec(fase.id);
  if (gerada) return Math.min(1, 0.3 + Number(gerada[1]) * 0.09);
  return Math.max(0, Math.min(1, (fase.ordem - 1) / 10));
}

/** A sombra pedida agora (0 casual … 1 dark fantasy). */
export function sombraDaCena(clima: Clima, profundidade: number, dificuldade: Dificuldade): number {
  return Math.max(0, Math.min(1, 0.15 + 0.6 * profundidade + SOMBRA_DIFICULDADE[dificuldade] + SOMBRA_CLIMA[clima]));
}

/** A sombra que toca: desliza para a pedida com constante de 3 s (nada de saltos entre faixas). */
export class SombraMusical {
  valor: number | null = null;

  atualizar(alvo: number, agoraMs: number): number {
    if (this.valor === null || this.ultimoMs === null) {
      this.valor = alvo;
      this.ultimoMs = agoraMs;
      return alvo;
    }
    const dt = Math.max(0, Math.min(1000, agoraMs - this.ultimoMs));
    this.ultimoMs = agoraMs;
    this.valor += (alvo - this.valor) * (1 - Math.exp(-dt / 3000));
    return this.valor;
  }

  private ultimoMs: number | null = null;
}

