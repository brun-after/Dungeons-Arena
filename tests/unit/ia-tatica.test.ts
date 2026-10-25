// Marco 25 (25/10/2026, D-100): a IA dos inimigos por dificuldade — perigo no caminho e na patrulha, armadilhas
// aprendidas, cura na área do próprio elemento, esquiva da telegrafia e cerco.
import { describe, expect, it } from 'vitest';
import { iniciarAcao } from '../../src/combat/acao';
import { criarEstado, type EstadoJogo } from '../../src/core/estado';
import type { ContextoSimulacao } from '../../src/core/contexto';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import type { Entidade } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { celulaDeCerco, destinoDeCura, fugaDoAviso, perigoDoCaminho } from '../../src/entities/ia-tatica';
import { perfilDaIa, type Dificuldade } from '../../src/modos/dificuldade';
import { dentroDaArea, type AreaAmbiente } from '../../src/world/ambiente-tipos';
import { processarAmbientes } from '../../src/world/ambientes';
import type { Fase } from '../../src/world/fase';
import { caminho, caminhoComCusto } from '../../src/world/navegacao';
import { aprenderArmadilha, emPerigo, mapaDePerigo } from '../../src/world/perigos';
import { comKit, CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome = 'valor'): T {
  if (v == null) throw new Error(`${nome} ausente`);
  return v;
}

const BRASAS: AreaAmbiente = { tipo: 'brasas', x: 5, y: 5, raio: 1 };

function comAreas(areas: AreaAmbiente[]): ContextoSimulacao {
  const fase: Fase = { ...faseDeTexto(SALA_ABERTA), ambientes: areas };
  return contexto(fase);
}

function cenario(ctx: ContextoSimulacao, dificuldade: Dificuldade, inimigos: [string, number, number][], jogador: [number, number] = [9, 9]) {
  const estado = criarEstado({ semente: 7, faseId: 'teste' });
  estado.dificuldade = dificuldade;
  const j = comKit(criarJogador(obter(CONTEUDO.classes.get('guerreiro')), 'j', jogador[0], jogador[1], ctx.balance), ['explosao']);
  j.autoAtaque = false;
  estado.entidades.push(j);
  for (const [id, x, y] of inimigos) estado.entidades.push(criarInimigo(obter(CONTEUDO.presets.get('goblin')), id, x, y, ctx.balance));
  const eventos: EventoSimulacao[] = [];
  const tick = () => {
    simular(estado, ctx, [], eventos, DT_MS);
  };
  const ent = (id: string): Entidade => obter(estado.entidades.find((e) => e.id === id), id);
  return { estado, eventos, j, tick, ent };
}

describe('caminho com custo de perigo', () => {
  const ctx = comAreas([BRASAS]);
  const vazio = new Uint8Array(ctx.fase.largura * ctx.fase.altura);

  it('sem perigo, é o mesmo caminho da busca em largura', () => {
    expect(caminhoComCusto(ctx.fase, { x: 2, y: 5 }, { x: 9, y: 5 }, 60, vazio, 8)).toEqual(caminho(ctx.fase, { x: 2, y: 5 }, { x: 9, y: 5 }, 60));
  });

  it('contorna as brasas e, sem outra saída, atravessa', () => {
    const e = criarInimigo(obter(CONTEUDO.presets.get('goblin')), 'g', 2, 5, ctx.balance);
    const mapa = obter(mapaDePerigo(criarEstado({ semente: 1, faseId: 'teste' }), ctx, e), 'mapa');
    const r = caminhoComCusto(ctx.fase, { x: 2, y: 5 }, { x: 9, y: 5 }, 60, mapa, 8);
    expect(r.status).toBe('alcancado');
    expect(r.passos.some((c) => dentroDaArea(BRASAS, c.x, c.y))).toBe(false);
    // Uma parede inteira de perigo: o destino continua alcançável.
    const tudo = new Uint8Array(mapa.length).fill(1);
    expect(caminhoComCusto(ctx.fase, { x: 2, y: 5 }, { x: 9, y: 5 }, 60, tudo, 8).status).toBe('alcancado');
  });
});

describe('IA por dificuldade (marco 25)', () => {
  it('a patrulha nunca pisa nas brasas', () => {
    const ctx = comAreas([BRASAS]);
    for (const d of ['facil', 'pesadelo'] as const) {
      // O jogador longe e invisível para o goblin não perseguir: só patrulha.
      const c = cenario(ctx, d, [['g1', 3, 5], ['g2', 7, 5], ['g3', 5, 3]], [10, 1]);
      c.j.hp = 0;
      for (let i = 0; i < 60 * 40; i++) {
        c.tick();
        for (const id of ['g1', 'g2', 'g3']) expect(dentroDaArea(BRASAS, c.ent(id).x, c.ent(id).y), `${d} ${id} t${i}`).toBe(false);
      }
    }
  });

  it('o afim de fogo não teme as brasas', () => {
    const ctx = comAreas([BRASAS]);
    const c = cenario(ctx, 'normal', [['g', 3, 5]]);
    const g = c.ent('g');
    expect(emPerigo(c.estado, ctx, g, 5, 5)).toBe(true);
    g.afinidade = { elemento: 'fogo', extrema: false };
    expect(emPerigo(c.estado, ctx, g, 5, 5)).toBe(false);
  });

  it('quanto mais difícil, mais vezes contorna o perigo ao perseguir', () => {
    const ctx = comAreas([BRASAS]);
    const taxa = (d: Dificuldade) => {
      const c = cenario(ctx, d, Array.from({ length: 200 }, (_, i): [string, number, number] => [`g${i}`, 2, 2]));
      return c.estado.entidades.filter((e) => e.controlador === 'ia' && perigoDoCaminho(c.estado, ctx, e, perfilDaIa(c.estado, ctx)) !== null).length / 200;
    };
    expect(taxa('facil')).toBeGreaterThan(0.15);
    expect(taxa('facil')).toBeLessThan(0.45);
    expect(taxa('normal')).toBeGreaterThan(taxa('facil'));
    expect(taxa('pesadelo')).toBe(1);
  });

  it('a armadilha do jogador é pisada; no Pesadelo, quem viu uma disparar contorna as outras do mesmo dono', () => {
    const ctx = comAreas([]);
    const armar = (estado: EstadoJogo, id: number, x: number) => {
      const a = { id, donoId: 'j', equipeDono: 'jogadores', x, y: 5, valor: 10, interno: null, ateTick: 1e9, origem: 'habilidade' as const, permanente: false, rearmeTicks: 0, inerteAteTick: 0, reveladaPara: [] };
      estado.armadilhas.push(a);
      return a;
    };
    for (const d of ['normal', 'pesadelo'] as const) {
      const c = cenario(ctx, d, [['g', 3, 5]]);
      c.tick();
      const g = c.ent('g');
      armar(c.estado, 900, 6);
      expect(emPerigo(c.estado, ctx, g, 6, 5)).toBe(false);
      aprenderArmadilha(c.estado, ctx, armar(c.estado, 901, 4));
      expect(emPerigo(c.estado, ctx, g, 6, 5), d).toBe(d === 'pesadelo');
    }
  });

  it('o afim ferido vai às brasas no Pesadelo e se cura nelas', () => {
    const ctx = comAreas([BRASAS]);
    const c = cenario(ctx, 'pesadelo', [['g', 2, 5]]);
    c.tick();
    const g = c.ent('g');
    g.afinidade = { elemento: 'fogo', extrema: false };
    g.hp = Math.ceil(g.hpMax * 0.2);
    const ia = obter(g.ia, 'ia');
    expect(dentroDaArea(BRASAS, ...(Object.values(obter(destinoDeCura(c.estado, ctx, g, ia, perfilDaIa(c.estado, ctx)), 'destino')) as [number, number]))).toBe(true);
    expect(ia.curando).toBe(true);
    Object.assign(g, { x: 5, y: 5 });
    const antes = g.hp;
    c.estado.tick = 600;
    processarAmbientes(c.estado, ctx, c.eventos);
    expect(g.hp).toBeGreaterThan(antes);
    expect(g.efeitos.some((f) => f.tipo === 'queimando')).toBe(false);
  });

  it('no Fácil o afim ferido não vai se curar', () => {
    const ctx = comAreas([BRASAS]);
    const c = cenario(ctx, 'facil', [['g', 2, 5]]);
    c.tick();
    const g = c.ent('g');
    g.afinidade = { elemento: 'fogo', extrema: false };
    g.hp = 1;
    expect(destinoDeCura(c.estado, ctx, g, obter(g.ia, 'ia'), perfilDaIa(c.estado, ctx))).toBeNull();
  });

  it('sai da área telegrafada no Pesadelo; no Fácil, fica', () => {
    const ctx = comAreas([]);
    for (const d of ['facil', 'pesadelo'] as const) {
      const c = cenario(ctx, d, [['g', 6, 5]], [3, 5]);
      c.tick();
      const g = c.ent('g');
      expect(iniciarAcao(c.estado, ctx, c.j, 'explosao', 'g', c.eventos)).toBe(true);
      const fuga = fugaDoAviso(c.estado, ctx, g, perfilDaIa(c.estado, ctx));
      if (d === 'facil') expect(fuga).toBeNull();
      else expect(Math.max(Math.abs(obter(fuga).x - 6), Math.abs(obter(fuga).y - 5))).toBe(2);
    }
  });

  it('os perseguidores corpo a corpo repartem as células em volta do alvo', () => {
    const ctx = comAreas([]);
    const c = cenario(ctx, 'normal', [['g1', 2, 2], ['g2', 9, 2], ['g3', 2, 9]], [6, 5]);
    c.tick();
    const celulas = ['g1', 'g2', 'g3'].map((id) => {
      const g = c.ent(id);
      Object.assign(obter(g.ia), { modo: 'perseguindo', alvoId: 'j' });
      return obter(celulaDeCerco(c.estado, ctx, g, c.j));
    });
    expect(new Set(celulas.map((x) => `${x.x},${x.y}`)).size).toBe(3);
    for (const x of celulas) expect(Math.max(Math.abs(x.x - 6), Math.abs(x.y - 5))).toBe(1);
  });
});
