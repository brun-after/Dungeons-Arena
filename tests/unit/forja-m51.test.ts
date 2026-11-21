// Marco 51 (21/11/2026, D-197): a forja aprofundada. Os engastes (1 a 3, pela raridade e pelo nível) vivem no id `en_`,
// como o `fu_`; os conjuntos de elemento, dimensão e o par instável mudam os efeitos; a receita é loot, parte de uma
// peça pronta e só vale com o ferreiro aberto; engastar e extrair custam ouro, e o material extraído volta às vezes.
import { describe, expect, it } from 'vitest';
import { lerComando } from '../../src/arena/protocolo';
import { criarRng } from '../../src/core/rng';
import { criarEstado } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { criarJogador } from '../../src/entities/fabrica';
import { engastesDaPeca, idEngastado, lerIdEngastado, lerMateriaisNaPeca } from '../../src/progression/engaste';
import { dropsDaForja, engastar, extrair, forjarMolde, resultadoDoMolde } from '../../src/progression/moldes';
import { novoObjeto } from '../../src/world/objeto-novo';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const obter = <T,>(v: T | undefined | null): T => {
  if (v === undefined || v === null) throw new Error('ausente');
  return v;
};
const ctx = contexto(faseDeTexto(SALA_ABERTA));
const regras = ctx.balance.engaste;

function ferreiro(aberto = true) {
  const estado = criarEstado({ semente: 5, faseId: 'teste' });
  const j = criarJogador(obter(CONTEUDO.classes.get('guerreiro')), 'j', 3, 3, ctx.balance);
  const b = obter(j.bolsa);
  b.mochila = [];
  b.ouro = 5000;
  estado.entidades.push(j);
  if (aberto) {
    estado.objetos.push(novoObjeto('l1', 'loja', 2, 2));
    j.interacao = { tipo: 'loja', objetoId: 'l1', ateTick: 2 ** 31 - 1 };
  }
  const por = (invId: string, itemId: string, qtd = 1) => b.mochila.push({ invId, itemId, qtd, ref: null });
  return { estado, j, b, por, saida: [] as EventoSimulacao[] };
}

describe('os engastes da peça (D-197)', () => {
  it('o menor entre a raridade e o teto do nível', () => {
    expect(engastesDaPeca({ raridade: 'comum', nivelMinimo: 60 }, regras)).toBe(1);
    expect(engastesDaPeca({ raridade: 'lendario', nivelMinimo: 10 }, regras)).toBe(1);
    expect(engastesDaPeca({ raridade: 'epico', nivelMinimo: 30 }, regras)).toBe(2);
    expect(engastesDaPeca({ raridade: 'lendario', nivelMinimo: 50 }, regras)).toBe(3);
  });

  it('ida e volta do id, por fora do `fu_`', () => {
    const id = idEngastado(['escama_ignea', 'po_de_sonho'], 'fu_fogo_1__espada_curta');
    expect(id).toBe('en_escama_ignea.po_de_sonho__fu_fogo_1__espada_curta');
    expect(lerIdEngastado(id)).toEqual({ materiais: ['escama_ignea', 'po_de_sonho'], base: 'fu_fogo_1__espada_curta' });
    expect(lerIdEngastado('en_a.b.c.d__x')).toBeNull();
    expect(lerIdEngastado('en_a__en_b__x')).toBeNull();
  });

  it('o catálogo resolve a peça engastada com os ganchos do material, e recusa engastes demais', () => {
    const base = obter(ctx.conteudo.itens.get('espada_curta'));
    const peca = obter(ctx.conteudo.itens.get('en_escama_ignea__espada_curta'));
    expect(peca.ganchos.length).toBe(base.ganchos.length + 1);
    expect(peca.valorBase).toBeGreaterThan(base.valorBase);
    expect(ctx.conteudo.itens.get('en_escama_ignea.po_de_sonho__espada_curta')).toBeUndefined();
    expect(ctx.conteudo.itens.get('en_nao_existe__espada_curta')).toBeUndefined();
  });

  it('a arma lê o material de um jeito e a peça de outro', () => {
    const cat = ctx.conteudo.alquimia;
    const arma = obter(lerMateriaisNaPeca(true, ['escama_ignea'], cat, ctx.conteudo.elementos, regras));
    const peca = obter(lerMateriaisNaPeca(false, ['escama_ignea'], cat, ctx.conteudo.elementos, regras));
    expect(arma.ganchos[0]?.quando).toBe('aoAcertar');
    expect(peca.ganchos[0]?.quando).toBe('passivo');
  });

  it('dois do mesmo elemento sobem os efeitos; três da mesma dimensão trazem o eco da fenda', () => {
    const cat = ctx.conteudo.alquimia;
    const fogo = [...cat.materiais].filter(([, m]) => m.elemento === 'fogo').map(([id]) => id);
    expect(fogo.length).toBeGreaterThanOrEqual(2);
    const dois = obter(lerMateriaisNaPeca(true, fogo.slice(0, 2), cat, ctx.conteudo.elementos, regras));
    expect(dois.fator).toBeGreaterThan(1.2);
    expect(dois.conjuntos.some((c) => c.tipo === 'elemento' && c.chave === 'fogo')).toBe(true);
    const porDim = new Map<string, string[]>();
    for (const [id, m] of cat.materiais) if (m.dimensao && m.elemento) porDim.set(m.dimensao, [...(porDim.get(m.dimensao) ?? []), id]);
    const tres = [...porDim.values()].find((l) => l.length >= 3);
    const l = obter(lerMateriaisNaPeca(true, obter(tres).slice(0, 3), cat, ctx.conteudo.elementos, regras));
    expect(l.conjuntos.some((c) => c.tipo === 'dimensao' && c.n === 3)).toBe(true);
    expect(l.ganchos.some((g) => g.efeito.tipo === 'aplicarEmVolta')).toBe(true);
  });
});

describe('a receita como loot (D-197)', () => {
  it('a Lâmina de cinzas: a espada vira de fogo com a escama engastada; receita, material e ouro são gastos', () => {
    const c = ferreiro();
    c.por('r', 'receita_lamina_de_cinzas');
    c.por('e', 'espada_curta');
    c.por('m', 'escama_ignea');
    expect(forjarMolde(c.estado, ctx, c.j, 'r', 'e', null, c.saida)).toBe(true);
    const peca = obter(c.b.mochila.find((i) => i.invId === 'e'));
    expect(peca.itemId).toBe('en_escama_ignea__fu_fogo_1__espada_curta');
    expect(ctx.conteudo.itens.get(peca.itemId)).toBeDefined();
    expect(c.b.mochila.map((i) => i.invId)).toEqual(['e']);
    expect(c.b.ouro).toBe(5000 - 120);
    expect(c.saida.some((e) => e.t === 'forjou')).toBe(true);
  });

  it('recusa sem o ferreiro, com a família errada ou sem o material', () => {
    const fechado = ferreiro(false);
    fechado.por('r', 'receita_lamina_de_cinzas');
    fechado.por('e', 'espada_curta');
    fechado.por('m', 'escama_ignea');
    expect(forjarMolde(fechado.estado, ctx, fechado.j, 'r', 'e', null, fechado.saida)).toBe(false);
    const arco = ferreiro();
    arco.por('r', 'receita_lamina_de_cinzas');
    arco.por('a', 'arco_simples');
    arco.por('m', 'escama_ignea');
    expect(forjarMolde(arco.estado, ctx, arco.j, 'r', 'a', null, arco.saida)).toBe(false);
    const semMat = ferreiro();
    semMat.por('r', 'receita_lamina_de_cinzas');
    semMat.por('e', 'espada_curta');
    expect(forjarMolde(semMat.estado, ctx, semMat.j, 'r', 'e', null, semMat.saida)).toBe(false);
    expect(semMat.b.mochila.length).toBe(2);
  });

  it('os engastes que a peça já tinha ficam, sem passar do teto', () => {
    const m = obter(ctx.conteudo.moldes.get('lamina_de_cinzas'));
    expect(resultadoDoMolde(ctx, m, 'en_po_de_sonho__espada_curta')).toBe('en_po_de_sonho__fu_fogo_1__espada_curta');
  });

  it('cai das criaturas que a guardam (preset), com a chance do balance', () => {
    let achou = 0;
    for (let s = 1; s <= 400; s++) if (dropsDaForja(ctx, 'fornalheiro', false, criarRng(s)).some((id) => id.startsWith('receita_'))) achou++;
    expect(achou).toBeGreaterThan(0);
    expect(achou).toBeLessThan(400 * 0.1);
  });
});

describe('engastar e extrair no ferreiro (D-197)', () => {
  it('engasta num espaço livre, recusa o segundo numa peça de 1 e extrai', () => {
    const c = ferreiro();
    c.por('e', 'espada_curta');
    c.por('m', 'escama_ignea', 2);
    expect(engastar(c.estado, ctx, c.j, 'e', 'm', c.saida)).toBe(true);
    expect(obter(c.b.mochila.find((i) => i.invId === 'e')).itemId).toBe('en_escama_ignea__espada_curta');
    expect(engastar(c.estado, ctx, c.j, 'e', 'm', c.saida)).toBe(false);
    const ouro = c.b.ouro;
    expect(extrair(c.estado, ctx, c.j, 'e', 0, c.saida)).toBe(true);
    expect(obter(c.b.mochila.find((i) => i.invId === 'e')).itemId).toBe('espada_curta');
    expect(c.b.ouro).toBeLessThan(ouro);
  });

  it('os comandos passam pelo protocolo', () => {
    expect(lerComando({ t: 'forjarMolde', receita: 'r', base: 'e', segunda: null })).toEqual({ t: 'forjarMolde', receita: 'r', base: 'e', segunda: null });
    expect(lerComando({ t: 'engastar', peca: 'e', material: 'm' })).toEqual({ t: 'engastar', peca: 'e', material: 'm' });
    expect(lerComando({ t: 'extrair', peca: 'e', indice: 5 })).toBeNull();
  });
});
