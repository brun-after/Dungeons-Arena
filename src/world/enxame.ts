// 17/10/2026: levas limitadas, próximas, fora da zona imediata do jogador. Reserva persiste no save.
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { ticksDe } from '../core/tempo';
import { vivo } from '../entities/entidade';
import { criarInimigo } from '../entities/fabrica';
import { reservaCelula } from './colisao';
import { idDoInimigo, opcoesDoPosicionado } from './populacao';
export function processarEnxame(estado: EstadoJogo, ctx: ContextoSimulacao): void {
  const fila = estado.reservaEnxame;
  const b = ctx.balance.ambiente;
  if (!fila?.length || estado.tick % Math.max(1, ticksDe(b.intervaloMs)) !== 0) return;
  const jogadores = estado.entidades.filter((e) => e.controlador !== 'ia' && vivo(e));
  if (jogadores.length === 0) return;
  let vagas = Math.min(b.enxameLeva, b.enxameAtivos - estado.entidades.filter((e) => e.controlador === 'ia' && vivo(e)).length);
  if (vagas <= 0) return;
  estado.reservaEnxame = fila.filter((indice) => {
    if (vagas <= 0) return true;
    const pos = ctx.fase.inimigos[indice];
    if (!pos) return false;
    const distancia = Math.min(...jogadores.map((e) => Math.max(Math.abs(e.x - pos.x), Math.abs(e.y - pos.y))));
    if (distancia < b.enxameDistanciaSegura || distancia > b.enxameRaio || estado.entidades.some((e) => vivo(e) && reservaCelula(e, pos.x, pos.y))) return true;
    const preset = ctx.conteudo.presets.get(pos.preset);
    if (!preset) return false;
    estado.entidades.push(criarInimigo(preset, idDoInimigo(indice), pos.x, pos.y, ctx.balance, opcoesDoPosicionado(ctx, preset, pos)));
    vagas--;
    return false;
  });
}
