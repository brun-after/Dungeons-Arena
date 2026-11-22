// Marco 41 (14/11/2026, D-169): os blocos de chão assados guardados entre as cenas. O mesmo bloco é compartilhado
// (a cena daqui, a vizinha além da borda e a cena de lá), o que está em uso nunca é apagado e a chave muda com o
// conteúdo do bloco. 22/11/2026 (D-202): a imagem pode ser o ImageBitmap do trabalhador.

import { describe, expect, it } from 'vitest';
import { chaveDoAssado, guardarAssado, pegarAssado, soltarAssado, temAssado } from '../../src/render/solo/assados-guardados';
import { carregarFase } from '../../src/world/fase';

const tela = (): HTMLCanvasElement => ({ width: 8, height: 8 }) as unknown as HTMLCanvasElement;

describe('chão assado guardado (D-169)', () => {
  it('compartilha, não apaga o que está em uso e apaga o mais antigo sem uso', () => {
    const emUso = tela();
    guardarAssado('em-uso', emUso);
    expect(pegarAssado('em-uso')).toBe(emUso);
    soltarAssado('em-uso');
    const velho = tela();
    guardarAssado('velho', velho);
    soltarAssado('velho');
    for (let i = 0; i < 30; i++) {
      guardarAssado(`outro${i}`, tela());
      soltarAssado(`outro${i}`);
    }
    expect(temAssado('em-uso')).toBe(true);
    expect(emUso.width).toBe(8);
    expect(temAssado('velho')).toBe(false);
    expect(velho.width).toBe(0);
    soltarAssado('em-uso');
  });

  it('a imagem do trabalhador (ImageBitmap) é fechada ao sair da guarda (D-202)', () => {
    let fechada = false;
    const bitmap = { width: 8, height: 8, close: () => { fechada = true; } } as unknown as ImageBitmap;
    guardarAssado('bitmap', bitmap);
    soltarAssado('bitmap');
    for (let i = 0; i < 30; i++) {
      guardarAssado(`mais${i}`, tela());
      soltarAssado(`mais${i}`);
    }
    expect(temAssado('bitmap')).toBe(false);
    expect(fechada).toBe(true);
  });

  it('a chave muda com as células do bloco e não com a resolução', () => {
    const json = { id: 'f', nome: 'f', ordem: 0, tipo: 'campanha' as const, mapa: ['....', '....', '....', '....'], spawns: [{ x: 0, y: 0 }] };
    const a = carregarFase(json);
    const b = carregarFase({ ...json, mapa: ['....', '.#..', '....', '....'] });
    expect(chaveDoAssado(a, 0, 0, 4, 4, 't')).toBe(chaveDoAssado(carregarFase(json), 0, 0, 4, 4, 't'));
    expect(chaveDoAssado(a, 0, 0, 4, 4, 't')).not.toBe(chaveDoAssado(b, 0, 0, 4, 4, 't'));
    expect(chaveDoAssado(a, 0, 0, 4, 4, 't')).not.toBe(chaveDoAssado(a, 0, 0, 4, 4, 'outro'));
  });
});
