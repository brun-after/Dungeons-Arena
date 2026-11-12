// Marco 39 (12/11/2026, D-151): a manifestação da runa no visual. Toda classe tem veículo para toda runa; a matéria de
// cada elemento é própria (nenhuma é só brilho); tudo cresce com o vínculo; a marca no chão vem da faixa 5 e o floreio
// do especialista, da faixa 8.

import { describe, expect, it } from 'vitest';
import type { CenaVfx } from '../../src/render/vfx/cena';
import { CLASSES_COM_RUNA, intensidadeDaRuna, manifestarNoAcerto, materiaDaRuna, RUNAS_VFX } from '../../src/render/vfx/manifestacao-runa';
import type { SistemaParticulas } from '../../src/render/particulas';

function cenaFalsa() {
  const conta = { emissoes: 0, animacoes: 0, marcas: 0, tremores: 0 };
  const particulas = { emitirLista: (lista: readonly unknown[]) => { conta.emissoes += lista.length; }, limite: 100, iso: false } as unknown as SistemaParticulas;
  const c: CenaVfx = {
    particulas,
    agora: 0,
    reduzido: false,
    iso: false,
    tocar: () => { conta.animacoes++; },
    marca: () => { conta.marcas++; },
    ondeEsta: () => null,
    tela: (p) => p,
    chao: (p) => p,
    tremor: () => { conta.tremores++; },
  };
  return { c, conta };
}

const acerto = { chave: 'x', fonteId: 'a', alvoId: 'b', de: { x: 0, y: 0 }, ate: { x: 3, y: 1 }, cor: 0xffffff, escala: 1, critico: false, indice: 0 };

describe('manifestação da runa (D-151)', () => {
  it('a intensidade vai de 0,35 a 1 pela faixa', () => {
    expect(intensidadeDaRuna(0)).toBeCloseTo(0.35);
    expect(intensidadeDaRuna(10)).toBeCloseTo(1);
    expect(intensidadeDaRuna(20)).toBeCloseTo(1);
  });

  it('cada runa tem matéria própria, com mais partículas no especialista', () => {
    const assinaturas = new Set<string>();
    for (const r of RUNAS_VFX) {
      const pouco = materiaDaRuna(r, intensidadeDaRuna(0));
      const muito = materiaDaRuna(r, intensidadeDaRuna(10));
      const soma = (l: typeof pouco) => l.reduce((s, e) => s + e.quantidade, 0);
      expect(soma(muito)).toBeGreaterThan(soma(pouco));
      expect(muito.some((e) => e.textura !== 'brilho' && e.textura !== 'ponto')).toBe(true);
      assinaturas.add(muito.map((e) => e.textura).sort().join(','));
    }
    expect(assinaturas.size).toBe(RUNAS_VFX.length);
  });

  it('as 45 combinações de classe e runa desenham; a marca vem da faixa 5 e o floreio da 8', () => {
    for (const classe of CLASSES_COM_RUNA) {
      for (const r of RUNAS_VFX) {
        const baixo = cenaFalsa();
        manifestarNoAcerto(baixo.c, classe, r, 0, acerto, true);
        expect(baixo.conta.emissoes + baixo.conta.animacoes).toBeGreaterThan(0);
        expect(baixo.conta.marcas).toBe(0);
        const alto = cenaFalsa();
        manifestarNoAcerto(alto.c, classe, r, 10, acerto, true);
        expect(alto.conta.animacoes + alto.conta.emissoes).toBeGreaterThan(baixo.conta.animacoes + baixo.conta.emissoes);
      }
    }
    const terra = cenaFalsa();
    manifestarNoAcerto(terra.c, 'guerreiro', 'terra', 10, acerto, true);
    expect(terra.conta.marcas).toBe(1);
    expect(terra.conta.tremores).toBe(1);
  });
});
