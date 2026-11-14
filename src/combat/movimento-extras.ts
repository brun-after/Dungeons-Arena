// Marco 40 (14/11/2026, D-168): o que as mecânicas de movimento fazem além de mover. Funções puras sobre o estado,
// chamadas pelo movimento da classe (movimento-classe.ts), sem importá-lo (ele importa daqui).
// - a ponta do eneágono de quem usa (o maior vínculo; sem vínculo, a runa padrão da classe) e o toque dela num alvo
//   (o estado do elemento no hostil, a cura do Sagrado no aliado, o dano bruto do Físico);
// - o eco do Piscar (a cópia que provoca os inimigos perto) e a armadilha do Salto para Trás;
// - o círculo do Acelerar (velocidade para quem estiver dentro, inimigo também; no marco, o elemento);
// - os servos na névoa (em anel em volta do Necromante, sem lutar) e o companheiro que é o veículo do Aventureiro;
// - os golpes elementais (os tiros do Arqueiro, a descarga do companheiro que desmonta).

import type { Celula } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import { buscarEntidade, type EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { DT_MS } from '../core/loop';
import { ticksDe } from '../core/tempo';
import { posicionar, vivo, type Entidade } from '../entities/entidade';
import { criarInimigo } from '../entities/fabrica';
import { podeAjudar, podeFerir } from '../modos/relacao';
import { PONTAS_ELEMENTAIS, vinculoDe, type PontaElemental } from '../progression/vinculo';
import { passavel } from '../world/fase';
import { corpoCabe } from '../world/corpo';
import { aplicarEfeito } from './efeitos';
import { causarDano } from './efeitos-fluxo';
import { runaPadrao } from './encaixe-runa';
import { chebyshev } from './geometria';
import type { Habilidade } from './habilidades';
import { direcaoDe } from './orientacao';
import { petDoCompanheiro } from './pets';
import { construirEfeito } from './registro-efeitos';

/** A ponta de quem usa: a de maior vínculo; sem vínculo nenhum, a runa padrão da classe. */
export function pontaDaAfinidade(ctx: ContextoSimulacao, e: Entidade, tick: number): PontaElemental {
  const v = vinculoDe(ctx, e, tick);
  let melhor: PontaElemental | null = null;
  for (const p of PONTAS_ELEMENTAIS) if (v[p] > 0 && (melhor === null || v[p] > v[melhor])) melhor = p;
  return melhor ?? (e.bolsa ? runaPadrao(ctx, e.bolsa) : 'fisico');
}

/** O dano bruto do Físico (e a cura do Sagrado) pelo nível de quem usa. */
const pelaForca = (ctx: ContextoSimulacao, e: Entidade) => Math.max(1, Math.round(e.nivel * ctx.balance.movimentoClasse.salto.danoPorNivel));

/**
 * O toque da ponta num alvo: no hostil, o estado do elemento (o Físico, o dano bruto); no aliado, só o Sagrado age (a
 * cura). Devolve se fez algo.
 */
export function tocarPonta(estado: EstadoJogo, ctx: ContextoSimulacao, fonte: Entidade, alvo: Entidade, ponta: PontaElemental, saida: EventoSimulacao[], forca = pelaForca(ctx, fonte)): boolean {
  if (!vivo(alvo)) return false;
  const origem = { id: fonte.id, x: fonte.x, y: fonte.y };
  if (alvo === fonte || podeAjudar(fonte, alvo, ctx.modo)) {
    if (ponta !== 'sagrado' || alvo.hp >= alvo.hpMax) return false;
    aplicarEfeito(estado, ctx, alvo, construirEfeito('cura', { valor: forca }), origem, null, saida);
    return true;
  }
  if (!podeFerir(fonte, alvo, ctx.modo)) return false;
  if (ponta === 'fisico') {
    causarDano(estado, ctx, alvo, forca, fonte.id, 'armadilha', saida);
    return true;
  }
  const def = ctx.conteudo.elementos.get(ponta);
  if (!def) return false;
  aplicarEfeito(estado, ctx, alvo, def.estado, origem, null, saida);
  return true;
}

/** A ponta em todos em volta de (x, y): os hostis (e, no Sagrado, os aliados) a até `raio`. */
export function tocarEmVolta(estado: EstadoJogo, ctx: ContextoSimulacao, fonte: Entidade, c: Celula, raio: number, ponta: PontaElemental, saida: EventoSimulacao[]): void {
  for (const o of estado.entidades) if (vivo(o) && chebyshev(o, c) <= raio && !o.invocacao?.companheiro) tocarPonta(estado, ctx, fonte, o, ponta, saida);
}

/** O golpe que leva a ponta: o elemento e o estado dele (o Físico não muda o golpe). */
export function golpeComPonta(ctx: ContextoSimulacao, hab: Habilidade, ponta: PontaElemental): Habilidade {
  if (ponta === 'fisico' || hab.formulaDano === null) return hab;
  const def = ctx.conteudo.elementos.get(ponta);
  return def ? { ...hab, elemento: ponta, efeitos: [...hab.efeitos, { ...def.estado, em: 'alvo' }] } : hab;
}

/**
 * O básico com a ponta da vez: o tiro do Arqueiro balançando na corda ou logo depois da camuflagem, e os golpes da
 * descarga do companheiro que desmontou (cada um gasta um).
 */
export function basicoElemental(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, hab: Habilidade, basico: boolean): Habilidade {
  if (!basico) return hab;
  const tick = estado.tick;
  const mc = ator.movimentoClasse;
  const noBalanco = mc?.modo?.tipo === 'tirolesa' ? mc.modo.ponta : undefined;
  const depois = mc?.tiroElemental && mc.tiroElemental.ateTick > tick ? mc.tiroElemental.ponta : undefined;
  const d = ator.invocacao?.descarga;
  if (d && d.golpes > 0 && d.ateTick > tick) {
    d.golpes -= 1;
    if (d.golpes <= 0 && ator.invocacao) delete ator.invocacao.descarga;
    return golpeComPonta(ctx, hab, d.ponta);
  }
  const ponta = noBalanco ?? depois;
  return ponta ? golpeComPonta(ctx, hab, ponta) : hab;
}

/** O eco do Piscar: a cópia do Mago no ponto de partida provoca os inimigos perto; o Mago some por um instante. */
export function deixarEco(estado: EstadoJogo, ctx: ContextoSimulacao, mago: Entidade, de: Celula, saida: EventoSimulacao[]): void {
  const b = ctx.balance.movimentoClasse.eco;
  const preset = ctx.conteudo.presets.get('eco_arcano');
  if (!preset) return;
  const tick = estado.tick;
  const eco = criarInimigo(preset, `v${estado.proximoId++}`, de.x, de.y, ctx.balance);
  eco.tipo = 'invocacao';
  eco.equipe = mago.equipe;
  eco.xpBase = 0;
  eco.nivel = mago.nivel;
  eco.hpMax = Math.max(1, Math.round((mago.hpMax * b.hpPct) / 100));
  eco.hp = eco.hpMax;
  if (mago.olhando) eco.olhando = mago.olhando;
  eco.invocacao = { donoId: mago.id, expiraTick: tick + ticksDe(b.duracaoMs), dominado: false, comportamento: 'isca', avatar: false, golpesRestantes: 0, abates: 0, criadoTick: tick, nivelDominacao: 0 };
  posicionar(eco, de.x, de.y);
  estado.entidades.push(eco);
  saida.push({ t: 'invocou', tick, donoId: mago.id, id: eco.id });
  const origem = { id: eco.id, x: eco.x, y: eco.y };
  for (const o of estado.entidades) {
    if (!vivo(o) || o.bolsa || chebyshev(o, de) > b.provocarRaio || !podeFerir(mago, o, ctx.modo)) continue;
    aplicarEfeito(estado, ctx, o, construirEfeito('desafiado', { duracaoMs: b.duracaoMs, pct: 0 }), origem, null, saida, false);
    if (o.alvoSelecionado === mago.id) o.alvoSelecionado = eco.id;
  }
  mago.invisivelAteTick = Math.max(mago.invisivelAteTick, tick + ticksDe(b.invisivelMs));
}

/** A armadilha do Salto para Trás: no ponto de onde saiu, da ponta do Arqueiro (a do Físico explode). */
export function armadilhaDoRecuo(estado: EstadoJogo, ctx: ContextoSimulacao, dono: Entidade, c: Celula, ponta: PontaElemental, saida: EventoSimulacao[]): void {
  if (!passavel(ctx.fase, c.x, c.y) || estado.armadilhas.some((a) => a.x === c.x && a.y === c.y)) return;
  const r = ctx.balance.movimentoClasse.armadilhaRecuo;
  const id = estado.proximoId++;
  estado.armadilhas.push({
    ...(ponta !== 'fisico' && { elemento: ponta }),
    id,
    donoId: dono.id,
    equipeDono: dono.equipe,
    x: c.x,
    y: c.y,
    valor: Math.max(1, Math.round(dono.nivel * r.valorPorNivel)),
    interno: null,
    ateTick: estado.tick + ticksDe(r.duracaoMs),
    origem: 'habilidade',
    permanente: false,
    rearmeTicks: 0,
    inerteAteTick: 0,
    reveladaPara: [],
  });
  saida.push({ t: 'armadilhaArmada', tick: estado.tick, donoId: dono.id, armadilhaId: id, x: c.x, y: c.y });
}

/** Os círculos do Acelerar: quem está dentro (inimigo também) corre; no marco, o elemento a cada tanto. */
export function processarCirculos(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  const b = ctx.balance.movimentoClasse.acelerar;
  const tick = estado.tick;
  const pulso = tick % Math.max(1, ticksDe(b.pulsoMs)) === 0;
  const elemento = tick % Math.max(1, ticksDe(b.elementoMs)) === 0;
  if (!pulso && !elemento) return;
  for (const dono of estado.entidades) {
    const c = dono.movimentoClasse?.circulo;
    if (!c) continue;
    if (c.ateTick <= tick || !vivo(dono)) {
      delete dono.movimentoClasse?.circulo;
      continue;
    }
    for (const o of estado.entidades) {
      if (!vivo(o) || chebyshev(o, c) > c.raio) continue;
      if (pulso) aplicarEfeito(estado, ctx, o, construirEfeito('acelerado', { pct: c.pct, duracaoMs: b.pulsoMs * 2 }), { id: dono.id, x: c.x, y: c.y }, null, saida, false);
      if (elemento && c.ponta) tocarPonta(estado, ctx, dono, o, c.ponta, saida, Math.max(1, Math.round(dono.nivel * b.curaPorNivel)));
    }
  }
}

/** Anda `e` até (tx, ty) a `passo` células, sem caminho (a névoa e o veículo levam o corpo). Olha para onde vai. */
function levar(e: Entidade, tx: number, ty: number, passo: number): void {
  const dx = tx - e.px;
  const dy = ty - e.py;
  const d = Math.hypot(dx, dy);
  if (d < 1e-6) return;
  const k = Math.min(1, passo / d);
  const dir = direcaoDe(dx, dy);
  posicionar(e, e.px + dx * k, e.py + dy * k);
  e.direcao = 'parado';
  if (dir) e.olhando = dir;
}

const cabeAli = (ctx: ContextoSimulacao, x: number, y: number) => passavel(ctx.fase, Math.round(x), Math.round(y)) && corpoCabe(ctx.fase, Math.round(x), Math.round(y), ctx.balance.movimento.raioCorpo);

/** Os servos do Necromante que entram na névoa: todos os dele (fora os do posto e o companheiro). */
export function servosDaNevoa(estado: EstadoJogo, dono: Entidade): Entidade[] {
  return estado.entidades.filter((s) => vivo(s) && s.invocacao?.donoId === dono.id && !s.invocacao.companheiro && !s.invocacao.posto && s.invocacao.comportamento !== 'isca' && s.invocacao.comportamento !== 'torre');
}

/**
 * Os servos na névoa vão num anel em volta do Necromante (à frente e dos lados, não atrás), na velocidade dele ou mais:
 * a névoa reúne os servos. Não lutam (ia-invocacao.ts) nem perdem o rumo.
 */
export function levarServosNaNevoa(estado: EstadoJogo, ctx: ContextoSimulacao, dono: Entidade, velocidadeDono: number): void {
  const b = ctx.balance.movimentoClasse.nevoa;
  const servos = estado.entidades.filter((s) => vivo(s) && s.invocacao?.donoId === dono.id && (s.invocacao.nevoaAteTick ?? 0) > estado.tick).sort((a, c) => a.id.localeCompare(c.id));
  if (servos.length === 0) return;
  const passo = (Math.max(b.velocidadeMin, velocidadeDono * 1.6) * DT_MS) / 1000;
  // O anel gira com o rumo do Necromante: o primeiro vai à frente, os outros se abrem dos dois lados.
  const base = Math.atan2(dono.rumoY || 0, dono.rumoX || 0) || 0;
  servos.forEach((s, i) => {
    const lado = i % 2 === 0 ? 1 : -1;
    const angulo = base + lado * Math.ceil(i / 2) * ((2 * Math.PI) / Math.max(3, servos.length + 1));
    let tx = dono.px + Math.cos(angulo) * b.anel;
    let ty = dono.py + Math.sin(angulo) * b.anel;
    if (!cabeAli(ctx, tx, ty)) {
      tx = dono.px;
      ty = dono.py;
    }
    levar(s, tx, ty, passo);
    s.alvoSelecionado = null;
  });
}

/** O servo que saiu da névoa dentro de uma parede (a névoa atravessa) volta para junto do Necromante. */
export function assentarServo(ctx: ContextoSimulacao, s: Entidade, dono: Entidade): void {
  if (s.invocacao) delete s.invocacao.nevoaAteTick;
  if (!cabeAli(ctx, s.px, s.py)) posicionar(s, dono.px, dono.py);
}

/** O companheiro do Aventureiro que é a mecânica `pet` em curso (o veículo dele), se está em campo. */
export function companheiroDe(estado: EstadoJogo, dono: Entidade, pet: string): Entidade | undefined {
  return estado.entidades.find((c) => vivo(c) && c.invocacao?.companheiro && c.invocacao.donoId === dono.id && petDoCompanheiro(c) === pet);
}

/** O veículo vai com o dono: no mesmo ponto, virado para onde ele vai (desmonta onde o dono parar). */
export function levarVeiculo(veiculo: Entidade, dono: Entidade): void {
  posicionar(veiculo, dono.px, dono.py);
  // Parado na simulação (quem o leva é o dono), mas virado para onde o dono vai.
  veiculo.direcao = 'parado';
  veiculo.rumoX = dono.rumoX;
  veiculo.rumoY = dono.rumoY;
  const dir = dono.rumoX !== 0 || dono.rumoY !== 0 ? direcaoDe(dono.rumoX, dono.rumoY) : null;
  const olhar = dir ?? dono.olhando;
  if (olhar) veiculo.olhando = olhar;
  veiculo.alvoSelecionado = null;
}

/** O companheiro que desmonta com o marco elemental: descarrega a ponta nos próximos golpes. */
export function carregarDescarga(estado: EstadoJogo, ctx: ContextoSimulacao, pet: Entidade, ponta: PontaElemental): void {
  if (!pet.invocacao) return;
  const d = ctx.balance.movimentoClasse.descarga;
  pet.invocacao.descarga = { ponta, golpes: d.golpes, ateTick: estado.tick + ticksDe(d.duracaoMs) };
}

/** O dono do servo (atalho para quem não tem o estado à mão). */
export const donoDe = (estado: EstadoJogo, e: Entidade): Entidade | undefined => (e.invocacao ? buscarEntidade(estado, e.invocacao.donoId) : undefined);
