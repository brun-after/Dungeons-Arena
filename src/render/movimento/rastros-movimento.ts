// Marco 40 (13/11/2026, D-164): o que o movimento da classe deixa no mundo, desenhado à mão (sem brilho aditivo nem
// tremor de tela):
// - a Forma de névoa: o Necromante e os servos perto dele viram uma nuvem de escuridão que se arrasta, com os olhos
//   pálidos do Necromante no meio;
// - a Âncora Rúnica (D-168): o totem rúnico no ponto de volta, com o círculo sutil do alcance para voltar; na volta, o
//   símbolo de conjuração nas duas pontas e o rastro da ponta do Mago entre elas (à vista de todos até o eco; depois, só
//   dele e dos aliados);
// - o Acelerar (D-168): o círculo grande no chão, com as setas correndo em volta, na cor da ponta quando é elemental;
// - o companheiro que desmonta com o marco elemental: o círculo da ponta embaixo dele e a aura subindo;
// - a Troca de corpo e o Posto dos Mortos: a escuridão estoura nos dois lugares; o servo no posto marca o chão;
// - o Salto de Guerra: a poeira em anel e as rachaduras na queda;
// - a Arremetida: o rastro no ar e a poeira de onde saiu; a Marcha e a montaria levantam poeira;
// - a Chegada (D-168): a corda lançada no alto, à frente, a cada arco do balanço; a camuflagem solta folhas.

import { Graphics, type Container } from 'pixi.js';
import type { EstadoJogo } from '../../core/estado';
import type { Barramento } from '../../core/events';
import type { EventosDaSimulacao } from '../../core/eventos-simulacao';
import type { Entidade, PontoVisual } from '../../entities/entidade';
import type { PontaElemental } from '../../progression/vinculo';
import { centroDaCelula, type Projecao } from '../projecao';
import { ARCO_DO_BALANCO, balancoDaCorda, naNevoa, type CorpoEmMovimento } from './corpo-movimento';

type Efemero =
  | { t: 'sigilo'; x: number; y: number; inicio: number; dur: number; abre: boolean; cor: number }
  | { t: 'treva'; x: number; y: number; inicio: number; dur: number }
  | { t: 'pouso'; x: number; y: number; inicio: number; dur: number; semente: number }
  | { t: 'risco'; x: number; y: number; x2: number; y2: number; inicio: number; dur: number }
  | { t: 'poeira'; x: number; y: number; inicio: number; dur: number; dx: number }
  | { t: 'folha'; x: number; y: number; inicio: number; dur: number; dx: number }
  | { t: 'faisca'; x: number; y: number; x2: number; y2: number; inicio: number; dur: number; cor: number };

const COR_ARCANA = 0xa58cff;
const TREVA = 0x050407;
const POEIRA = 0x8a7a66;
const LIMITE = 160;

export interface OpcoesRastros {
  projecao: () => Projecao;
  posicao: (e: Entidade) => PontoVisual;
  reduzido: () => boolean;
  /** D-168: a cor de cada ponta do eneágono e quem o jogador local vê como aliado (ele mesmo incluído). */
  corDaPonta: (p: PontaElemental) => number;
  aliadoDoLocal: (e: Entidade) => boolean;
}

export class RastrosDeMovimento {
  private readonly chao = new Graphics();
  private readonly ar = new Graphics();
  private efemeros: Efemero[] = [];
  /** Por onde a névoa passou (o rastro que se arrasta). */
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
        this.por({ t: 'risco', x: ev.deX, y: ev.deY, x2: ev.paraX, y2: ev.paraY, inicio: ms, dur: 420 });
        for (let i = 0; i < 3; i++) this.por({ t: 'poeira', x: ev.deX, y: ev.deY, inicio: ms + i * 40, dur: 600, dx: (i - 1) * 0.25 });
      } else if (ev.causa === 'recuo') {
        for (let i = 0; i < 2; i++) this.por({ t: 'poeira', x: ev.deX, y: ev.deY, inicio: ms + i * 50, dur: 520, dx: (i - 0.5) * 0.3 });
        for (let i = 0; i < 3; i++) this.por({ t: 'poeira', x: ev.paraX, y: ev.paraY, inicio: ms + 330 + i * 40, dur: 520, dx: (i - 1) * 0.3 });
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
      if (ev.fase === 'inicio' && l?.tipo === 'nevoa') this.trilhas.delete(ev.id);
    });
  }

  private por(e: Efemero): void {
    this.efemeros.push(e);
    if (this.efemeros.length > LIMITE) this.efemeros.splice(0, this.efemeros.length - LIMITE);
  }

  private tela(x: number, y: number): { x: number; y: number } {
    const c = centroDaCelula(x, y);
    return this.o.projecao().projetar(c.x, c.y);
  }

  quadro(estado: EstadoJogo, agoraMs: number): void {
    const chao = this.chao.clear();
    const ar = this.ar.clear();
    const reduzido = this.o.reduzido();
    for (const e of estado.entidades) {
      if (e.morto) continue;
      const mc = e.movimentoClasse;
      // D-168: o totem da Âncora (e o círculo do alcance, só para quem a fincou ver até onde pode ir).
      if (mc?.ancora && mc.ancora.ateTick > estado.tick) this.totemDaAncora(chao, ar, mc.ancora, agoraMs, reduzido, this.o.aliadoDoLocal(e));
      // D-168: o círculo do Acelerar fica no chão até acabar.
      if (mc?.circulo && mc.circulo.ateTick > estado.tick) this.circuloAcelerar(chao, mc.circulo, agoraMs, reduzido);
      if (e.invocacao?.posto) this.marcaDoPosto(chao, this.tela(e.invocacao.posto.x, e.invocacao.posto.y), agoraMs);
      const d = e.invocacao?.descarga;
      if (d && d.golpes > 0 && d.ateTick > estado.tick) this.descarga(chao, ar, this.o.posicao(e), this.o.corDaPonta(d.ponta), agoraMs, reduzido);
      const m = mc?.modo;
      if (!m) continue;
      const pos = this.o.posicao(e);
      if (m.tipo === 'nevoa') {
        this.nuvem(ar, e, pos, agoraMs, true);
        for (const s of estado.entidades) if (!s.morto && s.invocacao?.donoId === e.id && naNevoa(s, estado)) this.nuvem(ar, s, this.o.posicao(s), agoraMs, false);
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
      const p = this.tela(f.x, f.y);
      if (f.t === 'sigilo') this.sigilo(chao, p, u, f.abre ? 0.55 + 0.55 * Math.min(1, u * 3) : 1.05 - 0.6 * u, f.cor, agoraMs, 1 - u);
      else if (f.t === 'treva') this.estouroDeTreva(ar, p, u);
      else if (f.t === 'pouso') this.pouso(chao, ar, p, u, f.semente);
      else if (f.t === 'risco') this.risco(ar, p, this.tela(f.x2, f.y2), u);
      else if (f.t === 'poeira') this.nuvemDePoeira(ar, p, u, f.dx);
      else if (f.t === 'folha') this.folha(ar, p, u, f.dx);
      else this.faisca(ar, p, this.tela(f.x2, f.y2), u, f.cor, f.inicio);
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

  /** A nuvem de escuridão: o miolo denso, os fiapos girando em volta e o rastro que se arrasta atrás. */
  private nuvem(g: Graphics, e: Entidade, pos: PontoVisual, agoraMs: number, olhos: boolean): void {
    const p = this.tela(pos.x, pos.y);
    const s = (e.id.charCodeAt(e.id.length - 1) % 7) * 0.9;
    const t = agoraMs / 1000;
    const trilha = this.trilhas.get(e.id) ?? [];
    const ultimo = trilha.at(-1);
    if (!ultimo || agoraMs - ultimo.ms > 70) trilha.push({ x: p.x, y: p.y, ms: agoraMs });
    while (trilha.length > 0 && agoraMs - (trilha[0]?.ms ?? 0) > 650) trilha.shift();
    this.trilhas.set(e.id, trilha);
    for (const q of trilha) {
      const v = 1 - (agoraMs - q.ms) / 650;
      g.circle(q.x, q.y - 12, 6 + 8 * v).fill({ color: TREVA, alpha: 0.22 * v });
    }
    g.ellipse(p.x, p.y + 1, 18, 7).fill({ color: 0x000000, alpha: 0.35 });
    for (let i = 0; i < 9; i++) {
      const ang = i * 0.7 + s + t * (i % 2 ? 0.8 : -0.6);
      const r = 8 + 5 * Math.sin(t * 1.4 + i);
      const bx = p.x + Math.cos(ang) * r * 1.25;
      const by = p.y - 16 + Math.sin(ang) * r * 0.7 - (i % 3) * 3;
      g.circle(bx, by, 9 + 3.5 * Math.sin(t * 2.1 + i * 1.7)).fill({ color: TREVA, alpha: 0.34 });
    }
    g.ellipse(p.x, p.y - 17, 13, 17).fill({ color: 0x020203, alpha: 0.6 });
    // A borda fria, para a nuvem não sumir no chão escuro.
    for (let i = 0; i < 3; i++) {
      const ang = t * 0.9 + i * 2.1 + s;
      g.arc(p.x, p.y - 17, 17 + i * 2, ang, ang + 1.1).stroke({ color: 0x4a3a5e, width: 1.5, alpha: 0.35 });
    }
    if (olhos) {
      const pisca = Math.sin(t * 0.7 + s) > 0.97 ? 0.15 : 1;
      for (const lado of [-1, 1]) g.ellipse(p.x + lado * 3.6, p.y - 24, 1.7, 1.1 * pisca).fill({ color: 0xd7e0cf, alpha: 0.75 });
    }
  }

  /** O símbolo de conjuração: dois anéis, o hexagrama e as runas girando (`escala` abre ou fecha). */
  private sigilo(g: Graphics, p: { x: number; y: number }, u: number, escala: number, cor: number, agoraMs: number, alfa = 0.8): void {
    const r = 20 * escala;
    const k = 0.5;
    const giro = agoraMs / 900;
    g.ellipse(p.x, p.y, r, r * k).stroke({ color: cor, width: 1.6, alpha: alfa });
    g.ellipse(p.x, p.y, r * 0.72, r * 0.72 * k).stroke({ color: cor, width: 1, alpha: alfa * 0.8 });
    const ponto = (ang: number, rr: number) => ({ x: p.x + Math.cos(ang) * rr, y: p.y + Math.sin(ang) * rr * k });
    for (const fase of [0, Math.PI / 3]) {
      const v = [0, 1, 2].map((i) => ponto(giro + fase + (i * 2 * Math.PI) / 3, r * 0.72));
      const [a, b, c] = v;
      if (a && b && c) g.poly([a.x, a.y, b.x, b.y, c.x, c.y]).stroke({ color: cor, width: 1, alpha: alfa * 0.7 });
    }
    for (let i = 0; i < 8; i++) {
      const q = ponto(-giro * 1.3 + (i * Math.PI) / 4, r * 0.86);
      g.rect(q.x - 1.2, q.y - 1.2, 2.4, 2.4).fill({ color: cor, alpha: alfa });
    }
    if (u < 0.25) g.ellipse(p.x, p.y, r * 0.4, r * 0.4 * k).fill({ color: cor, alpha: 0.18 * (1 - u * 4) });
  }

  /**
   * D-168: o círculo do Acelerar, maior que o da pedra de retorno: dois anéis com as runas, e as setas correndo em volta
   * no sentido do giro (a pressa de quem pisa nele). Na cor da ponta quando é elemental; senão, a arcana.
   */
  private circuloAcelerar(g: Graphics, c: { x: number; y: number; raio: number; ponta?: PontaElemental }, agoraMs: number, reduzido: boolean): void {
    const p = this.tela(c.x, c.y);
    const borda = this.tela(c.x + c.raio + 0.5, c.y);
    const r = Math.max(24, Math.hypot(borda.x - p.x, borda.y - p.y));
    const cor = c.ponta ? this.o.corDaPonta(c.ponta) : COR_ARCANA;
    const giro = reduzido ? 0 : agoraMs / 700;
    const k = 0.5;
    g.ellipse(p.x, p.y, r, r * k).fill({ color: cor, alpha: 0.08 }).stroke({ color: cor, width: 2, alpha: 0.75 });
    g.ellipse(p.x, p.y, r * 0.84, r * 0.84 * k).stroke({ color: cor, width: 1, alpha: 0.55 });
    for (let i = 0; i < 12; i++) {
      const a = giro + (i * Math.PI) / 6;
      const x = p.x + Math.cos(a) * r * 0.92;
      const y = p.y + Math.sin(a) * r * 0.92 * k;
      // A seta aponta no sentido do giro (a tangente).
      const tx = -Math.sin(a);
      const ty = Math.cos(a) * k;
      const n = Math.hypot(tx, ty) || 1;
      const ux = (tx / n) * 6;
      const uy = (ty / n) * 6;
      g.moveTo(x - ux - uy * 0.6, y - uy + ux * 0.6).lineTo(x + ux, y + uy).lineTo(x - ux + uy * 0.6, y - uy - ux * 0.6).stroke({ color: cor, width: 1.6, alpha: 0.85 });
    }
    this.sigilo(g, p, 0, (r * 0.6) / 20, cor, reduzido ? 0 : -agoraMs * 0.5, 0.5);
  }

  /**
   * D-168: o totem rúnico da Âncora: uma pedra alta e estreita com as runas acesas descendo por ela, e o anel fino no
   * chão. Diferente da armadilha dos monstros (o círculo baixo no chão): aqui é uma pedra de pé. Em volta, o círculo
   * sutil do alcance da volta (tracejado), visto pelo Mago e pelos aliados.
   */
  private totemDaAncora(chao: Graphics, ar: Graphics, a: { x: number; y: number; raio: number }, agoraMs: number, reduzido: boolean, mostraAlcance: boolean): void {
    const p = this.tela(a.x, a.y);
    const cor = COR_ARCANA;
    const pulso = reduzido ? 0.5 : 0.5 + 0.5 * Math.sin(agoraMs / 500);
    if (mostraAlcance) {
      const borda = this.tela(a.x + a.raio + 0.5, a.y);
      const r = Math.hypot(borda.x - p.x, borda.y - p.y);
      const passos = 48;
      for (let i = 0; i < passos; i += 2) {
        const a0 = (i / passos) * Math.PI * 2 + (reduzido ? 0 : agoraMs / 9000);
        const a1 = ((i + 1) / passos) * Math.PI * 2 + (reduzido ? 0 : agoraMs / 9000);
        chao.moveTo(p.x + Math.cos(a0) * r, p.y + Math.sin(a0) * r * 0.5).lineTo(p.x + Math.cos(a1) * r, p.y + Math.sin(a1) * r * 0.5).stroke({ color: cor, width: 1, alpha: 0.22 });
      }
    }
    chao.ellipse(p.x, p.y, 13, 6.5).fill({ color: 0x0c0a14, alpha: 0.45 }).stroke({ color: cor, width: 1.2, alpha: 0.45 + 0.25 * pulso });
    // A pedra de pé, mais larga embaixo.
    ar.poly([p.x - 6, p.y, p.x - 4, p.y - 30, p.x, p.y - 35, p.x + 4, p.y - 30, p.x + 6, p.y]).fill({ color: 0x3b3848, alpha: 0.95 }).stroke({ color: 0x1a1822, width: 1, alpha: 0.9 });
    ar.poly([p.x + 1, p.y, p.x + 3, p.y - 30, p.x, p.y - 35, p.x + 6, p.y]).fill({ color: 0x2a2836, alpha: 0.8 });
    // As runas acesas, uma sobre a outra.
    for (let i = 0; i < 3; i++) {
      const y = p.y - 8 - i * 9;
      const brilho = 0.55 + 0.45 * (reduzido ? 0.5 : Math.max(0, Math.sin(agoraMs / 300 - i * 0.9)));
      ar.moveTo(p.x - 2, y - 2).lineTo(p.x + 2, y + 2).moveTo(p.x + 2, y - 2).lineTo(p.x - 2, y + 2).stroke({ color: cor, width: 1.3, alpha: brilho });
    }
    ar.circle(p.x, p.y - 37, 2.2 + pulso).fill({ color: cor, alpha: 0.5 + 0.3 * pulso });
  }

  /** D-168: a aura da ponta no companheiro que desmontou: o círculo embaixo dele e os fiapos que sobem. */
  private descarga(chao: Graphics, ar: Graphics, pos: PontoVisual, cor: number, agoraMs: number, reduzido: boolean): void {
    const p = this.tela(pos.x, pos.y);
    const pulso = reduzido ? 0.5 : 0.5 + 0.5 * Math.sin(agoraMs / 180);
    this.sigilo(chao, p, 0, 1.05 + 0.08 * pulso, cor, reduzido ? 0 : agoraMs * 1.4, 0.75);
    for (let i = 0; i < 6; i++) {
      const u = reduzido ? 0.5 : ((agoraMs / 900 + i / 6) % 1);
      const ang = i * 1.05;
      const x = p.x + Math.cos(ang) * 12 * (1 - u * 0.4);
      const y = p.y - 6 - 34 * u + Math.sin(ang) * 4;
      ar.circle(x, y, 2.6 * (1 - u) + 0.8).fill({ color: cor, alpha: 0.7 * (1 - u) });
    }
    ar.ellipse(p.x, p.y - 16, 15 + 2 * pulso, 20 + 2 * pulso).stroke({ color: cor, width: 1.4, alpha: 0.35 + 0.2 * pulso });
  }

  /** D-168: o rastro da ponta do Piscar: as faíscas que correm de onde o Mago estava até onde chegou e se apagam. */
  private faisca(g: Graphics, a: { x: number; y: number }, b: { x: number; y: number }, u: number, cor: number, semente: number): void {
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

  /** O servo de guarda no posto: o chão marcado de escuridão, com a lápide da runa. */
  private marcaDoPosto(g: Graphics, p: { x: number; y: number }, agoraMs: number): void {
    const pulso = 0.5 + 0.5 * Math.sin(agoraMs / 900);
    g.ellipse(p.x, p.y, 15, 7).fill({ color: TREVA, alpha: 0.45 });
    g.ellipse(p.x, p.y, 15 + 2 * pulso, 7 + pulso).stroke({ color: 0x5a4a6e, width: 1.2, alpha: 0.45 });
    for (let i = 0; i < 4; i++) {
      const ang = i * (Math.PI / 2) + 0.4;
      g.moveTo(p.x + Math.cos(ang) * 8, p.y + Math.sin(ang) * 4).lineTo(p.x + Math.cos(ang) * 17, p.y + Math.sin(ang) * 8.5).stroke({ color: 0x1a1420, width: 1.2, alpha: 0.6 });
    }
    g.moveTo(p.x, p.y - 7).lineTo(p.x, p.y + 1).stroke({ color: 0xb8b0c8, width: 1.4, alpha: 0.5 });
    g.moveTo(p.x - 3, p.y - 4.5).lineTo(p.x + 3, p.y - 4.5).stroke({ color: 0xb8b0c8, width: 1.4, alpha: 0.5 });
  }

  private estouroDeTreva(g: Graphics, p: { x: number; y: number }, u: number): void {
    const f = 1 - u;
    for (let i = 0; i < 10; i++) {
      const ang = i * 0.63;
      const r = 4 + 22 * Math.sqrt(u);
      g.circle(p.x + Math.cos(ang) * r, p.y - 14 + Math.sin(ang) * r * 0.55 - u * 10, 7 + 5 * u).fill({ color: TREVA, alpha: 0.45 * f });
    }
    g.ellipse(p.x, p.y - 14, 12 * f + 2, 16 * f + 2).fill({ color: 0x020203, alpha: 0.55 * f });
  }

  private pouso(chao: Graphics, ar: Graphics, p: { x: number; y: number }, u: number, semente: number): void {
    const f = 1 - u;
    for (let i = 0; i < 7; i++) {
      const ang = i * 0.9 + semente * 6;
      let x = p.x;
      let y = p.y;
      const passos = 3;
      chao.moveTo(x, y);
      for (let k = 1; k <= passos; k++) {
        const rr = (k / passos) * (14 + ((i * 7) % 11));
        x = p.x + Math.cos(ang + (k % 2 ? 0.18 : -0.15)) * rr;
        y = p.y + Math.sin(ang + (k % 2 ? 0.18 : -0.15)) * rr * 0.5;
        chao.lineTo(x, y);
      }
      chao.stroke({ color: 0x1e1712, width: 1.6, alpha: 0.7 * Math.min(1, f * 2) });
    }
    const anel = Math.min(1, u * 2.2);
    if (anel < 1) ar.ellipse(p.x, p.y, 10 + 34 * anel, (10 + 34 * anel) * 0.5).stroke({ color: POEIRA, width: 4 * (1 - anel) + 1, alpha: 0.5 * (1 - anel) });
  }

  private risco(g: Graphics, a: { x: number; y: number }, b: { x: number; y: number }, u: number): void {
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

  private nuvemDePoeira(g: Graphics, p: { x: number; y: number }, u: number, dx: number): void {
    const f = 1 - u;
    g.circle(p.x + dx * 28 * u, p.y - 3 - 8 * u, 3 + 7 * u).fill({ color: POEIRA, alpha: 0.32 * f });
  }

  private folha(g: Graphics, p: { x: number; y: number }, u: number, dx: number): void {
    const f = 1 - u;
    const x = p.x + dx * 30 * u + Math.sin(u * 9) * 4;
    const y = p.y - 26 + 26 * u;
    g.ellipse(x, y, 2.6, 1.2).fill({ color: 0x6f8a4a, alpha: 0.6 * f });
  }

  /**
   * D-168: a corda do balanço. A cada arco, a corda é lançada no alto, à frente (no meio do arco), e o Arqueiro pende
   * dela pelas mãos; a corda curva um pouco no começo do arco (ainda esticando).
   */
  private cordaDoBalanco(g: Graphics, e: Entidade, pos: PontoVisual, m: { restante?: number; rumoX?: number; rumoY?: number }): void {
    const l = this.corpo.lances.get(e.id);
    const total = l?.corda?.total ?? 1;
    const b = balancoDaCorda(m, total);
    const rx = m.rumoX ?? l?.corda?.rumoX ?? 1;
    const ry = m.rumoY ?? l?.corda?.rumoY ?? 0;
    // O ponto preso: no meio do arco de agora, bem alto.
    const falta = (0.5 - b.u) * ARCO_DO_BALANCO;
    const preso = this.tela(pos.x + rx * falta, pos.y + ry * falta);
    const topo = { x: preso.x, y: preso.y - 150 };
    const p = this.tela(pos.x, pos.y);
    const alturaMaos = 16 + 40 * (2 * b.u - 1) ** 2 + 52;
    const maos = { x: p.x, y: p.y - alturaMaos };
    const folga = 14 * Math.max(0, 1 - b.u * 4);
    g.moveTo(topo.x, topo.y).quadraticCurveTo((topo.x + maos.x) / 2 + folga, (topo.y + maos.y) / 2 + folga, maos.x, maos.y).stroke({ color: 0xd8d0c0, width: 1.6, alpha: 0.9 });
    // O nó da flecha cravada no alto.
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
