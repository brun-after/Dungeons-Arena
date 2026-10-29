// Marco 26 (28/10/2026, D-121): seguir alvo — mantém o alvo no alcance do básico, segue dentro da folga, troca depois
// do abate e cede ao direcional (o contrário cancela).

import { describe, expect, it } from 'vitest';
import { alcanceDe } from '../../src/combat/acao';
import { habilidadeDoAtor } from '../../src/combat/perfil';
import { limiteDeSeguir, raioDeTroca } from '../../src/combat/seguir-alvo';
import type { Comando } from '../../src/core/comandos';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { buscarEntidade, criarEstado } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import type { Entidade } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { verificarInvariantes } from '../sim/harness';
import { CONTEUDO, contexto, faseDeTexto } from '../apoio/fases';

const SALA = ['######################', ...Array.from({ length: 10 }, () => '#....................#'), '######################'];

function obter<T>(v: T | undefined | null, nome: string): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

function cena(classeId: string, inimigos: [string, number, number][]) {
  const ctx = contexto(faseDeTexto(SALA));
  const estado = criarEstado({ semente: 5, faseId: 'teste' });
  estado.entidades.push(criarJogador(obter(CONTEUDO.classes.get(classeId), classeId), 'j', 2, 5, BALANCE_PADRAO));
  const boneco = obter(CONTEUDO.presets.get('boneco'), 'boneco');
  for (const [id, x, y] of inimigos) estado.entidades.push(criarInimigo(boneco, id, x, y, BALANCE_PADRAO));
  const eventos: EventoSimulacao[] = [];
  const j = (): Entidade => obter(buscarEntidade(estado, 'j'), 'j');
  const ent = (id: string): Entidade => obter(buscarEntidade(estado, id), id);
  const tick = (...cmds: Comando[]) => {
    simular(estado, ctx, cmds.map((cmd) => ({ tick: estado.tick, entidadeId: 'j', cmd })), eventos, DT_MS);
  };
  const ticks = (n: number) => {
    for (let i = 0; i < n; i++) {
      tick();
      expect(verificarInvariantes(estado, ctx)).toEqual([]);
    }
  };
  const alcance = () => alcanceDe(ctx, j(), obter(habilidadeDoAtor(ctx, j(), j().ataqueBasico, 0), 'básico'), 0);
  return { ctx, estado, eventos, j, ent, tick, ticks, alcance };
}

/** O alcance do básico da classe (o boneco vai para a célula logo além dele). */
function alcanceDaClasse(classeId: string): number {
  return cena(classeId, []).alcance();
}

describe('seguir alvo (D-121)', () => {
  it('as folgas: à distância 1/3 do alcance, corpo a corpo 100%; a troca em 1× e 4×', () => {
    const ctx = contexto(faseDeTexto(SALA));
    expect(limiteDeSeguir(ctx, 6, true)).toBeCloseTo(8, 1);
    expect(limiteDeSeguir(ctx, 1, false)).toBe(2);
    expect(raioDeTroca(ctx, 6, true)).toBe(6);
    expect(raioDeTroca(ctx, 1, false)).toBe(4);
  });

  it('corpo a corpo: segue o alvo que saiu do alcance dentro da folga e para no alcance', () => {
    const a = alcanceDaClasse('guerreiro');
    const c = cena('guerreiro', [['b', 2 + a + 1, 5]]);
    c.tick({ t: 'seguirAlvo', ligado: true }, { t: 'selecionarAlvo', alvo: 'b', travar: false });
    c.ticks(200);
    expect(Math.max(Math.abs(c.j().x - (2 + a + 1)), Math.abs(c.j().y - 5))).toBeLessThanOrEqual(a);
    expect(c.j().x).toBeGreaterThan(2);
  });

  it('à distância: segue só até 1/3 do alcance a mais', () => {
    const a = alcanceDaClasse('arqueiro');
    const fora = 2 + Math.floor(a * (1 + 1 / 3)) + 1;
    const c = cena('arqueiro', [['b', fora, 5]]);
    c.tick({ t: 'seguirAlvo', ligado: true }, { t: 'selecionarAlvo', alvo: 'b', travar: false });
    c.ticks(200);
    expect([c.j().x, c.j().y]).toEqual([2, 5]);
  });

  it('além da folga não persegue', () => {
    const a = alcanceDaClasse('guerreiro');
    const c = cena('guerreiro', [['b', 2 + 2 * a + 1, 5]]);
    c.tick({ t: 'seguirAlvo', ligado: true }, { t: 'selecionarAlvo', alvo: 'b', travar: false });
    c.ticks(200);
    expect([c.j().x, c.j().y]).toEqual([2, 5]);
  });

  it('desligado, não anda', () => {
    const c = cena('guerreiro', [['b', 2 + alcanceDaClasse('guerreiro') + 1, 5]]);
    c.tick({ t: 'selecionarAlvo', alvo: 'b', travar: false });
    c.ticks(200);
    expect([c.j().x, c.j().y]).toEqual([2, 5]);
  });

  it('o direcional contrário cancela; outra direção só pausa', () => {
    const c = cena('guerreiro', [['b', 2 + alcanceDaClasse('guerreiro') + 1, 5]]);
    c.tick({ t: 'seguirAlvo', ligado: true }, { t: 'selecionarAlvo', alvo: 'b', travar: false });
    // Para o oeste (contrário ao alvo, a leste): cancela.
    c.tick({ t: 'mover', dir: 'O' });
    expect(c.j().seguirCanceladoDe).toBe('b');
    c.tick({ t: 'mover', dir: 'parado' });
    const x = c.j().x;
    c.ticks(200);
    expect(c.j().x).toBeLessThanOrEqual(x);
    // Escolher o alvo de novo desfaz o cancelamento; para o norte (90°) só pausa.
    c.tick({ t: 'selecionarAlvo', alvo: 'b', travar: false });
    c.tick({ t: 'mover', dir: 'N' });
    expect(c.j().seguirCanceladoDe).toBeUndefined();
  });

  it('morto o seguido, troca para o mais perto pela regra do corpo a corpo (até 4×)', () => {
    const c = cena('guerreiro', [['b', 3, 5], ['perto', 5, 7], ['longe', 15, 5]]);
    c.tick({ t: 'seguirAlvo', ligado: true }, { t: 'selecionarAlvo', alvo: 'b', travar: false });
    c.ticks(5);
    c.ent('b').morto = true;
    c.ent('b').hp = 0;
    c.ticks(3);
    expect(c.j().alvoSelecionado).toBe('perto');
  });
});
