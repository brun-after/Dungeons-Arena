// Marco 39 (12/11/2026, D-155): o atributo de classe saiu e a classe cresce nos estilos. Cada 5% de uma ponta (pontos e
// itens) é um degrau das melhorias de classe daquele estilo; as chaves somam entre os estilos e param no teto.
import { describe, expect, it } from 'vitest';
import { criarJogador } from '../../src/entities/fabrica';
import type { Atributos, Entidade } from '../../src/entities/entidade';
import { recalcularFicha } from '../../src/progression/derivados';
import { degrausDaPonta, fatorDeDominio, fatorDeSkillDeClasse, marcoDe, trilhaDe, valorDaMelhoria } from '../../src/progression/dominio';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const ctx = contexto(faseDeTexto(SALA_ABERTA));
function obter<T>(v: T | null | undefined): T {
  if (v === null || v === undefined) throw Error('ausente');
  return v;
}
const jogador = (classe: string) => criarJogador(obter(CONTEUDO.classes.get(classe)), 'j', 2, 5, ctx.balance);

/** Põe `pontos` acima da base da classe, nos atributos pedidos (pela ordem, um a um). */
function com(e: Entidade, nivel: number, pontos: Partial<Atributos>): Entidade {
  const bolsa = obter(e.bolsa);
  e.nivel = nivel;
  const base = obter(CONTEUDO.classes.get(bolsa.classeId)).atributos;
  bolsa.atributosBase = { ...base };
  for (const [a, n] of Object.entries(pontos) as [keyof Atributos, number][]) bolsa.atributosBase[a] = base[a] + n;
  recalcularFicha(e, ctx);
  return e;
}

describe('classe nos estilos (D-155)', () => {
  it('não há atributo de classe: os atributos são os seis', () => {
    expect(Object.keys(jogador('guerreiro').atributos).sort()).toEqual(['carisma', 'constituicao', 'destreza', 'inteligencia', 'sabedoria', 'vontade']);
  });

  it('um degrau a cada 5% da ponta', () => {
    expect(degrausDaPonta(ctx, 0.049)).toBe(0);
    expect(degrausDaPonta(ctx, 0.05)).toBe(1);
    expect(degrausDaPonta(ctx, 1)).toBe(20);
    expect(degrausDaPonta(ctx, 1.2)).toBe(24);
  });

  it('a melhoria cresce em cada degrau, do degrau em que começa', () => {
    const m = { chave: 'cadeiaPct', porDegrau: 5, desde: 4, base: 0, inteiro: false };
    expect(valorDaMelhoria(m, 3)).toBe(0);
    expect(valorDaMelhoria(m, 4)).toBe(20);
    expect(valorDaMelhoria(m, 5)).toBe(25);
    const n = { chave: 'orbes', porDegrau: 0.125, desde: 1, base: 0, inteiro: true };
    expect([valorDaMelhoria(n, 7), valorDaMelhoria(n, 8), valorDaMelhoria(n, 16)]).toEqual([0, 1, 2]);
  });

  it('no nível 1, sem pontos postos, ainda não há degrau (a inclinação não conta)', () => {
    const g = com(jogador('guerreiro'), 1, {});
    expect(trilhaDe(ctx, g).degraus).toBe(0);
    expect(fatorDeDominio(ctx, g, 'furia')).toBe(1);
  });

  it('os primeiros pontos no par do estilo já trazem a classe na direção dele', () => {
    const carniceiro = com(jogador('guerreiro'), 5, { vontade: 6, constituicao: 3 });
    expect(fatorDeDominio(ctx, carniceiro, 'furia')).toBeGreaterThan(1);
    expect(marcoDe(ctx, carniceiro, 'auraVisivel')).toBe(1);
    const comandante = com(jogador('guerreiro'), 5, { carisma: 6, constituicao: 3 });
    expect(fatorDeDominio(ctx, comandante, 'aura')).toBeGreaterThan(fatorDeDominio(ctx, carniceiro, 'aura'));
    expect(marcoDe(ctx, comandante, 'estandartePct')).toBeGreaterThan(0);
    expect(marcoDe(ctx, carniceiro, 'estandartePct')).toBe(0);
  });

  it('cada ponto a mais no estilo nunca tira melhoria e soma degraus aos poucos', () => {
    let antes = -1;
    let saltos = 0;
    for (let p = 0; p <= 60; p += 3) {
      const d = trilhaDe(ctx, com(jogador('necromante'), 40, { carisma: p, sabedoria: Math.floor(p / 2) })).degraus;
      expect(d).toBeGreaterThanOrEqual(antes);
      if (antes >= 0) saltos = Math.max(saltos, d - antes);
      antes = d;
    }
    // Linear: nenhum salto grande entre um passo de 3 pontos e o próximo.
    expect(saltos).toBeLessThanOrEqual(6);
  });

  it('o generalista também tem classe: as skills de classe crescem com os degraus de todas as pontas', () => {
    const m = jogador('mago');
    const exclusiva = obter(obter(CONTEUDO.classes.get('mago')).exclusivas[0]);
    const dirigido = com(jogador('mago'), 30, { inteligencia: 58, destreza: 29 });
    const generalista = com(m, 30, { vontade: 15, destreza: 15, constituicao: 15, inteligencia: 14, sabedoria: 14, carisma: 14 });
    const fd = fatorDeSkillDeClasse(ctx, dirigido, exclusiva);
    const fg = fatorDeSkillDeClasse(ctx, generalista, exclusiva);
    expect(fg).toBeGreaterThan(1);
    expect(fg).toBeGreaterThan(1 + (fd - 1) * 0.5);
  });

  it('as chaves param no teto', () => {
    const g = com(jogador('guerreiro'), 100, { vontade: 90, constituicao: 90, destreza: 90, inteligencia: 90, sabedoria: 90, carisma: 90 });
    const t = trilhaDe(ctx, g);
    for (const [c, v] of Object.entries(t.chaves)) {
      const teto = ctx.balance.dominio.tetos[c];
      if (teto !== undefined) expect(v).toBeLessThanOrEqual(teto);
    }
  });

  it('a trilha vai publicada na entidade, e sem a arma da classe os marcos travam', () => {
    const g = com(jogador('guerreiro'), 30, { vontade: 30, constituicao: 15 });
    expect(g.trilhaClasse?.degraus).toBe(trilhaDe(ctx, g).degraus);
    const bolsa = obter(g.bolsa);
    bolsa.equipamento.arma_principal = null;
    bolsa.equipamento.arma_secundaria = null;
    recalcularFicha(g, ctx);
    expect(marcoDe(ctx, g, 'auraVisivel')).toBe(0);
    const fator = fatorDeDominio(ctx, g, 'furia');
    expect(fator).toBeGreaterThan(1);
    expect(fator - 1).toBeCloseTo(((trilhaDe(ctx, g).chaves.furia ?? 0) * ctx.balance.dominio.semFamiliaridadePct) / 10000);
  });
});
