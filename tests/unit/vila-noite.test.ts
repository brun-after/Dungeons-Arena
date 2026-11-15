// Marco 44 (15/11/2026, D-178): a vila pela hora: lojas do dia fechadas, o vendedor da noite e os portões fechados.
import { describe, expect, it } from 'vitest';
import { modoPorId } from '../../src/core/conteudo';
import type { ContextoSimulacao } from '../../src/core/contexto';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { lerLugar, montarLugar } from '../../src/mundo/lugares';
import { MODO_MUNDO } from '../../src/mundo/sala-mundo';
import { conferirVilaANoite, lojaFechadaANoite, REF_NOTURNO } from '../../src/mundo/vila-noite';
import { podePisarNoRefugio, refugioProtege } from '../../src/world/refugio';
import { CONTEUDO } from '../apoio/fases';

function vila(noite: number) {
  const reino = CONTEUDO.reinos.get('reino_central');
  if (!reino) throw new Error('reino');
  const lugar = lerLugar(reino, 'regiao:vila_do_centro');
  if (lugar?.tipo !== 'regiao' || !lugar.regiao.vila) throw new Error('lugar');
  const m = montarLugar(CONTEUDO, reino, lugar, modoPorId(CONTEUDO, MODO_MUNDO));
  const ctx: ContextoSimulacao = { ...m.ctx, modo: { ...m.ctx.modo, noite, escuro: noite } };
  return { ctx, estado: m.estado, regiao: lugar.regiao, centro: lugar.regiao.vila };
}

describe('a vila pela hora (D-178)', () => {
  it('à noite, o ferreiro, o alquimista e o mercado fecham; o vendedor da noite chega e vai embora ao clarear', () => {
    const { ctx, estado, regiao } = vila(1);
    const lojas = estado.objetos.filter((o) => o.tipo === 'loja' && o.ref && ctx.balance.mundo.vilaNoite.fecham.includes(o.ref));
    expect(lojas.length).toBeGreaterThan(0);
    expect(lojas.every((o) => lojaFechadaANoite(ctx, o))).toBe(true);
    conferirVilaANoite(estado, ctx, regiao);
    const vendedor = estado.objetos.find((o) => o.ref === REF_NOTURNO);
    expect(vendedor?.itens).toContain('lenha');
    expect(lojaFechadaANoite(ctx, vendedor ?? { tipo: 'loja', ref: null })).toBe(false);
    const dia = { ...ctx, modo: { ...ctx.modo, noite: 0, escuro: 0 } };
    expect(lojas.some((o) => lojaFechadaANoite(dia, o))).toBe(false);
    conferirVilaANoite(estado, dia, regiao);
    expect(estado.objetos.some((o) => o.ref === REF_NOTURNO)).toBe(false);
  });

  it('à noite, os portões fecham: o monstro em combate não entra nem fere quem está dentro', () => {
    const { ctx, estado, centro } = vila(1);
    const classe = CONTEUDO.classes.get('guerreiro');
    const lobo = CONTEUDO.presets.get('lobo');
    if (!classe || !lobo) throw new Error('conteudo');
    const eu = criarJogador(classe, 'p1', centro.x, centro.y, ctx.balance);
    const m = criarInimigo(lobo, 'm', centro.x + centro.raio + 1, centro.y, ctx.balance);
    estado.entidades = [eu, m];
    m.participacao.push({ id: eu.id, tick: estado.tick });
    m.ia = { alvoId: eu.id } as typeof m.ia;
    const dia = { ...ctx, modo: { ...ctx.modo, noite: 0, escuro: 0 } };
    expect(refugioProtege(estado, dia, m, eu)).toBe(false);
    expect(podePisarNoRefugio(estado, dia, m, centro.x + centro.raio - 1, centro.y)).toBe(true);
    expect(refugioProtege(estado, ctx, m, eu)).toBe(true);
    expect(podePisarNoRefugio(estado, ctx, m, centro.x + centro.raio - 1, centro.y)).toBe(false);
  });
});
