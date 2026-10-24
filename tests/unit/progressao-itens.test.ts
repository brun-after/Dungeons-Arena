// D-075 (17/10/2026): efeitos reais, transações, migração e XP na faixa avançada.
import { describe, expect, it } from 'vitest';
import { criarEstado, clonarEntidade } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { criarJogador, criarInimigo } from '../../src/entities/fabrica';
import { guardarItem, usarItem, consumiveisComAtalho } from '../../src/progression/inventario';
import { avancarEstudos, subirRank, ticksRestantesDoEstudo } from '../../src/progression/habilidades-personagem';
import { comprar, estoqueDaLoja } from '../../src/progression/loja';
import { familiaDaHabilidade, precoDoItem } from '../../src/progression/itens-progressao';
import { processarMortes } from '../../src/progression/morte';
import { aplicarSubidas, xpParaProximo } from '../../src/progression/nivel';
import { MIGRACOES } from '../../src/save/esquema';
import { conferirPersonagem, pedidoDoPersonagem } from '../../src/coop/personagem';
import { novoObjeto } from '../../src/world/objetos';
import { avaliarCrescimento } from '../../src/integridade/certificado';
import type { Dificuldade } from '../../src/modos/dificuldade';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | undefined | null): T { if (v === undefined || v === null) throw new Error('Dado de teste ausente'); return v; }

function cena() {
  const ctx = contexto(faseDeTexto(SALA_ABERTA));
  const estado = criarEstado({ semente: 17, faseId: 'teste' });
  const j = criarJogador(obter(CONTEUDO.classes.get('mago')), 'j', 3, 3, ctx.balance);
  const b = obter(j.bolsa);
  const eventos: EventoSimulacao[] = [];
  estado.entidades.push(j);
  const dar = (id: string, qtd = 1) => {
    expect(guardarItem(b, obter(CONTEUDO.itens.get(id)), qtd, ctx.balance.inventario)).toBe(true);
    return obter(b.mochila.find((i) => i.itemId === id)).invId;
  };
  return { ctx, estado, j, b, eventos, dar };
}

describe('consumíveis de progressão', () => {
  it('aceleração soma graus, preserva frações e não conclui tempo instantaneamente', () => {
    const c = cena();
    c.b.estudo = { id: 'nova_glacial', totalTicks: 100, restanteTicks: 100, aceleracoes: 0 };
    c.b.pontosHabilidade = 7;
    for (const grau of ['comum', 'incomum', 'rara']) usarItem(c.estado, c.j, c.ctx, c.dar(`aceleracao_mente_${grau}`), c.eventos);
    expect(c.b.estudo.velocidade12).toBe(25);
    expect(c.b.estudo.restanteTicks).toBe(100);
    expect(ticksRestantesDoEstudo(c.b.estudo)).toBe(48);
    for (let n = 0; n < 12; n++) avancarEstudos(c.estado, c.ctx, c.eventos);
    expect(c.b.estudo.restanteTicks).toBe(75);
    expect(c.b.estudo.fracao12).toBe(0);
    expect(c.b.pontosHabilidade).toBe(7);
    const copia = clonarEntidade(c.j);
    expect(copia.bolsa?.estudo).toEqual(c.b.estudo);
    expect(copia.bolsa?.estudo).not.toBe(c.b.estudo);
    for (let n = 0; n < 36; n++) avancarEstudos(c.estado, c.ctx, c.eventos);
    expect(c.b.estudo).toBeNull();
    expect(c.b.conhecidas.some((h) => h.id === 'nova_glacial')).toBe(true);
    c.b.pontosHabilidade = 1;
    subirRank(c.j, c.ctx, 'mente_partida', undefined, 0, c.eventos);
    expect(c.b.estudo.velocidade12).toBe(12);
  });

  it('sem estudo não consome; os itens de progressão não ocupam atalhos de poção', () => {
    const c = cena();
    const id = c.dar('aceleracao_mente_rara');
    usarItem(c.estado, c.j, c.ctx, id, c.eventos);
    expect(c.b.mochila.find((i) => i.invId === id)?.qtd).toBe(1);
    expect(consumiveisComAtalho(c.b, CONTEUDO.itens).some((i) => i.invId === id)).toBe(false);
  });

  it('essência preserva requisitos e exige escolha; uma confirmação antiga não sobe outro rank', () => {
    const c = cena();
    const id = c.dar('essencia_fogo', 3);
    expect(subirRank(c.j, c.ctx, 'bola_de_fogo', undefined, 0, c.eventos, id)).toBe(false);
    c.j.nivel = 20;
    expect(subirRank(c.j, c.ctx, 'bola_de_fogo', undefined, 0, c.eventos, id, 2)).toBe(true);
    expect(c.b.pontosHabilidade).toBe(0);
    expect(subirRank(c.j, c.ctx, 'bola_de_fogo', undefined, 0, c.eventos, id, 2)).toBe(false);
    expect(subirRank(c.j, c.ctx, 'bola_de_fogo', undefined, 0, c.eventos, id, 3)).toBe(false);
    expect(subirRank(c.j, c.ctx, 'bola_de_fogo', 'eficiente', 0, c.eventos, id, 3)).toBe(true);
    expect(c.b.mochila.find((i) => i.invId === id)?.qtd).toBe(1);
    expect(c.b.ranksPorItens).toBe(2);
    expect(subirRank(c.j, c.ctx, 'lanca_de_gelo', undefined, 0, c.eventos, id)).toBe(false);
    expect(subirRank(c.j, c.ctx, 'explosao', undefined, 0, c.eventos, id)).toBe(false);
    expect(c.b.mochila.find((i) => i.invId === id)?.qtd).toBe(1);
    expect(familiaDaHabilidade(c.ctx, 'bola_de_fogo')).toBe('fogo');
    expect(familiaDaHabilidade(c.ctx, 'explosao')).toBe('arcana');
  });

  it('tomo mantém preço fixo em compras repetidas e falha sem cobrar com mochila cheia', () => {
    const c = cena();
    const loja = novoObjeto('loja', 'loja', 3, 3);
    c.estado.objetos.push(loja);
    c.j.interacao = { tipo: 'loja', objetoId: loja.objetoId, ateTick: 99999 };
    expect(estoqueDaLoja(c.estado, c.ctx, loja)).toEqual(estoqueDaLoja(c.estado, c.ctx, loja));
    expect(estoqueDaLoja(c.estado, c.ctx, loja)).toEqual(expect.arrayContaining(['aceleracao_mente_comum', 'tomo_potencial']));
    c.b.ouro = 100000;
    comprar(c.estado, c.ctx, c.j, 'tomo_potencial', c.eventos);
    expect(c.b.ouro).toBe(90000);
    comprar(c.estado, c.ctx, c.j, 'tomo_potencial', c.eventos);
    expect(c.b.ouro).toBe(80000);
    expect(c.b.tomosComprados).toBe(2);
    expect(precoDoItem(obter(CONTEUDO.itens.get('tomo_potencial')), c.j, c.ctx)).toBe(10000);
    const id = obter(c.b.mochila.find((i) => i.itemId === 'tomo_potencial')).invId;
    usarItem(c.estado, c.j, c.ctx, id, c.eventos);
    expect(c.b.pontosHabilidade).toBe(1);
    expect(c.b.pontosPorItens).toBe(1);
    c.b.mochila = Array.from({ length: c.ctx.balance.inventario.capacidade }, (_, i) => ({ invId: `full${i}`, itemId: 'pocao_vida', qtd: 10, ref: null }));
    comprar(c.estado, c.ctx, c.j, 'tomo_potencial', c.eventos);
    expect(c.b.ouro).toBe(80000);
    expect(c.b.tomosComprados).toBe(2);
  });

  it('coop conserva pontos e ranks ganhos por itens', () => {
    const c = cena();
    c.j.nivel = 20;
    c.b.ranksPorItens = 1;
    c.b.tomosComprados = 1;
    c.b.pontosPorItens = 1;
    c.b.pontosHabilidade = 20;
    obter(c.b.conhecidas[0]).rank = 2;
    const r = conferirPersonagem(pedidoDoPersonagem(c.j), c.ctx, 'coop', 'p');
    expect(r?.entidade.bolsa?.pontosHabilidade).toBe(20);
    expect(r?.entidade.bolsa?.conhecidas[0]?.rank).toBe(2);
    expect(r?.entidade.bolsa?.tomosComprados).toBe(1);
  });
  it('coop preserva estudo já iniciado, inclusive velocidade e trabalho calculado antes de trocar equipamento', () => {
    const c = cena();
    c.b.estudo = { id: 'nova_glacial', totalTicks: 10000, restanteTicks: 8000, aceleracoes: 0, velocidade12: 25, fracao12: 7 };
    c.b.conhecidas.push({ id: 'pele_de_pedra', rank: 5, caminhos: [] });
    c.b.ranksPorItens = 4;
    const r = conferirPersonagem(pedidoDoPersonagem(c.j), c.ctx, 'coop', 'p');
    // O nível também limita o rank, independentemente do pagamento por item.
    expect(r?.entidade.bolsa?.conhecidas.find((h) => h.id === 'pele_de_pedra')?.rank).toBe(1);
    expect(r?.entidade.bolsa?.estudo).toEqual(c.b.estudo);
    c.j.nivel = 20;
    const adulto = conferirPersonagem(pedidoDoPersonagem(c.j), c.ctx, 'coop', 'p');
    expect(adulto?.entidade.bolsa?.conhecidas.find((h) => h.id === 'pele_de_pedra')?.rank).toBe(5);
  });
  it('certificação exige que a compra de tomos caiba no ouro disponível', () => {
    const c = cena();
    c.b.ouro = 20000;
    const antes = obter(pedidoDoPersonagem(c.j));
    c.b.tomosComprados = 1;
    c.b.pontosPorItens = 1;
    c.b.pontosHabilidade = 1;
    expect(avaliarCrescimento(antes, obter(pedidoDoPersonagem(c.j)), 0, c.ctx.balance, () => 0).ok).toBe(false);
    c.b.ouro = 10000;
    expect(avaliarCrescimento(antes, obter(pedidoDoPersonagem(c.j)), 0, c.ctx.balance, () => 0).ok).toBe(true);
  });
});

describe('nível 30 e faixa avançada', () => {
  function abate(nivel: number, dificuldade: Dificuldade, xp = 100, abates = 0) {
    const c = cena();
    c.j.nivel = nivel;
    c.estado.dificuldade = dificuldade;
    const i = criarInimigo(obter(CONTEUDO.presets.get('goblin')), 'i', 5, 5, c.ctx.balance);
    i.nivel = nivel; // Isola a faixa avançada: criaturas inferiores têm antifarm próprio.
    i.hp = 0; i.xpBase = xp; i.abates = abates;
    i.participacao = [{ id: c.j.id, tick: 0 }];
    c.estado.entidades.push(i);
    processarMortes(c.estado, c.ctx, c.eventos);
    return c;
  }
  it.each([['facil', 5], ['normal', 10], ['dificil', 35], ['pesadelo', 170]] as const)('%s concede %i XP na faixa avançada', (d, xp) => {
    expect(abate(20, d).j.xp).toBe(xp);
  });
  it('antes do 20 preserva recompensas e mantém ouro fora da penalidade', () => {
    expect(abate(19, 'normal').j.xp).toBe(100);
    expect(abate(19, 'pesadelo').j.xp).toBe(160);
    const a = abate(19, 'normal'), b = abate(20, 'normal');
    expect(b.estado.objetos.filter((o) => o.tipo === 'ouro')).toEqual(a.estado.objetos.filter((o) => o.tipo === 'ouro'));
  });
  it('recompensa fracionária preserva a cota sem a antiga penalidade de respawn', () => {
    const c = abate(20, 'normal', 1, 10);
    expect(c.j.xp).toBe(0);
    expect(c.b.xpFracao).toBeGreaterThan(0);
    expect(c.b.xpFracao).toBeCloseTo(0.1);
  });
  it('um grupo misto aplica a faixa a cada um: quem abate leva tudo e o aliado perto, 75%', () => {
    const c = cena();
    c.j.nivel = 20;
    const baixo = criarJogador(obter(CONTEUDO.classes.get('mago')), 'baixo', 4, 3, c.ctx.balance);
    baixo.nivel = 19;
    const i = criarInimigo(obter(CONTEUDO.presets.get('goblin')), 'i', 5, 5, c.ctx.balance);
    i.nivel = 20;
    i.hp = 0; i.xpBase = 100;
    i.participacao = [{ id: c.j.id, tick: 0 }, { id: baixo.id, tick: 0 }];
    c.estado.entidades.push(baixo, i);
    processarMortes(c.estado, c.ctx, c.eventos);
    // Marco 24 (D-097): o último a bater (baixo) abate e leva tudo; o aliado perto leva 75%, cada um na sua faixa.
    expect(baixo.xp).toBe(110);
    expect(c.j.xp + (c.b.xpFracao ?? 0)).toBeCloseTo(8.25);
  });
  it('geração de equipamento aceita o novo nível máximo', () => {
    const c = cena();
    expect(c.ctx.conteudo.itens.get('gi_espada_30_raro_7')?.nivelMinimo).toBe(30);
  });
  it('30 é o teto e níveis adicionais continuam dando pontos', () => {
    const c = cena(); c.j.nivel = 29;
    c.j.xp = xpParaProximo(29, c.ctx.balance.xp);
    aplicarSubidas(c.j, c.ctx, 0, c.eventos);
    expect(c.j.nivel).toBe(30);
    expect(c.b.pontosAtributo).toBe(3);
    expect(c.b.pontosHabilidade).toBe(1);
    c.j.xp = 999999;
    aplicarSubidas(c.j, c.ctx, 0, c.eventos);
    expect(c.j.nivel).toBe(30);
  });
  it('migração reembolsa só acelerações registradas e preserva XP legado sem subir níveis', () => {
    const c = cena(); c.j.nivel = 20; c.j.xp = 99999;
    c.b.estudo = { id: 'nova_glacial', totalTicks: 100, restanteTicks: 30, aceleracoes: 2 };
    const r = obter(MIGRACOES[14])({ versaoSchema: 14, estado: c.estado, fasesVisitadas: {} });
    const j = obter((r.estado as typeof c.estado).entidades[0]);
    expect(j.nivel).toBe(20); expect(j.xp).toBe(0);
    expect(j.bolsa?.xpLegado).toBe(99999);
    expect(j.bolsa?.pontosHabilidade).toBe(2);
    expect(j.bolsa?.estudo).toMatchObject({ restanteTicks: 30, velocidade12: 12, aceleracoes: 0 });
  });
});
