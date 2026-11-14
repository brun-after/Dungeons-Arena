// Marco 40 (13/11/2026, D-164): o movimento da classe. Cada classe tem três mecânicas (data/movimentos.json), uma
// ativa por vez: o Shift usa a ativa e o G troca entre as liberadas (níveis 1, 10 e 20; os marcos 30/50/70/90 mudam os
// números). Sem dano direto. A primeira de cada classe é a de longa distância — o Voo Arcano do Mago, a Tirolesa do
// Arqueiro, a Marcha de Guerra do Guerreiro, a Forma de Névoa do Necromante e o Lobo do Aventureiro —, rápida fora de
// combate (`balance.movimentoClasse.viagemPct`) e limitada em combate, com limites que melhoram com o nível.
// As outras são curtas (avanço, salto, teleporte, recuo, âncora, troca de corpo, camuflagem, montaria pesada).

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import { Leitor } from '../core/validar';
import { posicionar, vivo, type Entidade, type ModoDeMovimento } from '../entities/entidade';
import { emCombate } from '../progression/buffs';
import { aplicarEfeito } from './efeitos';
import { furiaAtual } from './furia';
import { avancar, teleportar } from './efeitos-instantaneos';
import { chebyshev } from './geometria';
import type { Habilidade } from './habilidades';
import { construirEfeito } from './registro-efeitos';
import { corpoCabe } from '../world/corpo';
import { passavel } from '../world/fase';

export const TIPOS_MOVIMENTO = ['voo', 'tirolesa', 'marcha', 'nevoa', 'montaria', 'avanco', 'salto', 'teleporte', 'recuo', 'ancora', 'troca', 'camuflagem'] as const;
export type TipoMovimento = (typeof TIPOS_MOVIMENTO)[number];

/** Os números de uma mecânica (os marcos sobrescrevem a partir do nível deles). */
export interface ParametrosMovimento {
  alcance: number;
  alcanceCombate: number;
  velocidade: number;
  recargaMs: number;
  cargas: number;
  duracaoMs: number;
  preparoMs: number;
  lentidaoPct: number;
  furiaPorS: number;
  /** Montaria: não cai no primeiro golpe. */
  segura: number;
}

export interface MovimentoDaClasse {
  id: string;
  nivel: number;
  tipo: TipoMovimento;
  icone: string;
  cor: string;
  pesada: boolean;
  base: ParametrosMovimento;
  marcos: ReadonlyMap<number, Partial<ParametrosMovimento>>;
}

const CAMPOS: readonly (keyof ParametrosMovimento)[] = ['alcance', 'alcanceCombate', 'velocidade', 'recargaMs', 'cargas', 'duracaoMs', 'preparoMs', 'lentidaoPct', 'furiaPorS', 'segura'];

export function lerMovimentos(json: unknown): { movimentos: Map<string, MovimentoDaClasse[]>; erros: string[] } {
  const l = new Leitor('movimentos.json');
  const saida = new Map<string, MovimentoDaClasse[]>();
  const classes = l.objeto(l.objeto(json, 'raiz').classes, 'classes');
  for (const [classe, lista] of Object.entries(classes)) {
    const itens: MovimentoDaClasse[] = [];
    for (const bruto of Array.isArray(lista) ? lista : []) {
      const o = l.objeto(bruto, `${classe}.movimento`);
      const numeros = (x: Record<string, unknown>): Partial<ParametrosMovimento> => {
        const p: Partial<ParametrosMovimento> = {};
        for (const k of CAMPOS) if (x[k] !== undefined) p[k] = l.numero(x, k, { min: 0, max: 60_000 });
        return p;
      };
      const marcos = new Map<number, Partial<ParametrosMovimento>>();
      for (const [n, m] of Object.entries(l.objeto(o.marcos ?? {}, 'marcos'))) marcos.set(Number(n), numeros(l.objeto(m, `marco ${n}`)));
      const b = numeros(o);
      itens.push({
        id: l.texto(o, 'id'),
        nivel: l.numero(o, 'nivel', { min: 1, max: 100, inteiro: true }),
        tipo: l.opcao(o, 'tipo', TIPOS_MOVIMENTO),
        icone: l.texto(o, 'icone'),
        cor: l.texto(o, 'cor'),
        pesada: o.pesada === true,
        base: { alcance: 0, alcanceCombate: 0, velocidade: 12, recargaMs: 3000, cargas: 1, duracaoMs: 0, preparoMs: 0, lentidaoPct: 0, furiaPorS: 0, segura: 0, ...b },
        marcos,
      });
    }
    saida.set(classe, itens);
  }
  return { movimentos: saida, erros: l.erros };
}

const classeDe = (e: Entidade) => e.bolsa?.classeId ?? e.classeId ?? '';

/** As mecânicas que a entidade já tem (pelo nível). */
export function movimentosLiberados(ctx: ContextoSimulacao, e: Entidade): MovimentoDaClasse[] {
  return (ctx.conteudo.movimentos.get(classeDe(e)) ?? []).filter((m) => m.nivel <= e.nivel);
}

export function parametros(m: MovimentoDaClasse, nivel: number): ParametrosMovimento {
  const p = { ...m.base };
  for (const [n, extra] of [...m.marcos].sort((a, b) => a[0] - b[0])) if (nivel >= n) Object.assign(p, extra);
  return p;
}

/** O valor do par [nível 1, nível 100] no nível de agora. */
const pelaEvolucao = (par: readonly [number, number], nivel: number) => par[0] + ((par[1] - par[0]) * (Math.min(100, Math.max(1, nivel)) - 1)) / 99;

export function movimentoAtivo(ctx: ContextoSimulacao, e: Entidade): MovimentoDaClasse | null {
  const liberados = movimentosLiberados(ctx, e);
  return liberados.find((m) => m.id === e.movimentoClasse?.ativo) ?? liberados[0] ?? null;
}

const modo = (e: Entidade): ModoDeMovimento | undefined => e.movimentoClasse?.modo;
/** Voando (não decolando): fora do alcance do que está no chão (armadilhas, rastros, campos, golpes de perto). */
export const noAr = (e: Entidade): boolean => modo(e)?.tipo === 'voo';
/** Quem atravessa os corpos (a tirolesa, a névoa). */
export const atravessaCorpos = (e: Entidade): boolean => modo(e)?.tipo === 'tirolesa' || modo(e)?.tipo === 'nevoa';
export const naTirolesa = (e: Entidade): boolean => modo(e)?.tipo === 'tirolesa';

function terminar(estado: EstadoJogo, e: Entidade, saida: EventoSimulacao[]): void {
  const m = e.movimentoClasse?.modo;
  if (!m || !e.movimentoClasse) return;
  delete e.movimentoClasse.modo;
  saida.push({ t: 'movimentoClasse', tick: estado.tick, id: e.id, mov: m.id, fase: 'fim' });
}

/** A tirolesa bateu ou acabou. */
export function fimDaTirolesa(estado: EstadoJogo, e: Entidade, saida: EventoSimulacao[]): void {
  if (naTirolesa(e)) terminar(estado, e, saida);
}

/** Gasta uma carga (cada carga volta `recargaMs` depois); false se nenhuma está pronta. */
function gastarCarga(estado: EstadoJogo, e: Entidade, m: MovimentoDaClasse, p: ParametrosMovimento): boolean {
  const mc = (e.movimentoClasse ??= { ativo: m.id, cargas: {} });
  const prontas = (mc.cargas[m.id] ?? []).filter((t) => t > estado.tick);
  if (prontas.length >= Math.max(1, p.cargas)) return false;
  mc.cargas[m.id] = [...prontas, estado.tick + ticksDe(p.recargaMs)];
  return true;
}

/** G: a próxima mecânica liberada (desfaz o modo em curso). */
export function trocarMovimento(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, saida: EventoSimulacao[]): void {
  const liberados = movimentosLiberados(ctx, e);
  if (liberados.length === 0) return;
  const atual = movimentoAtivo(ctx, e);
  const i = atual ? liberados.indexOf(atual) : -1;
  const proximo = liberados[(i + 1) % liberados.length];
  if (!proximo) return;
  terminar(estado, e, saida);
  (e.movimentoClasse ??= { ativo: proximo.id, cargas: {} }).ativo = proximo.id;
  saida.push({ t: 'movimentoClasse', tick: estado.tick, id: e.id, mov: proximo.id, fase: 'ativo' });
}

/** Para onde a mecânica vai: o rumo pedido, o de quem anda ou para onde olha. */
function rumoDe(e: Entidade, dx?: number, dy?: number): { dx: number; dy: number } {
  const [ux, uy] = dx !== undefined && dy !== undefined && (dx !== 0 || dy !== 0) ? [dx, dy] : e.direcao !== 'parado' && (e.rumoX !== 0 || e.rumoY !== 0) ? [e.rumoX, e.rumoY] : RUMOS[e.olhando ?? 'S'];
  const n = Math.hypot(ux, uy) || 1;
  return { dx: ux / n, dy: uy / n };
}
const RUMOS: Record<NonNullable<Entidade['olhando']>, [number, number]> = { N: [0, -1], NE: [1, -1], E: [1, 0], SE: [1, 1], S: [0, 1], SO: [-1, 1], O: [-1, 0], NO: [-1, -1] };

/** A célula a `n` células no rumo. */
const aFrente = (e: Entidade, r: { dx: number; dy: number }, n: number) => ({ x: Math.round(e.x + r.dx * n), y: Math.round(e.y + r.dy * n) });

/** Shift: usa (ou desfaz) a mecânica ativa. */
export function usarMovimento(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, saida: EventoSimulacao[], dx?: number, dy?: number): void {
  const m = movimentoAtivo(ctx, e);
  if (!m || !vivo(e)) return;
  const p = parametros(m, e.nivel);
  const tick = estado.tick;
  const recusar = (motivo: string) => { saida.push({ t: 'movimentoClasse', tick, id: e.id, mov: m.id, fase: 'recusado', motivo }); };
  const atual = modo(e);
  // Os modos de longa distância ligam e desligam no mesmo botão.
  if (atual && atual.id === m.id && atual.tipo !== 'tirolesa') {
    // Não pousa onde não se anda (o telhado, a água funda).
    if (atual.tipo === 'voo' && (!passavel(ctx.fase, e.x, e.y) || !corpoCabe(ctx.fase, e.px, e.py, ctx.balance.movimento.raioCorpo))) { recusar('pouso'); return; }
    terminar(estado, e, saida);
    return;
  }
  if (atual) terminar(estado, e, saida);
  const combate = emCombate(estado, ctx, e);
  const iniciar = (tipo: ModoDeMovimento['tipo'], extra: Partial<ModoDeMovimento> = {}) => {
    (e.movimentoClasse ??= { ativo: m.id, cargas: {} }).modo = { tipo, id: m.id, desdeTick: tick, ...extra };
    saida.push({ t: 'movimentoClasse', tick, id: e.id, mov: m.id, fase: 'inicio' });
  };
  const r = rumoDe(e, dx, dy);
  switch (m.tipo) {
    case 'voo':
    case 'montaria': {
      if (!gastarCarga(estado, e, m, p)) { recusar('recarga'); return; }
      const preparo = p.preparoMs || (m.tipo === 'voo' ? ctx.balance.movimentoClasse.voo.preparoMs : ctx.balance.movimentoClasse.preparoPadraoMs);
      iniciar('preparo', { ateTick: tick + ticksDe(preparo), destino: m.tipo === 'voo' ? 'voo' : 'montado', ...(m.pesada && { pesada: true }) });
      return;
    }
    case 'marcha':
      if (!gastarCarga(estado, e, m, p)) { recusar('recarga'); return; }
      iniciar('marcha');
      return;
    case 'nevoa': {
      if (!gastarCarga(estado, e, m, p)) { recusar('recarga'); return; }
      // Em combate, uma fuga curta; fora dele, a viagem (até entrar em combate).
      iniciar('nevoa', combate ? { ateTick: tick + ticksDe(p.duracaoMs) } : {});
      aplicarEfeito(estado, ctx, e, construirEfeito('imune_dano', { duracaoMs: combate ? p.duracaoMs : 1000 }), { id: e.id, x: e.x, y: e.y }, null, saida);
      return;
    }
    case 'tirolesa':
      if (!gastarCarga(estado, e, m, p)) { recusar('recarga'); return; }
      iniciar('tirolesa', { rumoX: r.dx, rumoY: r.dy, restante: combate ? p.alcanceCombate : p.alcance, velocidade: p.velocidade });
      return;
    case 'camuflagem':
      if (!gastarCarga(estado, e, m, p)) { recusar('recarga'); return; }
      iniciar('camuflado', { ateTick: tick + ticksDe(p.duracaoMs), lentidaoPct: p.lentidaoPct });
      e.invisivelAteTick = Math.max(e.invisivelAteTick, tick + ticksDe(p.duracaoMs));
      return;
    case 'avanco':
    case 'recuo':
    case 'salto':
    case 'teleporte': {
      const rumo = m.tipo === 'recuo' ? { dx: -r.dx, dy: -r.dy } : r;
      const destino = aFrente(e, rumo, p.alcance);
      if (!gastarCarga(estado, e, m, p)) { recusar('recarga'); return; }
      const { x, y } = e;
      const ok = m.tipo === 'avanco' || m.tipo === 'recuo' ? avancar(estado, ctx, e, destino, p.alcance) : teleportar(estado, ctx, e, destino);
      if (!ok) { recusar('bloqueado'); return; }
      saida.push({ t: 'deslocado', tick: estado.tick, id: e.id, deX: x, deY: y, paraX: e.x, paraY: e.y, origemId: e.id, causa: m.tipo === 'teleporte' ? 'teleporte' : 'avanco' });
      saida.push({ t: 'movimentoClasse', tick, id: e.id, mov: m.id, fase: 'inicio' });
      return;
    }
    case 'ancora': {
      const mc = (e.movimentoClasse ??= { ativo: m.id, cargas: {} });
      const ancora = mc.ancora && mc.ancora.ateTick > tick ? mc.ancora : undefined;
      if (!ancora) {
        if (!gastarCarga(estado, e, m, p)) { recusar('recarga'); return; }
        mc.ancora = { x: e.x, y: e.y, ateTick: tick + ticksDe(p.duracaoMs) };
        saida.push({ t: 'movimentoClasse', tick, id: e.id, mov: m.id, fase: 'inicio' });
        return;
      }
      if (chebyshev(e, ancora) > p.alcance) { recusar('longe'); return; }
      delete mc.ancora;
      iniciar('preparo', { ateTick: tick + ticksDe(1000), destino: 'ancora', x: ancora.x, y: ancora.y });
      return;
    }
    case 'troca': {
      const servo = estado.entidades.filter((s) => vivo(s) && s.invocacao?.donoId === e.id && !s.invocacao.companheiro && chebyshev(s, e) <= p.alcance)
        .sort((a, b) => (a.id === e.alvoSelecionado ? -1 : 0) - (b.id === e.alvoSelecionado ? -1 : 0) || chebyshev(b, e) - chebyshev(a, e))[0];
      if (!servo) { recusar('sem_servo'); return; }
      if (!gastarCarga(estado, e, m, p)) { recusar('recarga'); return; }
      const { x, y } = e;
      posicionar(e, servo.x, servo.y);
      posicionar(servo, x, y);
      saida.push({ t: 'deslocado', tick: estado.tick, id: e.id, deX: x, deY: y, paraX: e.x, paraY: e.y, origemId: e.id, causa: 'teleporte' });
      saida.push({ t: 'movimentoClasse', tick, id: e.id, mov: m.id, fase: 'inicio' });
      return;
    }
  }
}

/** A cada tick: o preparo que termina, a névoa e a camuflagem que vencem, a fúria da marcha, a montaria que cai. */
export function processarMovimentoClasse(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  const tick = estado.tick;
  const b = ctx.balance.movimentoClasse;
  for (const e of estado.entidades) {
    const m = e.movimentoClasse?.modo;
    if (!m) continue;
    if (!vivo(e)) { terminar(estado, e, saida); continue; }
    if (m.ateTick !== undefined && tick >= m.ateTick) {
      if (m.tipo !== 'preparo') { terminar(estado, e, saida); continue; }
      if (m.destino === 'ancora') {
        terminar(estado, e, saida);
        const { x, y } = e;
        if (teleportar(estado, ctx, e, { x: m.x ?? e.x, y: m.y ?? e.y })) saida.push({ t: 'deslocado', tick: estado.tick, id: e.id, deX: x, deY: y, paraX: e.x, paraY: e.y, origemId: e.id, causa: 'teleporte' });
        continue;
      }
      // O preparo vira o modo (decolou, montou).
      Object.assign(m, { tipo: m.destino ?? 'voo', desdeTick: tick });
      delete m.ateTick;
      delete m.destino;
      continue;
    }
    const combate = (tick + e.id.length) % 5 === 0 ? emCombate(estado, ctx, e) : m.combate ?? false;
    m.combate = combate;
    if (m.tipo === 'nevoa') {
      // Fora de combate a névoa dura; ao entrar em combate, dura pouco mais. Os servos perto viram névoa junto.
      if (combate && m.ateTick === undefined) m.ateTick = tick + ticksDe(b.nevoa.duracaoAoEntrarEmCombateMs);
      if (tick % ticksDe(500) === 0) {
        for (const s of estado.entidades) {
          if (!vivo(s) || s.invocacao?.donoId !== e.id || chebyshev(s, e) > b.nevoa.servosRaio) continue;
          aplicarEfeito(estado, ctx, s, construirEfeito('imune_dano', { duracaoMs: 700 }), { id: e.id, x: e.x, y: e.y }, null, saida);
          if (!combate) aplicarEfeito(estado, ctx, s, construirEfeito('acelerado', { pct: b.viagemPct, duracaoMs: 700 }), { id: e.id, x: e.x, y: e.y }, null, saida);
        }
        if (!combate) aplicarEfeito(estado, ctx, e, construirEfeito('imune_dano', { duracaoMs: 700 }), { id: e.id, x: e.x, y: e.y }, null, saida);
      }
    }
    if (m.tipo === 'marcha' && combate && e.furia) {
      // Em combate, a marcha come a fúria; sem fúria, para.
      const mov = movimentoAtivo(ctx, e);
      const porS = mov ? parametros(mov, e.nivel).furiaPorS || b.marcha.furiaPorS : b.marcha.furiaPorS;
      const valor = Math.max(0, furiaAtual(ctx, e, tick) - porS / ticksDe(1000));
      e.furia = { ...e.furia, valor, ultimoTick: tick };
      if (valor <= 0) terminar(estado, e, saida);
    }
  }
}

/** A skill que a entidade quer usar agora: o movimento deixa? (null = deixa; senão, o motivo). */
export function motivoDoMovimento(ctx: ContextoSimulacao, e: Entidade, hab: Habilidade, basico: boolean): string | null {
  const m = modo(e);
  if (!m) return null;
  if (m.tipo === 'preparo') return 'preparo';
  if (m.tipo === 'tirolesa' && !basico) return 'tirolesa';
  if (m.tipo === 'voo') {
    if (basico) return 'voando';
    // Do telhado não se ataca.
    if (hab.formulaDano && !passavel(ctx.fase, e.x, e.y)) return 'telhado';
  }
  return null;
}

/** Agir encerra a marcha, a névoa e a camuflagem. */
export function aoAgir(estado: EstadoJogo, e: Entidade, hab: Habilidade, saida: EventoSimulacao[]): void {
  const m = modo(e);
  if (!m || !hab.formulaDano) return;
  if (m.tipo === 'marcha' || m.tipo === 'nevoa' || m.tipo === 'camuflado') {
    if (m.tipo === 'camuflado') e.invisivelAteTick = Math.min(e.invisivelAteTick, estado.tick);
    terminar(estado, e, saida);
  }
}

/** Multiplicador da velocidade de quem está num modo de movimento (1 = nada muda). */
export function fatorDeVelocidade(ctx: ContextoSimulacao, e: Entidade): number {
  const m = modo(e);
  if (!m) return 1;
  const b = ctx.balance.movimentoClasse;
  const fora = 1 + (m.pesada ? b.viagemPesadaPct : b.viagemPct) / 100;
  switch (m.tipo) {
    case 'voo': return m.combate ? 1 - pelaEvolucao(b.voo.lentidaoPct, e.nivel) / 100 : fora;
    case 'montado': return m.combate ? 1 : fora;
    case 'nevoa': return m.combate ? 1 - b.nevoa.lentidaoPct / 100 : fora;
    case 'marcha': return m.combate ? 1 + b.marcha.combatePct / 100 : fora;
    case 'camuflado': return 1 - (m.lentidaoPct ?? 0) / 100;
    default: return 1;
  }
}

const limites = (ctx: ContextoSimulacao, m: ModoDeMovimento) => (m.tipo === 'voo' ? ctx.balance.movimentoClasse.voo : m.pesada ? ctx.balance.movimentoClasse.montariaPesada : ctx.balance.movimentoClasse.montaria);

/** O dano que quem voa ou está montado causa (em fração). */
export function fatorDeDanoDoMovimento(ctx: ContextoSimulacao, e: Entidade): number {
  const m = modo(e);
  if (!m || (m.tipo !== 'voo' && m.tipo !== 'montado')) return 1;
  return pelaEvolucao(limites(ctx, m).danoPct, e.nivel) / 100;
}

/** A conjuração de quem voa ou está montado (em fração; 1,5 = 50% mais longa). */
export function fatorDeConjuracaoDoMovimento(ctx: ContextoSimulacao, e: Entidade): number {
  const m = modo(e);
  if (!m || (m.tipo !== 'voo' && m.tipo !== 'montado')) return 1;
  return pelaEvolucao(limites(ctx, m).conjuracaoPct, e.nivel) / 100;
}

/** O dano que quem está montado recebe (em fração). */
export function fatorDeDanoRecebidoDoMovimento(ctx: ContextoSimulacao, e: Entidade): number {
  const m = modo(e);
  if (m?.tipo !== 'montado') return 1;
  return pelaEvolucao(ctx.balance.movimentoClasse[m.pesada ? 'montariaPesada' : 'montaria'].danoRecebidoPct, e.nivel) / 100;
}

/** Levou um golpe montado: cai do lobo (o urso e o marco 50 do lobo seguram). */
export function aoLevarGolpeMontado(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, saida: EventoSimulacao[]): void {
  const m = modo(e);
  if (m?.tipo !== 'montado' || m.pesada) return;
  const mov = movimentoAtivo(ctx, e);
  if (mov && parametros(mov, e.nivel).segura > 0 && !m.caiuUmaVez) {
    m.caiuUmaVez = true;
    return;
  }
  terminar(estado, e, saida);
}
