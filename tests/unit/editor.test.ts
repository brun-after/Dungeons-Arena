import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, describe, expect, it } from 'vitest';
import { aplicarFerramenta, deFaseJson, lerCelula, linhaDeCelulas, novaFaseEditavel, paraFaseJson, type FaseEditavel } from '../../src/editor/grade';
import { Historico } from '../../src/editor/historico';
import { apagarAventura, carregarAventura, gravarAventura, listarAventuras } from '../../src/plataforma/aventuras';
import { esquecerConexao } from '../../src/plataforma/banco';
import { validarFase } from '../../src/world/validacao-fase';
import { CONTEUDO } from '../apoio/fases';

const presets = new Set(CONTEUDO.presets.keys());
const nova = (): FaseEditavel => novaFaseEditavel('t', 'Teste', 12, 10);

/** Um traço completo, como o gesto faz. */
function traco(f: FaseEditavel, h: Historico, celulas: [number, number][], ferramenta: Parameters<typeof aplicarFerramenta>[1]) {
  h.iniciarTraco();
  for (const [x, y] of celulas) h.registrar(aplicarFerramenta(f, ferramenta, x, y));
  h.concluirTraco();
}

describe('grade do editor', () => {
  it('fase nova: borda de parede, piso dentro, spawn em (1,1) e válida com aviso de "sem inimigos"', () => {
    const f = nova();
    const r = validarFase(paraFaseJson(f), presets);
    expect(r.ok).toBe(true);
    expect(r.avisos.map((a) => a.mensagem)).toEqual(['fase sem inimigos']);
    expect(lerCelula(f, 0, 0).tipo).toBe('parede');
    expect(lerCelula(f, 5, 5).tipo).toBe('piso');
  });

  it('parede por cima tira spawn e inimigo; spawn é único e vira piso onde for colocado', () => {
    const f = nova();
    aplicarFerramenta(f, { t: 'inimigo', preset: 'goblin' }, 5, 5);
    aplicarFerramenta(f, { t: 'terreno', tipo: 'parede' }, 5, 5);
    expect(f.inimigos).toEqual([]);
    const alteracoes = aplicarFerramenta(f, { t: 'spawn' }, 0, 0);
    expect(alteracoes).toHaveLength(2);
    expect(f.spawn).toEqual({ x: 0, y: 0 });
    expect(lerCelula(f, 0, 0)).toEqual({ tipo: 'piso', spawn: true, inimigo: null, objeto: null });
    expect(lerCelula(f, 1, 1).spawn).toBe(false);
    expect(aplicarFerramenta(f, { t: 'terreno', tipo: 'parede' }, 0, 0)).toHaveLength(1);
    expect(f.spawn).toBeNull();
  });

  it('pintar o que já está lá não gera alteração; fora do mapa é ignorado', () => {
    const f = nova();
    expect(aplicarFerramenta(f, { t: 'terreno', tipo: 'piso' }, 5, 5)).toEqual([]);
    expect(aplicarFerramenta(f, { t: 'terreno', tipo: 'parede' }, 99, 5)).toEqual([]);
  });

  it('a linha do traço não pula células', () => {
    expect(linhaDeCelulas({ x: 0, y: 0 }, { x: 4, y: 2 })).toHaveLength(5);
    expect(linhaDeCelulas({ x: 3, y: 3 }, { x: 3, y: 3 })).toEqual([{ x: 3, y: 3 }]);
  });

  it('exportar e importar preserva a fase', () => {
    const f = nova();
    aplicarFerramenta(f, { t: 'terreno', tipo: 'saida' }, 8, 8);
    aplicarFerramenta(f, { t: 'inimigo', preset: 'esqueleto' }, 6, 4);
    const json = paraFaseJson(f);
    const r = validarFase(JSON.parse(JSON.stringify(json)), presets);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(paraFaseJson(deFaseJson(r.fase))).toEqual(json);
  });

  it('avisa inimigo inalcançável e marca a célula', () => {
    const f = nova();
    for (let y = 1; y < 9; y++) aplicarFerramenta(f, { t: 'terreno', tipo: 'parede' }, 5, y);
    aplicarFerramenta(f, { t: 'inimigo', preset: 'goblin' }, 8, 4);
    const r = validarFase(paraFaseJson(f), presets);
    expect(r.ok).toBe(true);
    expect(r.avisos).toEqual([{ mensagem: 'inimigo inalcançável a partir do spawn', x: 8, y: 4 }]);
  });
});

describe('histórico por traço', () => {
  it('desfaz e refaz o traço inteiro', () => {
    const f = nova();
    const h = new Historico();
    traco(f, h, [[3, 3], [4, 3], [5, 3]], { t: 'terreno', tipo: 'parede' });
    expect(lerCelula(f, 4, 3).tipo).toBe('parede');
    h.desfazerUm(f);
    expect([3, 4, 5].map((x) => lerCelula(f, x, 3).tipo)).toEqual(['piso', 'piso', 'piso']);
    expect(h.podeRefazer()).toBe(true);
    h.refazerUm(f);
    expect(lerCelula(f, 5, 3).tipo).toBe('parede');
  });

  it('desfazer o spawn movido devolve o spawn ao lugar antigo', () => {
    const f = nova();
    const h = new Historico();
    traco(f, h, [[6, 6]], { t: 'spawn' });
    h.desfazerUm(f);
    expect(f.spawn).toEqual({ x: 1, y: 1 });
  });

  it('cancelar o traço (segundo dedo) desfaz e não entra no histórico', () => {
    const f = nova();
    const h = new Historico();
    h.iniciarTraco();
    h.registrar(aplicarFerramenta(f, { t: 'terreno', tipo: 'vazio' }, 2, 2));
    h.registrar(aplicarFerramenta(f, { t: 'terreno', tipo: 'vazio' }, 3, 2));
    h.cancelarTraco(f);
    expect(lerCelula(f, 2, 2).tipo).toBe('piso');
    expect(h.podeDesfazer()).toBe(false);
  });

  it('guarda no máximo 120 traços; um traço novo limpa o refazer', () => {
    const f = novaFaseEditavel('t', 'T', 20, 20);
    const h = new Historico();
    for (let i = 0; i < 130; i++) traco(f, h, [[1 + (i % 18), 1 + Math.floor(i / 18)]], { t: 'terreno', tipo: 'parede' });
    let desfeitos = 0;
    while (h.desfazerUm(f).length > 0) desfeitos++;
    expect(desfeitos).toBe(120);
    h.refazerUm(f);
    traco(f, h, [[10, 10]], { t: 'terreno', tipo: 'saida' });
    expect(h.podeRefazer()).toBe(false);
  });
});

describe('fases do jogador no IndexedDB', () => {
  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory();
    esquecerConexao();
  });

  it('grava o rascunho (mesmo inválido), lista, carrega e apaga', async () => {
    const f = nova();
    f.spawn = null;
    await gravarAventura(f);
    expect((await listarAventuras()).map((a) => a.id)).toEqual(['t']);
    const lida = await carregarAventura('t');
    expect(lida && paraFaseJson(lida)).toEqual(paraFaseJson(f));
    await apagarAventura('t');
    expect(await carregarAventura('t')).toBeNull();
  });
});
