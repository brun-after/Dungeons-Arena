// Marco 40 (13/11/2026, D-161): o que a skill faz quando abate (as leituras de estilo que prometem "ao matar"). Quem
// abateu recebe os efeitos dele (`conjurador`); os aliados em volta dele, os de `aliados`; e os de `alvo` saltam para
// o hostil vivo mais perto do abatido (até `raioSalto` células). Puro.

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { vivo, type Entidade } from '../entities/entidade';
import { podeAjudar, podeFerir } from '../modos/relacao';
import { aplicarEfeito } from './efeitos';
import { chebyshev } from './geometria';
import type { Habilidade } from './habilidades';

const RAIO_SALTO = 3;
const RAIO_ALIADOS = 3;

export function aplicarAoAbater(estado: EstadoJogo, ctx: ContextoSimulacao, quem: Entidade, morto: Entidade, hab: Habilidade | null | undefined, saida: EventoSimulacao[]): void {
  const efeitos = hab?.aoAbater;
  if (!efeitos?.length || !vivo(quem)) return;
  const origem = { id: quem.id, x: quem.x, y: quem.y };
  const proximo = estado.entidades
    .filter((e) => e !== morto && vivo(e) && podeFerir(quem, e, ctx.modo) && chebyshev(e, morto) <= RAIO_SALTO)
    .sort((a, b) => chebyshev(a, morto) - chebyshev(b, morto) || (a.id < b.id ? -1 : 1))[0];
  for (const ef of efeitos) {
    if (ef.em === 'conjurador') aplicarEfeito(estado, ctx, quem, ef, origem, { x: morto.x, y: morto.y }, saida);
    else if (ef.em === 'aliados') {
      for (const a of estado.entidades) if (vivo(a) && podeAjudar(quem, a, ctx.modo) && chebyshev(a, quem) <= RAIO_ALIADOS) aplicarEfeito(estado, ctx, a, ef, origem, null, saida);
    } else if (proximo) aplicarEfeito(estado, ctx, proximo, ef, { id: quem.id, x: morto.x, y: morto.y }, { x: proximo.x, y: proximo.y }, saida);
  }
}
