// Desenho dos enfeites e pilares das fases com tema (marco 23, 24/10/2026, D-092). Formas procedurais em Graphics,
// cozidas uma vez no bloco do terreno (render/terreno.ts): nenhum custo por quadro. Os enfeites são só aparência
// (world/decoracao.ts decide onde ficam); o pilar é a parede solta no meio da sala, desenhado no tipo do tema.

import type { Graphics } from 'pixi.js';
import type { Decoracao, TipoPilar } from '../world/decoracao';
import type { PaletaTema } from '../world/temas';
import { CELULA_PX } from './camera-calculo';

const P = CELULA_PX;

/** Mistura duas cores (t = 0 devolve a primeira). */
export function misturarCor(a: number, b: number, t: number): number {
  const c = (s: number) => Math.round(((a >> s) & 0xff) * (1 - t) + ((b >> s) & 0xff) * t);
  return (c(16) << 16) | (c(8) << 8) | c(0);
}

function folhagem(g: Graphics, cx: number, cy: number, r: number, cor: number): void {
  g.circle(cx, cy, r).fill(misturarCor(cor, 0x000000, 0.25));
  g.circle(cx - r * 0.35, cy - r * 0.3, r * 0.7).fill(cor);
  g.circle(cx + r * 0.4, cy - r * 0.1, r * 0.6).fill(misturarCor(cor, 0xffffff, 0.12));
}

/** Um enfeite na célula (x, y). */
export function desenharDecoracao(g: Graphics, d: Decoracao, paleta: PaletaTema): void {
  const px = d.x * P;
  const py = d.y * P;
  const cx = px + P / 2;
  const cy = py + P / 2;
  const v = d.variante;
  const s = 0.75 + v * 0.5;
  switch (d.tipo) {
    case 'pedras':
      g.ellipse(cx - 6, cy + 4, 7 * s, 5 * s).fill(misturarCor(paleta.paredeTopo, 0x000000, 0.2));
      g.ellipse(cx + 6, cy + 7, 5 * s, 3.5 * s).fill(paleta.paredeTopo);
      g.ellipse(cx - 7, cy + 2, 3 * s, 1.5 * s).fill({ color: 0xffffff, alpha: 0.12 });
      break;
    case 'rachadura':
      g.moveTo(px + 8, py + 10 + v * 10).lineTo(cx - 2, cy).lineTo(cx + 6, cy + 4).lineTo(px + P - 8, py + P - 12);
      g.moveTo(cx - 2, cy).lineTo(cx - 4, py + P - 8);
      g.stroke({ width: 1.6, color: paleta.junta, alpha: 0.8 });
      break;
    case 'musgo':
      for (let i = 0; i < 4; i++) g.circle(px + 10 + ((v * 97 + i * 23) % 28), py + 12 + ((v * 53 + i * 17) % 24), 4 + i).fill({ color: 0x4f7a3a, alpha: 0.45 });
      break;
    case 'ossos':
      g.roundRect(cx - 10, cy + 2, 20, 4, 2).fill(0xd9cfb8);
      g.circle(cx - 10, cy + 2, 3).fill(0xd9cfb8).circle(cx - 10, cy + 6, 3).fill(0xd9cfb8);
      g.circle(cx + 10, cy + 2, 3).fill(0xd9cfb8).circle(cx + 10, cy + 6, 3).fill(0xd9cfb8);
      if (v > 0.5) g.circle(cx + 4, cy - 8, 6).fill(0xe6dcc4).circle(cx + 2, cy - 9, 1.6).fill(0x2a2420).circle(cx + 6, cy - 9, 1.6).fill(0x2a2420);
      break;
    case 'teia':
      for (let i = 0; i < 5; i++) {
        const a = (i / 4) * (Math.PI / 2);
        g.moveTo(px + 2, py + 2).lineTo(px + 2 + Math.cos(a) * 30, py + 2 + Math.sin(a) * 30);
      }
      for (const r of [10, 18, 26]) g.arc(px + 2, py + 2, r, 0, Math.PI / 2);
      g.stroke({ width: 1, color: 0xe8e8f0, alpha: 0.4 });
      break;
    case 'tocha':
      g.rect(cx - 2, py + 4, 4, 14).fill(0x5a3b22);
      g.ellipse(cx, py + 4, 5, 7).fill({ color: 0xff8a2a, alpha: 0.9 });
      g.ellipse(cx, py + 5, 2.5, 4).fill(0xffe08a);
      g.circle(cx, py + 6, 16).fill({ color: 0xffb060, alpha: 0.08 });
      break;
    case 'barril':
      g.ellipse(cx, cy + 2, 11, 13).fill(0x7a4f2c);
      g.rect(cx - 11, cy - 4, 22, 2).fill(0x3f2a18).rect(cx - 11, cy + 7, 22, 2).fill(0x3f2a18);
      g.ellipse(cx, cy - 9, 9, 3).fill(0x8f6038);
      break;
    case 'corrente':
      for (let i = 0; i < 5; i++) g.ellipse(cx + (i % 2) * 2, py + 4 + i * 6, 2.5, 3.5).stroke({ width: 1.5, color: 0x8a8f99, alpha: 0.85 });
      break;
    case 'tapete':
      g.rect(px + 4, py + 6, P - 8, P - 12).fill(misturarCor(0x7a1f2a, paleta.piso[0], 0.25 + v * 0.2));
      g.rect(px + 8, py + 10, P - 16, P - 20).stroke({ width: 2, color: 0xd4a84a, alpha: 0.7 });
      break;
    case 'estandarte':
      g.rect(cx - 9, py, 18, 26).fill(v > 0.5 ? 0x8c1f2a : 0x23407a);
      g.poly([cx - 9, py + 26, cx, py + 32, cx + 9, py + 26]).fill(v > 0.5 ? 0x8c1f2a : 0x23407a);
      g.circle(cx, py + 13, 4).fill(0xe6c35a);
      break;
    case 'lapide':
      g.roundRect(cx - 9, cy - 10, 18, 22, 8).fill(0x7d7a80);
      g.rect(cx - 9, cy + 6, 18, 6).fill(0x6a676d);
      g.moveTo(cx, cy - 6).lineTo(cx, cy + 2).moveTo(cx - 4, cy - 3).lineTo(cx + 4, cy - 3).stroke({ width: 1.6, color: 0x4a484e });
      break;
    case 'vela':
      for (const [dx, h] of [[-6, 10], [2, 14], [8, 8]] as const) {
        g.rect(cx + dx - 2, cy + 8 - h, 4, h).fill(0xeee4cc);
        g.ellipse(cx + dx, cy + 6 - h, 1.8, 3).fill(0xffc860);
      }
      g.circle(cx, cy, 14).fill({ color: 0xffd080, alpha: 0.07 });
      break;
    case 'raiz':
      g.moveTo(px + 4, cy + 6).quadraticCurveTo(cx - 4, cy - 8 + v * 8, cx + 8, cy + 2).quadraticCurveTo(px + P - 8, cy + 8, px + P - 2, cy - 4);
      g.stroke({ width: 3, color: 0x5a4028, alpha: 0.85 });
      break;
    case 'arbusto':
      folhagem(g, cx, cy + 2, 11 * s, 0x3f6e34);
      break;
    case 'arvore':
      g.ellipse(cx + 4, cy + 12, 14, 5).fill({ color: 0x000000, alpha: 0.25 });
      g.rect(cx - 3, cy, 6, 12).fill(0x5a3d24);
      folhagem(g, cx, cy - 6, 15 * s, 0x2f5e2a);
      break;
    case 'runa':
      g.circle(cx, cy, 12).stroke({ width: 1.5, color: 0x9a7aff, alpha: 0.55 });
      g.moveTo(cx, cy - 8).lineTo(cx + 6, cy + 5).lineTo(cx - 6, cy + 5).closePath().stroke({ width: 1.5, color: 0xc0a8ff, alpha: 0.6 });
      break;
    case 'estante':
      g.rect(px + 4, py, P - 8, 30).fill(0x4a3020);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 6; j++) {
        g.rect(px + 7 + j * 6, py + 3 + i * 9, 4, 7).fill([0x8c2f2a, 0x2f5a8c, 0x6a8c2f, 0xb08a3a][(i * 6 + j + Math.floor(v * 4)) % 4] ?? 0x8c2f2a);
      }
      break;
    // Marco 26 (D-113): o caixote de tábuas e o vaso de barro, que quebram.
    case 'caixote': {
      const l = 10 * s;
      g.rect(cx - l, cy - l + 4, l * 2, l * 2 - 2).fill(0x8a6034);
      g.rect(cx - l, cy - l + 4, l * 2, l * 2 - 2).stroke({ width: 2, color: 0x4a3018 });
      g.moveTo(cx - l, cy - l + 4).lineTo(cx + l, cy + l + 2).moveTo(cx + l, cy - l + 4).lineTo(cx - l, cy + l + 2).stroke({ width: 2, color: 0x5a3c20 });
      g.rect(cx - l, cy - l + 4, l * 2, 3).fill({ color: 0xffffff, alpha: 0.12 });
      break;
    }
    case 'vaso': {
      const cor = v > 0.5 ? 0xb0643a : 0x9a7a52;
      g.ellipse(cx, cy + 3, 9 * s, 10 * s).fill(cor);
      g.rect(cx - 4 * s, cy - 11 * s, 8 * s, 6 * s).fill(cor);
      g.ellipse(cx, cy - 11 * s, 5.5 * s, 2 * s).fill(misturarCor(cor, 0x000000, 0.45));
      g.moveTo(cx - 8 * s, cy + 1).lineTo(cx + 8 * s, cy + 1).stroke({ width: 1.5, color: 0xe8d2a8, alpha: 0.5 });
      g.ellipse(cx - 3 * s, cy - 1, 2 * s, 4 * s).fill({ color: 0xffffff, alpha: 0.14 });
      break;
    }
    case 'livros':
      g.rect(cx - 10, cy + 2, 14, 5).fill(0x8c2f2a).rect(cx - 8, cy - 3, 14, 5).fill(0x2f5a8c).rect(cx - 6, cy - 8, 12, 5).fill(0xb08a3a);
      break;
    case 'trilho':
      g.rect(px, cy - 7, P, 3).fill(0x6a6f78).rect(px, cy + 5, P, 3).fill(0x6a6f78);
      for (let i = 0; i < 4; i++) g.rect(px + 3 + i * 12, cy - 9, 5, 19).fill(0x4a3420);
      break;
    case 'carrinho':
      g.rect(cx - 12, cy - 8, 24, 14).fill(0x5a5f68);
      g.ellipse(cx, cy - 8, 11, 3).fill(0x3a3026);
      g.circle(cx - 7, cy + 7, 3).fill(0x2a2a2e).circle(cx + 7, cy + 7, 3).fill(0x2a2a2e);
      break;
    case 'cristal':
      for (const [dx, h, w] of [[-7, 18, 6], [2, 26, 8], [9, 14, 5]] as const) {
        const base = cy + 10;
        g.poly([cx + dx - w / 2, base, cx + dx, base - h * s, cx + dx + w / 2, base]).fill({ color: v > 0.5 ? 0x9ad8ff : 0xd49aff, alpha: 0.85 });
        g.moveTo(cx + dx, base - h * s).lineTo(cx + dx, base).stroke({ width: 1, color: 0xffffff, alpha: 0.4 });
      }
      break;
    case 'poca':
      g.ellipse(cx, cy + 4, 14 * s, 8 * s).fill({ color: 0x3f6f82, alpha: 0.5 });
      g.ellipse(cx - 4, cy + 2, 5, 2).fill({ color: 0xffffff, alpha: 0.15 });
      break;
    case 'grade':
      g.rect(px + 8, py + 8, P - 16, P - 16).fill(0x1a1d20);
      for (let i = 0; i < 5; i++) g.rect(px + 10 + i * 6, py + 8, 2, P - 16).fill(0x5a5f68);
      break;
    case 'lodo':
      g.ellipse(cx, cy + 4, 15 * s, 9 * s).fill({ color: 0x5a7a2a, alpha: 0.45 });
      g.circle(cx + 5, cy + 2, 2.5).stroke({ width: 1, color: 0xa6d583, alpha: 0.6 });
      break;
    case 'lava':
      g.moveTo(px + 4, cy + 4).lineTo(cx - 6, cy - 4).lineTo(cx + 4, cy + 6).lineTo(px + P - 4, cy - 2);
      g.stroke({ width: 5, color: 0xff5a1a, alpha: 0.85 });
      g.moveTo(px + 4, cy + 4).lineTo(cx - 6, cy - 4).lineTo(cx + 4, cy + 6).lineTo(px + P - 4, cy - 2);
      g.stroke({ width: 2, color: 0xffd06a, alpha: 0.9 });
      break;
    case 'cinzas':
      for (let i = 0; i < 6; i++) g.circle(px + 8 + ((v * 131 + i * 29) % 32), py + 10 + ((v * 71 + i * 13) % 28), 1.5 + (i % 3)).fill({ color: 0x8a8580, alpha: 0.5 });
      break;
    case 'brasa':
      for (let i = 0; i < 4; i++) g.circle(px + 10 + ((v * 97 + i * 19) % 28), py + 14 + ((v * 41 + i * 11) % 22), 2).fill({ color: i % 2 ? 0xff8a3a : 0xffc070, alpha: 0.9 });
      break;
    case 'areia':
      for (let i = 0; i < 3; i++) g.moveTo(px + 4, py + 12 + i * 10).quadraticCurveTo(cx, py + 6 + i * 10 + v * 6, px + P - 4, py + 12 + i * 10);
      g.stroke({ width: 1.5, color: misturarCor(paleta.piso[0], 0xffffff, 0.25), alpha: 0.6 });
      break;
    case 'cacto':
      g.roundRect(cx - 4, cy - 14, 8, 26, 4).fill(0x3f7a3a);
      g.roundRect(cx - 12, cy - 6, 6, 10, 3).fill(0x3f7a3a).roundRect(cx + 6, cy - 10, 6, 10, 3).fill(0x3f7a3a);
      break;
    case 'gelo':
      g.poly([px + 6, cy + 2, cx - 4, py + 8, px + P - 8, cy - 4, cx + 6, py + P - 6]).fill({ color: 0xcfeaff, alpha: 0.35 });
      g.moveTo(cx - 6, cy - 2).lineTo(cx + 6, cy + 4).stroke({ width: 1.2, color: 0xffffff, alpha: 0.5 });
      break;
    case 'estalactite':
      for (const [dx, h] of [[-10, 14], [-2, 22], [7, 12], [13, 18]] as const) g.poly([cx + dx - 3, py, cx + dx, py + h * s, cx + dx + 3, py]).fill({ color: 0xbfe4ff, alpha: 0.85 });
      break;
    case 'neve':
      g.ellipse(cx, cy + 3, 16 * s, 9 * s).fill({ color: 0xf2f8ff, alpha: 0.7 });
      g.ellipse(cx + 6, cy, 8 * s, 5 * s).fill({ color: 0xffffff, alpha: 0.6 });
      break;
    case 'junco':
      for (let i = 0; i < 5; i++) {
        const x = cx - 10 + i * 5;
        g.moveTo(x, cy + 10).quadraticCurveTo(x + 2, cy - 2, x + (i % 2 ? 4 : -3), cy - 12 - (i % 3) * 3);
      }
      g.stroke({ width: 1.6, color: 0x6a8a3a, alpha: 0.9 });
      break;
    case 'cogumelo':
      for (const [dx, r] of [[-7, 6], [5, 8]] as const) {
        g.rect(cx + dx - 1.5, cy, 3, 8).fill(0xe6dcc4);
        g.ellipse(cx + dx, cy, r * s, r * 0.6 * s).fill(v > 0.5 ? 0xb04ad0 : 0xc0503a);
        g.circle(cx + dx - 2, cy - 1, 1.2).fill({ color: 0xffffff, alpha: 0.8 });
      }
      break;
    case 'flores':
      for (let i = 0; i < 5; i++) {
        const fx = px + 8 + ((v * 113 + i * 31) % 32);
        const fy = py + 10 + ((v * 67 + i * 19) % 28);
        g.circle(fx, fy, 2.4).fill([0xf2d24a, 0xf27a9a, 0xb89af2, 0xffffff][i % 4] ?? 0xffffff).circle(fx, fy, 1).fill(0xf2a03a);
      }
      break;
    case 'vitral':
      g.roundRect(cx - 9, py, 18, 26, 9).fill(0x2a2a3a);
      g.poly([cx - 7, py + 6, cx, py + 2, cx, py + 24, cx - 7, py + 24]).fill({ color: 0x4a8adf, alpha: 0.8 });
      g.poly([cx, py + 2, cx + 7, py + 6, cx + 7, py + 24, cx, py + 24]).fill({ color: 0xdf8a4a, alpha: 0.8 });
      g.circle(cx, py + 12, 18).fill({ color: 0xfff0c0, alpha: 0.06 });
      break;
  }
}

/**
 * O pilar do tema, por cima da parede solta (x, y). Marco 26 (D-109): `comChao` false desenha só a peça (o isométrico
 * a põe de pé em render/decoracao-iso.ts, com a sombra própria).
 */
export function desenharPilar(g: Graphics, tipo: TipoPilar, x: number, y: number, paleta: PaletaTema, variante: number, comChao = true): void {
  const px = x * P;
  const py = y * P;
  const cx = px + P / 2;
  const cy = py + P / 2;
  // O piso por baixo (a parede vira um objeto na sala) e a sombra.
  if (comChao) {
    g.rect(px, py, P, P).fill(paleta.piso[0]);
    g.ellipse(cx + 4, py + P - 8, 18, 6).fill({ color: 0x000000, alpha: 0.3 });
  }
  switch (tipo) {
    case 'coluna':
    case 'obelisco': {
      const topo = tipo === 'obelisco' ? 0x3e3256 : paleta.paredeTopo;
      if (tipo === 'obelisco') {
        g.poly([cx - 10, py + P - 8, cx - 6, py + 2, cx + 6, py + 2, cx + 10, py + P - 8]).fill(misturarCor(topo, 0x000000, 0.2));
        g.poly([cx - 3, py + 2, cx, py - 4, cx + 3, py + 2]).fill(topo);
        g.circle(cx, cy - 4, 3).fill({ color: 0xb090ff, alpha: 0.8 });
      } else {
        g.rect(cx - 15, py + P - 12, 30, 6).fill(misturarCor(topo, 0x000000, 0.25));
        g.rect(cx - 11, py + 4, 22, P - 16).fill(topo);
        for (let i = 0; i < 3; i++) g.rect(cx - 7 + i * 6, py + 6, 2, P - 20).fill({ color: 0x000000, alpha: 0.18 });
        g.rect(cx - 15, py, 30, 6).fill(misturarCor(topo, 0xffffff, 0.12));
      }
      break;
    }
    case 'lapide':
      g.roundRect(cx - 14, py + 4, 28, P - 12, 12).fill(0x7d7a80);
      g.moveTo(cx, py + 12).lineTo(cx, py + 30).moveTo(cx - 7, py + 18).lineTo(cx + 7, py + 18).stroke({ width: 2.5, color: 0x4a484e });
      break;
    case 'estante':
      desenharDecoracao(g, { tipo: 'estante', x, y, variante }, paleta);
      g.rect(px + 4, py + 30, P - 8, P - 34).fill(0x3a2418);
      break;
    case 'escora':
      g.rect(px + 6, py + 2, 6, P - 6).fill(0x6a4a2a).rect(px + P - 12, py + 2, 6, P - 6).fill(0x6a4a2a);
      g.rect(px + 2, py + 2, P - 4, 6).fill(0x7a5632);
      g.moveTo(px + 9, py + 10).lineTo(px + P - 9, py + P - 8).stroke({ width: 3, color: 0x5a3a20 });
      break;
    case 'estalagmite':
      g.poly([cx - 16, py + P - 6, cx - 3, py + 2, cx + 4, py + 12, cx + 16, py + P - 6]).fill(misturarCor(paleta.paredeTopo, 0x000000, 0.15));
      g.poly([cx - 3, py + 2, cx + 4, py + 12, cx + 1, py + P - 10]).fill({ color: 0xff7a3a, alpha: 0.35 });
      break;
    case 'cacto':
      g.roundRect(cx - 7, py + 2, 14, P - 8, 7).fill(0x3f7a3a);
      g.roundRect(cx - 18, cy - 6, 9, 16, 4).fill(0x3f7a3a).roundRect(cx + 9, cy - 12, 9, 16, 4).fill(0x3f7a3a);
      g.moveTo(cx, py + 6).lineTo(cx, py + P - 10).stroke({ width: 1, color: 0x2a5a2a });
      break;
    case 'cristal':
      for (const [dx, h, w] of [[-10, 30, 10], [2, 44, 14], [12, 24, 9]] as const) {
        g.poly([cx + dx - w / 2, py + P - 6, cx + dx, py + P - 6 - h, cx + dx + w / 2, py + P - 6]).fill({ color: variante > 0.5 ? 0x9ad8ff : 0xd49aff, alpha: 0.9 });
        g.moveTo(cx + dx, py + P - 6 - h).lineTo(cx + dx, py + P - 6).stroke({ width: 1.2, color: 0xffffff, alpha: 0.5 });
      }
      break;
    case 'pinheiro':
      g.rect(cx - 3, py + P - 14, 6, 10).fill(0x5a3d24);
      for (const [w, t] of [[34, 22], [26, 12], [18, 2]] as const) g.poly([cx - w / 2, py + t + 18, cx, py + t - 4, cx + w / 2, py + t + 18]).fill(0x2a4f3a);
      g.poly([cx - 9, py + 14, cx, py - 2, cx + 9, py + 14]).fill({ color: 0xffffff, alpha: 0.55 });
      break;
    case 'para_raios':
      g.rect(cx - 2, py, 4, P - 8).fill(0x8a8f99);
      g.rect(cx - 10, py + P - 12, 20, 6).fill(0x4a4f58);
      g.moveTo(cx, py + 4).lineTo(cx + 8, py + 14).lineTo(cx + 2, py + 16).lineTo(cx + 10, py + 28).stroke({ width: 1.8, color: 0xf7e46a, alpha: 0.85 });
      break;
    case 'bobina':
      g.rect(cx - 10, py + P - 12, 20, 6).fill(0x4a4f58);
      for (let i = 0; i < 6; i++) g.ellipse(cx, py + P - 16 - i * 5, 9, 3).stroke({ width: 2, color: 0xc07a3a });
      g.circle(cx, py + 6, 7).fill(0x8a8f99).circle(cx, py + 6, 10).fill({ color: 0xa8f0ff, alpha: 0.25 });
      break;
    case 'arvore_morta':
      g.rect(cx - 4, py + 10, 8, P - 14).fill(0x4a3a2a);
      g.moveTo(cx, py + 16).lineTo(cx - 14, py + 4).moveTo(cx, py + 22).lineTo(cx + 15, py + 8).moveTo(cx - 8, py + 9).lineTo(cx - 10, py).stroke({ width: 3, color: 0x4a3a2a });
      break;
    case 'cogumelo_gigante':
      g.rect(cx - 5, cy - 2, 10, P / 2 - 4).fill(0xe6dcc4);
      g.ellipse(cx, cy - 4, 22, 13).fill(0x8a3ab0);
      for (const [dx, dy] of [[-9, -6], [4, -10], [10, -2]] as const) g.circle(cx + dx, cy + dy, 2.5).fill({ color: 0xf0d0ff, alpha: 0.9 });
      g.circle(cx, cy, 22).fill({ color: 0xc89aff, alpha: 0.07 });
      break;
    case 'arvore':
      g.rect(cx - 5, cy, 10, P / 2 - 4).fill(0x5a3d24);
      folhagem(g, cx, cy - 6, 21, 0x2f5e2a);
      break;
  }
}
