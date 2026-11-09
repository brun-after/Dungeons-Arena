// Os mercadores errantes do Mundo (marco 38, 08/11/2026, D-142): homens de mochila enorme que andam pela rota da
// região (gerador: de uma passagem até o centro), indo e voltando, um passo a cada `passoMs`. Param quando um jogador
// chega perto (para dar tempo de abrir a loja) e enquanto alguém compra deles. A loja é um objeto `loja` com o `ref`
// do errante; a sala só move o objeto (o render desliza a figura). Tempo em ticks. Puro.

import type { Celula } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { ticksDe } from '../core/tempo';
import { vivo } from '../entities/entidade';
import { REF_ERRANTE } from './objetos-mundo';

interface Andar {
  rota: readonly Celula[];
  passo: number;
  sentido: 1 | -1;
}

export class ErrantesDaRegiao {
  private readonly andares = new Map<string, Andar>();
  private proximoTick = 0;

  constructor(rotas: readonly (readonly Celula[])[]) {
    rotas.forEach((rota, i) => {
      this.andares.set(`errante-${i}`, { rota, passo: 0, sentido: 1 });
    });
  }

  /** Um passo de cada errante, se for a hora e ninguém estiver com ele. */
  andar(estado: EstadoJogo, ctx: ContextoSimulacao): void {
    if (this.andares.size === 0 || estado.tick < this.proximoTick) return;
    const regras = ctx.balance.mundo.errantes;
    this.proximoTick = estado.tick + ticksDe(regras.passoMs);
    for (const o of estado.objetos) {
      if (o.tipo !== 'loja' || o.ref !== REF_ERRANTE) continue;
      const a = this.andares.get(o.objetoId);
      if (!a) continue;
      const ocupado = estado.entidades.some(
        (e) => vivo(e) && e.bolsa && (e.interacao?.objetoId === o.objetoId || Math.max(Math.abs(e.x - o.x), Math.abs(e.y - o.y)) <= regras.pausaPertoCelulas),
      );
      if (ocupado) continue;
      if (a.passo + a.sentido < 0 || a.passo + a.sentido >= a.rota.length) a.sentido = a.sentido === 1 ? -1 : 1;
      a.passo += a.sentido;
      const c = a.rota[a.passo];
      if (!c) continue;
      o.x = c.x;
      o.y = c.y;
    }
  }
}
