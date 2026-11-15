// Marco 43 (15/11/2026, D-177): a geografia do exterior, as estradas por A* e a composição do cenário.
import { describe, expect, it } from 'vitest';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { conteudoOficial } from '../../src/core/conteudo';
import { regiaoPorId, type Reino } from '../../src/mundo/reino';
import { caminhoDaEstrada, type TerrenoDaEstrada } from '../../src/world/estradas-exterior';
import { gerarExterior } from '../../src/world/gerador-exterior';
import { ALTURA_MONTANHA_MAX, gerarGeografia, OBSTACULO } from '../../src/world/geografia';

function reino(): Reino {
  const r = conteudoOficial().reinos.get('reino_central');
  if (!r) throw new Error('reino_central ausente');
  return r;
}

describe('gerarGeografia', () => {
  it('é determinística e respeita a altura máxima', () => {
    const a = gerarGeografia({ n: 120, semente: 7, bioma: 'colinas', matas: [] });
    const b = gerarGeografia({ n: 120, semente: 7, bioma: 'colinas', matas: [] });
    expect([...a.alturas]).toEqual([...b.alturas]);
    expect([...a.obstaculos]).toEqual([...b.obstaculos]);
    expect(Math.max(...a.alturas)).toBeLessThanOrEqual(ALTURA_MONTANHA_MAX);
  });

  it('a montanha fica na borda e a água não fica na montanha', () => {
    const g = gerarGeografia({ n: 160, semente: 11, bioma: 'neve', matas: [] });
    const n = 160;
    let naBorda = 0;
    let total = 0;
    for (let k = 0; k < n * n; k++) {
      if (g.agua[k]) expect(g.obstaculos[k]).not.toBe(OBSTACULO.montanha);
      if (g.obstaculos[k] !== OBSTACULO.montanha) continue;
      total++;
      const x = k % n;
      const y = Math.floor(k / n);
      if (Math.min(x, y, n - 1 - x, n - 1 - y) < 20) naBorda++;
    }
    expect(total).toBeGreaterThan(0);
    expect(naBorda / total).toBeGreaterThan(0.6);
  });

  it('os rochedos ficam, na maior parte, no pé da serra ou de um desnível', () => {
    const n = 160;
    const g = gerarGeografia({ n, semente: 3, bioma: 'colinas', matas: [] });
    let comMotivo = 0;
    let total = 0;
    for (let y = 1; y < n - 1; y++) {
      for (let x = 1; x < n - 1; x++) {
        if (g.obstaculos[y * n + x] !== OBSTACULO.rochedo) continue;
        total++;
        const h = g.alturas[y * n + x] ?? 0;
        let motivo = false;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const j = (y + dy) * n + x + dx;
          if (g.obstaculos[j] === OBSTACULO.montanha || Math.abs((g.alturas[j] ?? 0) - h) >= 1) motivo = true;
        }
        if (motivo) comMotivo++;
      }
    }
    expect(total).toBeGreaterThan(0);
    expect(comMotivo / total).toBeGreaterThan(0.6);
  });
});

describe('caminhoDaEstrada', () => {
  it('prefere a passagem seca perto a cruzar a água', () => {
    const n = 20;
    const mapa: string[][] = Array.from({ length: n }, () => Array.from({ length: n }, () => '.'));
    for (let y = 0; y < n; y++) if (y !== 5) (mapa[y] as string[])[10] = '~';
    const t: TerrenoDaEstrada = {
      n, em: (x, y) => mapa[y]?.[x] ?? '#', por: (x, y, ch) => { (mapa[y] as string[])[x] = ch; },
      alturas: new Uint8Array(n * n), obstaculos: new Uint8Array(n * n), protegidas: new Set(),
    };
    const c = caminhoDaEstrada(t, { x: 2, y: 3 }, { x: 17, y: 3 });
    expect(c.at(-1)).toEqual({ x: 17, y: 3 });
    expect(c.some((p) => p.x === 10 && p.y === 5)).toBe(true);
    expect(c.every((p) => mapa[p.y]?.[p.x] !== '~')).toBe(true);
  });
});

describe('composição do cenário', () => {
  const r = reino();
  for (const id of ['vila_do_centro', 'campos_do_oeste', 'colinas_do_sudeste']) {
    it(`${id}: o sólido vira obstáculo e não fecha o caminho de quem chega`, () => {
      const regiao = regiaoPorId(r, id);
      if (!regiao) throw new Error(id);
      const ex = gerarExterior(r, regiao);
      const mapa = ex.fase.mapa;
      const n = mapa.length;
      for (const p of ex.pecas) {
        if (!p.solido) continue;
        expect(mapa[p.y]?.[p.x]).toBe('#');
        expect(ex.obstaculos[p.y * n + p.x]).toBe(OBSTACULO.objeto);
      }
      // Busca a pé desde a chegada (pelo desnível que se anda).
      const anda = (x: number, y: number) => x >= 0 && y >= 0 && x < n && y < n && mapa[y]?.[x] !== '#';
      const visto = new Uint8Array(n * n);
      const s = ex.fase.spawns[0];
      if (!s) throw new Error('sem chegada');
      const fila = [s.y * n + s.x];
      visto[fila[0] as number] = 1;
      for (let i = 0; i < fila.length; i++) {
        const k = fila[i] as number;
        const x = k % n;
        const y = (k - x) / n;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const nk = (y + dy) * n + x + dx;
          if (!anda(x + dx, y + dy) || visto[nk]) continue;
          if (Math.abs((ex.alturas[nk] ?? 0) - (ex.alturas[k] ?? 0)) > BALANCE_PADRAO.relevo.encostaMax) continue;
          visto[nk] = 1;
          fila.push(nk);
        }
      }
      // As portas das casas e os NPCs continuam alcançáveis.
      for (const p of ex.pontos) {
        if (p.tipo !== 'npc') continue;
        expect(visto[p.y * n + p.x], `${p.tipo} ${p.x},${p.y}`).toBe(1);
      }
      // Os cercados têm porteira: dentro deles alcança-se a pé.
      for (const c of ex.pecas.filter((q) => q.nome === 'cocho')) {
        const vizinhos = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx = 0, dy = 0]) => visto[(c.y + dy) * n + c.x + dx]);
        expect(vizinhos, `cocho ${c.x},${c.y}`).toBe(true);
      }
    });
  }
});
