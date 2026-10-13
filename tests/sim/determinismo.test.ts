import { describe, expect, it } from 'vitest';
import { digest } from '../../src/core/digest';
import { clonarEstado, criarEntidade, criarEstado } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import { criarBotAleatorio, criarCenario, rodar, verificarInvariantes } from './harness';

describe('harness de simulação', () => {
  it('mantém as invariantes por 10.000 ticks com bot aleatório', () => {
    const estado = criarCenario({ semente: 42, entidades: 30 });
    expect(verificarInvariantes(estado)).toEqual([]);
    rodar(estado, 10_000, criarBotAleatorio(7));
    expect(estado.tick).toBe(10_000);
  });

  it('a mesma semente e os mesmos comandos produzem o mesmo digest', () => {
    const a = criarCenario({ semente: 123 });
    const b = criarCenario({ semente: 123 });
    rodar(a, 3_600, criarBotAleatorio(9));
    rodar(b, 3_600, criarBotAleatorio(9));
    expect(digest(a)).toBe(digest(b));
  });

  it('sementes diferentes produzem digests diferentes', () => {
    const a = criarCenario({ semente: 1 });
    const b = criarCenario({ semente: 2 });
    rodar(a, 600, criarBotAleatorio(9));
    rodar(b, 600, criarBotAleatorio(9));
    expect(digest(a)).not.toBe(digest(b));
  });

  it('dois "clientes" clonados no mesmo processo convergem com os mesmos comandos', () => {
    const original = criarCenario({ semente: 77 });
    rodar(original, 500, criarBotAleatorio(3));
    const clone = clonarEstado(original);
    expect(digest(clone)).toBe(digest(original));

    rodar(original, 1_000, criarBotAleatorio(5));
    rodar(clone, 1_000, criarBotAleatorio(5));
    expect(digest(clone)).toBe(digest(original));
  });

  it('o clone é independente do original', () => {
    const original = criarCenario({ semente: 5 });
    const clone = clonarEstado(original);
    rodar(original, 600, criarBotAleatorio(1));
    expect(digest(clone)).not.toBe(digest(original));
  });
});

describe('movimento do marco 1', () => {
  function andar(dir: 'E' | 'SE' | 'NO', ticks: number) {
    const estado = criarEstado({ semente: 1, largura: 20, altura: 20 });
    estado.entidades.push(criarEntidade('j', 5, 5));
    const eventos: EventoSimulacao[] = [];
    simular(estado, [{ tick: 0, entidadeId: 'j', cmd: { t: 'mover', dir } }], eventos, DT_MS);
    for (let i = 1; i < ticks; i++) simular(estado, [], eventos, DT_MS);
    return { estado, eventos };
  }

  it('anda 2,5 células por segundo na velocidade base', () => {
    // 400 ms por célula = 24 ticks exatos; em 120 ticks (2 s), 5 células.
    expect(andar('E', 23).estado.entidades[0]?.x).toBe(5);
    expect(andar('E', 24).estado.entidades[0]?.x).toBe(6);
    expect(andar('E', 120).estado.entidades[0]?.x).toBe(10);
  });

  it('diagonal vira passos cardinais alternados, começando por X', () => {
    const { eventos } = andar('SE', 120);
    const posicoes = eventos.map((e) => [e.x, e.y]);
    expect(posicoes.slice(0, 4)).toEqual([
      [6, 5],
      [6, 6],
      [7, 6],
      [7, 7],
    ]);
  });

  it('para na borda do mapa sem sair dele', () => {
    const { estado } = andar('NO', 600);
    expect(estado.entidades[0]).toMatchObject({ x: 0, y: 0 });
    expect(verificarInvariantes(estado)).toEqual([]);
  });
});
