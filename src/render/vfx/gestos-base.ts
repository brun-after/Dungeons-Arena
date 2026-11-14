// D-173 (14/11/2026): os gestos — os desenhos curtos das reações, das ressonâncias e dos combos de papel e assinados,
// um por nome, feitos à mão com as mesmas peças das assinaturas (blocos.ts). Aqui ficam o contrato e as peças comuns;
// cada grupo tem o seu arquivo (gestos-reacoes.ts, gestos-ressonancias.ts, gestos-combos.ts). Só desenho.

import type { Emissao } from '../presets-particula';
import type { CenaVfx, P } from './cena';
import { brotar, cair, relampago, tween, type Tween } from './blocos';
import { sai } from './pincel';

type Textura = Tween['textura'];

/** Onde o gesto acontece: no alvo (`em`), vindo de quem causou (`de`, quando se sabe), na cor do elemento. */
export interface Palco {
  de: P | null;
  em: P;
  cor: number;
}
export type Gesto = (c: CenaVfx, g: Palco) => void;

export const CORES = {
  fogo: 0xff7b39, gelo: 0x9fd8ff, raio: 0xfff2a0, veneno: 0x8fd14f, terra: 0xa8855a, trevas: 0x7a4fb0, sagrado: 0xfff0a0,
  psiquico: 0xe07adf, fisico: 0xe0e4e8, sangue: 0xd83040, aco: 0xd8e0e8, vida: 0x70e0a0, osso: 0xece4d0,
} as const;

const volta = (i: number, n: number, fase = 0): number => (i / n) * Math.PI * 2 + fase;
export const emVolta = (centro: P, raio: number, n: number, fase = 0): P[] =>
  Array.from({ length: n }, (_, i) => ({ x: centro.x + Math.cos(volta(i, n, fase)) * raio, y: centro.y + Math.sin(volta(i, n, fase)) * raio }));
export const acima = (p: P, h: number): P => ({ x: p.x, y: p.y - h });

/** Peças que saem do centro para fora, em leque. */
export function estourar(c: CenaVfx, em: P, textura: Textura, cor: number, n = 8, raio = 1.2, ms = 320, tamanho = 0.5): void {
  emVolta(em, raio, n, Math.random()).forEach((p, i) => {
    const ang = Math.atan2(c.tela(p).y - c.tela(em).y, c.tela(p).x - c.tela(em).x);
    tween(c, { textura, de: em, para: p, s: [tamanho, tamanho * 0.5], a: [1, 0], rot: [ang, ang], cor, aditivo: true, ms, atrasoMs: (i % 3) * 20, curva: sai });
  });
}

/** Peças que vêm de fora e fecham no centro. */
export function fechar(c: CenaVfx, em: P, textura: Textura, cor: number, n = 6, raio = 1.4, ms = 360, tamanho = 0.6, aoFim?: () => void): void {
  emVolta(em, raio, n).forEach((p, i) => {
    tween(c, { textura, de: p, para: em, s: [tamanho, tamanho * 0.6], a: [0.2, 1], cor, aditivo: true, ms, curva: sai, ...(i === 0 && aoFim ? { aoFim } : {}) });
  });
}

/** Peças que sobem do alvo e somem. */
export function subir(c: CenaVfx, em: P, textura: Textura, cor: number, n = 4, altura = 1.2, ms = 700, tamanho = 0.5, aditivo = true): void {
  for (let i = 0; i < n; i++) {
    const x = em.x + (Math.random() - 0.5) * 0.8;
    tween(c, { textura, de: { x, y: em.y }, para: { x, y: em.y - altura }, s: [tamanho, tamanho * 0.7], a: [1, 0], cor, aditivo, ms, atrasoMs: i * 70 });
  }
}

/** Peças que caem do alto em volta do alvo. */
export function chover(c: CenaVfx, em: P, textura: Textura, cor: number, n = 5, raio = 0.9, tamanho = 0.8, aoChegar?: (p: P) => void): void {
  emVolta(em, raio, n, Math.random()).forEach((p, i) => { cair(c, p, textura, cor, { altura: 3.5, ms: 260, tamanho, atrasoMs: i * 60, aditivo: true, ...(aoChegar ? { aoChegar: () => { aoChegar(p); } } : {}) }); });
}

/** Peças que brotam do chão em anel. */
export function cercar(c: CenaVfx, em: P, textura: Textura, cor: number, n = 6, raio = 0.9, tamanho = 0.9, ms = 900, aditivo = false): void {
  emVolta(em, raio, n).forEach((p, i) => { brotar(c, p, textura, cor, tamanho, ms, aditivo, i * 45); });
}

/** Raios curtos do centro para fora. */
export function faiscar(c: CenaVfx, em: P, cor: number, n = 3, raio = 1.3, ms = 220): void {
  for (const p of emVolta(em, raio, n, Math.random() * 6)) relampago(c, () => em, () => p, cor, ms, 0.7);
}

/** Uma peça que vai de quem causou até o alvo (sem origem, desce do alto). */
export function lancar(c: CenaVfx, g: Palco, textura: Textura, cor: number, tamanho = 0.8, ms = 240, aoFim?: () => void): void {
  const de = g.de ?? acima(g.em, 2.5);
  const ang = Math.atan2(c.tela(g.em).y - c.tela(de).y, c.tela(g.em).x - c.tela(de).x);
  tween(c, { textura, de, para: g.em, s: [tamanho, tamanho], a: [1, 0.6], rot: [ang, ang], cor, aditivo: true, ms, curva: sai, ...(aoFim ? { aoFim } : {}) });
}

/** Solta partículas no alvo. */
export function soltar(c: CenaVfx, em: P, lista: readonly Emissao[], cor: number): void {
  c.particulas.emitirLista(lista, em.x, em.y, cor);
}
