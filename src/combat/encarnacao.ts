// Encarnação elemental do Mago (marco 22, 23/10/2026, D-089). O Mago assume o elemento da última magia ofensiva de
// fogo, gelo ou raio e fica com ele até lançar outra desses três (as de outros elementos não trocam):
//   fogo -> magias +5% de dano e, a cada segundo, queima os hostis a 1 célula;
//   gelo -> recebe 10% menos dano, e quem o golpeia de perto fica resfriado;
//   raio -> anda 15% mais rápido, e as magias que saltam (e as de projétil) ganham um salto.
// Zera na troca de fase. Ajuste de 24/10/2026 (D-091): dura `duracaoMs` (12 s) desde a última magia do elemento.
// Marco 24 (24/10/2026, D-095): as gerais de terra, veneno, sombra e sagrado nas teclas abrem as encarnações de terra,
// veneno, trevas e luz (`sagrado`); trocar de elemento até `duplaJanelaMs` depois da última magia do anterior funde os
// dois numa encarnação dupla por `duplaDuracaoMs`. A sintonia psíquica estende, a arcana e a técnica renovam e a
// vertente Arquimago dobra a duração. O efeito das novas e das duplas fica em combat/encarnacao-efeitos.ts.
// Números em balance.ajustesClasses.mago.encarnacao.

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { msDe, ticksDe } from '../core/tempo';
import { vivo, type Entidade } from '../entities/entidade';
import { podeFerir } from '../modos/relacao';
import { aplicarEfeito } from './efeitos';
import { ehElemento, type Elemento } from './elementos';
import { celulaOcupada, chebyshev } from './geometria';
import type { Habilidade } from './habilidades';
import { construirEfeito } from './registro-efeitos';
import { definicaoDe } from './compilar-habilidade';
import { efeitosDeSintonia, somaDeSintonia } from '../progression/sintonia';
import { pulsarEncarnacao } from './encarnacao-efeitos';

export const ELEMENTOS_ENCARNAVEIS = ['fogo', 'gelo', 'raio', 'terra', 'veneno', 'trevas', 'sagrado'] as const;
export type ElementoEncarnado = (typeof ELEMENTOS_ENCARNAVEIS)[number];
/** Os três de sempre; os outros quatro abrem pela sintonia (`encarnar`). */
const BASE: readonly Elemento[] = ['fogo', 'gelo', 'raio'];

/** Os elementos que este Mago encarna agora. */
export function encarnaveis(ctx: ContextoSimulacao, e: Entidade, tick: number): Elemento[] {
  return [...BASE, ...efeitosDeSintonia(ctx, e, 'encarnar', tick).map((ef) => ef.elemento as Elemento)];
}

const ehEncarnavel = (x: string | null | undefined): x is ElementoEncarnado => (ELEMENTOS_ENCARNAVEIS as readonly string[]).includes(x ?? '');

/** É Mago (pela bolsa ou, na rede, pelo `classeId`), não invocação. */
export function ehMago(e: Entidade): boolean {
  return (e.bolsa?.classeId ?? e.classeId ?? '') === 'mago' && !e.invocacao;
}

/** O elemento encarnado agora, se houver. */
export function encarnacaoDe(e: Entidade): ElementoEncarnado | null {
  return ehMago(e) && e.encarnacao ? e.encarnacao : null;
}

/** Ao lançar: estende ou renova pela sintonia (psíquica, arcana, técnica). */
function estenderOuRenovar(ctx: ContextoSimulacao, e: Entidade, hab: Habilidade, tick: number): void {
  if (!e.encarnacao || e.encarnacaoAteTick === undefined) return;
  const familia = definicaoDe(ctx, hab.id)?.familiaGeral;
  for (const ef of efeitosDeSintonia(ctx, e, 'encarnacaoEstende', tick)) if (familia && ef.familia === familia) e.encarnacaoAteTick += ticksDe(ef.ms);
  for (const ef of efeitosDeSintonia(ctx, e, 'encarnacaoRenova', tick)) {
    const vale = ef.habilidade === hab.id || (ef.habilidade === 'fisico' && hab.tipoAtaque === 'fisico' && !!hab.formulaDano);
    if (vale) e.encarnacaoAteTick = Math.max(e.encarnacaoAteTick, tick + ticksDe(ef.ms || duracaoDaEncarnacao(ctx, e, tick)));
  }
}

/** A duração da encarnação (a vertente Arquimago dobra). */
function duracaoDaEncarnacao(ctx: ContextoSimulacao, e: Entidade, tick: number): number {
  return ctx.balance.ajustesClasses.mago.encarnacao.duracaoMs * (1 + somaDeSintonia(ctx, e, 'encarnacaoDuracao', 'pct', tick) / 100);
}

/** O elemento que esta magia encarna (Seta e Agulha contam como o encarnado, na vertente Arquimago). */
export function elementoDaMagia(ctx: ContextoSimulacao, e: Entidade, hab: Habilidade, tick: number): Elemento | null {
  if (e.encarnacao && efeitosDeSintonia(ctx, e, 'contaComoElemento', tick).some((ef) => ef.habilidade === hab.id)) return e.encarnacao;
  return hab.elemento;
}

/**
 * Ao lançar: uma magia ofensiva de elemento encarnável troca (ou renova) a encarnação; trocar logo depois da última
 * magia do elemento anterior funde os dois. Devolve se trocou.
 */
export function encarnar(ctx: ContextoSimulacao, e: Entidade, hab: Habilidade, tick: number): boolean {
  if (!ehMago(e)) return false;
  estenderOuRenovar(ctx, e, hab, tick);
  const conta = elementoDaMagia(ctx, e, hab, tick) !== hab.elemento;
  const novo = hab.formulaDano || conta ? elementoDaMagia(ctx, e, hab, tick) : null;
  if (!ehEncarnavel(novo) || !encarnaveis(ctx, e, tick).includes(novo)) return false;
  const r = ctx.balance.ajustesClasses.mago.encarnacao;
  const anterior = e.encarnacao;
  const ultimo = e.encarnacaoUltimoTick;
  e.encarnacaoAteTick = Math.max(e.encarnacaoAteTick ?? 0, tick + ticksDe(duracaoDaEncarnacao(ctx, e, tick)));
  e.encarnacaoUltimoTick = tick;
  if (anterior === novo) return false;
  e.encarnacao = novo;
  if (anterior && ultimo !== undefined && tick - ultimo <= ticksDe(r.duplaJanelaMs)) fundir(ctx, e, anterior, novo, tick);
  return true;
}

/** A encarnação dupla dos dois elementos (a vertente Alquimista fixa uma só). */
function fundir(ctx: ContextoSimulacao, e: Entidade, a: ElementoEncarnado, b: ElementoEncarnado, tick: number): void {
  const fixa = efeitosDeSintonia(ctx, e, 'duplaFixa', tick)[0]?.habilidade;
  const dupla = fixa ?? ctx.conteudo.sintonia.encarnacoesDuplas.find((d) => d.elementos.includes(a) && d.elementos.includes(b))?.id;
  if (!dupla) return;
  const extra = efeitosDeSintonia(ctx, e, 'duplaDuracao', tick).filter((ef) => ef.habilidade === dupla).reduce((s, ef) => s + ef.pct, 0);
  e.encarnacaoDupla = dupla;
  e.encarnacaoDuplaAteTick = tick + ticksDe(ctx.balance.ajustesClasses.mago.encarnacao.duplaDuracaoMs * (1 + extra / 100));
}

/** A encarnação dupla agora (id), se houver. */
export function duplaDe(e: Entidade, tick: number): string | null {
  return ehMago(e) && e.encarnacaoDupla && (e.encarnacaoDuplaAteTick ?? 0) > tick ? e.encarnacaoDupla : null;
}

/** Marco 24 (25/10/2026): os dois elementos da dupla ativa (para o visual), se houver. */
export function elementosDaDupla(ctx: Pick<ContextoSimulacao, 'conteudo'>, e: Entidade, tick: number): readonly [Elemento, Elemento] | null {
  const id = duplaDe(e, tick);
  const par = id ? ctx.conteudo.sintonia.encarnacoesDuplas.find((d) => d.id === id)?.elementos : undefined;
  if (!par || !ehElemento(par[0]) || !ehElemento(par[1])) return null;
  return [par[0], par[1]];
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

/** Raio: saltos extras das magias com projétil ou que já saltam. Marco 24: as duplas Plasma e Relâmpago negro somam. */
export function saltosEncarnacao(e: Entidade | undefined, hab: Habilidade, ctx?: ContextoSimulacao, tick = 0): number {
  if (!e || hab.tipoAtaque !== 'magico' || (hab.politicaImpacto !== 'projetil' && !hab.saltos)) return 0;
  const dupla = duplaDe(e, tick);
  const efeitos = dupla && ctx ? ctx.conteudo.sintonia.encarnacoesDuplas.find((d) => d.id === dupla)?.efeitos ?? [] : [];
  return (encarnacaoDe(e) === 'raio' ? 1 : 0) + efeitos.filter((ef) => ef.t === 'saltoExtra').reduce((s, ef) => s + ef.n, 0);
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
      delete e.encarnacaoUltimoTick;
      saida.push({ t: 'encarnacaoAcabou', tick: estado.tick, id: e.id });
    }
    // Marco 24 (D-095): a dupla acaba no tempo dela ou junto com a encarnação.
    if (e.encarnacaoDupla && (!e.encarnacao || (e.encarnacaoDuplaAteTick ?? 0) <= estado.tick)) {
      delete e.encarnacaoDupla;
      delete e.encarnacaoDuplaAteTick;
    }
  }
  if (estado.tick % Math.max(1, ticksDe(r.fogoIntervaloMs)) !== 0) return;
  for (const mago of estado.entidades) {
    if (!vivo(mago) || !encarnacaoDe(mago)) continue;
    // Marco 24 (D-095): o pulso das encarnações novas (veneno em volta, vida dos aliados perto na luz).
    pulsarEncarnacao(estado, ctx, mago, saida);
    if (encarnacaoDe(mago) !== 'fogo') continue;
    const centro = celulaOcupada(mago);
    for (const e of estado.entidades) {
      if (!vivo(e) || e === mago || !podeFerir(mago, e, ctx.modo) || chebyshev(centro, celulaOcupada(e)) > r.fogoRaio) continue;
      aplicarEfeito(estado, ctx, e, construirEfeito('queimando', { valor: r.fogoQueimaValor, duracaoMs: r.fogoQueimaMs }), { id: mago.id, x: mago.x, y: mago.y }, null, saida);
    }
  }
}
