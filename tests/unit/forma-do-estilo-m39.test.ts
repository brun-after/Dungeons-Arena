// Marco 39 (12/11/2026, D-152; gradual desde D-156): a forma do estilo aparece com 10% da ponta e cresce em 10 faixas até
// 100%. A faixa vai na chave das skills da etiqueta; a mecânica e o custo de dano por alvo crescem com ela; skills de
// outra etiqueta não mudam; o que o equipamento dá vale inteiro.
import { describe, expect, it } from 'vitest';
import { formatarChave, lerChave } from '../../src/combat/chave-habilidade';
import { areaDaForma, ecoDaForma, faixaDaForma, perfuracaoDaForma, saltosDaForma } from '../../src/combat/forma-do-estilo';
import { chaveDoAtor, habilidadeDoAtor, perfilPara } from '../../src/combat/perfil';
import { resolverHabilidade } from '../../src/combat/compilar-habilidade';
import { criarJogador } from '../../src/entities/fabrica';
import type { Entidade } from '../../src/entities/entidade';
import { formasDosEstilos, radarDe } from '../../src/progression/estilos';
import { formaDoEixo } from '../../src/combat/eixos';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const ctx = contexto(faseDeTexto(SALA_ABERTA));
function obter<T>(v: T | null | undefined): T {
  if (v === null || v === undefined) throw Error('ausente');
  return v;
}

/** O Mago com Inteligência e Destreza postas (enchem o Artilheiro). */
function mago(nivel: number, inteligencia: number, destreza: number): Entidade {
  const j = criarJogador(obter(CONTEUDO.classes.get('mago')), 'j', 2, 2, ctx.balance);
  const b = obter(j.bolsa);
  j.nivel = nivel;
  b.atributosBase = { ...b.atributosBase, inteligencia, destreza };
  j.atributos = { ...b.atributosBase };
  return j;
}
const faixaDoArtilheiro = (j: Entidade) => formasDosEstilos(ctx, j).find((f) => f.estilo.id === 'artilheiro')?.faixa ?? 0;

describe('forma do estilo, gradual (D-156)', () => {
  it('todo estilo tem dois eixos, e a forma de cada eixo cobra dano (marco 40, D-157)', () => {
    const estilos = [...CONTEUDO.estilos.values()].flat();
    expect(estilos).toHaveLength(25);
    for (const e of estilos) {
      expect(e.eixos[0]).not.toBe(e.eixos[1]);
      for (const x of e.eixos) expect(ctx.balance.habilidades.eixos.custoPct[formaDoEixo(x)]).toBeLessThan(0);
    }
  });

  it('a faixa: 0 antes de 10%, 1 em 10% e 10 em 100% ou acima', () => {
    expect(faixaDaForma(0.09, 0.1, 1)).toBe(0);
    expect(faixaDaForma(0.1, 0.1, 1)).toBe(1);
    expect(faixaDaForma(0.55, 0.1, 1)).toBe(5);
    expect(faixaDaForma(1, 0.1, 1)).toBe(10);
    expect(faixaDaForma(1.2, 0.1, 1)).toBe(10);
  });

  it('cada forma cresce com a faixa e, na 10, iguala o modificador do equipamento', () => {
    for (let f = 2; f <= 10; f++) {
      expect(ecoDaForma(f)).toBeGreaterThan(ecoDaForma(f - 1));
      expect(saltosDaForma(f).pct).toBeGreaterThan(saltosDaForma(f - 1).pct);
      expect(perfuracaoDaForma(f)).toBeGreaterThanOrEqual(perfuracaoDaForma(f - 1));
      expect(areaDaForma(f).danoMult).toBeGreaterThan(areaDaForma(f - 1).danoMult);
    }
    expect(ecoDaForma(10)).toBeCloseTo(0.5);
    expect(saltosDaForma(10)).toMatchObject({ quantidade: 2, pct: 50 });
    expect(areaDaForma(10)).toEqual({ raioExtra: 1, conjuracaoMult: 1.5, danoMult: 1.25 });
  });

  it('a chave leva as formas e a faixa, e volta igual', () => {
    const chave = formatarChave({ id: 'bola_de_fogo', rank: 2, caminhos: [], mods: [], formas: [{ mod: 'ecoar', faixa: 4 }, { mod: 'encadear', faixa: 10 }], runa: { runa: 'gelo', faixa: 7 } });
    expect(chave).toBe('bola_de_fogo@2^ecoar4,encadear10!gelo7');
    expect(lerChave(chave)).toMatchObject({ id: 'bola_de_fogo', rank: 2, formas: [{ mod: 'ecoar', faixa: 4 }, { mod: 'encadear', faixa: 10 }], runa: { runa: 'gelo', faixa: 7 } });
    expect(lerChave('bola_de_fogo^ecoar11')).toBeNull();
  });

  it('o Artilheiro: a área maior aparece cedo e cresce nas magias de área, e só nelas', () => {
    const j0 = criarJogador(obter(CONTEUDO.classes.get('mago')), 'j', 2, 2, ctx.balance);
    const area = obter(obter(j0.bolsa).conhecidas.map((c) => c.id).concat(['nova_glacial', 'lanca_de_gelo']).find((id) => habilidadeDoAtor(ctx, j0, id)?.politicaImpacto === 'area'));
    const pouco = mago(10, 22, 14);
    const muito = mago(60, 100, 80);
    const fp = faixaDoArtilheiro(pouco);
    const fm = faixaDoArtilheiro(muito);
    expect(fp).toBeGreaterThan(0);
    expect(fm).toBeGreaterThan(fp);
    const hp = obter(habilidadeDoAtor(ctx, pouco, area));
    const hm = obter(habilidadeDoAtor(ctx, muito, area));
    expect(lerChave(hp.chave)?.formas).toEqual([{ mod: 'maior_e_mais_lenta', faixa: fp }]);
    expect(hm.multDano).toBeGreaterThan(hp.multDano);
    expect(hm.conjuracaoMs).toBeGreaterThan(hp.conjuracaoMs);
    // Uma skill de outra etiqueta não muda.
    const outra = obter(['raio_em_cadeia', 'mente_partida', 'bola_de_fogo', 'lanca_de_gelo'].find((id) => !(habilidadeDoAtor(ctx, muito, id)?.tags ?? ['area']).includes('area')));
    expect(lerChave(chaveDoAtor(ctx, muito, outra))?.formas ?? []).not.toContainEqual(expect.objectContaining({ mod: 'maior_e_mais_lenta' }));
    // O custo por alvo cresce com a faixa: na faixa f, f/10 do custo cheio.
    const custo = ctx.balance.habilidades.eixos.custoPct.maior_e_mais_lenta;
    // Só a área maior sai (o eco do Ocultista também vale nas magias e continua).
    const outras = (h: typeof hm) => (h.formas ?? []).filter((f) => f.mod !== 'maior_e_mais_lenta');
    const semForma = (h: typeof hm) => ({ ...h, chave: formatarChave({ ...obter(lerChave(h.chave)), formas: outras(h) }), formas: outras(h) });
    expect(perfilPara(ctx, muito, hm).danoPct - perfilPara(ctx, muito, semForma(hm)).danoPct).toBeCloseTo((custo * fm) / 10);
  });

  it('o modificador do equipamento vale inteiro e a forma do mesmo não entra', () => {
    const h = obter(resolverHabilidade(ctx, formatarChave({ id: 'bola_de_fogo', rank: 1, caminhos: [], mods: ['ecoar'], formas: [{ mod: 'ecoar', faixa: 3 }] })));
    expect(h.formas).toBeUndefined();
    expect(lerChave(h.chave)?.formas).toBeUndefined();
  });

  it('o atravessar gradual passa por alguns alvos; o eco gradual bate menos que o cheio', () => {
    const tiro = obter(['flecha', 'lanca_de_gelo', 'bola_de_fogo'].find((id) => resolverHabilidade(ctx, id)?.politicaImpacto === 'projetil'));
    const p = obter(resolverHabilidade(ctx, formatarChave({ id: tiro, rank: 1, caminhos: [], mods: [], formas: [{ mod: 'atravessar', faixa: 5 }] })));
    expect(p.perfura).toBe(false);
    expect(p.perfuraAlvos).toBe(2);
    const ecoDe = (faixa: number) => obter(resolverHabilidade(ctx, formatarChave({ id: tiro, rank: 1, caminhos: [], mods: [], formas: [{ mod: 'ecoar', faixa }] }))).efeitos.find((e) => e.tipo === 'efeito_atrasado')?.interno?.valor ?? 0;
    expect(ecoDe(2)).toBeLessThan(ecoDe(9));
  });

  it('o radar e as formas usam a mesma ponta', () => {
    const j = mago(60, 100, 80);
    const r = obter(radarDe(ctx, obter(j.bolsa), j.atributos, j.nivel));
    const k = r.estilos.findIndex((e) => e.id === 'artilheiro');
    expect(faixaDoArtilheiro(j)).toBe(faixaDaForma(r.total[k] ?? 0, ctx.balance.estilos.formaInicioPct / 100, ctx.balance.estilos.formaPlenaPct / 100));
  });
});
