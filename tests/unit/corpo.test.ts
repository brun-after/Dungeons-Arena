// Marco 26 (25/10/2026, D-104): o corpo redondo do movimento livre e a migração do save para a posição contínua.
import { describe, expect, it } from 'vitest';
import { migrarMovimentoLivre } from '../../src/save/migracao-25';
import { corpoCabe, linhaLivre, suavizarCaminho } from '../../src/world/corpo';
import { caminho } from '../../src/world/navegacao';
import { faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const R = 0.32;
const fase = faseDeTexto(SALA_ABERTA);
const PILAR = faseDeTexto([
  '#########',
  '#.......#',
  '#.......#',
  '#...#...#',
  '#.......#',
  '#.......#',
  '#########',
]);

describe('corpoCabe', () => {
  it('cabe no centro da célula e rente à parede, não encostando nela', () => {
    expect(corpoCabe(fase, 1, 1, R)).toBe(true);
    expect(corpoCabe(fase, 1.5 - R + 1e-6, 5, R)).toBe(true);
    expect(corpoCabe(fase, 0.5 + R - 1e-6, 5, R)).toBe(false);
  });

  it('a quina conta pela distância ao canto, não pelo quadrado', () => {
    // Pilar em (4, 3): o canto (3,5; 2,5). A 0,3 em cada eixo, o canto fica a ~0,42 > raio.
    expect(corpoCabe(PILAR, 3.2, 2.2, R)).toBe(true);
    expect(corpoCabe(PILAR, 3.4, 2.4, R)).toBe(false);
  });

  it('a barreira extra barra como parede', () => {
    expect(corpoCabe(fase, 5, 5, R, (x, y) => x === 5 && y === 5)).toBe(false);
  });
});

describe('suavizarCaminho', () => {
  it('na sala aberta, a diagonal vira um ponto só', () => {
    const celulas = caminho(fase, { x: 1, y: 1 }, { x: 8, y: 6 }).passos;
    expect(celulas.length).toBeGreaterThan(5);
    expect(suavizarCaminho(fase, { x: 1, y: 1 }, celulas, R)).toEqual([{ x: 8, y: 6 }]);
  });

  it('cada trecho suavizado é livre para o corpo e o caminho termina no destino', () => {
    const origem = { x: 2, y: 3 };
    const celulas = caminho(PILAR, origem, { x: 6, y: 3 }).passos;
    const pontos = suavizarCaminho(PILAR, origem, celulas, R);
    expect(pontos.at(-1)).toEqual({ x: 6, y: 3 });
    expect(pontos.length).toBeLessThan(celulas.length);
    let de = origem;
    for (const p of pontos) {
      expect(linhaLivre(PILAR, de, p, R)).toBe(true);
      de = p;
    }
  });

  it('o perigo conta como barreira: o trecho não corta a célula perigosa', () => {
    const origem = { x: 1, y: 3 };
    const celulas = caminho(fase, origem, { x: 9, y: 3 }).passos;
    const perigo = (x: number, y: number) => x === 5 && y === 3;
    const desvio = [...celulas.slice(0, 3), { x: 4, y: 4 }, { x: 5, y: 4 }, { x: 6, y: 4 }, { x: 6, y: 3 }, ...celulas.slice(5)];
    const pontos = suavizarCaminho(fase, origem, desvio, R, perigo);
    let de = origem;
    for (const p of pontos) {
      expect(linhaLivre(fase, de, p, R, perigo)).toBe(true);
      de = p;
    }
  });
});

describe('migração 24 → 25', () => {
  const save = (progressoPasso: number) => ({
    versao: 24,
    estado: {
      entidades: [{ id: 'j', x: 3, y: 4, destinoX: 4, destinoY: 4, progressoPasso, proximoEixoX: true, direcao: 'E', waypoints: [{ x: 6, y: 4 }], caminho: [] }],
    },
    fasesVisitadas: { 'fase-01': { entidades: [{ id: 'g', x: 2, y: 2, destinoX: 2, destinoY: 2, progressoPasso: 0 }] } },
  });

  it('antes da metade do passo fica na origem; depois, no destino; os campos do passo saem', () => {
    const cedo = migrarMovimentoLivre(save(0.3)) as { estado: { entidades: Record<string, unknown>[] } };
    expect(cedo.estado.entidades[0]).toMatchObject({ x: 3, y: 4, px: 3, py: 4, direcao: 'parado', rumoX: 0, rumoY: 0, waypoints: [] });
    const tarde = migrarMovimentoLivre(save(0.6)) as { estado: { entidades: Record<string, unknown>[] } };
    const e = tarde.estado.entidades[0] ?? {};
    expect(e).toMatchObject({ x: 4, y: 4, px: 4, py: 4 });
    for (const campo of ['destinoX', 'destinoY', 'progressoPasso', 'proximoEixoX']) expect(e).not.toHaveProperty(campo);
  });

  it('as fases visitadas também migram', () => {
    const m = migrarMovimentoLivre(save(0)) as { fasesVisitadas: Record<string, { entidades: Record<string, unknown>[] }> };
    expect(m.fasesVisitadas['fase-01']?.entidades[0]).toMatchObject({ x: 2, y: 2, px: 2, py: 2 });
  });
});
