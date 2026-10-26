// Marco 26 (25/10/2026, D-108): braços e pernas em quadros do atlas — a escolha do quadro, o ciclo da passada e as
// mãos que a arma e o escudo seguem.
import { describe, expect, it } from 'vitest';
import { OPCOES_JOGAVEIS } from '../../src/render/modelos';
import { deslocamentosDasMaos } from '../../src/render/modelos/adornos';
import { bipede34, maosDoBipede } from '../../src/render/modelos/bipede';
import { QUADRO_GOLPE, QUADROS_MEMBROS, quadroDoBalanco } from '../../src/render/modelos/membros';
import { quadroDoToken, type MomentoDoQuadro } from '../../src/render/quadro-membros';

const membros = { quadros: QUADROS_MEMBROS, membros: true, estilo: 'passada' as const };
const parado: MomentoDoQuadro = { tMs: 0, fase: 0, andando: false, golpeando: false, reduzido: false, fixo: null };

describe('braços e pernas animados', () => {
  it('o balanço senoidal percorre 1, 2, 1, 0, 3, 4, 3, 0', () => {
    const ciclo = [0.5, 1, 0.5, 0, -0.5, -1, -0.5, 0].map(quadroDoBalanco);
    expect(ciclo).toEqual([1, 2, 1, 0, 3, 4, 3, 0]);
  });

  it('andando passa pelos quadros da passada; o golpe estende o braço; parado e reduzido ficam no 0', () => {
    const vistos = new Set<number>();
    for (let t = 0; t < 2000; t += 20) vistos.add(quadroDoToken(membros, { ...parado, tMs: t, andando: true }));
    expect([...vistos].sort()).toEqual([0, 1, 2, 3, 4]);
    expect(quadroDoToken(membros, { ...parado, andando: true, golpeando: true })).toBe(QUADRO_GOLPE);
    expect(quadroDoToken(membros, parado)).toBe(0);
    for (let t = 0; t < 2000; t += 50) expect(quadroDoToken(membros, { ...parado, tMs: t, andando: true, golpeando: true, reduzido: true })).toBe(0);
  });

  it('o falcão segue com a sequência própria (e o quadro pedido de fora)', () => {
    const falcao = { quadros: 3, membros: false, estilo: 'flutuar' as const };
    expect(quadroDoToken(falcao, { ...parado, fixo: 7 })).toBe(2);
    expect(quadroDoToken(falcao, { ...parado, tMs: 190, andando: true })).toBe(1);
    expect(quadroDoToken(falcao, { ...parado, tMs: 190, andando: true, reduzido: true })).toBe(0);
  });

  it('os quadros mudam o desenho, sem NaN, e as mãos que a arma segue andam com o braço', () => {
    const o = OPCOES_JOGAVEIS.guerreiro;
    const quadros = Array.from({ length: QUADROS_MEMBROS }, (_, q) => bipede34(o, q));
    expect(new Set(quadros).size).toBe(QUADROS_MEMBROS);
    for (const s of quadros) expect(s).not.toMatch(/NaN|undefined|Infinity/);
    // No golpe, a mão da arma vai à frente (+x) e sobe.
    const golpe = maosDoBipede(o, '34', QUADRO_GOLPE);
    const zero = maosDoBipede(o, '34', 0);
    expect(golpe.d.x).toBeGreaterThan(zero.d.x + 5);
    expect(golpe.d.y).toBeLessThan(zero.d.y);
    for (const vista of ['34', 'cima'] as const) {
      const d = deslocamentosDasMaos(o, vista);
      expect(d).toHaveLength(QUADROS_MEMBROS);
      expect(d[0]).toEqual({ e: { x: 0, y: 0 }, d: { x: 0, y: 0 } });
      // Na passada, as mãos balançam em oposição.
      expect(Math.sign(d[2]?.e.x ?? 0)).toBe(-Math.sign(d[2]?.d.x ?? 0));
    }
  });
});
