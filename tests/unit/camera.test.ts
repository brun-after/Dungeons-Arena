import { describe, expect, it } from 'vitest';
import {
  aproximar,
  CELULA_PX,
  janelaMortaEixo,
  limitarEixo,
  limitarZoom,
  tamanhoCelulaTela,
  telaParaCelula,
  velocidadeMaximaCamera,
  zoomAncorado,
} from '../../src/render/camera-calculo';

describe('câmera de janela morta (§2.4)', () => {
  const vista = 1000; // px de mundo visíveis no eixo
  const margem = 0.2; // 200 px de cada lado
  const histerese = CELULA_PX * 0.25; // 12 px

  it('não se mexe enquanto o jogador está dentro da janela', () => {
    expect(janelaMortaEixo(0, 500, vista, margem)).toBe(0);
    expect(janelaMortaEixo(0, 200 - histerese + 1, vista, margem)).toBe(0);
  });

  it('a histerese de 25% da célula absorve o arredondamento na borda', () => {
    expect(janelaMortaEixo(0, 805, vista, margem)).toBe(0);
    expect(janelaMortaEixo(0, 800 + histerese + 1, vista, margem)).toBeCloseTo(13);
  });

  it('desloca o necessário para recolocar o jogador na margem', () => {
    expect(janelaMortaEixo(1000, 1100, vista, margem)).toBe(900);
    expect(janelaMortaEixo(0, 900, vista, margem)).toBe(100);
  });
});

describe('limites e conversões', () => {
  it('limita a câmera à fase e centraliza fase menor que a vista', () => {
    expect(limitarEixo(-50, 2000, 1000)).toBe(0);
    expect(limitarEixo(1500, 2000, 1000)).toBe(1000);
    expect(limitarEixo(300, 600, 1000)).toBe(-200);
  });

  it('zoom fica entre 0.3 e 3.0 e SZ = round(48 × zoom)', () => {
    expect(limitarZoom(0.1)).toBe(0.3);
    expect(limitarZoom(5)).toBe(3);
    expect(tamanhoCelulaTela(1.1)).toBe(53);
  });

  it('zoom ancorado mantém o ponto do mundo sob a âncora', () => {
    const cam = { x: 100, y: 50 };
    const r = zoomAncorado(cam, 1, 2, 400, 300);
    const antes = { x: cam.x + 400 / 1, y: cam.y + 300 / 1 };
    const depois = { x: r.x + 400 / r.zoom, y: r.y + 300 / r.zoom };
    expect(depois).toEqual(antes);
    expect(r.zoom).toBe(2);
  });

  it('converte px de tela em célula', () => {
    expect(telaParaCelula({ x: 0, y: 0 }, 1, 47, 48)).toEqual({ x: 0, y: 1 });
    expect(telaParaCelula({ x: 96, y: 0 }, 2, 100, 0)).toEqual({ x: 3, y: 0 });
  });
});

describe('suavização', () => {
  it('velocidade máxima é max(15, v × 1.5) células/s', () => {
    expect(velocidadeMaximaCamera(2.5)).toBe(15 * CELULA_PX);
    expect(velocidadeMaximaCamera(20)).toBe(30 * CELULA_PX);
  });

  it('aproxima sem passar do alvo', () => {
    expect(aproximar(0, 100, 600, 0.1)).toBe(60);
    expect(aproximar(0, 100, 600, 1)).toBe(100);
    expect(aproximar(100, 0, 600, 0.1)).toBe(40);
  });
});
