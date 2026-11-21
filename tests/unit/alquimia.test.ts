// Marco 50 (21/11/2026, D-196): as fusões abertas. O id é a receita; a definição sai dela, igual em qualquer lado; o
// orçamento divide o poder (par 112%, par harmônico 127%, trio 130%); a transmutação pede compreensão, consome as
// partes, as runas e o material, e a fusão nasce no rank da média; as fusões fixas antigas viram abertas.
import { describe, expect, it } from 'vitest';
import { definicaoDe, resolverHabilidade } from '../../src/combat/compilar-habilidade';
import { misturar } from '../../src/combat/fusao/fundir';
import { achatar, idDaFusao, lerIdDaFusao } from '../../src/combat/fusao/receita';
import { aplicarImpacto } from '../../src/combat/golpe';
import { fonteDaHabilidade } from '../../src/combat/acao';
import { conferirPersonagem, pedidoDoPersonagem } from '../../src/coop/personagem';
import { criarEstado } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { lerComando } from '../../src/arena/protocolo';
import type { Entidade } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { compreensaoDe, fundir, montarFusao } from '../../src/progression/alquimia';
import { avancarEstudos } from '../../src/progression/habilidades-personagem';
import { semSkillsDoLegado } from '../../src/save/migracao-40';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const obter = <T,>(v: T | undefined | null): T => {
  if (v === undefined || v === null) throw new Error('ausente');
  return v;
};
const ctx = contexto(faseDeTexto(SALA_ABERTA));

function mago(conhecidas: Record<string, number>, compreensao = 100) {
  const estado = criarEstado({ semente: 3, faseId: 'teste' });
  const j = criarJogador(obter(CONTEUDO.classes.get('mago')), 'j', 3, 3, ctx.balance);
  const b = obter(j.bolsa);
  for (const [id, rank] of Object.entries(conhecidas)) {
    b.conhecidas.push({ id, rank, caminhos: [] });
    (b.compreensao ??= {})[id] = compreensao;
  }
  estado.entidades.push(j);
  return { estado, j, b, saida: [] as EventoSimulacao[] };
}
const item = (j: Entidade, invId: string, itemId: string) => obter(j.bolsa).mochila.push({ invId, itemId, qtd: 1, ref: null });

describe('a receita no id (D-196)', () => {
  it('ida e volta do id, com runas em ordem e o material', () => {
    const r = { partes: ['projetil_fogo', 'explosao_raio'], runas: ['raio', 'fogo'] as const, material: 'nucleo_igneo' };
    const id = idDaFusao({ ...r, runas: [...r.runas] });
    expect(id).toBe('f__projetil_fogo__explosao_raio__rr_fogo_raio__mm_nucleo_igneo');
    expect(lerIdDaFusao(id)).toEqual({ partes: r.partes, runas: ['fogo', 'raio'], material: 'nucleo_igneo' });
    expect(lerIdDaFusao('f__so_uma')).toBeNull();
    expect(lerIdDaFusao('f__a__b__c__d')).toBeNull();
    expect(lerIdDaFusao('f__a__rr_fogo__b')).toBeNull();
    expect(lerIdDaFusao('f__a__b__rr_nada')).toBeNull();
  });

  it('a fusão de fusão é achatada e passa de 3, não fecha', () => {
    expect(achatar(['f__projetil_fogo__explosao_raio', 'feixe_gelo'])).toEqual(['projetil_fogo', 'explosao_raio', 'feixe_gelo']);
    expect(achatar(['f__projetil_fogo__explosao_raio', 'f__feixe_gelo__nova_raio'])).toBeNull();
  });
});

describe('a definição da fusão (D-196)', () => {
  it('é a mesma em qualquer lado e vem das partes: o núcleo, a forma e o eco', () => {
    const id = 'f__projetil_fogo__chuva_gelo';
    const d = obter(definicaoDe(ctx, id));
    expect(d.fusao).toEqual(['projetil_fogo', 'chuva_gelo']);
    expect(d.base.elemento).toBe('fogo');
    // A forma da chuva: cai do céu.
    expect(d.base.entrega?.origem).toBe('ceu');
    expect(resolverHabilidade(ctx, id)?.nome).toBe(resolverHabilidade(ctx, id)?.nome);
    expect(definicaoDe(ctx, 'f__projetil_fogo__nao_existe')).toBeNull();
  });

  it('o orçamento: par 112%, par harmônico 127%, trio 130% e grau S', () => {
    const par = (a: string, b: string) => misturar(ctx, obter(lerIdDaFusao(`f__${a}__${b}`)), [a, b].map((p) => obter(definicaoDe(ctx, p))));
    const comuns = [...CONTEUDO.definicoes.values()].filter((d) => d.nucleo);
    const skillsDe = (el: string | undefined) => comuns.filter((d) => d.base.elemento === el).map((d) => d.base.id);
    // Um par harmônico com skills dos dois elementos e sem assinatura (que somaria ao orçamento).
    const h = obter([...CONTEUDO.alquimia.pares].filter(([, p]) => p.tipo === 'harmonico').flatMap(([k]) => {
      const [ea, eb] = k.split('+');
      return skillsDe(ea).flatMap((a) => skillsDe(eb).map((b) => par(a, b)));
    }).find((m) => !m.assinatura));
    expect(h.ressonante).toBe(true);
    expect(h.orcamentoPct).toBe(127);
    expect(par('projetil_fisico', 'explosao_fisico').orcamentoPct).toBe(112);
    const trio = obter(resolverHabilidade(ctx, 'f__projetil_fogo__feixe_gelo__explosao_raio'));
    expect(trio.grau).toBe('S');
    expect(trio.multDano).toBeCloseTo(1.3, 2);
  });

  it('a runa de elemento novo põe a camada dele; o material soma o efeito dele', () => {
    const sem = obter(resolverHabilidade(ctx, 'f__projetil_fisico__explosao_fisico'));
    const comRuna = obter(resolverHabilidade(ctx, 'f__projetil_fisico__explosao_fisico__rr_gelo'));
    const tipoGelo = obter(CONTEUDO.elementos.get('gelo')).estado.tipo;
    expect(sem.efeitos.some((e) => e.tipo === tipoGelo)).toBe(false);
    expect(comRuna.efeitos.some((e) => e.tipo === tipoGelo)).toBe(true);
    const comMaterial = obter(resolverHabilidade(ctx, 'f__projetil_fisico__explosao_fisico__mm_filacterio_rachado'));
    expect(comMaterial.recargaMs).toBeLessThan(sem.recargaMs);
  });
});

describe('a transmutação (D-196)', () => {
  it('consome as partes, a runa e o material e começa o estudo; a fusão nasce na média dos ranks', () => {
    const c = mago({ explosao_fisico: 3, explosao_raio: 2 });
    item(c.j, 'r1', 'runa_fogo');
    item(c.j, 'm1', 'nucleo_igneo');
    c.b.barra[2] = 'explosao_fisico';
    expect(fundir(c.estado, c.j, ctx, { partes: ['explosao_fisico', 'explosao_raio'], runas: ['r1'], material: 'm1' }, c.saida)).toBe(true);
    const id = 'f__explosao_fisico__explosao_raio__rr_fogo__mm_nucleo_igneo';
    expect(c.b.conhecidas.some((k) => k.id === 'explosao_fisico' || k.id === 'explosao_raio')).toBe(false);
    expect(c.b.barra).not.toContain('explosao_fisico');
    expect(c.b.mochila.some((i) => i.invId === 'r1' || i.invId === 'm1')).toBe(false);
    expect(c.b.estudo?.id).toBe(id);
    expect(c.b.estudo?.rank).toBe(2);
    c.b.estudo = { ...obter(c.b.estudo), restanteTicks: 1 };
    avancarEstudos(c.estado, ctx, c.saida);
    expect(c.b.conhecidas.find((k) => k.id === id)?.rank).toBe(2);
    expect(c.saida.some((e) => e.t === 'fusaoCriada')).toBe(true);
  });

  it('recusa sem compreensão, com runa demais, com skill de classe e acima de 3', () => {
    const c = mago({ projetil_fogo: 1, explosao_raio: 1, feixe_gelo: 1, nova_raio: 1 }, 100);
    obter(c.b.compreensao).explosao_raio = 60;
    expect(montarFusao(ctx, c.b, { partes: ['projetil_fogo', 'explosao_raio'], runas: [], material: null })).toBe('fusao_compreensao');
    item(c.j, 'r1', 'runa_fogo');
    item(c.j, 'r2', 'runa_gelo');
    expect(montarFusao(ctx, c.b, { partes: ['projetil_fogo', 'feixe_gelo'], runas: ['r1', 'r2'], material: null })).toBe('fusao_runa');
    const deClasse = obter(c.b.conhecidas.find((k) => !k.id.includes('_') || CONTEUDO.classes.get('mago')?.exclusivas.includes(k.id)));
    (c.b.compreensao ??= {})[deClasse.id] = 100;
    expect(montarFusao(ctx, c.b, { partes: [deClasse.id, 'projetil_fogo'], runas: [], material: null })).toBe('fusao_partes');
    c.b.conhecidas.push({ id: 'f__feixe_gelo__nova_raio', rank: 1, caminhos: [] });
    obter(c.b.compreensao)['f__feixe_gelo__nova_raio'] = 100;
    expect(montarFusao(ctx, c.b, { partes: ['f__feixe_gelo__nova_raio', 'projetil_fogo', 'nova_raio'], runas: [], material: null })).toBe('fusao_teto');
    expect(montarFusao(ctx, c.b, { partes: ['f__feixe_gelo__nova_raio', 'projetil_fogo'], runas: [], material: null })).not.toBeTypeOf('string');
  });

  it('o acerto no inimigo ensina a skill (2% na comum), e o inimigo fraco não conta', () => {
    const c = mago({ projetil_fogo: 1 }, 0);
    c.j.nivel = 20;
    const forte = criarInimigo(obter(ctx.conteudo.presets.get('goblin')), 'g', 5, 3, ctx.balance);
    forte.nivel = 15;
    forte.hp = forte.hpMax = 9999;
    const fraco = criarInimigo(obter(ctx.conteudo.presets.get('goblin')), 'f', 6, 3, ctx.balance);
    fraco.nivel = 5;
    fraco.hp = fraco.hpMax = 9999;
    c.estado.entidades.push(forte, fraco);
    const hab = obter(resolverHabilidade(ctx, 'projetil_fogo'));
    const fonte = fonteDaHabilidade(c.j, ctx, c.estado.tick, hab);
    aplicarImpacto(c.estado, ctx, forte, { acaoId: 1, fonte, hab, indice: 0 }, c.saida);
    aplicarImpacto(c.estado, ctx, fraco, { acaoId: 2, fonte, hab, indice: 0 }, c.saida);
    aplicarImpacto(c.estado, ctx, forte, { acaoId: 3, fonte, hab, indice: 1 }, c.saida);
    expect(compreensaoDe(c.b, 'projetil_fogo')).toBe(2);
  });
});

describe('a passagem e o legado (D-196)', () => {
  it('a compreensão e o rank do estudo da fusão passam por conferirPersonagem', () => {
    const c = mago({ projetil_fogo: 2 }, 40);
    c.b.estudo = { id: 'f__feixe_gelo__nova_raio', totalTicks: 100, restanteTicks: 50, aceleracoes: 0, rank: 3 };
    const nova = obter(conferirPersonagem(pedidoDoPersonagem(c.j), ctx, 'p1', 'dono')).entidade;
    expect(nova.bolsa?.compreensao).toEqual({ projetil_fogo: 40 });
    expect(nova.bolsa?.estudo?.rank).toBe(3);
  });

  it('as fusões fixas antigas viram a fusão aberta das mesmas partes', () => {
    const b = semSkillsDoLegado({ conhecidas: [{ id: 'lanca_tempestuosa', rank: 4, caminhos: [] }], barra: ['lanca_tempestuosa'], pontosHabilidade: 0 }, CONTEUDO.legadoDeSkills);
    expect(b.conhecidas).toEqual([{ id: 'f__lanca_de_gelo__raio_em_cadeia', rank: 1, caminhos: [] }]);
    for (const novo of CONTEUDO.alquimia.legado.values()) expect(definicaoDe(ctx, novo), novo).not.toBeNull();
  });

  it('o protocolo lê o comando fundir e recusa o malformado', () => {
    expect(lerComando({ t: 'fundir', partes: ['a', 'b'], runas: ['i1'], material: null })).toEqual({ t: 'fundir', partes: ['a', 'b'], runas: ['i1'], material: null });
    expect(lerComando({ t: 'fundir', partes: ['a', 'b', 'c', 'd'], runas: [], material: null })).toBeNull();
    expect(lerComando({ t: 'fundir', partes: ['a'], runas: 'x', material: null })).toBeNull();
  });
});
