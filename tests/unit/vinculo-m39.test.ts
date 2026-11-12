// Marco 39 (12/11/2026, D-150): o vínculo elemental — barra, uso que esfria e itens; a resistência pela afinidade (fraco
// sem vínculo, neutro no generalista, forte no especialista; o Físico sem fraqueza); a penetração no próprio elemento.
import { describe, expect, it } from 'vitest';
import { comPenetracao } from '../../src/combat/golpe';
import { resistenciaPct } from '../../src/combat/elementos';
import { ticksDe } from '../../src/core/tempo';
import { criarJogador } from '../../src/entities/fabrica';
import { penetracaoPct, registrarUso, resistenciaDoVinculoPct, usoAtual, vinculoDe } from '../../src/progression/vinculo';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const ctx = contexto(faseDeTexto(SALA_ABERTA));
const r = ctx.balance.vinculo;
function obter<T>(v: T | null | undefined): T {
  if (v === null || v === undefined) throw Error('ausente');
  return v;
}

describe('vínculo elemental (eneágono)', () => {
  it('resistência: −10% sem vínculo, perto do neutro no generalista, +30% no especialista; o Físico não é fraco', () => {
    expect(resistenciaDoVinculoPct(r, 'fogo', 0)).toBe(-r.fraquezaPct);
    expect(resistenciaDoVinculoPct(r, 'fogo', 1)).toBeCloseTo(r.resistenciaMaxPct);
    const generalista = resistenciaDoVinculoPct(r, 'fogo', 1 / 6);
    expect(generalista).toBeGreaterThan(0);
    expect(generalista).toBeLessThan(8);
    expect(resistenciaDoVinculoPct(r, 'fisico', 0)).toBe(0);
    expect(resistenciaDoVinculoPct(r, 'fisico', 1)).toBeCloseTo(r.resistenciaMaxFisicoPct);
  });

  it('a barra dá metade; o uso sobe, satura e esfria pela meia-vida', () => {
    const j = criarJogador(obter(CONTEUDO.classes.get('mago')), 'j', 2, 2, ctx.balance);
    const b = obter(j.bolsa);
    const antes = vinculoDe(ctx, j, 0);
    expect(Object.values(antes).reduce((s, v) => s + v, 0)).toBeCloseTo(r.barraPct / 100);
    for (let i = 0; i < r.usoSaturacao + 5; i++) registrarUso(ctx, b, 'fogo', 0);
    expect(obter(b.vinculoUso?.fogo).valor).toBe(r.usoSaturacao);
    expect(vinculoDe(ctx, j, 0).fogo).toBeGreaterThanOrEqual(r.usoPct / 100);
    const meiaVida = ticksDe(r.usoMeiaVidaS * 1000);
    expect(usoAtual(r, b.vinculoUso?.fogo, meiaVida)).toBeCloseTo(r.usoSaturacao / 2);
  });

  it('o personagem sem vínculo com o raio leva mais dano de raio; o golpe sem elemento não é fraco', () => {
    const j = criarJogador(obter(CONTEUDO.classes.get('guerreiro')), 'j', 2, 2, ctx.balance);
    const raio = vinculoDe(ctx, j, 0).raio;
    expect(resistenciaPct(ctx, j, 'raio', 0)).toBeCloseTo(resistenciaDoVinculoPct(r, 'raio', raio));
    if (raio === 0) expect(resistenciaPct(ctx, j, 'raio', 0)).toBeLessThan(0);
    expect(resistenciaPct(ctx, j, null, 0)).toBeGreaterThanOrEqual(0);
  });

  it('a penetração fura a resistência e a absorção, mas não a imunidade exata', () => {
    expect(comPenetracao(50, 0)).toBe(50);
    expect(comPenetracao(50, 60)).toBeCloseTo(20);
    // Absorção de 50% (resistência 150): com 60% de penetração vira 40% de dano.
    expect(comPenetracao(150, 60)).toBeCloseTo(60);
    expect(comPenetracao(100, 60)).toBe(100);
    const j = criarJogador(obter(CONTEUDO.classes.get('mago')), 'j', 2, 2, ctx.balance);
    for (let i = 0; i < r.usoSaturacao; i++) registrarUso(ctx, obter(j.bolsa), 'gelo', 0);
    expect(penetracaoPct(ctx, j, 'gelo', 0)).toBeGreaterThan(0);
    expect(penetracaoPct(ctx, j, null, 0)).toBe(0);
  });
});
