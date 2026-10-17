// Marco 10A-2 (14/10/2026): penalidade de morte, descanso e regeneração por célula (§2.12), D-053.

import { describe, expect, it } from 'vitest';
import type { Comando } from '../../src/core/comandos';
import { BALANCE_PADRAO, type ContextoSimulacao } from '../../src/core/contexto';
import { buscarEntidade, criarEstado } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import type { Entidade } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { regenerarPorPasso } from '../../src/progression/recursos';
import { perderXp } from '../../src/progression/nivel';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome: string): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

function cenario(modoId = 'campanha', semente = 3) {
  const ctx: ContextoSimulacao = contexto(faseDeTexto(SALA_ABERTA), BALANCE_PADRAO, modoId);
  const estado = criarEstado({ semente, faseId: 'teste' });
  const classe = obter(CONTEUDO.classes.get('aventureiro'), 'classe');
  estado.entidades.push(criarJogador(classe, 'j', 3, 5, ctx.balance));
  const eventos: EventoSimulacao[] = [];
  const j = (): Entidade => obter(buscarEntidade(estado, 'j'), 'j');
  const tick = (...cmds: Comando[]) => {
    simular(estado, ctx, cmds.map((cmd) => ({ tick: estado.tick, entidadeId: 'j', cmd })), eventos, DT_MS);
  };
  const avancar = (n: number) => {
    for (let i = 0; i < n; i++) tick();
  };
  const de = <T extends EventoSimulacao['t']>(t: T) => eventos.filter((e): e is Extract<EventoSimulacao, { t: T }> => e.t === t);
  const recusas = () => de('itemRecusado').map((e) => e.motivo);
  /** Um goblin perseguindo o jogador (a IA real decide; aqui o estado é posto direto). */
  const perseguidor = () => {
    const g = criarInimigo(obter(CONTEUDO.presets.get('goblin'), 'goblin'), 'g', 9, 9, ctx.balance);
    estado.entidades.push(g);
    tick();
    const ia = obter(g.ia, 'ia');
    Object.assign(ia, { modo: 'perseguindo', alvoId: 'j' });
    return g;
  };
  return { ctx, estado, eventos, j, tick, avancar, de, recusas, perseguidor };
}

describe('penalidade de morte (§2.12)', () => {
  it('na campanha: −50 XP (sem baixar de 0) e de 10% a 50% do ouro', () => {
    for (let semente = 1; semente <= 20; semente++) {
      const c = cenario('campanha', semente);
      const bolsa = obter(c.j().bolsa, 'bolsa');
      bolsa.ouro = 200;
      c.j().xp = 80;
      c.j().hp = 0;
      c.tick();
      expect(c.j().xp).toBe(30);
      expect(bolsa.ouro).toBeGreaterThanOrEqual(100);
      expect(bolsa.ouro).toBeLessThanOrEqual(180);
      expect(c.de('penalidadeMorte')).toMatchObject([{ xp: 50, ouro: 200 - bolsa.ouro, niveis: 0 }]);
    }
    const c = cenario();
    c.j().xp = 20;
    c.j().hp = 0;
    c.tick();
    expect(c.j().xp).toBe(0);
    expect(c.j().nivel).toBe(1);
  });

  it('com perdeNivel, o XP que falta desce níveis e revoga os pontos', () => {
    const c = cenario();
    const j = c.j();
    const bolsa = obter(j.bolsa, 'bolsa');
    j.nivel = 3;
    j.xp = 10;
    bolsa.pontosAtributo = 1;
    bolsa.atributosBase.forca = 14;
    const niveis = perderXp(j, c.ctx, 50, true);
    expect(niveis).toBe(1);
    expect(j.nivel).toBe(2);
    expect(j.xp).toBe(10 - 50 + obter(BALANCE_PADRAO.xp.tabela[1], 'tabela'));
    expect(bolsa.pontosAtributo).toBe(0);
    expect(bolsa.atributosBase.forca).toBe(12);
  });

  it('no modo Livre a morte não custa nada', () => {
    const c = cenario('livre');
    const bolsa = obter(c.j().bolsa, 'bolsa');
    bolsa.ouro = 100;
    c.j().xp = 80;
    c.j().hp = 0;
    c.tick();
    expect([c.j().xp, bolsa.ouro]).toEqual([80, 100]);
    expect(c.de('penalidadeMorte')).toHaveLength(0);
  });
});

describe('regeneração por célula caminhada (§2.12)', () => {
  it('dois passos recuperam uma mana e duas vidas sem regeneração por tempo', () => {
    const c = cenario();
    const j = c.j();
    j.hp = 10;
    j.mana = 0;
    regenerarPorPasso(c.estado, c.ctx, j);
    expect(j.mana).toBe(0.5);
    regenerarPorPasso(c.estado, c.ctx, j);
    expect(j.mana).toBe(1);
    expect(j.hp).toBe(12);
  });
  it('cada passo dá +1 de vida e +0,5 de mana; com hostil perseguindo, nada; no Livre, nada', () => {
    const c = cenario();
    const j = c.j();
    j.hp = 10;
    j.mana = 0;
    c.tick({ t: 'irPara', x: 6, y: 5 });
    c.avancar(120);
    const passos = c.de('moveu').filter((e) => e.id === 'j').length;
    expect(passos).toBe(3);
    expect(j.hp).toBe(10 + passos);
    // A mana também sobe pela regeneração por segundo; aqui só confere que subiu ao menos o dos passos.
    expect(j.mana).toBeGreaterThanOrEqual(passos * 0.5);

    const p = cenario();
    p.perseguidor();
    const jp = p.j();
    jp.hp = 10;
    p.tick({ t: 'irPara', x: 4, y: 5 });
    p.avancar(40);
    expect(jp.hp).toBeLessThanOrEqual(10);

    const l = cenario('livre');
    const jl = l.j();
    jl.hp = 10;
    l.tick({ t: 'irPara', x: 6, y: 5 });
    l.avancar(120);
    expect(jl.hp).toBe(10);
  });
});
