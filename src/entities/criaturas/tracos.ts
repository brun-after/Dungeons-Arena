// Marco 45 (16/11/2026, D-181): o que os traços das criaturas de Filo fazem a cada tick — as auras, o elo do Zunzum,
// os fios do Marionetista, a furtividade do Silente, o sono do Sonequinha, o casco do Pedrico, o voo da Pluminha, o
// olhar lento do Guardião, a estase do Obelisco, as correntes de vento, a remontagem do Arqueiro de Osso e as reações
// aos terrenos elementais. Uma função pequena por traço; os números vêm do preset. Hostilidade só por `relacao()`.

import type { Celula } from '../../core/comandos';
import type { ContextoSimulacao } from '../../core/contexto';
import type { EstadoJogo } from '../../core/estado';
import type { EventoSimulacao } from '../../core/eventos-simulacao';
import { msDe, ticksDe } from '../../core/tempo';
import { anotarDeslocamento, aplicarEfeito } from '../../combat/efeitos';
import { celulaOcupada, chebyshev } from '../../combat/geometria';
import { construirEfeito, type EfeitoCanonico, type TipoEfeito } from '../../combat/registro-efeitos';
import { podeAjudar, podeFerir } from '../../modos/relacao';
import { ELEMENTO_DO_AMBIENTE } from '../../world/ambiente-tipos';
import { vizinhasLivres } from '../../combat/efeitos-fluxo';
import { emPasso, posicionar, vivo, type Entidade } from '../entidade';
import { reacaoAgora, presetDe, terrenoNa, terrenoSob } from './terreno';
import { porNaArena } from './chefes-base';
import type { EstadoCriatura, Traco } from './tipos';

/** De quanto em quanto tempo os estados de manutenção (lento, invisível, sem ação) são renovados, e por quanto. */
const PULSO_MS = 500;
const RENOVA_MS = 800;

export const criaturaDe = (e: Entidade): EstadoCriatura => (e.criatura ??= {});

function dar(estado: EstadoJogo, ctx: ContextoSimulacao, de: Entidade, alvo: Entidade, ef: EfeitoCanonico, saida: EventoSimulacao[], notificar = false): void {
  aplicarEfeito(estado, ctx, alvo, ef, { id: de.id, x: de.x, y: de.y }, null, saida, notificar);
}

function renovar(estado: EstadoJogo, ctx: ContextoSimulacao, de: Entidade, alvo: Entidade, tipo: TipoEfeito, pct: number, saida: EventoSimulacao[]): void {
  dar(estado, ctx, de, alvo, construirEfeito(tipo, { duracaoMs: RENOVA_MS, pct, valor: pct }), saida);
}

export const hostis = (estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, raio: number): Entidade[] =>
  estado.entidades.filter((o) => o !== e && vivo(o) && podeFerir(e, o, ctx.modo) && chebyshev(o, e) <= raio);

export const aliados = (estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, raio: number): Entidade[] =>
  estado.entidades.filter((o) => o !== e && vivo(o) && o.controlador === 'ia' && podeAjudar(e, o, ctx.modo) && !podeFerir(e, o, ctx.modo) && chebyshev(o, e) <= raio);

/** Se passou o relógio do traço (e o arma de novo); `chave` separa os relógios de uma mesma criatura. */
function vez(estado: EstadoJogo, e: Entidade, chave: string, ms: number): boolean {
  const c = criaturaDe(e);
  const relogios = (c.proximoTracoTick ??= {});
  if (estado.tick < (relogios[chave] ?? 0)) return false;
  relogios[chave] = estado.tick + Math.max(1, ticksDe(ms));
  return true;
}

/** As células do segmento de a até b (sem as pontas), pela linha de Bresenham. */
export function segmento(a: Celula, b: Celula): Celula[] {
  const saida: Celula[] = [];
  let { x, y } = a;
  const dx = Math.abs(b.x - x);
  const dy = -Math.abs(b.y - y);
  const sx = x < b.x ? 1 : -1;
  const sy = y < b.y ? 1 : -1;
  let err = dx + dy;
  for (let guarda = 0; guarda < 64 && (x !== b.x || y !== b.y); guarda++) {
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x += sx; }
    if (e2 <= dx) { err += dx; y += sy; }
    if (x !== b.x || y !== b.y) saida.push({ x, y });
  }
  return saida;
}

const parado = (e: Entidade): boolean => !emPasso(e) && e.caminho.length === 0;
const ultimoDano = (e: Entidade): number => e.participacao.reduce((m, p) => Math.max(m, p.tick), -Infinity);

/** O estado do elemento do terreno da célula (o que a criatura "leva" dele), ou null. */
export function estadoDoTerreno(estado: EstadoJogo, ctx: ContextoSimulacao, c: Celula): EfeitoCanonico | null {
  const t = terrenoNa(estado, ctx, c.x, c.y);
  const el = t ? ELEMENTO_DO_AMBIENTE[t] : null;
  const def = el ? ctx.conteudo.elementos.get(el) : undefined;
  return def && def.estado.duracaoMs > 0 ? def.estado : null;
}

// ——— As reações aos terrenos ————————————————————————————————————————————————————————————————————————————————

function reagirAoTerreno(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, saida: EventoSimulacao[]): void {
  const r = reacaoAgora(estado, ctx, e);
  if (r.vidaPct > 0) dar(estado, ctx, e, e, construirEfeito('escudo', { valor: Math.round((e.hpMax * r.vidaPct) / 100), duracaoMs: RENOVA_MS }), saida);
  if (r.velocidadePct > 0) renovar(estado, ctx, e, e, 'acelerado', r.velocidadePct, saida);
  if (r.velocidadePct < 0) renovar(estado, ctx, e, e, 'atolado', -r.velocidadePct, saida);
  if (r.curaPctPorS > 0 && e.hp < e.hpMax) e.hp = Math.min(e.hpMax, e.hp + Math.max(1, Math.round((e.hpMax * r.curaPctPorS * PULSO_MS) / 100000)));
  // A Candelinha e o Tiçãozinho na luz e nas brasas chamam um irmão (uma vez por vida).
  if (r.marcas.includes('dobra') && !criaturaDe(e).dividiu) dobrar(estado, ctx, e, saida);
  // A Bobinadora no campo elétrico salta para mais alvos; o Pregador na luz protege sozinho quem está perto.
  if (r.marcas.includes('maisSaltos')) dar(estado, ctx, e, e, construirEfeito('ab_multi_alvo', { valor: 2, duracaoMs: RENOVA_MS }), saida);
  if (r.marcas.includes('pregaDobro') && vez(estado, e, 'prega', 3000)) {
    for (const o of [e, ...aliados(estado, ctx, e, 4)]) dar(estado, ctx, e, o, construirEfeito('escudo', { valor: Math.round(o.hpMax / 10), duracaoMs: 3000 }), saida);
  }
  if (r.marcas.includes('juntar')) juntar(estado, ctx, e);
  // O Enxame no miasma e o Breuzinho na névoa somem nela.
  if (r.marcas.includes('invisivel')) renovar(estado, ctx, e, e, 'invisivel', 0, saida);
  // O Escultor de Geada na água a congela sob quem está nela (o gelo prende os pés).
  if (r.marcas.includes('ponte') && vez(estado, e, 'ponte', 3000)) {
    for (const h of hostis(estado, ctx, e, 3)) if (terrenoSob(estado, ctx, h) === 'agua') dar(estado, ctx, e, h, construirEfeito('atolado', { pct: 50, valor: 50, duracaoMs: 1500 }), saida, true);
  }
}

/** Os Gosminhos divididos na lama e no miasma se juntam de novo num só (a vida dos dois). */
function juntar(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade): void {
  if (!criaturaDe(e).dividiu || !vivo(e)) return;
  const outro = estado.entidades.find((o) => o !== e && vivo(o) && o.preset === e.preset && o.criatura?.dividiu && chebyshev(o, e) <= 1 && !o.criatura.donoId && podeAjudar(e, o, ctx.modo));
  if (!outro) return;
  e.hpMax = Math.max(e.hpMax, outro.hpMax);
  e.hp = Math.min(e.hpMax, e.hp + outro.hp);
  // O que entrou no outro não solta nada (some sem cair: conta como obra do que ficou).
  criaturaDe(outro).donoId = e.id;
  outro.hp = 0;
}

/** Uma cópia da criatura ao lado (sem a marca de novo: uma vez só por linhagem). */
function dobrar(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, saida: EventoSimulacao[]): void {
  criaturaDe(e).dividiu = true;
  const p = presetDe(ctx, e);
  if (!p || p.arquetipo === 'boss') return;
  dar(estado, ctx, e, e, construirEfeito('invocar', { valor: 1, duracaoMs: 20000, ref: p.id }), saida);
}

// ——— Os traços ———————————————————————————————————————————————————————————————————————————————————————————————

type Manipulador<T extends Traco['tipo']> = (estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, t: Extract<Traco, { tipo: T }>, saida: EventoSimulacao[]) => void;

const aura: Manipulador<'aura'> = (estado, ctx, e, t, saida) => {
  if (!vez(estado, e, 'aura', t.aCadaMs)) return;
  const quem = t.em === 'aliados' ? aliados(estado, ctx, e, t.raio) : hostis(estado, ctx, e, t.raio);
  for (const o of quem) for (const ef of t.efeitos) dar(estado, ctx, e, o, ef, saida);
};

const elo: Manipulador<'elo'> = (estado, ctx, e, t, saida) => {
  if (!vez(estado, e, 'elo', t.aCadaMs)) return;
  const grossa = reacaoAgora(estado, ctx, e).marcas.includes('linhaGrossa');
  // Cada par conta uma vez: só o de id menor puxa a linha.
  for (const par of aliados(estado, ctx, e, t.raio)) {
    if (par.preset !== e.preset || par.id < e.id) continue;
    const celulas = segmento(celulaOcupada(e), celulaOcupada(par));
    for (const h of estado.entidades) {
      if (!vivo(h) || !podeFerir(e, h, ctx.modo)) continue;
      const c = celulaOcupada(h);
      if (!celulas.some((x) => x.x === c.x && x.y === c.y)) continue;
      dar(estado, ctx, e, h, construirEfeito('dano_direto', { valor: t.dano }), saida, true);
      for (const ef of t.efeitos) dar(estado, ctx, e, h, ef, saida);
      if (grossa) dar(estado, ctx, e, h, construirEfeito('atordoar', { duracaoMs: 300 }), saida);
    }
  }
};

const furtivo: Manipulador<'furtivo'> = (estado, ctx, e, t, saida) => {
  if (!vez(estado, e, 'furtivo', PULSO_MS)) return;
  const perto = estado.entidades.some((o) => o.controlador !== 'ia' && vivo(o) && podeFerir(e, o, ctx.modo) && chebyshev(o, e) <= t.distancia);
  if (!perto && !reacaoAgora(estado, ctx, e).marcas.includes('visivel')) renovar(estado, ctx, e, e, 'invisivel', 0, saida);
};

const sono: Manipulador<'sono'> = (estado, ctx, e, t, saida) => {
  const c = criaturaDe(e);
  c.dormindo = estado.tick - ultimoDano(e) >= ticksDe(t.semDanoMs) && !!e.ia && e.ia.modo === 'perseguindo';
  if (!c.dormindo || !vez(estado, e, 'sono', t.aCadaMs)) return;
  for (const o of aliados(estado, ctx, e, t.raio)) dar(estado, ctx, e, o, construirEfeito('cura', { valor: t.cura }), saida);
  // Sobre um terreno, o sonho leva o elemento dele a quem está perto.
  const ef = reacaoAgora(estado, ctx, e).marcas.includes('sonhaTerreno') ? estadoDoTerreno(estado, ctx, celulaOcupada(e)) : null;
  if (ef) for (const h of hostis(estado, ctx, e, t.raio)) dar(estado, ctx, e, h, ef, saida);
};

const fios: Manipulador<'fios'> = (estado, ctx, e, t, saida) => {
  if (!vez(estado, e, 'fios', PULSO_MS)) return;
  const c = criaturaDe(e);
  const presos = (c.fios ?? []).flatMap((id) => {
    const o = estado.entidades.find((x) => x.id === id);
    if (!o || !vivo(o) || chebyshev(o, e) > t.raio) return [];
    // Quem passa pelo fio o corta.
    const linha = segmento(celulaOcupada(e), celulaOcupada(o));
    const cortou = estado.entidades.some((h) => vivo(h) && h.controlador !== 'ia' && podeFerir(e, h, ctx.modo) && linha.some((x) => x.x === Math.round(h.x) && x.y === Math.round(h.y)));
    return cortou ? [] : [o];
  });
  for (const o of aliados(estado, ctx, e, t.raio)) {
    if (presos.length >= t.max) break;
    if (!presos.includes(o) && o.arquetipo !== 'boneco' && o.preset !== e.preset) presos.push(o);
  }
  c.fios = presos.map((o) => o.id);
  c.fiosOcultos = reacaoAgora(estado, ctx, e).marcas.includes('fiosInvisiveis');
  for (const o of presos) renovar(estado, ctx, e, o, 'bonus_dano', t.bonusPct, saida);
};

const enrolar: Manipulador<'enrolar'> = (estado, ctx, e, t, saida) => {
  const c = criaturaDe(e);
  const caca = e.ia?.modo === 'perseguindo';
  if (!caca) { delete c.enroladoAteTick; return; }
  if (c.enroladoAteTick === undefined || (estado.tick >= c.enroladoAteTick && estado.tick >= (c.abertoAteTick ?? 0))) {
    c.enroladoAteTick = estado.tick + ticksDe(t.fechadoMs);
    c.abertoAteTick = c.enroladoAteTick + ticksDe(t.abertoMs);
  }
  if (estado.tick < c.enroladoAteTick) {
    if (vez(estado, e, 'casco', PULSO_MS)) for (const tipo of ['sem_movimento', 'sem_ataque'] as const) renovar(estado, ctx, e, e, tipo, 0, saida);
    return;
  }
  // Na lama, abre atrás de quem caça (uma vez por ciclo).
  if (reacaoAgora(estado, ctx, e).marcas.includes('enterra') && vez(estado, e, 'enterra', t.fechadoMs + t.abertoMs)) {
    const alvo = e.ia?.alvoId ? estado.entidades.find((x) => x.id === e.ia?.alvoId) : undefined;
    const atras = alvo ? vizinhasLivres(estado, ctx, e, celulaOcupada(alvo)).sort((a, b) => chebyshev(b, e) - chebyshev(a, e))[0] : undefined;
    if (atras) {
      const de = { x: e.x, y: e.y };
      posicionar(e, atras.x, atras.y);
      e.caminho = [];
      anotarDeslocamento(saida, estado.tick, e, de.x, de.y, { id: e.id, x: de.x, y: de.y }, 'teleporte');
    }
  }
};

/** O casco do Pedrico fechado agora (os golpes quase não entram). */
export const enrolado = (estado: EstadoJogo, e: Entidade): boolean => estado.tick < (e.criatura?.enroladoAteTick ?? -1);

const regenParado: Manipulador<'regenParado'> = (estado, _ctx, e, t) => {
  if (!vez(estado, e, 'regen', 1000) || !parado(e) || e.hp >= e.hpMax) return;
  e.hp = Math.min(e.hpMax, e.hp + Math.max(1, Math.round((e.hpMax * t.pctPorS) / 100)));
};

const estase: Manipulador<'estase'> = (estado, ctx, e, t, saida) => {
  if (!vez(estado, e, 'estase', PULSO_MS) || reacaoAgora(estado, ctx, e).marcas.includes('semCampo')) return;
  for (const h of hostis(estado, ctx, e, t.raio)) renovar(estado, ctx, e, h, 'atolado', t.lentidaoPct, saida);
};

/** A redução de dano que os obeliscos dão a quem está no campo deles (%). */
export function protecaoDaEstase(estado: EstadoJogo, ctx: ContextoSimulacao, alvo: Entidade): number {
  let pct = 0;
  for (const o of estado.entidades) {
    if (o === alvo || !vivo(o) || o.controlador !== 'ia') continue;
    const t = presetDe(ctx, o)?.tracos.find((x): x is Extract<Traco, { tipo: 'estase' }> => x.tipo === 'estase');
    if (t && chebyshev(o, alvo) <= t.raio && !podeFerir(o, alvo, ctx.modo) && !reacaoAgora(estado, ctx, o).marcas.includes('semCampo')) pct = Math.max(pct, t.reducaoAliadosPct);
  }
  return pct;
}

const penitencia: Manipulador<'penitencia'> = (estado, ctx, e, t, saida) => {
  if (!vez(estado, e, 'penitencia', PULSO_MS)) return;
  const perdida = Math.round(((e.hpMax - e.hp) * 100) / Math.max(1, e.hpMax));
  if (perdida > 0) renovar(estado, ctx, e, e, 'acelerado', Math.min(60, perdida * t.porPct), saida);
};

const frontal: Manipulador<'frontal'> = (estado, ctx, e, t) => {
  const c = criaturaDe(e);
  const alvo = e.ia?.alvoId ? estado.entidades.find((x) => x.id === e.ia?.alvoId) : undefined;
  if (!alvo) return;
  const quer = (Math.atan2(alvo.y - e.y, alvo.x - e.x) * 180) / Math.PI;
  const atual = c.olharGraus ?? quer;
  const lento = reacaoAgora(estado, ctx, e).marcas.includes('giroLento') ? 0.5 : 1;
  const passo = (t.giroGrausPorS * lento * msDe(1)) / 1000;
  let diff = ((quer - atual + 540) % 360) - 180;
  diff = Math.max(-passo, Math.min(passo, diff));
  c.olharGraus = atual + diff;
};

/** O golpe vem da frente do escudo (dentro do cone): o Guardião de Mármore não o sente. */
export function bloqueiaPelaFrente(ctx: ContextoSimulacao, alvo: Entidade, de: Celula): boolean {
  const t = presetDe(ctx, alvo)?.tracos.find((x): x is Extract<Traco, { tipo: 'frontal' }> => x.tipo === 'frontal');
  const olhar = alvo.criatura?.olharGraus;
  if (!t || olhar === undefined || (de.x === Math.round(alvo.x) && de.y === Math.round(alvo.y))) return false;
  const ang = (Math.atan2(de.y - alvo.y, de.x - alvo.x) * 180) / Math.PI;
  const diff = Math.abs(((ang - olhar + 540) % 360) - 180);
  return diff <= t.coneGraus / 2;
}

const flutuar: Manipulador<'flutuar'> = (estado, ctx, e, t, saida) => {
  const c = criaturaDe(e);
  if (e.ia?.modo !== 'perseguindo') return;
  if (estado.tick >= (c.chaoAteTick ?? 0) && estado.tick >= (c.noArAteTick ?? 0)) {
    c.noArAteTick = estado.tick + ticksDe(t.noArMs);
    c.chaoAteTick = c.noArAteTick + ticksDe(t.chaoMs);
  }
  // A descida: sopra quem está colado (e leva o terreno de onde pousa).
  if (estado.tick === c.noArAteTick) {
    const leva = reacaoAgora(estado, ctx, e).marcas.includes('levaTerreno') ? estadoDoTerreno(estado, ctx, celulaOcupada(e)) : null;
    for (const h of hostis(estado, ctx, e, 1)) {
      dar(estado, ctx, e, h, construirEfeito('empurrao', { valor: 1 }), saida, true);
      if (leva) dar(estado, ctx, e, h, leva, saida);
    }
  }
};

/** No ar (a Pluminha flutuando): o golpe de perto não a alcança. */
export const flutuando = (estado: EstadoJogo, e: Entidade): boolean => estado.tick < (e.criatura?.noArAteTick ?? -1);

const correntes: Manipulador<'correntes'> = (estado, ctx, e, t, saida) => {
  const c = criaturaDe(e);
  c.faixas = (c.faixas ?? []).filter((f) => f.ateTick > estado.tick);
  const alvo = e.ia?.modo === 'perseguindo' && e.ia.alvoId ? estado.entidades.find((x) => x.id === e.ia?.alvoId) : undefined;
  if (alvo && c.faixas.length === 0) {
    const dx = Math.sign(Math.round(alvo.x) - Math.round(e.x));
    const dy = Math.sign(Math.round(alvo.y) - Math.round(e.y));
    // A faixa atravessa o alvo de lado: empurra para fora da linha até o Ciclonista.
    const lado = dx !== 0 && dy !== 0 ? { dx, dy: -dy } : { dx: dy, dy: dx };
    if (lado.dx !== 0 || lado.dy !== 0) {
      const meio = Math.floor(t.comprimento / 2);
      c.faixas.push({ x: Math.round(alvo.x) - lado.dx * meio, y: Math.round(alvo.y) - lado.dy * meio, dx: lado.dx, dy: lado.dy, n: t.comprimento, ateTick: estado.tick + ticksDe(t.ms) });
    }
  }
  if (!vez(estado, e, 'correntes', t.aCadaMs)) return;
  const leva = reacaoAgora(estado, ctx, e).marcas.includes('levaTerreno');
  for (const f of c.faixas) {
    for (const h of estado.entidades) {
      if (!vivo(h) || !podeFerir(e, h, ctx.modo)) continue;
      const k = [...Array(f.n).keys()].find((i) => Math.round(h.x) === f.x + f.dx * i && Math.round(h.y) === f.y + f.dy * i);
      if (k === undefined) continue;
      // O empurrão sai de trás de quem está na faixa, no sentido dela.
      aplicarEfeito(estado, ctx, h, construirEfeito('empurrao', { valor: 1 }), { id: e.id, x: h.x - f.dx, y: h.y - f.dy }, null, saida, false);
      const est = leva ? estadoDoTerreno(estado, ctx, { x: f.x + f.dx * k, y: f.y + f.dy * k }) : null;
      if (est) dar(estado, ctx, e, h, est, saida);
    }
  }
};

const placas: Manipulador<'placas'> = (estado, ctx, e, t, saida) => {
  const c = criaturaDe(e);
  c.placas ??= t.qtd;
  if (c.placas < t.qtd && reacaoAgora(estado, ctx, e).marcas.includes('recompoe') && vez(estado, e, 'placa', 3000)) {
    c.placas++;
    if (c.placas > 0) c.furia = false;
  }
  if (c.placas === 0 && !c.furia) {
    c.furia = true;
    for (const ef of t.furia) dar(estado, ctx, e, e, ef, saida, true);
  }
};

const remontar: Manipulador<'remontar'> = (estado, _ctx, e, t) => {
  const c = criaturaDe(e);
  if (c.remontaTick === undefined || estado.tick < c.remontaTick) return;
  delete c.remontaTick;
  e.hp = Math.max(1, Math.round((e.hpMax * t.vidaPct) / 100));
  e.efeitos = e.efeitos.filter((f) => f.origemId !== `remonta:${e.id}`);
};

// O Riscador fecha o anel: com `runas` runas dele em volta do alvo, o alvo fica preso (e as runas se gastam).
const anelDeRunas: Manipulador<'anel'> = (estado, ctx, e, t, saida) => {
  if (!vez(estado, e, 'anel', PULSO_MS)) return;
  const alvo = e.ia?.modo === 'perseguindo' && e.ia.alvoId ? estado.entidades.find((x) => x.id === e.ia?.alvoId) : undefined;
  if (!alvo || !vivo(alvo)) return;
  // Sobre um terreno, as runas novas herdam o elemento dele.
  const herda = reacaoAgora(estado, ctx, e).marcas.includes('herdaElemento') ? estadoDoTerreno(estado, ctx, celulaOcupada(e)) : null;
  if (herda) for (const a of estado.armadilhas) if (a.donoId === e.id && a.origem === 'habilidade' && a.interno?.tipo !== herda.tipo && a.interno?.tipo !== 'aterrorizado') a.interno = { ...herda };
  const minhas = estado.armadilhas.filter((a) => a.donoId === e.id && chebyshev(a, alvo) <= t.raio);
  if (minhas.length < t.runas) return;
  estado.armadilhas = estado.armadilhas.filter((a) => !minhas.includes(a));
  dar(estado, ctx, e, alvo, construirEfeito('sem_movimento', { duracaoMs: t.prendeMs }), saida, true);
};

// O Para-raios engole os raios hostis que passam perto e devolve um a cada `devolverACada` (na poça, a todos em volta).
const paraRaios: Manipulador<'paraRaios'> = (estado, ctx, e, t, saida) => {
  const c = criaturaDe(e);
  const pegos = estado.projeteis.filter((pr) => {
    if (Math.max(Math.abs(pr.x - e.x), Math.abs(pr.y - e.y)) > t.raio || ctx.conteudo.habilidades.get(pr.habilidadeId)?.elemento !== 'raio') return false;
    const dono = estado.entidades.find((x) => x.id === pr.donoId);
    return !!dono && dono !== e && podeFerir(e, dono, ctx.modo);
  });
  if (pegos.length === 0) return;
  estado.projeteis = estado.projeteis.filter((pr) => !pegos.includes(pr));
  for (const pr of pegos) {
    c.raios = (c.raios ?? 0) + 1;
    saida.push({ t: 'efeitoResultado', tick: estado.tick, alvoId: e.id, origemId: pr.donoId, tipo: 'imune_dano', dano: 0, cura: 0, mana: 0 });
    if (c.raios % t.devolverACada !== 0) continue;
    const poca = reacaoAgora(estado, ctx, e).marcas.includes('poca');
    const dono = estado.entidades.find((x) => x.id === pr.donoId);
    const alvos = poca ? hostis(estado, ctx, e, 3) : dono && vivo(dono) ? [dono] : [];
    for (const a of alvos) dar(estado, ctx, e, a, construirEfeito('dano_direto', { valor: Math.max(4, Math.round(e.hpMax / 8)) }), saida);
  }
};

// A Candelinha denuncia: quem está escondido perto dela aparece (e fica marcado para os outros).
const denuncia: Manipulador<'denuncia'> = (estado, ctx, e, t, saida) => {
  if (!vez(estado, e, 'denuncia', PULSO_MS)) return;
  for (const o of estado.entidades) {
    if (o === e || !vivo(o) || !podeFerir(e, o, ctx.modo) || chebyshev(o, e) > t.raio) continue;
    if (o.invisivelAteTick <= estado.tick) continue;
    o.invisivelAteTick = estado.tick;
    dar(estado, ctx, e, o, construirEfeito('marcado', { duracaoMs: 3000 }), saida, true);
  }
};

/** O Fundeiro: a pedra que acerta fica no chão ao lado do alvo (cobertura de quem souber usar); na lama, afunda. */
export function largarPedra(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, alvo: Entidade, saida: EventoSimulacao[]): void {
  const t = presetDe(ctx, e)?.tracos.find((x) => x.tipo === 'pedras');
  const chao = terrenoNa(estado, ctx, Math.round(alvo.x), Math.round(alvo.y));
  if (!t || (chao && presetDe(ctx, e)?.naFenda[chao]?.marcas.includes('afunda'))) return;
  if ((e.criatura?.objetos ?? []).filter((id) => estado.entidades.some((x) => x.id === id && vivo(x))).length >= 3) return;
  const pedra = porNaArena(estado, ctx, e, 'pedregulho', { x: Math.round(alvo.x) + 1, y: Math.round(alvo.y) }, saida);
  if (pedra?.criatura) pedra.criatura.someTick = estado.tick + ticksDe(t.ms);
}

const MANIPULADORES: { [T in Traco['tipo']]?: Manipulador<T> } = {
  aura, elo, furtivo, sono, fios, enrolar, regenParado, estase, penitencia, frontal, flutuar, correntes, placas, remontar,
  anel: anelDeRunas, paraRaios, denuncia,
};

function rodarTraco(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, t: Traco, saida: EventoSimulacao[]): void {
  const m = MANIPULADORES[t.tipo] as Manipulador<Traco['tipo']> | undefined;
  if (m) m(estado, ctx, e, t, saida);
}

/** O tick dos traços: só as criaturas acordadas (as que a IA pensa). */
export function processarTracos(estado: EstadoJogo, ctx: ContextoSimulacao, acordada: (e: Entidade) => boolean, saida: EventoSimulacao[]): void {
  for (const e of estado.entidades) {
    if (e.controlador !== 'ia' || !acordada(e)) continue;
    // O objeto com prazo (a pedra do Fundeiro) se desfaz.
    if (e.criatura?.someTick !== undefined && estado.tick >= e.criatura.someTick && vivo(e)) { e.hp = 0; continue; }
    const p = presetDe(ctx, e);
    if (!p || (p.tracos.length === 0 && Object.keys(p.naFenda).length === 0)) continue;
    // O desmontado espera no chão (só o relógio da remontagem anda).
    if (e.criatura?.remontaTick !== undefined) {
      for (const t of p.tracos) if (t.tipo === 'remontar') rodarTraco(estado, ctx, e, t, saida);
      continue;
    }
    if (!vivo(e)) continue;
    if (terrenoSob(estado, ctx, e) && vez(estado, e, 'fenda', PULSO_MS)) reagirAoTerreno(estado, ctx, e, saida);
    for (const t of p.tracos) rodarTraco(estado, ctx, e, t, saida);
    encolherNaLuz(estado, ctx, e);
  }
}

/** O Faminto na luz sagrada perde o que comeu (chamado pelo tick dos traços). */
function encolherNaLuz(estado: EstadoJogo, ctx: ContextoSimulacao, f: Entidade): void {
  const c = f.criatura;
  if (!c?.comidos || !reacaoAgora(estado, ctx, f).marcas.includes('encolhe')) return;
  const t = presetDe(ctx, f)?.tracos.find((x) => x.tipo === 'faminto');
  if (!t) return;
  const base = Math.round(f.hpMax / (1 + (c.comidos * t.porMortePct) / 100));
  f.hpMax = Math.max(1, base);
  f.hp = Math.min(f.hp, f.hpMax);
  c.comidos = 0;
}
