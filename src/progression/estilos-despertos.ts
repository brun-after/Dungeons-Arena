// Estilos despertos (marco 39, 12/11/2026, D-147): a etapa do tick que segue o radar de quem tem ficha. Quando a ponta
// de um estilo chega à intensidade do diário (`balance.estilos.despertarPct`), ele entra na lista pública e vira
// evento (o diário anota e o HUD avisa). É só o aviso: o efeito do estilo cresce ponto a ponto desde o primeiro.
// Uma ponta que volta a cair (um respec, um item tirado) sai da lista e pode despertar de novo.

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { radarDe } from './estilos';

export function atualizarEstilosDespertos(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  const limiar = ctx.balance.estilos.despertarPct / 100;
  for (const e of estado.entidades) {
    if (!e.bolsa) continue;
    const radar = radarDe(ctx, e.bolsa, e.atributos, e.nivel);
    const ids = radar ? radar.estilos.filter((_, k) => (radar.total[k] ?? 0) >= limiar).map((s) => s.id) : [];
    if (ids.length === e.estilos.length && ids.every((id, i) => e.estilos[i] === id)) continue;
    for (const id of ids) if (!e.estilos.includes(id)) saida.push({ t: 'estiloDespertou', tick: estado.tick, id: e.id, estilo: id });
    e.estilos = ids;
  }
}
