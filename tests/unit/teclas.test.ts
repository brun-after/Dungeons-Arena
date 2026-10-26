// Marco 26 (25/10/2026, D-107): teclas de movimento — WASD na tela, EWAS na inclinação do isométrico.
import { describe, expect, it } from 'vitest';
import { ehTeclaDeMovimento, letraInteragir, rumoDasTeclas, teclaInteragir } from '../../src/input/teclas';
import { criarProjecao } from '../../src/render/projecao';

describe('EWAS no isométrico', () => {
  it('cada tecla anda exatamente num eixo da fase', () => {
    expect(rumoDasTeclas(['KeyE'], 'ewas', true)).toEqual({ dir: 'N', dx: 0, dy: -1000 });
    expect(rumoDasTeclas(['KeyW'], 'ewas', true)).toEqual({ dir: 'O', dx: -1000, dy: 0 });
    expect(rumoDasTeclas(['KeyA'], 'ewas', true)).toEqual({ dir: 'S', dx: 0, dy: 1000 });
    expect(rumoDasTeclas(['KeyS'], 'ewas', true)).toEqual({ dir: 'E', dx: 1000, dy: 0 });
  });

  it('na tela, E sobe para a direita na inclinação e W sobe para a esquerda', () => {
    const p = criarProjecao('iso', 20, 20);
    const naTela = (codigo: string) => {
      const r = rumoDasTeclas([codigo], 'ewas', true);
      const a = p.projetar(0, 0);
      const b = p.projetar(r.dx, r.dy);
      return { x: Math.sign(b.x - a.x), y: Math.sign(b.y - a.y) };
    };
    expect(naTela('KeyE')).toEqual({ x: 1, y: -1 });
    expect(naTela('KeyW')).toEqual({ x: -1, y: -1 });
    expect(naTela('KeyA')).toEqual({ x: -1, y: 1 });
    expect(naTela('KeyS')).toEqual({ x: 1, y: 1 });
  });

  it('duas teclas dão a diagonal da fase (E + S anda para a direita na tela)', () => {
    expect(rumoDasTeclas(['KeyE', 'KeyS'], 'ewas', true)).toEqual({ dir: 'NE', dx: 707, dy: -707 });
    expect(rumoDasTeclas(['KeyE', 'KeyA'], 'ewas', true).dir).toBe('parado');
  });

  it('o D interage e não anda; as setas continuam na tela', () => {
    expect(teclaInteragir('ewas', true)).toBe('KeyD');
    expect(letraInteragir('ewas', true)).toBe('D');
    expect(ehTeclaDeMovimento('KeyD', 'ewas', true)).toBe(false);
    expect(ehTeclaDeMovimento('KeyE', 'ewas', true)).toBe(true);
    expect(rumoDasTeclas(['ArrowUp'], 'ewas', true)).toEqual(rumoDasTeclas(['KeyW'], 'wasd', true));
  });
});

describe('WASD e EWAS de cima', () => {
  it('WASD segue como antes e o E interage', () => {
    expect(rumoDasTeclas(['KeyD'], 'wasd', false)).toEqual({ dir: 'E', dx: 1000, dy: 0 });
    expect(rumoDasTeclas(['KeyW'], 'wasd', true)).toEqual({ dir: 'NO', dx: -707, dy: -707 });
    expect(teclaInteragir('wasd', true)).toBe('KeyE');
    expect(ehTeclaDeMovimento('KeyE', 'wasd', true)).toBe(false);
  });

  it('EWAS na visão de cima vale como WASD (a tela já é a fase)', () => {
    expect(rumoDasTeclas(['KeyD'], 'ewas', false)).toEqual({ dir: 'E', dx: 1000, dy: 0 });
    expect(teclaInteragir('ewas', false)).toBe('KeyE');
    expect(letraInteragir('ewas', false)).toBe('E');
  });
});
