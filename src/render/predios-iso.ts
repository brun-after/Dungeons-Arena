// A frente dos prédios da vila do Mundo (marco 38, 08/11/2026, D-142): a placa pendurada sobre a porta, com o
// símbolo do que se faz lá dentro (a caneca da taverna, a moeda do banco, a balança do mercado, a bigorna da
// ferraria e o frasco da botica), e os detalhes de cada fachada: as colunas claras do banco, as lanternas da taverna,
// a chaminé com brasa da ferraria e os vidros verdes da botica. Fica num Graphics à parte do telhado: o telhado some
// quando o jogador chega perto, a placa não. Só desenho, nas duas projeções (de cima, a placa fica no chão da porta).

import type { Graphics } from 'pixi.js';
import type { Telhado, TipoPredio } from '../world/fase';
import { CELULA_PX } from './camera-calculo';
import type { Projecao } from './projecao';

const MADEIRA = 0x5a3b22;
const MADEIRA_ESCURA = 0x3a2615;
const OURO = 0xe3b23c;
const FERRO = 0x9aa3ad;

type Ponto = (x: number, y: number, z: number) => { x: number; y: number };

/** O símbolo do prédio, centrado em (cx, cy), com uns 10 px de raio. */
function simbolo(g: Graphics, tipo: TipoPredio, cx: number, cy: number): void {
  switch (tipo) {
    case 'taverna':
      g.roundRect(cx - 5, cy - 5, 9, 11, 2).fill(OURO).stroke({ width: 1, color: MADEIRA_ESCURA });
      g.rect(cx - 5, cy - 7, 9, 3).fill(0xf6efe0);
      g.moveTo(cx + 4, cy - 2).quadraticCurveTo(cx + 9, cy, cx + 4, cy + 3).stroke({ width: 1.6, color: OURO });
      break;
    case 'banco':
      g.circle(cx, cy, 7).fill(OURO).stroke({ width: 1.2, color: 0x8a6514 });
      g.circle(cx, cy, 4.5).stroke({ width: 1, color: 0x8a6514 });
      g.rect(cx - 0.8, cy - 3, 1.6, 6).fill(0x8a6514);
      break;
    case 'mercado':
      g.moveTo(cx, cy - 7).lineTo(cx, cy + 6).stroke({ width: 1.4, color: FERRO });
      g.moveTo(cx - 7, cy - 4).lineTo(cx + 7, cy - 4).stroke({ width: 1.4, color: FERRO });
      g.poly([cx - 9, cy + 1, cx - 5, cy + 1, cx - 7, cy - 4]).fill(OURO);
      g.poly([cx + 5, cy + 1, cx + 9, cy + 1, cx + 7, cy - 4]).fill(OURO);
      break;
    case 'ferreiro':
      g.poly([cx - 8, cy - 4, cx + 8, cy - 4, cx + 5, cy, cx + 2, cy, cx + 3, cy + 5, cx - 3, cy + 5, cx - 2, cy, cx - 6, cy]).fill(FERRO).stroke({ width: 1, color: 0x3c4148 });
      break;
    case 'alquimista':
      g.rect(cx - 1.6, cy - 8, 3.2, 4).fill(0xc9d6cf);
      g.circle(cx, cy + 1, 5.5).fill(0x55d68a).stroke({ width: 1, color: 0x1f4f35 });
      g.circle(cx - 1.8, cy - 0.5, 1.4).fill({ color: 0xffffff, alpha: 0.6 });
      break;
  }
}

/** A placa pendurada num braço de ferro, com o símbolo. */
function placa(g: Graphics, tipo: TipoPredio, base: { x: number; y: number }): void {
  const { x, y } = base;
  g.moveTo(x - 2, y - 18).lineTo(x + 14, y - 18).stroke({ width: 2, color: 0x2b2b2b });
  g.moveTo(x - 6, y - 14).lineTo(x - 6, y - 12).stroke({ width: 1, color: 0x2b2b2b });
  g.moveTo(x + 10, y - 18).lineTo(x + 10, y - 14).stroke({ width: 1, color: 0x2b2b2b });
  g.roundRect(x - 9, y - 14, 22, 18, 3).fill(MADEIRA).stroke({ width: 1.4, color: MADEIRA_ESCURA });
  simbolo(g, tipo, x + 2, y - 5);
}

/** As lanternas da taverna, uma de cada lado da porta. */
function lanterna(g: Graphics, p: { x: number; y: number }): void {
  g.circle(p.x, p.y, 7).fill({ color: 0xffc66b, alpha: 0.18 });
  g.roundRect(p.x - 2.5, p.y - 3.5, 5, 7, 1.5).fill(0xffd27a).stroke({ width: 1, color: 0x3a2615 });
}

/** A coluna clara do banco, do chão até a cornija. */
function coluna(g: Graphics, pt: Ponto, x: number, y: number, h: number): void {
  const a = pt(x - 0.18, y, 0);
  const b = pt(x + 0.18, y, h);
  g.rect(a.x, b.y, Math.max(4, b.x - a.x), a.y - b.y).fill(0xd8d2c4).stroke({ width: 1, color: 0x8f877a });
  g.rect(a.x - 2, b.y - 3, Math.max(4, b.x - a.x) + 4, 4).fill(0xe8e2d4);
}

/** A chaminé da ferraria no fundo do telhado, com a brasa no topo. */
function chamine(g: Graphics, pt: Ponto, t: Telhado, h: number, pulso: number): void {
  const base = pt(t.x + t.largura - 1.4, t.y + 0.9, h + t.altura * 0.32 * CELULA_PX * 0.6);
  g.rect(base.x - 5, base.y - 26, 10, 26).fill(0x5c544c).stroke({ width: 1, color: 0x2e2924 });
  g.rect(base.x - 6, base.y - 29, 12, 4).fill(0x463f39);
  g.circle(base.x, base.y - 31, 4 + pulso).fill({ color: 0xff8a3a, alpha: 0.35 });
}

/** Os detalhes da fachada e a placa do prédio (`h`: altura das paredes em px; 0 de cima). */
export function desenharFrenteDoPredio(g: Graphics, t: Telhado, p: Projecao, h: number, pulso: number): void {
  const tipo = t.predio;
  if (!tipo) return;
  const pt: Ponto = (x, y, z) => {
    const q = p.projetar(x * CELULA_PX, y * CELULA_PX);
    return { x: q.x, y: q.y - z };
  };
  const porta = t.x + Math.floor(t.largura / 2) + 0.5;
  const frente = t.y + t.altura;
  if (tipo === 'banco' && h > 0) {
    coluna(g, pt, porta - 1.2, frente, h * 0.95);
    coluna(g, pt, porta + 1.2, frente, h * 0.95);
  }
  if (tipo === 'taverna') {
    lanterna(g, pt(porta - 1.3, frente, h * 0.6));
    lanterna(g, pt(porta + 1.3, frente, h * 0.6));
  }
  if (tipo === 'ferreiro' && h > 0) chamine(g, pt, t, h, pulso);
  if (tipo === 'alquimista') {
    for (const dx of [-1.6, 1.6]) {
      const v = pt(porta + dx, frente, h * 0.45);
      g.roundRect(v.x - 5, v.y - 6, 10, 9, 2).fill({ color: 0x5fd39a, alpha: 0.55 }).stroke({ width: 1, color: 0x2a3b32 });
    }
  }
  placa(g, tipo, pt(porta + 0.9, frente, h * 0.85));
}
