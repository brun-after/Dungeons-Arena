// D-173 (14/11/2026): toda reação, ressonância e combo de papel ou assinado tem o seu gesto, feito à mão (nenhum fica
// só no texto), e nenhum gesto sobra sem dono.
import { describe, expect, it } from 'vitest';
import { GESTOS_DOS_COMBOS } from '../../src/render/vfx/gestos-combos';
import { GESTOS_DAS_REACOES } from '../../src/render/vfx/gestos-reacoes';
import { GESTOS_DAS_RESSONANCIAS } from '../../src/render/vfx/gestos-ressonancias';
import { CONTEUDO } from '../apoio/fases';

describe('os gestos (D-173)', () => {
  it('as 42 reações', () => {
    expect(Object.keys(GESTOS_DAS_REACOES).sort()).toEqual(CONTEUDO.interacoes.sinergias.map((s) => s.id).sort());
  });
  it('as 30 ressonâncias', () => {
    expect(Object.keys(GESTOS_DAS_RESSONANCIAS).sort()).toEqual([...CONTEUDO.ressonancias.keys()].sort());
  });
  it('os 17 combos de papel e os 30 assinados', () => {
    const ids = [...CONTEUDO.combosDePapel.combos.keys(), ...CONTEUDO.combosAssinados.keys()];
    expect(ids).toHaveLength(47);
    expect(Object.keys(GESTOS_DOS_COMBOS).sort()).toEqual(ids.sort());
  });
  it('cada gesto é um desenho próprio (nenhum repete o código de outro)', () => {
    const todos = [...Object.values(GESTOS_DAS_REACOES), ...Object.values(GESTOS_DOS_COMBOS)].map((g) => g.toString());
    expect(new Set(todos).size).toBe(todos.length);
  });
});
