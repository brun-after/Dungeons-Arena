// Clicar no que se usa (marco 53, 22/11/2026, D-203): o clique (ou toque) numa loja, num NPC, num baú, numa pedra ou
// numa fogueira abre como a tecla de interagir. Longe, o personagem anda até lá e abre ao chegar. O pedido some se o
// jogador fizer outra coisa (andar, clicar em outro lugar) ou se o objeto sumir. Só emite comandos (`irPara` e
// `interagir`); quem decide se abre é a simulação, como na tecla.

import type { Celula, Comando } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo, ObjetoNoMundo } from '../core/estado';
import type { Entidade } from '../entities/entidade';
import { celulaOcupada, chebyshev } from '../combat/geometria';
import { interagivel } from '../world/objetos';

/** Quanto tempo o pedido espera o personagem chegar (ms). */
const ESPERA_MS = 15_000;

export interface CliqueEmObjeto {
  /** O clique numa célula: true quando era um objeto (o clique foi usado). */
  tocar: (c: Celula, agoraMs: number) => boolean;
  /** A cada quadro: chegou perto do objeto pedido, interage. */
  atualizar: (agoraMs: number) => void;
  /** Outro comando de movimento do jogador cancela o pedido. */
  esquecer: () => void;
}

/**
 * O objeto usável clicado: o da célula, ou o da célula logo acima dela na tela (o desenho fica de pé e a cobre): vista
 * de cima, a de cima (y - 1); no isométrico, a de trás na diagonal (x - 1, y - 1). Clicar ao lado continua sendo andar.
 */
export function objetoClicado(estado: EstadoJogo, c: Celula, iso = true): ObjetoNoMundo | null {
  let melhor: ObjetoNoMundo | null = null;
  let melhorD = Infinity;
  for (const o of estado.objetos) {
    if (!interagivel(o) || o.tipo === 'coleta') continue;
    if (o.tipo === 'bau' && o.abertoTick !== 0) continue;
    const dx = o.x - c.x;
    const dy = o.y - c.y;
    const d = dx + dy;
    const cobre = (dx === 0 && dy === 0) || (dy === 1 && dx === (iso ? 1 : 0));
    if (cobre && d < melhorD) {
      melhor = o;
      melhorD = d;
    }
  }
  return melhor;
}

export function criarCliqueEmObjeto(ctx: ContextoSimulacao, estado: () => EstadoJogo, jogador: () => Entidade | undefined, emitir: (cmd: Comando) => void, iso: () => boolean = () => true): CliqueEmObjeto {
  let pedido: { objetoId: string; ateMs: number } | null = null;
  const alcance = ctx.balance.economia.alcanceInteracao;

  const perto = (eu: Entidade, o: ObjetoNoMundo) => chebyshev(celulaOcupada(eu), o) <= alcance;

  return {
    tocar: (c, agoraMs) => {
      const eu = jogador();
      const o = eu && !eu.morto && !eu.interacao ? objetoClicado(estado(), c, iso()) : null;
      if (!eu || !o) {
        pedido = null;
        return false;
      }
      if (perto(eu, o)) {
        pedido = null;
        emitir({ t: 'interagir' });
        return true;
      }
      emitir({ t: 'irPara', x: o.x, y: o.y });
      pedido = { objetoId: o.objetoId, ateMs: agoraMs + ESPERA_MS };
      return true;
    },
    atualizar: (agoraMs) => {
      if (!pedido) return;
      const eu = jogador();
      const o = estado().objetos.find((x) => x.objetoId === pedido?.objetoId);
      if (!eu || !o || eu.morto || agoraMs > pedido.ateMs) {
        pedido = null;
        return;
      }
      if (!perto(eu, o)) return;
      pedido = null;
      emitir({ t: 'interagir' });
    },
    esquecer: () => {
      pedido = null;
    },
  };
}
