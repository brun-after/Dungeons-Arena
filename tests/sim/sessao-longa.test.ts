// Marco 26 (29/10/2026, D-122): numa sessão longa, o estado não cresce sem fim (o que pesava no celular com o tempo).
import { describe, expect, it } from 'vitest';
import { criarBotAleatorio, criarCenario, rodar } from './harness';

describe('sessão longa', () => {
  it('objetos no chão, recargas e entidades ficam estáveis ao longo de 12.000 ticks', { timeout: 120_000 }, () => {
    const cenario = criarCenario({ semente: 77, inimigos: 20, jogadores: 3 });
    const bot = criarBotAleatorio(11);
    const amostras: { objetos: number; recargas: number; entidades: number }[] = [];
    for (let bloco = 0; bloco < 6; bloco++) {
      rodar(cenario, 2_000, bot);
      const { estado } = cenario;
      amostras.push({ objetos: estado.objetos.length, recargas: Object.keys(estado.recargas).length, entidades: estado.entidades.length });
    }
    const [primeira] = amostras;
    if (!primeira) throw new Error('sem amostras');
    const teto = (k: 'objetos' | 'recargas' | 'entidades') => Math.max(...amostras.map((a) => a[k]));
    // Nada passa de 2× o tamanho do começo (com folga mínima para os números pequenos).
    expect(teto('objetos')).toBeLessThanOrEqual(Math.max(20, primeira.objetos * 2));
    expect(teto('recargas')).toBeLessThanOrEqual(Math.max(40, primeira.recargas * 2));
    expect(teto('entidades')).toBeLessThanOrEqual(Math.max(30, primeira.entidades * 2));
  });
});
