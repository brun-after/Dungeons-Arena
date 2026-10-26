// Marco 26 (26/10/2026, D-112): os portais mostram a fase para onde levam; os internos se distinguem pela cor.
import { describe, expect, it } from 'vitest';
import { CORES_DOS_PARES, corDoPar } from '../../src/render/molduras-portal';
import { faseSeguinte } from '../../src/save/fases-campanha';
import { temasDosPortais } from '../../src/save/destinos';
import type { RefFase } from '../../src/save/esquema';
import { ESTILOS_PORTAL } from '../../src/world/temas';
import { CONTEUDO } from '../apoio/fases';

describe('portais por destino', () => {
  it('todo tema tem um portal com estilo conhecido', () => {
    for (const tema of CONTEUDO.temas.values()) expect(ESTILOS_PORTAL, tema.id).toContain(tema.portal.estilo);
    // Os temas de gelo levam a portais congelados; os de fogo, a portais em brasa.
    expect(CONTEUDO.temas.get('caverna_gelo')?.portal.estilo).toBe('gelo');
    expect(CONTEUDO.temas.get('vulcao')?.portal.estilo).toBe('fogo');
  });

  it('a saída mostra o tema da fase seguinte e o retorno, o da anterior', () => {
    const primeira = faseSeguinte({ tipo: 'oficial', id: 'fase-02' });
    expect(primeira?.tipo).toBe('gerada');
    if (primeira?.tipo !== 'gerada') return;
    const segunda = faseSeguinte(primeira) as RefFase;
    const destinos = temasDosPortais(primeira);
    expect(destinos.saida).toBe(segunda.tipo === 'gerada' ? (segunda.params.tema ?? null) : null);
    // A primeira gerada volta para a oficial, que não tem tema: portal neutro.
    expect(destinos.retorno).toBeNull();
    expect(temasDosPortais(segunda).retorno).toBe(primeira.params.tema ?? null);
  });

  it('os pares de portais internos têm cores distintas', () => {
    expect(new Set(CORES_DOS_PARES).size).toBe(CORES_DOS_PARES.length);
    expect(corDoPar(1)).not.toBe(corDoPar(2));
    expect(corDoPar(1 + CORES_DOS_PARES.length)).toBe(corDoPar(1));
  });
});
