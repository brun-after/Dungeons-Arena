import { describe, expect, it } from 'vitest';
import { digest } from '../../src/core/digest';
import { clonarEstado } from '../../src/core/estado';
import { criarBotAleatorio, criarCenario, rodar, verificarInvariantes } from './harness';

describe('harness de simulação na fase oficial 1', () => {
  it('mantém as invariantes por 10.000 ticks com bot aleatório', () => {
    const cenario = criarCenario({ semente: 42, inimigos: 20 });
    expect(verificarInvariantes(cenario.estado, cenario.ctx)).toEqual([]);
    const eventos = rodar(cenario, 10_000, criarBotAleatorio(7));
    expect(cenario.estado.tick).toBe(10_000);
    // O bot precisa de fato mexer o mundo, senão o teste não prova nada.
    expect(eventos.filter((e) => e.t === 'moveu').length).toBeGreaterThan(1_000);
  });

  it('a mesma semente e os mesmos comandos produzem o mesmo digest', () => {
    const a = criarCenario({ semente: 123 });
    const b = criarCenario({ semente: 123 });
    rodar(a, 3_600, criarBotAleatorio(9));
    rodar(b, 3_600, criarBotAleatorio(9));
    expect(digest(a.estado)).toBe(digest(b.estado));
  });

  it('sementes diferentes produzem digests diferentes', () => {
    const a = criarCenario({ semente: 1 });
    const b = criarCenario({ semente: 2 });
    rodar(a, 600, criarBotAleatorio(9));
    rodar(b, 600, criarBotAleatorio(9));
    expect(digest(a.estado)).not.toBe(digest(b.estado));
  });

  it('dois "clientes" clonados no mesmo processo convergem com os mesmos comandos', () => {
    const original = criarCenario({ semente: 77 });
    rodar(original, 500, criarBotAleatorio(3));
    const clone = { estado: clonarEstado(original.estado), ctx: original.ctx };
    expect(digest(clone.estado)).toBe(digest(original.estado));

    rodar(original, 1_000, criarBotAleatorio(5));
    rodar(clone, 1_000, criarBotAleatorio(5));
    expect(digest(clone.estado)).toBe(digest(original.estado));
  });

  it('o clone é independente do original', () => {
    const original = criarCenario({ semente: 5 });
    const clone = clonarEstado(original.estado);
    rodar(original, 600, criarBotAleatorio(1));
    expect(digest(clone)).not.toBe(digest(original.estado));
  });
});
