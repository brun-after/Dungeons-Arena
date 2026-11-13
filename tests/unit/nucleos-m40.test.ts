// Marco 40 (12/11/2026, D-158): as 89 skills comuns saem dos 20 núcleos; as gerais antigas deixam o jogador (livros,
// geral inicial, save e ficha) e vão para a variante mais próxima.
import { describe, expect, it } from 'vitest';
import { compilarHabilidade } from '../../src/combat/compilar-habilidade';
import { EIXOS, PAPEIS } from '../../src/combat/eixos';
import { expandirNucleos } from '../../src/combat/nucleos';
import { FONTES_OFICIAIS } from '../../src/core/conteudo';
import { migrarSkillsDeNucleo, semSkillsDoLegado } from '../../src/save/migracao-40';
import { VERSAO_SCHEMA } from '../../src/save/esquema';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const ctx = contexto(faseDeTexto(SALA_ABERTA, 'fase-02'));
const comuns = [...CONTEUDO.definicoes.values()].filter((d) => d.nucleo !== undefined);
const legado = CONTEUDO.legadoDeSkills;

describe('as skills comuns de núcleo', () => {
  it('são 89 em 20 núcleos, com id núcleo_elemento, papel e eixos', () => {
    expect(comuns).toHaveLength(89);
    expect(new Set(comuns.map((d) => d.nucleo)).size).toBe(20);
    for (const d of comuns) {
      const ponta = d.base.elemento ?? 'fisico';
      expect(d.base.id).toBe(`${String(d.nucleo)}_${ponta}`);
      expect(PAPEIS).toContain(d.base.papel);
      expect(d.eixos?.length).toBeGreaterThanOrEqual(4);
      for (const e of d.eixos ?? []) expect(EIXOS).toContain(e);
      expect(d.familiaGeral).toBeUndefined();
    }
  });

  it('cada uma tem um livro que qualquer classe lê; as gerais antigas não têm mais livro', () => {
    const livros = [...CONTEUDO.itens.values()].filter((i) => i.tipo === 'livro');
    for (const d of comuns) {
      const livro = livros.find((i) => i.ensina === d.base.id);
      expect(livro, d.base.id).toBeDefined();
      expect(livro?.classe).toBeUndefined();
    }
    for (const antiga of legado.keys()) expect(livros.some((i) => i.ensina === antiga), antiga).toBe(false);
  });

  it('a geral inicial de toda classe é uma skill de núcleo', () => {
    for (const c of CONTEUDO.classes.values()) expect(CONTEUDO.definicoes.get(c.geralInicial ?? '')?.nucleo, c.id).toBeDefined();
  });

  it('o legado leva cada uma das 54 gerais antigas a uma skill de núcleo', () => {
    const gerais = [...CONTEUDO.definicoes.values()].filter((d) => d.familiaGeral !== undefined).map((d) => d.base.id);
    expect(gerais).toHaveLength(54);
    for (const id of gerais) expect(CONTEUDO.definicoes.get(legado.get(id) ?? '')?.nucleo, id).toBeDefined();
  });

  it('o campo leva o estado do elemento, e o efeito secundário não cai em quem conjura', () => {
    const def = CONTEUDO.definicoes.get('campo_fogo');
    if (!def) throw Error('sem campo_fogo');
    const h = compilarHabilidade(def, { rank: 1, caminhos: [], mods: [], sintonia: 10 }, CONTEUDO, ctx.balance.habilidades);
    expect(h.efeitos.find((e) => e.tipo === 'campo_veneno')?.interno?.tipo).toBe('queimando');
    // dano.fogo queima "no alvo": num campo (o alvo é quem conjura), ele não entra.
    expect(h.efeitos.some((e) => e.tipo === 'queimando' && e.em === 'alvo')).toBe(false);
  });

  it('a expansão recusa campo de identidade na base e elemento desconhecido', () => {
    const r = expandirNucleos({ nucleos: [{ id: 'x', papel: 'dano', eixos: ['area'], base: { id: 'y' }, variantes: [{ elemento: 'agua', nome: 'X' }] }] });
    expect(r.erros.join(' ')).toMatch(/não vai na base/);
    expect(r.erros.join(' ')).toMatch(/elemento desconhecido/);
    expect(expandirNucleos(FONTES_OFICIAIS.nucleos).erros).toEqual([]);
  });
});

describe('as gerais antigas saem do jogador (save 30 › 31 e fichas)', () => {
  const bolsa = {
    classeId: 'mago',
    conhecidas: [{ id: 'bola_de_fogo', rank: 4, caminhos: ['amplo'] }, { id: 'curar', rank: 2, caminhos: [] }, { id: 'graca', rank: 1, caminhos: [] }, { id: 'lanca_de_gelo', rank: 3, caminhos: [] }],
    barra: ['lanca_de_gelo', null, 'bola_de_fogo', 'curar', null, null],
    liberadas: ['bola_de_fogo', 'curar', 'graca'],
    passivasAtivas: ['graca'],
    estudo: { id: 'explosao', restanteTicks: 50 },
    mochila: [{ invId: 'i1', itemId: 'livro_seta_arcana', qtd: 1, ref: null }, { invId: 'i2', itemId: 'livro_redemoinho', qtd: 1, ref: null }],
    pontosHabilidade: 1,
  };

  it('troca pela variante, zera os caminhos e devolve os ranks acima do 1', () => {
    const b = semSkillsDoLegado(bolsa, legado);
    expect(b.conhecidas).toEqual([
      { id: 'projetil_fogo', rank: 1, caminhos: [] },
      { id: 'cura_sagrado', rank: 1, caminhos: [] },
      { id: 'lanca_de_gelo', rank: 3, caminhos: [] },
    ]);
    // bola_de_fogo 4 › 3 pontos, curar 2 › 1; a Graça cai na mesma Prece e sai sem custo.
    expect(b.pontosHabilidade).toBe(1 + 3 + 1);
    expect(b.barra).toEqual(['lanca_de_gelo', null, 'projetil_fogo', 'cura_sagrado', null, null]);
    expect(b.liberadas).toEqual(['projetil_fogo', 'cura_sagrado']);
    expect(b.passivasAtivas).toEqual([]);
    expect(b.estudo).toEqual({ id: 'explosao_fogo', restanteTicks: 50 });
    expect((b.mochila as { itemId: string }[]).map((i) => i.itemId)).toEqual(['livro_projetil_raio', 'livro_redemoinho']);
  });

  it('é idempotente: a bolsa sem gerais antigas sai a mesma', () => {
    const uma = semSkillsDoLegado(bolsa, legado);
    expect(semSkillsDoLegado(uma, legado)).toBe(uma);
  });

  it('a migração do save passa por todos os jogadores, na fase atual e nas visitadas', () => {
    expect(VERSAO_SCHEMA).toBe(31);
    const jogador = { id: 'j', tipo: 'jogador', habilidades: ['bola_de_fogo'], bolsa };
    const r = migrarSkillsDeNucleo({ estado: { entidades: [jogador] }, fasesVisitadas: { f1: { entidades: [jogador] } } }, legado);
    const ent = (v: unknown) => (v as { entidades: { habilidades: string[]; bolsa: { conhecidas: { id: string }[] } }[] }).entidades[0];
    expect(ent(r.estado)?.habilidades).toEqual(['lanca_de_gelo', 'projetil_fogo', 'cura_sagrado']);
    expect(ent((r.fasesVisitadas as Record<string, unknown>).f1)?.bolsa.conhecidas.map((c) => c.id)).toContain('projetil_fogo');
  });
});
