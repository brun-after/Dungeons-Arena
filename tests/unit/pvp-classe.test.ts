// Marco 25 (25/10/2026, D-102): na arena, as skills de classe batem menos entre personagens; a campanha não muda; e a
// skill que escala com Destreza rola com Força e Destreza.
import { describe, expect, it } from 'vitest';
import { modoPorId } from '../../src/core/conteudo';
import { fatorDeClasseEntrePersonagens } from '../../src/modos/regras';
import { multiplicadorDeRolagem } from '../../src/progression/efeitos-atributo';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { CONTEUDO } from '../apoio/fases';

describe('skills de classe entre personagens (marco 25)', () => {
  it('a arena pede 60%; a campanha e o cooperativo ficam inteiros', () => {
    expect(fatorDeClasseEntrePersonagens(modoPorId(CONTEUDO, 'livre'))).toBeCloseTo(0.6);
    expect(fatorDeClasseEntrePersonagens(modoPorId(CONTEUDO, 'campanha'))).toBe(1);
    expect(fatorDeClasseEntrePersonagens(modoPorId(CONTEUDO, 'cooperativo'))).toBe(1);
  });

  it('a skill de Destreza rola com Força e Destreza; as outras, com Força e Inteligência', () => {
    const a = { forca: 22, destreza: 17, constituicao: 17, inteligencia: 13, sabedoria: 10, carisma: 10, dominio: 10 };
    const k = BALANCE_PADRAO.atributos.efeitos.rolagemPorPontoPct / 100;
    expect(multiplicadorDeRolagem(a, BALANCE_PADRAO, 'destreza')).toBeCloseTo(1 + ((12 + 7) / 2) * k);
    expect(multiplicadorDeRolagem(a, BALANCE_PADRAO, 'forca')).toBeCloseTo(1 + ((12 + 3) / 2) * k);
    expect(multiplicadorDeRolagem(a, BALANCE_PADRAO)).toBeCloseTo(1 + ((12 + 3) / 2) * k);
  });
});
