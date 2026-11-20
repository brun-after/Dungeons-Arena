// D-170 (14/11/2026): o que o movimento da classe desenha no chão. A camada do chão fica dentro do plano, que recebe a
// matriz do isométrico (render/stage.ts); por isso tudo aqui usa as coordenadas do plano (`centroDaCelula`, 1 célula =
// CELULA_PX) e círculos de verdade: o isométrico os deita no chão. Antes, os pontos já projetados eram projetados de
// novo, e os círculos saíam ovais e fora do lugar (o mesmo erro corrigido em render/vfx/marcas.ts, D-138).

import type { Graphics } from 'pixi.js';
import { CELULA_PX } from '../camera-calculo';

type Ponto = { x: number; y: number };

export const COR_ARCANA = 0xa58cff;
const AZUL_ALCANCE = 0x7fb8ff;
const ROXO_ALCANCE = 0xa070e0;
const TREVA = 0x050407;

/** A linha fina e translúcida do alcance (a Âncora em azul, o Posto em roxo), vista por quem a usa e pelos aliados. */
export function linhaDeAlcance(g: Graphics, c: Ponto, raioCelulas: number, roxo: boolean): void {
  const R = raioCelulas * CELULA_PX;
  g.circle(c.x, c.y, R).stroke({ color: roxo ? ROXO_ALCANCE : AZUL_ALCANCE, width: 2, alpha: 0.22 });
}

/** O símbolo de conjuração: dois anéis, o hexagrama e as runas girando (`escala` abre ou fecha). */
export function sigilo(g: Graphics, p: Ponto, u: number, escala: number, cor: number, giroMs: number, alfa = 0.8): void {
  const r = 22 * escala;
  const giro = giroMs / 900;
  g.circle(p.x, p.y, r).stroke({ color: cor, width: 1.8, alpha: alfa });
  g.circle(p.x, p.y, r * 0.72).stroke({ color: cor, width: 1.1, alpha: alfa * 0.8 });
  const ponto = (ang: number, rr: number) => ({ x: p.x + Math.cos(ang) * rr, y: p.y + Math.sin(ang) * rr });
  for (const fase of [0, Math.PI / 3]) {
    const [a, b, c] = [0, 1, 2].map((i) => ponto(giro + fase + (i * 2 * Math.PI) / 3, r * 0.72));
    if (a && b && c) g.poly([a.x, a.y, b.x, b.y, c.x, c.y]).stroke({ color: cor, width: 1.1, alpha: alfa * 0.7 });
  }
  for (let i = 0; i < 8; i++) {
    const q = ponto(-giro * 1.3 + (i * Math.PI) / 4, r * 0.86);
    g.rect(q.x - 1.4, q.y - 1.4, 2.8, 2.8).fill({ color: cor, alpha: alfa });
  }
  if (u < 0.25) g.circle(p.x, p.y, r * 0.4).fill({ color: cor, alpha: 0.18 * (1 - u * 4) });
}

/**
 * D-188 (19/11/2026): o Círculo de Contenção do urso. Um anel grosso, cor de terra, com as garras riscadas em volta e
 * as runas de contenção girando devagar no sentido contrário; o miolo escurece um pouco (as magias de fora param ali).
 * Nos últimos instantes (`fim`, 1 a 0), apaga.
 */
export function circuloContencao(g: Graphics, c: Ponto, raioCelulas: number, fim: number, tMs: number): void {
  const R = (raioCelulas + 0.5) * CELULA_PX;
  const a = Math.min(1, fim);
  const giro = -tMs / 1400;
  const TERRA = 0x8d6e4a;
  g.circle(c.x, c.y, R).fill({ color: 0x2a1c12, alpha: 0.16 * a });
  g.circle(c.x, c.y, R).stroke({ color: TERRA, width: 4, alpha: 0.85 * a });
  g.circle(c.x, c.y, R * 0.86).stroke({ color: TERRA, width: 1.4, alpha: 0.55 * a });
  for (let i = 0; i < 12; i++) {
    const ang = giro + (i * Math.PI) / 6;
    const x1 = c.x + Math.cos(ang) * R * 0.88;
    const y1 = c.y + Math.sin(ang) * R * 0.88;
    const x2 = c.x + Math.cos(ang + 0.12) * R * 1.04;
    const y2 = c.y + Math.sin(ang + 0.12) * R * 1.04;
    g.moveTo(x1, y1).lineTo(x2, y2).stroke({ color: 0xd7b98a, width: 2, alpha: 0.7 * a });
  }
}

/** Um arco aberto de `ini` a `ini + varre` (sem a linha solta que o `arc` puxa do último ponto). */
function arco(g: Graphics, c: Ponto, r: number, ini: number, varre: number): Graphics {
  g.moveTo(c.x + Math.cos(ini) * r, c.y + Math.sin(ini) * r);
  return g.arc(c.x, c.y, r, ini, ini + varre);
}

/**
 * O círculo do Acelerar. É parente do da pedra de retorno, mas maior e feito para a pressa: o anel duplo de fora, as
 * divisas (`>`) correndo em volta no sentido do giro, as três espirais de vento no miolo e a runa da ponta no centro.
 * Ele se forma em `formar` (0 a 1): os anéis se fecham traçados do topo, as divisas e as espirais aparecem por último.
 * Antes de formado, não acelera ninguém (o núcleo espera `formarMs`). Nos últimos instantes (`fim`, 1 a 0), apaga.
 */
export function circuloAcelerar(g: Graphics, c: Ponto, raioCelulas: number, cor: number, formar: number, fim: number, tMs: number): void {
  const R = (raioCelulas + 0.5) * CELULA_PX;
  const giro = tMs / 520;
  const a = Math.min(1, fim);
  const traco = Math.min(1, formar * 1.4);
  const resto = Math.max(0, (formar - 0.55) / 0.45);
  const topo = -Math.PI / 2;
  if (formar >= 1) g.circle(c.x, c.y, R).fill({ color: cor, alpha: 0.07 * a });
  arco(g, c, R, topo, Math.PI * 2 * traco).stroke({ color: cor, width: 2.6, alpha: 0.85 * a });
  arco(g, c, R * 0.9, topo, -Math.PI * 2 * traco).stroke({ color: cor, width: 1.3, alpha: 0.65 * a });
  arco(g, c, R * 0.38, topo, Math.PI * 2 * traco).stroke({ color: cor, width: 1.2, alpha: 0.55 * a });
  if (formar < 1) {
    // A ponta que traça o anel.
    const ang = topo + Math.PI * 2 * traco;
    g.circle(c.x + Math.cos(ang) * R, c.y + Math.sin(ang) * R, 3.2).fill({ color: 0xffffff, alpha: 0.9 });
  }
  if (resto <= 0) return;
  // As divisas correndo entre os dois anéis de fora: apontam no sentido do giro.
  const n = 16;
  for (let i = 0; i < n; i++) {
    const ang = giro + (i * 2 * Math.PI) / n;
    const rr = R * 0.95;
    const x = c.x + Math.cos(ang) * rr;
    const y = c.y + Math.sin(ang) * rr;
    const tx = -Math.sin(ang);
    const ty = Math.cos(ang);
    const nx = Math.cos(ang);
    const ny = Math.sin(ang);
    const s = 6.5;
    g.moveTo(x - tx * s + nx * s * 0.7, y - ty * s + ny * s * 0.7).lineTo(x + tx * s * 0.6, y + ty * s * 0.6).lineTo(x - tx * s - nx * s * 0.7, y - ty * s - ny * s * 0.7)
      .stroke({ color: cor, width: 2, alpha: 0.9 * a * resto });
  }
  // As espirais de vento entre o anel do meio e o de fora.
  for (let k = 0; k < 3; k++) {
    const base = -giro * 0.8 + (k * 2 * Math.PI) / 3;
    g.moveTo(c.x + Math.cos(base) * R * 0.4, c.y + Math.sin(base) * R * 0.4);
    for (let s = 1; s <= 10; s++) {
      const f = s / 10;
      const ang = base + f * 1.9;
      const rr = R * (0.4 + 0.45 * f);
      g.lineTo(c.x + Math.cos(ang) * rr, c.y + Math.sin(ang) * rr);
    }
    g.stroke({ color: cor, width: 1.2, alpha: 0.45 * a * resto });
  }
  sigilo(g, c, 0, (R * 0.34) / 22, cor, -tMs * 0.6, 0.6 * a * resto);
  // As faíscas que sobem do anel (deitadas no chão, parecem correr em volta).
  for (let i = 0; i < 12; i++) {
    const ang = i * 2.39996 + giro * 1.6;
    const vida = ((tMs / 700 + i * 0.137) % 1 + 1) % 1;
    const rr = R * (0.45 + 0.5 * ((i * 0.618) % 1));
    g.circle(c.x + Math.cos(ang) * rr, c.y + Math.sin(ang) * rr - vida * 12, 1.8 * (1 - vida) + 0.6).fill({ color: cor, alpha: 0.85 * (1 - vida) * a * resto });
  }
}

/** A base do totem da Âncora: o anel fino no chão e a sombra da pedra. */
export function baseDoTotem(g: Graphics, c: Ponto, pulso: number): void {
  g.circle(c.x, c.y, 15).fill({ color: 0x0c0a14, alpha: 0.45 }).stroke({ color: COR_ARCANA, width: 1.3, alpha: 0.45 + 0.25 * pulso });
}

/** O servo de guarda no posto: o chão marcado de escuridão, com a cruz pálida. */
export function marcaDoPosto(g: Graphics, c: Ponto, tMs: number): void {
  const pulso = 0.5 + 0.5 * Math.sin(tMs / 900);
  g.circle(c.x, c.y, 17).fill({ color: TREVA, alpha: 0.45 });
  g.circle(c.x, c.y, 17 + 2 * pulso).stroke({ color: 0x5a4a6e, width: 1.3, alpha: 0.45 });
  for (let i = 0; i < 4; i++) {
    const ang = i * (Math.PI / 2) + 0.4;
    g.moveTo(c.x + Math.cos(ang) * 9, c.y + Math.sin(ang) * 9).lineTo(c.x + Math.cos(ang) * 19, c.y + Math.sin(ang) * 19).stroke({ color: 0x1a1420, width: 1.3, alpha: 0.6 });
  }
  g.moveTo(c.x, c.y - 8).lineTo(c.x, c.y + 8).stroke({ color: 0xb8b0c8, width: 1.5, alpha: 0.5 });
  g.moveTo(c.x - 4, c.y - 3).lineTo(c.x + 4, c.y - 3).stroke({ color: 0xb8b0c8, width: 1.5, alpha: 0.5 });
}

/** As rachaduras da queda do Salto de Guerra. */
export function rachaduras(g: Graphics, c: Ponto, f: number, semente: number): void {
  for (let i = 0; i < 7; i++) {
    const ang = i * 0.9 + semente * 6;
    g.moveTo(c.x, c.y);
    for (let k = 1; k <= 3; k++) {
      const rr = (k / 3) * (16 + ((i * 7) % 12));
      const a = ang + (k % 2 ? 0.18 : -0.15);
      g.lineTo(c.x + Math.cos(a) * rr, c.y + Math.sin(a) * rr);
    }
    g.stroke({ color: 0x1e1712, width: 1.8, alpha: 0.7 * Math.min(1, f * 2) });
  }
}

/** O anel de poeira da queda, no chão. */
export function anelDePoeira(g: Graphics, c: Ponto, u: number): void {
  const anel = Math.min(1, u * 2.2);
  if (anel < 1) g.circle(c.x, c.y, 12 + 40 * anel).stroke({ color: 0x8a7a66, width: 4 * (1 - anel) + 1, alpha: 0.5 * (1 - anel) });
}
