// Povoamento inicial da fase: cria os inimigos posicionados pela autoria, com IDs estáveis
// derivados da ordem no arquivo (§3.6: IDs de instância estáveis).

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { criarInimigo } from '../entities/fabrica';

export function idDoInimigo(indice: number): string {
  return `i${String(indice).padStart(3, '0')}`;
}

export function povoarFase(estado: EstadoJogo, ctx: ContextoSimulacao): void {
  ctx.fase.inimigos.forEach((pos, indice) => {
    const preset = ctx.conteudo.presets.get(pos.preset);
    if (!preset) return;
    const opcoes = { ...(pos.nivel !== undefined && { nivel: pos.nivel }), ...(pos.hpBase !== undefined && { hpBase: pos.hpBase }) };
    estado.entidades.push(criarInimigo(preset, idDoInimigo(indice), pos.x, pos.y, ctx.balance, opcoes));
  });
}
