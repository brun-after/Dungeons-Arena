// Marco 32 (31/10/2026, D-131): o estado e o quadro dos personagens pré-renderizados.

import { describe, expect, it } from 'vitest';
import {
  duracaoVisualDoGolpe, estadoDoPersonagem, PAUSA_DO_IMPACTO_MS, PERFIS_DE_GOLPE, progressoDoGolpe, quadroDoEstado, SEM_PASSO, voltaDoGolpe,
} from '../../src/render/quadros-personagem';

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

// Marco 37 (05/11/2026): o golpe em três tempos (carga na conjuração, impacto no lançamento, pausa e volta).
describe('tempo do golpe', () => {
  const espada = PERFIS_DE_GOLPE.Sword_Attack;
  if (!espada) throw new Error('perfil ausente');

  it('a carga cresce na conjuração e o impacto cai no lançamento', () => {
    const quadros = [0, 0.3, 0.6, 0.8, 1].map((p) => progressoDoGolpe(espada, p, null));
    for (let i = 1; i < quadros.length; i++) expect(quadros[i]).toBeGreaterThanOrEqual(quadros[i - 1] ?? 0);
    expect(progressoDoGolpe(espada, 0.7, null)).toBeCloseTo(espada.carga, 5);
    expect(progressoDoGolpe(espada, 1, null)).toBeCloseTo(espada.impacto, 5);
  });

  it('segura o impacto um instante e volta até o fim do clipe sem recomeçar', () => {
    expect(progressoDoGolpe(espada, null, 0)).toBeCloseTo(espada.impacto, 5);
    expect(progressoDoGolpe(espada, null, PAUSA_DO_IMPACTO_MS - 1)).toBeCloseTo(espada.impacto, 5);
    const meio = progressoDoGolpe(espada, null, PAUSA_DO_IMPACTO_MS + voltaDoGolpe(espada) / 2);
    expect(meio).toBeGreaterThan(espada.impacto);
    expect(progressoDoGolpe(espada, null, duracaoVisualDoGolpe(espada, true))).toBeGreaterThan(0.99);
  });

  it('sem conjuração, o golpe desce rápido depois do lançamento', () => {
    expect(progressoDoGolpe(espada, null, 0, false)).toBeCloseTo(espada.carga, 5);
    expect(progressoDoGolpe(espada, null, 120, false)).toBeCloseTo(espada.impacto, 5);
  });

  it('o clipe em laço dá a volta (o machado sobe no fim do laço e desce no começo)', () => {
    const machado = PERFIS_DE_GOLPE.TreeChopping_Loop;
    if (!machado) throw new Error('perfil ausente');
    expect(progressoDoGolpe(machado, 0, null)).toBeCloseTo(0.5, 5);
    expect(progressoDoGolpe(machado, 1, null)).toBeCloseTo(0.18, 5);
  });

  it('a criatura sem arma prepara o golpe físico no golpe, não na magia', () => {
    expect(estadoDoPersonagem({ ...base, conjurando: true, fisico: true })).toBe('golpe');
    expect(estadoDoPersonagem({ ...base, conjurando: true, fisico: true, andando: true })).toBe('andarGolpe');
    expect(estadoDoPersonagem({ ...base, conjurando: true })).toBe('conjurar');
  });
});
