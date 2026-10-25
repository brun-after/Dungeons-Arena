// Marco 25 (25/10/2026, D-101): mais inimigos conforme se avança, +10% por fase, proporcional à área da fase.
import { describe, expect, it } from 'vitest';
import { contextoDaFase, estadoInicialDaFase, faseOficialOuGerada } from '../../src/save/fases-campanha';
import { numeroDaFase, reforcosDaFase } from '../../src/world/populacao';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function povoada(id: string) {
  const r = contextoDaFase(CONTEUDO, faseOficialOuGerada({ tipo: 'oficial', id }, CONTEUDO));
  if (!r.ok) throw new Error(r.erro);
  return { ctx: r.ctx, estado: estadoInicialDaFase(r.ctx) };
}

describe('reforço de inimigos por fase', () => {
  it('o número da fase: oficiais pela ordem, geradas depois delas', () => {
    expect(numeroDaFase({ id: 'fase-01', ordem: 1 })).toBe(1);
    expect(numeroDaFase({ id: 'fase-02', ordem: 2 })).toBe(2);
    expect(numeroDaFase({ id: 'gerada-4', ordem: 1000 })).toBe(6);
    expect(numeroDaFase({ id: 'arena-01', ordem: 100 })).toBe(1);
  });

  it('a primeira fase não ganha reforço; a segunda ganha; os reforços nascem em células livres e com ids próprios', () => {
    const a = povoada('fase-01');
    expect(a.estado.entidades.filter((e) => e.id.startsWith('r'))).toHaveLength(0);
    const b = povoada('fase-02');
    const reforcos = b.estado.entidades.filter((e) => e.id.startsWith('r'));
    expect(reforcos.length).toBeGreaterThan(0);
    const celulas = new Set(b.estado.entidades.map((e) => `${e.x},${e.y}`));
    expect(celulas.size).toBe(b.estado.entidades.length);
    // Determinístico.
    expect(povoada('fase-02').estado.entidades.map((e) => e.id)).toEqual(b.estado.entidades.map((e) => e.id));
  });

  it('cresce 10% por fase, proporcional à área, e respeita os tetos', () => {
    const ctx = contexto(faseDeTexto(SALA_ABERTA));
    const fase6 = { ...ctx, fase: { ...ctx.fase, id: 'gerada-4' } };
    const area = 100 / ctx.balance.populacao.areaReferencia;
    expect(reforcosDaFase(fase6, 10, 10)).toBe(Math.round(10 * 0.1 * 5 * area));
    const longe = { ...ctx, fase: { ...ctx.fase, id: 'gerada-500' } };
    expect(reforcosDaFase(longe, 10, 10)).toBeLessThanOrEqual(10 * (ctx.balance.populacao.tetoMult - 1));
    expect(reforcosDaFase(longe, 10, ctx.balance.populacao.tetoInimigos)).toBe(0);
  });
});
