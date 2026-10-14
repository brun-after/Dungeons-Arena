// Marco 10A-1 (14/10/2026): portas internas, porta de saída, boss abrindo a passagem e troca de
// fase pura (`avancarFase`), D-052.

import { describe, expect, it } from 'vitest';
import type { Comando } from '../../src/core/comandos';
import type { ContextoSimulacao } from '../../src/core/contexto';
import { buscarEntidade, clonarEstado, criarEstado } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import type { Entidade } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { guardarItem } from '../../src/progression/inventario';
import { chaveDaFase, lerRegistro, VERSAO_SCHEMA, type RegistroProgresso } from '../../src/save/esquema';
import { avancarFase } from '../../src/save/transicao';
import { carregarFase, type FaseJson } from '../../src/world/fase';
import { povoarFase } from '../../src/world/populacao';
import { chaveRecargaPorta, processarPortas } from '../../src/world/portas';
import { validarFase } from '../../src/world/validacao-fase';
import fase02 from '../../src/data/fases/fase-02.json';
import { CONTEUDO, contexto, faseOficial01, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome: string): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

/** Sala 12×12 com um `S` em (10,10). */
const MAPA = SALA_ABERTA.map((l, y) => (y === 10 ? `${l.slice(0, 10)}S${l.slice(11)}` : l));

function fase(extra: Partial<FaseJson> = {}): FaseJson {
  return { id: 'p', nome: 'p', ordem: 1, tipo: 'campanha', mapa: MAPA, spawns: [{ x: 2, y: 2 }], ...extra };
}

function cenario(extra: Partial<FaseJson> = {}) {
  const r = validarFase(fase(extra), new Set(CONTEUDO.presets.keys()), CONTEUDO.itens);
  if (!r.ok) throw new Error(JSON.stringify(r.erros));
  const ctx: ContextoSimulacao = contexto(carregarFase(r.fase));
  const estado = criarEstado({ semente: 4, faseId: 'p' });
  const classe = obter(CONTEUDO.classes.get('aventureiro'), 'classe');
  estado.entidades.push(criarJogador(classe, 'j', 2, 2, ctx.balance));
  povoarFase(estado, ctx);
  const eventos: EventoSimulacao[] = [];
  const j = (): Entidade => obter(buscarEntidade(estado, 'j'), 'j');
  const tick = (...cmds: Comando[]) => {
    simular(estado, ctx, cmds.map((cmd) => ({ tick: estado.tick, entidadeId: 'j', cmd })), eventos, DT_MS);
  };
  const ir = (x: number, y: number, ticks = 600) => {
    tick({ t: 'irPara', x, y });
    for (let i = 0; i < ticks; i++) tick();
  };
  const de = <T extends EventoSimulacao['t']>(t: T) => eventos.filter((e): e is Extract<EventoSimulacao, { t: T }> => e.t === t);
  return { ctx, estado, eventos, j, tick, ir, de };
}

const PAR = [{ numero: 1, nome: 'atalho', a: { x: 4, y: 2 }, b: { x: 8, y: 8 } }];

describe('porta interna (§2.1)', () => {
  it('pisar num extremo leva ao outro; parado em cima não volta', () => {
    const c = cenario({ portasInternas: PAR });
    c.ir(4, 2, 120);
    expect([c.j().x, c.j().y]).toEqual([8, 8]);
    expect(c.de('teleportou')).toMatchObject([{ id: 'j', numero: 1, x: 8, y: 8 }]);
    expect(c.estado.recargas[chaveRecargaPorta('j')]).toBeGreaterThan(c.estado.tick - 120);
  });

  it('com a recarga ativa, chegar à porta não teleporta', () => {
    const c = cenario({ portasInternas: PAR });
    c.estado.recargas[chaveRecargaPorta('j')] = 10_000;
    c.ir(4, 2, 120);
    expect([c.j().x, c.j().y]).toEqual([4, 2]);
    expect(c.de('teleportou')).toHaveLength(0);
  });

  it('destino ocupado: desvia para um vizinho livre; NPC cruza pela chance do modo', () => {
    const c = cenario({ portasInternas: PAR });
    const sempre: ContextoSimulacao = { ...c.ctx, modo: { ...c.ctx.modo, portas: { inimigosCruzamChance: 1 } } };
    const nunca: ContextoSimulacao = { ...c.ctx, modo: { ...c.ctx.modo, portas: { inimigosCruzamChance: 0 } } };
    const goblin = obter(CONTEUDO.presets.get('goblin'), 'goblin');
    const viajante = criarInimigo(goblin, 'g1', 4, 2, c.ctx.balance);
    const parado = criarInimigo(goblin, 'g2', 8, 8, c.ctx.balance);
    c.estado.entidades.push(viajante, parado);
    c.tick(); // cria o estado da IA
    Object.assign(viajante, { x: 4, y: 2, destinoX: 4, destinoY: 2, progressoPasso: 0 });
    Object.assign(parado, { x: 8, y: 8, destinoX: 8, destinoY: 8, progressoPasso: 0 });
    const chegou = (): EventoSimulacao[] => [{ t: 'moveu', tick: c.estado.tick, id: 'g1', x: 4, y: 2 }];
    processarPortas(c.estado, nunca, chegou());
    expect([viajante.x, viajante.y]).toEqual([4, 2]);
    const saida = chegou();
    processarPortas(c.estado, sempre, saida);
    expect([viajante.x, viajante.y]).toEqual([8, 7]);
    expect(saida.some((e) => e.t === 'teleportou')).toBe(true);
  });
});

describe('porta de saída (§2.1)', () => {
  it('sem portaSaida, toda célula S é saída livre', () => {
    const c = cenario();
    c.ir(10, 10);
    expect(c.de('saidaAlcancada')).toMatchObject([{ id: 'j' }]);
  });

  it('tranca de chave: sem a chave recusa; com ela, consome a chave e abre de vez', () => {
    const c = cenario({ portaSaida: { x: 10, y: 10, tranca: 'chave', chave: 'chave_cripta' } });
    c.ir(10, 10);
    expect(c.de('saidaTrancada')).toMatchObject([{ motivo: 'chave' }]);
    expect(c.de('saidaAlcancada')).toHaveLength(0);
    const chave = obter(CONTEUDO.itens.get('chave_cripta'), 'chave');
    guardarItem(obter(c.j().bolsa, 'bolsa'), chave, 1, c.ctx.balance.inventario);
    c.ir(9, 10, 60);
    c.ir(10, 10, 60);
    expect(c.de('saidaAlcancada')).toHaveLength(1);
    expect(c.estado.saidaAberta).toBe(true);
    expect(c.j().bolsa?.mochila.some((i) => i.itemId === 'chave_cripta')).toBe(false);
  });

  it('tranca de boss: vivo bloqueia; morto destranca e a saída fica aberta', () => {
    const c = cenario({ inimigos: [{ preset: 'boneco', x: 6, y: 6 }], portaSaida: { x: 10, y: 10, tranca: 'boss', bossIndice: 0 } });
    c.ir(10, 10);
    expect(c.de('saidaTrancada')).toMatchObject([{ motivo: 'boss' }]);
    obter(buscarEntidade(c.estado, 'i000'), 'boss').hp = 0;
    c.tick();
    expect(c.estado.saidaAberta).toBe(true);
    expect(c.de('saidaDestrancada')).toMatchObject([{ motivo: 'boss' }]);
    c.ir(9, 10, 60);
    c.ir(10, 10, 60);
    expect(c.de('saidaAlcancada')).toHaveLength(1);
  });

  it('boss morto numa fase sem saída deixa uma porta temporária que leva adiante', () => {
    const c = cenario({ mapa: SALA_ABERTA });
    const boss = criarInimigo(obter(CONTEUDO.presets.get('boss'), 'boss'), 'b', 6, 6, c.ctx.balance);
    boss.hp = 0;
    c.estado.entidades.push(boss);
    c.tick();
    const porta = obter(c.estado.objetos.find((o) => o.tipo === 'saida'), 'porta');
    expect([porta.x, porta.y]).toEqual([6, 6]);
    c.ir(6, 6);
    expect(c.de('saidaAlcancada')).toHaveLength(1);
    expect(c.estado.objetos.some((o) => o.tipo === 'saida')).toBe(true);
  });

  it('a validação confere célula S, chave, boss e portas internas', () => {
    const v = (extra: Partial<FaseJson>) => validarFase(fase(extra), new Set(CONTEUDO.presets.keys()), CONTEUDO.itens).ok;
    expect(v({ portaSaida: { x: 5, y: 5, tranca: 'livre' } })).toBe(false);
    expect(v({ portaSaida: { x: 10, y: 10, tranca: 'chave', chave: 'adaga' } })).toBe(false);
    expect(v({ portaSaida: { x: 10, y: 10, tranca: 'boss', bossIndice: 3 } })).toBe(false);
    expect(v({ portasInternas: [{ numero: 1, nome: 'x', a: { x: 0, y: 0 }, b: { x: 5, y: 5 } }] })).toBe(false);
    expect(v({ portaSaida: { x: 10, y: 10, tranca: 'livre' }, portasInternas: PAR })).toBe(true);
  });

  it('as fases oficiais: a 1 fecha a saída com o boss; a 2 com a chave da cripta e um atalho', () => {
    expect(faseOficial01().portaSaida).toMatchObject({ tranca: 'boss', bossIndice: 7 });
    const r = validarFase(fase02, new Set(CONTEUDO.presets.keys()), CONTEUDO.itens);
    if (!r.ok) throw new Error(JSON.stringify(r.erros));
    const f2 = carregarFase(r.fase);
    expect(f2.portaSaida).toMatchObject({ tranca: 'chave', chave: 'chave_cripta' });
    expect(f2.portasInternas).toHaveLength(1);
    expect(f2.objetos.find((o) => o.tipo === 'bau')?.itens).toContain('chave_cripta');
  });
});

describe('troca de fase (avancarFase)', () => {
  function registro(): { r: RegistroProgresso; ctx: ContextoSimulacao } {
    const ctx = contexto(faseOficial01());
    const estado = criarEstado({ semente: 1, faseId: 'fase-01' });
    const classe = obter(CONTEUDO.classes.get('aventureiro'), 'classe');
    const j = criarJogador(classe, 'j1', 5, 5, ctx.balance);
    const bolsa = obter(j.bolsa, 'bolsa');
    bolsa.ouro = 77;
    j.nivel = 3;
    j.hp = 5;
    estado.entidades.push(j);
    povoarFase(estado, ctx);
    const r: RegistroProgresso = {
      versaoSchema: VERSAO_SCHEMA,
      slot: 1,
      criadoEm: 1,
      atualizadoEm: 2,
      faseRef: { tipo: 'oficial', id: 'fase-01' },
      nomeFase: 'Salões',
      estado,
      estatisticas: { inimigosDerrotados: 0, mortes: 0 },
      fasesVisitadas: {},
    };
    return { r, ctx };
  }
  const destino = (id: string, spawn = { x: 4, y: 4 }) => ({
    ref: { tipo: 'oficial', id } as const,
    nome: id,
    spawn,
    novoEstado: () => criarEstado({ semente: 9, faseId: id }),
  });

  it('o personagem leva ficha, mochila e ouro, com vida cheia; a fase deixada fica guardada sem ele', () => {
    const { r } = registro();
    const novo = avancarFase(r, destino('fase-02'), 3);
    const j = obter(novo.estado.entidades.find((e) => e.bolsa), 'jogador');
    expect(novo.faseRef).toEqual({ tipo: 'oficial', id: 'fase-02' });
    expect([j.id, j.x, j.y, j.nivel, j.bolsa?.ouro, j.hp]).toEqual(['j1', 4, 4, 3, 77, j.hpMax]);
    const guardada = obter(novo.fasesVisitadas[chaveDaFase(r.faseRef)], 'fase-01 guardada');
    expect(guardada.entidades.some((e) => e.bolsa)).toBe(false);
    expect(guardada.entidades.length).toBe(r.estado.entidades.length - 1);
    expect(r.estado.entidades.some((e) => e.bolsa)).toBe(true);
  });

  it('voltar a uma fase visitada restaura o estado guardado, e o registro relê sem erro', () => {
    const { r } = registro();
    r.estado.objetos = r.estado.objetos.filter((o) => o.tipo !== 'loja');
    const ida = avancarFase(r, destino('fase-02'), 3);
    const volta = avancarFase(ida, destino('fase-01', { x: 5, y: 5 }), 4);
    expect(volta.estado.objetos.some((o) => o.tipo === 'loja')).toBe(false);
    expect(Object.keys(volta.fasesVisitadas)).toEqual([chaveDaFase({ tipo: 'oficial', id: 'fase-02' })]);
    const lido = lerRegistro(JSON.parse(JSON.stringify(volta)));
    expect(lido.ok).toBe(true);
  });

  it('save v5 abre na versão atual com a saída fechada e sem fases visitadas', () => {
    const { r } = registro();
    const estado = JSON.parse(JSON.stringify(clonarEstado(r.estado))) as Record<string, unknown>;
    delete estado.saidaAberta;
    const lido = lerRegistro({ versaoSchema: 5, slot: 1, criadoEm: 1, atualizadoEm: 2, faseRef: r.faseRef, nomeFase: 'x', estado });
    if (!lido.ok) throw new Error(lido.erro);
    expect(lido.registro.versaoSchema).toBe(VERSAO_SCHEMA);
    expect(lido.registro.estado.saidaAberta).toBe(false);
    expect(lido.registro.fasesVisitadas).toEqual({});
  });
});
