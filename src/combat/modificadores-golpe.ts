// Modificadores do golpe do marco 24 (24/10/2026, D-095/D-097): pelas costas, o dano extra de quem desafiou ou marcou,
// o cego que erra e as passivas gerais (redução física e mágica, resistências, dano contra controlados, estados ao
// acertar e reforço dos estados que você aplica). golpe.ts consulta; nada aqui muda o estado além do RNG do cego.

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { aleatorio } from '../core/rng';
import type { Entidade } from '../entities/entidade';
import { celulaOcupada } from './geometria';
import type { Habilidade } from './habilidades';
import { pelasCostas } from './orientacao';
import { passivasDaBolsa } from './perfil';
import { REGISTRO_EFEITOS, type EfeitoCanonico, type TipoEfeito } from './registro-efeitos';

const passivas = (ctx: ContextoSimulacao, e: Entidade | undefined) => (e?.bolsa ? passivasDaBolsa(ctx, e.bolsa) : []);

/** O golpe sai de trás do alvo? Só golpes diretos de alguém que não é o próprio alvo. */
export function golpePelasCostas(ctx: ContextoSimulacao, atacante: Entidade | undefined, alvo: Entidade, hab: Habilidade): boolean {
  if (!atacante || atacante === alvo || hab.formulaDano === null) return false;
  return pelasCostas(celulaOcupada(atacante), alvo, ctx.balance.combate.costasConeGraus);
}

/** O cego erra? Usa o RNG da simulação só quando o atacante está cego. */
export function cegoErra(estado: EstadoJogo, ctx: ContextoSimulacao, atacante: Entidade | undefined): boolean {
  if (!atacante) return false;
  let pct = 0;
  for (const f of atacante.efeitos) if (f.ateTick > estado.tick && REGISTRO_EFEITOS[f.tipo].erroPct) pct += f.pct;
  if (pct <= 0) return false;
  return aleatorio(estado.rng) * 100 < Math.min(ctx.balance.estados.cegoMaxPct, pct);
}

/** Estados do alvo antes do golpe, para "contra controlados". */
function temAlgum(alvo: Entidade, estados: readonly TipoEfeito[], tick: number): boolean {
  return alvo.efeitos.some((f) => f.ateTick > tick && estados.includes(f.tipo));
}

/**
 * O multiplicador do marco 24 sobre o dano do golpe: costas (passivas de quem bate), desafiado e marca (só de quem
 * aplicou), dano contra estados, redução física ou mágica e resistência elemental de quem apanha.
 */
export function multiplicadorMarco24(ctx: ContextoSimulacao, atacante: Entidade | undefined, alvo: Entidade, hab: Habilidade, costas: boolean, tick: number): number {
  let mais = 0;
  if (atacante) {
    for (const f of alvo.efeitos) if (f.ateTick > tick && f.origemId === atacante.id && REGISTRO_EFEITOS[f.tipo].danoDaOrigem) mais += f.pct;
    for (const p of passivas(ctx, atacante)) {
      if (costas) mais += p.costasPct ?? 0;
      if (p.danoContraEstados && temAlgum(alvo, p.danoContraEstados.estados, tick)) mais += p.danoContraEstados.pct;
    }
  }
  let menos = 0;
  for (const p of passivas(ctx, alvo)) {
    menos += (hab.tipoAtaque === 'fisico' ? p.reducaoFisicoPct : p.reducaoMagicoPct) ?? 0;
    if (hab.elemento) menos += p.resistencias?.[hab.elemento] ?? 0;
  }
  return (1 + mais / 100) * Math.max(0.1, 1 - Math.min(75, menos) / 100);
}

/** Quanto da resistência elemental do alvo o atacante ignora (Zelo), em %. */
export function resistenciaIgnorada(ctx: ContextoSimulacao, atacante: Entidade | undefined): number {
  return Math.min(100, passivas(ctx, atacante).reduce((s, p) => s + (p.resistenciaIgnoradaPct ?? 0), 0));
}

/** Os estados que as passivas de quem bate aplicam por chance a cada acerto (Brasa interior). */
export function estadosAoAcertar(estado: EstadoJogo, ctx: ContextoSimulacao, atacante: Entidade | undefined): EfeitoCanonico[] {
  const saida: EfeitoCanonico[] = [];
  for (const p of passivas(ctx, atacante)) {
    if (p.aoAcertar && aleatorio(estado.rng) * 100 < p.aoAcertar.chancePct) saida.push(p.aoAcertar.efeito);
  }
  return saida;
}

/** O estado aplicado por quem tem a passiva de reforço (Toxinas potentes) bate mais e dura mais. */
export function reforcarEstado(ctx: ContextoSimulacao, conjurador: Entidade | undefined, ef: EfeitoCanonico): EfeitoCanonico {
  let valorPct = 0;
  let duracaoMs = 0;
  for (const p of passivas(ctx, conjurador)) {
    if (p.reforcoEstado?.tipo !== ef.tipo) continue;
    valorPct += p.reforcoEstado.valorPct;
    duracaoMs += p.reforcoEstado.duracaoMs;
  }
  if (valorPct === 0 && duracaoMs === 0) return ef;
  return { ...ef, valor: Math.round(ef.valor * (1 + valorPct / 100)), duracaoMs: ef.duracaoMs > 0 ? ef.duracaoMs + duracaoMs : ef.duracaoMs };
}

/** Cura recebida a mais pelas passivas (Graça). */
export function curaRecebidaPassivas(ctx: ContextoSimulacao, alvo: Entidade): number {
  return 1 + passivas(ctx, alvo).reduce((s, p) => s + (p.curaRecebidaPct ?? 0), 0) / 100;
}
