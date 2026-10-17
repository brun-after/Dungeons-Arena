// O desenho da área não é a hitbox (D-060). Ajuste de 15/10/2026. Pura e testável.
// A simulação acerta por células (combat/formas.ts); aqui a área vira uma forma orgânica que cobre essas células:
// - radial (quadrado, ao redor): um círculo que cobre o centro de toda célula atingida, com a borda ondulando;
// - faixa (linha): o fecho convexo arredondado das células — uma cápsula;
// - leque (cone): um setor que sai de quem conjura, com a borda de fora curva.
// A ondulação é suave (poucas senoides com fases pela ação): a mesma ação desenha sempre o mesmo contorno, e áreas
// diferentes não parecem carimbos. O contorno sempre cobre o centro de toda célula atingida (testado).

import type { Celula } from '../core/comandos';
import { CELULA_PX } from './camera-calculo';
import { centroDaCelula } from './projecao';

export interface Ponto {
  x: number;
  y: number;
}

/** Vértices do contorno (quanto mais, mais redondo). */
export const VERTICES_CONTORNO = 36;

export type DesenhoArea = { tipo: 'radial' } | { tipo: 'faixa'; origem: Ponto } | { tipo: 'leque'; origem: Ponto };

export interface Contorno {
  /** De onde o miolo cresce (px de plano): o centro da área, ou quem conjura na faixa e no leque. */
  centro: Ponto;
  pontos: Ponto[];
}

/** Hash inteiro -> [0, 1), para as fases da ondulação. */
function aleatorioDe(semente: number, i: number): number {
  let h = Math.imul(semente ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(i + 1, 0xc2b2ae35);
  h ^= h >>> 13;
  h = Math.imul(h, 0x27d4eb2d);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

/** Ondulação suave em [0, 1] ao redor do contorno (3, 5 e 7 ondas por volta). */
function ondulacao(semente: number): (angulo: number) => number {
  const fases = [0, 1, 2].map((i) => aleatorioDe(semente, i) * Math.PI * 2);
  return (a) => 0.5 + 0.25 * Math.sin(3 * a + (fases[0] ?? 0)) + 0.15 * Math.sin(5 * a + (fases[1] ?? 0)) + 0.1 * Math.sin(7 * a + (fases[2] ?? 0));
}

const meia = CELULA_PX / 2;

function radial(centros: readonly Ponto[], onda: (a: number) => number): Contorno {
  const centro = { x: centros.reduce((s, p) => s + p.x, 0) / centros.length, y: centros.reduce((s, p) => s + p.y, 0) / centros.length };
  const alcance = Math.max(...centros.map((p) => Math.hypot(p.x - centro.x, p.y - centro.y)));
  const pontos: Ponto[] = [];
  for (let i = 0; i < VERTICES_CONTORNO; i++) {
    const a = (i / VERTICES_CONTORNO) * Math.PI * 2;
    // Além do centro mais longe, por 0,3 a 0,6 meia célula: cobre tudo e mal encosta no anel de fora.
    const r = Math.max(meia * 0.95, alcance + meia * (0.3 + 0.3 * onda(a)));
    pontos.push({ x: centro.x + Math.cos(a) * r, y: centro.y + Math.sin(a) * r });
  }
  return { centro, pontos };
}

function faixa(centros: readonly Ponto[], origem: Ponto, onda: (a: number) => number): Contorno {
  const meio = { x: centros.reduce((s, p) => s + p.x, 0) / centros.length, y: centros.reduce((s, p) => s + p.y, 0) / centros.length };
  const pontos: Ponto[] = [];
  for (let i = 0; i < VERTICES_CONTORNO; i++) {
    const a = (i / VERTICES_CONTORNO) * Math.PI * 2;
    const ux = Math.cos(a);
    const uy = Math.sin(a);
    // O ponto de suporte (o mais longe nesta direção) mais a folga: o fecho convexo arredondado, uma cápsula.
    let suporte = centros[0] ?? meio;
    let melhor = -Infinity;
    for (const p of centros) {
      const d = (p.x - meio.x) * ux + (p.y - meio.y) * uy;
      if (d > melhor) {
        melhor = d;
        suporte = p;
      }
    }
    const folga = meia * (0.6 + 0.35 * onda(a));
    pontos.push({ x: suporte.x + ux * folga, y: suporte.y + uy * folga });
  }
  // O miolo cresce da ponta perto de quem conjura (quem conjura fica fora da faixa).
  const perto = centros.reduce((m, p) => (Math.hypot(p.x - origem.x, p.y - origem.y) < Math.hypot(m.x - origem.x, m.y - origem.y) ? p : m), centros[0] ?? meio);
  return { centro: perto, pontos };
}

/** Setor que sai de quem conjura: meia abertura de 50° (as células do cone ficam a até 45° do eixo). */
function leque(centros: readonly Ponto[], origem: Ponto, onda: (a: number) => number): Contorno {
  const meio = { x: centros.reduce((s, p) => s + p.x, 0) / centros.length, y: centros.reduce((s, p) => s + p.y, 0) / centros.length };
  const eixo = Math.atan2(meio.y - origem.y, meio.x - origem.x);
  const alcance = Math.max(...centros.map((p) => Math.hypot(p.x - origem.x, p.y - origem.y)));
  const abertura = (50 * Math.PI) / 180;
  const pontos: Ponto[] = [];
  const passos = VERTICES_CONTORNO - 4;
  for (let i = 0; i <= passos; i++) {
    const a = eixo - abertura + (2 * abertura * i) / passos;
    const r = alcance + meia * (0.45 + 0.35 * onda(a));
    pontos.push({ x: origem.x + Math.cos(a) * r, y: origem.y + Math.sin(a) * r });
  }
  // A ponta em quem conjura, um pouco arredondada para trás.
  for (const desvio of [abertura + 0.6, Math.PI, -(abertura + 0.6)]) {
    const a = eixo + desvio;
    pontos.push({ x: origem.x + Math.cos(a) * meia * 0.35, y: origem.y + Math.sin(a) * meia * 0.35 });
  }
  return { centro: origem, pontos };
}

/** Contorno orgânico em px de plano. Sem células, devolve um contorno vazio. */
export function contornoDaArea(celulas: readonly Celula[], semente: number, desenho: DesenhoArea = { tipo: 'radial' }): Contorno {
  const centros = celulas.map((c) => centroDaCelula(c.x, c.y));
  if (centros.length === 0) return { centro: { x: 0, y: 0 }, pontos: [] };
  const onda = ondulacao(semente);
  switch (desenho.tipo) {
    case 'radial':
      return radial(centros, onda);
    case 'faixa':
      return faixa(centros, desenho.origem, onda);
    case 'leque':
      return leque(centros, desenho.origem, onda);
  }
}

/** O mesmo contorno encolhido em direção ao centro (o miolo que cresce até o impacto). */
export function escalarContorno(c: Contorno, fator: number): number[] {
  return c.pontos.flatMap((p) => [c.centro.x + (p.x - c.centro.x) * fator, c.centro.y + (p.y - c.centro.y) * fator]);
}

/** Ponto dentro do polígono (par-ímpar), para os testes de cobertura. */
export function dentroDoPoligono(p: Ponto, poligono: readonly Ponto[]): boolean {
  let dentro = false;
  for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
    const a = poligono[i];
    const b = poligono[j];
    if (!a || !b) continue;
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) dentro = !dentro;
  }
  return dentro;
}
