// Marco 14 (14/10/2026), D-059: as peças puras do sistema de habilidades — chave, compilador, orçamento de poder,
// habilidades geradas por semente e formas de área.

import { describe, expect, it } from 'vitest';
import { codigoDaGerada, formatarChave, idGerada, lerChave, lerIdGerada } from '../../src/combat/chave-habilidade';
import { definicaoDe, resolverHabilidade } from '../../src/combat/compilar-habilidade';
import { ELEMENTOS_DO_GERADOR } from '../../src/combat/elementos';
import { bresenham, celulasDaForma, celulasDaLinha, celulasDoCone } from '../../src/combat/formas';
import type { Habilidade } from '../../src/combat/habilidades';
import { orcamentoNoNivel, poderDaHabilidade } from '../../src/combat/orcamento';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import skillsJson from '../../src/data/skills.json';
import { CONTEUDO, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const CTX = { conteudo: CONTEUDO, balance: BALANCE_PADRAO };
const LEGADAS = ['ataque_basico', 'seta_arcana', 'explosao', 'curar', 'golpe_atordoante', 'golpe', 'raio', 'flecha', 'marca_de_area', 'golpe_demoniaco', 'teia', 'golpe_viscoso', 'golpe_pesado', 'raio_vampirico', 'invocar_lacaios', 'armar_teia'];

function obter<T>(v: T | undefined | null, nome: string): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}
const hab = (chave: string): Habilidade => obter(resolverHabilidade(CTX, chave), chave);

describe('chave de habilidade', () => {
  it('ida e volta, com modificadores em ordem e sem repetição', () => {
    const partes = { id: 'bola_de_fogo', rank: 4, caminhos: ['amplo', 'eco'], mods: ['ecoar', 'atravessar', 'ecoar'] as const };
    const chave = formatarChave({ ...partes, mods: [...partes.mods] });
    expect(chave).toBe('bola_de_fogo@4/amplo,eco+atravessar,ecoar');
    expect(lerChave(chave)).toEqual({ id: 'bola_de_fogo', rank: 4, caminhos: ['amplo', 'eco'], mods: ['atravessar', 'ecoar'] });
    expect(formatarChave({ id: 'golpe', rank: 1, caminhos: [], mods: [] })).toBe('golpe');
    expect(lerChave('golpe')).toEqual({ id: 'golpe', rank: 1, caminhos: [], mods: [] });
    expect(lerChave('Golpe!')).toBeNull();
    expect(lerChave('golpe+voar')).toBeNull();
  });

  it('o id gerado carrega a semente e o nível; o código curto serve para compartilhar', () => {
    const id = idGerada(123_456_789, 7);
    expect(lerIdGerada(id)).toEqual({ semente: 123_456_789, nivel: 7 });
    expect(codigoDaGerada(id)).toBe(`${(123_456_789).toString(36).toUpperCase()}-7`);
    expect(lerIdGerada('g_zz_0')).toBeNull();
    expect(codigoDaGerada('golpe')).toBeNull();
  });
});

describe('compilador (D-059)', () => {
  it('as 16 habilidades de antes, no rank 1, são as mesmas do skills.json', () => {
    const brutas = new Map(skillsJson.habilidades.map((h) => [h.id, h]));
    for (const id of LEGADAS) {
      const h = hab(id);
      const b = obter(brutas.get(id), id);
      expect({ formula: h.formulaDano, cura: h.formulaCura, alcance: h.alcanceCelulas, raio: h.raioArea, area: h.tipoArea, custo: h.custoRecurso, recarga: h.recargaMs, conj: h.conjuracaoMs, alvo: h.politicaAlvo, impacto: h.politicaImpacto }, id).toEqual({
        formula: b.formulaDano,
        cura: b.formulaCura,
        alcance: b.alcanceCelulas,
        raio: b.raioArea,
        area: b.tipoArea,
        custo: b.custoRecurso,
        recarga: b.recargaMs,
        conj: b.conjuracaoMs,
        alvo: b.politicaAlvo,
        impacto: b.politicaImpacto,
      });
      expect([h.rank, h.multDano, h.multCura, h.perfura, h.saltos, h.custoVida], id).toEqual([1, 1, 1, false, null, 0]);
      expect(h.efeitos.length, id).toBe(obter(CONTEUDO.definicoes.get(id), id).base.efeitos.length);
    }
  });

  it('o rank escala dano e efeitos; os caminhos mexem nas camadas', () => {
    const r1 = hab('bola_de_fogo');
    const r3 = hab('bola_de_fogo@3/amplo');
    expect(r3.multDano).toBeCloseTo(1.3 * 1.25, 9);
    expect(r3.raioArea).toBe(r1.raioArea + 1);
    expect(r3.conjuracaoMs).toBe(Math.round(r1.conjuracaoMs * 1.5));
    const queima = (h: Habilidade) => obter(h.efeitos.find((e) => e.tipo === 'queimando'), 'queimando');
    expect(queima(r3).duracaoMs).toBeGreaterThan(queima(r1).duracaoMs);
    expect(queima(r3).valor).toBeGreaterThanOrEqual(queima(r1).valor);
    const brutal = hab('bola_de_fogo@3/eficiente');
    expect(brutal.custoRecurso).toBe(Math.round(r1.custoRecurso * 0.7));
    expect(brutal.recargaMs).toBe(Math.round(r1.recargaMs * 0.8));
    // O elemento acrescenta o estado; o caminho elemental troca o elemento.
    expect(r1.elemento).toBe('fogo');
    expect(hab('explosao@5/amplo,elemental_gelo').elemento).toBe('gelo');
    expect(hab('explosao@5/amplo,elemental_gelo').efeitos.map((e) => e.tipo)).toContain('resfriado');
  });

  it('modificadores: os que não combinam são ignorados e saem da chave compilada', () => {
    expect(hab('seta_arcana+maior_e_mais_lenta').chave).toBe('seta_arcana');
    expect(hab('seta_arcana+atravessar').perfura).toBe(true);
    expect(hab('raio_em_cadeia').saltos).toEqual({ quantidade: 2, raio: 3, pct: 50 });
    const eco = hab('seta_arcana+ecoar').efeitos.find((e) => e.tipo === 'efeito_atrasado');
    expect(eco?.interno?.tipo).toBe('dano_direto');
    expect(hab('curar+ecoar').efeitos.some((e) => e.tipo === 'efeito_atrasado')).toBe(false);
  });

  it('resolver é memoizado; chave inválida ou id desconhecido dão undefined', () => {
    expect(resolverHabilidade(CTX, 'explosao@2')).toBe(resolverHabilidade(CTX, 'explosao@2'));
    expect(resolverHabilidade(CTX, 'nao_existe')).toBeUndefined();
    expect(resolverHabilidade(CTX, '???')).toBeUndefined();
  });
});

describe('orçamento de poder', () => {
  it('cresce com o nível e o modo escala o total', () => {
    const r = BALANCE_PADRAO.orcamento;
    for (let n = 1; n < 20; n++) expect(orcamentoNoNivel(n + 1, r)).toBeGreaterThan(orcamentoNoNivel(n, r));
    expect(orcamentoNoNivel(5, r, 50)).toBeCloseTo(orcamentoNoNivel(5, r) / 2, 9);
  });

  it('o catálogo do jogador passa em todo rank e caminho (o leitor de conteúdo confere)', () => {
    // A conferência roda na carga; aqui, um caso que passaria do limite é recusado pela mesma conta.
    const forte = { ...hab('explosao'), formulaDano: '20d10' };
    expect(poderDaHabilidade(forte, BALANCE_PADRAO.orcamento)).toBeGreaterThan(orcamentoNoNivel(20, BALANCE_PADRAO.orcamento));
  });
});

describe('habilidades geradas por semente', () => {
  const sementes = Array.from({ length: 300 }, (_, i) => (i * 2_654_435_761) >>> 0);

  it('a mesma semente dá a mesma habilidade, e cabe no orçamento das geradas no nível', () => {
    for (const nivel of [1, 5, 10, 20]) {
      const limite = orcamentoNoNivel(nivel, BALANCE_PADRAO.orcamento, BALANCE_PADRAO.orcamento.geradaPct);
      for (const s of sementes.slice(0, 120)) {
        const id = idGerada(s, nivel);
        const h = hab(id);
        expect(definicaoDe(CTX, id)).toBe(definicaoDe(CTX, id));
        expect(poderDaHabilidade(h, BALANCE_PADRAO.orcamento), id).toBeLessThanOrEqual(limite + 1e-9);
        expect(h.politicaAlvo).toBe('hostil');
        expect(h.tags).toContain('gerada');
      }
    }
  });

  it('cobre os 5 elementos do gerador e as 6 formas, com nome e visual do tema', () => {
    const elementos = new Set<string>();
    const formas = new Set<string>();
    for (const s of sementes) {
      const h = hab(idGerada(s, 8));
      elementos.add(h.elemento ?? '');
      formas.add(h.politicaImpacto === 'area' ? h.tipoArea : h.politicaImpacto);
      expect(h.nome.length).toBeGreaterThan(3);
      expect(h.visual?.cor).toBe(CONTEUDO.elementos.get(h.elemento ?? 'fogo')?.cor);
    }
    // Marco 18: o gerador fica nos 5 elementos do marco 14 (as habilidades geradas dos saves não mudam).
    expect([...elementos].sort()).toEqual([...ELEMENTOS_DO_GERADOR].sort());
    expect([...formas].sort()).toEqual(['ao_redor', 'cone', 'contato', 'linha', 'projetil', 'quadrado']);
  });

  it('tem 2 caminhos por degrau de evolução, válidos para a forma', () => {
    for (const s of sementes.slice(0, 50)) {
      const def = obter(definicaoDe(CTX, idGerada(s, 6)), 'definição');
      for (const rank of [3, 5]) {
        const caminhos = def.evolucoes[rank] ?? [];
        expect(caminhos).toHaveLength(2);
        for (const c of caminhos) expect(CONTEUDO.caminhos.has(c)).toBe(true);
      }
    }
  });
});

describe('formas de área', () => {
  const fase = faseDeTexto(SALA_ABERTA);

  it('Bresenham anda célula a célula; a linha estende até o alcance e para na parede', () => {
    expect(bresenham({ x: 0, y: 0 }, { x: 3, y: 1 })).toEqual([{ x: 1, y: 0 }, { x: 2, y: 1 }, { x: 3, y: 1 }]);
    expect(celulasDaLinha({ x: 5, y: 5 }, { x: 6, y: 5 }, 3, fase)).toEqual([{ x: 6, y: 5 }, { x: 7, y: 5 }, { x: 8, y: 5 }]);
    // Da coluna 8, em direção à parede (coluna 11): para antes dela.
    expect(celulasDaLinha({ x: 8, y: 5 }, { x: 9, y: 5 }, 6, fase).map((c) => c.x)).toEqual([9, 10]);
  });

  it('cone de 90°: simétrico ao eixo e nada atrás de quem conjura', () => {
    const cone = celulasDoCone({ x: 5, y: 5 }, { x: 8, y: 5 }, 3);
    expect(cone.every((c) => c.x > 5)).toBe(true);
    const chave = (c: { x: number; y: number }) => `${c.x},${c.y}`;
    const conjunto = new Set(cone.map(chave));
    for (const c of cone) expect(conjunto.has(chave({ x: c.x, y: 10 - c.y }))).toBe(true);
    expect(conjunto.has('6,5')).toBe(true);
    expect(conjunto.has('6,7')).toBe(false);
  });

  it('ao redor: em volta de quem conjura, sem ele (os aliados incluem o próprio)', () => {
    const redemoinho = hab('redemoinho');
    const celulas = celulasDaForma(redemoinho, { x: 5, y: 5 }, { x: 5, y: 5 }, fase);
    expect(celulas).toHaveLength(8);
    expect(celulas.some((c) => c.x === 5 && c.y === 5)).toBe(false);
    expect(celulasDaForma(hab('brado'), { x: 5, y: 5 }, { x: 5, y: 5 }, fase).some((c) => c.x === 5 && c.y === 5)).toBe(true);
  });
});
