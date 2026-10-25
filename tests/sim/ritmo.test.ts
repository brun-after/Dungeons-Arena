// Marco 15 (15/10/2026, D-061): o ritmo do jogo, versão curta do simulador (tools/balanceamento). Protege as metas
// de `balance.metas` contra regressões: o comum do mesmo nível, quanto se aguenta, o chefe, o PvP do Livre, o aviso
// de toda habilidade inimiga e o degrau das dificuldades. O relatório completo sai de `npm run balancear`.

import { describe, expect, it } from 'vitest';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { CLASSES, aguenta, avisos, chefe, mediana, pvpLivre, sequencia } from '../../tools/balanceamento/simulador';

const metas = BALANCE_PADRAO.metas;
const SEMENTES = [1000, 8919, 16838];

describe('ritmo médio (balance.metas)', () => {
  for (const classe of CLASSES) {
    it(`${classe}: o comum do mesmo nível cai em ${metas.comum.golpesMin}–${metas.comum.golpesMax} golpes, nos níveis 1, 5 e 10`, () => {
      for (const nivel of [1, 5, 10]) {
        const lutas = SEMENTES.flatMap((s) => sequencia(classe, nivel, metas.comuns, s));
        expect(lutas.every((l) => l.venceu), `${classe} ${nivel}`).toBe(true);
        const golpes = mediana(lutas.map((l) => l.golpes));
        const tempo = mediana(lutas.map((l) => l.tempoS));
        // Uma folga de 1 golpe e 1 s na versão curta (menos sementes que o relatório).
        expect(golpes, `${classe} ${nivel} golpes`).toBeGreaterThanOrEqual(metas.comum.golpesMin);
        expect(golpes, `${classe} ${nivel} golpes`).toBeLessThanOrEqual(metas.comum.golpesMax + 1);
        expect(tempo, `${classe} ${nivel} tempo`).toBeGreaterThanOrEqual(metas.comum.tempoMinS - 1);
        expect(tempo, `${classe} ${nivel} tempo`).toBeLessThanOrEqual(metas.comum.tempoMaxS + 1);
      }
    });
  }

  it('o jogador aguenta de 6 a 8 golpes de um comum do mesmo nível', () => {
    for (const classe of CLASSES) {
      const golpes = mediana(metas.comuns.flatMap((p) => SEMENTES.slice(0, 2).map((s) => aguenta(classe, 5, p, s).golpes)));
      expect(golpes, classe).toBeGreaterThanOrEqual(metas.aguenta.golpesMin);
      expect(golpes, classe).toBeLessThanOrEqual(metas.aguenta.golpesMax);
    }
  });

  it('o chefe da fase 1, sozinho, dura de 25 a 40 s; em grupo de 4, menos, mas não menos de 40% do solo', () => {
    const solo = SEMENTES.map((s) => chefe('arqueiro', metas.chefe.nivelJogador, s, 1, 'normal', metas.chefe.nivelChefe)).filter((r) => r.venceu);
    expect(solo.length).toBeGreaterThanOrEqual(2);
    const tSolo = mediana(solo.map((r) => r.tempoS));
    expect(tSolo).toBeGreaterThanOrEqual(metas.chefe.tempoMinS);
    expect(tSolo).toBeLessThanOrEqual(metas.chefe.tempoMaxS);
    const tGrupo = mediana(SEMENTES.map((s) => chefe('arqueiro', metas.chefe.nivelJogador, s, 4, 'normal', metas.chefe.nivelChefe).tempoS));
    expect(tGrupo).toBeLessThan(tSolo);
    expect(tGrupo).toBeGreaterThanOrEqual((tSolo * metas.grupo.tempoMinPctDoSolo) / 100);
  });

  it('PvP no Livre: de 6 a 10 s para cair', () => {
    for (const classe of CLASSES) {
      const t = mediana(SEMENTES.map((s) => pvpLivre(classe, s, metas.pvpLivre.nivel).tempoS));
      expect(t, classe).toBeGreaterThanOrEqual(metas.pvpLivre.tempoMinS - 0.5);
      expect(t, classe).toBeLessThanOrEqual(metas.pvpLivre.tempoMaxS);
    }
  });

  it(`toda habilidade inimiga deixa ao menos ${metas.avisoUtilMinMs} ms de aviso útil no perfil suportado`, () => {
    for (const a of avisos()) expect(a.suportadoMs, a.habilidade).toBeGreaterThanOrEqual(metas.avisoUtilMinMs);
  });

  it('o degrau das dificuldades: mais difícil, a luta demora mais e se aguenta menos', () => {
    // Marco 25 (25/10/2026): mediana das três sementes; o voo do falcão deixa uma semente só ruidosa demais.
    const tempo = (d: 'facil' | 'normal' | 'pesadelo') => mediana(SEMENTES.flatMap((s) => sequencia('aventureiro', 5, metas.comuns, s, d)).map((l) => l.tempoS));
    const golpes = (d: 'facil' | 'normal' | 'pesadelo') => mediana(metas.comuns.map((p) => aguenta('aventureiro', 5, p, 1000, d).golpes));
    expect(tempo('facil')).toBeLessThan(tempo('normal'));
    expect(tempo('normal')).toBeLessThan(tempo('pesadelo'));
    expect(golpes('facil')).toBeGreaterThan(golpes('normal'));
    expect(golpes('normal')).toBeGreaterThan(golpes('pesadelo'));
  });
});
