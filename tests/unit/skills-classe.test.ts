// Marco 24 (24/10/2026, D-094 a D-096): os dados do jogo seguem o Grimório das Classes v1.2. Os números vêm do
// catálogo que tools/grimorio/gerar-doc.mjs gera a partir do Grimório (o mesmo de docs/SKILLS-DE-CLASSE.md).
import { describe, expect, it } from 'vitest';
import catalogo from '../../tools/grimorio/catalogo.json';
import { CONTEUDO } from '../apoio/fases';
import { ultimateDoPar } from '../../src/combat/ultimates';

describe('skills de classe e ultimates (Grimório v1.2)', () => {
  it('cada classe tem as 8 exclusivas, as 2 iniciais e a geral inicial do Grimório', () => {
    for (const c of catalogo.classes) {
      const classe = CONTEUDO.classes.get(c.id);
      expect(classe?.exclusivas, c.id).toEqual(c.skills);
      expect(classe?.iniciais, c.id).toEqual(c.iniciais);
      expect(classe?.geralInicial, c.id).toBe(c.geralInicial);
      expect(new Set(c.skills).size).toBe(8);
    }
  });

  it('nenhuma skill de classe é de duas classes, e todas têm livro só da classe', () => {
    const todas = catalogo.classes.flatMap((c) => c.skills);
    expect(new Set(todas).size).toBe(todas.length);
    for (const c of catalogo.classes) {
      for (const id of c.skills) {
        const livro = CONTEUDO.itens.get(`livro_${id}`);
        expect(livro?.ensina, id).toBe(id);
        expect(livro?.classe, id).toBe(c.id);
      }
    }
  });

  it('28 ultimates por classe, uma para cada par, na ordem do Grimório', () => {
    expect(CONTEUDO.ultimates.size).toBe(140);
    for (const c of catalogo.classes) {
      expect(c.ultimates).toHaveLength(28);
      for (const u of c.ultimates) {
        const ult = ultimateDoPar(CONTEUDO.ultimates, u.par[1] ?? '', u.par[0] ?? '');
        expect(ult?.classe, u.nome).toBe(c.id);
        const hab = CONTEUDO.habilidades.get(ult?.id ?? '');
        expect(hab?.nome).toBe(u.nome);
        expect(hab?.tags).toContain('ultimate');
      }
    }
  });

  it('9 famílias gerais, cada uma com 4 ativas e 2 passivas (uma defensiva, uma ofensiva)', () => {
    expect(catalogo.familias).toHaveLength(9);
    for (const f of catalogo.familias) {
      expect(f.ativas, f.id).toHaveLength(4);
      expect(f.passivas, f.id).toHaveLength(2);
      for (const id of [...f.ativas, ...f.passivas]) expect(CONTEUDO.definicoes.get(id)?.familiaGeral, id).toBe(f.id);
      const tipos = f.passivas.map((id) => CONTEUDO.habilidades.get(id)?.passiva?.tipo).sort();
      expect(tipos, f.id).toEqual(['defensiva', 'ofensiva']);
      for (const id of f.ativas) expect(CONTEUDO.itens.get(`livro_${id}`)?.classe, id).toBeUndefined();
    }
  });

  it(`os ${catalogo.combos.length} combos do Grimório, sem cruzar classes`, () => {
    expect(CONTEUDO.combos.size).toBe(catalogo.combos.length);
    const nomes = new Set([...CONTEUDO.combos.values()].map((c) => c.nome));
    for (const c of catalogo.combos) expect(nomes.has(c.nome), c.nome).toBe(true);
    const dona = new Map(catalogo.classes.flatMap((c) => c.skills.map((s) => [s, c.id] as const)));
    for (const combo of CONTEUDO.combos.values()) {
      const classes = new Set(combo.sequencia.flatMap((s) => dona.get(s) ?? []));
      expect(classes.size, combo.id).toBeLessThanOrEqual(1);
    }
  });

  it('as etapas e respostas apontam para habilidades internas', () => {
    for (const def of CONTEUDO.definicoes.values()) {
      for (const e of def.base.efeitos) {
        if (e.tipo === 'fase' || e.tipo === 'contragolpe') expect(CONTEUDO.definicoes.get(e.ref ?? '')?.interna, `${def.base.id} → ${e.ref}`).toBe(true);
      }
    }
  });
});
