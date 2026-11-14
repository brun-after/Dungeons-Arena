// Marco 40 (13/11/2026, D-161): a Vontade resiste ao controle — encurta atordoamento, prisão e silêncio recebidos,
// somada à tenacidade das passivas, com o teto de `tatica.tenacidadeMaxPct`.
import { describe, expect, it } from 'vitest';
import { aplicarEfeito } from '../../src/combat/efeitos';
import { construirEfeito } from '../../src/combat/registro-efeitos';
import { criarEstado } from '../../src/core/estado';
import { ticksDe } from '../../src/core/tempo';
import { criarJogador } from '../../src/entities/fabrica';
import { tenacidadeDaVontadePct } from '../../src/progression/efeitos-atributo';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const ctx = contexto(faseDeTexto(SALA_ABERTA));

function duracaoDoAtordoamento(vontade: number): number {
  const classe = CONTEUDO.classes.get('mago');
  if (!classe) throw new Error('sem mago');
  const estado = criarEstado({ semente: 1, faseId: ctx.fase.id });
  const j = criarJogador(classe, 'j', 3, 3, ctx.balance);
  j.atributos = { ...j.atributos, vontade };
  estado.entidades.push(j);
  aplicarEfeito(estado, ctx, j, construirEfeito('atordoar', { duracaoMs: 2000 }), { id: 'x', x: 0, y: 0 }, null, []);
  const e = j.efeitos.find((f) => f.tipo === 'atordoar');
  if (!e) throw new Error('sem atordoar');
  return e.ateTick - estado.tick;
}

describe('Vontade e controle (D-161)', () => {
  it('cada ponto acima de 10 encurta o controle recebido', () => {
    const b = ctx.balance;
    const base = { vontade: 10, inteligencia: 10, destreza: 10, constituicao: 10, sabedoria: 10, carisma: 10 };
    expect(tenacidadeDaVontadePct(base, b)).toBe(0);
    expect(tenacidadeDaVontadePct({ ...base, vontade: 30 }, b)).toBeCloseTo(20 * b.atributos.efeitos.tenacidadePorVontadePct);
    const fraca = duracaoDoAtordoamento(10);
    const forte = duracaoDoAtordoamento(40);
    expect(forte).toBeLessThan(fraca);
    expect(fraca).toBeLessThanOrEqual(ticksDe(2000));
  });
});
