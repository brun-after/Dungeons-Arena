// 17/10/2026: terreno elemental usa o mesmo dispatcher de efeitos e reações das habilidades.
import { aplicarEfeito } from '../combat/efeitos';
import { construirEfeito } from '../combat/registro-efeitos';
import type { ContextoSimulacao } from '../core/contexto';
import { DONO_FASE, type EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import { vivo } from '../entities/entidade';
import { dentroDaArea } from './ambiente-tipos';

export function processarAmbientes(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[], inicio = 0): void {
  const areas = ctx.fase.ambientes;
  const b = ctx.balance.ambiente;
  if (!areas?.length) return;
  const intervalo = Math.max(1, ticksDe(b.intervaloMs));
  const pulso = estado.tick % intervalo === 0;
  const chegaram = new Set<string>();
  for (let i = inicio; i < saida.length; i++) {
    const ev = saida[i];
    if (ev?.t === 'moveu' && ev.tick === estado.tick) chegaram.add(ev.id);
  }
  if (!pulso && chegaram.size === 0) return;
  for (const e of estado.entidades) {
    if (!vivo(e) || !pulso && !chegaram.has(e.id)) continue;
    for (let i = 0; i < areas.length; i++) {
      const a = areas[i]; if (!a) continue;
      if (!dentroDaArea(a, e.x, e.y)) continue;
      const chave = `terreno:${e.id}:${i}`;
      if ((estado.recargas[chave] ?? 0) > estado.tick) continue;
      estado.recargas[chave] = estado.tick + intervalo;
      const tipo = a.tipo === 'agua' ? 'molhado' : a.tipo === 'brasas' ? 'queimando' : 'envenenado';
      aplicarEfeito(estado, ctx, e, construirEfeito(tipo, { duracaoMs: b.duracaoMs, valor: a.tipo === 'brasas' ? b.queimadura : b.veneno }),
        { id: DONO_FASE, x: a.x, y: a.y }, null, saida);
    }
  }
}
