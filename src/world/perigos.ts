// Marco 25 (25/10/2026, D-100): o que a IA dos inimigos enxerga como perigo no chão. Puro.
// - as áreas da fase que ferem (brasas, miasma, gelo fino, campo elétrico, lama, névoa sombria), menos a do próprio
//   elemento do afim — essa o cura (world/ambientes.ts) e vira o destino de quem quer se curar;
// - os rastros e os campos de veneno de quem pode feri-la (pela `relacao()`, nunca pelo tipo, §2.5);
// - as armadilhas dos donos que ela já viu disparar (`ia.armadilhasVistas`). As outras são invisíveis para ela: pisa.
// A telegrafia dos golpes não entra no mapa (dura menos que um caminho); a esquiva dela é do entities/ia-tatica.ts.

import type { Celula } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { Armadilha, EstadoJogo } from '../core/estado';
import { hashTexto } from '../core/rng';
import { vivo, type Entidade } from '../entities/entidade';
import { perfilDaIa } from '../modos/dificuldade';
import { podeFerir } from '../modos/relacao';
import { AMBIENTE_FERE, ELEMENTO_DO_AMBIENTE, dentroDaArea, type AreaAmbiente } from './ambiente-tipos';
import { passavel } from './fase';

/** A área fere a entidade (fere e não é do elemento dela)? */
export function ambienteFere(e: Pick<Entidade, 'afinidade'>, a: AreaAmbiente): boolean {
  return AMBIENTE_FERE[a.tipo] && e.afinidade?.elemento !== ELEMENTO_DO_AMBIENTE[a.tipo];
}

/** A área é do elemento que a entidade absorve? */
export function ambienteAfim(e: Pick<Entidade, 'afinidade'>, a: AreaAmbiente): boolean {
  return e.afinidade !== undefined && e.afinidade.elemento === ELEMENTO_DO_AMBIENTE[a.tipo];
}

function armadilhaTemida(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, a: Armadilha): boolean {
  return (e.ia?.armadilhasVistas?.includes(a.donoId) ?? false) && a.inerteAteTick <= estado.tick && podeFerir({ id: a.donoId, equipe: a.equipeDono }, e, ctx.modo);
}

/** A célula é perigo para a entidade agora? */
export function emPerigo(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, x: number, y: number): boolean {
  if (ctx.fase.ambientes?.some((a) => ambienteFere(e, a) && dentroDaArea(a, x, y))) return true;
  if (estado.rastros.some((r) => r.x === x && r.y === y && r.ateTick > estado.tick && podeFerir({ id: r.donoId, equipe: r.equipeDono }, e, ctx.modo))) return true;
  if (estado.camposTaticos?.some((c) => c.tipo === 'veneno' && c.ateTick > estado.tick && Math.max(Math.abs(c.x - x), Math.abs(c.y - y)) <= c.raio && podeFerir({ id: c.donoId, equipe: c.equipe }, e, ctx.modo))) return true;
  return estado.armadilhas.some((a) => a.x === x && a.y === y && armadilhaTemida(estado, ctx, e, a));
}

/** O mapa de perigo da fase para a entidade (1 = perigo), ou null se não há nenhum. */
export function mapaDePerigo(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade): Uint8Array | null {
  const { largura, altura } = ctx.fase;
  let mapa: Uint8Array | null = null;
  const marcar = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= largura || y >= altura) return;
    mapa ??= new Uint8Array(largura * altura);
    mapa[y * largura + x] = 1;
  };
  for (const a of ctx.fase.ambientes ?? []) {
    if (!ambienteFere(e, a)) continue;
    const r = Math.ceil(a.raio);
    for (let y = a.y - r; y <= a.y + r; y++) for (let x = a.x - r; x <= a.x + r; x++) if (dentroDaArea(a, x, y)) marcar(x, y);
  }
  for (const r of estado.rastros) if (r.ateTick > estado.tick && podeFerir({ id: r.donoId, equipe: r.equipeDono }, e, ctx.modo)) marcar(r.x, r.y);
  for (const c of estado.camposTaticos ?? []) {
    if (c.tipo !== 'veneno' || c.ateTick <= estado.tick || !podeFerir({ id: c.donoId, equipe: c.equipe }, e, ctx.modo)) continue;
    for (let y = c.y - c.raio; y <= c.y + c.raio; y++) for (let x = c.x - c.raio; x <= c.x + c.raio; x++) marcar(x, y);
  }
  for (const a of estado.armadilhas) if (armadilhaTemida(estado, ctx, e, a)) marcar(a.x, a.y);
  return mapa;
}

/** A célula passável da área do próprio elemento mais perto da entidade, até `raio` (Chebyshev), ou null. */
export function areaAfimMaisProxima(ctx: ContextoSimulacao, e: Entidade, raio: number): Celula | null {
  let melhor: { c: Celula; d: number } | null = null;
  for (const a of ctx.fase.ambientes ?? []) {
    if (!ambienteAfim(e, a)) continue;
    const r = Math.ceil(a.raio);
    for (let y = a.y - r; y <= a.y + r; y++) {
      for (let x = a.x - r; x <= a.x + r; x++) {
        if (!dentroDaArea(a, x, y) || !passavel(ctx.fase, x, y)) continue;
        const d = Math.max(Math.abs(x - e.x), Math.abs(y - e.y));
        if (d <= raio && (!melhor || d < melhor.d)) melhor = { c: { x, y }, d };
      }
    }
  }
  return melhor?.c ?? null;
}

/** A entidade está numa área do próprio elemento? */
export function naAreaAfim(ctx: ContextoSimulacao, e: Entidade): boolean {
  return ctx.fase.ambientes?.some((a) => ambienteAfim(e, a) && dentroDaArea(a, e.x, e.y)) ?? false;
}

/** Sorteio determinístico em % por uma chave (não gasta o PRNG da IA: o resto da partida segue igual). */
export function sorteioPct(chave: string, pct: number): boolean {
  return pct > 0 && hashTexto(chave) % 100 < pct;
}

/**
 * Quem vê uma armadilha disparar perto (inimigo da IA, hostil ao dono dela) aprende, com a chance da dificuldade, a
 * contornar as armadilhas daquele dono. A de habilidade some ao disparar; o que fica é a desconfiança das próximas.
 */
export function aprenderArmadilha(estado: EstadoJogo, ctx: ContextoSimulacao, a: Armadilha): void {
  const pct = perfilDaIa(estado, ctx).aprendeArmadilhaPct;
  if (pct <= 0) return;
  const r = ctx.balance.ia;
  const dono = { id: a.donoId, equipe: a.equipeDono };
  for (const e of estado.entidades) {
    const ia = e.ia;
    if (!ia || e.controlador !== 'ia' || e.invocacao || !vivo(e) || Math.max(Math.abs(e.x - a.x), Math.abs(e.y - a.y)) > r.armadilhaVistaRaio) continue;
    if (!podeFerir(dono, e, ctx.modo) || ia.armadilhasVistas?.includes(a.donoId) || !sorteioPct(`armadilha:${a.id}:${e.id}`, pct)) continue;
    ia.armadilhasVistas = [...(ia.armadilhasVistas ?? []), a.donoId].slice(-r.armadilhasLembradas);
  }
}
