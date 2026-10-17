// Marco 11A (16/10/2026, D-066): trilhas entre o casual e o dark fantasy — a sombra pela profundidade, dificuldade e
// clima; a faixa escolhe modos, andamento e timbres; o laço tem pad, arpejo e duas seções; tudo determinístico.

import { describe, expect, it } from 'vitest';
import { compor, faixaDaSombra, FAIXAS, PASSOS_POR_COMPASSO, PASSOS_POR_LACO } from '../../src/audio/composicao';
import { profundidadeDaFase, sombraDaCena, SombraMusical } from '../../src/audio/contexto-musical';

describe('sombra da música', () => {
  it('cresce com a profundidade, a dificuldade e o clima, sempre entre 0 e 1', () => {
    expect(sombraDaCena('exploracao', 0, 'normal')).toBeLessThan(sombraDaCena('exploracao', 0.5, 'normal'));
    expect(sombraDaCena('exploracao', 0.5, 'normal')).toBeLessThan(sombraDaCena('exploracao', 0.5, 'pesadelo'));
    expect(sombraDaCena('exploracao', 0.5, 'normal')).toBeLessThan(sombraDaCena('combate', 0.5, 'normal'));
    expect(sombraDaCena('combate', 0.5, 'normal')).toBeLessThan(sombraDaCena('chefe', 0.5, 'normal'));
    expect(sombraDaCena('chefe', 1, 'pesadelo')).toBe(1);
    expect(sombraDaCena('exploracao', 0, 'facil')).toBeGreaterThanOrEqual(0);
  });

  it('profundidade: a primeira fase é 0, as geradas descem até o fundo', () => {
    expect(profundidadeDaFase({ id: 'fase-01', ordem: 1 })).toBe(0);
    expect(profundidadeDaFase({ id: 'fase-02', ordem: 2 })).toBeCloseTo(0.1);
    expect(profundidadeDaFase({ id: 'gerada-1', ordem: 1000 })).toBeLessThan(profundidadeDaFase({ id: 'gerada-5', ordem: 1000 }));
    expect(profundidadeDaFase({ id: 'gerada-12', ordem: 1000 })).toBe(1);
  });

  it('desliza sem saltos: começa no pedido e anda ~63% em 3 s', () => {
    const s = new SombraMusical();
    expect(s.atualizar(0.2, 0)).toBe(0.2);
    for (let t = 100; t <= 3000; t += 100) s.atualizar(0.8, t);
    expect(s.valor).toBeGreaterThan(0.55);
    expect(s.valor).toBeLessThan(0.65);
  });
});

describe('composição por faixa', () => {
  it('a faixa sai da sombra em 5 degraus', () => {
    expect(faixaDaSombra(0)).toBe(0);
    expect(faixaDaSombra(0.5)).toBe(2);
    expect(faixaDaSombra(1)).toBe(FAIXAS - 1);
    expect(faixaDaSombra(-3)).toBe(0);
  });

  it('determinística por fase, clima e faixa; faixas diferentes soam diferentes', () => {
    const a = compor('fase-01', 'exploracao', 0);
    expect(compor('fase-01', 'exploracao', 0)).toEqual(a);
    expect(compor('fase-01', 'exploracao', 4)).not.toEqual(a);
    expect(a.passos).toHaveLength(PASSOS_POR_LACO);
  });

  it('o casual é mais rápido e mais brilhante que o dark; o dark tem drone', () => {
    const casual = compor('fase-01', 'exploracao', 0);
    const dark = compor('fase-01', 'exploracao', 4);
    expect(casual.bpm).toBeGreaterThan(dark.bpm);
    expect(casual.timbres.corte).toBeGreaterThan(dark.timbres.corte);
    expect(dark.timbres.drone).toBe(true);
    expect(compor('fase-01', 'combate', 4).bpm).toBeGreaterThan(dark.bpm);
  });

  it('pad no começo de cada compasso; arpejo só na exploração das faixas do meio', () => {
    const meio = compor('fase-02', 'exploracao', 2);
    expect(meio.passos.filter((p) => p.pad).length).toBe(PASSOS_POR_LACO / PASSOS_POR_COMPASSO);
    expect(meio.passos.some((p) => p.arpejo !== null)).toBe(true);
    expect(compor('fase-02', 'exploracao', 0).passos.some((p) => p.arpejo !== null)).toBe(false);
    expect(compor('fase-02', 'combate', 2).passos.some((p) => p.arpejo !== null)).toBe(false);
  });
});
