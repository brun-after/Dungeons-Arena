import { describe, expect, it } from 'vitest';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { criarRng } from '../../src/core/rng';
import { chanceDeVinte, multiplicadorD20, rolarD20 } from '../../src/combat/critico';
import { faixaDaFormula, formulaValida, interpretarFormula, rolar } from '../../src/combat/dados';
import { resolverGolpe, type FonteDeDano } from '../../src/combat/dano';
import { bonusDeAtributo, hpMaximo, manaMaxima } from '../../src/progression/ficha';
import { ATRIBUTOS_NEUTROS } from '../../src/entities/entidade';

const TABELA = BALANCE_PADRAO.combate.critico;
const REGRAS = BALANCE_PADRAO.combate;
const fonte = (bonus = 0, carisma = 10): FonteDeDano => ({ id: 'a', equipe: 'x', bonusAtributo: bonus, carisma, multDano: 1, multCura: 1 });

describe('fórmulas de dados (§2.7)', () => {
  it('interpreta multigrupo, constante e dados negativos', () => {
    expect(interpretarFormula('2d6+1d8+3')).toEqual([
      { sinal: 1, quantidade: 2, faces: 6 },
      { sinal: 1, quantidade: 1, faces: 8 },
      { sinal: 1, quantidade: 3, faces: 0 },
    ]);
    expect(interpretarFormula('1d8 - 1d4')).toEqual([
      { sinal: 1, quantidade: 1, faces: 8 },
      { sinal: -1, quantidade: 1, faces: 4 },
    ]);
    expect(interpretarFormula('-1d4')).toEqual([{ sinal: -1, quantidade: 1, faces: 4 }]);
  });

  it('recusa textos que não são fórmula', () => {
    for (const t of ['', 'd6', '2d', '2x6', '1d6+', '0d6', '1d6++2']) expect(formulaValida(t)).toBe(false);
  });

  it('a rolagem fica sempre dentro da faixa e cobre os extremos', () => {
    const rng = criarRng(5);
    const { min, max } = faixaDaFormula('2d6+1d8-1d4+3');
    expect([min, max]).toEqual([2 + 1 - 4 + 3, 12 + 8 - 1 + 3]);
    const vistos = new Set<number>();
    for (let i = 0; i < 5000; i++) {
      const v = rolar(rng, '2d6+1d8-1d4+3').total;
      expect(v).toBeGreaterThanOrEqual(min);
      expect(v).toBeLessThanOrEqual(max);
      vistos.add(v);
    }
    expect(vistos.has(min) && vistos.has(max)).toBe(true);
  });
});

describe('crítico pelo d20 (§2.7)', () => {
  it('segue a tabela', () => {
    const casos: [number, number][] = [
      [1, 0], [3, 0], [4, 1], [12, 1], [13, 1.2], [15, 1.2], [16, 1.5], [19, 1.5], [20, 2],
    ];
    for (const [d20, mult] of casos) expect(multiplicadorD20(d20, TABELA)).toBe(mult);
  });

  it('chance de Carisma acumula 1% + i × 0,5% por ponto acima de 10', () => {
    expect(chanceDeVinte(10, 10)).toBe(0);
    expect(chanceDeVinte(11, 10)).toBeCloseTo(0.015);
    expect(chanceDeVinte(12, 10)).toBeCloseTo(0.035);
    expect(chanceDeVinte(14, 10)).toBeCloseTo(0.04 + 0.05);
  });

  it('Carisma alto converte rolagens em 20 com a frequência esperada', () => {
    const rng = criarRng(9);
    let vintes = 0;
    const n = 20_000;
    for (let i = 0; i < n; i++) if (rolarD20(rng, 20, 10) === 20) vintes++;
    // 1/20 + (19/20) × chance(20)
    const esperado = 0.05 + 0.95 * chanceDeVinte(20, 10);
    expect(vintes / n).toBeGreaterThan(esperado - 0.02);
    expect(vintes / n).toBeLessThan(esperado + 0.02);
  });
});

describe('pipeline de dano (§2.7)', () => {
  it('falha crítica dá zero, nunca 1, e é marcada como falha', () => {
    const rng = criarRng(1);
    let falhas = 0;
    for (let i = 0; i < 2000; i++) {
      const r = resolverGolpe(rng, '1d10', fonte(5), { defesa: 50, imune: false }, REGRAS);
      if (r.d20 <= 3) {
        falhas++;
        expect(r).toMatchObject({ dano: 0, falha: true, mult: 0 });
      } else {
        expect(r.dano).toBe(1); // defesa enorme: dano acertado nunca fica abaixo de 1
      }
    }
    expect(falhas).toBeGreaterThan(0);
  });

  it('imunidade zera sem virar dano 1', () => {
    const rng = criarRng(2);
    for (let i = 0; i < 200; i++) {
      const r = resolverGolpe(rng, '1d10', fonte(5), { defesa: 0, imune: true }, REGRAS);
      expect(r.dano).toBe(0);
    }
  });

  it('atributo é aditivo e a defesa é plana: (rolagem + bônus) × mult − defesa, arredondado uma vez', () => {
    const rng = criarRng(3);
    for (let i = 0; i < 2000; i++) {
      const r = resolverGolpe(rng, '2d6', fonte(5), { defesa: 2, imune: false }, REGRAS);
      if (r.falha) continue;
      expect(r.dano).toBe(Math.max(1, Math.round((r.rolagem + 5) * r.mult - 2)));
    }
  });
});

describe('ficha (§2.5, §2.12)', () => {
  it('HP máximo e mana pelas fórmulas', () => {
    expect(hpMaximo(40, 10, 4, 1)).toBe(80);
    expect(hpMaximo(140, 10, 4, 1.5)).toBe(270);
    expect(hpMaximo(0, 0, 4, 1)).toBe(1);
    expect(manaMaxima(10)).toBe(10);
    expect(manaMaxima(15)).toBe(15);
    expect(manaMaxima(0)).toBe(1);
  });

  it('bônus de atributo: conjurador usa Inteligência; os demais, Força', () => {
    const a = { ...ATRIBUTOS_NEUTROS, forca: 14, inteligencia: 9 };
    expect(bonusDeAtributo(a, 'corpo_a_corpo', 0.5)).toBe(7);
    expect(bonusDeAtributo(a, 'conjurador', 0.5)).toBe(4);
  });
});
