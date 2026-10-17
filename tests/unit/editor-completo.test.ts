// Marco 11A (16/10/2026, D-066): o editor completo (ida e volta sem perda, balde, retângulo, redimensionar, portas,
// chefe, histórico com retratos) e a aventura de várias fases (migração do formato antigo, sequência, herança).

import { describe, expect, it } from 'vitest';
import fase01 from '../../src/data/fases/fase-01.json';
import fase02 from '../../src/data/fases/fase-02.json';
import { faseJsonDaAventura, moverFase, removerFase, validarAventura, type Aventura } from '../../src/editor/aventura';
import { adicionarPortaInterna, celulasDoRetangulo, distribuir, marcarChefe, preencher, redimensionar, retangulo, substituirFase } from '../../src/editor/ferramentas';
import { aplicarFerramenta, clonarFaseEditavel, deFaseJson, lerCelula, novaFaseEditavel, paraFaseJson, type FaseEditavel } from '../../src/editor/grade';
import { Historico } from '../../src/editor/historico';
import { lerRegistroAventura } from '../../src/plataforma/aventuras';
import { chaveDaFase, lerRefFase } from '../../src/save/esquema';
import { faseSeguinte } from '../../src/save/fases-campanha';
import { carregarFase, type FaseJson } from '../../src/world/fase';
import { validarFase } from '../../src/world/validacao-fase';
import { CONTEUDO } from '../apoio/fases';

const presets = new Set(CONTEUDO.presets.keys());

function validada(json: unknown): FaseJson {
  const r = validarFase(json, presets, CONTEUDO.itens);
  if (!r.ok) throw new Error(JSON.stringify(r.erros));
  return r.fase;
}

const sala = (): FaseEditavel => novaFaseEditavel('s', 'Sala', 12, 10);

describe('ida e volta pelo editor', () => {
  it.each([
    ['fase-01', fase01],
    ['fase-02', fase02],
  ])('a %s oficial volta igual (terreno, objetos, portas, tranca e matiz)', (_, json) => {
    const original = validada(json);
    const volta = validada({ ...paraFaseJson(deFaseJson(original)), ordem: original.ordem });
    const a = carregarFase(original);
    const b = carregarFase(volta);
    expect({ ...b, id: a.id }).toEqual(a);
  });

  it('o rascunho antigo (uma fase, orbes do 8A) vira aventura de uma fase', () => {
    const f = sala();
    const antigo = {
      ...f,
      objetos: [{ x: 3, y: 3, tipo: 'orbe_hp', efeito: null }],
      portaSaida: undefined,
      portasInternas: undefined,
      matizGraus: undefined,
      tilesetId: undefined,
      pecas: undefined,
      atualizadoEm: 5,
    };
    const r = lerRegistroAventura(antigo);
    expect(r?.fases).toHaveLength(1);
    expect(r?.fases[0]?.objetos).toEqual([{ tipo: 'orbe_hp', x: 3, y: 3, valor: 30, modo: 'pct' }]);
    expect(r?.fases[0]?.portaSaida).toBeNull();
  });
});

describe('ferramentas do editor', () => {
  it('balde preenche só a região 4-conexa do mesmo terreno; acima do teto, recusa inteiro', () => {
    const f = sala();
    for (let y = 1; y < 9; y++) aplicarFerramenta(f, { t: 'terreno', tipo: 'parede' }, 5, y);
    const r = preencher(f, { x: 2, y: 2 }, { t: 'terreno', tipo: 'vazio' });
    expect(r.excedeu).toBe(false);
    expect(r.alteracoes).toHaveLength(4 * 8);
    expect(lerCelula(f, 7, 2).tipo).toBe('piso');
    const grande = preencher(f, { x: 7, y: 2 }, { t: 'terreno', tipo: 'vazio' }, 10);
    expect(grande).toEqual({ alteracoes: [], excedeu: true });
    expect(lerCelula(f, 7, 2).tipo).toBe('piso');
  });

  it('retângulo cheio e vazado, recortado ao mapa', () => {
    const f = sala();
    expect(celulasDoRetangulo(f, { x: 2, y: 2 }, { x: 4, y: 4 })).toHaveLength(9);
    expect(celulasDoRetangulo(f, { x: 2, y: 2 }, { x: 4, y: 4 }, true)).toHaveLength(8);
    expect(celulasDoRetangulo(f, { x: 10, y: 8 }, { x: 40, y: 40 })).toHaveLength(2 * 2);
    expect(retangulo(f, { x: 2, y: 2 }, { x: 3, y: 3 }, { t: 'terreno', tipo: 'parede' })).toHaveLength(4);
  });

  it('redimensionar recorta o que sai, conta, e o desfazer devolve tudo', () => {
    const f = sala();
    aplicarFerramenta(f, { t: 'inimigo', preset: 'goblin' }, 10, 8);
    aplicarFerramenta(f, { t: 'objeto', modelo: { tipo: 'bau', loot: ['pocao_vida'], ouro: 5 } }, 2, 2);
    aplicarFerramenta(f, { t: 'peca', peca: 'piso_2' }, 9, 7);
    const antes = clonarFaseEditavel(f);
    const r = redimensionar(f, 8, 8);
    expect(r.removidos).toBe(2);
    expect(r.fase.objetos).toHaveLength(1);
    expect(r.fase.celulas).toHaveLength(64);
    const maior = redimensionar(f, 14, 12);
    expect(maior.removidos).toBe(0);
    expect(maior.fase.pecas[String(7 * 14 + 9)]).toBe('piso_2');
    expect(lerCelula(maior.fase, 13, 11).tipo).toBe('parede');
    const h = new Historico();
    substituirFase(f, r.fase);
    h.registrarFase(antes, f);
    expect(h.desfazerUm(f)).toEqual({ t: 'fase' });
    expect(f.largura).toBe(12);
    expect(f.inimigos).toHaveLength(1);
    h.refazerUm(f);
    expect(f.largura).toBe(8);
  });

  it('portas internas ligam partes separadas: a saída do outro lado é alcançável', () => {
    const f = sala();
    for (let y = 1; y < 9; y++) aplicarFerramenta(f, { t: 'terreno', tipo: 'parede' }, 5, y);
    aplicarFerramenta(f, { t: 'terreno', tipo: 'saida' }, 9, 7);
    expect(validarFase(paraFaseJson(f), presets).ok).toBe(false);
    expect(adicionarPortaInterna(f, { x: 3, y: 3 }, { x: 7, y: 3 }, (n) => `P${n}`)).toMatchObject({ numero: 1 });
    expect(adicionarPortaInterna(f, { x: 3, y: 3 }, { x: 8, y: 3 }, (n) => `P${n}`)).toBeNull();
    expect(validarFase(paraFaseJson(f), presets).ok).toBe(true);
  });

  it('o chefe marcado pela célula vira bossIndice; sem ele, a fase acusa o erro', () => {
    const f = sala();
    aplicarFerramenta(f, { t: 'terreno', tipo: 'saida' }, 9, 7);
    aplicarFerramenta(f, { t: 'inimigo', preset: 'goblin' }, 4, 4);
    aplicarFerramenta(f, { t: 'inimigo', preset: 'boss', nivel: 3 }, 6, 6);
    expect(marcarChefe(f, { x: 6, y: 6 }, true)).toBe(true);
    const json = paraFaseJson(f);
    expect(json.portaSaida).toEqual({ x: 9, y: 7, tranca: 'boss', bossIndice: 1 });
    expect(json.inimigos?.[1]).toMatchObject({ preset: 'boss', nivel: 3 });
    aplicarFerramenta(f, { t: 'remover' }, 6, 6);
    const r = validarFase(paraFaseJson(f), presets);
    expect(r.ok).toBe(false);
  });

  it('distribuir apaga as peças à mão e entra no histórico como traço', () => {
    const f = sala();
    aplicarFerramenta(f, { t: 'peca', peca: 'parede_N@2' }, 0, 0);
    aplicarFerramenta(f, { t: 'peca', peca: 'piso_3' }, 3, 3);
    expect(distribuir(f)).toHaveLength(2);
    expect(f.pecas).toEqual({});
  });
});

describe('aventura de várias fases', () => {
  const aventura = (): Aventura => {
    const a = novaFaseEditavel('av', 'Um', 12, 10);
    aplicarFerramenta(a, { t: 'terreno', tipo: 'saida' }, 9, 7);
    const b = novaFaseEditavel('av-f2', 'Dois', 12, 10);
    aplicarFerramenta(b, { t: 'terreno', tipo: 'saida' }, 9, 7);
    return { id: 'av', nome: 'Aventura', fases: [a, b] };
  };

  it('a saída leva à fase seguinte e a última termina; a referência guarda o índice', () => {
    const ref = faseSeguinte({ tipo: 'aventura', id: 'av' }, 2);
    expect(ref).toEqual({ tipo: 'aventura', id: 'av', indice: 1 });
    expect(ref && faseSeguinte(ref, 2)).toBeNull();
    expect(ref && chaveDaFase(ref)).toBe('aventura:av#1');
    expect(chaveDaFase({ tipo: 'aventura', id: 'av' })).toBe('aventura:av');
    expect(lerRefFase({ tipo: 'aventura', id: 'av', indice: 1 })).toEqual({ tipo: 'aventura', id: 'av', indice: 1 });
    expect(lerRefFase({ tipo: 'aventura', id: 'av', indice: 99 })).toBeNull();
  });

  it('herda o tileset da fase anterior; ordem e validação por fase', () => {
    const a = aventura();
    const primeira = a.fases[0];
    if (primeira) primeira.tilesetId = 'atlas-1';
    expect(faseJsonDaAventura(a, 1)?.tileset).toEqual({ atlasId: 'atlas-1' });
    expect(faseJsonDaAventura(a, 1)?.ordem).toBe(2);
    expect(validarAventura(a, presets).ok).toBe(true);
    const segunda = a.fases[1];
    if (segunda) segunda.spawn = null;
    expect(validarAventura(a, presets).primeiraComErro).toBe(1);
  });

  it('reordenar e excluir (nunca fica sem fase)', () => {
    const a = aventura();
    expect(moverFase(a, 0, 1)).toBe(true);
    expect(a.fases.map((f) => f.nome)).toEqual(['Dois', 'Um']);
    expect(moverFase(a, 1, 1)).toBe(false);
    expect(removerFase(a, 0)).toBe(true);
    expect(removerFase(a, 0)).toBe(false);
  });
});
