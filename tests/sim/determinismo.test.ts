import { describe, expect, it } from 'vitest';
import { digest } from '../../src/core/digest';
import { clonarEstado } from '../../src/core/estado';
import { criarBotAleatorio, criarCenario, rodar, verificarInvariantes } from './harness';

describe('harness de simulação na fase oficial 1', () => {
  it('mantém as invariantes por 10.000 ticks com bot aleatório', () => {
    const cenario = criarCenario({ semente: 42, inimigos: 20, jogadores: 3 });
    expect(verificarInvariantes(cenario.estado, cenario.ctx)).toEqual([]);
    const eventos = rodar(cenario, 10_000, criarBotAleatorio(7));
    expect(cenario.estado.tick).toBe(10_000);
    // O bot precisa de fato mexer o mundo e lutar, senão o teste não prova nada.
    const contar = (t: string) => eventos.filter((e) => e.t === t).length;
    expect(contar('moveu')).toBeGreaterThan(1_000);
    expect(contar('impacto')).toBeGreaterThan(50);
    expect(contar('acaoCancelada') + contar('esquivou')).toBeGreaterThan(0);
    expect(contar('morreu')).toBeGreaterThan(0);
  });

  it('toda ação ofensiva iniciada dá ao menos 200 ms entre o início e o impacto previsto (§3.6)', () => {
    const cenario = criarCenario({ semente: 8, inimigos: 20, jogadores: 3 });
    const eventos = rodar(cenario, 3_000, criarBotAleatorio(2));
    const iniciadas = eventos.filter((e) => e.t === 'acaoIniciada' && e.alvoId !== e.atorId);
    expect(iniciadas.length).toBeGreaterThan(20);
    for (const e of iniciadas) {
      if (e.t !== 'acaoIniciada') continue;
      expect((e.impactoPrevistoTick - e.inicioTick) * (1000 / 60)).toBeGreaterThanOrEqual(200);
    }
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
