// Marco 26 (28/10/2026): a quarta leva nas regras — o "?" curto (D-118), o raio de seleção menor, o golpe fora do
// alcance que troca de alvo (D-119) e o dash e o teleporte que passam por paredes (D-120).

import { describe, expect, it } from 'vitest';
import { avancar, linhaAte, teleportar } from '../../src/combat/efeitos-instantaneos';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { criarEstado } from '../../src/core/estado';
import { criarJogador } from '../../src/entities/fabrica';
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

function cena() {
  const ctx = contexto(faseDeTexto(CORREDORES));
  const estado = criarEstado({ semente: 1, faseId: 'teste' });
  const classe = CONTEUDO.classes.get('guerreiro');
  if (!classe) throw new Error('classe');
  const j = criarJogador(classe, 'j', 2, 1, BALANCE_PADRAO);
  estado.entidades.push(j);
  return { ctx, estado, j };
}

describe('quarta leva: regras', () => {
  it('o raio de seleção de alvo caiu à metade', () => {
    expect(BALANCE_PADRAO.combate.raioTrocaAlvo).toBe(5);
  });

  it('a reta de Bresenham chega à mira sem a célula de partida', () => {
    expect(linhaAte({ x: 0, y: 0 }, { x: 3, y: 1 })).toEqual([{ x: 1, y: 0 }, { x: 2, y: 1 }, { x: 3, y: 1 }]);
  });

  it('o dash atravessa a parede e chega ao outro corredor', () => {
    const c = cena();
    expect(avancar(c.estado, c.ctx, c.j, { x: 2, y: 3 }, 3)).toBe(true);
    expect([c.j.x, c.j.y]).toEqual([2, 3]);
    expect(verificarInvariantes(c.estado, c.ctx)).toEqual([]);
  });

  it('com a mira na parede, o dash para na última livre da reta', () => {
    const c = cena();
    expect(avancar(c.estado, c.ctx, c.j, { x: 2, y: 4 }, 5)).toBe(true);
    expect([c.j.x, c.j.y]).toEqual([2, 3]);
  });

  it('o teleporte mirando a parede cai na primeira livre da reta de volta', () => {
    const c = cena();
    expect(teleportar(c.estado, c.ctx, c.j, { x: 5, y: 4 })).toBe(true);
    expect([c.j.x, c.j.y]).toEqual([4, 3]);
    expect(verificarInvariantes(c.estado, c.ctx)).toEqual([]);
  });

  it('sem a regra, o dash para na parede como antes', () => {
    const c = cena();
    const ctx = { ...c.ctx, balance: { ...c.ctx.balance, movimento: { ...c.ctx.balance.movimento, dashAtravessaParedes: false } } };
    expect(avancar(c.estado, ctx, c.j, { x: 2, y: 3 }, 3)).toBe(false);
    expect([c.j.x, c.j.y]).toEqual([2, 1]);
  });
});
