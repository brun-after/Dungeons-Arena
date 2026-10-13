import { describe, expect, it } from 'vitest';
import type { Dir8 } from '../../src/core/comandos';
import { dirDeVetor, limitarRaio, movimentoTelaX, remapearParaGrade, setorJoystick } from '../../src/input/direcao';
import { detectarToque, type SinaisDispositivo } from '../../src/plataforma/dispositivo';

describe('setor do joystick (§4.3)', () => {
  it('abaixo da zona morta de 14 px, para', () => {
    expect(setorJoystick(10, 9)).toBe('parado');
    expect(setorJoystick(14, 0)).toBe('E');
  });

  it('mapeia os 8 setores de 45° (Y da tela para baixo)', () => {
    const casos: [number, number, Dir8][] = [
      [40, 0, 'E'],
      [30, 30, 'SE'],
      [0, 40, 'S'],
      [-30, 30, 'SO'],
      [-40, 0, 'O'],
      [-30, -30, 'NO'],
      [0, -40, 'N'],
      [30, -30, 'NE'],
    ];
    for (const [x, y, dir] of casos) expect(setorJoystick(x, y)).toBe(dir);
  });

  it('as fronteiras ficam a 22,5° de cada eixo', () => {
    const a = (graus: number) => setorJoystick(40 * Math.cos((graus * Math.PI) / 180), 40 * Math.sin((graus * Math.PI) / 180));
    expect(a(22)).toBe('E');
    expect(a(23)).toBe('SE');
    expect(a(-22)).toBe('E');
    expect(a(-23)).toBe('NE');
  });

  it('limita o botão ao raio máximo de 50 px', () => {
    expect(limitarRaio(30, 40, 50)).toEqual({ x: 30, y: 40 });
    const r = limitarRaio(300, 400, 50);
    expect(r.x).toBeCloseTo(30);
    expect(r.y).toBeCloseTo(40);
  });
});

describe('direção a partir de vetor', () => {
  it('combina eixos em Dir8', () => {
    expect(dirDeVetor(0, 0)).toBe('parado');
    expect(dirDeVetor(1, 0)).toBe('E');
    expect(dirDeVetor(-1, -1)).toBe('NO');
    expect(dirDeVetor(0, 2)).toBe('S');
  });
});

describe('remapeamento tela → grade no isométrico (§4.5)', () => {
  it('fora do isométrico é identidade', () => {
    for (const d of ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'] as const) expect(remapearParaGrade(d, false)).toBe(d);
  });

  it('segue a tabela da spec: cardeais viram diagonais e diagonais viram cardeais', () => {
    expect(remapearParaGrade('N', true)).toBe('NO'); // (0,-1) → (-1,-1)
    expect(remapearParaGrade('S', true)).toBe('SE'); // (0,1) → (1,1)
    expect(remapearParaGrade('E', true)).toBe('NE'); // (1,0) → (1,-1)
    expect(remapearParaGrade('O', true)).toBe('SO'); // (-1,0) → (-1,1)
    expect(remapearParaGrade('NE', true)).toBe('N');
    expect(remapearParaGrade('SE', true)).toBe('E');
    expect(remapearParaGrade('SO', true)).toBe('S');
    expect(remapearParaGrade('NO', true)).toBe('O');
    expect(remapearParaGrade('parado', true)).toBe('parado');
  });

  it('sentido do sprite usa o X de tela', () => {
    expect(movimentoTelaX(1, 1, true)).toBe(0);
    expect(movimentoTelaX(1, -1, true)).toBe(2);
    expect(movimentoTelaX(1, -1, false)).toBe(1);
  });
});

describe('detecção de toque (§4.2)', () => {
  const nada: SinaisDispositivo = { temToque: false, ponteiroGrosso: false, semHover: false, uaMobile: false, telaPequena: false };

  it('sem toque nunca é modo toque', () => {
    expect(detectarToque({ ...nada, uaMobile: true, telaPequena: true })).toBe(false);
  });

  it('celular é modo toque', () => {
    expect(detectarToque({ ...nada, temToque: true, uaMobile: true })).toBe(true);
    expect(detectarToque({ ...nada, temToque: true, ponteiroGrosso: true, semHover: true })).toBe(true);
  });

  it('laptop com touchscreen, tela grande e mouse não é modo toque', () => {
    expect(detectarToque({ ...nada, temToque: true })).toBe(false);
  });
});
