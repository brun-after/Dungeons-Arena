// Marco 17 (15/10/2026, D-063): equipamento gerado por semente e os efeitos novos dos atributos — o item nasce do id
// (o mesmo id, o mesmo item), fica mais forte com o nível e a raridade, cai do nível de quem morreu e a sala aceita;
// Sabedoria, Destreza, Constituição e Carisma passam a valer mais.

import { describe, expect, it } from 'vitest';
import { contextoDaArena } from '../../src/arena/contexto-arena';
import { conferirPersonagem, pedidoDoPersonagem } from '../../src/coop/personagem';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { criarRng } from '../../src/core/rng';
import { ATRIBUTOS_NEUTROS } from '../../src/entities/entidade';
import { criarJogador } from '../../src/entities/fabrica';
import { RARIDADES } from '../../src/modos/modo';
import { descontoNaLojaPct, manaPorSegundo, precoDeCompra, reducaoRecargaBasicoPct, vidaPorCelula } from '../../src/progression/efeitos-atributo';
import { gerarItem, idItemGerado, lerIdItemGerado, sortearItemGerado } from '../../src/progression/gerar-item';
import type { Item } from '../../src/progression/itens';
import { CONTEUDO } from '../apoio/fases';

const ctx = contextoDaArena();
const regras = BALANCE_PADRAO.itensGerados;
const bases = CONTEUDO.itensBase;

function obter<T>(v: T | undefined | null, nome: string): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

const pontos = (i: Item) => Object.values(i.bonusAtributos).reduce((s, b) => s + b.valor, 0);

describe('equipamento gerado', () => {
  it('o mesmo id dá o mesmo item; o catálogo resolve sob demanda; id inválido não existe', () => {
    const id = idItemGerado('espada', 7, 'raro', 12345);
    expect(lerIdItemGerado(id)).toEqual({ base: 'espada', nivel: 7, raridade: 'raro', semente: 12345 });
    expect(gerarItem(id, bases, regras)).toEqual(gerarItem(id, bases, regras));
    const item = obter(CONTEUDO.itens.get(id), 'item');
    expect(item).toMatchObject({ tipo: 'equipamento', slotPadrao: 'arma_principal', nivelMinimo: 7, raridade: 'raro' });
    expect(item.nome).toContain('rara');
    expect(CONTEUDO.itens.get('gi_dragao_7_raro_1')).toBeUndefined();
    expect(CONTEUDO.itens.get(idItemGerado('espada', 99, 'raro', 1))).toBeUndefined();
    // Iterar o catálogo dá só os fixos (os pools de drop e de loja não mudam).
    expect([...CONTEUDO.itens.keys()].some((k) => k.startsWith('gi_'))).toBe(false);
  });

  it('a força cresce com o nível e com a raridade', () => {
    const forca = (nivel: number, r: (typeof RARIDADES)[number]) => pontos(obter(gerarItem(idItemGerado('machado', nivel, r, 1), bases, regras), 'item'));
    expect(forca(10, 'comum')).toBeGreaterThan(forca(1, 'comum'));
    for (let i = 1; i < RARIDADES.length; i++) expect(forca(8, RARIDADES[i] ?? 'comum')).toBeGreaterThanOrEqual(forca(8, RARIDADES[i - 1] ?? 'comum'));
    expect(obter(gerarItem(idItemGerado('peitoral', 12, 'epico', 3), bases, regras), 'peitoral').bonusDefesa).toBeGreaterThan(2);
  });

  it('drops de nível alto puxam raridades melhores', () => {
    const media = (nivel: number) => {
      const rng = criarRng(99);
      let soma = 0;
      for (let i = 0; i < 400; i++) {
        const p = lerIdItemGerado(obter(sortearItemGerado(rng, nivel, bases, regras), 'id'));
        soma += RARIDADES.indexOf(p?.raridade ?? 'comum');
      }
      return soma / 400;
    };
    expect(media(15)).toBeGreaterThan(media(1));
  });

  it('a sala aceita o equipamento gerado do nível do personagem e tira o de nível acima', () => {
    const e = criarJogador(obter(CONTEUDO.classes.get('guerreiro'), 'guerreiro'), 'j1', 1, 1, BALANCE_PADRAO);
    const p = obter(pedidoDoPersonagem(e), 'pedido');
    p.nivel = 6;
    p.bolsa.pontosAtributo = 15;
    p.bolsa.equipamento.arma_principal = { invId: 'i9', itemId: idItemGerado('espada', 6, 'raro', 5), qtd: 1, ref: null };
    p.bolsa.equipamento.corpo = { invId: 'i10', itemId: idItemGerado('peitoral', 9, 'raro', 5), qtd: 1, ref: null };
    const r = obter(conferirPersonagem(p, ctx, 'p1', 'j'), 'conferido');
    expect(r.entidade.bolsa?.equipamento.arma_principal?.itemId).toBe(idItemGerado('espada', 6, 'raro', 5));
    expect(r.entidade.bolsa?.equipamento.corpo).toBeNull();
  });
});

describe('efeitos dos atributos', () => {
  const com = (nome: keyof typeof ATRIBUTOS_NEUTROS, v: number) => ({ ...ATRIBUTOS_NEUTROS, [nome]: v });

  it('Sabedoria regenera mais mana, sempre em mana inteira', () => {
    const b = BALANCE_PADRAO;
    const em60 = (sab: number) => Array.from({ length: 60 }, (_, i) => manaPorSegundo(com('sabedoria', sab), i + 1, b));
    expect(em60(10).every(Number.isInteger)).toBe(true);
    expect(em60(10).reduce((s, m) => s + m, 0)).toBe(30);
    expect(em60(30).reduce((s, m) => s + m, 0)).toBe(48);
    const sabio = em60(30);
    expect(sabio.every((m) => Number.isInteger(m))).toBe(true);
    expect(sabio.reduce((s, m) => s + m, 0)).toBeGreaterThan(60 * b.recursos.regenManaPorSegundo);
  });

  it('Destreza encurta o básico até o teto; Constituição cura mais por passo; Carisma dá desconto até o teto', () => {
    const b = BALANCE_PADRAO;
    expect(reducaoRecargaBasicoPct(com('destreza', 10), b)).toBe(0);
    expect(reducaoRecargaBasicoPct(com('destreza', 16), b)).toBeGreaterThan(0);
    expect(reducaoRecargaBasicoPct(com('destreza', 99), b)).toBe(b.atributos.efeitos.recargaBasicoMaxPct);
    expect(vidaPorCelula(com('constituicao', 30), b)).toBeGreaterThan(vidaPorCelula(com('constituicao', 10), b));
    expect(descontoNaLojaPct(com('carisma', 99), b)).toBe(b.atributos.efeitos.descontoMaxPct);
    expect(precoDeCompra(100, com('carisma', 20), b)).toBeLessThan(100);
    expect(precoDeCompra(1, com('carisma', 30), b)).toBe(1);
  });
});
