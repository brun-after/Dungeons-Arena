import { describe, expect, it } from 'vitest';
import { estadoPublico, milesimoParaOCentro } from '../../src/arena/estado-publico';
import { aplicarPatch, GeradorDePatches } from '../../src/arena/patches';
import { digest } from '../../src/core/digest';
import { clonarEstado } from '../../src/core/estado';
import { criarBotAleatorio, criarCenario, rodar } from '../sim/harness';
import { REDE_PERFEITA } from '../../src/net/rede-local';
import { ambiente } from './apoio';

describe('patches de estado (§3.6, D-035)', () => {
  it('aplicar os patches em sequência reproduz exatamente o estado público, por 10.000 ticks', () => {
    const cenario = criarCenario({ semente: 31, inimigos: 20, jogadores: 3 });
    const gerador = new GeradorDePatches();
    const inicial = estadoPublico(cenario.estado);
    gerador.gerar(inicial);
    let reconstruido = clonarEstado(inicial);
    const bot = criarBotAleatorio(4);
    let comparados = 0;
    for (let i = 0; i < 10_000 / 3; i++) {
      rodar(cenario, 3, bot);
      const publico = estadoPublico(cenario.estado);
      reconstruido = aplicarPatch(reconstruido, gerador.gerar(publico));
      expect(digest(reconstruido)).toBe(digest(publico));
      comparados++;
    }
    expect(comparados).toBeGreaterThan(3000);
    // 24/10/2026: ~18 s sozinho; com a suíte inteira em paralelo passava de 60 s.
  }, 150_000);

  it('patch de outra base é recusado', () => {
    const cenario = criarCenario({ semente: 1 });
    const gerador = new GeradorDePatches();
    const a = estadoPublico(cenario.estado);
    gerador.gerar(a);
    rodar(cenario, 3, criarBotAleatorio(1));
    const p1 = gerador.gerar(estadoPublico(cenario.estado));
    rodar(cenario, 3, criarBotAleatorio(1));
    const p2 = gerador.gerar(estadoPublico(cenario.estado));
    expect(() => aplicarPatch(a, p2)).toThrow();
    expect(() => aplicarPatch(aplicarPatch(a, p1), p2)).not.toThrow();
  });

  it('patch é bem menor que o estado completo quando pouca coisa muda', () => {
    const cenario = criarCenario({ semente: 2, inimigos: 20 });
    const gerador = new GeradorDePatches();
    // Depois do primeiro segundo (a IA de todos é criada no primeiro tick).
    rodar(cenario, 60, () => []);
    gerador.gerar(estadoPublico(cenario.estado));
    rodar(cenario, 3, () => []);
    const publico = estadoPublico(cenario.estado);
    const patch = gerador.gerar(publico);
    expect(JSON.stringify(patch).length).toBeLessThan(JSON.stringify(publico).length / 2);
  });

  it('com perda e retransmissão, o cliente pede ressincronização se perder a sequência e volta a convergir', () => {
    const amb = ambiente({ ...REDE_PERFEITA, latenciaMs: 40, jitterMs: 10 }, 1, { bots: true });
    amb.rodar(120);
    const [c] = amb.clientes;
    if (!c?.base) throw new Error('cliente sem base');
    // Simula um furo: o cliente "perde" a base atual.
    c.base = { ...c.base, tick: c.base.tick - 3 };
    c.baseTick -= 3;
    amb.rodar(60);
    expect(c.ressincronizacoes).toBeGreaterThanOrEqual(1);
    expect(amb.digests.get(c.baseTick)).toBe(digest(c.base));
  });
});

describe('posição contínua no estado público (marco 26, D-104)', () => {
  it('vai a milésimos na direção do centro da célula: não entra na parede nem muda a célula', () => {
    expect(milesimoParaOCentro(6.181666666666667)).toBe(6.181);
    expect(milesimoParaOCentro(4.8183333)).toBe(4.819);
    expect(milesimoParaOCentro(5)).toBe(5);
    expect(milesimoParaOCentro(6.4999)).toBe(6.499);
    for (const v of [6.181, 4.819, 2.5, 7.0005]) expect(milesimoParaOCentro(milesimoParaOCentro(v))).toBe(milesimoParaOCentro(v));
    expect(Math.round(milesimoParaOCentro(7.4999999))).toBe(7);
  });
});
