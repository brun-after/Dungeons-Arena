// Marco 32 (31/10/2026, D-131): o estado e o quadro dos personagens pré-renderizados.

import { describe, expect, it } from 'vitest';
import { estadoDoPersonagem, quadroDoEstado, SEM_PASSO } from '../../src/render/quadros-personagem';

const base = { morto: false, golpeando: false, conjurando: false, andando: false, golpe: null };

describe('estado do personagem pré-renderizado', () => {
  it('a magia andando dá passos (golpe e conjuração)', () => {
    expect(estadoDoPersonagem({ ...base, golpeando: true, andando: true })).toBe('andarGolpe');
    expect(estadoDoPersonagem({ ...base, conjurando: true, andando: true })).toBe('andarConjurar');
    expect(estadoDoPersonagem({ ...base, conjurando: true })).toBe('conjurar');
  });

  it('cada tipo de arma tem o seu golpe, também na preparação (sem a pose de magia)', () => {
    expect(estadoDoPersonagem({ ...base, golpeando: true, golpe: 'corte' })).toBe('golpeCorte');
    expect(estadoDoPersonagem({ ...base, conjurando: true, golpe: 'disparo' })).toBe('golpeDisparo');
    expect(estadoDoPersonagem({ ...base, golpeando: true, golpe: 'arremesso' })).toBe('golpeArremesso');
    expect(estadoDoPersonagem({ ...base, golpeando: true, golpe: 'contundente' })).toBe('golpeEsmagar');
    // O tomo lê a magia: o golpe de magia da receita.
    expect(estadoDoPersonagem({ ...base, golpeando: true, golpe: 'leitura' })).toBe('golpe');
  });

  it('a morte vence tudo e o atlas sem os golpes novos cai no golpe', () => {
    expect(estadoDoPersonagem({ ...base, morto: true, golpeando: true, golpe: 'corte' })).toBe('morte');
    expect(SEM_PASSO.golpeGiro).toBe('golpe');
    expect(SEM_PASSO.andarConjurar).toBe('conjurar');
  });

  it('os golpes seguem a fração e os ciclos o relógio', () => {
    expect(quadroDoEstado('golpeCorte', 5, 0, 0.5)).toBe(2);
    expect(quadroDoEstado('andarGolpe', 6, 0, 0.99)).toBe(5);
    expect(quadroDoEstado('andarConjurar', 6, 220, null)).toBe(2);
    expect(quadroDoEstado('morte', 6, 10_000, null)).toBe(5);
  });
});
