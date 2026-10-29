import { describe, expect, it } from 'vitest';
import { RelogioManual } from '../../src/core/clock';
import { avancarLaco, criarAcumulador, DT_MS, MAX_QUADRO_MS, ORCAMENTO_SIM_SOLO_MS } from '../../src/core/loop';

describe('laço de passo fixo', () => {
  function contarPassos(quadrosMs: number[]) {
    const relogio = new RelogioManual(1_000);
    const acumulador = criarAcumulador();
    let ticks = 0;
    let ultimoAlpha = 0;
    avancarLaco(acumulador, relogio.agoraMs(), () => ticks++);
    for (const ms of quadrosMs) {
      relogio.avancar(ms);
      ultimoAlpha = avancarLaco(acumulador, relogio.agoraMs(), () => ticks++).alpha;
    }
    return { ticks, ultimoAlpha };
  }

  it('o primeiro quadro só inicializa, sem simular', () => {
    const acumulador = criarAcumulador();
    expect(avancarLaco(acumulador, 500, () => undefined)).toEqual({ passos: 0, alpha: 0 });
  });

  it('simula 60 ticks por segundo, independentemente da taxa de quadros', () => {
    expect(contarPassos(Array<number>(60).fill(1000 / 60)).ticks).toBe(60);
    expect(contarPassos(Array<number>(30).fill(1000 / 30)).ticks).toBe(60);
    expect(contarPassos(Array<number>(144).fill(1000 / 144)).ticks).toBe(60);
  });

  it(`limita a ${MAX_QUADRO_MS} ms por quadro após uma pausa longa`, () => {
    const { ticks } = contarPassos([10_000]);
    expect(ticks).toBe(Math.round(MAX_QUADRO_MS / DT_MS)); // 15
  });

  it('alpha fica em [0, 1)', () => {
    const { ultimoAlpha } = contarPassos([DT_MS * 2.5]);
    expect(ultimoAlpha).toBeGreaterThanOrEqual(0);
    expect(ultimoAlpha).toBeLessThan(1);
    expect(ultimoAlpha).toBeCloseTo(0.5);
  });

  it('relógio que volta no tempo não gera passos', () => {
    const acumulador = criarAcumulador();
    avancarLaco(acumulador, 1_000, () => undefined);
    expect(avancarLaco(acumulador, 900, () => undefined).passos).toBe(0);
  });
});

// Marco 26 (29/10/2026, D-122): o orçamento de simulação da campanha solo descarta o atraso só quando o tick é caro.
describe('orçamento de simulação por quadro', () => {
  /** Um relógio de mentira: cada tick custa `custoMs`. */
  const relogioComCusto = (custoMs: number) => {
    let agora = 0;
    return { relogio: () => agora, tick: () => { agora += custoMs; } };
  };

  it('com o tick caro, para no orçamento e guarda só a fração do tick', () => {
    const acumulador = criarAcumulador();
    avancarLaco(acumulador, 0, () => undefined);
    const r = relogioComCusto(4);
    const res = avancarLaco(acumulador, 200 + DT_MS / 2, r.tick, { ms: ORCAMENTO_SIM_SOLO_MS, relogio: r.relogio });
    expect(res.passos).toBe(Math.ceil(ORCAMENTO_SIM_SOLO_MS / 4));
    expect(acumulador.acumuladoMs).toBeLessThan(DT_MS);
  });

  it('com o tick barato, recupera todo o atraso (desenho lento não vira câmera lenta)', () => {
    const acumulador = criarAcumulador();
    avancarLaco(acumulador, 0, () => undefined);
    const r = relogioComCusto(0.1);
    const res = avancarLaco(acumulador, 200, r.tick, { ms: ORCAMENTO_SIM_SOLO_MS, relogio: r.relogio });
    expect(res.passos).toBe(12);
  });

  it('sempre roda ao menos um tick', () => {
    const acumulador = criarAcumulador();
    avancarLaco(acumulador, 0, () => undefined);
    const r = relogioComCusto(50);
    expect(avancarLaco(acumulador, 100, r.tick, { ms: ORCAMENTO_SIM_SOLO_MS, relogio: r.relogio }).passos).toBe(1);
  });
});
