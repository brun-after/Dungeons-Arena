// Marco 40 (13/11/2026, D-164): o que o movimento da classe deixa no mundo, desenhado à mão (sem brilho aditivo nem
// tremor de tela):
// - a Forma de névoa (D-170): o Necromante e os servos viram uma nuvem etérea só, de blocos grandes que se fundem, com
//   os olhos pálidos dele no meio e um rastro de trevas mesclado com a cor da ponta;
// - a Âncora Rúnica (D-168): o totem rúnico no ponto de volta e, para o Mago e os aliados, a linha azul fina do alcance
//   (D-170); na volta, o símbolo de conjuração nas duas pontas e o rastro da ponta entre elas;
// - o Acelerar (D-170): o círculo à frente do Mago, que se forma traçado e depois gira as divisas da pressa;
// - o companheiro que desmonta com o marco elemental: o círculo da ponta embaixo dele e a aura subindo;
// - a Troca de corpo e o Posto dos Mortos: a escuridão estoura nos dois lugares; o servo no posto marca o chão e, para o
//   Necromante e os aliados, a linha roxa fina do limite (D-170);
// - o Salto de Guerra: a poeira em anel e as rachaduras na queda;
// - a Arremetida: o rastro no ar e a poeira de onde saiu; a Marcha e a montaria levantam poeira;
// - a Chegada (D-170): a corda esticada do alto até as mãos, no pêndulo do corpo; a camuflagem solta folhas.
// D-170: o que fica no chão está em chao-movimento.ts (nas coordenadas do plano); aqui, o que sobe no ar (projetado).

import { Graphics, type Container } from 'pixi.js';
import type { EstadoJogo } from '../../core/estado';
import type { Barramento } from '../../core/events';
import type { EventosDaSimulacao } from '../../core/eventos-simulacao';
import { DT_MS } from '../../core/loop';
import type { Entidade, PontoVisual } from '../../entities/entidade';
import type { PontaElemental } from '../../progression/vinculo';
import { centroDaCelula, type Projecao } from '../projecao';
import { anelDePoeira, baseDoTotem, circuloAcelerar, COR_ARCANA, linhaDeAlcance, marcaDoPosto, rachaduras, sigilo } from './chao-movimento';
import { ARCO_DO_BALANCO, balancoDaCorda, MAOS_PX, naNevoa, pendulo, PIVO_PX, type CorpoEmMovimento } from './corpo-movimento';

type Efemero =
  | { t: 'sigilo'; x: number; y: number; inicio: number; dur: number; abre: boolean; cor: number }
  | { t: 'treva'; x: number; y: number; inicio: number; dur: number }
  | { t: 'pouso'; x: number; y: number; inicio: number; dur: number; semente: number }
  | { t: 'risco'; x: number; y: number; x2: number; y2: number; inicio: number; dur: number }
  | { t: 'poeira'; x: number; y: number; inicio: number; dur: number; dx: number }
  | { t: 'folha'; x: number; y: number; inicio: number; dur: number; dx: number }
  | { t: 'faisca'; x: number; y: number; x2: number; y2: number; inicio: number; dur: number; cor: number };

type Ponto = { x: number; y: number };

const TREVA = 0x050407;
const POEIRA = 0x8a7a66;
const LIMITE = 160;
/** Quanto dura o rastro da névoa (ms). */
const TRILHA_MS = 900;

export interface OpcoesRastros {
  projecao: () => Projecao;
  posicao: (e: Entidade) => PontoVisual;
  reduzido: () => boolean;
  /** D-168: a cor de cada ponta do eneágono e quem o jogador local vê como aliado (ele mesmo incluído). */
  corDaPonta: (p: PontaElemental) => number;
  aliadoDoLocal: (e: Entidade) => boolean;
  /** D-170: quanto o círculo do Acelerar leva para se formar e o limite do Posto dos Mortos (células). */
  formarAcelerarMs: number;
  limitePosto: number;
}

export class RastrosDeMovimento {
  private readonly chao = new Graphics();
  private readonly ar = new Graphics();
  private efemeros: Efemero[] = [];
  /** Por onde a névoa passou (o rastro que se arrasta), por membro da nuvem. */
  private readonly trilhas = new Map<string, { x: number; y: number; ms: number }[]>();
  private readonly ultimaPoeira = new Map<string, { x: number; y: number; ms: number }>();

  constructor(camadaChao: Container, camadaAr: Container, private readonly corpo: CorpoEmMovimento, private readonly o: OpcoesRastros) {
    camadaChao.addChild(this.chao);
    camadaAr.addChild(this.ar);
  }

  ligar(bus: Barramento<EventosDaSimulacao>, estado: () => EstadoJogo, agora: () => number): void {
    bus.on('deslocado', (ev) => {
      if (ev.origemId !== ev.id) return;
      const ms = agora();
      const quem = estado().entidades.find((e) => e.id === ev.id);
      if (ev.causa === 'teleporte') {
        // O Necromante troca de lugar pela escuridão; o Mago, pelo símbolo de conjuração.
        if (quem?.bolsa?.classeId === 'necromante') {
          this.por({ t: 'treva', x: ev.deX, y: ev.deY, inicio: ms, dur: 700 });
          this.por({ t: 'treva', x: ev.paraX, y: ev.paraY, inicio: ms + 60, dur: 700 });
        } else {
          this.por({ t: 'sigilo', x: ev.deX, y: ev.deY, inicio: ms, dur: 1100, abre: false, cor: COR_ARCANA });
          this.por({ t: 'sigilo', x: ev.paraX, y: ev.paraY, inicio: ms, dur: 1100, abre: true, cor: COR_ARCANA });
        }
      } else if (ev.causa === 'avanco' && quem?.bolsa?.classeId !== 'aventureiro') {
        this.por({ t: 'risco', x: ev.deX, y: ev.deY, x2: ev.paraX, y2: ev.paraY, inicio: ms, dur: 500 });
        for (let i = 0; i < 3; i++) this.por({ t: 'poeira', x: ev.deX, y: ev.deY, inicio: ms + i * 40, dur: 600, dx: (i - 1) * 0.25 });
      } else if (ev.causa === 'recuo') {
        for (let i = 0; i < 2; i++) this.por({ t: 'poeira', x: ev.deX, y: ev.deY, inicio: ms + i * 50, dur: 520, dx: (i - 0.5) * 0.3 });
        for (let i = 0; i < 3; i++) this.por({ t: 'poeira', x: ev.paraX, y: ev.paraY, inicio: ms + 500 + i * 40, dur: 520, dx: (i - 1) * 0.3 });
      }
    });
    bus.on('movimentoClasse', (ev) => {
      const ms = agora();
      const quem = estado().entidades.find((e) => e.id === ev.id);
      if (!quem) return;
      const l = this.corpo.lances.get(ev.id);
      // D-168: o rastro da ponta na volta à Âncora, entre onde o Mago estava e onde chegou (com o eco, só para os aliados).
      if (ev.fase === 'inicio' && l?.tipo === 'ancora' && ev.ponta && (!ev.eco || this.o.aliadoDoLocal(quem))) {
        const cor = this.o.corDaPonta(ev.ponta);
        for (let i = 0; i < 7; i++) this.por({ t: 'faisca', x: l.de.x, y: l.de.y, x2: quem.px, y2: quem.py, inicio: ms + i * 25, dur: 900 + i * 60, cor });
      }
      if (ev.fase === 'fim' && l?.tipo === 'salto') {
        this.por({ t: 'pouso', x: quem.px, y: quem.py, inicio: ms, dur: 1400, semente: (ms % 997) / 997 });
        for (let i = 0; i < 5; i++) this.por({ t: 'poeira', x: quem.px, y: quem.py, inicio: ms, dur: 700, dx: (i - 2) * 0.35 });
      }
      if (ev.fase === 'inicio' && l?.tipo === 'nevoa') for (const k of [...this.trilhas.keys()]) if (k.startsWith(`${ev.id}|`)) this.trilhas.delete(k);
    });
  }

  private por(e: Efemero): void {
    this.efemeros.push(e);
    if (this.efemeros.length > LIMITE) this.efemeros.splice(0, this.efemeros.length - LIMITE);
  }

  /** O ponto projetado na tela (a camada do ar). */
  private tela(x: number, y: number): Ponto {
    const c = centroDaCelula(x, y);
    return this.o.projecao().projetar(c.x, c.y);
  }

  quadro(estado: EstadoJogo, agoraMs: number): void {
    const chao = this.chao.clear();
    const ar = this.ar.clear();
    const reduzido = this.o.reduzido();
    const giro = reduzido ? 0 : agoraMs;
    for (const e of estado.entidades) {
      if (e.morto) continue;
      const mc = e.movimentoClasse;
      const aliado = this.o.aliadoDoLocal(e);
      if (mc?.ancora && mc.ancora.ateTick > estado.tick) this.totemDaAncora(chao, ar, mc.ancora, agoraMs, reduzido, aliado);
      const c = mc?.circulo;
      if (c && c.ateTick > estado.tick) {
        const formar = Math.min(1, ((estado.tick - c.desdeTick) * DT_MS) / Math.max(1, this.o.formarAcelerarMs));
        const fim = Math.min(1, ((c.ateTick - estado.tick) * DT_MS) / 800);
        circuloAcelerar(chao, centroDaCelula(c.x, c.y), c.raio, c.ponta ? this.o.corDaPonta(c.ponta) : COR_ARCANA, formar, fim, giro);
      }
      const posto = e.invocacao?.posto;
      if (posto) {
        const centro = centroDaCelula(posto.x, posto.y);
        marcaDoPosto(chao, centro, giro);
        if (aliado) linhaDeAlcance(chao, centro, this.o.limitePosto, true);
      }
      const d = e.invocacao?.descarga;
      if (d && d.golpes > 0 && d.ateTick > estado.tick) this.descarga(chao, ar, this.o.posicao(e), this.o.corDaPonta(d.ponta), agoraMs, reduzido);
      const m = mc?.modo;
      if (!m) continue;
      const pos = this.o.posicao(e);
      if (m.tipo === 'nevoa') {
        const membros = [e, ...estado.entidades.filter((s) => !s.morto && s.invocacao?.donoId === e.id && naNevoa(s, estado))];
        this.nuvem(ar, e.id, membros.map((s) => this.o.posicao(s)), m.ponta ? this.o.corDaPonta(m.ponta) : 0x4a3a5e, agoraMs, reduzido);
      } else if (m.tipo === 'tirolesa') {
        this.cordaDoBalanco(ar, e, pos, m);
      } else if (!reduzido && (m.tipo === 'marcha' || m.tipo === 'montado' || m.tipo === 'camuflado')) {
        const ultima = this.ultimaPoeira.get(e.id) ?? { x: pos.x, y: pos.y, ms: 0 };
        this.levantar(e, pos, agoraMs, m.tipo === 'camuflado' ? 'folha' : 'poeira', m.tipo === 'montado' && m.pesada ? 70 : 110, ultima);
      }
    }
    this.efemeros = this.efemeros.filter((f) => agoraMs - f.inicio < f.dur);
    for (const f of this.efemeros) {
      const u = Math.max(0, (agoraMs - f.inicio) / f.dur);
      if (agoraMs < f.inicio) continue;
      if (f.t === 'sigilo') sigilo(chao, centroDaCelula(f.x, f.y), u, f.abre ? 0.55 + 0.55 * Math.min(1, u * 3) : 1.05 - 0.6 * u, f.cor, giro, 1 - u);
      else if (f.t === 'pouso') {
        const c = centroDaCelula(f.x, f.y);
        rachaduras(chao, c, 1 - u, f.semente);
        anelDePoeira(chao, c, u);
      } else {
        const p = this.tela(f.x, f.y);
        if (f.t === 'treva') this.estouroDeTreva(ar, p, u);
        else if (f.t === 'risco') this.risco(ar, p, this.tela(f.x2, f.y2), u);
        else if (f.t === 'poeira') this.nuvemDePoeira(ar, p, u, f.dx);
        else if (f.t === 'folha') this.folha(ar, p, u, f.dx);
        else this.faisca(ar, p, this.tela(f.x2, f.y2), u, f.cor, f.inicio);
      }
    }
  }

  /** Poeira (ou folhas) a cada passo de quem corre. */
  private levantar(e: Entidade, pos: PontoVisual, agoraMs: number, t: 'poeira' | 'folha', intervalo: number, ultima: { x: number; y: number; ms: number }): void {
    const andou = Math.hypot(pos.x - ultima.x, pos.y - ultima.y) > 0.05;
    if (!andou || agoraMs - ultima.ms < intervalo) {
      if (!andou) this.ultimaPoeira.set(e.id, { ...ultima, x: pos.x, y: pos.y });
      return;
    }
    this.ultimaPoeira.set(e.id, { x: pos.x, y: pos.y, ms: agoraMs });
    this.por({ t, x: pos.x, y: pos.y, inicio: agoraMs, dur: t === 'folha' ? 900 : 560, dx: (Math.random() - 0.5) * 0.4 });
  }

  /**
   * D-170: a nuvem etérea da névoa, uma só para o Necromante e os servos. Cada membro é um bloco grande e translúcido;
   * entre o Necromante e cada servo, mais blocos ligam os dois, e a nuvem vira uma massa só. Atrás, o rastro mescla as
   * trevas com a cor da ponta; na borda, fiapos da cor da ponta giram; no meio, os olhos pálidos do Necromante.
   */
  private nuvem(g: Graphics, id: string, membros: PontoVisual[], cor: number, agoraMs: number, reduzido: boolean): void {
    const pts = membros.map((m) => this.tela(m.x, m.y));
    const centro = pts[0];
    if (!centro) return;
    const t = reduzido ? 0 : agoraMs / 1000;
    // O rastro: um por membro, as trevas e a cor da ponta alternadas, se apagando.
    pts.forEach((p, i) => {
      const chave = `${id}|${i}`;
      const trilha = this.trilhas.get(chave) ?? [];
      const ultimo = trilha.at(-1);
      if (!ultimo || agoraMs - ultimo.ms > 60) trilha.push({ x: p.x, y: p.y, ms: agoraMs });
      while (trilha.length > 0 && agoraMs - (trilha[0]?.ms ?? 0) > TRILHA_MS) trilha.shift();
      this.trilhas.set(chave, trilha);
      trilha.forEach((q, k) => {
        const v = 1 - (agoraMs - q.ms) / TRILHA_MS;
        const daPonta = k % 3 === 1;
        g.circle(q.x + Math.sin(k * 1.7) * 4, q.y - 14 - (1 - v) * 10, 9 + 12 * v).fill({ color: daPonta ? cor : TREVA, alpha: (daPonta ? 0.16 : 0.24) * v });
      });
    });
    // Os blocos que ligam o Necromante a cada servo (a nuvem não se parte).
    const blocos: { x: number; y: number; r: number }[] = [];
    for (const p of pts.slice(1)) {
      const n = Math.max(1, Math.ceil(Math.hypot(p.x - centro.x, p.y - centro.y) / 16));
      for (let k = 1; k < n; k++) blocos.push({ x: centro.x + ((p.x - centro.x) * k) / n, y: centro.y - 18 + ((p.y - centro.y) * k) / n, r: 22 });
    }
    for (const [i, p] of pts.entries()) {
      for (let k = 0; k < 6; k++) {
        const ang = k * 1.05 + i * 0.9 + t * (k % 2 ? 0.7 : -0.5);
        const r = 12 + 4 * Math.sin(t * 1.3 + k + i);
        blocos.push({ x: p.x + Math.cos(ang) * r * 1.3, y: p.y - 18 + Math.sin(ang) * r * 0.75, r: (i === 0 ? 20 : 17) + 4 * Math.sin(t * 2 + k * 1.7 + i) });
      }
    }
    // A sombra no chão, depois a massa (em duas passadas: a de fora, mais clara e larga; a de dentro, densa).
    for (const p of pts) g.ellipse(p.x, p.y + 1, 26, 10).fill({ color: 0x000000, alpha: 0.3 });
    for (const b of blocos) g.circle(b.x, b.y, b.r * 1.25).fill({ color: 0x14101c, alpha: 0.16 });
    for (const b of blocos) g.circle(b.x, b.y, b.r).fill({ color: TREVA, alpha: 0.3 });
    for (const p of pts) g.ellipse(p.x, p.y - 18, 16, 19).fill({ color: 0x020203, alpha: 0.45 });
    // Os fiapos da ponta girando na borda (cada um abre o próprio traço: sem a linha solta do `arc`).
    for (const [i, p] of pts.entries()) {
      for (let k = 0; k < 3; k++) {
        const ini = t * 0.9 + k * 2.1 + i;
        const r = 24 + k * 3;
        g.moveTo(p.x + Math.cos(ini) * r, p.y - 18 + Math.sin(ini) * r * 0.75);
        for (let s = 1; s <= 6; s++) {
          const a = ini + (s / 6) * 1.1;
          g.lineTo(p.x + Math.cos(a) * r, p.y - 18 + Math.sin(a) * r * 0.75);
        }
        g.stroke({ color: cor, width: 1.6, alpha: 0.4 });
      }
    }
    const pisca = Math.sin(t * 0.7) > 0.97 ? 0.15 : 1;
    for (const lado of [-1, 1]) g.ellipse(centro.x + lado * 3.6, centro.y - 24, 1.7, 1.1 * pisca).fill({ color: 0xd7e0cf, alpha: 0.75 });
  }

  /**
   * D-168: o totem rúnico da Âncora: uma pedra alta e estreita com as runas acesas descendo por ela (diferente da
   * armadilha baixa dos monstros). D-170: a base e a linha azul do alcance ficam no chão, no plano.
   */
  private totemDaAncora(chao: Graphics, ar: Graphics, a: { x: number; y: number; raio: number }, agoraMs: number, reduzido: boolean, mostraAlcance: boolean): void {
    const base = centroDaCelula(a.x, a.y);
    const pulso = reduzido ? 0.5 : 0.5 + 0.5 * Math.sin(agoraMs / 500);
    if (mostraAlcance) linhaDeAlcance(chao, base, a.raio + 0.5, false);
    baseDoTotem(chao, base, pulso);
    const p = this.tela(a.x, a.y);
    const cor = COR_ARCANA;
    ar.poly([p.x - 6, p.y, p.x - 4, p.y - 30, p.x, p.y - 35, p.x + 4, p.y - 30, p.x + 6, p.y]).fill({ color: 0x3b3848, alpha: 0.95 }).stroke({ color: 0x1a1822, width: 1, alpha: 0.9 });
    ar.poly([p.x + 1, p.y, p.x + 3, p.y - 30, p.x, p.y - 35, p.x + 6, p.y]).fill({ color: 0x2a2836, alpha: 0.8 });
    for (let i = 0; i < 3; i++) {
      const y = p.y - 8 - i * 9;
      const brilho = 0.55 + 0.45 * (reduzido ? 0.5 : Math.max(0, Math.sin(agoraMs / 300 - i * 0.9)));
      ar.moveTo(p.x - 2, y - 2).lineTo(p.x + 2, y + 2).moveTo(p.x + 2, y - 2).lineTo(p.x - 2, y + 2).stroke({ color: cor, width: 1.3, alpha: brilho });
    }
    ar.circle(p.x, p.y - 37, 2.2 + pulso).fill({ color: cor, alpha: 0.5 + 0.3 * pulso });
  }

  /** D-168: a aura da ponta no companheiro que desmontou: o círculo embaixo dele (no chão) e os fiapos que sobem. */
  private descarga(chao: Graphics, ar: Graphics, pos: PontoVisual, cor: number, agoraMs: number, reduzido: boolean): void {
    const pulso = reduzido ? 0.5 : 0.5 + 0.5 * Math.sin(agoraMs / 180);
    sigilo(chao, centroDaCelula(pos.x, pos.y), 0, 1.05 + 0.08 * pulso, cor, reduzido ? 0 : agoraMs * 1.4, 0.75);
    const p = this.tela(pos.x, pos.y);
    for (let i = 0; i < 6; i++) {
      const u = reduzido ? 0.5 : ((agoraMs / 900 + i / 6) % 1);
      const ang = i * 1.05;
      const x = p.x + Math.cos(ang) * 12 * (1 - u * 0.4);
      const y = p.y - 6 - 34 * u + Math.sin(ang) * 4;
      ar.circle(x, y, 2.6 * (1 - u) + 0.8).fill({ color: cor, alpha: 0.7 * (1 - u) });
    }
    ar.ellipse(p.x, p.y - 16, 15 + 2 * pulso, 20 + 2 * pulso).stroke({ color: cor, width: 1.4, alpha: 0.35 + 0.2 * pulso });
  }

  /** D-168: o rastro da ponta da Âncora: as faíscas que correm de onde o Mago estava até onde chegou e se apagam. */
  private faisca(g: Graphics, a: Ponto, b: Ponto, u: number, cor: number, semente: number): void {
    const f = 1 - u;
    const s = (semente % 97) / 97;
    for (let i = 0; i < 4; i++) {
      const t = Math.min(1, u * 1.6 + i * 0.08) * (0.25 + 0.75 * ((s + i * 0.31) % 1));
      const x = a.x + (b.x - a.x) * t + Math.sin((s + i) * 9) * 5;
      const y = a.y + (b.y - a.y) * t - 18 - Math.cos((s + i) * 7) * 8 - 6 * u;
      g.circle(x, y, 2.2 * f + 0.6).fill({ color: cor, alpha: 0.8 * f });
    }
    g.moveTo(a.x, a.y - 18).lineTo(b.x, b.y - 18).stroke({ color: cor, width: 1.2, alpha: 0.25 * f });
  }

  private estouroDeTreva(g: Graphics, p: Ponto, u: number): void {
    const f = 1 - u;
    for (let i = 0; i < 10; i++) {
      const ang = i * 0.63;
      const r = 4 + 22 * Math.sqrt(u);
      g.circle(p.x + Math.cos(ang) * r, p.y - 14 + Math.sin(ang) * r * 0.55 - u * 10, 7 + 5 * u).fill({ color: TREVA, alpha: 0.45 * f });
    }
    g.ellipse(p.x, p.y - 14, 12 * f + 2, 16 * f + 2).fill({ color: 0x020203, alpha: 0.55 * f });
  }

  private risco(g: Graphics, a: Ponto, b: Ponto, u: number): void {
    const f = 1 - u;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const n = Math.hypot(dx, dy) || 1;
    const px = -dy / n;
    const py = dx / n;
    for (const [off, alt] of [[-5, 10], [0, 18], [5, 26], [-2, 22]] as const) {
      const ini = 0.15 + u * 0.6;
      g.moveTo(a.x + dx * ini + px * off, a.y + dy * ini + py * off - alt).lineTo(b.x - dx * 0.08 + px * off, b.y - dy * 0.08 + py * off - alt).stroke({ color: 0xe8e0d0, width: 1.4, alpha: 0.35 * f });
    }
  }

  private nuvemDePoeira(g: Graphics, p: Ponto, u: number, dx: number): void {
    const f = 1 - u;
    g.circle(p.x + dx * 28 * u, p.y - 3 - 8 * u, 3 + 7 * u).fill({ color: POEIRA, alpha: 0.32 * f });
  }

  private folha(g: Graphics, p: Ponto, u: number, dx: number): void {
    const f = 1 - u;
    const x = p.x + dx * 30 * u + Math.sin(u * 9) * 4;
    const y = p.y - 26 + 26 * u;
    g.ellipse(x, y, 2.6, 1.2).fill({ color: 0x6f8a4a, alpha: 0.6 * f });
  }

  /**
   * D-170: a corda do balanço, esticada. A cada arco, a flecha crava no alto (`PIVO_PX`), no meio do arco; a corda vai
   * reta dela até as mãos, que seguem o pêndulo do corpo (corpo-movimento.ts). No começo do arco, ainda esticando, ela
   * vibra um pouco.
   */
  private cordaDoBalanco(g: Graphics, e: Entidade, pos: PontoVisual, m: { restante?: number; rumoX?: number; rumoY?: number }): void {
    const l = this.corpo.lances.get(e.id);
    const b = balancoDaCorda(m, l?.corda?.total ?? 1);
    const rx = m.rumoX ?? l?.corda?.rumoX ?? 1;
    const ry = m.rumoY ?? l?.corda?.rumoY ?? 0;
    const falta = (0.5 - b.u) * ARCO_DO_BALANCO;
    const preso = this.tela(pos.x + rx * falta, pos.y + ry * falta);
    const topo = { x: preso.x, y: preso.y - PIVO_PX };
    const p = this.tela(pos.x, pos.y);
    const maos = { x: p.x, y: p.y - pendulo(b.u).alturaPx - MAOS_PX };
    const vibra = 6 * Math.max(0, 1 - b.u * 6) * Math.sin(b.u * 80);
    g.moveTo(topo.x, topo.y).quadraticCurveTo((topo.x + maos.x) / 2 + vibra, (topo.y + maos.y) / 2, maos.x, maos.y).stroke({ color: 0xd8d0c0, width: 1.6, alpha: 0.9 });
    g.circle(topo.x, topo.y, 2.4).fill({ color: 0x6b4a2a, alpha: 0.9 });
  }

  limpar(): void {
    this.efemeros = [];
    this.trilhas.clear();
    this.ultimaPoeira.clear();
  }

  destruir(): void {
    this.chao.destroy();
    this.ar.destroy();
  }
}
