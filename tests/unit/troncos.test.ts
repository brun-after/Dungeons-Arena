// Marco 44 (15/11/2026, D-178): as árvores não são parede; só o tronco, fino, barra, e há sempre espaço entre elas.
import { describe, expect, it } from 'vitest';
import type { Fase } from '../../src/world/fase';
import { gerarGeografia, OBSTACULO } from '../../src/world/geografia';
import { caminho } from '../../src/world/navegacao';
import { temTronco, troncoBarra } from '../../src/world/troncos';
import { contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const B = contexto(faseDeTexto(SALA_ABERTA)).balance.movimento;

/** A sala aberta com árvores nas células dadas. */
function comArvores(celulas: [number, number][]): Fase {
  const base = faseDeTexto(SALA_ABERTA);
  const obstaculos = new Uint8Array(base.largura * base.altura);
  for (const [x, y] of celulas) obstaculos[y * base.largura + x] = OBSTACULO.arvore;
  return { ...base, obstaculos };
}

describe('troncos (D-178)', () => {
  it('a célula da árvore continua de chão, e o tronco só barra quem chega perto do centro', () => {
    const fase = comArvores([[4, 3]]);
    expect(temTronco(fase, 4, 3)).toBe(true);
    // Passar raspando a célula (a 0,5 do centro) não bate; chegar ao centro bate.
    expect(troncoBarra(fase, 3, 2.5, 4, 2.5, B.raioCorpo, B.raioTronco)).toBe(false);
    expect(troncoBarra(fase, 3.4, 3, 3.9, 3, B.raioCorpo, B.raioTronco)).toBe(true);
  });

  it('quem está encostado no tronco sempre consegue se afastar', () => {
    const fase = comArvores([[4, 3]]);
    expect(troncoBarra(fase, 4.1, 3, 4.3, 3, B.raioCorpo, B.raioTronco)).toBe(false);
  });

  it('passa-se entre duas árvores com uma célula livre no meio, e a navegação atravessa a mata', () => {
    const fase = comArvores([[3, 3], [5, 3]]);
    expect(troncoBarra(fase, 4, 2, 4, 3, B.raioCorpo, B.raioTronco)).toBe(false);
    expect(troncoBarra(fase, 4, 3, 4, 4, B.raioCorpo, B.raioTronco)).toBe(false);
    const r = caminho(fase, { x: 4, y: 1 }, { x: 4, y: 4 });
    expect(r.status).toBe('alcancado');
    expect(r.passos.some((p) => temTronco(fase, p.x, p.y))).toBe(false);
  });

  it('a geografia deixa sempre uma célula livre entre as árvores, mesmo na mata fechada', () => {
    const n = 96;
    const g = gerarGeografia({ n, semente: 7, bioma: 'floresta', matas: [{ x: 48, y: 48, raio: 30 }] });
    let arvores = 0;
    for (let y = 1; y < n - 1; y++) {
      for (let x = 1; x < n - 1; x++) {
        if (g.obstaculos[y * n + x] !== OBSTACULO.arvore) continue;
        arvores++;
        for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [-1, 1]] as const) expect(g.obstaculos[(y + dy) * n + x + dx]).not.toBe(OBSTACULO.arvore);
      }
    }
    expect(arvores).toBeGreaterThan(50);
  });
});
