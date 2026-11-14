// Marco 40 (13/11/2026, D-164): o movimento da classe. Cada classe tem três mecânicas (data/movimentos.json), uma
// ativa por vez: o Shift usa a ativa e o G troca entre as liberadas (todas desde o nível 1, D-167). Sem dano direto.
// A primeira de cada classe é a de longa distância: o Voo Arcano do Mago, a Tirolesa do Arqueiro, o Salto de Guerra
// do Guerreiro, a Forma de Névoa do Necromante e o Lobo do Aventureiro.
// Ajuste de 13/11/2026 (D-164): o limite é de espaço e de tempo, não de força. Todo alcance cresce com o nível
// (`crescimento` células a cada 10 níveis: 10 a 20 nas de longa distância). Os modos de viagem (voo, montaria, névoa,
// marcha) duram o tempo que a entidade levaria para andar esse alcance na velocidade de agora, sem o bônus;
// com o bônus (`viagemPct`) cobrem mais. Atacar ou ser atingido tira o bônus até o modo acabar. Não há outro limite.
// Marco 40 (14/11/2026, D-168): as que miram (a Arremetida, o Posto dos Mortos) vão ao ponto pedido; o Acelerar
// substitui o Piscar; a Âncora tem duas ativações (o totem; a volta, com o eco a partir do 30); o Posto tem duas ativações (deixa o servo no ponto, depois troca); os marcos elementais levam a
// ponta do eneágono de quem usa (movimento-extras.ts); a névoa leva todos os servos em anel; o companheiro do
// Aventureiro precisa estar perto para montar e fica onde a viagem acabar.

import type { Celula } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import { Leitor } from '../core/validar';
import { buscarEntidade } from '../core/estado';
import { escolher } from '../core/rng';
import { posicionar, vivo, type Entidade, type ModoDeMovimento } from '../entities/entidade';
import { podeFerir } from '../modos/relacao';
import { aplicarEfeito } from './efeitos';
import { avancar, teleportar } from './efeitos-instantaneos';
import { chebyshev } from './geometria';
import type { Habilidade } from './habilidades';
import { construirEfeito } from './registro-efeitos';
import { corpoCabe } from '../world/corpo';
import { passavel } from '../world/fase';
import { velocidadeDeViagem } from '../world/movimento';
import { petDe } from './pets';
import { armadilhaDoRecuo, assentarServo, carregarDescarga, companheiroDe, deixarEco, levarServosNaNevoa, levarVeiculo, pontaDaAfinidade, processarCirculos, servosDaNevoa, tocarEmVolta } from './movimento-extras';

export const TIPOS_MOVIMENTO = ['voo', 'tirolesa', 'salto', 'marcha', 'nevoa', 'montaria', 'posto', 'avanco', 'teleporte', 'recuo', 'ancora', 'acelerar', 'troca', 'camuflagem'] as const;
export type TipoMovimento = (typeof TIPOS_MOVIMENTO)[number];

/** Os números de uma mecânica (os marcos sobrescrevem a partir do nível deles). */
export interface ParametrosMovimento {
  /** As células no nível 1. */
  alcance: number;
  /** Quantas células o alcance ganha a cada 10 níveis (arredondado para baixo). */
  crescimento: number;
  velocidade: number;
  recargaMs: number;
  cargas: number;
  duracaoMs: number;
  lentidaoPct: number;
  /** O Posto dos Mortos: quantos postos, a cura do servo parado (% da vida por s), o escudo ao trocar e a reunião. */
  postos: number;
  curaPctPorS: number;
  escudo: number;
  reuniao: number;
  /** D-168: o raio e a velocidade do círculo do Acelerar; o eco do Piscar; a armadilha do recuo; o marco elemental. */
  raio: number;
  velocidadePct: number;
  eco: number;
  armadilha: number;
  elemental: number;
}

export interface MovimentoDaClasse {
  id: string;
  nivel: number;
  tipo: TipoMovimento;
  icone: string;
  cor: string;
  pesada: boolean;
  /**
   * Marco 40 (14/11/2026): o companheiro dono da mecânica (o Aventureiro). Na classe com companheiros, o movimento ativo
   * é sempre o do companheiro ativo (o falcão carrega, o lobo e o urso são a montaria) e o G não troca.
   */
  pet: string | null;
  /** D-168: vai ao ponto mirado (o cursor; no celular, o toque depois do botão). */
  mira: boolean;
  base: ParametrosMovimento;
  marcos: ReadonlyMap<number, Partial<ParametrosMovimento>>;
}

const CAMPOS: readonly (keyof ParametrosMovimento)[] = ['alcance', 'crescimento', 'velocidade', 'recargaMs', 'cargas', 'duracaoMs', 'lentidaoPct', 'postos', 'curaPctPorS', 'escudo', 'reuniao', 'raio', 'velocidadePct', 'eco', 'armadilha', 'elemental'];
/** Os modos que dão o bônus de viagem (e o perdem ao atacar ou ser atingido). */
const VIAGEM: readonly ModoDeMovimento['tipo'][] = ['voo', 'montado', 'nevoa', 'marcha'];

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
      itens.push({
        id: l.texto(o, 'id'),
        nivel: l.numero(o, 'nivel', { min: 1, max: 100, inteiro: true }),
        tipo: l.opcao(o, 'tipo', TIPOS_MOVIMENTO),
        icone: l.texto(o, 'icone'),
        cor: l.texto(o, 'cor'),
        pesada: o.pesada === true,
        pet: o.pet === undefined ? null : l.texto(o, 'pet'),
        mira: o.mira === true,
        base: { alcance: 0, crescimento: 0, velocidade: 12, recargaMs: 3000, cargas: 1, duracaoMs: 0, lentidaoPct: 0, postos: 1, curaPctPorS: 0, escudo: 0, reuniao: 0, raio: 0, velocidadePct: 0, eco: 0, armadilha: 0, elemental: 0, ...numeros(o) },
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

/** O alcance no nível: o do nível 1 mais `crescimento` a cada 10 níveis (10 a 20 nas de longa distância). */
export function alcanceNoNivel(p: ParametrosMovimento, nivel: number): number {
  return p.alcance + Math.floor(Math.floor(Math.min(100, Math.max(1, nivel)) / 10) * p.crescimento);
}

export function movimentoAtivo(ctx: ContextoSimulacao, e: Entidade): MovimentoDaClasse | null {
  const liberados = movimentosLiberados(ctx, e);
  if (liberados.some((m) => m.pet !== null)) return liberados.find((m) => m.pet === petDe(e)) ?? null;
  return liberados.find((m) => m.id === e.movimentoClasse?.ativo) ?? liberados[0] ?? null;
}

const modo = (e: Entidade): ModoDeMovimento | undefined => e.movimentoClasse?.modo;
/** Voando ou no meio do salto: fora do alcance do que está no chão (armadilhas, rastros, campos, golpes de perto). */
export const noAr = (e: Entidade): boolean => modo(e)?.tipo === 'voo' || modo(e)?.tipo === 'salto';
/** Quem atravessa os corpos (a tirolesa, a névoa, o salto). */
export const atravessaCorpos = (e: Entidade): boolean => ['tirolesa', 'nevoa', 'salto'].includes(modo(e)?.tipo ?? '');
export const naTirolesa = (e: Entidade): boolean => modo(e)?.tipo === 'tirolesa';
export const noSalto = (e: Entidade): boolean => modo(e)?.tipo === 'salto';

function terminar(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, saida: EventoSimulacao[]): void {
  const mc = e.movimentoClasse;
  const m = mc?.modo;
  if (!m) return;
  delete mc.modo;
  const tick = estado.tick;
  if (m.tipo === 'camuflado') {
    e.invisivelAteTick = Math.min(e.invisivelAteTick, tick);
    // D-168: no marco elemental, os tiros logo depois de sair da camuflagem levam a ponta.
    if (m.ponta) mc.tiroElemental = { ponta: m.ponta, ateTick: tick + ticksDe(ctx.balance.movimentoClasse.tiroElementalMs) };
  }
  if (m.tipo === 'nevoa') sairDaNevoa(estado, ctx, e);
  // D-168: o companheiro que foi o veículo fica onde a viagem acabou; no marco, descarrega a ponta.
  const pet = m.tipo === 'montado' || m.tipo === 'voo' ? movimentosLiberados(ctx, e).find((x) => x.id === m.id)?.pet : null;
  const veiculo = pet ? companheiroDe(estado, e, pet) : undefined;
  if (veiculo && m.ponta) carregarDescarga(estado, ctx, veiculo, m.ponta);
  saida.push({ t: 'movimentoClasse', tick, id: e.id, mov: m.id, fase: 'fim' });
}

/** O pulso da proteção da névoa. */
const NEVOA_PULSO_MS = 500;

/**
 * D-168: a névoa acaba para todos de uma vez: sai a proteção dela (o escudo amarelo não pisca ao reaparecer) e o servo
 * que ficou dentro de uma parede volta para junto do Necromante.
 */
function sairDaNevoa(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade): void {
  const limite = estado.tick + ticksDe(NEVOA_PULSO_MS * 2);
  const daNevoa = (q: Entidade) => {
    q.efeitos = q.efeitos.filter((f) => !(f.origemId === e.id && (f.tipo === 'imune_dano' || f.tipo === 'acelerado') && f.ateTick <= limite));
  };
  daNevoa(e);
  for (const s of estado.entidades) {
    if (s.invocacao?.donoId !== e.id || s.invocacao.nevoaAteTick === undefined) continue;
    daNevoa(s);
    assentarServo(ctx, s, e);
  }
}

/** A tirolesa bateu ou acabou. */
export function fimDaTirolesa(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, saida: EventoSimulacao[]): void {
  if (naTirolesa(e)) terminar(estado, ctx, e, saida);
}

/** O salto chegou: atordoa os inimigos em volta da queda. */
export function fimDoSalto(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, saida: EventoSimulacao[]): void {
  if (!noSalto(e)) return;
  const ponta = modo(e)?.ponta;
  terminar(estado, ctx, e, saida);
  const s = ctx.balance.movimentoClasse.salto;
  for (const o of estado.entidades) {
    if (o === e || !vivo(o) || chebyshev(o, e) > s.raio || !podeFerir(e, o, ctx.modo)) continue;
    aplicarEfeito(estado, ctx, o, construirEfeito('atordoar', { duracaoMs: s.atordoarMs }), { id: e.id, x: e.x, y: e.y }, null, saida);
  }
  // D-168: no marco elemental, a queda leva a ponta do Guerreiro (o Físico, dano bruto).
  if (ponta) tocarEmVolta(estado, ctx, e, { x: e.x, y: e.y }, s.raio, ponta, saida);
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
  // Marco 40 (14/11/2026): quem tem companheiros troca de movimento trocando de companheiro.
  if (liberados.length === 0 || liberados.some((m) => m.pet !== null) || noSalto(e) || naTirolesa(e)) return;
  const atual = movimentoAtivo(ctx, e);
  const i = atual ? liberados.indexOf(atual) : -1;
  const proximo = liberados[(i + 1) % liberados.length];
  if (!proximo) return;
  if (modo(e)?.tipo === 'voo') pousar(estado, ctx, e);
  terminar(estado, ctx, e, saida);
  (e.movimentoClasse ??= { ativo: proximo.id, cargas: {} }).ativo = proximo.id;
  saida.push({ t: 'movimentoClasse', tick: estado.tick, id: e.id, mov: proximo.id, fase: 'ativo' });
}

/** Para onde a mecânica vai: o ponto mirado, o rumo pedido, o de quem anda ou para onde olha. */
function rumoDe(e: Entidade, dx?: number, dy?: number, alvo?: Celula): { dx: number; dy: number } {
  if (alvo && (alvo.x !== e.x || alvo.y !== e.y)) return rumoDe(e, alvo.x - e.px, alvo.y - e.py);
  const [ux, uy] = dx !== undefined && dy !== undefined && (dx !== 0 || dy !== 0) ? [dx, dy] : e.direcao !== 'parado' && (e.rumoX !== 0 || e.rumoY !== 0) ? [e.rumoX, e.rumoY] : RUMOS[e.olhando ?? 'S'];
  const n = Math.hypot(ux, uy) || 1;
  return { dx: ux / n, dy: uy / n };
}
const RUMOS: Record<NonNullable<Entidade['olhando']>, [number, number]> = { N: [0, -1], NE: [1, -1], E: [1, 0], SE: [1, 1], S: [0, 1], SO: [-1, 1], O: [-1, 0], NO: [-1, -1] };

/** A célula a `n` células no rumo. */
const aFrente = (e: Entidade, r: { dx: number; dy: number }, n: number) => ({ x: Math.round(e.x + r.dx * n), y: Math.round(e.y + r.dy * n) });
const cabeAli = (ctx: ContextoSimulacao, x: number, y: number) => passavel(ctx.fase, x, y) && corpoCabe(ctx.fase, x, y, ctx.balance.movimento.raioCorpo);

/** O voo acabou em cima de um telhado: desce na célula livre mais perto. */
function pousar(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade): void {
  if (cabeAli(ctx, e.px, e.py) && passavel(ctx.fase, e.x, e.y)) return;
  for (let r = 1; r <= 12; r++) {
    for (let j = -r; j <= r; j++) {
      for (let i = -r; i <= r; i++) {
        if (Math.max(Math.abs(i), Math.abs(j)) !== r || !cabeAli(ctx, e.x + i, e.y + j)) continue;
        posicionar(e, e.x + i, e.y + j);
        e.waypoints = [];
        e.caminho = [];
        return;
      }
    }
  }
}

/** Quantos ticks o modo de viagem dura: o tempo de andar o alcance na velocidade de agora, sem o bônus. */
function duracaoDaViagem(estado: EstadoJogo, ctx: ContextoSimulacao, quem: Entidade, celulas: number): number {
  const vel = Math.max(0.5, velocidadeDeViagem(quem, estado, ctx));
  return Math.max(1, ticksDe((celulas / vel) * 1000));
}

/** A célula mirada, puxada na linha até o alcance quando passa dele. */
function noAlcance(e: Entidade, c: Celula, alcance: number): Celula {
  const d = chebyshev(e, c);
  if (d <= alcance || d === 0) return c;
  const k = alcance / d;
  return { x: e.x + Math.round((c.x - e.x) * k), y: e.y + Math.round((c.y - e.y) * k) };
}

/** Shift: usa (ou desfaz) a mecânica ativa. `alvo`: o ponto mirado (as que miram). */
export function usarMovimento(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, saida: EventoSimulacao[], dx?: number, dy?: number, alvo?: Celula): void {
  const m = movimentoAtivo(ctx, e);
  if (!m || !vivo(e)) return;
  const p = parametros(m, e.nivel);
  const alcance = alcanceNoNivel(p, e.nivel);
  const tick = estado.tick;
  const recusar = (motivo: string) => { saida.push({ t: 'movimentoClasse', tick, id: e.id, mov: m.id, fase: 'recusado', motivo }); };
  const atual = modo(e);
  if (atual && (atual.tipo === 'salto' || atual.tipo === 'tirolesa')) return;
  // Os modos de viagem desligam no mesmo botão.
  if (atual && atual.id === m.id) {
    // Não pousa no telhado.
    if (atual.tipo === 'voo' && !cabeAli(ctx, e.px, e.py)) { recusar('pouso'); return; }
    terminar(estado, ctx, e, saida);
    return;
  }
  if (atual) terminar(estado, ctx, e, saida);
  // D-168: a ponta do eneágono de quem usa, a partir do marco elemental da mecânica.
  const ponta = p.elemental > 0 ? pontaDaAfinidade(ctx, e, tick) : undefined;
  const iniciar = (tipo: ModoDeMovimento['tipo'], extra: Partial<ModoDeMovimento> = {}) => {
    (e.movimentoClasse ??= { ativo: m.id, cargas: {} }).modo = { tipo, id: m.id, desdeTick: tick, ...(ponta && { ponta }), ...extra };
    saida.push({ t: 'movimentoClasse', tick, id: e.id, mov: m.id, fase: 'inicio', ...(ponta && { ponta }) });
  };
  const r = rumoDe(e, dx, dy, alvo);
  const b = ctx.balance.movimentoClasse;
  switch (m.tipo) {
    case 'voo':
    case 'montaria':
    case 'marcha':
    case 'nevoa': {
      // D-168: o Aventureiro só monta (ou é levado) com o companheiro perto; ele não vem até o dono.
      const veiculo = m.pet ? companheiroDe(estado, e, m.pet) : undefined;
      if (m.pet && (!veiculo || chebyshev(veiculo, e) > b.montarRaio)) { recusar('longe'); return; }
      if (!gastarCarga(estado, e, m, p)) { recusar('recarga'); return; }
      const tipo = m.tipo === 'montaria' ? 'montado' : m.tipo;
      const ateTick = tick + duracaoDaViagem(estado, ctx, e, alcance);
      iniciar(tipo, { ateTick, ...(m.pesada && { pesada: true }) });
      if (tipo === 'nevoa') {
        // D-168: a névoa leva todos os servos (os do posto ficam), em volta do Necromante, até o fim.
        for (const s of servosDaNevoa(estado, e)) if (s.invocacao) s.invocacao.nevoaAteTick = ateTick;
        protegerNaNevoa(estado, ctx, e, saida);
      }
      return;
    }
    case 'posto': {
      if (postosDe(estado, e).length >= Math.max(1, p.postos)) {
        trocarComPosto(estado, ctx, e, p, saida);
        return;
      }
      const c = noAlcance(e, alvo ?? aFrente(e, r, alcance), alcance);
      if (!cabeAli(ctx, c.x, c.y)) { recusar('bloqueado'); return; }
      if (!servoParaPosto(estado, e)) { recusar('sem_servo'); return; }
      if (!gastarCarga(estado, e, m, p)) { recusar('recarga'); return; }
      deixarNoPosto(estado, e, c, p, saida);
      saida.push({ t: 'movimentoClasse', tick, id: e.id, mov: m.id, fase: 'inicio' });
      return;
    }
    case 'salto': {
      // A queda mais longe que cabe (passa por cima do que houver no meio).
      let destino: { x: number; y: number } | null = null;
      for (let k = alcance; k >= 1 && !destino; k--) {
        const c = aFrente(e, r, k);
        if (cabeAli(ctx, c.x, c.y)) destino = c;
      }
      if (!destino) { recusar('bloqueado'); return; }
      if (!gastarCarga(estado, e, m, p)) { recusar('recarga'); return; }
      e.waypoints = [];
      e.caminho = [];
      iniciar('salto', { x: destino.x, y: destino.y, velocidade: b.salto.velocidade });
      return;
    }
    case 'tirolesa':
      if (!gastarCarga(estado, e, m, p)) { recusar('recarga'); return; }
      iniciar('tirolesa', { rumoX: r.dx, rumoY: r.dy, restante: alcance, velocidade: p.velocidade });
      return;
    case 'camuflagem':
      if (!gastarCarga(estado, e, m, p)) { recusar('recarga'); return; }
      iniciar('camuflado', { ateTick: tick + ticksDe(p.duracaoMs), lentidaoPct: p.lentidaoPct });
      e.invisivelAteTick = Math.max(e.invisivelAteTick, tick + ticksDe(p.duracaoMs));
      return;
    case 'avanco':
    case 'recuo':
    case 'teleporte': {
      const rumo = m.tipo === 'recuo' ? { dx: -r.dx, dy: -r.dy } : r;
      // D-168: a Arremetida vai no rumo do ponto mirado.
      const destino = m.tipo === 'teleporte' && alvo ? noAlcance(e, alvo, alcance) : aFrente(e, rumo, alcance);
      if (!gastarCarga(estado, e, m, p)) { recusar('recarga'); return; }
      const { x, y } = e;
      const ok = m.tipo === 'teleporte' ? teleportar(estado, ctx, e, destino) : avancar(estado, ctx, e, destino, alcance);
      if (!ok) { recusar('bloqueado'); return; }
      saida.push({ t: 'deslocado', tick, id: e.id, deX: x, deY: y, paraX: e.x, paraY: e.y, origemId: e.id, causa: m.tipo === 'teleporte' ? 'teleporte' : m.tipo === 'recuo' ? 'recuo' : 'avanco' });
      saida.push({ t: 'movimentoClasse', tick, id: e.id, mov: m.id, fase: 'inicio', ...(ponta && { ponta }) });
      if (m.tipo === 'recuo' && p.armadilha > 0) armadilhaDoRecuo(estado, ctx, e, { x, y }, pontaDaAfinidade(ctx, e, tick), saida);
      return;
    }
    case 'ancora': {
      // D-168: a 1ª ativação finca o totem (o ponto de volta); a 2ª, perto dele, volta para lá, deixando um rastro da ponta
      // do Mago (à vista de todos até o marco do eco; depois, só dele e dos aliados) e, no marco, o eco de isca.
      const mc = (e.movimentoClasse ??= { ativo: m.id, cargas: {} });
      const ancora = mc.ancora && mc.ancora.ateTick > tick ? mc.ancora : undefined;
      if (!ancora) {
        if (!gastarCarga(estado, e, m, p)) { recusar('recarga'); return; }
        mc.ancora = { x: e.x, y: e.y, ateTick: tick + ticksDe(p.duracaoMs), raio: alcance };
        saida.push({ t: 'movimentoClasse', tick, id: e.id, mov: m.id, fase: 'inicio' });
        return;
      }
      if (chebyshev(e, ancora) > alcance) { recusar('ancora_longe'); return; }
      const { x, y } = e;
      if (!teleportar(estado, ctx, e, { x: ancora.x, y: ancora.y })) { recusar('bloqueado'); return; }
      delete mc.ancora;
      const eco = p.eco > 0;
      saida.push({ t: 'deslocado', tick, id: e.id, deX: x, deY: y, paraX: e.x, paraY: e.y, origemId: e.id, causa: 'teleporte' });
      saida.push({ t: 'movimentoClasse', tick, id: e.id, mov: m.id, fase: 'inicio', ponta: pontaDaAfinidade(ctx, e, tick), ...(eco && { eco: true }) });
      if (eco) deixarEco(estado, ctx, e, { x, y }, saida);
      return;
    }
    case 'acelerar': {
      if (!gastarCarga(estado, e, m, p)) { recusar('recarga'); return; }
      (e.movimentoClasse ??= { ativo: m.id, cargas: {} }).circulo = { x: e.x, y: e.y, raio: p.raio, pct: p.velocidadePct, ateTick: tick + ticksDe(p.duracaoMs), ...(ponta && { ponta }) };
      saida.push({ t: 'movimentoClasse', tick, id: e.id, mov: m.id, fase: 'inicio', ...(ponta && { ponta }) });
      return;
    }
    case 'troca': {
      const servo = servoPerto(estado, e, alcance);
      if (!servo) { recusar('sem_servo'); return; }
      if (!gastarCarga(estado, e, m, p)) { recusar('recarga'); return; }
      const { x, y } = e;
      posicionar(e, servo.x, servo.y);
      posicionar(servo, x, y);
      saida.push({ t: 'deslocado', tick, id: e.id, deX: x, deY: y, paraX: e.x, paraY: e.y, origemId: e.id, causa: 'teleporte' });
      saida.push({ t: 'movimentoClasse', tick, id: e.id, mov: m.id, fase: 'inicio' });
      return;
    }
  }
}

/** O servo do Necromante para a troca e a possessão: o selecionado, ou o mais longe dentro do alcance. */
function servoPerto(estado: EstadoJogo, e: Entidade, alcance: number): Entidade | undefined {
  return estado.entidades.filter((s) => vivo(s) && s.invocacao?.donoId === e.id && !s.invocacao.companheiro && chebyshev(s, e) <= alcance)
    .sort((a, b) => (a.id === e.alvoSelecionado ? -1 : 0) - (b.id === e.alvoSelecionado ? -1 : 0) || chebyshev(b, e) - chebyshev(a, e))[0];
}

/** A névoa: o Necromante e os servos dele ficam intocáveis (e os servos, rápidos) enquanto o bônus vale. */
function protegerNaNevoa(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, saida: EventoSimulacao[]): void {
  const b = ctx.balance.movimentoClasse;
  const origem = { id: e.id, x: e.x, y: e.y };
  aplicarEfeito(estado, ctx, e, construirEfeito('imune_dano', { duracaoMs: NEVOA_PULSO_MS + 200 }), origem, null, saida, false);
  for (const s of estado.entidades) {
    if (!vivo(s) || s.invocacao?.donoId !== e.id || (s.invocacao.nevoaAteTick ?? 0) <= estado.tick) continue;
    aplicarEfeito(estado, ctx, s, construirEfeito('imune_dano', { duracaoMs: NEVOA_PULSO_MS + 200 }), origem, null, saida, false);
    aplicarEfeito(estado, ctx, s, construirEfeito('acelerado', { pct: b.viagemPct, duracaoMs: NEVOA_PULSO_MS + 200 }), origem, null, saida, false);
  }
}

/** O servo na névoa do dono (anda com ela, não luta). */
export function naNevoaDoDono(estado: EstadoJogo, s: Entidade): boolean {
  return (s.invocacao?.nevoaAteTick ?? 0) > estado.tick;
}

/** O companheiro do Aventureiro que está levando o dono agora (montado ou no voo). */
export function ehVeiculo(estado: EstadoJogo, ctx: ContextoSimulacao, pet: Entidade): boolean {
  if (!pet.invocacao?.companheiro) return false;
  const dono = buscarEntidade(estado, pet.invocacao.donoId);
  const m = dono ? modo(dono) : undefined;
  if (!dono || !m || (m.tipo !== 'montado' && m.tipo !== 'voo')) return false;
  const mov = movimentosLiberados(ctx, dono).find((x) => x.id === m.id);
  return !!mov?.pet && companheiroDe(estado, dono, mov.pet) === pet;
}

/** A cada tick: o modo que vence (o voo pousa), a névoa que protege e leva os servos, o veículo, os postos e os círculos. */
export function processarMovimentoClasse(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  const tick = estado.tick;
  processarPostos(estado, ctx);
  processarCirculos(estado, ctx, saida);
  for (const e of estado.entidades) {
    const m = e.movimentoClasse?.modo;
    if (!m) continue;
    if (!vivo(e)) { terminar(estado, ctx, e, saida); continue; }
    // Marco 40 (14/11/2026): trocou o companheiro no meio da viagem: a do companheiro que saiu acaba (o voo pousa).
    if (m.tipo !== 'preparo' && m.id !== movimentoAtivo(ctx, e)?.id) {
      if (m.tipo === 'voo') pousar(estado, ctx, e);
      terminar(estado, ctx, e, saida);
      continue;
    }
    if (m.ateTick !== undefined && tick >= m.ateTick) {
      if (m.tipo === 'voo') pousar(estado, ctx, e);
      terminar(estado, ctx, e, saida);
      continue;
    }
    if (m.tipo === 'nevoa') {
      if (!m.semBuff && tick % ticksDe(NEVOA_PULSO_MS) === 0) protegerNaNevoa(estado, ctx, e, saida);
      levarServosNaNevoa(estado, ctx, e, velocidadeDeViagem(e, estado, ctx));
    }
    // D-168: o veículo (o lobo, o urso, o falcão) vai com o dono, virado para onde ele vai.
    if (m.tipo === 'montado' || m.tipo === 'voo') {
      const pet = movimentosLiberados(ctx, e).find((x) => x.id === m.id)?.pet;
      const veiculo = pet ? companheiroDe(estado, e, pet) : undefined;
      if (veiculo) levarVeiculo(veiculo, e);
    }
  }
}

/** A skill que a entidade quer usar agora: o movimento deixa? (null = deixa; senão, o motivo). */
export function motivoDoMovimento(e: Entidade): string | null {
  const t = modo(e)?.tipo;
  return t === 'preparo' || t === 'salto' ? t : null;
}

/** Perde o bônus de viagem até o modo acabar (o modo segue). */
function perderBonus(estado: EstadoJogo, e: Entidade, saida: EventoSimulacao[]): void {
  const m = modo(e);
  if (!m || m.semBuff || !VIAGEM.includes(m.tipo)) return;
  m.semBuff = true;
  saida.push({ t: 'movimentoClasse', tick: estado.tick, id: e.id, mov: m.id, fase: 'perdeu' });
}

/** Atacar tira o bônus de viagem; a camuflagem acaba (revela). */
export function aoAgir(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, hab: Habilidade, saida: EventoSimulacao[]): void {
  const m = modo(e);
  if (!m || !hab.formulaDano) return;
  if (m.tipo === 'camuflado') terminar(estado, ctx, e, saida);
  else perderBonus(estado, e, saida);
}

/** Ser atingido tira o bônus de viagem (o urso, montaria pesada, segura). */
export function aoSerAtingido(estado: EstadoJogo, e: Entidade, saida: EventoSimulacao[]): void {
  if (!modo(e)?.pesada) perderBonus(estado, e, saida);
}

/** Multiplicador da velocidade de quem está num modo de movimento (1 = nada muda). */
export function fatorDeVelocidade(ctx: ContextoSimulacao, e: Entidade): number {
  const m = modo(e);
  if (!m) return 1;
  if (m.tipo === 'camuflado') return 1 - (m.lentidaoPct ?? 0) / 100;
  if (m.semBuff || !VIAGEM.includes(m.tipo)) return 1;
  const b = ctx.balance.movimentoClasse;
  return 1 + (m.pesada ? b.viagemPesadaPct : b.viagemPct) / 100;
}

// O Posto dos Mortos (catálogo 1.3; D-168, 14/11/2026): duas ativações. A primeira põe o servo de vida mais cheia no
// ponto mirado (até o alcance, que cresce com o nível como os outros); ele fica ali parado até 1 min, sem chamar a
// atenção dos monstros (só a dos jogadores, nas áreas hostis) e sem lutar. A segunda troca de corpo com ele, a qualquer
// distância: uma rota de fuga preparada antes do desafio. Marcos: 30 o servo parado recupera vida, 50 dois postos, 70 o
// servo chega à troca com escudo, 90 os outros servos se reúnem no Necromante ao trocar.

const postosDe = (estado: EstadoJogo, e: Entidade) => estado.entidades.filter((s) => vivo(s) && s.invocacao?.donoId === e.id && s.invocacao.posto);

/** O servo que vai ao posto: o de vida mais cheia (no empate, um ao acaso). */
function servoParaPosto(estado: EstadoJogo, e: Entidade): Entidade | undefined {
  const livres = estado.entidades.filter((s) => vivo(s) && s.invocacao?.donoId === e.id && !!s.invocacao.necromancia && !s.invocacao.posto);
  if (livres.length === 0) return undefined;
  const fracao = (s: Entidade) => s.hp / Math.max(1, s.hpMax);
  const maior = Math.max(...livres.map(fracao));
  return escolher(estado.rng, livres.filter((s) => fracao(s) >= maior - 1e-9));
}

/** Leva o servo ao ponto (pela escuridão) e o deixa no posto. */
function deixarNoPosto(estado: EstadoJogo, e: Entidade, c: Celula, p: ParametrosMovimento, saida: EventoSimulacao[]): void {
  const servo = servoParaPosto(estado, e);
  if (!servo?.invocacao) return;
  const { x, y } = servo;
  posicionar(servo, c.x, c.y);
  servo.alvoSelecionado = null;
  servo.direcao = 'parado';
  delete servo.invocacao.nevoaAteTick;
  servo.invocacao.posto = { x: c.x, y: c.y, ateTick: estado.tick + ticksDe(p.duracaoMs) };
  saida.push({ t: 'deslocado', tick: estado.tick, id: servo.id, deX: x, deY: y, paraX: c.x, paraY: c.y, origemId: e.id, causa: 'teleporte' });
}

/** A segunda ativação: troca de corpo com o servo do posto (com dois, o mais longe). */
function trocarComPosto(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, p: ParametrosMovimento, saida: EventoSimulacao[]): void {
  const servo = [...postosDe(estado, e)].sort((a, b) => chebyshev(b, e) - chebyshev(a, e) || a.id.localeCompare(b.id))[0];
  if (!servo?.invocacao) return;
  delete servo.invocacao.posto;
  const { x, y } = e;
  posicionar(e, servo.x, servo.y);
  posicionar(servo, x, y);
  // A troca com o servo do posto passa pela escuridão (não desliza pelo mapa).
  saida.push({ t: 'deslocado', tick: estado.tick, id: e.id, deX: x, deY: y, paraX: e.x, paraY: e.y, origemId: e.id, causa: 'teleporte' });
  saida.push({ t: 'movimentoClasse', tick: estado.tick, id: e.id, mov: movimentoAtivo(ctx, e)?.id ?? 'posto_dos_mortos', fase: 'inicio' });
  if (p.escudo > 0) aplicarEfeito(estado, ctx, servo, construirEfeito('escudo', { valor: p.escudo, duracaoMs: 8000 }), { id: e.id, x: e.x, y: e.y }, null, saida);
  if (p.reuniao > 0) {
    // A reunião: os outros servos livres vêm para perto do Necromante.
    for (const s of estado.entidades) {
      if (s === servo || !vivo(s) || s.invocacao?.donoId !== e.id || !s.invocacao.necromancia || s.invocacao.posto) continue;
      teleportar(estado, ctx, s, { x: e.x, y: e.y });
    }
  }
}

/** O servo está no posto: fica parado e não luta (a IA dele espera). */
export function postoDormente(_estado: EstadoJogo, _ctx: ContextoSimulacao, s: Entidade): boolean {
  return !!s.invocacao?.posto;
}

/** O servo no posto não chama a atenção dos monstros (só a dos jogadores). */
export function ocultoDosMonstros(ator: Entidade, alvo: Entidade): boolean {
  return !!alvo.invocacao?.posto && !ator.bolsa;
}

/** Os servos nos postos: ficam no ponto até o prazo e, a partir do marco 30, recuperam vida. */
function processarPostos(estado: EstadoJogo, ctx: ContextoSimulacao): void {
  const tick = estado.tick;
  const pulso = tick % ticksDe(500) === 0;
  for (const s of estado.entidades) {
    const posto = s.invocacao?.posto;
    if (!posto || !s.invocacao || !vivo(s)) continue;
    const dono = buscarEntidade(estado, s.invocacao.donoId);
    if (!dono || !vivo(dono) || (posto.ateTick ?? 0) <= tick) {
      delete s.invocacao.posto;
      continue;
    }
    if (s.x !== posto.x || s.y !== posto.y) posicionar(s, posto.x, posto.y);
    s.waypoints = [];
    s.caminho = [];
    s.direcao = 'parado';
    s.alvoSelecionado = null;
    if (!pulso) continue;
    const mov = movimentosLiberados(ctx, dono).find((m) => m.tipo === 'posto');
    const cura = mov ? parametros(mov, dono.nivel).curaPctPorS : 0;
    // O pulso é a cada meio segundo: metade da cura por segundo.
    if (cura > 0) s.hp = Math.min(s.hpMax, s.hp + Math.max(1, Math.round((s.hpMax * cura) / 200)));
  }
}
