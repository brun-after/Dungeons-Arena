import { describe, expect, it } from 'vitest';
import { criarFila, enfileirar, retirarAte, type ComandoDoTick } from '../../src/core/comandos';
import { Barramento } from '../../src/core/events';

const mover = (tick: number, entidadeId: string): ComandoDoTick => ({
  tick,
  entidadeId,
  cmd: { t: 'mover', dir: 'N' },
});

describe('fila de comandos', () => {
  it('retira só os comandos até o tick, na ordem de chegada', () => {
    const fila = criarFila();
    enfileirar(fila, mover(2, 'b'));
    enfileirar(fila, mover(1, 'a'));
    enfileirar(fila, mover(5, 'c'));
    expect(retirarAte(fila, 2).map((c) => c.entidadeId)).toEqual(['b', 'a']);
    expect(fila.pendentes.map((c) => c.entidadeId)).toEqual(['c']);
  });

  it('recusa comandos quando a fila está cheia', () => {
    const fila = criarFila(2);
    expect(enfileirar(fila, mover(0, 'a'))).toBe(true);
    expect(enfileirar(fila, mover(0, 'b'))).toBe(true);
    expect(enfileirar(fila, mover(0, 'c'))).toBe(false);
    expect(fila.pendentes).toHaveLength(2);
  });
});

describe('barramento de eventos', () => {
  interface Eventos {
    dano: { alvo: string; valor: number };
    pausa: undefined;
  }

  it('entrega o payload tipado e permite cancelar a inscrição', () => {
    const bus = new Barramento<Eventos>();
    const recebidos: number[] = [];
    const cancelar = bus.on('dano', (p) => recebidos.push(p.valor));
    bus.emitir('dano', { alvo: 'x', valor: 3 });
    cancelar();
    bus.emitir('dano', { alvo: 'x', valor: 4 });
    expect(recebidos).toEqual([3]);
  });

  it('emitir sem ouvintes não falha', () => {
    const bus = new Barramento<Eventos>();
    expect(() => {
      bus.emitir('pausa', undefined);
    }).not.toThrow();
  });
});
