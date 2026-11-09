// 09/11/2026 (D-144): as invocações viajam com o dono entre as salas do Mundo (antes ficavam na sala antiga).

import { describe, expect, it } from 'vitest';
import { BALANCE_PADRAO, type ContextoSimulacao } from '../../src/core/contexto';
import { criarEstado, type EstadoJogo } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import type { Entidade } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { recolherComitiva, retirarComitiva, soltarComitiva } from '../../src/mundo/comitiva';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome: string): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

const ctx: ContextoSimulacao = contexto(faseDeTexto(SALA_ABERTA), BALANCE_PADRAO, 'campanha');

function necromante(estado: EstadoJogo, id: string): Entidade {
  const e = criarJogador(obter(CONTEUDO.classes.get('necromante'), 'classe'), id, 3, 3, ctx.balance);
  estado.entidades.push(e);
  return e;
}

function morto(estado: EstadoJogo, dono: Entidade, id: string, expiraTick: number, extra: Partial<NonNullable<Entidade['invocacao']>> = {}): Entidade {
  const e = criarInimigo(obter(CONTEUDO.presets.get('servo_ossuario'), 'preset'), id, 4, 3, ctx.balance);
  e.equipe = dono.equipe;
  e.hpMax = 50;
  e.hp = 30;
  e.nome = 'Reanimado de goblin';
  e.invocacao = { donoId: dono.id, expiraTick, dominado: false, comportamento: 'agressivo', avatar: false, golpesRestantes: 0, abates: 2, criadoTick: 0, nivelDominacao: 0, necromancia: 'reanimado', ...extra };
  estado.entidades.push(e);
  return e;
}

describe('invocações que viajam com o dono (D-144)', () => {
  it('saem da sala antiga e chegam ao lado do dono, com a vida e o tempo que faltava', () => {
    const antiga = criarEstado({ semente: 1, faseId: 'teste' });
    antiga.tick = 1000;
    const dono = necromante(antiga, 'p1');
    morto(antiga, dono, 'v1', 1600);
    morto(antiga, dono, 'v2', Number.MAX_SAFE_INTEGER, { necromancia: 'servo' });
    morto(antiga, dono, 'falcao', 5000, { companheiro: true });
    const alheio = necromante(antiga, 'p2');
    morto(antiga, alheio, 'v3', 1600);

    const comitiva = recolherComitiva(antiga, dono.id);
    expect(comitiva).toHaveLength(2);
    retirarComitiva(antiga, dono.id);
    expect(antiga.entidades.map((e) => e.id).sort()).toEqual(['falcao', 'p1', 'p2', 'v3']);

    const nova = criarEstado({ semente: 2, faseId: 'teste' });
    nova.tick = 50;
    const chegou = necromante(nova, 'p7');
    const saida: EventoSimulacao[] = [];
    soltarComitiva(nova, ctx, chegou, comitiva, saida);
    const meus = nova.entidades.filter((e) => e.invocacao?.donoId === 'p7');
    expect(meus).toHaveLength(2);
    const reanimado = obter(meus.find((e) => e.invocacao?.necromancia === 'reanimado'), 'reanimado');
    expect(reanimado.hp).toBe(30);
    expect(reanimado.hpMax).toBe(50);
    expect(reanimado.equipe).toBe(chegou.equipe);
    expect(reanimado.invocacao?.expiraTick).toBe(50 + 600);
    expect(reanimado.invocacao?.abates).toBe(2);
    const servo = obter(meus.find((e) => e.invocacao?.necromancia === 'servo'), 'servo');
    expect(servo.invocacao?.expiraTick).toBe(Number.MAX_SAFE_INTEGER);
    expect(new Set(meus.map((e) => e.id)).size).toBe(2);
    expect(Math.max(Math.abs(reanimado.x - chegou.x), Math.abs(reanimado.y - chegou.y))).toBeLessThanOrEqual(3);
    expect(saida.filter((e) => e.t === 'invocou')).toHaveLength(2);
  });
});
