// D-173 (14/11/2026): as pendências do marco 40 — a identidade de cada classe nas ultimates, as fusões que mudam a
// forma, as leituras de estilo dos companheiros, a montaria comprada no Mundo e as ressonâncias.
import { describe, expect, it } from 'vitest';
import { CONTEUDO } from '../apoio/fases';

describe('as ultimates de cada classe (D-173)', () => {
  it('só o Necromante e o Aventureiro invocam, cada um com as próprias criaturas', () => {
    const criaturas: string[] = [];
    for (const classe of ['necromante', 'aventureiro']) {
      const v = CONTEUDO.veiculos.get(classe);
      expect(v?.invocacoes, classe).toBeDefined();
      expect(v?.etapas, classe).toBeUndefined();
      if (v?.invocacoes) criaturas.push(...Object.values(v.invocacoes));
    }
    expect(new Set(criaturas).size).toBe(6);
    for (const id of criaturas) expect(CONTEUDO.presets.get(id)?.invocacao, id).toBeDefined();
  });

  it('o Mago, o Guerreiro e o Arqueiro trocam a invocação por etapas próprias', () => {
    const etapas: string[] = [];
    for (const classe of ['mago', 'guerreiro', 'arqueiro']) {
      const v = CONTEUDO.veiculos.get(classe);
      expect(v?.invocacoes, classe).toBeUndefined();
      expect(v?.etapas, classe).toBeDefined();
      if (v?.etapas) etapas.push(...Object.values(v.etapas));
    }
    expect(new Set(etapas).size).toBe(9);
    for (const id of etapas) expect(CONTEUDO.definicoes.get(id)?.interna, id).toBe(true);
  });
});
