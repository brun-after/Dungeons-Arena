// Marco 26 (25/10/2026, D-109): no isométrico, enfeites altos e pilares ficam de pé (não pintados no chão).
import { describe, expect, it } from 'vitest';
import { itensEmPe } from '../../src/render/decoracao-iso';
import { placasDaParede } from '../../src/render/paredes-iso';
import { ehDecoracaoDeParede, ehDecoracaoEmPe, TIPOS_DECORACAO } from '../../src/world/decoracao';
import { faseDeTexto } from '../apoio/fases';

describe('objetos em pé no isométrico', () => {
  it('o pilar (parede solta no meio da sala) não ganha placas baixas: vira coluna alta', () => {
    const fase = faseDeTexto(['#######', '#.....#', '#.....#', '#..#..#', '#.....#', '#.....#', '#######']);
    expect(placasDaParede(fase, 3, 3)).toEqual([]);
    // A parede da borda continua com a placa.
    expect(placasDaParede(fase, 3, 0).length).toBeGreaterThan(0);
    const itens = itensEmPe(fase, null);
    expect(itens.get(6)).toEqual([{ tipo: 'pilar', x: 3, y: 3 }]);
    expect([...itens.values()].flat()).toHaveLength(1);
  });

  it('os enfeites se dividem em chão e em pé; os de parede ficam todos em pé, menos a teia', () => {
    const emPe = TIPOS_DECORACAO.filter(ehDecoracaoEmPe);
    expect(emPe).toEqual(expect.arrayContaining(['barril', 'tocha', 'arvore', 'lapide', 'estante', 'cristal']));
    for (const chao of ['pedras', 'tapete', 'poca', 'runa', 'lava', 'flores', 'teia'] as const) expect(ehDecoracaoEmPe(chao), chao).toBe(false);
    for (const t of TIPOS_DECORACAO) if (ehDecoracaoDeParede(t) && t !== 'teia') expect(ehDecoracaoEmPe(t), t).toBe(true);
  });
});
