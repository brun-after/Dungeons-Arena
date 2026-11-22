// Marco 53 (22/11/2026, D-203): os consertos do conforto (a loja que some, a lápide recolhida, a venda em quantidade).
import { describe, expect, it } from 'vitest';
import { modoPorId } from '../../src/core/conteudo';
import type { ContextoSimulacao } from '../../src/core/contexto';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { criarJogador } from '../../src/entities/fabrica';
import { lerLugar, montarLugar } from '../../src/mundo/lugares';
import { MODO_MUNDO } from '../../src/mundo/sala-mundo';
import { conferirVilaANoite, fatorDaNoite, REF_NOTURNO } from '../../src/mundo/vila-noite';
import { desfazerVenda, vender } from '../../src/progression/loja';
import { conferirLapide, criarOrientacaoMundo, esquecerLapide, marcarLapide } from '../../src/ui/orientacao-mundo';
import { fecharLoja, processarInteracoes } from '../../src/world/interacao';
import { CONTEUDO, faseDeTexto } from '../apoio/fases';
import type { Comando } from '../../src/core/comandos';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { criarEstado } from '../../src/core/estado';
import type { FichaDoMundo } from '../../src/mundo/ficha-mundo';
import { ondeRenascer } from '../../src/mundo/renascer';
import { velocidadeDaBorda, zoomDaRoda } from '../../src/input/ponteiro';
import { celulaLivrePerto, criarCondutor } from '../../src/ui/condutor';
import { objetoClicado } from '../../src/ui/clique-objeto';
import { novoObjeto } from '../../src/world/objeto-novo';
import { chefesNovos } from '../../src/ui/anuncio-chefe';
import { criarInimigo } from '../../src/entities/fabrica';

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

describe('marco 53: o condutor, o clique, o renascer, a noite e a roda (D-203)', () => {
  it('o condutor manda trechos de irPara até o ponto e desliga quando o jogador anda', () => {
    const fase = faseDeTexto(Array.from({ length: 120 }, () => '.'.repeat(120)));
    const cmds: Comando[] = [];
    const c = criarCondutor(() => fase, (cmd) => cmds.push(cmd));
    const classe = CONTEUDO.classes.get('guerreiro');
    if (!classe) throw new Error('classe');
    const estado = criarEstado({ semente: 1, faseId: fase.id });
    const eu = criarJogador(classe, 'p1', 5, 5, BALANCE_PADRAO);
    estado.entidades.push(eu);
    c.conduzir({ tipo: 'ponto', x: 100, y: 5 });
    c.atualizar(estado, eu, 0);
    const primeiro = cmds.at(-1);
    expect(primeiro).toMatchObject({ t: 'irPara', y: 5 });
    expect(primeiro && 'x' in primeiro ? primeiro.x : 0).toBeLessThanOrEqual(5 + 40);
    c.comandoDoJogador({ t: 'mover', dir: 'N' });
    expect(c.atual()).toBeNull();
  });

  it('o ponto marcado na árvore vai para a célula livre mais perto', () => {
    const fase = faseDeTexto(['....', '.#..', '....']);
    expect(celulaLivrePerto(fase, 1, 1)).not.toEqual({ x: 1, y: 1 });
    expect(celulaLivrePerto(fase, 0, 0)).toEqual({ x: 0, y: 0 });
  });

  it('o clique acha a loja na célula dela ou na da frente, não ao lado', () => {
    const estado = criarEstado({ semente: 1, faseId: 'x' });
    estado.objetos.push(novoObjeto('l1', 'loja', 10, 10, { ref: 'ferreiro' }));
    expect(objetoClicado(estado, { x: 10, y: 10 })?.objetoId).toBe('l1');
    expect(objetoClicado(estado, { x: 9, y: 9 })?.objetoId).toBe('l1');
    expect(objetoClicado(estado, { x: 11, y: 10 })).toBeNull();
    // Isométrico: as vizinhas de trás pelos lados ficam para andar (a célula ao lado do baú, no e2e).
    expect(objetoClicado(estado, { x: 9, y: 10 })).toBeNull();
    expect(objetoClicado(estado, { x: 10, y: 9 })).toBeNull();
    // Vista de cima, a célula ao lado (à esquerda) é andar; só a de cima é coberta pelo desenho.
    expect(objetoClicado(estado, { x: 9, y: 10 }, false)).toBeNull();
    expect(objetoClicado(estado, { x: 10, y: 9 }, false)?.objetoId).toBe('l1');
  });

  it('renasce onde o jogador escolheu (sem escolha, a vila salva)', () => {
    const ficha = { vilaSalva: 'vila_b' } as FichaDoMundo;
    const reino = { inicio: 'vila_do_centro' };
    expect(ondeRenascer(ficha, undefined, reino, 0).regiao).toBe('vila_b');
    expect(ondeRenascer(ficha, 'central', reino, 0).regiao).toBe('vila_do_centro');
    expect(ondeRenascer(ficha, 'save', reino, 0).regiao).toBe('vila_b');
    expect(ondeRenascer(ficha, 'acampamento', reino, 0).regiao).toBe('vila_b');
  });

  it('à noite, o vendedor da noite e o andarilho cobram mais; de dia e nas outras lojas, não', () => {
    const { ctx } = vila(1);
    const pct = ctx.balance.mundo.vilaNoite.sobretaxa.pct;
    expect(fatorDaNoite(ctx, { tipo: 'loja', ref: REF_NOTURNO })).toBe(1 + pct / 100);
    expect(fatorDaNoite(ctx, { tipo: 'loja', ref: 'errante' })).toBe(1 + pct / 100);
    expect(fatorDaNoite(ctx, { tipo: 'loja', ref: 'ferreiro' })).toBe(1);
    expect(fatorDaNoite(ctx, { tipo: 'loja', ref: REF_NOTURNO }, 0)).toBe(1);
  });

  it('a roda comum dá os mesmos 0,1 de antes; a pinça do touchpad (Ctrl, passos pequenos) vai devagar', () => {
    expect(zoomDaRoda(1, { deltaY: -100, deltaMode: 0, ctrlKey: false })).toBeCloseTo(Math.exp(0.1));
    // Vinte eventos de 2 px de pinça: antes, +2 de zoom (0,1 cada); agora, uns 27%.
    let z = 1;
    for (let i = 0; i < 20; i++) z = zoomDaRoda(z, { deltaY: -2, deltaMode: 0, ctrlKey: true });
    expect(z).toBeGreaterThan(1.1);
    expect(z).toBeLessThan(1.4);
    expect(zoomDaRoda(1, { deltaY: -100, deltaMode: 0, ctrlKey: false }, 0.5)).toBeLessThan(zoomDaRoda(1, { deltaY: -100, deltaMode: 0, ctrlKey: false }));
  });
});

describe('marco 53: a venda desfazível e a câmera na borda (D-203)', () => {
  it('a venda se desfaz enquanto a loja está aberta; fechada, está feita', () => {
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
    vender(estado, ctx, eu, 'x1', saida, 2);
    vender(estado, ctx, eu, 'x1', saida, 1);
    expect(eu.interacao.vendas).toHaveLength(1);
    expect(eu.interacao.vendas?.[0]?.qtd).toBe(3);
    desfazerVenda(estado, ctx, eu, 0, saida);
    expect(bolsa.ouro).toBe(antes);
    expect(bolsa.mochila.reduce((s, i) => s + (i.itemId === 'lenha' ? i.qtd : 0), 0)).toBe(5);
    expect(saida.some((e) => e.t === 'vendaDesfeita')).toBe(true);
    // Sem o ouro da venda, não desfaz.
    vender(estado, ctx, eu, bolsa.mochila[0]?.invId ?? '', saida, 1);
    bolsa.ouro = 0;
    desfazerVenda(estado, ctx, eu, 0, saida);
    expect(eu.interacao.vendas).toHaveLength(1);
    // A loja fechada leva a lista junto: o negócio está feito.
    fecharLoja(estado, ctx, eu, saida);
    expect(eu.interacao).toBeNull();
  });

  it('a câmera desliza só com o cursor na faixa da borda, mais rápido perto da beirada', () => {
    expect(velocidadeDaBorda(500, 1000)).toBe(0);
    expect(velocidadeDaBorda(0, 1000)).toBeLessThan(velocidadeDaBorda(20, 1000));
    expect(velocidadeDaBorda(20, 1000)).toBeLessThan(0);
    expect(velocidadeDaBorda(995, 1000)).toBeGreaterThan(0);
  });
});

describe('marco 53: o registro do Mundo e o chefe que surge (D-203)', () => {
  it('o Mundo tira o registro lateral da tela; os outros modos o mantêm', () => {
    expect(CONTEUDO.modos.get('mundo')?.registroNaTela).toBe(false);
    for (const m of ['campanha', 'cooperativo', 'livre']) expect(CONTEUDO.modos.get(m)?.registroNaTela).toBeUndefined();
  });

  it('o chefe é anunciado uma vez; volta a ser depois de muito tempo longe da vista; o inimigo comum, nunca', () => {
    const estado = criarEstado({ semente: 1, faseId: 'x' });
    const pChefe = CONTEUDO.presets.get('necromante_ancestral');
    const pComum = CONTEUDO.presets.get('lobo');
    if (!pChefe || !pComum) throw new Error('presets');
    const chefe = criarInimigo(pChefe, 'b1', 5, 5, BALANCE_PADRAO, { nivel: 30 });
    const comum = criarInimigo(pComum, 'l1', 6, 6, BALANCE_PADRAO, { nivel: 30 });
    expect(chefe.arquetipo).toBe('boss');
    estado.entidades.push(chefe, comum);
    const vistos = new Map<string, number>();
    expect(chefesNovos(estado, vistos, 0).map((c) => c.id)).toEqual(['b1']);
    expect(chefesNovos(estado, vistos, 1000)).toEqual([]);
    estado.entidades = [comum];
    chefesNovos(estado, vistos, 2000);
    estado.entidades = [comum, chefe];
    expect(chefesNovos(estado, vistos, 60_000)).toEqual([]);
    estado.entidades = [comum];
    chefesNovos(estado, vistos, 61_000);
    estado.entidades = [comum, chefe];
    expect(chefesNovos(estado, vistos, 300_000).map((c) => c.id)).toEqual(['b1']);
  });
});
