// Marco 29 (30/10/2026, D-128): os objetos do Mundo: coleta com canal (o dano interrompe), túmulo da morte fora de
// dungeon, os pedidos ao servidor e os objetos montados a partir do exterior.

import { describe, expect, it } from 'vitest';
import type { Comando } from '../../src/core/comandos';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { buscarEntidade, criarEstado, type ObjetoNoMundo } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import { ticksDe } from '../../src/core/tempo';
import type { Entidade } from '../../src/entities/entidade';
import { criarJogador } from '../../src/entities/fabrica';
import { criarTumulo, objetosDoExterior } from '../../src/mundo/objetos-mundo';
import { guardarItem } from '../../src/progression/inventario';
import { gerarExterior } from '../../src/world/gerador-exterior';
import { novoObjeto } from '../../src/world/objetos';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome: string): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

const CANAL = ticksDe(BALANCE_PADRAO.mundo.coleta.canalMs);

function cenario(modoId = 'mundo') {
  const ctx = contexto(faseDeTexto(SALA_ABERTA), BALANCE_PADRAO, modoId);
  const estado = criarEstado({ semente: 5, faseId: 'teste' });
  const classe = obter(CONTEUDO.classes.get('guerreiro'), 'classe');
  for (const [id, x, y] of [['j', 3, 5], ['outro', 8, 8]] as const) estado.entidades.push(criarJogador(classe, id, x, y, BALANCE_PADRAO));
  const eventos: EventoSimulacao[] = [];
  const e = (id = 'j'): Entidade => obter(buscarEntidade(estado, id), id);
  const tick = (id = 'j', ...cmds: Comando[]) => {
    simular(estado, ctx, cmds.map((cmd) => ({ tick: estado.tick, entidadeId: id, cmd })), eventos, DT_MS);
  };
  const avancar = (n: number) => {
    for (let i = 0; i < n; i++) tick();
  };
  const de = <T extends EventoSimulacao['t']>(t: T) => eventos.filter((x): x is Extract<EventoSimulacao, { t: T }> => x.t === t);
  const objeto = (o: ObjetoNoMundo) => {
    estado.objetos.push(o);
    return o;
  };
  return { ctx, estado, eventos, e, tick, avancar, de, objeto };
}

const qtdNaMochila = (e: Entidade, itemId: string) => (e.bolsa?.mochila ?? []).filter((m) => m.itemId === itemId).reduce((s, m) => s + m.qtd, 0);

describe('coleta', () => {
  it('canaliza, entrega o material e o nó renasce depois do prazo', () => {
    const c = cenario();
    const no = c.objeto(novoObjeto('n1', 'coleta', 4, 5, { itemId: 'minerio_ferro' }));
    c.tick('j', { t: 'interagir' });
    expect(c.e().interacao?.tipo).toBe('coleta');
    c.avancar(CANAL + 1);
    expect(qtdNaMochila(c.e(), 'minerio_ferro')).toBe(1);
    expect(c.de('coletado')).toHaveLength(1);
    expect(no.abertoTick).toBeGreaterThan(0);
    // Coletado: ninguém coleta de novo até renascer.
    c.tick('j', { t: 'interagir' });
    expect(c.e().interacao).toBeNull();
    c.avancar(ticksDe(BALANCE_PADRAO.mundo.coleta.renascerS * 1000) + 1);
    expect(no.abertoTick).toBe(0);
  });

  it('o dano durante o canal interrompe e o nó fica livre', () => {
    const c = cenario();
    const no = c.objeto(novoObjeto('n1', 'coleta', 4, 5, { itemId: 'erva_curativa' }));
    c.tick('j', { t: 'interagir' });
    c.avancar(5);
    c.e().participacao.push({ id: 'lobo', tick: c.estado.tick });
    c.avancar(CANAL);
    expect(qtdNaMochila(c.e(), 'erva_curativa')).toBe(0);
    expect(c.de('itemRecusado').map((x) => x.motivo)).toContain('interrompido');
    expect(no.abertoTick).toBe(0);
    expect(no.abridorId).toBeNull();
  });
});

describe('túmulo', () => {
  function morrerCom(c: ReturnType<typeof cenario>) {
    const bolsa = obter(c.e().bolsa, 'bolsa');
    expect(guardarItem(bolsa, obter(CONTEUDO.itens.get('pocao_vida'), 'pocao'), 2, BALANCE_PADRAO.inventario)).toBe(true);
    bolsa.personagemId = 'pers-j';
    const jaLevava = Object.values(bolsa.equipamento).filter((x) => x !== null).length + bolsa.mochila.reduce((s, m) => s + m.qtd, 0) - 2;
    criarTumulo(c.estado, c.ctx, c.e(), c.eventos);
    return { bolsa, jaLevava };
  }

  it('leva a mochila e o equipado; fora do PvP só o dono abre no começo', () => {
    const c = cenario();
    const { bolsa, jaLevava } = morrerCom(c);
    expect(bolsa.mochila).toHaveLength(0);
    expect(Object.values(bolsa.equipamento).every((x) => x === null)).toBe(true);
    const t = obter(c.estado.objetos.find((o) => o.tipo === 'tumulo'), 'túmulo');
    expect(t.itens.length).toBe(2 + jaLevava);
    // O outro jogador vai até o túmulo: trancado.
    const outro = c.e('outro');
    outro.x = t.x + 1;
    outro.y = t.y;
    outro.px = outro.x;
    outro.py = outro.y;
    c.tick('outro', { t: 'interagir' });
    expect(c.de('itemRecusado').some((x) => x.id === 'outro' && x.motivo === 'trancado')).toBe(true);
    // O dono abre e leva de volta.
    c.tick('j', { t: 'interagir' });
    expect(qtdNaMochila(c.e(), 'pocao_vida')).toBeGreaterThanOrEqual(2);
    c.avancar(1);
    expect(c.estado.objetos.some((o) => o.tipo === 'tumulo')).toBe(false);
  });

  it('com PvP (fogo amigo), qualquer um abre na hora', () => {
    const c = cenario();
    const ctxPvp = { ...c.ctx, modo: { ...c.ctx.modo, fogoAmigo: true } };
    const bolsa = obter(c.e().bolsa, 'bolsa');
    expect(guardarItem(bolsa, obter(CONTEUDO.itens.get('pocao_vida'), 'pocao'), 1, BALANCE_PADRAO.inventario)).toBe(true);
    criarTumulo(c.estado, ctxPvp, c.e(), c.eventos);
    const t = obter(c.estado.objetos.find((o) => o.tipo === 'tumulo'), 'túmulo');
    expect(t.valor).toBe(c.estado.tick);
  });

  it('some no prazo, mesmo cheio', () => {
    const c = cenario();
    morrerCom(c);
    c.avancar(ticksDe(BALANCE_PADRAO.mundo.tumulo.duracaoS * 1000) + 1);
    expect(c.estado.objetos.some((o) => o.tipo === 'tumulo')).toBe(false);
  });

  it('a regra do modo cria o túmulo na morte só no Mundo', () => {
    expect(contexto(faseDeTexto(SALA_ABERTA), BALANCE_PADRAO, 'mundo').modo.tumuloNaMorte).toBe(true);
    expect(contexto(faseDeTexto(SALA_ABERTA), BALANCE_PADRAO, 'campanha').modo.tumuloNaMorte).toBeUndefined();
  });
});

describe('pedidos ao servidor e objetos do exterior', () => {
  it('a pedra de save pede ao servidor sem congelar', () => {
    const c = cenario();
    c.objeto(novoObjeto('s1', 'pedra_save', 4, 5, { ref: 'save' }));
    c.tick('j', { t: 'interagir' });
    expect(c.de('pedidoDoMundo')).toEqual([expect.objectContaining({ id: 'j', tipo: 'pedra_save', ref: 'save' })]);
    expect(c.e().interacao).toBeNull();
  });

  it('a vila do centro tem lojas com estoque, pedras, quadro de missões e coleta', () => {
    const reino = obter(CONTEUDO.reinos.get('reino_central'), 'reino');
    const regiao = obter(reino.regioes.find((r) => r.id === 'vila_do_centro'), 'região');
    const objetos = objetosDoExterior(reino, gerarExterior(reino, regiao));
    const lojas = objetos.filter((o) => o.tipo === 'loja');
    expect(lojas.map((o) => o.ref).sort()).toEqual(['alquimista', 'ferreiro', 'mercador']);
    expect(lojas.find((o) => o.ref === 'alquimista')?.itens).toContain('pergaminho_retorno');
    expect(objetos.some((o) => o.tipo === 'pedra_save')).toBe(true);
    expect(objetos.some((o) => o.tipo === 'pedra_portal')).toBe(true);
    expect(objetos.some((o) => o.tipo === 'npc' && o.ref === 'missoes')).toBe(true);
    expect(objetos.filter((o) => o.tipo === 'coleta').length).toBeGreaterThan(5);
  });
});
