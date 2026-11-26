// Marco 54 (26/11/2026, D-207): as costuras do Mundo contínuo. Cada região é gerada sozinha, e as duas de um par
// precisam chegar à borda comum no mesmo chão: a mesma altura onde a borda é aberta e o cruzamento das estradas
// andável e alcançável dos dois lados.

import { describe, expect, it } from 'vitest';
import { conteudoOficial } from '../../src/core/conteudo';
import { montarAtlas, type Costura } from '../../src/mundo/atlas';
import { gerarRegiaoNoAtlas } from '../../src/mundo/atlas-fase';
import { reinoDoConteudo, regiaoPorId } from '../../src/mundo/reino';
import { perfilDaCostura } from '../../src/world/costura';
import { carregarFase, passavel } from '../../src/world/fase';
import type { ExteriorGerado } from '../../src/world/gerador-exterior';
import { alcancaveis } from '../../src/world/navegacao';

const reino = reinoDoConteudo(conteudoOficial());
const atlas = montarAtlas(reino);
const geradas = new Map<string, ExteriorGerado>();

function gerada(id: string): ExteriorGerado {
  let ex = geradas.get(id);
  if (!ex) {
    const r = regiaoPorId(reino, id);
    if (!r) throw new Error(id);
    ex = gerarRegiaoNoAtlas(reino, atlas, r);
    geradas.set(id, ex);
  }
  return ex;
}

/** A célula do lado de `a` e a do lado de `b` na posição `t` da costura (coordenadas das áreas). */
function celulasDaBorda(c: Costura, t: number): { a: { x: number; y: number }; b: { x: number; y: number } } {
  const A = atlas.areas.get(c.a);
  const B = atlas.areas.get(c.b);
  if (!A || !B) throw new Error(c.par);
  return c.vertical
    ? { a: { x: A.largura - 1, y: t - A.y }, b: { x: 0, y: t - B.y } }
    : { a: { x: t - A.x, y: A.altura - 1 }, b: { x: t - B.x, y: 0 } };
}

describe('costuras do Mundo contínuo', () => {
  it('a área gerada tem o tamanho dela no atlas', () => {
    for (const id of ['vila_do_centro', 'eclipse_baluarte']) {
      const a = atlas.areas.get(id);
      const f = gerada(id).fase;
      expect(f.mapa.length).toBe(a?.altura);
      expect(f.mapa[0]?.length).toBe(a?.largura);
    }
  });

  it.each(atlas.costuras.map((c) => [c.par, c] as const))('%s: mesma altura na borda aberta e cruzamento alcançável', (_par, c) => {
    const ea = gerada(c.a);
    const eb = gerada(c.b);
    const perfil = perfilDaCostura(c.par, c.inicio, c.fim);
    const A = atlas.areas.get(c.a);
    const B = atlas.areas.get(c.b);
    if (!A || !B) throw new Error(c.par);
    let abertas = 0;
    for (let t = c.inicio; t < c.fim; t++) {
      if (perfil.em(t).serra) continue;
      const { a, b } = celulasDaBorda(c, t);
      const ha = ea.alturas[a.y * A.largura + a.x] ?? 0;
      const hb = eb.alturas[b.y * B.largura + b.x] ?? 0;
      expect(Math.abs(ha - hb), `t=${String(t)}`).toBeLessThanOrEqual(1);
      abertas++;
    }
    expect(abertas).toBeGreaterThan(0);
    const { a, b } = celulasDaBorda(c, perfil.cruzamento);
    const fa = carregarFase(ea.fase);
    const fb = carregarFase(eb.fase);
    expect(passavel(fa, a.x, a.y)).toBe(true);
    expect(passavel(fb, b.x, b.y)).toBe(true);
    const sa = fa.spawns[0];
    const sb = fb.spawns[0];
    if (!sa || !sb) throw new Error('sem spawn');
    expect(alcancaveis(fa, sa)[a.y * fa.largura + a.x]).toBe(1);
    expect(alcancaveis(fb, sb)[b.y * fb.largura + b.x]).toBe(1);
  }, 60_000);
});
