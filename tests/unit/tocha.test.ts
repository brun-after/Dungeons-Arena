// Marco 42 (15/11/2026, D-176): a tocha (a luz própria no Mundo), os postes e fogueiras, e o que apaga.
import { describe, expect, it } from 'vitest';
import { aplicarEfeito } from '../../src/combat/efeitos';
import { temLuzPropria } from '../../src/combat/luz-propria';
import { construirEfeito } from '../../src/combat/registro-efeitos';
import { criarEstado } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import { criarJogador } from '../../src/entities/fabrica';
import { posicionar } from '../../src/entities/entidade';
import { interagirNoMundo } from '../../src/mundo/objetos-mundo';
import { lerLugar, montarLugar } from '../../src/mundo/lugares';
import { MODO_MUNDO } from '../../src/mundo/sala-mundo';
import { modoPorId } from '../../src/core/conteudo';
import { novoObjeto } from '../../src/world/objeto-novo';
import { usarItem } from '../../src/progression/inventario';
import { CONTEUDO, contexto, faseDeTexto } from '../apoio/fases';

const MAPA = ['#########', '#.......#', '#...~~~.#', '#...~~~.#', '#.......#', '#########'];

function cena() {
  const ctx = contexto(faseDeTexto(MAPA));
  const estado = criarEstado({ semente: 1, faseId: 'teste' });
  const classe = CONTEUDO.classes.get('guerreiro');
  if (!classe) throw new Error('classe');
  const e = criarJogador(classe, 'p1', 1, 1, ctx.balance);
  estado.entidades.push(e);
  const eventos: EventoSimulacao[] = [];
  return { ctx, estado, e, eventos };
}

describe('tocha (D-176)', () => {
  it('o item acende a luz própria por 5 min e some da mochila', () => {
    const { ctx, estado, e, eventos } = cena();
    const bolsa = e.bolsa;
    if (!bolsa) throw new Error('bolsa');
    bolsa.mochila.push({ invId: 'tx', itemId: 'tocha', qtd: 2, ref: null });
    expect(temLuzPropria(e)).toBe(false);
    usarItem(estado, e, ctx, 'tx', eventos);
    expect(temLuzPropria(e)).toBe(true);
    expect(bolsa.mochila.find((m) => m.invId === 'tx')?.qtd).toBe(1);
    const tocha = e.efeitos.find((f) => f.tipo === 'tocha');
    expect(tocha && tocha.ateTick - estado.tick).toBe(300_000 / DT_MS);
  });

  it('nadar apaga a tocha', () => {
    const { ctx, estado, e, eventos } = cena();
    aplicarEfeito(estado, ctx, e, construirEfeito('tocha', { duracaoMs: 60_000 }), { id: e.id, x: e.x, y: e.y }, null, eventos);
    posicionar(e, 5, 2);
    simular(estado, ctx, [], eventos, DT_MS);
    expect(temLuzPropria(e)).toBe(false);
  });

  it('a rajada de vento (apagar_luz) apaga a tocha', () => {
    const { ctx, estado, e, eventos } = cena();
    aplicarEfeito(estado, ctx, e, construirEfeito('tocha', { duracaoMs: 60_000 }), { id: e.id, x: e.x, y: e.y }, null, eventos);
    aplicarEfeito(estado, ctx, e, construirEfeito('apagar_luz', {}), { id: 'vento', x: 3, y: 1 }, null, eventos);
    expect(temLuzPropria(e)).toBe(false);
  });

  it('o poste e a fogueira acendem a tocha de quem interage', () => {
    for (const tipo of ['poste_tocha', 'fogueira'] as const) {
      const { ctx, estado, e, eventos } = cena();
      const o = novoObjeto('l1', tipo, 2, 1, {});
      estado.objetos.push(o);
      expect(interagirNoMundo(estado, ctx, e, o, eventos)).toBeNull();
      expect(temLuzPropria(e)).toBe(true);
    }
  });

  it('a vila do centro tem fogueira na praça, postes nas estradas e fogueira na mata', () => {
    const reino = CONTEUDO.reinos.get('reino_central');
    if (!reino) throw new Error('reino');
    const lugar = lerLugar(reino, 'regiao:vila_do_centro');
    if (!lugar) throw new Error('lugar');
    const m = montarLugar(CONTEUDO, reino, lugar, modoPorId(CONTEUDO, MODO_MUNDO));
    const luzes = m.exterior?.pontos.filter((p) => p.tipo === 'luz') ?? [];
    expect(luzes.filter((p) => p.tipo === 'luz' && p.objeto === 'poste_tocha').length).toBeGreaterThan(3);
    expect(luzes.filter((p) => p.tipo === 'luz' && p.objeto === 'fogueira').length).toBe(2);
    expect(m.estado.objetos.some((o) => o.tipo === 'poste_tocha')).toBe(true);
  });
});
