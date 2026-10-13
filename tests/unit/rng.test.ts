import { describe, expect, it } from 'vitest';
import { aleatorio, clonarRng, criarRng, escolher, hashTexto, inteiro, proximoU32 } from '../../src/core/rng';

describe('rng', () => {
  it('a mesma semente gera a mesma sequência', () => {
    const a = criarRng(2026);
    const b = criarRng(2026);
    const seqA = Array.from({ length: 100 }, () => proximoU32(a));
    const seqB = Array.from({ length: 100 }, () => proximoU32(b));
    expect(seqA).toEqual(seqB);
  });

  it('sementes próximas geram sequências diferentes', () => {
    expect(proximoU32(criarRng(1))).not.toBe(proximoU32(criarRng(2)));
  });

  it('aleatorio fica em [0, 1)', () => {
    const rng = criarRng(9);
    for (let i = 0; i < 10_000; i++) {
      const v = aleatorio(rng);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('inteiro cobre o intervalo inclusivo, sem sair dele', () => {
    const rng = criarRng(3);
    const vistos = new Set<number>();
    for (let i = 0; i < 2_000; i++) {
      const v = inteiro(rng, 1, 6);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
      vistos.add(v);
    }
    expect(vistos.size).toBe(6);
  });

  it('inteiro rejeita intervalo inválido', () => {
    expect(() => inteiro(criarRng(1), 5, 1)).toThrow(RangeError);
  });

  it('o clone continua a sequência de forma idêntica e independente', () => {
    const rng = criarRng(11);
    proximoU32(rng);
    const clone = clonarRng(rng);
    expect(proximoU32(clone)).toBe(proximoU32(rng));
    proximoU32(rng);
    expect(clone).not.toEqual(rng);
  });

  it('escolher devolve um item da lista e rejeita lista vazia', () => {
    const rng = criarRng(4);
    expect(['a', 'b', 'c']).toContain(escolher(rng, ['a', 'b', 'c']));
    expect(() => escolher(rng, [])).toThrow(RangeError);
  });

  it('hashTexto é estável e distingue textos', () => {
    expect(hashTexto('fase-1')).toBe(hashTexto('fase-1'));
    expect(hashTexto('fase-1')).not.toBe(hashTexto('fase-2'));
    expect(hashTexto('')).toBe(0x811c9dc5);
  });
});
