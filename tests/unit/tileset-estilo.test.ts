// Marco 11A (16/10/2026, D-066): tileset por imagem (D4, autotiling, variação do piso, fatiamento, herança e a
// validação de `tileset`/`pecas`) e o aprendizado de estilo (assinatura, média móvel, regras e `aplicarEstilo`).

import { describe, expect, it } from 'vitest';
import { lerRefFase } from '../../src/save/esquema';
import { aplicarEstilo, assinatura, regrasDoPerfil, registrarAmostras, type PerfilEstilo } from '../../src/world/estilo';
import { carregarFase, type FaseJson } from '../../src/world/fase';
import { catalogoDeGeracao, gerarFase } from '../../src/world/gerador';
import { alcancaveisComPortas } from '../../src/world/navegacao';
import {
  autotile,
  comporD4,
  fatiar,
  lerCamposDeTileset,
  lerPeca,
  matrizD4,
  resolverPeca,
  tilesetHerdado,
  variacaoPiso,
  vinculosCanonicos,
} from '../../src/world/tileset';
import { validarFase } from '../../src/world/validacao-fase';
import { CONTEUDO, faseDeTexto } from '../apoio/fases';

describe('tileset por imagem', () => {
  it('D4: oito transformações distintas; compor com a inversa dá a identidade', () => {
    const matrizes = new Set(Array.from({ length: 8 }, (_, t) => matrizD4(t).join(',')));
    expect(matrizes.size).toBe(8);
    expect(comporD4(1, 3)).toBe(0);
    expect(comporD4(2, 2)).toBe(0);
    expect(comporD4(4, 4)).toBe(0);
    expect(comporD4(1, 1)).toBe(2);
    for (let t = 0; t < 8; t++) expect([...Array(8).keys()].some((u) => comporD4(t, u) === 0)).toBe(true);
    expect(lerPeca('parede_N@3')).toEqual({ chave: 'parede_N', t: 3 });
    expect(lerPeca('x@9')).toBeNull();
  });

  it('autotiling: face, canto interno, canto externo, corredor e pilar', () => {
    const fase = faseDeTexto(['#####', '#...#', '#.#.#', '#...#', '#####']);
    expect(autotile(fase, 2, 0, 0)).toEqual({ chave: 'parede_N', t: 0 });
    expect(autotile(fase, 0, 2, 0)).toEqual({ chave: 'parede_O', t: 0 });
    expect(autotile(fase, 0, 0, 0)).toEqual({ chave: 'canto_NO', t: 0 });
    expect(autotile(fase, 4, 4, 0)).toEqual({ chave: 'canto_SE', t: 0 });
    expect(autotile(fase, 2, 2, 0)).toEqual({ chave: 'parede_int', t: 0 });
    const corredor = faseDeTexto(['#.#', '#.#', '#.#']);
    expect(autotile(corredor, 0, 1, 0)).toEqual({ chave: 'parede_O', t: 0 });
    expect(autotile(corredor, 2, 1, 0)).toEqual({ chave: 'parede_L', t: 0 });
    const vazio = faseDeTexto(['   ', ' . ', '   ']);
    expect(autotile(vazio, 0, 0, 0)).toBeNull();
  });

  it('variação do piso segue os limiares (~3% objeto, ~12% piso_2, ~7,5% piso_3) e é determinística', () => {
    const contagem: Record<string, number> = {};
    for (let y = 0; y < 100; y++) for (let x = 0; x < 100; x++) contagem[variacaoPiso(x, y, 7)] = (contagem[variacaoPiso(x, y, 7)] ?? 0) + 1;
    expect((contagem.objeto_1 ?? 0) / 10000).toBeCloseTo(0.03, 1);
    expect((contagem.piso_2 ?? 0) / 10000).toBeCloseTo(0.12, 1);
    expect((contagem.piso_3 ?? 0) / 10000).toBeCloseTo(0.075, 1);
    expect(variacaoPiso(3, 4, 7)).toBe(variacaoPiso(3, 4, 7));
  });

  it('fatiar arredonda cada borda: as células cobrem a imagem sem buraco nem sobreposição', () => {
    const r = fatiar(250, 250, 4, 2);
    expect(r).toHaveLength(16);
    const linha = (r ?? []).filter((c) => c.linha === 0);
    for (let i = 1; i < linha.length; i++) {
      const anterior = linha[i - 1];
      const atual = linha[i];
      if (anterior && atual) expect(atual.x - (anterior.x + anterior.largura)).toBe(2);
    }
    expect(fatiar(10, 10, 5, 4)).toBeNull();
  });

  it('peça ausente usa a reserva girada; herança pega a fase anterior mais próxima', () => {
    const v = vinculosCanonicos(4);
    delete v.parede_S;
    expect(resolverPeca({ chave: 'parede_S', t: 0 }, v)).toEqual({ chave: 'parede_N', t: 2 });
    expect(vinculosCanonicos(4).canto_int_NO).toBeUndefined();
    expect(vinculosCanonicos(5).canto_int_NO).toBe('4,0');
    expect(tilesetHerdado(['a', null, 'b', null], 3)).toBe('b');
    expect(tilesetHerdado(['a', null], 1)).toBe('a');
    expect(tilesetHerdado([null, 'c'], 0)).toBe('c');
    expect(tilesetHerdado([null, null], 1)).toBeNull();
  });

  it('a validação aceita tileset e peças na forma certa e recusa índice fora do mapa', () => {
    const erros: { mensagem: string }[] = [];
    expect(lerCamposDeTileset({ atlasId: 'atlas-1' }, { 3: 'piso_2@1' }, 10, erros)).toEqual({ tileset: { atlasId: 'atlas-1' }, pecas: { 3: 'piso_2@1' } });
    expect(erros).toEqual([]);
    lerCamposDeTileset({ atlasId: '../x' }, { 99: 'piso' }, 10, erros);
    expect(erros).toHaveLength(2);
    const mapa = ['########', ...Array.from({ length: 6 }, (_, y) => (y === 5 ? '#.....S#' : '#......#')), '########'];
    const fase = { id: 'f', nome: 'f', ordem: 1, tipo: 'campanha', mapa, spawns: [{ x: 1, y: 1 }], tileset: { atlasId: 'a' }, pecas: { 9: 'piso_3' } };
    const r = validarFase(fase);
    expect(r.ok && carregarFase(r.fase).pecas).toEqual({ 9: 'piso_3' });
  });
});

describe('aprendizado de estilo', () => {
  it('assinatura na ordem N, NE, E, SE, S, SO, O, NO com P, F e D', () => {
    const fase = faseDeTexto(['#.#', '.S.', '###']);
    expect(assinatura(fase, 1, 1)).toBe('PFPFFFPF');
  });

  it('média móvel de alpha 0,4; células totalmente cercadas ficam de fora', () => {
    const piso = faseDeTexto(['#####', '#...#', '#...#', '#...#', '#####']);
    let p: PerfilEstilo = registrarAmostras({}, piso, [{ x: 2, y: 2 }]);
    expect(Object.keys(p)).toHaveLength(0);
    p = registrarAmostras({}, piso, [{ x: 1, y: 1 }]);
    const sig = assinatura(piso, 1, 1);
    expect(p[sig]).toEqual({ piso: 1, n: 1 });
    const parede = faseDeTexto(['#####', '#...#', '#.#.#', '#...#', '#####']);
    const p2 = registrarAmostras({ PPPPPPPP: { piso: 1, n: 3 } }, parede, [{ x: 2, y: 2 }]);
    // Pilar cercado de piso: a célula do meio (F) difere dos vizinhos, então conta.
    expect(p2.PPPPPPPP).toEqual({ piso: 0.6, n: 4 });
  });

  it('só regras fortes e com amostras viram parâmetro; o gerador fica determinístico e válido', () => {
    const perfil: PerfilEstilo = { FFFPPPFF: { piso: 0.9, n: 8 }, PPPPPPPP: { piso: 0.1, n: 6 }, FPFPFPFP: { piso: 0.5, n: 20 }, PFPFPFPF: { piso: 1, n: 2 } };
    const regras = regrasDoPerfil(perfil);
    expect(regras).toEqual(['FFFPPPFF1', 'PPPPPPPP0']);
    const params = { id: 'g', nome: 'G', semente: 1234, salas: 8, nivelInimigos: 2, matizGraus: 0, largura: 40, altura: 28, estilo: regras };
    const ref = (p: unknown) => lerRefFase({ tipo: 'gerada', id: 'g', numero: 1, params: p });
    expect(ref(params)).toEqual({ tipo: 'gerada', id: 'g', numero: 1, params });
    expect(ref({ ...params, estilo: ['x'] })).toBeNull();
    const catalogo = catalogoDeGeracao(CONTEUDO, ['pocao_vida']);
    const a = gerarFase(params, catalogo);
    expect(gerarFase(params, catalogo)).toEqual(a);
    const semEstilo = gerarFase({ ...params, estilo: [] }, catalogo);
    expect(a.mapa).not.toEqual(semEstilo.mapa);
    const r = validarFase(a, new Set(CONTEUDO.presets.keys()), CONTEUDO.itens);
    expect(r.ok).toBe(true);
  });

  it('aplicarEstilo nunca quebra o alcance: uma regra que fecharia o caminho é desfeita', () => {
    const json: FaseJson = { id: 'c', nome: 'c', ordem: 1, tipo: 'campanha', mapa: ['#######', '#.....#', '#####S#', '#######'], spawns: [{ x: 1, y: 1 }] };
    // "Fechar todo piso de corredor": fecharia o caminho até a saída.
    const fase = carregarFase(json);
    const regra = `${assinatura(fase, 3, 1)}0`;
    const r = aplicarEstilo(json, [regra], 1);
    const depois = carregarFase(r);
    const alcance = alcancaveisComPortas(depois, { x: 1, y: 1 });
    expect(alcance[2 * depois.largura + 5]).toBe(1);
  });
});
