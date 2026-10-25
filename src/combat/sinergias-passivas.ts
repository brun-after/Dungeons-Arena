// As sinergias passivas no combate (marco 24, 24/10/2026, D-096). Cada função é o ponto de entrada de um tipo de
// progression/sinergias-passivas.ts: a cura atrás da muralha, o estado mais longo, o escudo do fluxo e o atordoamento
// em volta no fim da sequência. Só valem com a passiva geral ligada (`bolsa.passivasAtivas`).

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import { vivo, type Entidade } from '../entities/entidade';
import { podeFerir } from '../modos/relacao';
import type { SinergiaPassiva, TipoSinergia } from '../progression/sinergias-passivas';
import { aplicarEfeito } from './efeitos';
import { celulaOcupada, chebyshev } from './geometria';
import type { Habilidade } from './habilidades';
import { construirEfeito, type EfeitoCanonico } from './registro-efeitos';

/** As sinergias do tipo com a passiva ligada em `e`. */
function sinergiasDe(ctx: ContextoSimulacao, e: Entidade, tipo: TipoSinergia): SinergiaPassiva[] {
  const ativas = e.bolsa?.passivasAtivas;
  if (!ativas?.length) return [];
  return ctx.conteudo.sinergias.filter((s) => s.tipo === tipo && ativas.includes(s.passiva));
}

const ultimaDaSequencia = (s: SinergiaPassiva): string | undefined => s.sequencia.at(-1);

function avisar(estado: EstadoJogo, e: Entidade, s: SinergiaPassiva, saida: EventoSimulacao[]): void {
  saida.push({ t: 'sinergiaPassiva', tick: estado.tick, id: e.id, sinergia: s.id });
}

/** Disciplina férrea: o estado que a skill aplica dura mais. */
export function efeitoDaSinergia(ctx: ContextoSimulacao, conjurador: Entidade | undefined, hab: Habilidade, ef: EfeitoCanonico): EfeitoCanonico {
  if (!conjurador) return ef;
  const extra = sinergiasDe(ctx, conjurador, 'estadoMaisLongo').filter((s) => ultimaDaSequencia(s) === hab.id && s.estado === ef.tipo).reduce((t, s) => t + s.ms, 0);
  return extra > 0 ? { ...ef, duracaoMs: ef.duracaoMs + extra } : ef;
}

/** Fluxo de cura: o escudo do Fluxo restaurador gerado por esta skill rende mais (multiplicador). */
export function escudoDoFluxo(ctx: ContextoSimulacao, conjurador: Entidade, hab: Habilidade | undefined): number {
  if (!hab) return 1;
  return 1 + sinergiasDe(ctx, conjurador, 'escudoDoFluxo').filter((s) => ultimaDaSequencia(s) === hab.id).reduce((t, s) => t + s.pct, 0) / 100;
}

/** Avalanche humana: o fim da sequência (a skill anterior há até `janelaMs`) atordoa os hostis em volta do alvo. */
export function aoFecharSequencia(estado: EstadoJogo, ctx: ContextoSimulacao, conjurador: Entidade, alvo: Entidade, hab: Habilidade, anterior: string | null, anteriorTick: number, saida: EventoSimulacao[]): void {
  for (const s of sinergiasDe(ctx, conjurador, 'atordoaEmVolta')) {
    if (ultimaDaSequencia(s) !== hab.id || s.sequencia.length < 2 || anterior !== s.sequencia.at(-2)) continue;
    if (estado.tick - anteriorTick > ticksDe(s.janelaMs)) continue;
    const c = celulaOcupada(alvo);
    for (const e of estado.entidades) {
      if (e === alvo || !vivo(e) || !podeFerir(conjurador, e, ctx.modo) || chebyshev(c, celulaOcupada(e)) > s.raio) continue;
      aplicarEfeito(estado, ctx, e, construirEfeito('atordoar', { duracaoMs: s.ms }), { id: conjurador.id, x: conjurador.x, y: conjurador.y }, null, saida);
    }
    avisar(estado, conjurador, s, saida);
  }
}

/** Bastião de pedra: a cada `ms`, quem está a `raio` células da própria muralha recupera `valor` de vida. */
export function processarSinergiasPassivas(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  const muralhas = (estado.camposTaticos ?? []).filter((c) => c.tipo === 'muralha' && c.ateTick > estado.tick);
  if (muralhas.length === 0) return;
  for (const e of estado.entidades) {
    if (!vivo(e) || !e.bolsa) continue;
    for (const s of sinergiasDe(ctx, e, 'curaJuntoDaMuralha')) {
      if (estado.tick % Math.max(1, ticksDe(s.ms)) !== 0) continue;
      const perto = muralhas.some((m) => m.donoId === e.id && chebyshev(celulaOcupada(e), m) <= s.raio);
      if (!perto || e.hp >= e.hpMax) continue;
      aplicarEfeito(estado, ctx, e, construirEfeito('cura', { valor: s.valor }), { id: e.id, x: e.x, y: e.y }, null, saida);
    }
  }
}
