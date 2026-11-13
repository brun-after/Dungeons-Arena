// Marco 40 (12/11/2026, D-159): as 6 skills de cada classe, com papel e a leitura de cada um dos 5 estilos da classe;
// as que saíram do kit deixam o personagem.
import { describe, expect, it } from 'vitest';
import { formatarChave, lerChave } from '../../src/combat/chave-habilidade';
import { compilarHabilidade, resolverHabilidade } from '../../src/combat/compilar-habilidade';
import { EIXOS, PAPEIS } from '../../src/combat/eixos';
import { semSkillsDoLegado } from '../../src/save/migracao-40';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const ctx = contexto(faseDeTexto(SALA_ABERTA, 'fase-02'));
function obter<T>(v: T | null | undefined): T {
  if (v === null || v === undefined) throw Error('ausente');
  return v;
}

describe('as skills de classe (D-159)', () => {
  it('cada classe tem 6, com papel e uma leitura por estilo da classe, na ordem', () => {
    for (const c of CONTEUDO.classes.values()) {
      expect(c.exclusivas, c.id).toHaveLength(6);
      const estilos = obter(CONTEUDO.estilos.get(c.id)).map((e) => e.id);
      for (const id of c.exclusivas) {
        const def = obter(CONTEUDO.definicoes.get(id));
        expect(PAPEIS, id).toContain(def.base.papel);
        expect(Object.keys(def.leituras ?? {}), id).toEqual(estilos);
        for (const l of Object.values(def.leituras ?? {})) {
          expect(EIXOS).toContain(l.eixo);
          expect(l.texto.length).toBeGreaterThan(5);
        }
      }
    }
  });

  it('as que saíram ficam da classe, fora do kit e sem livro', () => {
    for (const c of CONTEUDO.classes.values()) {
      expect(c.saidas, c.id).toHaveLength(2);
      for (const id of c.saidas) {
        expect(c.exclusivas).not.toContain(id);
        expect([...CONTEUDO.itens.values()].some((i) => i.ensina === id)).toBe(false);
        expect(CONTEUDO.skillsQueSairam.has(id)).toBe(true);
      }
      for (const id of c.iniciais) expect(c.exclusivas).toContain(id);
    }
  });

  it('a chave leva as leituras e volta igual', () => {
    const chave = formatarChave({ id: 'redemoinho', rank: 2, caminhos: [], mods: [], formas: [{ mod: 'maior_e_mais_lenta', faixa: 6 }], leituras: [{ estilo: 'comandante', faixa: 3 }, { estilo: 'carniceiro', faixa: 6 }], sintonia: 4 });
    expect(chave).toBe('redemoinho@2^maior_e_mais_lenta6&carniceiro6,comandante3%4');
    expect(lerChave(chave)).toMatchObject({ id: 'redemoinho', rank: 2, leituras: [{ estilo: 'carniceiro', faixa: 6 }, { estilo: 'comandante', faixa: 3 }], sintonia: 4 });
  });

  it('o efeito da leitura cresce com a faixa do estilo e só entra com ele', () => {
    const def = obter(CONTEUDO.definicoes.get('redemoinho'));
    const cura = (faixa: number) => compilarHabilidade(def, { rank: 1, caminhos: [], mods: [], ...(faixa > 0 && { leituras: [{ estilo: 'carniceiro', faixa }] }) }, CONTEUDO, ctx.balance.habilidades)
      .efeitos.find((e) => e.tipo === 'cura' && e.em === 'conjurador')?.valor ?? 0;
    expect(cura(0)).toBe(0);
    expect(cura(5)).toBe(1);
    expect(cura(10)).toBe(2);
    // Uma leitura de outro estilo da skill não traz a cura.
    const h = obter(resolverHabilidade(ctx, 'redemoinho&duelista10'));
    expect(h.efeitos.some((e) => e.tipo === 'cura')).toBe(false);
  });

  it('a migração tira do personagem as skills que saíram, sem devolver ponto', () => {
    const b = semSkillsDoLegado({
      conhecidas: [{ id: 'corrente', rank: 4, caminhos: [] }, { id: 'redemoinho', rank: 3, caminhos: [] }],
      barra: ['corrente', 'redemoinho', null, null, null, null],
      estudo: { id: 'contragolpe', restanteTicks: 9 },
      mochila: [{ invId: 'i1', itemId: 'livro_corrente', qtd: 1, ref: null }],
      pontosHabilidade: 2,
    }, CONTEUDO.legadoDeSkills, CONTEUDO.skillsQueSairam);
    expect(b.conhecidas).toEqual([{ id: 'redemoinho', rank: 3, caminhos: [] }]);
    expect(b.barra).toEqual([null, 'redemoinho', null, null, null, null]);
    expect(b.estudo).toBeNull();
    expect(b.mochila).toEqual([]);
    expect(b.pontosHabilidade).toBe(2);
  });
});
