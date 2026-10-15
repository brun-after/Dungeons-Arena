// Marco 15 (15/10/2026, D-061): níveis de dificuldade e escala pelo tamanho do grupo. O mesmo personagem joga em
// qualquer nível; a dificuldade só muda o mundo à volta dele.

import { describe, expect, it } from 'vitest';
import { lerComando } from '../../src/arena/protocolo';
import type { Comando } from '../../src/core/comandos';
import type { ContextoSimulacao } from '../../src/core/contexto';
import { digest } from '../../src/core/digest';
import { buscarEntidade, criarEstado } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import type { Entidade } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { fatorDoGolpe, fatoresDoMundo, tamanhoDoGrupo, type Dificuldade } from '../../src/modos/dificuldade';
import { MIGRACOES } from '../../src/save/esquema';
import { contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome: string): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

function cena(ctx: ContextoSimulacao, dificuldade: Dificuldade, jogadores: [number, number][], inimigos: [string, number, number][]) {
  const estado = criarEstado({ semente: 11, faseId: 'teste' });
  estado.dificuldade = dificuldade;
  const classe = obter(ctx.conteudo.classes.get('aventureiro'), 'aventureiro');
  jogadores.forEach(([x, y], i) => estado.entidades.push(criarJogador(classe, i === 0 ? 'j' : `j${i}`, x, y, ctx.balance)));
  inimigos.forEach(([preset, x, y], i) => estado.entidades.push(criarInimigo(obter(ctx.conteudo.presets.get(preset), preset), `i${i}`, x, y, ctx.balance)));
  const eventos: EventoSimulacao[] = [];
  const ent = (id: string): Entidade => obter(buscarEntidade(estado, id), id);
  const tick = (cmds: [string, Comando][] = []) => {
    simular(estado, ctx, cmds.map(([entidadeId, cmd]) => ({ tick: estado.tick, entidadeId, cmd })), eventos, DT_MS);
  };
  const ticks = (n: number) => {
    for (let i = 0; i < n; i++) tick();
  };
  return { estado, eventos, ent, tick, ticks };
}

const ctx = () => contexto(faseDeTexto(SALA_ABERTA));

describe('as alavancas da dificuldade', () => {
  it('Normal é neutro; Fácil alivia; Pesadelo aperta (dados do balance)', () => {
    const c = ctx();
    const fatores = (d: Dificuldade) => fatoresDoMundo(cena(c, d, [[2, 2]], [['goblin', 8, 8]]).estado, c);
    expect(fatores('normal')).toEqual({ danoContraInimigos: 1, danoContraJogador: 1, hesitacao: 1, avisoExtraMs: 0, recompensa: 1, spawner: 1 });
    const facil = fatores('facil');
    expect(facil.danoContraInimigos).toBeCloseTo(100 / c.balance.dificuldades.facil.vidaPct, 9);
    expect(facil.danoContraJogador).toBeCloseTo(c.balance.dificuldades.facil.danoPct / 100, 9);
    expect(facil.avisoExtraMs).toBeGreaterThan(0);
    expect(facil.hesitacao).toBeGreaterThan(1);
    const pesadelo = fatores('pesadelo');
    expect(pesadelo.danoContraInimigos).toBeLessThan(1);
    expect(pesadelo.danoContraJogador).toBeGreaterThan(1);
    expect(pesadelo.hesitacao).toBeLessThan(1);
    expect(pesadelo.recompensa).toBeGreaterThan(1);
    // O aviso nunca fica abaixo do Normal (§5.6).
    for (const d of ['facil', 'normal', 'dificil', 'pesadelo'] as const) expect(c.balance.dificuldades[d].avisoExtraMs).toBeGreaterThanOrEqual(0);
  });

  it('o fator do golpe vale pelo lado: jogador contra o mundo, mundo contra o jogador, e 1 entre iguais', () => {
    const c = ctx();
    const { estado, ent } = cena(c, 'dificil', [[2, 2]], [['goblin', 8, 8], ['orc', 9, 9]]);
    const f = fatoresDoMundo(estado, c);
    expect(fatorDoGolpe(estado, c, ent('j'), ent('i0'))).toBeCloseTo(f.danoContraInimigos, 9);
    expect(fatorDoGolpe(estado, c, ent('i0'), ent('j'))).toBeCloseTo(f.danoContraJogador, 9);
    expect(fatorDoGolpe(estado, c, ent('i0'), ent('i1'))).toBe(1);
  });

  it('no Pesadelo, o mesmo goblin tira mais vida do jogador que no Fácil', () => {
    const c = ctx();
    const perdido = (d: Dificuldade) => {
      const s = cena(c, d, [[3, 3]], [['goblin', 3, 4]]);
      s.ent('j').autoAtaque = false;
      const antes = s.ent('j').hp;
      s.ticks(60 * 12);
      return antes - s.ent('j').hp;
    };
    const facil = perdido('facil');
    const pesadelo = perdido('pesadelo');
    expect(pesadelo).toBeGreaterThan(0);
    expect(pesadelo).toBeGreaterThan(facil);
  });

  it('a hesitação do "?" encolhe no Pesadelo e cresce no Fácil', () => {
    const c = ctx();
    const hesitacao = (d: Dificuldade) => {
      const s = cena(c, d, [[5, 2]], [['goblin', 2, 2]]);
      s.ent('j').autoAtaque = false;
      s.ticks(5);
      const ev = s.eventos.find((e) => e.t === 'iaNotou');
      if (!ev) throw new Error('o goblin não notou');
      return ev.hesitacaoAteTick - ev.tick;
    };
    const normal = hesitacao('normal');
    expect(hesitacao('facil')).toBeGreaterThan(normal);
    expect(hesitacao('pesadelo')).toBeLessThan(normal);
  });

  it('a recompensa de XP segue a dificuldade', () => {
    const c = ctx();
    const xp = (d: Dificuldade) => {
      const s = cena(c, d, [[2, 2]], [['goblin', 8, 8]]);
      const g = s.ent('i0');
      g.hp = 0;
      g.participacao.push({ id: 'j', tick: s.estado.tick });
      s.tick();
      return s.ent('j').xp;
    };
    expect(xp('facil')).toBeLessThan(xp('normal'));
    expect(xp('pesadelo')).toBeGreaterThan(xp('normal'));
  });
});

describe('escala pelo tamanho do grupo', () => {
  it('cada personagem com bolsa a mais dá vida e dano aos inimigos', () => {
    const c = ctx();
    const so = cena(c, 'normal', [[2, 2]], [['goblin', 8, 8]]).estado;
    const tres = cena(c, 'normal', [[2, 2], [3, 2], [4, 2]], [['goblin', 8, 8]]).estado;
    expect(tamanhoDoGrupo(so)).toBe(1);
    expect(tamanhoDoGrupo(tres)).toBe(3);
    const g = c.balance.grupo;
    const f = fatoresDoMundo(tres, c);
    expect(f.danoContraInimigos).toBeCloseTo(1 / (1 + (g.vidaPorJogadorPct / 100) * 2), 9);
    expect(f.danoContraJogador).toBeCloseTo(1 + (g.danoPorJogadorPct / 100) * 2, 9);
    expect(f.spawner).toBeCloseTo(1 + (g.spawnerPorJogadorPct / 100) * 2, 9);
    expect(f.recompensa).toBeGreaterThan(1);
  });

  it('dificuldade e grupo se multiplicam', () => {
    const c = ctx();
    const seis = cena(c, 'dificil', [[1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1]], []).estado;
    const vida = (c.balance.dificuldades.dificil.vidaPct / 100) * (1 + (c.balance.grupo.vidaPorJogadorPct / 100) * 5);
    expect(fatoresDoMundo(seis, c).danoContraInimigos).toBeCloseTo(1 / vida, 9);
  });
});

describe('o mesmo personagem em qualquer dificuldade', () => {
  it('trocar no meio do jogo não mexe no personagem e avisa', () => {
    const c = ctx();
    const s = cena(c, 'normal', [[2, 2]], []);
    s.ent('j').xp = 340;
    const retrato = () => {
      const j = s.ent('j');
      return JSON.stringify({ nivel: j.nivel, xp: j.xp, atributos: j.atributos, bolsa: j.bolsa, hpMax: j.hpMax });
    };
    const antes = retrato();
    s.tick([['j', { t: 'definirDificuldade', nivel: 'pesadelo' }]]);
    expect(s.estado.dificuldade).toBe('pesadelo');
    expect(retrato()).toBe(antes);
    expect(s.eventos.some((e) => e.t === 'dificuldadeMudou' && e.nivel === 'pesadelo')).toBe(true);
    // Repetir o mesmo nível não emite de novo.
    const n = s.eventos.length;
    s.tick([['j', { t: 'definirDificuldade', nivel: 'pesadelo' }]]);
    expect(s.eventos.slice(n).some((e) => e.t === 'dificuldadeMudou')).toBe(false);
  });

  it('a mesma dificuldade, semente e comandos dão o mesmo digest', () => {
    const c = ctx();
    const rodar = () => {
      const s = cena(c, 'dificil', [[3, 3]], [['goblin', 3, 6], ['orc', 7, 7]]);
      s.ticks(60 * 8);
      return digest(s.estado);
    };
    expect(rodar()).toBe(rodar());
  });

  it('quem não tem bolsa (arena) não troca a dificuldade, e o protocolo da arena recusa o comando', () => {
    const c = ctx();
    const s = cena(c, 'normal', [], [['goblin', 3, 3]]);
    s.tick([['i0', { t: 'definirDificuldade', nivel: 'pesadelo' }]]);
    expect(s.estado.dificuldade).toBe('normal');
    expect(lerComando({ t: 'definirDificuldade', nivel: 'pesadelo' })).toBeNull();
  });
});

describe('save v11', () => {
  it('a dificuldade entra como Normal, na fase atual e nas visitadas', () => {
    const migrar = obter(MIGRACOES[10], 'v10→v11');
    const r = migrar({ versaoSchema: 10, estado: { entidades: [] }, fasesVisitadas: { a: { entidades: [] } } });
    expect((r.estado as { dificuldade: unknown }).dificuldade).toBe('normal');
    expect((r.fasesVisitadas as Record<string, { dificuldade: unknown }>).a?.dificuldade).toBe('normal');
  });
});
