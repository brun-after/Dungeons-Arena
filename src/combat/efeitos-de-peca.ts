// O motor dos efeitos de peça (marco 46, 16/11/2026, D-188). Puro e determinístico.
//
// Cada peça de armadura vestida traz efeitos `gatilho > condição > efeito` (progression/pecas.ts, data/pecas.json).
// Aqui eles rodam, sem código por peça: cada gatilho é um momento do combate e cada efeito é uma função pequena.
// - `pisar`: o chão sob os pés é lido a cada `pisarCadaTicks` (as áreas do elemento, world/terrenos-vivos.ts);
// - `usar`: a skill usada (combat/acao.ts);
// - `atingido`: o golpe levado com dano (combat/golpe.ts);
// - `atacar`: o golpe dado (o multiplicador de dano, combat/golpe.ts);
// - `movimento` e `chegada`: os eventos do movimento da classe no fim do tick (o início e o fim; o instantâneo chega
//   no mesmo tick em que começa);
// - `passivo`: lido quando o combate pergunta (poder do elemento, resistência pela ponte dos ganchos).
// Tempo em ticks: a velocidade e o poder absorvido entram como efeitos com duração (`acelerado`, `bonus_dano`). O
// `acelerado` usa a regra de acúmulo dele (`mais_forte`): disparar de novo renova o tempo, nunca soma. Os números
// somados de várias peças param nos `tetos`. O reflexo e o dano da chegada só caem em quem é hostil pela `relacao()`
// (vale igual contra jogador e contra criatura).

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { msDe } from '../core/tempo';
import { vivo, type Entidade } from '../entities/entidade';
import { podeFerir } from '../modos/relacao';
import type { CondicaoDePeca, EfeitoDaPeca, EfeitoDePeca, GatilhoDePeca, RegrasDePecas } from '../progression/pecas';
import { efeitosDasPecas } from '../progression/pecas-vestidas';
import { registrarUso } from '../progression/vinculo';
import { ELEMENTO_DO_AMBIENTE, dentroDaArea } from '../world/ambiente-tipos';
import { areasEfetivas } from '../world/terrenos-vivos';
import { aplicarEfeito } from './efeitos';
import { causarDano } from './efeitos-fluxo';
import type { Elemento } from './elementos';
import { chebyshev } from './geometria';
import type { Habilidade } from './habilidades';
import { poderBase } from './poder-base';
import { construirEfeito } from './registro-efeitos';

type Hab = Pick<Habilidade, 'elemento' | 'tipoAtaque' | 'politicaImpacto'>;
type Tipo<T extends EfeitoDePeca['tipo']> = Extract<EfeitoDePeca, { tipo: T }>;

export { efeitosDasPecas };

/** O elemento do golpe como a condição o vê: o elemento, o Físico (o golpe físico sem elemento) ou nenhum. */
const elementoDoGolpe = (h: Hab): Elemento | 'fisico' | null => h.elemento ?? (h.tipoAtaque === 'fisico' ? 'fisico' : null);

/** A condição vale para o golpe (sem golpe, só a condição sem ataque e sem elemento, ou o elemento pedido). */
export function condicaoVale(se: CondicaoDePeca, hab: Hab | null, elemento: Elemento | 'fisico' | null = hab ? elementoDoGolpe(hab) : null): boolean {
  if (se.elemento !== null && se.elemento !== elemento) return false;
  if (se.ataque === 'qualquer') return true;
  if (!hab) return false;
  if (se.ataque === 'magia') return hab.tipoAtaque === 'magico';
  if (se.ataque === 'corpoACorpo') return hab.politicaImpacto === 'contato';
  return hab.politicaImpacto === 'projetil';
}

/** Os efeitos do tipo no gatilho cuja condição vale. */
function quais<T extends EfeitoDePeca['tipo']>(efeitos: readonly EfeitoDaPeca[], gatilho: GatilhoDePeca, tipo: T, vale: (se: CondicaoDePeca) => boolean): Tipo<T>[] {
  const saida: Tipo<T>[] = [];
  for (const x of efeitos) if (x.gatilho === gatilho && x.efeito.tipo === tipo && vale(x.se)) saida.push(x.efeito as Tipo<T>);
  return saida;
}

const somaPct = (lista: readonly { pct: number }[], teto: number) => Math.min(teto, lista.reduce((s, x) => s + x.pct, 0));
const regrasDe = (ctx: Pick<ContextoSimulacao, 'conteudo'>): RegrasDePecas => ctx.conteudo.pecas;

/**
 * O multiplicador de dano das peças no golpe dado: as luvas (`atacar` com a condição do ataque) e o manto (`passivo`
 * com o elemento da skill), cada um no seu teto.
 */
export function multiplicadorDasPecas(ctx: Pick<ContextoSimulacao, 'conteudo'>, atacante: Pick<Entidade, 'bolsa'>, hab: Hab): number {
  const efeitos = efeitosDasPecas(ctx, atacante);
  if (efeitos.length === 0) return 1;
  const t = regrasDe(ctx).tetos;
  const luvas = somaPct(quais(efeitos, 'atacar', 'dano', (se) => condicaoVale(se, hab)), t.danoPct);
  const manto = hab.elemento ? somaPct(quais(efeitos, 'passivo', 'poderElemento', (se) => se.elemento === hab.elemento), t.poderElementoPct) : 0;
  return (1 + luvas / 100) * (1 + manto / 100);
}

/** O fator da recarga do movimento da classe (as perneiras: 1 = sem mudança; 0,8 = 20% mais rápido). */
export function fatorDeRecargaDasPecas(ctx: Pick<ContextoSimulacao, 'conteudo'>, e: Pick<Entidade, 'bolsa'>): number {
  const efeitos = efeitosDasPecas(ctx, e);
  if (efeitos.length === 0) return 1;
  return 1 - somaPct(quais(efeitos, 'movimento', 'recargaMovimento', () => true), regrasDe(ctx).tetos.recargaMovimentoPct) / 100;
}

/** A resistência física das peças (o elmo do golpe), em %, para o golpe físico sem elemento. */
export function resistenciaFisicaDasPecas(ctx: Pick<ContextoSimulacao, 'conteudo'>, alvo: Pick<Entidade, 'bolsa'>, hab: Hab): number {
  if (elementoDoGolpe(hab) !== 'fisico') return 0;
  const efeitos = efeitosDasPecas(ctx, alvo);
  if (efeitos.length === 0) return 0;
  return somaPct(quais(efeitos, 'passivo', 'resistencia', (se) => se.elemento === 'fisico'), ctx.conteudo.pecas.tetos.resistenciaPct);
}

/** A velocidade das botas: o `acelerado` com a duração em ticks (renova pela regra de acúmulo, não soma). */
function acelerar(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, lista: readonly Tipo<'velocidade'>[], saida: EventoSimulacao[]): void {
  if (lista.length === 0) return;
  const pct = Math.min(regrasDe(ctx).tetos.velocidadePct, Math.max(...lista.map((x) => x.pct)));
  const ticks = Math.max(...lista.map((x) => x.ticks));
  aplicarEfeito(estado, ctx, e, construirEfeito('acelerado', { duracaoMs: msDe(ticks), pct }), { id: e.id, x: e.x, y: e.y }, null, saida, false);
}

/** O gatilho `usar`: a skill usada (o elemento dela, ou o tipo de ataque). */
export function aoUsarHabilidadeDasPecas(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, hab: Hab, saida: EventoSimulacao[]): void {
  const efeitos = efeitosDasPecas(ctx, e);
  if (efeitos.length === 0 || !vivo(e)) return;
  acelerar(estado, ctx, e, quais(efeitos, 'usar', 'velocidade', (se) => condicaoVale(se, hab)), saida);
}

/**
 * O gatilho `atingido`: o golpe com dano levado por quem veste. As botas aceleram, o peitoral reflete parte do dano em
 * quem bateu (se ele for hostil) e o manto absorve parte do golpe do elemento (cura) e o converte em poder ou sintonia.
 */
export function aoSerAtingidoDasPecas(estado: EstadoJogo, ctx: ContextoSimulacao, alvo: Entidade, atacante: Entidade | null, hab: Hab, dano: number, saida: EventoSimulacao[]): void {
  if (dano <= 0 || !vivo(alvo)) return;
  const efeitos = efeitosDasPecas(ctx, alvo);
  if (efeitos.length === 0) return;
  const t = regrasDe(ctx).tetos;
  const vale = (se: CondicaoDePeca) => condicaoVale(se, hab);
  acelerar(estado, ctx, alvo, quais(efeitos, 'atingido', 'velocidade', vale), saida);
  const refletir = somaPct(quais(efeitos, 'atingido', 'refletir', vale), t.refletirPct);
  if (refletir > 0 && atacante && atacante !== alvo && vivo(atacante) && podeFerir(alvo, atacante, ctx.modo)) {
    const volta = Math.round((dano * refletir) / 100);
    if (volta > 0) causarDano(estado, ctx, atacante, volta, alvo.id, 'reflexo', saida);
  }
  const absorver = quais(efeitos, 'atingido', 'absorver', vale);
  if (absorver.length === 0 || !hab.elemento) return;
  const pct = somaPct(absorver, t.absorverPct);
  const devolve = Math.round((dano * pct) / 100);
  if (devolve > 0) aplicarEfeito(estado, ctx, alvo, construirEfeito('cura', { valor: devolve }), { id: alvo.id, x: alvo.x, y: alvo.y }, null, saida, false);
  const poder = absorver.filter((x) => x.em === 'poder');
  if (poder.length > 0) {
    const ticks = Math.max(...poder.map((x) => x.ticks));
    aplicarEfeito(estado, ctx, alvo, construirEfeito('bonus_dano', { duracaoMs: msDe(ticks), pct: Math.min(t.danoPct, somaPct(poder, t.absorverPct)) }), { id: alvo.id, x: alvo.x, y: alvo.y }, null, saida, false);
  }
  if (alvo.bolsa && absorver.some((x) => x.em === 'sintonia')) registrarUso(ctx, alvo.bolsa, hab.elemento, estado.tick);
}

/** Os elementos do chão sob a entidade (as áreas fixas e os terrenos vivos). */
export function elementosSobOsPes(estado: EstadoJogo, ctx: ContextoSimulacao, e: Pick<Entidade, 'x' | 'y'>): Elemento[] {
  const saida: Elemento[] = [];
  for (const a of areasEfetivas(estado, ctx.fase.ambientes ?? [])) {
    const el = ELEMENTO_DO_AMBIENTE[a.tipo];
    if (el && dentroDaArea(a, e.x, e.y) && !saida.includes(el)) saida.push(el);
  }
  return saida;
}

/** Etapa do tick: o gatilho `pisar` (a cada `pisarCadaTicks`, quem veste e está sobre o elemento acelera). */
export function processarPecas(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  if (estado.tick % regrasDe(ctx).pisarCadaTicks !== 0) return;
  for (const e of estado.entidades) {
    if (!e.bolsa || !vivo(e)) continue;
    const pisar = efeitosDasPecas(ctx, e).filter((x) => x.gatilho === 'pisar');
    if (pisar.length === 0) continue;
    const chao = elementosSobOsPes(estado, ctx, e);
    if (chao.length === 0) continue;
    acelerar(estado, ctx, e, quais(pisar, 'pisar', 'velocidade', (se) => se.elemento === null || (se.elemento !== 'fisico' && chao.includes(se.elemento))), saida);
  }
}

/** O dano da chegada pelo poder base de quem veste (D-148: o dano de quem tem ficha vem do poder base). */
export function danoDoPoder(ctx: Pick<ContextoSimulacao, 'balance'>, e: Pick<Entidade, 'nivel'>, pctDoPoder: number): number {
  const p = poderBase(e.nivel, ctx.balance);
  return Math.max(1, Math.round((p.bonus * p.multRolagem * pctDoPoder) / 100));
}

/** A chegada do movimento: dano nos hostis em volta e o escudo em quem veste. */
function chegar(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, efeitos: readonly EfeitoDaPeca[], saida: EventoSimulacao[]): void {
  for (const d of quais(efeitos, 'chegada', 'chegadaDano', () => true)) {
    const valor = danoDoPoder(ctx, e, d.pctDoPoder);
    for (const o of estado.entidades) {
      if (o !== e && vivo(o) && chebyshev(o, e) <= d.raio && podeFerir(e, o, ctx.modo)) causarDano(estado, ctx, o, valor, e.id, 'rastro_dano', saida);
    }
  }
  for (const s of quais(efeitos, 'chegada', 'chegadaEscudo', () => true)) {
    const valor = Math.max(1, Math.round((e.hpMax * s.pctDaVida) / 100));
    aplicarEfeito(estado, ctx, e, construirEfeito('escudo', { valor, duracaoMs: msDe(s.ticks) }), { id: e.id, x: e.x, y: e.y }, null, saida, false);
  }
}

/**
 * No fim do tick, os eventos do movimento da classe: o início deixa o rastro do elemento; o fim (ou o início de um
 * movimento instantâneo, que já não está em curso) é a chegada.
 */
export function pecasNosEventos(estado: EstadoJogo, ctx: ContextoSimulacao, eventos: readonly EventoSimulacao[], saida: EventoSimulacao[]): void {
  for (const ev of eventos) {
    if (ev.t !== 'movimentoClasse' || (ev.fase !== 'inicio' && ev.fase !== 'fim')) continue;
    const e = estado.entidades.find((x) => x.id === ev.id);
    if (!e?.bolsa || !vivo(e)) continue;
    const efeitos = efeitosDasPecas(ctx, e);
    if (efeitos.length === 0) continue;
    if (ev.fase === 'inicio') {
      for (const x of efeitos) {
        if (x.gatilho !== 'movimento' || x.efeito.tipo !== 'rastro' || x.se.elemento === null || x.se.elemento === 'fisico') continue;
        const estadoDoElemento = ctx.conteudo.elementos.get(x.se.elemento)?.estado;
        if (!estadoDoElemento) continue;
        aplicarEfeito(estado, ctx, e, construirEfeito('rastro_efeito', { duracaoMs: msDe(x.efeito.ticks), interno: estadoDoElemento }), { id: e.id, x: e.x, y: e.y }, null, saida, false);
      }
    }
    const emCurso = e.movimentoClasse?.modo !== undefined;
    if (ev.fase === 'fim' || !emCurso) chegar(estado, ctx, e, efeitos, saida);
  }
}
