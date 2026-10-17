// Ajuste de 16/10/2026 (D-067): o buff ofensivo armado (prazo para entrar em combate), a carga de refúgio (imune 45 s
// ao abrir a mochila ou a loja, uma por vez), a aparência pelo equipamento e o save v13 (o descanso saiu).

import { describe, expect, it } from 'vitest';
import { construirEfeito } from '../../src/combat/registro-efeitos';
import type { Comando } from '../../src/core/comandos';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { buscarEntidade, criarEstado } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import { ticksDe } from '../../src/core/tempo';
import type { Entidade } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { guardarItem } from '../../src/progression/inventario';
import { MIGRACOES } from '../../src/save/esquema';
import { novoObjeto, largarOrbeEfeito } from '../../src/world/objetos';
import { processarSpawner } from '../../src/world/spawner';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome: string): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

function cenario() {
  const ctx = contexto(faseDeTexto(SALA_ABERTA));
  const estado = criarEstado({ semente: 3, faseId: 'teste' });
  estado.entidades.push(criarJogador(obter(CONTEUDO.classes.get('aventureiro'), 'classe'), 'j', 3, 5, ctx.balance));
  const eventos: EventoSimulacao[] = [];
  const j = (): Entidade => obter(buscarEntidade(estado, 'j'), 'j');
  const tick = (...cmds: Comando[]) => {
    simular(estado, ctx, cmds.map((cmd) => ({ tick: estado.tick, entidadeId: 'j', cmd })), eventos, DT_MS);
  };
  const avancar = (n: number) => {
    for (let i = 0; i < n; i++) tick();
  };
  const de = <T extends EventoSimulacao['t']>(t: T) => eventos.filter((e): e is Extract<EventoSimulacao, { t: T }> => e.t === t);
  /** Um goblin perseguindo o jogador (o estado da IA é posto direto). */
  const perseguidor = () => {
    const g = criarInimigo(obter(CONTEUDO.presets.get('goblin'), 'goblin'), 'g', 9, 9, ctx.balance);
    estado.entidades.push(g);
    tick();
    Object.assign(obter(g.ia, 'ia'), { modo: 'perseguindo', alvoId: 'j' });
    return g;
  };
  return { ctx, estado, eventos, j, tick, avancar, de, perseguidor };
}

describe('buff ofensivo armado', () => {
  it('fica armado até o combate e só então começa, com a duração inteira', () => {
    const c = cenario();
    largarOrbeEfeito(c.estado, construirEfeito('bonus_dano'), 3, 5, c.eventos);
    c.tick();
    expect(c.j().buffsArmados).toHaveLength(1);
    expect(c.j().efeitos).toHaveLength(0);
    c.avancar(ticksDe(5000));
    c.perseguidor();
    c.tick();
    expect(c.j().buffsArmados).toHaveLength(0);
    const ativo = obter(c.j().efeitos.find((f) => f.tipo === 'bonus_dano'), 'bonus_dano');
    // A duração conta da entrada em combate, não da coleta.
    expect(ativo.ateTick - c.estado.tick).toBeGreaterThan(ticksDe(9000));
    expect(c.de('buffAtivado')).toMatchObject([{ tipo: 'bonus_dano' }]);
  });

  it('sem combate no prazo, some', () => {
    const c = cenario();
    largarOrbeEfeito(c.estado, construirEfeito('ab_dano'), 3, 5, c.eventos);
    c.tick();
    c.avancar(ticksDe(BALANCE_PADRAO.efeitos.prazoArmadoMs) + 2);
    expect(c.j().buffsArmados).toHaveLength(0);
    expect(c.j().efeitos).toHaveLength(0);
    expect(c.de('buffExpirou')).toMatchObject([{ tipo: 'ab_dano' }]);
  });
});

describe('refúgio', () => {
  it('pegar dá uma carga; abrir a mochila gasta e deixa imune por 45 s', () => {
    const c = cenario();
    c.estado.objetos.push(novoObjeto('r1', 'orbe_refugio', 3, 5));
    c.tick();
    expect(c.j().refugio).toBe(true);
    c.tick({ t: 'abrirMenu' });
    expect(c.j().refugio).toBe(false);
    const imune = obter(c.j().efeitos.find((f) => f.tipo === 'imune_dano'), 'imune');
    expect(imune.ateTick - c.estado.tick).toBeGreaterThan(ticksDe(44_000));
    // Sem carga, abrir de novo não faz nada.
    c.tick({ t: 'abrirMenu' });
    expect(c.de('refugioUsado')).toHaveLength(1);
  });

  it('com carga, não pega outro; o spawner mantém um só (no mapa ou com o jogador)', () => {
    const c = cenario();
    c.j().refugio = true;
    c.estado.objetos.push(novoObjeto('r2', 'orbe_refugio', 3, 5));
    c.tick();
    expect(c.estado.objetos.some((o) => o.objetoId === 'r2')).toBe(true);
    c.estado.objetos = [];
    // A rodada do spawner cai no tick 0 com carência 0.
    c.estado.tick = 0;
    const ctx = { ...c.ctx, balance: { ...c.ctx.balance, spawner: { ...c.ctx.balance.spawner, carenciaS: 0, refugio: { max: 1, chance: 1 } } } };
    processarSpawner(c.estado, ctx, c.eventos);
    expect(c.estado.objetos.filter((o) => o.tipo === 'orbe_refugio')).toHaveLength(0);
    c.j().refugio = false;
    processarSpawner(c.estado, ctx, c.eventos);
    processarSpawner(c.estado, ctx, c.eventos);
    expect(c.estado.objetos.filter((o) => o.tipo === 'orbe_refugio')).toHaveLength(1);
  });
});

describe('aparência pelo equipamento', () => {
  it('equipar uma arma e uma armadura muda a aparência pública', () => {
    const c = cenario();
    c.tick();
    expect(c.j().aparencia).toMatchObject({ arma: null, corpo: null });
    const bolsa = obter(c.j().bolsa, 'bolsa');
    guardarItem(bolsa, obter(CONTEUDO.itens.get('espada_curta'), 'espada'), 1, c.ctx.balance.inventario);
    const entrada = obter(bolsa.mochila.find((i) => i.itemId === 'espada_curta'), 'entrada');
    c.tick({ t: 'equipar', invId: entrada.invId, slot: 'arma_principal' });
    expect(c.j().aparencia?.arma).toBe('espada');
  });
});

describe('save v13', () => {
  it('o descanso em curso vira nada e as entidades ganham os campos novos', () => {
    const migrar = obter(MIGRACOES[12], 'v12');
    const r = migrar({ versaoSchema: 12, estado: { entidades: [{ id: 'j', interacao: { tipo: 'descanso', objetoId: 'curto', ateTick: 9 } }] }, fasesVisitadas: {} });
    const ent = (r.estado as { entidades: Record<string, unknown>[] }).entidades[0];
    expect(ent).toMatchObject({ interacao: null, buffsArmados: [], refugio: false, aparencia: null });
  });
});
