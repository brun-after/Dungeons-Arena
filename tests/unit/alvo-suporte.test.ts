// 09/11/2026 (D-144): buffs, curas e escudos de alvo único vão no próprio jogador; o aliado só quando pedido (Shift
// ou tocado antes, na interface).

import { describe, expect, it } from 'vitest';
import type { Comando } from '../../src/core/comandos';
import { buscarEntidade, criarEstado } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import type { Entidade } from '../../src/entities/entidade';
import { criarJogador } from '../../src/entities/fabrica';
import { aliadoMaisFeridoPerto, dentroDoAlcance } from '../../src/ui/alvo-suporte';
import { comKit, CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const ctx = contexto(faseDeTexto(SALA_ABERTA), undefined, 'campanha');

function obter<T>(v: T | undefined | null, nome: string): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

function cenario() {
  const estado = criarEstado({ semente: 1, faseId: 'teste' });
  const classe = obter(CONTEUDO.classes.get('aventureiro'), 'classe');
  const j = comKit(criarJogador(classe, 'j', 3, 5, ctx.balance), ['barreira']);
  const k = criarJogador(classe, 'k', 5, 5, ctx.balance);
  k.equipe = j.equipe;
  k.hp = Math.round(k.hpMax / 3);
  estado.entidades.push(j, k);
  const eventos: EventoSimulacao[] = [];
  const tick = (cmd?: Comando) => {
    simular(estado, ctx, cmd ? [{ tick: estado.tick, entidadeId: 'j', cmd }] : [], eventos, DT_MS);
  };
  const ent = (id: string): Entidade => obter(buscarEntidade(estado, id), id);
  const alvoDaAcao = () => eventos.filter((e): e is Extract<EventoSimulacao, { t: 'acaoIniciada' }> => e.t === 'acaoIniciada').at(-1)?.alvoId;
  return { estado, tick, ent, alvoDaAcao };
}

describe('alvo das habilidades de suporte (D-144)', () => {
  it('sem pedido, o escudo vai no próprio jogador (antes ia no aliado mais ferido)', () => {
    const c = cenario();
    c.tick({ t: 'usarHabilidade', id: 'barreira' });
    expect(c.alvoDaAcao()).toBe('j');
  });

  it('pedido no aliado, vai nele', () => {
    const c = cenario();
    c.tick({ t: 'usarHabilidade', id: 'barreira', alvo: 'k' });
    expect(c.alvoDaAcao()).toBe('k');
  });

  it('o mais ferido por perto prioriza jogadores sobre invocações', () => {
    const c = cenario();
    const j = c.ent('j');
    const servo = criarJogador(obter(CONTEUDO.classes.get('aventureiro'), 'classe'), 's', 4, 5, ctx.balance);
    servo.equipe = j.equipe;
    servo.hp = 1;
    servo.invocacao = { donoId: 'j', expiraTick: 999_999, dominado: false, comportamento: 'agressivo', avatar: false, golpesRestantes: 0, abates: 0, criadoTick: 0, nivelDominacao: 0 };
    c.estado.entidades.push(servo);
    expect(aliadoMaisFeridoPerto(c.estado, ctx, j, 6)?.id).toBe('k');
    c.ent('k').hp = c.ent('k').hpMax;
    c.estado.entidades = c.estado.entidades.filter((e) => e.id !== 'k');
    expect(aliadoMaisFeridoPerto(c.estado, ctx, j, 6)?.id).toBe('s');
    expect(aliadoMaisFeridoPerto(c.estado, ctx, j, 0)).toBeNull();
  });
});

// Marco 40 (13/11/2026): as armadilhas vão na célula do cursor, puxada para dentro do alcance.
describe('armadilha no campo', () => {
  it('a célula longe demais vem na linha até o alcance', () => {
    expect(dentroDoAlcance({ x: 0, y: 0 }, { x: 3, y: 1 }, 4)).toEqual({ x: 3, y: 1 });
    expect(dentroDoAlcance({ x: 0, y: 0 }, { x: 8, y: 4 }, 4)).toEqual({ x: 4, y: 2 });
  });
});
