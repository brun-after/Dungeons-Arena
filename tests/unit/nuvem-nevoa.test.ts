// 16/11/2026 (D-181): a nuvem da Forma de névoa cresce com os mortos e as cinzas misturam as afinidades.
import { describe, expect, it } from 'vitest';
import { corPelaParticipacao, raioDaNuvem } from '../../src/render/movimento/nuvem-nevoa';
import type { PontaElemental } from '../../src/progression/vinculo';

const CORES: Partial<Record<PontaElemental, number>> = { fogo: 0xff0000, gelo: 0x0000ff, trevas: 0x00ff00 };
const corDe = (p: PontaElemental) => CORES[p] ?? 0xffffff;

describe('nuvem da névoa (D-181)', () => {
  it('as cinzas pesam cada afinidade pelo quanto participa', () => {
    expect(corPelaParticipacao({ fogo: 0.6 }, corDe)).toBe(0xff0000);
    expect(corPelaParticipacao({ fogo: 0.3, gelo: 0.1 }, corDe)).toBe((0xbf << 16) | 0x40);
    expect(corPelaParticipacao({ fogo: 0.5, gelo: 0.5, trevas: 0 }, corDe)).toBe((0x80 << 16) | 0x80);
  });

  it('sem afinidade nenhuma, não há cor', () => {
    expect(corPelaParticipacao({}, corDe)).toBeNull();
    expect(corPelaParticipacao({ fogo: 0, gelo: 0 }, corDe)).toBeNull();
  });

  it('cresce com os mortos dentro e cobre o mais afastado', () => {
    const tamanhos = [1, 2, 5, 10].map((n) => raioDaNuvem(n, 0));
    for (let i = 1; i < tamanhos.length; i++) expect(tamanhos[i]).toBeGreaterThan(tamanhos[i - 1] ?? 0);
    expect(raioDaNuvem(2, 80)).toBeGreaterThanOrEqual(96);
  });
});
