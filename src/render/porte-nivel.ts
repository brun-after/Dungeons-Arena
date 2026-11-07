// O porte do inimigo pelo nível (06/11/2026, D-135). A cada 10 níveis (um "grau", de 0 a 10), o mesmo monstro fica um
// pouco mais imponente, somando detalhes pequenos:
//   grau 1+  um pouco maior (+3% por grau) e mais escuro, e o selo de ferro rubro sob os pés, com uma marca por grau;
//   grau 3+  brasas subindo do corpo (mais a cada grau);
//   grau 5+  a coroa de espinhos de ferro sobre a cabeça (mais pontas a cada dois graus);
//   grau 7+  o brilho rubro atrás da coroa e o selo dobrado no chão;
//   grau 9+  chamas na coroa e o selo aceso; no grau 10 (nível 100), a coroa vira ouro em brasa.
// Os inimigos novos (marco de 06/11/2026) reaproveitam modelos com tinta e tamanho próprios. Só apresentação.

import type { Graphics } from 'pixi.js';
import type { Entidade } from '../entities/entidade';
import { CELULA_PX } from './camera-calculo';
import { misturarCor } from './decoracao';

const RAIO = CELULA_PX * 0.32;
const GRAU_MAX = 10;
const COR_FERRO = 0x2a2226;
const COR_RUBRA = 0xa3202a;
const COR_BRASA = 0xff8a3d;
const COR_OURO = 0xffc35a;

/** Tinta e tamanho dos presets que reaproveitam o modelo de outro (a pedra do troll, o duende, o runista). */
const VISUAL_DO_PRESET: Readonly<Record<string, { tinta: number; mistura: number; escala: number }>> = {
  arremessador: { tinta: 0x9a948a, mistura: 0.5, escala: 0.82 },
  duende_saltador: { tinta: 0xd8e070, mistura: 0.35, escala: 0.78 },
  runista_medroso: { tinta: 0xc9a36b, mistura: 0.45, escala: 0.82 },
};

/** O grau do inimigo (nível / 10, até 10); 0 para jogadores, invocações e quem não tem nível. */
export function grauDoNivel(e: Pick<Entidade, 'tipo' | 'nivel' | 'invocacao'>): number {
  if (e.tipo !== 'inimigo' || e.invocacao) return 0;
  return Math.max(0, Math.min(GRAU_MAX, Math.floor(e.nivel / 10)));
}

/** O multiplicador de tamanho: o do preset e +3% por grau. */
export function escalaDoNivel(e: Pick<Entidade, 'tipo' | 'nivel' | 'invocacao' | 'preset'>): number {
  return (VISUAL_DO_PRESET[e.preset]?.escala ?? 1) * (1 + 0.03 * grauDoNivel(e));
}

/** A tinta do corpo: a do preset (quando reaproveita outro modelo) e o escurecer de até 30% pelo grau. */
export function tintaDoNivel(e: Pick<Entidade, 'tipo' | 'nivel' | 'invocacao' | 'preset'>, tinta: number): number {
  const v = VISUAL_DO_PRESET[e.preset];
  const base = v ? misturarCor(tinta, v.tinta, v.mistura) : tinta;
  const grau = grauDoNivel(e);
  return grau > 0 ? misturarCor(base, 0x4a3438, 0.03 * grau) : base;
}

/**
 * Os detalhes do grau, no gráfico dos anéis (acima do escuro): o selo do chão (achatado por `k` no isométrico), as
 * brasas e a coroa sobre `topo`. `tMs` anima (0: parado, com o movimento reduzido).
 */
export function desenharPorteDoNivel(g: Graphics, e: Entidade, escala: number, k: number, topo: number, tMs: number): void {
  const grau = e.morto ? 0 : grauDoNivel(e);
  if (grau <= 0) return;
  const r = RAIO * 1.4 * escala;
  const selo = grau >= 9 ? COR_BRASA : COR_RUBRA;
  if (grau >= 9) g.ellipse(0, 0, r, r * k).fill({ color: COR_RUBRA, alpha: 0.12 });
  g.ellipse(0, 0, r, r * k).stroke({ width: 1.5, color: selo, alpha: 0.55 });
  if (grau >= 7) g.ellipse(0, 0, r * 1.12, r * 1.12 * k).stroke({ width: 1, color: COR_RUBRA, alpha: 0.4 });
  // Uma marca de ferro por grau, em volta do selo.
  for (let i = 0; i < grau; i++) {
    const a = (i / grau) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r * k;
    g.poly([x - 2.5, y, x, y - 4 * k - 1, x + 2.5, y, x, y + 4 * k + 1]).fill({ color: selo, alpha: 0.75 });
  }
  // As brasas sobem do corpo e somem perto da cabeça.
  if (grau >= 3) {
    const n = 2 + (grau - 3);
    for (let i = 0; i < n; i++) {
      const fase = ((tMs / 1400 + i / n + (e.id.length % 7) * 0.13) % 1 + 1) % 1;
      const x = Math.sin(i * 2.4 + tMs / 600) * r * 0.55;
      const y = topo * 0.15 + (topo * 0.85) * fase;
      g.circle(x, y, 1.6 + (grau >= 8 ? 0.6 : 0)).fill({ color: COR_BRASA, alpha: 0.75 * (1 - fase) });
    }
  }
  if (grau >= 5) coroa(g, grau, topo, escala, tMs);
}

/** A coroa de espinhos de ferro sobre a cabeça; com brilho no 7, chamas no 9 e ouro em brasa no 10. */
function coroa(g: Graphics, grau: number, topo: number, escala: number, tMs: number): void {
  const pontas = 3 + Math.floor((grau - 5) / 2);
  const largura = 9 * Math.min(1.4, escala) + pontas;
  const base = topo + 2;
  const altura = 5 + grau * 0.5;
  const cor = grau >= 10 ? COR_OURO : COR_FERRO;
  const pulso = 0.5 + 0.5 * Math.sin(tMs / 260);
  if (grau >= 7) g.ellipse(0, base - altura * 0.5, largura * 0.9, altura).fill({ color: COR_RUBRA, alpha: 0.18 + 0.12 * pulso });
  const pts: number[] = [-largura, base];
  for (let i = 0; i < pontas; i++) {
    const x0 = -largura + (2 * largura * i) / pontas;
    const x1 = -largura + (2 * largura * (i + 1)) / pontas;
    const alto = i === Math.floor(pontas / 2) ? altura * 1.35 : altura;
    pts.push((x0 + x1) / 2, base - alto, x1, base - altura * 0.25);
  }
  pts.push(largura, base);
  g.poly(pts).fill({ color: cor }).stroke({ width: 1, color: grau >= 9 ? COR_BRASA : 0x5c4a4e, alpha: 0.9 });
  if (grau >= 9) {
    for (let i = 0; i < pontas; i++) {
      const x = -largura + (2 * largura * (i + 0.5)) / pontas;
      const tremor = Math.sin(tMs / 120 + i) * 1.2;
      g.ellipse(x + tremor * 0.4, base - altura * 1.25 - 2, 1.6, 3 + tremor).fill({ color: COR_BRASA, alpha: 0.55 + 0.3 * pulso });
    }
  }
}
