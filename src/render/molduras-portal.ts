// Molduras dos portais (marco 26, 26/10/2026, D-112). O portal de entrada e de saída mostra a fase para onde leva:
// gelo com borda congelada e estalactites, fogo com chamas e rachaduras em brasa, veneno gotejando, raio estalando,
// trevas com ossos e um crânio, sagrado com raios dourados, terra em pedra bruta com folhas, psíquico com runas em
// órbita e pedra (neutro) em blocos com a pedra-chave. No miolo, um vórtice que gira (parado com movimento reduzido:
// `tMs` 0). De pé no isométrico (a base no centro da célula) e visto do alto de cima. Só desenho: as partículas que
// acompanham saem de render/portas.ts.

import type { Graphics } from 'pixi.js';
import type { EstiloPortal } from '../world/temas';
import { misturarCor } from './decoracao';

export interface DesenhoPortal {
  estilo: EstiloPortal;
  cor: number;
  /** Relógio da animação (0 com movimento reduzido). */
  tMs: number;
  /** Apagado: a saída trancada (o vórtice escuro, sem giro). */
  aceso: boolean;
}

/** Meia largura e altura do portal de pé, em px de mundo. */
export const MEIA_LARGURA = 15;
export const ALTURA = 46;

const clarear = (c: number, t: number) => misturarCor(c, 0xffffff, t);
const escurecer = (c: number, t: number) => misturarCor(c, 0x000000, t);

/** O vórtice: o fundo escuro na cor, três braços em espiral girando e o miolo claro. */
export function vortice(g: Graphics, cx: number, cy: number, rx: number, ry: number, cor: number, tMs: number, aceso: boolean): void {
  g.ellipse(cx, cy, rx, ry).fill({ color: misturarCor(cor, 0x05030a, 0.72), alpha: 0.95 });
  if (!aceso) {
    g.ellipse(cx, cy, rx * 0.55, ry * 0.55).fill({ color: escurecer(cor, 0.65), alpha: 0.6 });
    return;
  }
  const giro = tMs / 650;
  for (let braco = 0; braco < 3; braco++) {
    for (let i = 0; i <= 12; i++) {
      const f = i / 12;
      const a = giro + braco * ((2 * Math.PI) / 3) + f * 3.4;
      const r = 1 - f * 0.85;
      const x = cx + Math.cos(a) * rx * r;
      const y = cy + Math.sin(a) * ry * r;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke({ width: 2, color: clarear(cor, 0.35), alpha: 0.85 });
  }
  g.ellipse(cx, cy, rx * 0.3, ry * 0.3).fill({ color: clarear(cor, 0.7), alpha: 0.9 });
  g.ellipse(cx, cy, rx, ry).stroke({ width: 1.5, color: clarear(cor, 0.2), alpha: 0.9 });
}

/** O arco (dois pilares e o semicírculo) com a base em (cx, cy). */
function arco(g: Graphics, cx: number, cy: number, w: number, h: number, largura: number, cor: number): void {
  g.moveTo(cx - w, cy).lineTo(cx - w, cy - h + w).arc(cx, cy - h + w, w, Math.PI, 0).lineTo(cx + w, cy);
  g.stroke({ width: largura, color: cor, cap: 'round', join: 'round' });
}

/** Pontos ao longo do semicírculo do arco (de um pé ao outro, só a curva). */
function pontosDoArco(cx: number, cy: number, w: number, h: number, n: number): { x: number; y: number; a: number }[] {
  return Array.from({ length: n }, (_, i) => {
    const a = Math.PI + (Math.PI * (i + 0.5)) / n;
    return { x: cx + Math.cos(a) * w, y: cy - h + w + Math.sin(a) * w, a };
  });
}

/** Os enfeites de cada estilo sobre o arco de pé. */
function enfeitesEmPe(g: Graphics, cx: number, cy: number, d: DesenhoPortal): void {
  const w = MEIA_LARGURA;
  const h = ALTURA;
  const topo = cy - h;
  const t = d.tMs;
  switch (d.estilo) {
    case 'gelo':
      for (const [i, p] of pontosDoArco(cx, cy, w, h, 7).entries()) {
        const comprido = 5 + (i % 2) * 5;
        g.poly([p.x - 2.2, p.y + 1, p.x + 2.2, p.y + 1, p.x, p.y + 1 + comprido]).fill({ color: 0xe8f6ff, alpha: 0.92 });
      }
      for (const s of [-1, 1]) g.poly([cx + s * w, cy - 14, cx + s * (w + 5), cy - 20, cx + s * w, cy - 24]).fill({ color: 0xcfeaff, alpha: 0.85 });
      g.ellipse(cx - w, cy, 6, 2.5).fill(0xf2f8ff).ellipse(cx + w, cy, 6, 2.5).fill(0xf2f8ff);
      break;
    case 'fogo':
      for (let i = -2; i <= 2; i++) {
        const altura = 7 + 3 * Math.sin(t / 110 + i * 1.7);
        const x = cx + i * 5;
        const base = topo + 2 + Math.abs(i) * 1.6;
        g.poly([x - 3, base, x, base - altura, x + 3, base]).fill({ color: i % 2 === 0 ? 0xff7a2a : 0xffc860, alpha: 0.95 });
      }
      for (const s of [-1, 1]) g.moveTo(cx + s * w, cy - 4).lineTo(cx + s * (w - 1.5), cy - 14).lineTo(cx + s * w, cy - 22).stroke({ width: 1.4, color: 0xffa040, alpha: 0.9 });
      break;
    case 'veneno':
      for (const [i, p] of pontosDoArco(cx, cy, w, h, 5).entries()) g.ellipse(p.x, p.y + 2.5, 1.8, 2.8).fill({ color: clarear(d.cor, 0.15), alpha: 0.9 }).circle(p.x, p.y + 2.5 + ((t / 600 + i * 0.37) % 1) * 12, 1.4).fill({ color: d.cor, alpha: 0.8 });
      g.ellipse(cx, cy + 1, w + 4, 3).fill({ color: escurecer(d.cor, 0.3), alpha: 0.6 });
      break;
    case 'raio': {
      const salto = Math.floor(t / 120);
      const pts: number[] = [];
      for (let i = 0; i <= 6; i++) pts.push(cx - w + (i * 2 * w) / 6, topo - 4 + (((salto + i * 7) % 5) - 2) * 1.6);
      g.moveTo(pts[0] ?? cx, pts[1] ?? topo);
      for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i] ?? cx, pts[i + 1] ?? topo);
      g.stroke({ width: 1.6, color: clarear(d.cor, 0.5), alpha: 0.95 });
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) g.moveTo(cx + s * (w - 3), cy - 6 - k * 6).lineTo(cx + s * (w + 3), cy - 6 - k * 6).stroke({ width: 1.6, color: 0xc07a3a });
      break;
    }
    case 'trevas':
      for (const p of pontosDoArco(cx, cy, w, h, 6)) g.moveTo(p.x, p.y).lineTo(p.x + Math.cos(p.a) * 5, p.y + Math.sin(p.a) * 5).stroke({ width: 2.2, color: 0xe6dcc4, cap: 'round' });
      g.circle(cx, topo - 1, 4.5).fill(0xe6dcc4).circle(cx - 1.6, topo - 1.5, 1.1).fill(0x1a1020).circle(cx + 1.6, topo - 1.5, 1.1).fill(0x1a1020);
      break;
    case 'sagrado':
      for (let i = -3; i <= 3; i++) {
        const a = -Math.PI / 2 + i * 0.32;
        g.moveTo(cx + Math.cos(a) * 6, topo + 2 + Math.sin(a) * 6).lineTo(cx + Math.cos(a) * 14, topo + 2 + Math.sin(a) * 14).stroke({ width: 1.3, color: 0xffe9a8, alpha: 0.85 });
      }
      g.poly([cx, topo - 5, cx + 3, topo - 1, cx, topo + 3, cx - 3, topo - 1]).fill(0xfff4c8);
      break;
    case 'terra':
      for (const p of pontosDoArco(cx, cy, w, h, 6)) g.circle(p.x + Math.cos(p.a) * 1.5, p.y + Math.sin(p.a) * 1.5, 2.6).fill(escurecer(d.cor, 0.25));
      for (const s of [-1, 1]) g.circle(cx + s * (w + 2), cy - 3, 2.2).fill(0x5f8f3a).circle(cx + s * (w + 4), cy - 6, 1.8).fill(0x7aa04a);
      break;
    case 'psiquico':
      for (let i = 0; i < 4; i++) {
        const a = t / 900 + (i * Math.PI) / 2;
        const x = cx + Math.cos(a) * (w + 5);
        const y = cy - h * 0.48 + Math.sin(a) * (h * 0.5);
        g.poly([x, y - 3, x + 2.2, y, x, y + 3, x - 2.2, y]).fill({ color: clarear(d.cor, 0.4), alpha: 0.9 });
      }
      break;
    case 'pedra':
      for (const p of pontosDoArco(cx, cy, w, h, 5)) g.moveTo(p.x - Math.cos(p.a) * 3, p.y - Math.sin(p.a) * 3).lineTo(p.x + Math.cos(p.a) * 3, p.y + Math.sin(p.a) * 3).stroke({ width: 1, color: escurecer(d.cor, 0.6) });
      g.poly([cx - 3.5, topo - 3, cx + 3.5, topo - 3, cx + 2.5, topo + 3, cx - 2.5, topo + 3]).fill(clarear(d.cor, 0.2));
      break;
  }
}

/** A cor da pedra da moldura: a cor do destino puxada para a pedra escura. */
const corDaMoldura = (d: DesenhoPortal) => (d.estilo === 'gelo' ? misturarCor(d.cor, 0xffffff, 0.25) : misturarCor(d.cor, 0x3a3640, 0.5));

/** Portal de pé, com a base em (cx, cy): sombra, vórtice, arco e enfeites do estilo. */
export function portalEmPe(g: Graphics, cx: number, cy: number, d: DesenhoPortal): void {
  const w = MEIA_LARGURA;
  g.ellipse(cx, cy, w + 6, 6).fill({ color: 0x000000, alpha: 0.3 });
  if (d.aceso) g.ellipse(cx, cy, w + 8, 7).fill({ color: d.cor, alpha: 0.18 });
  vortice(g, cx, cy - ALTURA * 0.47, w - 3, ALTURA * 0.45 - 2, d.cor, d.tMs, d.aceso);
  arco(g, cx, cy, w, ALTURA, 5, escurecer(corDaMoldura(d), 0.35));
  arco(g, cx, cy, w, ALTURA, 3, corDaMoldura(d));
  enfeitesEmPe(g, cx, cy, d);
}

/** Portal visto de cima, centro em (cx, cy): o anel da moldura, os enfeites em volta e o vórtice. */
export function portalDeCima(g: Graphics, cx: number, cy: number, d: DesenhoPortal): void {
  const r = 17;
  if (d.aceso) g.circle(cx, cy, r + 6).fill({ color: d.cor, alpha: 0.16 });
  vortice(g, cx, cy, r - 4, r - 4, d.cor, d.tMs, d.aceso);
  g.circle(cx, cy, r).stroke({ width: 5, color: escurecer(corDaMoldura(d), 0.35) }).circle(cx, cy, r).stroke({ width: 3, color: corDaMoldura(d) });
  const enfeite = ESTILO_DE_CIMA[d.estilo];
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + (d.estilo === 'psiquico' ? d.tMs / 900 : 0);
    const x = cx + Math.cos(a) * (r + 2);
    const y = cy + Math.sin(a) * (r + 2);
    const fx = cx + Math.cos(a) * (r + 2 + enfeite.tamanho);
    const fy = cy + Math.sin(a) * (r + 2 + enfeite.tamanho);
    const px = -Math.sin(a) * 2.2;
    const py = Math.cos(a) * 2.2;
    if (enfeite.forma === 'ponta') g.poly([x + px, y + py, fx, fy, x - px, y - py]).fill({ color: enfeite.cor ?? clarear(d.cor, 0.3), alpha: 0.92 });
    else g.circle(fx, fy, 2).fill({ color: enfeite.cor ?? clarear(d.cor, 0.3), alpha: 0.9 });
  }
}

/** Os enfeites em volta do anel, vistos de cima. */
const ESTILO_DE_CIMA: Readonly<Record<EstiloPortal, { forma: 'ponta' | 'gota'; tamanho: number; cor: number | null }>> = {
  gelo: { forma: 'ponta', tamanho: 7, cor: 0xe8f6ff },
  fogo: { forma: 'ponta', tamanho: 6, cor: 0xff8a3a },
  veneno: { forma: 'gota', tamanho: 4, cor: null },
  raio: { forma: 'ponta', tamanho: 5, cor: 0xf7e46a },
  trevas: { forma: 'ponta', tamanho: 5, cor: 0xe6dcc4 },
  sagrado: { forma: 'ponta', tamanho: 6, cor: 0xffe9a8 },
  terra: { forma: 'gota', tamanho: 3, cor: 0x7aa04a },
  psiquico: { forma: 'gota', tamanho: 4, cor: null },
  pedra: { forma: 'gota', tamanho: 2, cor: null },
};

/** As correntes e o cadeado da saída trancada (de pé: sobre o arco; de cima: sobre o anel). */
export function trancas(g: Graphics, cx: number, cy: number, emPe: boolean): void {
  const meio = emPe ? cy - ALTURA * 0.47 : cy;
  const w = MEIA_LARGURA;
  for (const s of [-1, 1]) {
    for (let i = 0; i <= 5; i++) {
      const f = i / 5;
      g.ellipse(cx - w + 2 + f * (2 * w - 4), meio - s * (10 - f * 20) * (emPe ? 1 : 0.6), 2, 1.3).stroke({ width: 1.3, color: 0x9aa0aa });
    }
  }
  g.roundRect(cx - 5, meio - 3, 10, 9, 2).fill(0x2c3e50).stroke({ width: 1.5, color: 0xd4ac0d });
  g.circle(cx, meio + 1.5, 1.6).fill(0xd4ac0d);
}

/** As cores dos pares de portais internos: seis matizes bem separados (o par se reconhece só pela cor). */
export const CORES_DOS_PARES: readonly number[] = [0x4fc3f7, 0xff8a3d, 0x7ed957, 0xf06292, 0xffd54f, 0xb388ff];

export const corDoPar = (numero: number): number => CORES_DOS_PARES[(Math.max(1, numero) - 1) % CORES_DOS_PARES.length] ?? 0x4fc3f7;
