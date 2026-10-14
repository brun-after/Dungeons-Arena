// Povoamento inicial da fase: cria os inimigos e os objetos posicionados pela autoria, com IDs
// estáveis derivados da ordem no arquivo (§3.6). O modo decide se a fase traz inimigos de IA e
// objetos (§2.13).

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { criarInimigo } from '../entities/fabrica';
import { largarObjeto, largarOrbeEfeito } from './objetos';

export function idDoInimigo(indice: number): string {
  return `i${String(indice).padStart(3, '0')}`;
}

export function povoarFase(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[] = []): void {
  if (ctx.modo.inimigosDeIA === 'da_fase') {
    ctx.fase.inimigos.forEach((pos, indice) => {
      const preset = ctx.conteudo.presets.get(pos.preset);
      if (!preset) return;
      const opcoes = { ...(pos.nivel !== undefined && { nivel: pos.nivel }), ...(pos.hpBase !== undefined && { hpBase: pos.hpBase }) };
      estado.entidades.push(criarInimigo(preset, idDoInimigo(indice), pos.x, pos.y, ctx.balance, opcoes));
    });
  }
  if (ctx.modo.objetosDeFase) {
    ctx.fase.objetos.forEach((o, indice) => {
      if (o.tipo === 'orbe_efeito') {
        if (o.efeito) largarOrbeEfeito(estado, o.efeito, o.x, o.y, saida, `f:${indice}`);
      } else {
        largarObjeto(estado, o.tipo, o.x, o.y, o.valor, o.modo, saida, `f:${indice}`);
      }
    });
  }
}
