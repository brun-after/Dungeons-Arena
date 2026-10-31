// As áreas elementais pintadas no chão (marco 31, 31/10/2026, D-130). Antes eram um círculo translúcido com riscos
// por cima (o ar de desenho); aqui cada área entra no canvas do bloco (render/solo/assar.ts), antes das paredes: o
// contorno orgânico (o raio varia pelo ruído em volta do centro, com a borda desfocada), a textura e a cor do
// elemento e, nas que brilham (brasas, raios, geada, luz sagrada, miasma), as rachaduras acesas em `lighter`, depois
// da tinta do tema. A geometria sai do centro da área em coordenadas de mundo: igual nos blocos vizinhos. Puro.

import type { AreaAmbiente, TipoAmbiente } from '../../world/ambiente-tipos';
import type { TexturaSolo } from '../../world/solo';
import { fbm, hash2 } from './ruido';

export interface EstiloAmbiente {
  /** A textura de baixo (null: só a cor). */
  textura: TexturaSolo | null;
  /** A cor por cima da textura (`multiply`) ou sozinha, e a força. */
  cor: string;
  forca: number;
  /** As rachaduras: a cor e a força (0 = sem); `brilha` as soma em `lighter` (ficam acesas no escuro). */
  veio: string;
  forcaVeio: number;
  brilha: boolean;
  /** A luz que a área solta no escuro (null: nenhuma). */
  luz: number | null;
}

export const ESTILOS_AMBIENTE: Readonly<Record<TipoAmbiente, EstiloAmbiente>> = {
  agua: { textura: null, cor: '#163c4a', forca: 0.82, veio: '#8fd0de', forcaVeio: 0.3, brilha: false, luz: null },
  brasas: { textura: 'basalto', cor: '#4a2014', forca: 0.95, veio: '#ff8a2a', forcaVeio: 1, brilha: true, luz: 0xff7a30 },
  miasma: { textura: 'lama', cor: '#34501f', forca: 0.9, veio: '#a6e060', forcaVeio: 0.55, brilha: true, luz: 0x8fd05a },
  gelo_fino: { textura: 'neve', cor: '#a4cce6', forca: 0.9, veio: '#f0fbff', forcaVeio: 0.6, brilha: true, luz: 0x9ed8ff },
  campo_eletrico: { textura: 'rocha', cor: '#2a281a', forca: 0.9, veio: '#fff27a', forcaVeio: 0.95, brilha: true, luz: 0xfff07a },
  lama: { textura: 'lama', cor: '#5a4630', forca: 0.95, veio: '#000000', forcaVeio: 0, brilha: false, luz: null },
  nevoa_sombria: { textura: null, cor: '#1e0f2a', forca: 0.78, veio: '#9a6ad8', forcaVeio: 0.5, brilha: true, luz: 0x8a5ac8 },
  luz_sagrada: { textura: 'lajes', cor: '#d2b874', forca: 0.6, veio: '#fff3c0', forcaVeio: 0.8, brilha: true, luz: 0xfff0c0 },
};

/** As texturas que as áreas da fase pedem (para carregar com as do tema). */
export function texturasDosAmbientes(areas: readonly AreaAmbiente[]): TexturaSolo[] {
  const lista = new Set<TexturaSolo>();
  for (const a of areas) {
    const t = ESTILOS_AMBIENTE[a.tipo].textura;
    if (t) lista.add(t);
  }
  return [...lista];
}

/** Pontos do contorno, rachaduras e a folga da borda. */
const PONTOS_CONTORNO = 40;
const MARGEM = 0.45;
const PASSO_VEIO = 0.28;

/** O centro da área em células de mundo (o centro da célula). */
export function centroDaArea(a: AreaAmbiente): { x: number; y: number } {
  return { x: a.x + 0.5, y: a.y + 0.5 };
}

/** O contorno da área, em células de mundo: o raio (com a margem) varia de 80% a 112% pelo ruído do ângulo. */
export function contornoDaArea(a: AreaAmbiente, semente: number): { x: number; y: number }[] {
  const c = centroDaArea(a);
  const r = a.raio + MARGEM;
  return Array.from({ length: PONTOS_CONTORNO }, (_, i) => {
    const ang = (i / PONTOS_CONTORNO) * Math.PI * 2;
    const k = 0.8 + 0.32 * fbm(Math.cos(ang) * 1.6 + a.x * 3.1, Math.sin(ang) * 1.6 + a.y * 3.1, semente);
    return { x: c.x + Math.cos(ang) * r * k, y: c.y + Math.sin(ang) * r * k };
  });
}

/** As rachaduras: linhas que saem de perto do centro e andam tortas para fora, sem passar da borda. */
export function veiosDaArea(a: AreaAmbiente, semente: number): { x: number; y: number }[][] {
  const c = centroDaArea(a);
  const limite = (a.raio + MARGEM) * 0.82;
  const quantos = 3 + Math.round(a.raio * 2);
  const linhas: { x: number; y: number }[][] = [];
  for (let k = 0; k < quantos; k++) {
    const h = (n: number) => hash2(a.x * 13 + k, a.y * 7 + n, semente);
    let ang = (k / quantos) * Math.PI * 2 + (h(1) - 0.5) * 1.2;
    let x = c.x + (h(2) - 0.5) * 0.4;
    let y = c.y + (h(3) - 0.5) * 0.4;
    const linha = [{ x, y }];
    const passos = 3 + Math.floor(h(4) * 4);
    for (let i = 0; i < passos; i++) {
      ang += (h(10 + i) - 0.5) * 1.3;
      const nx = x + Math.cos(ang) * PASSO_VEIO * (0.7 + h(20 + i) * 0.6);
      const ny = y + Math.sin(ang) * PASSO_VEIO * (0.7 + h(30 + i) * 0.6);
      if (Math.hypot(nx - c.x, ny - c.y) > limite) break;
      x = nx;
      y = ny;
      linha.push({ x, y });
    }
    if (linha.length > 1) linhas.push(linha);
  }
  return linhas;
}

/** A área toca o retângulo [x0, x1] × [y0, y1] (em células)? */
export function areaNoRetangulo(a: AreaAmbiente, x0: number, y0: number, x1: number, y1: number): boolean {
  const c = centroDaArea(a);
  const r = (a.raio + MARGEM) * 1.15 + 0.5;
  return c.x + r >= x0 && c.x - r <= x1 && c.y + r >= y0 && c.y - r <= y1;
}

/** As áreas que soltam luz (o centro, o raio e a cor), para o escuro. */
export function luzesDosAmbientes(areas: readonly AreaAmbiente[]): { x: number; y: number; raio: number; cor: number }[] {
  const luzes: { x: number; y: number; raio: number; cor: number }[] = [];
  for (const a of areas) {
    const cor = ESTILOS_AMBIENTE[a.tipo].luz;
    if (cor !== null) luzes.push({ x: a.x, y: a.y, raio: a.raio + 1.5, cor });
  }
  return luzes;
}
