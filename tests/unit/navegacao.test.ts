import { describe, expect, it } from 'vitest';
import type { Celula } from '../../src/core/comandos';
import { passavel, type Fase } from '../../src/world/fase';
import { alcancaveis, caminho } from '../../src/world/navegacao';
import { faseDeTexto, faseOficial01 } from '../apoio/fases';

/** Invariantes da §2.3: cardinal, passável, sem ciclos, terminando no destino. */
function verificarCaminho(fase: Fase, origem: Celula, destino: Celula, passos: Celula[]) {
  let atual = origem;
  const vistos = new Set([`${origem.x},${origem.y}`]);
  for (const p of passos) {
    expect(Math.abs(p.x - atual.x) + Math.abs(p.y - atual.y)).toBe(1);
    expect(passavel(fase, p.x, p.y)).toBe(true);
    const chave = `${p.x},${p.y}`;
    expect(vistos.has(chave)).toBe(false);
    vistos.add(chave);
    atual = p;
  }
  expect(atual).toEqual(destino);
}

describe('caminho (BFS com veioDe)', () => {
  it('origem igual ao destino é alcançada sem passos', () => {
    const fase = faseDeTexto(['#####', '#...#', '#####']);
    expect(caminho(fase, { x: 1, y: 1 }, { x: 1, y: 1 })).toEqual({ status: 'alcancado', passos: [] });
  });

  it('contorna um obstáculo em U, mesmo que a rota primeiro se afaste do destino', () => {
    // O destino fica dentro do U, logo acima da origem; o único acesso é por baixo.
    const fase = faseDeTexto([
      '#########',
      '#.......#',
      '#.#####.#',
      '#.#...#.#',
      '#.#.#.#.#',
      '#...#...#',
      '#########',
    ]);
    const origem = { x: 4, y: 1 };
    const destino = { x: 4, y: 3 };
    const r = caminho(fase, origem, destino);
    expect(r.status).toBe('alcancado');
    verificarCaminho(fase, origem, destino, r.passos);
    // Os primeiros passos aumentam a distância de Manhattan até o destino.
    const primeiro = r.passos[0];
    expect(primeiro && Math.abs(primeiro.y - destino.y)).toBe(2);
    expect(r.passos.length).toBeGreaterThan(2);
  });

  it('distingue inacessível de limite excedido', () => {
    const fase = faseDeTexto(['#########', '#...#...#', '#########']);
    expect(caminho(fase, { x: 1, y: 1 }, { x: 6, y: 1 }).status).toBe('inacessivel');

    const corredor = faseDeTexto(['#'.repeat(30), `#${'.'.repeat(28)}#`, '#'.repeat(30)]);
    expect(caminho(corredor, { x: 1, y: 1 }, { x: 28, y: 1 }, 10).status).toBe('limite_excedido');
    expect(caminho(corredor, { x: 1, y: 1 }, { x: 28, y: 1 }, 27).status).toBe('alcancado');
  });

  it('destino em parede é inacessível', () => {
    const fase = faseDeTexto(['#####', '#...#', '#####']);
    expect(caminho(fase, { x: 1, y: 1 }, { x: 0, y: 0 }).status).toBe('inacessivel');
  });

  it('encontra o caminho mínimo e válido entre salas da fase oficial', () => {
    const fase = faseOficial01();
    const origem = { x: 5, y: 5 };
    const destino = { x: 10, y: 20 };
    const r = caminho(fase, origem, destino, 200);
    expect(r.status).toBe('alcancado');
    verificarCaminho(fase, origem, destino, r.passos);
  });
});

describe('alcancaveis', () => {
  it('marca só a componente conexa da origem', () => {
    const fase = faseDeTexto(['#########', '#...#...#', '#########']);
    const marcadas = alcancaveis(fase, { x: 1, y: 1 });
    expect(marcadas[1 * 9 + 3]).toBe(1);
    expect(marcadas[1 * 9 + 5]).toBe(0);
  });
});
