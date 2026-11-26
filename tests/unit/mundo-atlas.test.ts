// Marco 54 (26/11/2026, D-207): o atlas do Mundo contínuo (as regiões encostadas num espaço único).

import { describe, expect, it } from 'vitest';
import { conteudoOficial } from '../../src/core/conteudo';
import { conferirAtlas, costuraDoLado, doAtlas, ladosAbertos, montarAtlas, paraOAtlas } from '../../src/mundo/atlas';
import { reinoDoConteudo, regiaoPorId } from '../../src/mundo/reino';

const reino = reinoDoConteudo(conteudoOficial());
const atlas = montarAtlas(reino);

describe('atlas do Mundo contínuo', () => {
  it('põe as 24 regiões sem sobreposição e com toda costura aberta larga o bastante', () => {
    expect(atlas.areas.size).toBe(24);
    expect(conferirAtlas(atlas)).toEqual([]);
  });

  it('cada área cabe o conteúdo da região (o quadrado de antes) e fica dentro do atlas', () => {
    for (const r of reino.regioes) {
      const a = atlas.areas.get(r.id);
      expect(a).toBeDefined();
      if (!a) continue;
      const t = r.tamanho ?? reino.tamanhoRegiao;
      expect(a.largura).toBeGreaterThanOrEqual(t);
      expect(a.altura).toBeGreaterThanOrEqual(t);
      expect(a.x + a.largura).toBeLessThanOrEqual(atlas.largura);
      expect(a.y + a.altura).toBeLessThanOrEqual(atlas.altura);
      expect(doAtlas(a, paraOAtlas(a, 10, 20).x, paraOAtlas(a, 10, 20).y)).toEqual({ x: 10, y: 20 });
    }
  });

  it('as vizinhas de uma costura encostam: a borda de uma é a da outra', () => {
    for (const c of atlas.costuras) {
      const a = atlas.areas.get(c.a);
      const b = atlas.areas.get(c.b);
      if (!a || !b) throw new Error(c.par);
      if (c.vertical) expect(a.x + a.largura).toBe(b.x);
      else expect(a.y + a.altura).toBe(b.y);
    }
  });

  it('o Central e o Eclipse só se ligam pela Travessia', () => {
    const colinas = regiaoPorId(reino, 'colinas_do_sudeste');
    const garganta = regiaoPorId(reino, 'garganta_do_sol');
    if (!colinas || !garganta) throw new Error('regiões');
    expect(costuraDoLado(atlas, 'colinas_do_sudeste', 'leste')?.b).toBe('dunas_do_poente');
    expect(costuraDoLado(atlas, 'garganta_do_sol', 'leste')?.b).toBe('eclipse_baluarte');
    expect(ladosAbertos(reino, garganta).sort()).toEqual(['leste', 'sul']);
    const pico = regiaoPorId(reino, 'pico_gelado');
    if (!pico) throw new Error('pico');
    expect(ladosAbertos(reino, pico)).not.toContain('leste');
  });
});
