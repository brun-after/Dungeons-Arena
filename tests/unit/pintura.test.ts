// Marco 31 (31/10/2026, D-130): a repintura dos objetos e o desenho das áreas elementais no chão.
import { describe, expect, it } from 'vitest';
import { repintar, varianteEmPassos } from '../../src/render/pintura';
import { areaNoRetangulo, centroDaArea, contornoDaArea, luzesDosAmbientes, texturasDosAmbientes, veiosDaArea } from '../../src/render/solo/ambientes-solo';
import type { AreaAmbiente } from '../../src/world/ambiente-tipos';

/** Um quadrado opaco de `l` × `l` com a cor dada, no meio de uma moldura transparente de 4 px. */
function quadrado(l: number, cor: [number, number, number]): { px: Uint8ClampedArray; lado: number } {
  const lado = l + 8;
  const px = new Uint8ClampedArray(lado * lado * 4);
  for (let y = 4; y < 4 + l; y++) {
    for (let x = 4; x < 4 + l; x++) {
      const i = (y * lado + x) * 4;
      px.set([...cor, 255], i);
    }
  }
  return { px, lado };
}

const canal = (px: Uint8ClampedArray, lado: number, x: number, y: number, c: number) => px[(y * lado + x) * 4 + c] ?? 0;

describe('repintura dos desenhos', () => {
  it('dessatura, escurece a borda e deixa o transparente como está', () => {
    const { px, lado } = quadrado(20, [200, 40, 40]);
    repintar(px, lado, lado);
    expect(canal(px, lado, 0, 0, 3)).toBe(0);
    const meio = { r: canal(px, lado, 14, 14, 0), g: canal(px, lado, 14, 14, 1) };
    expect(meio.r).toBeLessThan(200);
    expect(meio.g).toBeGreaterThan(40);
    // Junto ao transparente fica mais escuro que no meio.
    expect(canal(px, lado, 4, 14, 0)).toBeLessThan(meio.r);
  });

  it('a luz vem de cima: o alto fica mais claro que os pés', () => {
    const { px, lado } = quadrado(40, [120, 120, 120]);
    repintar(px, lado, lado);
    expect(canal(px, lado, 20, 8, 0)).toBeGreaterThan(canal(px, lado, 20, 40, 0));
  });

  it('o que brilha fica aceso', () => {
    const { px, lado } = quadrado(20, [255, 140, 20]);
    repintar(px, lado, lado);
    expect([canal(px, lado, 14, 14, 0), canal(px, lado, 14, 14, 1), canal(px, lado, 14, 14, 2)]).toEqual([255, 140, 20]);
  });

  it('as variantes caem em poucos passos (o cache não cresce)', () => {
    const passos = new Set(Array.from({ length: 1000 }, (_, i) => varianteEmPassos(i / 1000)));
    expect(passos.size).toBeLessThanOrEqual(8);
    for (const v of passos) expect(v).toBeGreaterThanOrEqual(0);
  });
});

describe('áreas elementais no chão', () => {
  const area: AreaAmbiente = { tipo: 'brasas', x: 10, y: 6, raio: 2 };

  it('o contorno é fechado em volta do centro, entre 80% e 112% do raio com a margem', () => {
    const c = centroDaArea(area);
    const pontos = contornoDaArea(area, 7);
    expect(pontos.length).toBeGreaterThan(20);
    for (const p of pontos) {
      const d = Math.hypot(p.x - c.x, p.y - c.y);
      expect(d).toBeGreaterThanOrEqual((area.raio + 0.45) * 0.8 - 1e-9);
      expect(d).toBeLessThanOrEqual((area.raio + 0.45) * 1.12 + 1e-9);
    }
    // Determinístico: os blocos vizinhos desenham a mesma borda.
    expect(contornoDaArea(area, 7)).toEqual(pontos);
  });

  it('as rachaduras não passam da borda', () => {
    const c = centroDaArea(area);
    const linhas = veiosDaArea(area, 7);
    expect(linhas.length).toBeGreaterThan(0);
    for (const l of linhas) for (const p of l) expect(Math.hypot(p.x - c.x, p.y - c.y)).toBeLessThanOrEqual((area.raio + 0.45) * 0.82 + 0.3);
  });

  it('o retângulo do bloco, as texturas e as luzes', () => {
    expect(areaNoRetangulo(area, 0, 0, 8, 8)).toBe(true);
    expect(areaNoRetangulo(area, 20, 20, 30, 30)).toBe(false);
    expect(texturasDosAmbientes([area, { tipo: 'agua', x: 1, y: 1, raio: 1 }])).toEqual(['basalto']);
    expect(luzesDosAmbientes([area, { tipo: 'lama', x: 1, y: 1, raio: 1 }])).toHaveLength(1);
  });
});
