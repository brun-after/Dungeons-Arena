// Marco 9A-2 (14/10/2026): spawner dinâmico (§2.1) e armadilha de fase (§2.11), D-051.

import { describe, expect, it } from 'vitest';
import { estadoPublico } from '../../src/arena/estado-publico';
import type { Comando } from '../../src/core/comandos';
import { BALANCE_PADRAO, type Balance, type ContextoSimulacao } from '../../src/core/contexto';
import { digest } from '../../src/core/digest';
import { buscarEntidade, criarEstado, type EstadoJogo } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import { ticksDe } from '../../src/core/tempo';
import type { Entidade } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { excedeLimite } from '../../src/combat/efeitos-fluxo';
import { lerRegistro, VERSAO_SCHEMA } from '../../src/save/esquema';
import { carregarFase } from '../../src/world/fase';
import { povoarFase } from '../../src/world/populacao';
import { contarDoSpawner, PREFIXO_SPAWNER, processarSpawner } from '../../src/world/spawner';
import { validarFase } from '../../src/world/validacao-fase';
import { CONTEUDO, contexto, faseDeTexto, faseOficial01, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome: string): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

const CARENCIA = ticksDe(BALANCE_PADRAO.spawner.carenciaS * 1000);
const INTERVALO = ticksDe(BALANCE_PADRAO.spawner.intervaloS * 1000);

/** Sala 30×30 aberta: espaço para o spawner achar células longe do jogador. */
const SALA_GRANDE = ['#'.repeat(30), ...Array.from({ length: 28 }, () => `#${'.'.repeat(28)}#`), '#'.repeat(30)];

/** Chamadas diretas a `processarSpawner` nos ticks de rodada (sem simular o resto do mundo). */
function cenarioSpawner(modoId = 'campanha', balance: Balance = BALANCE_PADRAO, semente = 3) {
  const ctx = contexto(faseDeTexto(SALA_GRANDE), balance, modoId);
  const estado = criarEstado({ semente, faseId: 'teste' });
  const classe = obter(CONTEUDO.classes.get('aventureiro'), 'classe');
  estado.entidades.push(criarJogador(classe, 'j', 15, 15, balance));
  const eventos: EventoSimulacao[] = [];
  const rodar = (tick: number) => {
    estado.tick = tick;
    processarSpawner(estado, ctx, eventos);
  };
  return { ctx, estado, eventos, rodar };
}

/** Tudo com chance 1: cada rodada cria em toda categoria abaixo do máximo. */
const SEMPRE: Balance = {
  ...BALANCE_PADRAO,
  spawner: {
    ...BALANCE_PADRAO.spawner,
    bau: { ...BALANCE_PADRAO.spawner.bau, chance: 1 },
    loot: { ...BALANCE_PADRAO.spawner.loot, chance: 1 },
    orbe: { ...BALANCE_PADRAO.spawner.orbe, chance: 1 },
    armadilha: { ...BALANCE_PADRAO.spawner.armadilha, chance: 1 },
  },
};

const criados = (estado: EstadoJogo) =>
  estado.objetos.filter((o) => o.objetoId.startsWith(PREFIXO_SPAWNER)).length + estado.armadilhas.filter((a) => a.origem === 'spawner').length;

describe('spawner dinâmico (§2.1)', () => {
  it('nada antes da carência; a primeira rodada é aos 20 s e a seguinte 90 s depois', () => {
    const c = cenarioSpawner('campanha', SEMPRE);
    for (let t = 0; t < CARENCIA; t += 30) c.rodar(t);
    expect(criados(c.estado)).toBe(0);
    c.rodar(CARENCIA);
    const primeira = criados(c.estado);
    // Ajuste de 16/10/2026 (D-067): + o refúgio (um só por vez, então não volta na segunda rodada).
    expect(primeira).toBe(5);
    c.rodar(CARENCIA + INTERVALO - 1);
    expect(criados(c.estado)).toBe(primeira);
    c.rodar(CARENCIA + INTERVALO);
    expect(criados(c.estado)).toBe(9);
  });

  it('nunca passa do máximo de cada categoria', () => {
    const c = cenarioSpawner('campanha', SEMPRE);
    for (let i = 0; i < 10; i++) c.rodar(CARENCIA + i * INTERVALO);
    for (const cat of ['bau', 'loot', 'orbe', 'armadilha'] as const) {
      expect(contarDoSpawner(c.estado, cat)).toBe(BALANCE_PADRAO.spawner[cat].max);
    }
  });

  it('as células respeitam a regra: passável, livre e a Chebyshev ≥ 4 do jogador', () => {
    for (let semente = 1; semente <= 20; semente++) {
      const c = cenarioSpawner('campanha', SEMPRE, semente);
      for (let i = 0; i < 5; i++) c.rodar(CARENCIA + i * INTERVALO);
      const celulas = [...c.estado.objetos, ...c.estado.armadilhas].map((o) => `${o.x},${o.y}`);
      expect(new Set(celulas).size).toBe(celulas.length);
      for (const o of [...c.estado.objetos, ...c.estado.armadilhas]) {
        expect(Math.max(Math.abs(o.x - 15), Math.abs(o.y - 15))).toBeGreaterThanOrEqual(4);
        expect(o.x > 0 && o.x < 29 && o.y > 0 && o.y < 29).toBe(true);
      }
    }
  });

  it('sem célula válida, não cria nada (e não trava)', () => {
    const ctx = contexto(faseDeTexto(SALA_ABERTA), SEMPRE);
    const estado = criarEstado({ semente: 1, faseId: 'teste' });
    const classe = obter(CONTEUDO.classes.get('aventureiro'), 'classe');
    // Na sala 12×12, nenhuma célula fica a 4 de um jogador no meio... com quatro jogadores espalhados.
    for (const [i, [x, y]] of [[3, 3], [8, 3], [3, 8], [8, 8]].entries()) estado.entidades.push(criarJogador(classe, `j${i}`, x ?? 0, y ?? 0, SEMPRE));
    estado.tick = CARENCIA;
    processarSpawner(estado, ctx, []);
    expect(criados(estado)).toBe(0);
  });

  it('no modo Livre (arena) não cria baú nem loot; sem spawnerDinamico, nada', () => {
    const livre = cenarioSpawner('livre', SEMPRE);
    for (let i = 0; i < 4; i++) livre.rodar(CARENCIA + i * INTERVALO);
    expect(contarDoSpawner(livre.estado, 'bau') + contarDoSpawner(livre.estado, 'loot')).toBe(0);
    expect(contarDoSpawner(livre.estado, 'orbe')).toBe(3);
    expect(contarDoSpawner(livre.estado, 'armadilha')).toBe(2);

    const c = cenarioSpawner('campanha', SEMPRE);
    const desligado: ContextoSimulacao = { ...c.ctx, modo: { ...c.ctx.modo, spawnerDinamico: false } };
    c.estado.tick = CARENCIA;
    processarSpawner(c.estado, desligado, []);
    expect(criados(c.estado)).toBe(0);
  });

  it('baú do spawner é destrancado, com itens e ouro nas faixas da balance; armadilha expira em 180 s', () => {
    const c = cenarioSpawner('campanha', SEMPRE);
    c.rodar(CARENCIA);
    const bau = obter(c.estado.objetos.find((o) => o.tipo === 'bau'), 'baú');
    const s = BALANCE_PADRAO.spawner;
    expect(bau.chave).toBeNull();
    expect(bau.itens.length).toBeGreaterThanOrEqual(s.itensBau[0]);
    expect(bau.itens.length).toBeLessThanOrEqual(s.itensBau[1]);
    expect(bau.ouro).toBeGreaterThanOrEqual(s.ouroBau[0]);
    expect(bau.ouro).toBeLessThanOrEqual(s.ouroBau[1]);
    const a = obter(c.estado.armadilhas[0], 'armadilha');
    expect(a).toMatchObject({ origem: 'spawner', donoId: 'fase', permanente: false, rearmeTicks: 0 });
    expect(a.ateTick).toBe(CARENCIA + ticksDe(s.armadilhaExpiraS * 1000));
  });

  it('a mesma semente dá o mesmo resultado', () => {
    const a = cenarioSpawner('campanha', BALANCE_PADRAO, 9);
    const b = cenarioSpawner('campanha', BALANCE_PADRAO, 9);
    for (let i = 0; i < 6; i++) {
      a.rodar(CARENCIA + i * INTERVALO);
      b.rodar(CARENCIA + i * INTERVALO);
    }
    expect(digest(a.estado)).toBe(digest(b.estado));
  });
});

/** Fase pequena com armadilhas de fase; o jogador em (2,2), um goblin em (8,8). */
function cenarioArmadilha(objetos: unknown[]) {
  const r = validarFase({ id: 'a', nome: 'a', ordem: 1, tipo: 'campanha', mapa: SALA_ABERTA, spawns: [{ x: 2, y: 2 }], objetos }, undefined, CONTEUDO.itens);
  if (!r.ok) throw new Error(JSON.stringify(r.erros));
  const ctx = contexto(carregarFase(r.fase));
  const estado = criarEstado({ semente: 5, faseId: 'a' });
  const classe = obter(CONTEUDO.classes.get('aventureiro'), 'classe');
  estado.entidades.push(criarJogador(classe, 'j', 2, 2, ctx.balance));
  povoarFase(estado, ctx);
  const eventos: EventoSimulacao[] = [];
  const j = (): Entidade => obter(buscarEntidade(estado, 'j'), 'j');
  const tick = (...cmds: Comando[]) => {
    simular(estado, ctx, cmds.map((cmd) => ({ tick: estado.tick, entidadeId: 'j', cmd })), eventos, DT_MS);
  };
  const andar = (n: number) => {
    for (let i = 0; i < n; i++) tick();
  };
  const disparos = () => eventos.filter((e) => e.t === 'armadilhaDisparou').length;
  return { ctx, estado, eventos, j, tick, andar, disparos };
}

// (x + 0,5) / 12: o centro da célula x numa sala de 12.
const centro = (c: number) => (c + 0.5) / 12;

describe('armadilha de fase (§2.11)', () => {
  it('disparo único: fere quem pisa e some', () => {
    const c = cenarioArmadilha([{ tipo: 'armadilha', x: centro(3), y: centro(2), valor: 7, modo: 'unica' }]);
    expect(c.estado.armadilhas).toMatchObject([{ origem: 'fase', permanente: true, x: 3, y: 2 }]);
    const hp = c.j().hp;
    c.tick({ t: 'irPara', x: 3, y: 2 });
    c.andar(60);
    expect(c.disparos()).toBe(1);
    expect(c.j().hp).toBe(hp - 7);
    expect(c.estado.armadilhas).toHaveLength(0);
  });

  it('com rearme: fica inerte e volta a disparar depois do prazo; não expira', () => {
    const c = cenarioArmadilha([{ tipo: 'armadilha', x: centro(3), y: centro(2), valor: 1, efeito: { atordoar: 200 }, modo: 'rearme', rearmeMs: 2000 }]);
    c.tick({ t: 'irPara', x: 3, y: 2 });
    c.andar(60);
    expect(c.disparos()).toBe(1);
    expect(c.estado.armadilhas).toHaveLength(1);
    c.andar(60);
    expect(c.disparos()).toBe(1);
    c.andar(ticksDe(2000));
    expect(c.disparos()).toBe(2);
    c.andar(ticksDe(600_000) / 10);
    // (o spawner da campanha também arma as dele nesse meio-tempo)
    expect(c.estado.armadilhas.filter((x) => x.origem === 'fase')).toHaveLength(1);
  });

  it('pega inimigos também (relacao() com a equipe fase) e não conta no limite do jogador', () => {
    const c = cenarioArmadilha([{ tipo: 'armadilha', x: centro(8), y: centro(8), valor: 5, modo: 'unica' }]);
    const goblin = criarInimigo(obter(CONTEUDO.presets.get('goblin'), 'goblin'), 'g', 8, 8, c.ctx.balance);
    c.estado.entidades.push(goblin);
    c.tick();
    expect(c.eventos.find((e) => e.t === 'armadilhaDisparou')).toMatchObject({ donoId: 'fase', alvoId: 'g' });
    const armar = obter(CONTEUDO.habilidades.get('armar_teia'), 'armar_teia');
    expect(excedeLimite(c.estado, c.ctx, c.j(), armar.efeitos)).toBe(false);
  });

  it('fica fora do estado público', () => {
    const c = cenarioArmadilha([{ tipo: 'armadilha', x: centro(5), y: centro(5), valor: 5, modo: 'unica' }]);
    expect(estadoPublico(c.estado).armadilhas).toEqual([]);
  });

  it('a validação recusa rearme sem prazo, modo inválido e efeito com mais de um componente', () => {
    const fase = (o: unknown) => validarFase({ id: 'a', nome: 'a', ordem: 1, tipo: 'campanha', mapa: SALA_ABERTA, spawns: [{ x: 2, y: 2 }], objetos: [o] });
    expect(fase({ tipo: 'armadilha', x: 0.5, y: 0.5, valor: 5, modo: 'rearme' }).ok).toBe(false);
    expect(fase({ tipo: 'armadilha', x: 0.5, y: 0.5, valor: 5, modo: 'sempre' }).ok).toBe(false);
    expect(fase({ tipo: 'armadilha', x: 0.5, y: 0.5, valor: 5, modo: 'unica', efeito: { atordoar: 100, silenciar: 100 } }).ok).toBe(false);
    const ok = fase({ tipo: 'armadilha', x: 0.5, y: 0.5, valor: 5, modo: 'rearme', rearmeMs: 1000, efeito: { atordoar: 100 } });
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(validarFase(ok.fase)).toEqual(ok);
  });

  it('a fase 1 traz uma armadilha única e uma com rearme', () => {
    const fase = faseOficial01();
    const armadilhas = fase.objetos.filter((o) => o.tipo === 'armadilha');
    expect(armadilhas.map((a) => [a.x, a.y, a.rearmeMs])).toEqual([
      [14, 5, 0],
      [6, 12, 8000],
    ]);
  });

  it('na fase 1: atravessar o corredor da sala B dispara a armadilha; parado, o spawner cria longe', () => {
    const ctx = contexto(faseOficial01());
    // Semente em que as duas rodadas sorteiam algo (com chance < 1, nenhuma criar nada acontece em ~2,5%).
    const estado = criarEstado({ semente: 1, faseId: 'fase-01' });
    povoarFase(estado, ctx);
    estado.entidades = estado.entidades.filter((e) => e.controlador !== 'ia');
    const classe = obter(CONTEUDO.classes.get('aventureiro'), 'classe');
    estado.entidades.push(criarJogador(classe, 'j', 5, 5, ctx.balance));
    const eventos: EventoSimulacao[] = [];
    const tick = (cmds: Comando[] = []) => {
      simular(estado, ctx, cmds.map((cmd) => ({ tick: estado.tick, entidadeId: 'j', cmd })), eventos, DT_MS);
    };
    tick([{ t: 'irPara', x: 15, y: 5 }]);
    for (let i = 0; i < 600; i++) tick();
    expect(eventos.find((e) => e.t === 'armadilhaDisparou')).toMatchObject({ donoId: 'fase', alvoId: 'j' });
    for (let i = 0; i < ticksDe(120_000); i++) tick();
    const doSpawner = estado.objetos.filter((o) => o.objetoId.startsWith(PREFIXO_SPAWNER));
    expect(doSpawner.length + estado.armadilhas.filter((x) => x.origem === 'spawner').length).toBeGreaterThan(0);
    for (const o of doSpawner) expect(Math.max(Math.abs(o.x - 15), Math.abs(o.y - 5))).toBeGreaterThanOrEqual(4);
  });

  it('save v4 abre na versão atual com as armadilhas de habilidade completadas', () => {
    const c = cenarioArmadilha([]);
    const estado = JSON.parse(JSON.stringify(c.estado)) as Record<string, unknown>;
    estado.armadilhas = [{ id: 1, donoId: 'j', equipeDono: 'jogadores', x: 1, y: 1, valor: 3, interno: null, ateTick: 99 }];
    const r = lerRegistro({ versaoSchema: 4, slot: 1, criadoEm: 1, atualizadoEm: 2, faseRef: { tipo: 'oficial', id: 'fase-01' }, nomeFase: 'x', estado });
    if (!r.ok) throw new Error(r.erro);
    expect(r.registro.versaoSchema).toBe(VERSAO_SCHEMA);
    expect(r.registro.estado.armadilhas[0]).toMatchObject({ origem: 'habilidade', permanente: false, rearmeTicks: 0, inerteAteTick: 0 });
  });
});
