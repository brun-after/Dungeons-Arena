// Marco 10A-3 (14/10/2026): invocações completas, avatares e dominação (§2.9), D-054.

import { describe, expect, it } from 'vitest';
import { autoAlvo } from '../../src/combat/acao';
import { aplicarEfeito } from '../../src/combat/efeitos';
import { rampaDeInvocacao } from '../../src/combat/invocacoes';
import { registrarParticipacao } from '../../src/combat/participacao';
import { construirEfeito } from '../../src/combat/registro-efeitos';
import type { Comando } from '../../src/core/comandos';
import { BALANCE_PADRAO, type Balance, type ContextoSimulacao } from '../../src/core/contexto';
import { buscarEntidade, criarEstado } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import { ticksDe } from '../../src/core/tempo';
import campanha from '../../src/data/campanha.json';
import type { Entidade } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { guardarItem } from '../../src/progression/inventario';
import { lerRegistro, VERSAO_SCHEMA } from '../../src/save/esquema';
import { bloqueia } from '../../src/world/colisao';
import { catalogoDeGeracao } from '../../src/world/gerador';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome: string): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

/** Jogador em (2,5) na sala 12×12; `invocar` aplica o efeito do pergaminho direto, pelo dispatcher. */
function cenario(balance: Balance = BALANCE_PADRAO, semente = 9) {
  const ctx: ContextoSimulacao = contexto(faseDeTexto(SALA_ABERTA), balance);
  const estado = criarEstado({ semente, faseId: 'teste' });
  estado.entidades.push(criarJogador(obter(CONTEUDO.classes.get('aventureiro'), 'classe'), 'j', 2, 5, balance));
  const eventos: EventoSimulacao[] = [];
  const ent = (id: string): Entidade => obter(buscarEntidade(estado, id), id);
  const tick = (...cmds: Comando[]) => {
    simular(estado, ctx, cmds.map((cmd) => ({ tick: estado.tick, entidadeId: 'j', cmd })), eventos, DT_MS);
  };
  const ticks = (n: number) => {
    for (let i = 0; i < n; i++) tick();
  };
  const invocar = (ref: string, duracaoMs = 60_000): Entidade => {
    const j = ent('j');
    const antes = new Set(estado.entidades.map((e) => e.id));
    aplicarEfeito(estado, ctx, j, construirEfeito('invocar', { valor: 1, duracaoMs, ref }), { id: j.id, x: j.x, y: j.y }, null, eventos);
    return obter(estado.entidades.find((e) => !antes.has(e.id)), `invocação ${ref}`);
  };
  /** Boneco de treino (hostil, sem IA) numa célula. */
  const boneco = (id: string, x: number, y: number, hp?: number): Entidade => {
    const b = criarInimigo(obter(CONTEUDO.presets.get('boneco'), 'boneco'), id, x, y, balance);
    if (hp !== undefined) b.hp = hp;
    estado.entidades.push(b);
    return b;
  };
  const por = (e: Entidade, x: number, y: number) => {
    Object.assign(e, { x, y, caminho: [], waypoints: [] });
  };
  return { ctx, estado, eventos, ent, tick, ticks, invocar, boneco, por };
}

describe('comportamentos (§2.9)', () => {
  it('agressivo escolhe o mais próximo; assassino, o de menor HP', () => {
    for (const [ref, esperado] of [
      ['lobo_espiritual', 'perto'],
      ['sombra', 'fraco'],
    ] as const) {
      const c = cenario();
      const inv = c.invocar(ref);
      c.por(inv, 5, 5);
      c.boneco('perto', 6, 5);
      c.boneco('fraco', 8, 7, 3);
      c.tick();
      expect(inv.ia?.alvoId).toBe(esperado);
      expect(inv.ia?.modo).toBe('perseguindo');
    }
  });

  it('o agressivo ataca adjacente; sem hostil no raio de 5, segue o dono', () => {
    const c = cenario();
    const lobo = c.invocar('lobo_espiritual');
    c.por(lobo, 5, 5);
    c.boneco('b', 6, 5);
    c.ticks(5);
    expect(c.eventos.some((e) => e.t === 'acaoIniciada' && e.atorId === lobo.id)).toBe(true);

    const d = cenario();
    const outro = d.invocar('lobo_espiritual');
    d.por(outro, 9, 9);
    d.ticks(240);
    expect(Math.max(Math.abs(outro.x - 2), Math.abs(outro.y - 5))).toBeLessThanOrEqual(2);
  });

  it('protetor: ignora quem não ameaça o dono; defende de quem ameaça', () => {
    const c = cenario();
    const s = c.invocar('sentinela');
    c.por(s, 3, 5);
    c.boneco('calmo', 4, 6);
    c.tick();
    expect(s.ia?.alvoId).toBeNull();
    registrarParticipacao(c.ent('j'), 'calmo', c.estado.tick, c.ctx);
    c.tick();
    expect(s.ia?.alvoId).toBe('calmo');
  });

  it('curador cura o dono pelo dispatcher, com recarga própria; não ataca', () => {
    const c = cenario();
    const fada = c.invocar('fada');
    c.boneco('b', 4, 5);
    const j = c.ent('j');
    j.hp = 10;
    c.tick();
    expect(j.hp).toBe(18);
    c.ticks(ticksDe(2000));
    expect(j.hp).toBeLessThan(26);
    c.ticks(ticksDe(2100));
    expect(j.hp).toBeGreaterThanOrEqual(26);
    expect(c.eventos.filter((e) => e.t === 'invocacaoCurou')).toHaveLength(2);
    expect(c.eventos.some((e) => e.t === 'acaoIniciada' && e.atorId === fada.id)).toBe(false);
  });

  it('invocação anda uma célula a cada 380 ms e não bloqueia aliado', () => {
    const c = cenario();
    const lobo = c.invocar('lobo_espiritual');
    c.por(lobo, 9, 9);
    c.tick(); // a posição contínua acompanha a célula escrita direto
    // Marco 26 (D-104): sem passo, a velocidade é a distância por tick (a mais longa, em trecho livre).
    let maior = 0;
    for (let i = 0; i < 300; i++) {
      const x = lobo.px;
      const y = lobo.py;
      c.tick();
      maior = Math.max(maior, Math.sqrt((lobo.px - x) ** 2 + (lobo.py - y) ** 2));
    }
    expect(c.eventos.filter((e) => e.t === 'moveu' && e.id === lobo.id).length).toBeGreaterThan(3);
    expect(maior).toBeCloseTo(1000 / 380 / 60, 6);
    expect(bloqueia(lobo, c.ent('j'), c.ctx.balance.colisao)).toBe(false);
  });
});

describe('avatar (§2.9)', () => {
  it('aguenta de 1 a 4 golpes (1d4), sempre bloqueia e é imóvel', () => {
    const vistos = new Set<number>();
    for (let semente = 1; semente <= 30; semente++) {
      const c = cenario(BALANCE_PADRAO, semente);
      const a = c.invocar('espantalho');
      const golpes = obter(a.invocacao, 'inv').golpesRestantes;
      vistos.add(golpes);
      expect(a.tipo).toBe('avatar');
      expect(bloqueia(a, c.ent('j'), c.ctx.balance.colisao)).toBe(true);
      for (let i = 0; i < golpes - 1; i++) registrarParticipacao(a, 'x', c.estado.tick, c.ctx);
      expect(a.hp).toBeGreaterThan(0);
      registrarParticipacao(a, 'x', c.estado.tick, c.ctx);
      expect(a.hp).toBe(0);
    }
    expect([...vistos].every((g) => g >= 1 && g <= 4)).toBe(true);
    expect(vistos.size).toBeGreaterThan(1);
  });

  it('hostis o escolhem primeiro, mesmo com o jogador mais perto', () => {
    const c = cenario();
    const a = c.invocar('espantalho');
    c.por(a, 6, 5);
    const goblin = criarInimigo(obter(CONTEUDO.presets.get('goblin'), 'goblin'), 'g', 3, 5, c.ctx.balance);
    c.estado.entidades.push(goblin);
    expect(autoAlvo(c.estado, c.ctx, goblin, 5)?.id).toBe(a.id);
  });

  it('ao cair, explode: fere hostis no raio e poupa aliados', () => {
    const c = cenario();
    const a = c.invocar('espantalho');
    c.por(a, 6, 5);
    const b = c.boneco('b', 7, 5);
    const hpB = b.hp;
    const hpJ = c.ent('j').hp;
    a.hp = 0;
    c.tick();
    expect(c.eventos.some((e) => e.t === 'explodiu')).toBe(true);
    expect(b.hp).toBe(hpB - 15);
    expect(c.ent('j').hp).toBe(hpJ);
  });

  it('respeita o limite de avatares: o segundo pergaminho é recusado sem gastar', () => {
    const c = cenario();
    const bolsa = obter(c.ent('j').bolsa, 'bolsa');
    guardarItem(bolsa, obter(CONTEUDO.itens.get('pergaminho_espantalho'), 'perg'), 2, c.ctx.balance.inventario);
    const entrada = obter(bolsa.mochila.find((i) => i.itemId === 'pergaminho_espantalho'), 'entrada');
    c.tick({ t: 'usarItem', invId: entrada.invId });
    c.tick({ t: 'usarItem', invId: entrada.invId });
    expect(c.estado.entidades.filter((e) => e.invocacao?.avatar)).toHaveLength(1);
    expect(entrada.qtd).toBe(1);
    expect(c.eventos.some((e) => e.t === 'itemRecusado' && e.motivo === 'limite')).toBe(true);
  });
});

describe('ciclo de vida', () => {
  it('a rampa sobe com o tempo e com os abates, até o teto', () => {
    const c = cenario();
    const lobo = c.invocar('lobo_espiritual');
    const inv = obter(lobo.invocacao, 'inv');
    const t0 = inv.criadoTick;
    expect(rampaDeInvocacao(lobo, t0, c.ctx)).toBe(1);
    expect(rampaDeInvocacao(lobo, t0 + ticksDe(60_000), c.ctx)).toBeCloseTo(1.1);
    inv.abates = 2;
    expect(rampaDeInvocacao(lobo, t0 + ticksDe(60_000), c.ctx)).toBeCloseTo(1.2);
    inv.abates = 50;
    expect(rampaDeInvocacao(lobo, t0, c.ctx)).toBeCloseTo(1.5);
  });

  it('o abate de uma invocação conta na rampa dela', () => {
    const c = cenario();
    const lobo = c.invocar('lobo_espiritual');
    const b = c.boneco('b', 8, 8);
    registrarParticipacao(b, lobo.id, c.estado.tick, c.ctx);
    b.hp = 0;
    c.tick();
    expect(lobo.invocacao?.abates).toBe(1);
  });

  it('dispensar derruba as invocações do dono, não os dominados', () => {
    const c = cenario();
    const lobo = c.invocar('lobo_espiritual');
    const g = criarInimigo(obter(CONTEUDO.presets.get('goblin'), 'goblin'), 'g', 8, 8, c.ctx.balance);
    c.estado.entidades.push(g);
    aplicarEfeito(c.estado, c.ctx, g, construirEfeito('dominar_ao_matar'), { id: 'j', x: 2, y: 5 }, null, c.eventos);
    g.hp = 0;
    c.tick();
    expect(g.invocacao?.dominado).toBe(true);
    c.tick({ t: 'dispensar' });
    c.tick();
    expect(c.estado.entidades.some((e) => e.id === lobo.id)).toBe(false);
    expect(c.estado.entidades.some((e) => e.id === 'g')).toBe(true);
    expect(c.eventos.find((e) => e.t === 'dispensou')).toMatchObject({ quantidade: 1 });
  });

  it('cascata de dominação vem da balance: com 2, um dominado domina', () => {
    const balance: Balance = { ...BALANCE_PADRAO, invocacoes: { ...BALANCE_PADRAO.invocacoes, cascataDominacao: 2 } };
    const c = cenario(balance);
    const goblin = obter(CONTEUDO.presets.get('goblin'), 'goblin');
    const g1 = criarInimigo(goblin, 'g1', 8, 8, balance);
    const g2 = criarInimigo(goblin, 'g2', 9, 9, balance);
    c.estado.entidades.push(g1, g2);
    aplicarEfeito(c.estado, c.ctx, g1, construirEfeito('dominar_ao_matar'), { id: 'j', x: 2, y: 5 }, null, c.eventos);
    g1.hp = 0;
    c.tick();
    aplicarEfeito(c.estado, c.ctx, g2, construirEfeito('dominar_ao_matar'), { id: 'g1', x: g1.x, y: g1.y }, null, c.eventos);
    g2.hp = 0;
    c.tick();
    expect(g2.invocacao).toMatchObject({ donoId: 'g1', dominado: true, nivelDominacao: 2 });
  });

  it('o gerador não usa presets de invocação como inimigos comuns', () => {
    const cat = catalogoDeGeracao(CONTEUDO, campanha.geradas.estoque);
    for (const id of ['lobo_espiritual', 'sombra', 'sentinela', 'fada', 'espantalho']) expect(cat.comuns).not.toContain(id);
  });

  it('save v7 abre na versão atual com as invocações completadas', () => {
    const c = cenario();
    const lobo = c.invocar('lobo_espiritual');
    const estado = JSON.parse(JSON.stringify(c.estado)) as { entidades: { id: string; invocacao: Record<string, unknown> | null }[] };
    const bruto = obter(estado.entidades.find((e) => e.id === lobo.id), 'lobo');
    bruto.invocacao = { donoId: 'j', expiraTick: 999, dominado: false };
    const lido = lerRegistro({ versaoSchema: 7, slot: 1, criadoEm: 1, atualizadoEm: 2, faseRef: { tipo: 'oficial', id: 'fase-01' }, nomeFase: 'x', estado, fasesVisitadas: {} });
    if (!lido.ok) throw new Error(lido.erro);
    expect(lido.registro.versaoSchema).toBe(VERSAO_SCHEMA);
    const inv = lido.registro.estado.entidades.find((e) => e.id === lobo.id)?.invocacao;
    expect(inv).toMatchObject({ comportamento: 'agressivo', avatar: false, golpesRestantes: 0, abates: 0, nivelDominacao: 0 });
  });
});
