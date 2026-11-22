// Marco 53 (22/11/2026, D-203): os consertos do conforto (a loja que some, a lápide recolhida, a venda em quantidade).
import { describe, expect, it } from 'vitest';
import { modoPorId } from '../../src/core/conteudo';
import type { ContextoSimulacao } from '../../src/core/contexto';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { criarJogador } from '../../src/entities/fabrica';
import { lerLugar, montarLugar } from '../../src/mundo/lugares';
import { MODO_MUNDO } from '../../src/mundo/sala-mundo';
import { conferirVilaANoite, REF_NOTURNO } from '../../src/mundo/vila-noite';
import { vender } from '../../src/progression/loja';
import { conferirLapide, criarOrientacaoMundo, esquecerLapide, marcarLapide } from '../../src/ui/orientacao-mundo';
import { processarInteracoes } from '../../src/world/interacao';
import { CONTEUDO } from '../apoio/fases';

function vila(noite: number) {
  const reino = CONTEUDO.reinos.get('reino_central');
  if (!reino) throw new Error('reino');
  const lugar = lerLugar(reino, 'regiao:vila_do_centro');
  if (lugar?.tipo !== 'regiao' || !lugar.regiao.vila) throw new Error('lugar');
  const m = montarLugar(CONTEUDO, reino, lugar, modoPorId(CONTEUDO, MODO_MUNDO));
  const ctx: ContextoSimulacao = { ...m.ctx, modo: { ...m.ctx.modo, noite, escuro: noite } };
  return { ctx, estado: m.estado, regiao: lugar.regiao };
}

describe('marco 53: conforto (D-203)', () => {
  it('quem compra do vendedor da noite não fica preso quando ele vai embora ao clarear', () => {
    const { ctx, estado, regiao } = vila(1);
    conferirVilaANoite(estado, ctx, regiao);
    const vendedor = estado.objetos.find((o) => o.ref === REF_NOTURNO);
    const classe = CONTEUDO.classes.get('guerreiro');
    if (!vendedor || !classe) throw new Error('vendedor');
    const eu = criarJogador(classe, 'p1', vendedor.x, vendedor.y + 1, ctx.balance);
    estado.entidades.push(eu);
    const saida: EventoSimulacao[] = [];
    eu.interacao = { tipo: 'loja', objetoId: vendedor.objetoId, ateTick: Number.MAX_SAFE_INTEGER };
    const dia = { ...ctx, modo: { ...ctx.modo, noite: 0, escuro: 0 } };
    conferirVilaANoite(estado, dia, regiao);
    processarInteracoes(estado, dia, saida);
    expect(eu.interacao).toBeNull();
    expect(saida.some((e) => e.t === 'lojaFechada')).toBe(true);
  });

  it('a venda leva a quantidade pedida da pilha, nunca mais do que ela tem', () => {
    const { ctx, estado, regiao } = vila(1);
    conferirVilaANoite(estado, ctx, regiao);
    const vendedor = estado.objetos.find((o) => o.ref === REF_NOTURNO);
    const classe = CONTEUDO.classes.get('guerreiro');
    if (!vendedor || !classe) throw new Error('vendedor');
    const eu = criarJogador(classe, 'p1', vendedor.x, vendedor.y + 1, ctx.balance);
    estado.entidades.push(eu);
    const saida: EventoSimulacao[] = [];
    eu.interacao = { tipo: 'loja', objetoId: vendedor.objetoId, ateTick: Number.MAX_SAFE_INTEGER };
    const bolsa = eu.bolsa;
    if (!bolsa) throw new Error('bolsa');
    bolsa.mochila = [{ invId: 'x1', itemId: 'lenha', qtd: 5, ref: null }];
    const antes = bolsa.ouro;
    vender(estado, ctx, eu, 'x1', saida, 3);
    expect(bolsa.mochila[0]?.qtd).toBe(2);
    const pagoPor3 = bolsa.ouro - antes;
    vender(estado, ctx, eu, 'x1', saida, 99);
    expect(bolsa.mochila).toHaveLength(0);
    expect(bolsa.ouro - antes).toBe((pagoPor3 / 3) * 5);
  });

  it('a lápide sai da rota quando é recolhida ou quando o prazo vence', () => {
    const guia = criarOrientacaoMundo();
    marcarLapide(guia, 'regiao:x', { x: 3, y: 4 }, 5, 0);
    expect(guia.destino?.ponto).toEqual({ x: 3, y: 4 });
    esquecerLapide(guia);
    expect(guia.lapide).toBeNull();
    expect(guia.destino).toBeNull();
    marcarLapide(guia, 'regiao:x', { x: 3, y: 4 }, 5, 0);
    conferirLapide(guia, 4 * 60_000);
    expect(guia.destino).not.toBeNull();
    conferirLapide(guia, 5 * 60_000);
    expect(guia.destino).toBeNull();
    // Outro destino escolhido depois da morte continua de pé.
    marcarLapide(guia, 'regiao:x', { x: 3, y: 4 }, 5, 0);
    guia.definir({ lugar: 'regiao:y', nome: 'outro' });
    esquecerLapide(guia);
    expect(guia.destino?.nome).toBe('outro');
  });
});
