// D-173 (14/11/2026): as pendências do marco 40 — as criaturas próprias de cada classe nas ultimates, as fusões que
// mudam a forma, as leituras de estilo dos companheiros, a montaria comprada no Mundo e as ressonâncias.
import { describe, expect, it } from 'vitest';
import { CONTEUDO } from '../apoio/fases';

describe('as criaturas das ultimates (D-173)', () => {
  it('cada classe tem as próprias três (ataque, cura e guarda), sem repetir as de outra', () => {
    const todas: string[] = [];
    for (const classe of ['mago', 'necromante', 'guerreiro', 'arqueiro', 'aventureiro']) {
      const v = CONTEUDO.veiculos.get(classe);
      expect(v, classe).toBeDefined();
      if (!v) continue;
      todas.push(v.invocacoes.ataque, v.invocacoes.cura, v.invocacoes.guarda);
    }
    expect(new Set(todas).size).toBe(15);
    for (const id of todas) expect(CONTEUDO.presets.get(id), id).toBeDefined();
  });
});
