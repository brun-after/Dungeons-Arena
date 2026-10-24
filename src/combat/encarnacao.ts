// Encarnação elemental do Mago (marco 22, 23/10/2026, D-089). O Mago assume o elemento da última magia ofensiva de
// fogo, gelo ou raio e fica com ele até lançar outra desses três (as de outros elementos não trocam):
//   fogo -> magias +5% de dano e, a cada segundo, queima os hostis a 1 célula;
//   gelo -> recebe 10% menos dano, e quem o golpeia de perto fica resfriado;
//   raio -> anda 15% mais rápido, e as magias que saltam (e as de projétil) ganham um salto.
// Zera na troca de fase. Ajuste de 24/10/2026 (D-091): dura `duracaoMs` (12 s) desde a última magia do elemento.
// Números em balance.ajustesClasses.mago.encarnacao.

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { msDe, ticksDe } from '../core/tempo';
import { vivo, type Entidade } from '../entities/entidade';
import { podeFerir } from '../modos/relacao';
import { aplicarEfeito } from './efeitos';
import type { Elemento } from './elementos';
import { celulaOcupada, chebyshev } from './geometria';
import type { Habilidade } from './habilidades';
import { construirEfeito } from './registro-efeitos';

export type ElementoEncarnado = 'fogo' | 'gelo' | 'raio';
const ENCARNAVEIS: readonly Elemento[] = ['fogo', 'gelo', 'raio'];

/** É Mago (pela bolsa ou, na rede, pelo `classeId`), não invocação. */
export function ehMago(e: Entidade): boolean {
  return (e.bolsa?.classeId ?? e.classeId ?? '') === 'mago' && !e.invocacao;
}

/** O elemento encarnado agora, se houver. */
export function encarnacaoDe(e: Entidade): ElementoEncarnado | null {
  return ehMago(e) && e.encarnacao ? e.encarnacao : null;
}

/** Ao lançar: uma magia ofensiva de fogo, gelo ou raio troca (ou renova) a encarnação. Devolve se trocou. */
export function encarnar(ctx: ContextoSimulacao, e: Entidade, hab: Habilidade, tick: number): boolean {
  if (!ehMago(e) || !hab.formulaDano || !hab.elemento || !ENCARNAVEIS.includes(hab.elemento)) return false;
  const novo = hab.elemento as ElementoEncarnado;
  e.encarnacaoAteTick = tick + ticksDe(ctx.balance.ajustesClasses.mago.encarnacao.duracaoMs);
  if (e.encarnacao === novo) return false;
  e.encarnacao = novo;
  return true;
}

/** Quanto falta da encarnação, em ms (0 sem encarnação). */
export function restanteEncarnacaoMs(e: Entidade, tick: number): number {
  return encarnacaoDe(e) && e.encarnacaoAteTick !== undefined ? Math.max(0, msDe(e.encarnacaoAteTick - tick)) : 0;
}

/** Fogo: multiplicador das magias (dano mágico) do Mago. */
export function multiplicadorEncarnacao(ctx: ContextoSimulacao, e: Entidade, hab: Habilidade): number {
  return encarnacaoDe(e) === 'fogo' && hab.tipoAtaque === 'magico' ? 1 + ctx.balance.ajustesClasses.mago.encarnacao.fogoDanoPct / 100 : 1;
}

/** Gelo: multiplicador do dano que o Mago recebe. */
export function protecaoEncarnacao(ctx: ContextoSimulacao, e: Entidade): number {
  return encarnacaoDe(e) === 'gelo' ? 1 - ctx.balance.ajustesClasses.mago.encarnacao.geloReducaoPct / 100 : 1;
}

/** Raio: multiplicador do movimento. */
export function velocidadeEncarnacao(ctx: ContextoSimulacao, e: Entidade): number {
  return encarnacaoDe(e) === 'raio' ? 1 + ctx.balance.ajustesClasses.mago.encarnacao.raioVelocidadePct / 100 : 1;
}

/** Raio: saltos extras das magias com projétil ou que já saltam. */
export function saltosEncarnacao(e: Entidade | undefined, hab: Habilidade): number {
  return e && encarnacaoDe(e) === 'raio' && hab.tipoAtaque === 'magico' && (hab.politicaImpacto === 'projetil' || !!hab.saltos) ? 1 : 0;
}

/** Gelo: quem golpeou o Mago de perto fica resfriado. */
export function reagirAoGolpe(estado: EstadoJogo, ctx: ContextoSimulacao, mago: Entidade, atacante: Entidade | undefined, saida: EventoSimulacao[]): void {
  if (!atacante || atacante === mago || encarnacaoDe(mago) !== 'gelo' || !vivo(atacante)) return;
  if (chebyshev(celulaOcupada(mago), celulaOcupada(atacante)) > 1 || !podeFerir(mago, atacante, ctx.modo)) return;
  const r = ctx.balance.ajustesClasses.mago.encarnacao;
  aplicarEfeito(estado, ctx, atacante, construirEfeito('resfriado', { duracaoMs: r.geloResfriarMs }), { id: mago.id, x: mago.x, y: mago.y }, null, saida);
}

/** Fogo: a cada `fogoIntervaloMs`, os hostis a `fogoRaio` células começam a queimar. */
export function processarEncarnacoes(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  const r = ctx.balance.ajustesClasses.mago.encarnacao;
  // A encarnação vencida se apaga.
  for (const e of estado.entidades) {
    if (e.encarnacao && (e.encarnacaoAteTick ?? 0) <= estado.tick) {
      delete e.encarnacao;
      delete e.encarnacaoAteTick;
      saida.push({ t: 'encarnacaoAcabou', tick: estado.tick, id: e.id });
    }
  }
  if (estado.tick % Math.max(1, ticksDe(r.fogoIntervaloMs)) !== 0) return;
  for (const mago of estado.entidades) {
    if (!vivo(mago) || encarnacaoDe(mago) !== 'fogo') continue;
    const centro = celulaOcupada(mago);
    for (const e of estado.entidades) {
      if (!vivo(e) || e === mago || !podeFerir(mago, e, ctx.modo) || chebyshev(centro, celulaOcupada(e)) > r.fogoRaio) continue;
      aplicarEfeito(estado, ctx, e, construirEfeito('queimando', { valor: r.fogoQueimaValor, duracaoMs: r.fogoQueimaMs }), { id: mago.id, x: mago.x, y: mago.y }, null, saida);
    }
  }
}
