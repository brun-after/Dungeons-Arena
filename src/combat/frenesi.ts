// Frenesi do Guerreiro (marco 24, 24/10/2026, D-094): a fúria cheia liga, por 6 s, +20% de dano, +15% de velocidade do
// básico e a variante `frenesi` das skills de classe; a resistência contra grupos vai a zero. Encher a fúria também
// enche a ultimate. Números em balance.ajustesClasses.guerreiro.furia.frenesi.

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import type { Entidade } from '../entities/entidade';
import { cargaDaClasse } from './carga-ultimate';
import { aplicarEfeito, type OrigemDoEfeito } from './efeitos';
import { marcarFrenesi } from './furia';
import { construirEfeito } from './registro-efeitos';

/** A barra acabou de encher: Frenesi e carga da ultimate. */
export function encherFuria(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, origem: OrigemDoEfeito, saida: EventoSimulacao[]): void {
  const r = ctx.balance.ajustesClasses.guerreiro.furia.frenesi;
  marcarFrenesi(ctx, e, estado.tick);
  aplicarEfeito(estado, ctx, e, construirEfeito('frenesi', { duracaoMs: r.duracaoMs, pct: r.danoPct }), origem, null, saida);
  cargaDaClasse(ctx, e, 'furiaCheia', estado.tick, saida);
}
