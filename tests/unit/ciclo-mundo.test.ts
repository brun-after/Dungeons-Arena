// Marco 42 (15/11/2026, D-176): o dia e a noite do Mundo.
import { describe, expect, it } from 'vitest';
import { escuroBaseEm, escuroDoLugar, horaDoMundo, luzDaHora, type RegrasDoCiclo } from '../../src/mundo/ciclo';
import { BALANCE_PADRAO } from '../../src/core/contexto';

const R: RegrasDoCiclo = BALANCE_PADRAO.mundo.ciclo;
const MIN = 60_000;
const CICLO = (R.minutos.amanhecer + R.minutos.dia + R.minutos.entardecer + R.minutos.noite) * MIN;

describe('ciclo do dia', () => {
  it('passa pelas quatro fases na ordem e repete', () => {
    const base = CICLO * 1000;
    expect(horaDoMundo(base, R).fase).toBe('amanhecer');
    expect(horaDoMundo(base + (R.minutos.amanhecer + 1) * MIN, R).fase).toBe('dia');
    const noite = base + (R.minutos.amanhecer + R.minutos.dia + R.minutos.entardecer + 1) * MIN;
    expect(horaDoMundo(noite, R).fase).toBe('noite');
    expect(horaDoMundo(noite + CICLO, R).fase).toBe('noite');
  });

  it('a noite sobe no entardecer e desce no amanhecer', () => {
    const base = CICLO * 7;
    const meioEntardecer = base + (R.minutos.amanhecer + R.minutos.dia + R.minutos.entardecer / 2) * MIN;
    expect(horaDoMundo(meioEntardecer, R).noite).toBeCloseTo(0.5, 2);
    expect(horaDoMundo(base + (R.minutos.amanhecer / 2) * MIN, R).noite).toBeCloseTo(0.5, 2);
  });

  it('o fim da fase é o começo da seguinte', () => {
    const h = horaDoMundo(CICLO * 3 + 5 * MIN, R);
    expect(horaDoMundo(h.fim, R).fase).not.toBe(h.fase);
  });

  it('o escuro do lugar é o maior entre a noite, a região e o interior', () => {
    const dia = horaDoMundo(CICLO * 2 + (R.minutos.amanhecer + 5) * MIN, R);
    expect(escuroDoLugar(dia, 0, false)).toBe(0);
    expect(escuroDoLugar(dia, 1, false)).toBe(1);
    expect(escuroDoLugar(dia, 0, true)).toBe(1);
  });

  it('a mata fechada é escura dentro e clareia na borda', () => {
    const fase = { escuroBase: 0, matas: [{ x: 10, y: 10, raio: 5 }] };
    expect(escuroBaseEm(fase, 10, 10)).toBe(1);
    expect(escuroBaseEm(fase, 17, 10)).toBeCloseTo(0.5, 5);
    expect(escuroBaseEm(fase, 30, 10)).toBe(0);
  });

  it('de dia a tela quase não escurece; na mata, escurece como à noite', () => {
    const dia = horaDoMundo(CICLO * 2 + (R.minutos.amanhecer + R.minutos.dia / 2) * MIN, R);
    expect(luzDaHora(dia, R).nivel).toBeLessThan(0.15);
    expect(luzDaHora(dia, R, 1).nivel).toBeCloseTo(R.quadros.noite.nivel, 5);
  });
});
