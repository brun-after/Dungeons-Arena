// Marco 52 (21/11/2026, D-198): os níveis de raridade da fusão. O nível fecha o id (`__g2`, `__g1`; sem ele, o 3º, o
// comum); o 2º e o 1º sobem o dano, a cura e a força dos estados; a Inteligência sobe a chance, sem zerar a do 1º com
// pouca; as partes ficam liberadas para aprender de novo, e refazer a mesma fórmula só fica se sair melhor.
import { describe, expect, it } from 'vitest';
import { resolverHabilidade } from '../../src/combat/compilar-habilidade';
import { formulaDaFusao, idDaFusao, lerIdDaFusao, raridadeDaFusao } from '../../src/combat/fusao/receita';
import { criarEstado } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { criarRng } from '../../src/core/rng';
import { criarJogador } from '../../src/entities/fabrica';
import { fundir, montarFusao } from '../../src/progression/alquimia';
import { chancesDeRaridade, sortearRaridade, substituirFusaoAntiga, tentativasDaFormula } from '../../src/progression/fusao-raridade';
import { avancarEstudos, subirRank } from '../../src/progression/habilidades-personagem';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const obter = <T,>(v: T | undefined | null): T => {
  if (v === undefined || v === null) throw new Error('ausente');
  return v;
};
const ctx = contexto(faseDeTexto(SALA_ABERTA));
const r = ctx.balance.alquimia;
const BASE = 'f__explosao_fisico__explosao_raio';

function mago(conhecidas: Record<string, number>, semente = 3, inteligencia = 10) {
  const estado = criarEstado({ semente, faseId: 'teste' });
  const j = criarJogador(obter(CONTEUDO.classes.get('mago')), 'j', 3, 3, ctx.balance);
  j.atributos.inteligencia = inteligencia;
  const b = obter(j.bolsa);
  for (const [id, rank] of Object.entries(conhecidas)) {
    b.conhecidas.push({ id, rank, caminhos: [] });
    (b.compreensao ??= {})[id] = 100;
  }
  estado.entidades.push(j);
  return { estado, j, b, saida: [] as EventoSimulacao[] };
}

describe('o nível no id (D-198)', () => {
  it('ida e volta; sem o sufixo é o 3º nível; a fórmula ignora o nível', () => {
    const id = idDaFusao({ partes: ['explosao_fisico', 'explosao_raio'], runas: ['fogo'], material: null, raridade: 1 });
    expect(id).toBe('f__explosao_fisico__explosao_raio__rr_fogo__g1');
    expect(lerIdDaFusao(id)?.raridade).toBe(1);
    expect(raridadeDaFusao(BASE)).toBe(3);
    expect(idDaFusao({ partes: ['a', 'b'], runas: [], material: null, raridade: 3 })).toBe('f__a__b');
    expect(formulaDaFusao(`${BASE}__g2`)).toBe(BASE);
    expect(lerIdDaFusao(`${BASE}__g2__g1`)).toBeNull();
    expect(lerIdDaFusao(`f__a__g1__b`)).toBeNull();
  });
});

describe('o bônus do nível (D-198)', () => {
  it('o 2º e o 1º sobem o dano e a força dos estados; o nome e o visual sabem o nível', () => {
    const comum = obter(resolverHabilidade(ctx, BASE));
    const segundo = obter(resolverHabilidade(ctx, `${BASE}__g2`));
    const primeiro = obter(resolverHabilidade(ctx, `${BASE}__g1`));
    expect(segundo.multDano / comum.multDano).toBeCloseTo(1 + r.raridade.segundo.bonusPct / 100, 5);
    expect(primeiro.multDano / comum.multDano).toBeCloseTo(1 + r.raridade.primeiro.bonusPct / 100, 5);
    const forte = comum.efeitos.find((e) => e.valor > 0);
    if (forte) expect(obter(primeiro.efeitos.find((e) => e.tipo === forte.tipo)).valor).toBeGreaterThanOrEqual(forte.valor);
    expect(primeiro.recargaMs).toBe(comum.recargaMs);
    expect(comum.raridadeFusao).toBeUndefined();
    expect(primeiro.raridadeFusao).toBe(1);
    expect(primeiro.nome).toContain('1º nível');
  });
});

describe('a chance pela Inteligência (D-198)', () => {
  it('com pouca Inteligência, a base (nunca zero no 1º); com muita, sobe até o teto', () => {
    const pouca = chancesDeRaridade(r, { inteligencia: 3 });
    expect(pouca[1]).toBe(r.raridade.primeiro.chancePct);
    expect(pouca[1]).toBeGreaterThan(0);
    expect(pouca[1] + pouca[2] + pouca[3]).toBeCloseTo(100, 5);
    const media = chancesDeRaridade(r, { inteligencia: 40 });
    expect(media[1]).toBeGreaterThan(pouca[1]);
    expect(media[2]).toBeGreaterThan(pouca[2]);
    const muita = chancesDeRaridade(r, { inteligencia: 500 });
    expect(muita[1]).toBe(r.raridade.primeiro.maxPct);
    expect(muita[2]).toBe(r.raridade.segundo.maxPct);
  });

  it('o sorteio segue as chances', () => {
    const rng = criarRng(11);
    const ch = chancesDeRaridade(r, { inteligencia: 10 });
    const n = { 1: 0, 2: 0, 3: 0 };
    for (let i = 0; i < 4000; i++) n[sortearRaridade(rng, ch)]++;
    expect(n[1] / 40).toBeGreaterThan(ch[1] - 2);
    expect(n[1] / 40).toBeLessThan(ch[1] + 2);
    expect(n[3]).toBeGreaterThan(n[2]);
  });
});

describe('refazer a mesma fórmula (D-198)', () => {
  it('as partes consumidas ficam liberadas para aprender de novo', () => {
    const c = mago({ explosao_fisico: 1, explosao_raio: 1 });
    expect(fundir(c.estado, c.j, ctx, { partes: ['explosao_fisico', 'explosao_raio'], runas: [], material: null }, c.saida)).toBe(true);
    expect(c.b.liberadas).toEqual(expect.arrayContaining(['explosao_fisico', 'explosao_raio']));
  });

  it('com a fórmula já conhecida, nunca piora: ou melhora (e toma o lugar ao fim do estudo) ou fica como estava', () => {
    let melhorou = 0;
    let igual = 0;
    for (let s = 1; s <= 40; s++) {
      const c = mago({ explosao_fisico: 1, explosao_raio: 1 }, s);
      c.b.conhecidas.push({ id: BASE, rank: 3, caminhos: [] });
      c.b.barra[3] = BASE;
      expect(fundir(c.estado, c.j, ctx, { partes: ['explosao_fisico', 'explosao_raio'], runas: [], material: null }, c.saida)).toBe(true);
      const ev = c.saida.find((e) => e.t === 'fusaoCriada');
      if (ev?.t !== 'fusaoCriada') throw new Error('sem evento');
      if (!ev.melhorou) {
        igual++;
        expect(ev.raridade).toBe(3);
        expect(c.b.estudo).toBeNull();
        expect(c.b.conhecidas.some((k) => k.id === BASE)).toBe(true);
        continue;
      }
      melhorou++;
      expect(ev.raridade).toBeLessThan(3);
      c.b.estudo = { ...obter(c.b.estudo), restanteTicks: 1 };
      avancarEstudos(c.estado, ctx, c.saida);
      const nova = obter(c.b.conhecidas.find((k) => k.id === ev.habilidadeId));
      expect(nova.rank).toBe(3);
      expect(c.b.conhecidas.some((k) => k.id === BASE)).toBe(false);
      expect(c.b.barra[3]).toBe(ev.habilidadeId);
    }
    expect(melhorou).toBeGreaterThan(0);
    expect(igual).toBeGreaterThan(0);
  });

  it('no 1º nível a fórmula está no teto', () => {
    const c = mago({ explosao_fisico: 1, explosao_raio: 1 });
    c.b.conhecidas.push({ id: `${BASE}__g1`, rank: 1, caminhos: [] });
    expect(montarFusao(ctx, c.b, { partes: ['explosao_fisico', 'explosao_raio'], runas: [], material: null })).toBe('fusao_maxima');
  });

  it('a substituição leva a compreensão e a tecla', () => {
    const c = mago({});
    c.b.conhecidas.push({ id: BASE, rank: 2, caminhos: [] });
    c.b.barra[2] = BASE;
    c.b.compreensao = { [BASE]: 40 };
    expect(substituirFusaoAntiga(c.b, `${BASE}__g2`, 1)).toBe(2);
    expect(c.b.barra[2]).toBe(`${BASE}__g2`);
    expect(c.b.compreensao[`${BASE}__g2`]).toBe(40);
    expect(c.b.compreensao[BASE]).toBeUndefined();
  });
});

describe('reaprender e tentar de novo (D-198)', () => {
  it('a skill consumida volta sem ponto e sem estudo, com a compreensão adiantada 20% por vez, até nascer compreendida', () => {
    const c = mago({ explosao_fisico: 1, explosao_raio: 1 });
    c.b.pontosHabilidade = 0;
    expect(fundir(c.estado, c.j, ctx, { partes: ['explosao_fisico', 'explosao_raio'], runas: [], material: null }, c.saida)).toBe(true);
    expect(c.b.consumidas?.explosao_fisico).toBe(1);
    // Mesmo com o estudo da fusão em curso e sem ponto.
    expect(subirRank(c.j, ctx, 'explosao_fisico', undefined, c.estado.tick, c.saida)).toBe(true);
    expect(c.b.conhecidas.find((k) => k.id === 'explosao_fisico')?.rank).toBe(1);
    expect(c.b.pontosHabilidade).toBe(0);
    expect(c.b.compreensao?.explosao_fisico).toBe(r.reaprender.compreensaoPorVezPct);
    c.b.consumidas = { ...c.b.consumidas, explosao_raio: 5 };
    expect(subirRank(c.j, ctx, 'explosao_raio', undefined, c.estado.tick, c.saida)).toBe(true);
    expect(c.b.compreensao?.explosao_raio).toBe(100);
  });

  it('cada tentativa da mesma fórmula sobe a chance do 2º e do 1º nível, até o teto', () => {
    const zero = chancesDeRaridade(r, { inteligencia: 10 }, 0);
    const tres = chancesDeRaridade(r, { inteligencia: 10 }, 3);
    expect(tres[1]).toBeCloseTo(zero[1] + 3 * r.raridade.tentativa.primeiroPct, 5);
    expect(tres[2]).toBeCloseTo(zero[2] + 3 * r.raridade.tentativa.segundoPct, 5);
    const muitas = chancesDeRaridade(r, { inteligencia: 10 }, 100);
    expect(muitas[1]).toBe(r.raridade.tentativa.primeiroTetoPct);
    expect(muitas[1] + muitas[2] + muitas[3]).toBeCloseTo(100, 5);
    const c = mago({ explosao_fisico: 1, explosao_raio: 1 });
    fundir(c.estado, c.j, ctx, { partes: ['explosao_fisico', 'explosao_raio'], runas: [], material: null }, c.saida);
    expect(tentativasDaFormula(c.b, `${BASE}__g1`)).toBe(1);
  });

  it('um resultado inferior (ou igual) nunca toma o lugar do superior', () => {
    const c = mago({});
    c.b.conhecidas.push({ id: `${BASE}__g1`, rank: 2, caminhos: [] });
    expect(substituirFusaoAntiga(c.b, `${BASE}__g2`, 4)).toBe('descartada');
    expect(substituirFusaoAntiga(c.b, BASE, 4)).toBe('descartada');
    expect(c.b.conhecidas.map((k) => k.id).filter((id) => id.startsWith('f__'))).toEqual([`${BASE}__g1`]);
    // Nem quando um estudo de nível pior termina.
    c.b.estudo = { id: `${BASE}__g2`, totalTicks: 1, restanteTicks: 1, aceleracoes: 0, velocidade12: 12, fracao12: 0 };
    avancarEstudos(c.estado, ctx, c.saida);
    expect(c.b.conhecidas.map((k) => k.id).filter((id) => id.startsWith('f__'))).toEqual([`${BASE}__g1`]);
  });
});
