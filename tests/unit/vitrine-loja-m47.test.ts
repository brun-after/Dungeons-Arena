// Marco 47 (20/11/2026, D-190): a vitrine de armadura gerada das lojas — determinística pela semente e pela rodada,
// renovada a cada dia do Mundo, com todos os propósitos, preço pela raridade, pelo grau e pelos efeitos.

import { describe, expect, it } from 'vitest';
import { criarEstado } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { criarJogador } from '../../src/entities/fabrica';
import { aplicarEstoqueDaDungeon, marcarVitrinesDaVila } from '../../src/mundo/lojas-mundo';
import { territorioDoLugar } from '../../src/mundo/reino';
import { RARIDADES } from '../../src/modos/modo';
import { lerIdItemGerado } from '../../src/progression/gerar-item';
import { ehPecaDeArmadura } from '../../src/progression/graus';
import { precoDoItem } from '../../src/progression/itens-progressao';
import { comprar, estoqueDaLoja } from '../../src/progression/loja';
import { lerLojas, periodoDaRodada, precoDaPeca, ticksAteRenovar, vitrineDaLoja } from '../../src/progression/vitrine';
import { novoObjeto } from '../../src/world/objetos';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome = 'dado'): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

const VILA = obter(CONTEUDO.lojas.perfis.get(CONTEUDO.lojas.perfilPadrao), 'perfil da vila');
const PROPOSITOS = [...CONTEUDO.pecas.propositos.keys()];
const indiceDe = (r: string) => RARIDADES.indexOf(r as (typeof RARIDADES)[number]);

function cena(ref: string | null = null) {
  const ctx = contexto(faseDeTexto(SALA_ABERTA));
  const estado = criarEstado({ semente: 17, faseId: 'teste' });
  const j = criarJogador(obter(CONTEUDO.classes.get('guerreiro')), 'j', 3, 3, ctx.balance);
  estado.entidades.push(j);
  const loja = novoObjeto('loja', 'loja', 3, 3, { ref, itens: ['pocao_vida', 'elmo_ferro'] });
  estado.objetos.push(loja);
  j.interacao = { tipo: 'loja', objetoId: loja.objetoId, ateTick: 9_999_999 };
  const eventos: EventoSimulacao[] = [];
  return { ctx, estado, j, b: obter(j.bolsa), loja, eventos };
}

describe('vitrine de armadura (D-190)', () => {
  it('lê data/lojas.json sem erros e recusa perfil inexistente', () => {
    expect(CONTEUDO.lojas.oficios).toContain('ferreiro');
    expect(lerLojas({ oficios: [], semOficio: false, perfilPadrao: 'x', perfilDungeon: 'x', perfis: {}, preco: { multRaridade: {}, porGrauPct: 0, porEfeitoPct: 0 } }).erros.length).toBeGreaterThan(0);
  });

  it('é determinística na rodada e muda na seguinte', () => {
    const c = cena();
    const a = vitrineDaLoja(c.estado, c.ctx, c.loja);
    expect(a).toHaveLength(VILA.quantidade);
    expect(vitrineDaLoja(c.estado, c.ctx, c.loja)).toEqual(a);
    const periodo = periodoDaRodada(c.ctx);
    const faltam = obter(ticksAteRenovar(c.estado, c.ctx, c.loja), 'renovação');
    expect(faltam).toBeGreaterThan(0);
    expect(faltam).toBeLessThanOrEqual(periodo);
    c.estado.tick += faltam - 1;
    expect(vitrineDaLoja(c.estado, c.ctx, c.loja)).toEqual(a);
    c.estado.tick += 1;
    expect(vitrineDaLoja(c.estado, c.ctx, c.loja)).not.toEqual(a);
  });

  it('cada rodada traz só armadura gerada, de todos os propósitos, até raro e na faixa de nível', () => {
    const c = cena();
    const periodo = periodoDaRodada(c.ctx);
    for (let rodada = 0; rodada < 30; rodada++) {
      c.estado.tick = rodada * periodo;
      const ids = vitrineDaLoja(c.estado, c.ctx, c.loja);
      expect(new Set(ids).size).toBe(ids.length);
      const itens = ids.map((id) => obter(CONTEUDO.itens.get(id), id));
      expect(new Set(itens.map((i) => i.peca?.proposito))).toEqual(new Set(PROPOSITOS));
      for (const i of itens) {
        expect(ehPecaDeArmadura(i.slotPadrao)).toBe(true);
        expect(indiceDe(i.raridade)).toBeLessThanOrEqual(indiceDe('raro'));
        const nivel = obter(lerIdItemGerado(i.id), i.id).nivel;
        expect(nivel).toBeGreaterThanOrEqual(1);
        expect(nivel).toBeLessThanOrEqual(1 + VILA.folgaNivel[1]);
      }
      // A lista fixa continua à venda junto com a vitrine.
      expect(estoqueDaLoja(c.estado, c.ctx, c.loja)).toEqual(expect.arrayContaining(['pocao_vida', 'elmo_ferro', ...ids]));
    }
  });

  it('só as lojas com ofício de armadura têm vitrine', () => {
    expect(vitrineDaLoja(cena('ferreiro').estado, cena('ferreiro').ctx, cena('ferreiro').loja)).toHaveLength(VILA.quantidade);
    const m = cena('mercado');
    expect(vitrineDaLoja(m.estado, m.ctx, m.loja)).toEqual([]);
    const a = cena('alquimista');
    expect(vitrineDaLoja(a.estado, a.ctx, a.loja)).toEqual([]);
  });

  it('no Mundo, a sala marca o ferreiro com o dia do ciclo e o nível da região', () => {
    const c = cena('ferreiro');
    const mercado = novoObjeto('mercado', 'loja', 4, 4, { ref: 'mercado' });
    c.estado.objetos.push(mercado);
    marcarVitrinesDaVila(c.estado.objetos, c.ctx, 7, [10, 14]);
    expect(c.loja).toMatchObject({ vitrine: CONTEUDO.lojas.perfilPadrao, rodadaVitrine: 7, nivelVitrine: 12 });
    expect(mercado.vitrine).toBeUndefined();
    const dia7 = vitrineDaLoja(c.estado, c.ctx, c.loja);
    for (const id of dia7) expect(obter(lerIdItemGerado(id), id).nivel).toBeGreaterThanOrEqual(12 + VILA.folgaNivel[0]);
    // O tick não muda a vitrine marcada; o dia seguinte, sim.
    c.estado.tick += periodoDaRodada(c.ctx) * 3;
    expect(vitrineDaLoja(c.estado, c.ctx, c.loja)).toEqual(dia7);
    expect(ticksAteRenovar(c.estado, c.ctx, c.loja)).toBeNull();
    marcarVitrinesDaVila(c.estado.objetos, c.ctx, 8, [10, 14]);
    expect(vitrineDaLoja(c.estado, c.ctx, c.loja)).not.toEqual(dia7);
  });

  it('a loja da dungeon traz peças a partir de incomum, renovadas com a semana', () => {
    const reino = obter(CONTEUDO.reinos.get('reino_central'), 'reino');
    const d = { id: 'teste_dungeon', nivel: 30 };
    const c = cena();
    aplicarEstoqueDaDungeon(c.estado.objetos, c.ctx, territorioDoLugar(reino, d.id), d, 100);
    const semana = vitrineDaLoja(c.estado, c.ctx, c.loja);
    const perfil = obter(CONTEUDO.lojas.perfis.get(CONTEUDO.lojas.perfilDungeon), 'perfil da dungeon');
    expect(semana).toHaveLength(perfil.quantidade);
    for (const id of semana) expect(indiceDe(obter(CONTEUDO.itens.get(id), id).raridade)).toBeGreaterThanOrEqual(indiceDe('incomum'));
    expect(c.loja.itens).toContain('pergaminho_retorno');
    aplicarEstoqueDaDungeon(c.estado.objetos, c.ctx, territorioDoLugar(reino, d.id), d, 101);
    expect(vitrineDaLoja(c.estado, c.ctx, c.loja)).not.toEqual(semana);
  });

  it('o preço sobe com a raridade, o grau e os efeitos', () => {
    const c = cena();
    const r = CONTEUDO.lojas;
    for (let rodada = 0; rodada < 10; rodada++) {
      c.estado.tick = rodada * periodoDaRodada(c.ctx);
      for (const id of vitrineDaLoja(c.estado, c.ctx, c.loja)) {
        const item = obter(CONTEUDO.itens.get(id), id);
        const p = obter(item.peca, 'perfil');
        const esperado = Math.round(item.valorBase * r.preco.multRaridade[item.raridade] * (1 + (r.preco.porGrauPct * p.grau) / 100) * (1 + (r.preco.porEfeitoPct * p.efeitos.length) / 100));
        expect(precoDaPeca(r, item)).toBe(esperado);
        expect(precoDaPeca(r, item)).toBeGreaterThanOrEqual(item.valorBase);
      }
    }
    const pocao = obter(CONTEUDO.itens.get('pocao_vida'), 'poção');
    expect(precoDaPeca(r, pocao)).toBe(pocao.valorBase);
  });

  it('compra a peça da vitrine pelo preço e recusa a de outra rodada sem cobrar', () => {
    const c = cena();
    c.b.ouro = 1_000_000;
    const [id] = vitrineDaLoja(c.estado, c.ctx, c.loja);
    const item = obter(CONTEUDO.itens.get(obter(id)), 'peça');
    const preco = precoDoItem(item, c.j, c.ctx);
    comprar(c.estado, c.ctx, c.j, item.id, c.eventos);
    expect(c.b.ouro).toBe(1_000_000 - preco);
    expect(c.b.mochila.some((m) => m.itemId === item.id)).toBe(true);
    expect(c.eventos).toContainEqual(expect.objectContaining({ t: 'comprou', itemId: item.id, preco }));
    // Na rodada seguinte, a peça antiga sai do estoque: a compra é recusada e nada é cobrado.
    c.estado.tick += obter(ticksAteRenovar(c.estado, c.ctx, c.loja), 'renovação');
    expect(estoqueDaLoja(c.estado, c.ctx, c.loja)).not.toContain(item.id);
    const ouro = c.b.ouro;
    comprar(c.estado, c.ctx, c.j, item.id, c.eventos);
    expect(c.b.ouro).toBe(ouro);
    expect(c.b.mochila.filter((m) => m.itemId === item.id)).toHaveLength(1);
  });
});
