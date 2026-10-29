// Marco 26 (29/10/2026, D-125): a Investida sempre avança e passa pelas paredes. O avanço de quem conjura sai uma vez,
// no lançamento (antes, só a cada alvo atingido); a linha acerta a trajetória toda, a partir de onde saiu; e, sem
// célula livre na reta, pousa ao lado do alvo. Quem investe para no primeiro inimigo do caminho.

import { describe, expect, it } from 'vitest';
import { iniciarAcao, processarAcoes } from '../../src/combat/acao';
import { deslocaQuemConjura } from '../../src/combat/formas';
import type { Celula } from '../../src/core/comandos';
import type { ContextoSimulacao } from '../../src/core/contexto';
import { criarEstado } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import type { Entidade } from '../../src/entities/entidade';
import { verificarInvariantes } from '../sim/harness';
import { CONTEUDO, contexto, faseDeTexto } from '../apoio/fases';

/** Dois corredores separados por uma parede de 1 célula. */
const CORREDORES = [
  '##########',
  '#........#',
  '##########',
  '#........#',
  '##########',
];

function cena(jx: number, jy: number, inimigos: Celula[] = [], ajustar?: (ctx: ContextoSimulacao) => ContextoSimulacao) {
  const base = contexto(faseDeTexto(CORREDORES));
  const ctx = ajustar ? ajustar(base) : base;
  const estado = criarEstado({ semente: 3, faseId: 'teste' });
  const classe = CONTEUDO.classes.get('guerreiro');
  const preset = CONTEUDO.presets.get('boneco');
  if (!classe || !preset) throw new Error('conteúdo');
  const j = criarJogador(classe, 'j', jx, jy, ctx.balance);
  j.mana = j.manaMax = 1000;
  j.autoAtaque = false;
  j.habilidades = ['investida'];
  estado.entidades.push(j);
  const alvos: Entidade[] = inimigos.map((c, i) => {
    const a = criarInimigo(preset, `a${i}`, c.x, c.y, ctx.balance);
    a.hp = a.hpMax = 10000;
    a.ia = null;
    estado.entidades.push(a);
    return a;
  });
  const eventos: EventoSimulacao[] = [];
  const investir = (alvo: string | Celula) => {
    expect(iniciarAcao(estado, ctx, j, 'investida', alvo, eventos)).toBe(true);
    for (let i = 0; i < 40; i++) {
      estado.tick++;
      processarAcoes(estado, ctx, eventos);
    }
  };
  const deslocamentos = () => eventos.filter((e) => e.t === 'deslocado' && e.id === 'j');
  const atingidos = () => new Set(eventos.flatMap((e) => (e.t === 'impacto' || e.t === 'esquivou' ? [e.alvoId] : [])));
  return { ctx, estado, j, alvos, eventos, investir, deslocamentos, atingidos };
}

describe('Investida (D-125)', () => {
  it('mirando uma célula vazia, avança mesmo sem acertar ninguém', () => {
    const c = cena(2, 1);
    c.investir({ x: 5, y: 1 });
    expect([c.j.x, c.j.y]).toEqual([5, 1]);
    expect(c.deslocamentos()).toHaveLength(1);
    expect(verificarInvariantes(c.estado, c.ctx)).toEqual([]);
  });

  it('o inimigo atrás da parede: passa por ela, pousa ao lado dele e o acerta', () => {
    const c = cena(2, 1, [{ x: 2, y: 3 }]);
    c.investir('a0');
    expect(c.j.y).toBe(3);
    expect(Math.abs(c.j.x - 2)).toBe(1);
    expect(c.atingidos().has('a0')).toBe(true);
    expect(verificarInvariantes(c.estado, c.ctx)).toEqual([]);
  });

  it('com dois inimigos na linha, para no primeiro, avança uma vez só e acerta os dois', () => {
    const c = cena(1, 1, [{ x: 3, y: 1 }, { x: 4, y: 1 }]);
    c.investir('a1');
    expect([c.j.x, c.j.y]).toEqual([2, 1]);
    expect(c.deslocamentos()).toHaveLength(1);
    expect(c.atingidos()).toEqual(new Set(['a0', 'a1']));
  });

  it('com o inimigo colado, não sai do lugar e acerta', () => {
    const c = cena(2, 1, [{ x: 3, y: 1 }]);
    c.investir('a0');
    expect([c.j.x, c.j.y]).toEqual([2, 1]);
    expect(c.deslocamentos()).toHaveLength(0);
    expect(c.atingidos().has('a0')).toBe(true);
  });

  it('sem a regra do dash, para na parede como antes', () => {
    const c = cena(2, 1, [{ x: 2, y: 3 }], (ctx) => ({ ...ctx, balance: { ...ctx.balance, movimento: { ...ctx.balance.movimento, dashAtravessaParedes: false } } }));
    c.investir('a0');
    expect([c.j.x, c.j.y]).toEqual([2, 1]);
    expect(c.atingidos().has('a0')).toBe(false);
  });

  it('toda skill que avança ou teleporta quem conjura sai pelo lançamento', () => {
    const ids = [...CONTEUDO.habilidades.values()].filter(deslocaQuemConjura).map((h) => h.id);
    for (const id of ['investida', 'investida_de_escudo', 'asas_da_aurora', 'ult_impacto_vulcanico', 'ult_eco_do_vazio']) expect(ids, id).toContain(id);
  });
});
