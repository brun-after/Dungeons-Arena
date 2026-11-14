// D-173 (14/11/2026): o disparo das ressonâncias. Quando o golpe de quem tem ficha sai com a forma de um eixo de estilo
// e no elemento de uma sintonia que ele tem, a ressonância do par dispara: um efeito a mais, na faixa do mais fraco dos
// dois (a faixa da forma e a da sintonia, de 1 a 10). Cada ressonância tem a recarga dela por personagem. Elas ficam
// escondidas até a primeira vez; o evento `ressonancia` leva ao diário (progression/diario.ts) e ao visual. Puro.

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import { vivo, type Entidade } from '../entities/entidade';
import { podeAjudar, podeFerir } from '../modos/relacao';
import { vinculoDe } from '../progression/vinculo';
import { aplicarEfeito } from './efeitos';
import { eixoDaForma } from './eixos';
import { chebyshev } from './geometria';
import type { Habilidade } from './habilidades';
import type { EfeitoCanonico } from './registro-efeitos';
import { idDaRessonancia, type Ressonancia } from './ressonancias-dados';

const FAIXAS = 10;

/** As ressonâncias que este golpe acorda, com a faixa (a menor entre a forma do eixo e a sintonia com o elemento). */
export function ressonanciasDoGolpe(ctx: ContextoSimulacao, ator: Entidade, hab: Habilidade, tick: number): { r: Ressonancia; faixa: number }[] {
  if (!ator.bolsa || !hab.formas || hab.formas.length === 0) return [];
  const elemento = hab.runa ?? hab.elemento ?? (hab.tipoAtaque === 'fisico' ? 'fisico' : null);
  if (!elemento) return [];
  const sintonia = Math.round(vinculoDe(ctx, ator, tick)[elemento] * FAIXAS);
  const saida: { r: Ressonancia; faixa: number }[] = [];
  for (const f of hab.formas) {
    const r = ctx.conteudo.ressonancias.get(idDaRessonancia(eixoDaForma(f.mod), elemento));
    const faixa = Math.min(f.faixa, sintonia);
    if (r && faixa >= ctx.balance.habilidades.ressonancias.faixaMin) saida.push({ r, faixa });
  }
  return saida;
}

/** O efeito na faixa: o valor e o % crescem com ela; a duração vai do piso (`duracaoMinPct`) à inteira. */
export function efeitoNaFaixa(e: EfeitoCanonico, faixa: number, duracaoMinPct: number): EfeitoCanonico {
  const t = faixa / FAIXAS;
  const piso = duracaoMinPct / 100;
  return {
    ...e,
    valor: e.valor > 0 ? Math.max(1, Math.round(e.valor * t)) : 0,
    pct: e.pct > 0 ? Math.max(1, Math.round(e.pct * t)) : 0,
    duracaoMs: Math.round(e.duracaoMs * (piso + (1 - piso) * t)),
    em: 'alvo',
  };
}

/** Depois do golpe que feriu: dispara as ressonâncias dele (cada uma na sua recarga). */
export function dispararRessonancias(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, alvo: Entidade, hab: Habilidade, saida: EventoSimulacao[]): void {
  const regras = ctx.balance.habilidades.ressonancias;
  for (const { r, faixa } of ressonanciasDoGolpe(ctx, ator, hab, estado.tick)) {
    const chave = `res:${ator.id}:${r.id}`;
    if ((estado.recargas[chave] ?? 0) > estado.tick) continue;
    estado.recargas[chave] = estado.tick + ticksDe(regras.recargaMs);
    const efeito = efeitoNaFaixa(r.efeito, faixa, regras.duracaoMinPct);
    const origem = { id: ator.id, x: ator.x, y: ator.y };
    let sobre: Entidade[];
    if (r.efeito.em === 'conjurador') sobre = [ator];
    else if (r.efeito.em === 'aliados') sobre = estado.entidades.filter((o) => vivo(o) && chebyshev(o, ator) <= regras.raioAliados && (o === ator || podeAjudar(ator, o, ctx.modo)));
    else if (r.raio > 0) sobre = estado.entidades.filter((o) => vivo(o) && chebyshev(o, alvo) <= r.raio && (o === alvo || podeFerir(ator, o, ctx.modo)));
    else sobre = [alvo];
    for (const o of sobre) if (vivo(o)) aplicarEfeito(estado, ctx, o, efeito, origem, null, saida);
    saida.push({ t: 'ressonancia', tick: estado.tick, id: ator.id, ressonancia: r.id, alvoId: alvo.id, x: alvo.x, y: alvo.y });
  }
}
