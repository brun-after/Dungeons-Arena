// Marco 40 (13/11/2026, D-164): o que o movimento da classe deixa no mundo, desenhado à mão (sem brilho aditivo nem
// tremor de tela):
// - a Forma de névoa: o Necromante e os servos perto dele viram uma nuvem de escuridão que se arrasta, com os olhos
//   pálidos do Necromante no meio;
// - o Piscar e a Âncora rúnica: o símbolo de conjuração onde o Mago estava (fechando) e para onde foi (abrindo); a âncora
//   fica no chão girando devagar até ser usada;
// - a Troca de corpo e o Posto dos Mortos: a escuridão estoura nos dois lugares; o servo no posto marca o chão;
// - o Salto de Guerra: a poeira em anel e as rachaduras na queda;
// - a Arremetida: o rastro no ar e a poeira de onde saiu; a Marcha e a montaria levantam poeira;
// - a tirolesa: a corda esticada da flecha cravada no destino; a camuflagem solta folhas.

import { Graphics, type Container } from 'pixi.js';
import type { EstadoJogo } from '../../core/estado';
import type { Barramento } from '../../core/events';
import type { EventosDaSimulacao } from '../../core/eventos-simulacao';
import type { Entidade, PontoVisual } from '../../entities/entidade';
import { centroDaCelula, type Projecao } from '../projecao';
import { naNevoa, type CorpoEmMovimento } from './corpo-movimento';

type Efemero =
  | { t: 'sigilo'; x: number; y: number; inicio: number; dur: number; abre: boolean; cor: number }
  | { t: 'treva'; x: number; y: number; inicio: number; dur: number }
  | { t: 'pouso'; x: number; y: number; inicio: number; dur: number; semente: number }
  | { t: 'risco'; x: number; y: number; x2: number; y2: number; inicio: number; dur: number }
  | { t: 'poeira'; x: number; y: number; inicio: number; dur: number; dx: number }
  | { t: 'folha'; x: number; y: number; inicio: number; dur: number; dx: number }
  | { t: 'corda'; x: number; y: number; x2: number; y2: number; inicio: number; dur: number; fimMs: number | null; id: string };

const COR_ARCANA = 0xa58cff;
const COR_RUNA_ANCORA = 0x8f7cf0;
const TREVA = 0x050407;
const POEIRA = 0x8a7a66;
const LIMITE = 160;

export interface OpcoesRastros {
  projecao: () => Projecao;
  posicao: (e: Entidade) => PontoVisual;
  reduzido: () => boolean;
  raioNevoa: number;
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
      if (ev.fase === 'inicio' && l?.tipo === 'tirolesa' && l.corda) {
        // A flecha da corda crava no destino; a corda estica de onde o Arqueiro está.
        const x2 = l.de.x + l.corda.rumoX * l.corda.total;
        const y2 = l.de.y + l.corda.rumoY * l.corda.total;
        this.por({ t: 'corda', x: l.de.x, y: l.de.y, x2, y2, inicio: ms, dur: 600, fimMs: null, id: ev.id });
      }
      if (ev.fase === 'inicio' && l?.tipo === 'posto') this.por({ t: 'treva', x: quem.px, y: quem.py, inicio: ms, dur: 700 });
      if (ev.fase === 'fim' && l?.tipo === 'salto') {
        this.por({ t: 'pouso', x: quem.px, y: quem.py, inicio: ms, dur: 1400, semente: (ms % 997) / 997 });
        for (let i = 0; i < 5; i++) this.por({ t: 'poeira', x: quem.px, y: quem.py, inicio: ms, dur: 700, dx: (i - 2) * 0.35 });
      }
      if (ev.fase === 'fim' || ev.fase === 'perdeu') for (const c of this.efemeros) if (c.t === 'corda' && c.id === ev.id && c.fimMs === null) c.fimMs = ms;
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
      // A âncora rúnica espera no chão.
      if (mc?.ancora && mc.ancora.ateTick > estado.tick) this.runaDaAncora(chao, this.tela(mc.ancora.x, mc.ancora.y), agoraMs, reduzido);
      if (e.invocacao?.posto) this.marcaDoPosto(chao, this.tela(e.invocacao.posto.x, e.invocacao.posto.y), agoraMs);
      const m = mc?.modo;
      if (!m) continue;
      const pos = this.o.posicao(e);
      if (m.tipo === 'nevoa') {
        this.nuvem(ar, e, pos, agoraMs, true);
        for (const s of estado.entidades) if (!s.morto && s.invocacao?.donoId === e.id && naNevoa(s, e, this.o.raioNevoa)) this.nuvem(ar, s, this.o.posicao(s), agoraMs, false);
      } else if (m.tipo === 'preparo' && m.destino === 'ancora') {
        this.sigilo(chao, this.tela(pos.x, pos.y), (agoraMs / 900) % 1, 0.7, COR_ARCANA, agoraMs);
      } else if (!reduzido && (m.tipo === 'marcha' || m.tipo === 'montado' || m.tipo === 'camuflado')) {
        const ultima = this.ultimaPoeira.get(e.id) ?? { x: pos.x, y: pos.y, ms: 0 };
        this.levantar(e, pos, agoraMs, m.tipo === 'camuflado' ? 'folha' : 'poeira', m.tipo === 'montado' && m.pesada ? 70 : 110, ultima);
      }
    }
    this.efemeros = this.efemeros.filter((f) => agoraMs - f.inicio < f.dur || (f.t === 'corda' && f.fimMs === null));
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
      else this.corda(ar, p, this.tela(f.x2, f.y2), f.fimMs === null ? 1 : Math.max(0, 1 - (agoraMs - f.fimMs) / f.dur));
    }
    if (this.efemeros.some((f) => f.t === 'corda' && f.fimMs !== null && agoraMs - f.fimMs > f.dur)) this.efemeros = this.efemeros.filter((f) => !(f.t === 'corda' && f.fimMs !== null && agoraMs - f.fimMs > f.dur));
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

  private runaDaAncora(g: Graphics, p: { x: number; y: number }, agoraMs: number, reduzido: boolean): void {
    const pulso = reduzido ? 0.5 : 0.5 + 0.5 * Math.sin(agoraMs / 600);
    this.sigilo(g, p, 1, 0.75, COR_RUNA_ANCORA, reduzido ? 0 : agoraMs * 0.4, 0.4 + 0.2 * pulso);
    g.moveTo(p.x, p.y - 4).lineTo(p.x, p.y + 4).stroke({ color: COR_RUNA_ANCORA, width: 2, alpha: 0.6 });
    g.moveTo(p.x - 4, p.y + 1).lineTo(p.x, p.y + 4).lineTo(p.x + 4, p.y + 1).stroke({ color: COR_RUNA_ANCORA, width: 1.5, alpha: 0.6 });
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

  /** A corda da tirolesa: sai do alto de onde o Arqueiro estava e desce até a flecha cravada no destino. */
  private corda(g: Graphics, a: { x: number; y: number }, b: { x: number; y: number }, alfa: number): void {
    const ha = 46;
    const hb = 22;
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2 - (ha + hb) / 2 + 6;
    g.moveTo(a.x, a.y - ha).quadraticCurveTo(mx, my, b.x, b.y - hb).stroke({ color: 0x8a6a3a, width: 1.8, alpha: 0.9 * alfa });
    g.moveTo(a.x, a.y).lineTo(a.x, a.y - ha).stroke({ color: 0x5a4028, width: 2.2, alpha: 0.8 * alfa });
    // A flecha cravada no chão do destino, com as penas.
    g.moveTo(b.x - 2, b.y + 2).lineTo(b.x + 3, b.y - hb).stroke({ color: 0x6b4a2a, width: 2, alpha: alfa });
    g.poly([b.x + 3, b.y - hb, b.x - 1, b.y - hb - 5, b.x + 6, b.y - hb - 4]).fill({ color: 0xd8d0c0, alpha: alfa });
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
