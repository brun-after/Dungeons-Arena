// Marco 24 (24/10/2026, D-094 a D-096): os dados do jogo seguem o Grimório das Classes v1.2. Os números vêm do
// catálogo que tools/grimorio/gerar-doc.mjs gera a partir do Grimório (o mesmo de docs/SKILLS-DE-CLASSE.md).
import { describe, expect, it } from 'vitest';
import catalogo from '../../tools/grimorio/catalogo.json';
import { CONTEUDO } from '../apoio/fases';

describe('skills de classe e ultimates (Grimório v1.2)', () => {
  // Marco 40 (D-159): das 8 do Grimório, 6 seguem no kit (com o nome e as leituras do catálogo novo) e 2 saíram.
  it('cada classe tem as 8 do Grimório entre as 6 exclusivas e as 2 que saíram, e a geral inicial', () => {
    for (const c of catalogo.classes) {
      const classe = CONTEUDO.classes.get(c.id);
      expect([...(classe?.exclusivas ?? []), ...(classe?.saidas ?? [])].sort(), c.id).toEqual([...c.skills].sort());
      expect(classe?.geralInicial, c.id).toBe(c.geralInicial);
      expect(new Set(c.skills).size).toBe(8);
    }
  });

  it('nenhuma skill de classe é de duas classes, e as do kit têm livro só da classe', () => {
    const todas = catalogo.classes.flatMap((c) => c.skills);
    expect(new Set(todas).size).toBe(todas.length);
    for (const c of catalogo.classes) {
      for (const id of c.skills.filter((x) => CONTEUDO.classes.get(c.id)?.exclusivas.includes(x))) {
        const livro = CONTEUDO.itens.get(`livro_${id}`);
        expect(livro?.ensina, id).toBe(id);
        expect(livro?.classe, id).toBe(c.id);
      }
    }
  });

  // Marco 40 (13/11/2026, D-160): as 140 ultimates do Grimório v1.2 saíram; as 21 famílias ficam em ultimates.test.ts.

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

  // Marco 40 (13/11/2026, D-163): os 48 combos feitos só de skills de uma classe saíram (os assinados ficam no lugar).
  it('os 119 combos que ficaram do Grimório, sem cruzar classes', () => {
    expect(CONTEUDO.combos.size).toBe(119);
    const doCatalogo = new Set(catalogo.combos.map((c) => c.nome));
    for (const c of CONTEUDO.combos.values()) expect(doCatalogo.has(c.nome), c.nome).toBe(true);
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
