// 20/11/2026: as IAs não giram em volta das árvores. O ponto do caminho no centro da árvore (o alvo encostado no
// tronco, a patrulha, o recuo) nunca se alcança; o corpo escorregava em volta do tronco para sempre.
import { describe, expect, it } from 'vitest';
import { criarEstado } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { criarInimigo } from '../../src/entities/fabrica';
import { simular } from '../../src/core/simulacao';
import type { Fase } from '../../src/world/fase';
import { OBSTACULO } from '../../src/world/geografia';
import { moverEntidades, planejarCaminho } from '../../src/world/movimento';
import { temTronco } from '../../src/world/troncos';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function comArvores(celulas: [number, number][]): Fase {
  const base = faseDeTexto(SALA_ABERTA);
  const obstaculos = new Uint8Array(base.largura * base.altura);
  for (const [x, y] of celulas) obstaculos[y * base.largura + x] = OBSTACULO.arvore;
  return { ...base, obstaculos };
}

const preset = () => {
  const p = CONTEUDO.presets.values().next().value;
  if (!p) throw Error('sem preset');
  return p;
};

describe('as IAs não giram em volta das árvores (20/11/2026)', () => {
  it('o ponto escrito direto no centro da árvore (como a patrulha faz) termina rente ao tronco e para', () => {
    const ctx = contexto(comArvores([[6, 5]]));
    for (const [ox, oy] of [[5, 5], [6, 4], [7, 6], [5, 6]] as const) {
      const e = criarInimigo(preset(), 'm', ox, oy, ctx.balance, { nivel: 1 });
      const estado = criarEstado({ semente: 1, faseId: 'teste' });
      estado.entidades.push(e);
      e.caminho = [{ x: 6, y: 5 }];
      for (let t = 0; t < 100; t++) moverEntidades(estado, ctx, [], DT_MS);
      expect(e.caminho.length + e.waypoints.length, `de ${ox},${oy}`).toBe(0);
      const parado = { x: e.px, y: e.py };
      for (let t = 0; t < 40; t++) moverEntidades(estado, ctx, [], DT_MS);
      expect(Math.hypot(e.px - parado.x, e.py - parado.y), `de ${ox},${oy}`).toBeLessThan(0.01);
      expect(Math.hypot(e.px - 6, e.py - 5)).toBeLessThan(0.6);
    }
  });

  it('o caminho planejado até a árvore (o alvo encostado no tronco) para rente a ela', () => {
    const ctx = contexto(comArvores([[6, 5]]));
    for (const [ox, oy] of [[2, 5], [6, 1], [2, 2], [9, 8]] as const) {
      const e = criarInimigo(preset(), 'm', ox, oy, ctx.balance, { nivel: 1 });
      const estado = criarEstado({ semente: 1, faseId: 'teste' });
      estado.entidades.push(e);
      expect(planejarCaminho(e, { x: 6, y: 5 }, ctx, 0, [], 30)).toBe(true);
      for (let t = 0; t < 200; t++) moverEntidades(estado, ctx, [], DT_MS);
      const parado = { x: e.px, y: e.py };
      for (let t = 0; t < 20; t++) moverEntidades(estado, ctx, [], DT_MS);
      expect(Math.hypot(e.px - parado.x, e.py - parado.y), `de ${ox},${oy}`).toBeLessThan(0.01);
      expect(Math.hypot(e.px - 6, e.py - 5)).toBeLessThan(0.6);
    }
  });

  it('o monstro patrulhando no meio da mata não escolhe o centro de uma árvore nem fica girando', () => {
    // Uma mata em xadrez com uma célula livre entre as árvores, como a geografia gera.
    const arvores: [number, number][] = [];
    for (let y = 2; y <= 9; y += 2) for (let x = 2; x <= 9; x += 2) arvores.push([x, y]);
    const fase = comArvores(arvores);
    const ctx = contexto(fase, undefined, 'campanha');
    const estado = criarEstado({ semente: 3, faseId: fase.id });
    const monstros = [[3, 3], [5, 7], [7, 5], [9, 9]].map(([x, y], i) => criarInimigo(preset(), `m${i}`, x ?? 1, y ?? 1, ctx.balance, { nivel: 1 }));
    estado.entidades.push(...monstros);
    // Quantos ticks seguidos cada um passa andando colado num tronco (a órbita é andar colado para sempre).
    const colado = new Map<string, number>();
    let pior = 0;
    for (let t = 0; t < 1200; t++) {
      simular(estado, ctx, [], [], DT_MS);
      for (const m of monstros) {
        for (const p of [...m.waypoints, ...m.caminho]) expect(temTronco(fase, p.x, p.y) && Number.isInteger(p.x) && Number.isInteger(p.y)).toBe(false);
        const perto = arvores.some(([x, y]) => Math.hypot(m.px - x, m.py - y) < 0.5);
        const n = perto && m.waypoints.length + m.caminho.length > 0 ? (colado.get(m.id) ?? 0) + 1 : 0;
        colado.set(m.id, n);
        pior = Math.max(pior, n);
      }
    }
    expect(pior).toBeLessThan(40);
  });
});
