import { Texture } from 'pixi.js';
import { expect, it, vi } from 'vitest';
import { Figura3d, type QuadroDaFigura } from '../../src/render/figura-3d';
import { AtlasDePersonagens } from '../../src/render/personagens-3d';

it('abre o tomo principal na conjuração e guarda os dois tomos em repouso', () => {
  const atlas = new AtlasDePersonagens();
  vi.spyOn(atlas, 'quadro').mockReturnValue(Texture.EMPTY);
  const arma = vi.spyOn(atlas, 'arma').mockReturnValue({ textura: Texture.EMPTY, pegaX: 0.5, pegaY: 0.5 });
  const figura = new Figura3d();
  const q: QuadroDaFigura = {
    modelo: 'mago', estado: 'parado', direcao: 2, indice: 0, agoraMs: 0,
    escala: 1, alturaPx: 0, tinta: 0xffffff, branca: 0, pulso: 0, morto: false, runa: null,
    equipamento: { camadas: [], arma: { modelo: 'tomo', grau: 1 }, secundaria: { modelo: 'codice', grau: 3 }, corElemento: null },
  };
  const quadro = (estado: QuadroDaFigura['estado'], agoraMs: number) => {
    arma.mockClear();
    expect(figura.atualizar(atlas, { ...q, estado, agoraMs })).toBe(true);
    return arma.mock.calls;
  };
  try {
    expect(quadro('parado', 0)).toEqual([['tomo-fechado', 1], ['codice-fechado', 3]]);
    expect(quadro('conjurar', 40)).toEqual([['tomo-fechado', 1], ['codice-fechado', 3]]);
    expect(quadro('conjurar', 150)).toEqual([['tomo', 1], ['codice-fechado', 3]]);
    expect(quadro('andarGolpe', 180)).toEqual([['tomo', 1], ['codice-fechado', 3]]);
    expect(quadro('andar', 330)).toEqual([['tomo-fechado', 1], ['codice-fechado', 3]]);
  } finally {
    figura.destruir();
    atlas.destruir();
  }
});
