// Marco 30 (30/10/2026, D-129): os módulos puros do social e da economia do Mundo: as missões do quadro, o banco, o
// chat, a troca, os grupos, o mercado e a leitura das ações.

import { describe, expect, it } from 'vitest';
import { BALANCE_PADRAO, type ContextoSimulacao } from '../../src/core/contexto';
import type { Bolsa } from '../../src/entities/entidade';
import { criarJogador } from '../../src/entities/fabrica';
import { lerAcaoDoMundo } from '../../src/mundo/acoes';
import { guardarNoBanco, moverOuro, tirarDoBanco } from '../../src/mundo/banco';
import { limparTexto, LimiteDoChat } from '../../src/mundo/chat';
import { fichaNova, lerFichaDoMundo, type FichaDoMundo } from '../../src/mundo/ficha-mundo';
import { GruposDoMundo } from '../../src/mundo/grupos';
import { aReceber, liquidoDaVenda, taxaDeAnuncio, type Anuncio } from '../../src/mundo/mercado';
import { aceitarMissao, diaDe, entregarMissao, ofertasDoQuadro, progredirMissoes, type MissaoDoMundo } from '../../src/mundo/missoes-mundo';
import type { Reino } from '../../src/mundo/reino';
import { executarTroca, TrocasDaSala } from '../../src/mundo/troca';
import { guardarItem } from '../../src/progression/inventario';
import { CONTEUDO } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome: string): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

const REINO: Reino = obter(CONTEUDO.reinos.get('reino_central'), 'reino');
const CTX = { conteudo: CONTEUDO, balance: BALANCE_PADRAO } as unknown as ContextoSimulacao;
const MISSOES = new Map(REINO.missoes.map((m) => [m.id, m]));

function ficha(): FichaDoMundo {
  return obter(fichaNova({ conteudo: CONTEUDO, balance: BALANCE_PADRAO }, REINO, 'guerreiro', 'Tester', 'pers-1'), 'ficha');
}

function bolsa(): Bolsa {
  const b = criarJogador(obter(CONTEUDO.classes.get('guerreiro'), 'classe'), 'j', 0, 0, BALANCE_PADRAO).bolsa;
  return obter(b, 'bolsa');
}

const dar = (b: Bolsa, itemId: string, qtd: number) => {
  guardarItem(b, obter(CONTEUDO.itens.get(itemId), itemId), qtd, BALANCE_PADRAO.inventario);
};

describe('missões do quadro', () => {
  it('o quadro oferece as missões da vila, iguais no mesmo dia e diferentes em outro', () => {
    const hoje = ofertasDoQuadro(REINO.missoes, 'vila_do_centro', 20_000, 6);
    expect(hoje).toHaveLength(6);
    expect(ofertasDoQuadro(REINO.missoes, 'vila_do_centro', 20_000, 6)).toEqual(hoje);
    for (const id of hoje) expect(MISSOES.get(id)?.vilas).toContain('vila_do_centro');
    const semana = new Set(Array.from({ length: 7 }, (_, d) => ofertasDoQuadro(REINO.missoes, 'vila_do_centro', 20_000 + d, 6).join()));
    expect(semana.size).toBeGreaterThan(1);
  });

  it('aceitar, caçar até a meta e entregar; não repete no mesmo dia', () => {
    const f = ficha();
    const m: MissaoDoMundo = obter(MISSOES.get('limpar_os_campos'), 'missão');
    const dia = diaDe(Date.UTC(2026, 9, 30));
    expect(aceitarMissao(f, ['outra'], m.id, dia, 5)).toBe('missao_invalida');
    expect(aceitarMissao(f, [m.id], m.id, dia, 5)).toBeNull();
    expect(entregarMissao(f, MISSOES, [], m.id, dia)).toBe('missao_incompleta');
    // Outro preset ou outra região não contam.
    expect(progredirMissoes(f, MISSOES, { tipo: 'abate', preset: 'goblin', regiao: 'vila_do_centro' })).toEqual([]);
    expect(progredirMissoes(f, MISSOES, { tipo: 'abate', preset: 'slime', regiao: 'campos_do_oeste' })).toEqual([]);
    for (let i = 0; i < 12; i++) progredirMissoes(f, MISSOES, { tipo: 'abate', preset: 'slime', regiao: 'vila_do_centro' });
    expect(f.missoes.ativas[0]?.progresso).toBe(10);
    expect(entregarMissao(f, MISSOES, [], m.id, dia)).toBe(m);
    expect(f.missoes.ativas).toEqual([]);
    expect(aceitarMissao(f, [m.id], m.id, dia, 5)).toBe('missao_feita_hoje');
    expect(aceitarMissao(f, [m.id], m.id, dia + 1, 5)).toBeNull();
  });

  it('a de material gasta os itens da mochila na entrega; o limite de aceitas vale', () => {
    const f = ficha();
    const b = bolsa();
    expect(aceitarMissao(f, ['orelhas_de_goblin'], 'orelhas_de_goblin', 1, 5)).toBeNull();
    dar(b, 'orelha_de_goblin', 4);
    expect(entregarMissao(f, MISSOES, b.mochila, 'orelhas_de_goblin', 1)).toBe('missao_incompleta');
    dar(b, 'orelha_de_goblin', 3);
    expect(entregarMissao(f, MISSOES, b.mochila, 'orelhas_de_goblin', 1)).toMatchObject({ id: 'orelhas_de_goblin' });
    expect(b.mochila.filter((i) => i.itemId === 'orelha_de_goblin').reduce((s, i) => s + i.qtd, 0)).toBe(1);
    const g = ficha();
    const ofertas = REINO.missoes.map((m) => m.id);
    for (const id of ofertas.slice(0, 2)) aceitarMissao(g, ofertas, id, 1, 2);
    expect(aceitarMissao(g, ofertas, ofertas[2] ?? '', 1, 2)).toBe('missoes_cheias');
  });

  it('a ficha da versão 1 lê com o banco e as missões vazios', () => {
    const v1: Partial<FichaDoMundo> = { ...ficha() };
    delete v1.banco;
    delete v1.missoes;
    const lida = obter(lerFichaDoMundo({ ...v1, versao: 1 }, REINO), 'lida');
    expect(lida.banco).toEqual({ itens: [], ouro: 0 });
    expect(lida.missoes).toEqual({ ativas: [], feitas: {} });
  });
});

describe('banco', () => {
  it('guarda e tira itens (empilhando) e ouro; respeita as pilhas do banco e a mochila', () => {
    const f = ficha();
    const b = bolsa();
    dar(b, 'erva_curativa', 5);
    const erva = obter(CONTEUDO.itens.get('erva_curativa'), 'erva');
    const pilha = obter(b.mochila.find((i) => i.itemId === 'erva_curativa'), 'pilha');
    expect(guardarNoBanco(f.banco, b, erva, pilha.invId, 6, 40, 99)).toBe('sem_item');
    expect(guardarNoBanco(f.banco, b, erva, pilha.invId, 3, 40, 99)).toBeNull();
    expect(guardarNoBanco(f.banco, b, erva, pilha.invId, 2, 40, 99)).toBeNull();
    expect(f.banco.itens).toEqual([expect.objectContaining({ itemId: 'erva_curativa', qtd: 5 })]);
    expect(b.mochila.some((i) => i.itemId === 'erva_curativa')).toBe(false);
    const noBanco = obter(f.banco.itens[0], 'no banco');
    expect(tirarDoBanco(f.banco, b, erva, noBanco.invId, 2, BALANCE_PADRAO.inventario)).toBeNull();
    expect(noBanco.qtd).toBe(3);
    // Banco de uma pilha só, já ocupada por outro item: não cabe.
    dar(b, 'minerio_ferro', 1);
    const ferro = obter(b.mochila.find((i) => i.itemId === 'minerio_ferro'), 'ferro');
    expect(guardarNoBanco(f.banco, b, obter(CONTEUDO.itens.get('minerio_ferro'), 'item'), ferro.invId, 1, 1, 99)).toBe('banco_cheio');
    b.ouro = 50;
    expect(moverOuro(f.banco, b, 'guardar', 60)).toBe('sem_ouro');
    expect(moverOuro(f.banco, b, 'guardar', 30)).toBeNull();
    expect([b.ouro, f.banco.ouro]).toEqual([20, 30]);
    expect(moverOuro(f.banco, b, 'tirar', 30)).toBeNull();
    expect([b.ouro, f.banco.ouro]).toEqual([50, 0]);
  });
});

describe('chat', () => {
  it('limpa controles, junta espaços e corta no tamanho sem partir o emoji', () => {
    expect(limparTexto('  oi\n\ttudo\u0007 bem  ', 160)).toBe('oi tudo bem');
    expect(limparTexto('a‮b', 160)).toBe('a b');
    expect(limparTexto('\u0000\u0001  ', 160)).toBe('');
    expect(limparTexto('👨‍👩‍👧 família', 1)).toBe('👨‍👩‍👧');
  });

  it('limita as mensagens por janela', () => {
    const l = new LimiteDoChat(2, 1000);
    expect([l.permitir('a', 0), l.permitir('a', 10), l.permitir('a', 20), l.permitir('b', 20)]).toEqual([true, true, false, true]);
    expect(l.permitir('a', 1500)).toBe(true);
  });
});

describe('troca direta', () => {
  it('convite, oferta, confirmações desfeitas pela mudança e a troca de uma vez', () => {
    const t = new TrocasDaSala();
    expect(t.propor('a', 'a')).toBe('troca_invalida');
    expect(t.propor('a', 'b')).toBeNull();
    expect(t.aceitar('c', 'a')).toBe('convite_expirado');
    const troca = t.aceitar('b', 'a');
    if (typeof troca === 'string') throw new Error(troca);
    const ba = bolsa();
    const bb = bolsa();
    dar(ba, 'erva_curativa', 4);
    ba.ouro = 0;
    bb.ouro = 100;
    const erva = obter(ba.mochila.find((i) => i.itemId === 'erva_curativa'), 'erva');
    t.oferecer('a', [{ invId: erva.invId, qtd: 3 }], 0, 8);
    t.confirmar('a');
    t.oferecer('b', [], 70, 8);
    // A mudança da oferta de b desfez a confirmação de a.
    expect(t.confirmar('b')).toMatchObject({ pronta: false });
    expect(t.confirmar('a')).toMatchObject({ pronta: true });
    expect(executarTroca(CTX, troca, ba, bb)).toBeNull();
    expect(ba.ouro).toBe(70);
    expect(bb.ouro).toBe(30);
    expect(bb.mochila.filter((i) => i.itemId === 'erva_curativa').reduce((s, i) => s + i.qtd, 0)).toBe(3);
    expect(ba.mochila.filter((i) => i.itemId === 'erva_curativa').reduce((s, i) => s + i.qtd, 0)).toBe(1);
  });

  it('a oferta que sumiu desfaz a troca sem mudar nada', () => {
    const t = new TrocasDaSala();
    t.propor('a', 'b');
    const troca = t.aceitar('b', 'a');
    if (typeof troca === 'string') throw new Error(troca);
    const ba = bolsa();
    const bb = bolsa();
    ba.ouro = 10;
    t.oferecer('a', [], 50, 8);
    const antes = JSON.stringify([ba, bb]);
    expect(executarTroca(CTX, troca, ba, bb)).toBe('troca_invalida');
    expect(JSON.stringify([ba, bb])).toBe(antes);
  });

  it('quem está numa troca aberta não recebe outra; propor de novo troca o convite', () => {
    const t = new TrocasDaSala();
    t.propor('a', 'b');
    t.aceitar('b', 'a');
    expect(t.propor('c', 'a')).toBe('troca_ocupado');
    t.propor('c', 'd');
    t.propor('c', 'e');
    expect(t.aceitar('d', 'c')).toBe('convite_expirado');
    expect(typeof t.aceitar('e', 'c')).not.toBe('string');
  });
});

describe('grupos', () => {
  it('convite pelo id, aceite cria o grupo, limite, saída e expulsão', () => {
    const g = new GruposDoMundo(3, 1000);
    const c1 = g.convidar('ana', 'bia', 0);
    if (typeof c1 === 'string') throw new Error(c1);
    expect(g.aceitar('bia', c1.convite, 2000)).toBe('convite_expirado');
    const c2 = g.convidar('ana', 'bia', 2000);
    if (typeof c2 === 'string') throw new Error(c2);
    const grupo = g.aceitar('bia', c2.convite, 2100);
    if (typeof grupo === 'string') throw new Error(grupo);
    expect(grupo).toMatchObject({ lider: 'ana', membros: ['ana', 'bia'] });
    expect(g.convidar('bia', 'cris', 2100)).toBe('nao_lider');
    const c3 = g.convidar('ana', 'cris', 2100);
    if (typeof c3 === 'string') throw new Error(c3);
    g.aceitar('cris', c3.convite, 2200);
    expect(g.convidar('ana', 'davi', 2200)).toBe('grupo_cheio');
    expect(g.expulsar('bia', 'cris')).toBe('nao_lider');
    expect(g.expulsar('ana', 'cris')).toMatchObject({ desfeito: false });
    // O líder sai: a liderança passa; o grupo de um só se desfaz.
    expect(g.sair('ana')).toMatchObject({ desfeito: true });
    expect(g.grupoDe('bia')).toBeUndefined();
  });
});

describe('mercado', () => {
  it('as taxas tiram ouro da economia; vencidos e vendidos ficam a receber', () => {
    const r = BALANCE_PADRAO.mundo.mercado;
    expect(taxaDeAnuncio(100, r)).toBe(2);
    expect(taxaDeAnuncio(10, r)).toBe(1);
    expect(liquidoDaVenda(100, r)).toBe(92);
    const a: Anuncio = { id: 'x', vendedor: 'v', vendedorNome: 'V', item: { invId: 'i1', itemId: 'erva_curativa', qtd: 1, ref: null }, preco: 10, liquido: 9, criadoEm: 0, expiraEm: 100, estado: 'aberto' };
    expect(aReceber(a, 50)).toBe(false);
    expect(aReceber(a, 100)).toBe(true);
    expect(aReceber({ ...a, estado: 'vendido' }, 0)).toBe(true);
  });
});

describe('ações do Mundo', () => {
  it('lê as bem formadas e recusa as tortas', () => {
    expect(lerAcaoDoMundo({ a: 'chat', canal: 'local', texto: 'oi' })).toEqual({ a: 'chat', canal: 'local', texto: 'oi' });
    expect(lerAcaoDoMundo({ a: 'chat', canal: 'sistema', texto: 'oi' })).toBeNull();
    expect(lerAcaoDoMundo({ a: 'banco', op: 'guardar', invId: 'i1', qtd: 0 })).toBeNull();
    expect(lerAcaoDoMundo({ a: 'troca', op: 'oferecer', itens: [{ invId: 'i1', qtd: 2 }], ouro: 5 })).toMatchObject({ op: 'oferecer' });
    expect(lerAcaoDoMundo({ a: 'mercado', op: 'comprar', id: 'x' })).toBeNull();
    expect(lerAcaoDoMundo({ a: 'mercado', op: 'comprar', id: 'x', preco: 10 })).toMatchObject({ preco: 10 });
    expect(lerAcaoDoMundo({ a: 'grupo', op: 'sair' })).toEqual({ a: 'grupo', op: 'sair' });
    expect(lerAcaoDoMundo('nada')).toBeNull();
  });
});
