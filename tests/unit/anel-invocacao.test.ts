// Marco 25 (25/10/2026, D-103): o anel roxo das invocações do Necromante é a contagem regressiva da duração.
import { describe, expect, it } from 'vitest';
import { anelDaInvocacao, COR_ANEL_NECROMANTE } from '../../src/render/anel-invocacao';

describe('anel das invocações do Necromante', () => {
  it('cheio e roxo ao nascer; esvazia com o tempo; no fim, quase branco e apagado', () => {
    const inv = { criadoTick: 100, expiraTick: 400 };
    expect(anelDaInvocacao(inv, 100)).toEqual({ fracao: 1, cor: COR_ANEL_NECROMANTE, alpha: 0.95 });
    const meio = anelDaInvocacao(inv, 250);
    expect(meio.fracao).toBeCloseTo(0.5, 5);
    expect(meio.cor).toBe(COR_ANEL_NECROMANTE);
    const fim = anelDaInvocacao(inv, 395);
    expect(fim.fracao).toBeLessThan(0.05);
    expect(fim.alpha).toBeLessThan(0.35);
    expect(fim.cor & 0xff).toBeGreaterThan(0xf0);
    expect(anelDaInvocacao(inv, 500).fracao).toBe(0);
  });

  it('a permanente fica com o anel roxo inteiro', () => {
    expect(anelDaInvocacao({ criadoTick: 10, expiraTick: Number.MAX_SAFE_INTEGER }, 99_999)).toEqual({ fracao: 1, cor: COR_ANEL_NECROMANTE, alpha: 0.95 });
  });
});

it('o anel acompanha a menor reserva, independentemente do tempo', () => {
  const inv = { criadoTick: 0, expiraTick: Number.MAX_SAFE_INTEGER, ataquesTotal: 100, ataquesRestantes: 70, resistenciaTotal: 40, resistenciaRestante: 10 };
  expect(anelDaInvocacao(inv, 0).fracao).toBe(0.25);
  expect(anelDaInvocacao(inv, 999999).fracao).toBe(0.25);
  inv.ataquesRestantes = 0;
  expect(anelDaInvocacao(inv, 999999).fracao).toBe(0);
});
