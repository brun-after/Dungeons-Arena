import { describe, expect, it } from 'vitest';
import { estadoPublico } from '../../src/arena/estado-publico';
import { aplicarPatch, GeradorDePatches } from '../../src/arena/patches';
import { iniciarAcao } from '../../src/combat/acao';
import { aplicarEfeito } from '../../src/combat/efeitos';
import { normalizarEfeito } from '../../src/combat/normalizar-efeito';
import { construirEfeito, REGISTRO_EFEITOS, TIPOS_EFEITO, type EfeitoCanonico, type TipoEfeito } from '../../src/combat/registro-efeitos';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { buscarEntidade, clonarEstado, criarEstado } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import { ticksDe } from '../../src/core/tempo';
import { Leitor } from '../../src/core/validar';
import type { Entidade } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { lerRegistro, VERSAO_SCHEMA } from '../../src/save/esquema';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const semChaves = (o: object, chaves: readonly string[]) => Object.fromEntries(Object.entries(o).filter(([k]) => !chaves.includes(k)));

function obter<T>(v: T | undefined | null, nome: string): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

/** Jogador em (3,5); boneco (sem IA) em (8,5), na sala aberta 12×12. */
function cenario() {
  const ctx = contexto(faseDeTexto(SALA_ABERTA));
  const estado = criarEstado({ semente: 9, faseId: 'teste' });
  estado.entidades.push(criarJogador(obter(CONTEUDO.classes.get('aventureiro'), 'classe'), 'j', 3, 5, BALANCE_PADRAO));
  estado.entidades.push(criarInimigo(obter(CONTEUDO.presets.get('boneco'), 'boneco'), 'b', 8, 5, BALANCE_PADRAO));
  const eventos: EventoSimulacao[] = [];
  const ent = (id: string): Entidade => obter(buscarEntidade(estado, id), id);
  const tick = () => {
    simular(estado, ctx, [], eventos, DT_MS);
  };
  const ticks = (n: number) => {
    for (let i = 0; i < n; i++) tick();
  };
  const ef = (tipo: TipoEfeito, parcial: Partial<Omit<EfeitoCanonico, 'tipo'>> = {}) => construirEfeito(tipo, parcial);
  const aplicar = (sobreId: string, efeito: EfeitoCanonico, origemId = 'j', mira: { x: number; y: number } | null = null) => {
    const o = ent(origemId);
    aplicarEfeito(estado, ctx, ent(sobreId), efeito, { id: o.id, x: o.x, y: o.y }, mira, eventos);
  };
  const por = (e: Entidade, x: number, y: number) => {
    e.x = x;
    e.y = y;
  };
  return { ctx, estado, eventos, ent, tick, ticks, ef, aplicar, por };
}

describe('efeito_atrasado', () => {
  it('dispara o efeito carregado no alvo depois do prazo, e não em alvo morto', () => {
    const c = cenario();
    c.aplicar('b', c.ef('efeito_atrasado', { duracaoMs: 1000, interno: c.ef('atordoar', { duracaoMs: 500 }) }));
    expect(c.estado.atrasados).toHaveLength(1);
    c.ticks(ticksDe(1000) - 1);
    expect(c.ent('b').efeitos).toHaveLength(0);
    c.tick();
    c.tick();
    expect(c.ent('b').efeitos.map((f) => f.tipo)).toEqual(['atordoar']);
    expect(c.estado.atrasados).toHaveLength(0);

    c.aplicar('b', c.ef('efeito_atrasado', { duracaoMs: 200, interno: c.ef('atordoar') }));
    c.ent('b').hp = 0;
    c.ticks(ticksDe(400));
    expect(c.estado.atrasados).toHaveLength(0);
  });
});

describe('rastros', () => {
  it('rastro de dano: marca a célula, fere o hostil uma vez por célula e some com o tempo', () => {
    const c = cenario();
    c.aplicar('j', c.ef('rastro_dano', { valor: 4, duracaoMs: 5000 }));
    c.tick();
    expect(c.estado.rastros.map((r) => [r.x, r.y])).toEqual([[3, 5]]);
    c.por(c.ent('j'), 4, 5);
    c.por(c.ent('b'), 3, 5);
    const hp = c.ent('b').hp;
    c.tick();
    c.tick();
    expect(c.ent('b').hp).toBe(hp - 4);
    // O dono não se fere no próprio rastro.
    expect(c.ent('j').hp).toBe(c.ent('j').hpMax);
    c.ent('j').efeitos = [];
    c.ticks(ticksDe(BALANCE_PADRAO.efeitos.rastroCelulaMs) + 2);
    expect(c.estado.rastros).toHaveLength(0);
  });

  it('rastro de efeito aplica o efeito carregado em quem entra', () => {
    const c = cenario();
    c.aplicar('j', c.ef('rastro_efeito', { duracaoMs: 5000, interno: c.ef('sem_movimento', { duracaoMs: 600 }) }));
    c.tick();
    c.por(c.ent('j'), 4, 5);
    c.por(c.ent('b'), 3, 5);
    c.tick();
    expect(c.ent('b').efeitos.map((f) => f.tipo)).toEqual(['sem_movimento']);
  });
});

describe('armadilha (§2.11)', () => {
  it('armada na mira; ignora aliados; dispara no primeiro hostil e some; expira', () => {
    const c = cenario();
    c.aplicar('j', c.ef('armadilha', { valor: 5, interno: c.ef('atordoar') }), 'j', { x: 6, y: 5 });
    expect(c.estado.armadilhas).toHaveLength(1);
    c.por(c.ent('j'), 6, 5);
    c.tick();
    expect(c.estado.armadilhas).toHaveLength(1);
    c.por(c.ent('j'), 2, 2);
    c.por(c.ent('b'), 6, 5);
    const hp = c.ent('b').hp;
    c.tick();
    expect(c.ent('b').hp).toBe(hp - 5);
    expect(c.ent('b').efeitos.map((f) => f.tipo)).toEqual(['atordoar']);
    expect(c.estado.armadilhas).toHaveLength(0);
    c.aplicar('j', c.ef('armadilha', { duracaoMs: 300 }), 'j', { x: 9, y: 9 });
    c.ticks(ticksDe(400));
    expect(c.estado.armadilhas).toHaveLength(0);
  });

  it('nunca aparece no estado público (invisível para quem não armou)', () => {
    const c = cenario();
    c.aplicar('j', c.ef('armadilha'), 'j', { x: 6, y: 5 });
    expect(estadoPublico(c.estado).armadilhas).toEqual([]);
  });

  it('acima do limite do modo, a habilidade é recusada sem cobrar recurso nem recarga', () => {
    const c = cenario();
    const j = c.ent('j');
    j.habilidades.push('armar_teia');
    const limite = c.ctx.modo.limites.armadilhasPorJogador;
    for (let i = 0; i < limite; i++) c.aplicar('j', c.ef('armadilha'), 'j', { x: 2 + i, y: 8 });
    const mana = j.mana;
    expect(iniciarAcao(c.estado, c.ctx, j, 'armar_teia', { x: 5, y: 5 }, c.eventos)).toBe(false);
    expect(c.eventos.at(-1)).toMatchObject({ t: 'acaoRecusada', motivo: 'limite' });
    expect(j.mana).toBe(mana);
    expect(c.estado.recargas).toEqual({});
  });
});

describe('invocar (§2.9)', () => {
  it('cria aliados da equipe do dono, até o limite, sem XP e sem respawn; somem no prazo', () => {
    const c = cenario();
    c.aplicar('j', c.ef('invocar', { valor: 5, duracaoMs: 1000, ref: 'goblin' }));
    expect(c.estado.entidades.filter((e) => e.invocacao)).toHaveLength(0);
    c.aplicar('j', c.ef('invocar', { valor: 2, duracaoMs: 1000, ref: 'goblin' }));
    const invocadas = c.estado.entidades.filter((e) => e.invocacao);
    expect(invocadas).toHaveLength(2);
    for (const e of invocadas) {
      expect(e).toMatchObject({ tipo: 'invocacao', equipe: c.ent('j').equipe, xpBase: 0 });
      expect(Math.max(Math.abs(e.x - 3), Math.abs(e.y - 5))).toBeLessThanOrEqual(2);
    }
    c.ticks(ticksDe(1000) + 2);
    // O falcão do Aventureiro (marco 22) fica; as invocadas somem.
    expect(c.estado.entidades.some((e) => e.invocacao && !e.invocacao.companheiro)).toBe(false);
    expect(c.estado.respawns).toHaveLength(0);
    expect(c.ent('j').xp).toBe(0);
  });

  it('morrem com o dono; seguem o dono quando não há alvo', () => {
    const c = cenario();
    c.estado.entidades = c.estado.entidades.filter((e) => e.id !== 'b');
    c.aplicar('j', c.ef('invocar', { valor: 1, duracaoMs: 60_000, ref: 'goblin' }));
    const lacaio = obter(c.estado.entidades.find((e) => e.invocacao), 'lacaio');
    c.por(lacaio, 9, 9);
    c.ticks(ticksDe(6000));
    expect(Math.max(Math.abs(lacaio.x - 3), Math.abs(lacaio.y - 5))).toBeLessThanOrEqual(2);
    c.ent('j').hp = 0;
    c.ticks(3);
    expect(c.estado.entidades.some((e) => e.invocacao)).toBe(false);
  });
});

describe('dominar_ao_matar (§2.9)', () => {
  it('quem morre marcado volta do lado de quem marcou, com metade do HP, e sobrevive ao dono', () => {
    const c = cenario();
    const goblin = criarInimigo(obter(CONTEUDO.presets.get('goblin'), 'goblin'), 'g', 6, 6, BALANCE_PADRAO);
    c.estado.entidades.push(goblin);
    c.aplicar('g', c.ef('dominar_ao_matar'));
    goblin.hp = 0;
    c.tick();
    const g = c.ent('g');
    expect(g).toMatchObject({ morto: false, tipo: 'invocacao', equipe: c.ent('j').equipe });
    expect(g.invocacao).toMatchObject({ donoId: 'j', dominado: true });
    expect(g.hp).toBe(Math.round(g.hpMax / 2));
    expect(c.eventos.some((e) => e.t === 'dominou')).toBe(true);
    c.ent('j').hp = 0;
    c.ticks(3);
    expect(c.ent('g').hp).toBeGreaterThan(0);
  });

  it('dominado não domina (cascata limitada)', () => {
    const c = cenario();
    const [g1, g2] = ['g1', 'g2'].map((id, i) => criarInimigo(obter(CONTEUDO.presets.get('goblin'), 'goblin'), id, 6, 4 + i * 3, BALANCE_PADRAO));
    c.estado.entidades.push(obter(g1, 'g1'), obter(g2, 'g2'));
    c.aplicar('g1', c.ef('dominar_ao_matar'));
    c.ent('g1').hp = 0;
    c.tick();
    c.aplicar('g2', c.ef('dominar_ao_matar'), 'g1');
    c.ent('g2').hp = 0;
    c.tick();
    expect(c.estado.entidades.some((e) => e.id === 'g2')).toBe(false);
  });
});

describe('normalização, rede e save', () => {
  it('normalizar a forma canônica de novo não muda nada (a fase é validada mais de uma vez)', () => {
    const l = new Leitor('teste');
    for (const tipo of TIPOS_EFEITO) {
      const exige = REGISTRO_EFEITOS[tipo].exige;
      const canonico = construirEfeito(tipo, {
        ...(exige.includes('interno') && { interno: construirEfeito('atordoar') }),
        ...(exige.includes('ref') && { ref: 'goblin' }),
      });
      expect(normalizarEfeito(JSON.parse(JSON.stringify(canonico)), l), tipo).toEqual([canonico]);
    }
    expect(l.erros).toEqual([]);
  });

  it('efeito carregado em um nível; dois níveis e falta de ref são apontados', () => {
    const l = new Leitor('teste');
    const [ef] = normalizarEfeito({ efeito_atrasado: { duracaoMs: 1500, efeito: { atordoar: 800 } } }, l);
    expect(l.erros).toEqual([]);
    expect(ef?.interno).toMatchObject({ tipo: 'atordoar', duracaoMs: 800 });
    normalizarEfeito({ efeito_atrasado: { efeito: { efeito_atrasado: { efeito: { atordoar: 1 } } } } }, l);
    normalizarEfeito({ invocar: { valor: 1 } }, l);
    expect(l.erros.join('\n')).toMatch(/dentro de efeito dentro de efeito/);
    expect(l.erros.join('\n')).toMatch(/precisa de "ref"/);
  });

  it('rastros e atrasados vão pelos patches', () => {
    const c = cenario();
    const gerador = new GeradorDePatches();
    const base = estadoPublico(c.estado);
    gerador.gerar(base);
    c.aplicar('j', c.ef('rastro_dano'));
    c.aplicar('b', c.ef('efeito_atrasado', { interno: c.ef('atordoar') }));
    c.tick();
    const depois = estadoPublico(c.estado);
    const reconstruido = aplicarPatch(clonarEstado(base), gerador.gerar(depois));
    expect(reconstruido.rastros).toEqual(depois.rastros);
    expect(reconstruido.atrasados).toEqual(depois.atrasados);
  });

  it('save v2 abre na v3 com as listas novas vazias', () => {
    const c = cenario();
    const v2 = {
      versaoSchema: 2,
      slot: 1,
      criadoEm: 1,
      atualizadoEm: 2,
      faseRef: { tipo: 'oficial', id: 'fase-01' },
      nomeFase: 'Teste',
      estatisticas: { inimigosDerrotados: 0, mortes: 0 },
      // Um estado como era na v2: sem as listas novas e sem `invocacao` nas entidades.
      estado: {
        ...semChaves(clonarEstado(c.estado), ['rastros', 'armadilhas', 'atrasados']),
        entidades: c.estado.entidades.map((e) => semChaves(e, ['invocacao'])),
      },
    };
    const r = lerRegistro(v2);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.registro.versaoSchema).toBe(VERSAO_SCHEMA);
    expect([r.registro.estado.rastros, r.registro.estado.armadilhas, r.registro.estado.atrasados]).toEqual([[], [], []]);
    expect(r.registro.estado.entidades.every((e) => e.invocacao === null)).toBe(true);
  });
});
