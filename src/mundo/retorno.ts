// A Pedra de retorno com conjuração (marco 38, 08/11/2026, D-142). Usar a pedra abre um círculo rúnico no chão em
// volta do jogador e conjura por `conjuracaoMs` (5 s); enquanto isso ele fica inalvejável (invisível para os
// alvos e imune a dano), mas precisa ficar dentro do círculo:
// - sair antes de `cancelaAteMs` (os primeiros 4 s) cancela e devolve a pedra;
// - sair no último segundo desvia a magia: leva a um lugar ao acaso do reino e devolve a pedra para tentar de novo;
// - ficar até o fim leva à pedra de save, como antes.
// A pedra é gasta ao começar (e devolvida nos casos acima). A sala faz a viagem; aqui fica a regra. Tempo em ticks.
// Puro.

import type { EntidadeId } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import { buscarEntidade, type EstadoJogo } from '../core/estado';
import { ticksDe } from '../core/tempo';
import { vivo, type Entidade } from '../entities/entidade';
import { construirEfeito } from '../combat/registro-efeitos';
import { aplicarEfeito } from '../combat/efeitos';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { novoObjeto } from '../world/objeto-novo';

export type FimDoRetorno = 'concluido' | 'cancelado' | 'desviado';

interface Conjuracao {
  entidadeId: EntidadeId;
  x: number;
  y: number;
  inicioTick: number;
  fimTick: number;
  /** O fim da invisibilidade de antes (para não roubar a de uma habilidade). */
  invisivelAntes: number;
}

export const idDoCirculo = (entidadeId: EntidadeId): string => `retorno-${entidadeId}`;

export class RetornosDaSala {
  private readonly conjuracoes = new Map<EntidadeId, Conjuracao>();

  conjurando(id: EntidadeId): boolean {
    return this.conjuracoes.has(id);
  }

  /** Começa a conjuração (quem chama já gastou a pedra). */
  iniciar(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, saida: EventoSimulacao[]): void {
    const r = ctx.balance.mundo.retorno;
    const fimTick = estado.tick + ticksDe(r.conjuracaoMs);
    this.conjuracoes.set(e.id, { entidadeId: e.id, x: e.x, y: e.y, inicioTick: estado.tick, fimTick, invisivelAntes: e.invisivelAteTick });
    e.invisivelAteTick = Math.max(e.invisivelAteTick, fimTick);
    aplicarEfeito(estado, ctx, e, construirEfeito('imune_dano', { duracaoMs: r.conjuracaoMs }), { id: e.id, x: e.x, y: e.y }, null, saida);
    estado.objetos = estado.objetos.filter((o) => o.objetoId !== idDoCirculo(e.id));
    estado.objetos.push(novoObjeto(idDoCirculo(e.id), 'circulo_retorno', e.x, e.y, { ref: e.id, abertoTick: estado.tick, valor: fimTick }));
  }

  /** Confere as conjurações do tick; devolve as que acabaram (e como). */
  conferir(estado: EstadoJogo, ctx: ContextoSimulacao): { entidadeId: EntidadeId; fim: FimDoRetorno }[] {
    const r = ctx.balance.mundo.retorno;
    const acabaram: { entidadeId: EntidadeId; fim: FimDoRetorno }[] = [];
    for (const c of this.conjuracoes.values()) {
      const e = buscarEntidade(estado, c.entidadeId);
      let fim: FimDoRetorno | null = null;
      if (!e || !vivo(e)) fim = 'cancelado';
      else if (Math.hypot(e.px - c.x, e.py - c.y) > r.raioCirculo) fim = estado.tick - c.inicioTick < ticksDe(r.cancelaAteMs) ? 'cancelado' : 'desviado';
      else if (estado.tick >= c.fimTick) fim = 'concluido';
      if (!fim) continue;
      this.encerrar(estado, c, e, fim);
      acabaram.push({ entidadeId: c.entidadeId, fim });
    }
    return acabaram;
  }

  /** Tira a conjuração (quem saiu da sala, por exemplo). */
  esquecer(estado: EstadoJogo, id: EntidadeId): void {
    const c = this.conjuracoes.get(id);
    if (c) this.encerrar(estado, c, buscarEntidade(estado, id), 'cancelado');
  }

  private encerrar(estado: EstadoJogo, c: Conjuracao, e: Entidade | undefined, fim: FimDoRetorno): void {
    this.conjuracoes.delete(c.entidadeId);
    estado.objetos = estado.objetos.filter((o) => o.objetoId !== idDoCirculo(c.entidadeId));
    if (!e || fim === 'concluido') return;
    // Interrompida: volta a poder ser alvo agora (a proteção da conjuração acaba junto).
    e.invisivelAteTick = Math.min(e.invisivelAteTick, Math.max(c.invisivelAntes, estado.tick));
    e.efeitos = e.efeitos.filter((f) => !(f.tipo === 'imune_dano' && f.ateTick === c.fimTick));
  }
}
