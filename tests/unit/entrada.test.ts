import { describe, expect, it } from 'vitest';
import type { Dir8 } from '../../src/core/comandos';
import { comandoMover, dirDeVetor, limitarRaio, movimentoTelaX, rumoDaTela, rumoMudou, setorJoystick, vetorDaTela } from '../../src/input/direcao';
import { criarProjecao } from '../../src/render/projecao';
import { detectarToque, mostrarDirecional, type SinaisDispositivo } from '../../src/plataforma/dispositivo';

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

describe('tela → fase pela inversa da projeção (§4.5, marco 26, D-105)', () => {
  it('de cima é a identidade, normalizada em ±1000', () => {
    expect(vetorDaTela(10, 0, false)).toEqual({ dir: 'E', dx: 1000, dy: 0 });
    expect(vetorDaTela(-3, 3, false)).toEqual({ dir: 'SO', dx: -707, dy: 707 });
    expect(vetorDaTela(0, 0, true)).toEqual({ dir: 'parado', dx: 0, dy: 0 });
  });

  it('no isométrico, empurrar ao longo da inclinação do corredor anda exatamente no eixo da fase', () => {
    const p = criarProjecao('iso', 20, 20);
    for (const [ex, ey, dir] of [[1, 0, 'E'], [0, -1, 'N'], [-1, 0, 'O'], [0, 1, 'S']] as const) {
      const a = p.projetar(0, 0);
      const b = p.projetar(ex, ey);
      const r = vetorDaTela(b.x - a.x, b.y - a.y, true);
      expect(r.dir).toBe(dir);
      expect(r.dx).toBe(ex * 1000);
      expect(r.dy).toBe(ey * 1000);
    }
  });

  it('a direção pedida na tela é a que o personagem anda na tela, em qualquer ângulo', () => {
    const p = criarProjecao('iso', 20, 20);
    for (let graus = 0; graus < 360; graus += 7) {
      const sx = Math.cos((graus * Math.PI) / 180);
      const sy = Math.sin((graus * Math.PI) / 180);
      const r = vetorDaTela(sx, sy, true);
      const a = p.projetar(0, 0);
      const b = p.projetar(r.dx, r.dy);
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      expect(Math.abs(Math.atan2(Math.sin(ang - Math.atan2(sy, sx)), Math.cos(ang - Math.atan2(sy, sx))))).toBeLessThan(0.002);
    }
  });

  it('o teclado: a seta para cima no isométrico anda para cima na tela (NO na fase)', () => {
    expect(rumoDaTela('N', true)).toEqual({ dir: 'NO', dx: -707, dy: -707 });
    expect(rumoDaTela('E', true)).toEqual({ dir: 'NE', dx: 707, dy: -707 });
    expect(rumoDaTela('N', false)).toEqual({ dir: 'N', dx: 0, dy: -1000 });
    expect(rumoDaTela('parado', true).dir).toBe('parado');
  });

  it('o joystick só reemite quando o ângulo muda mais que uns 3°, e parar sempre conta', () => {
    const a = vetorDaTela(1, 0, false);
    expect(rumoMudou(a, vetorDaTela(1, 0.02, false))).toBe(false);
    expect(rumoMudou(a, vetorDaTela(1, 0.1, false))).toBe(true);
    expect(rumoMudou(a, rumoDaTela('parado', false))).toBe(true);
  });

  it('o comando mover leva o vetor; parar, não', () => {
    expect(comandoMover(vetorDaTela(2, 1, false))).toEqual({ t: 'mover', dir: 'SE', dx: 894, dy: 447 });
    expect(comandoMover(rumoDaTela('parado', true))).toEqual({ t: 'mover', dir: 'parado' });
  });

  it('sentido do sprite usa o X de tela', () => {
    expect(movimentoTelaX(1, 1, true)).toBe(0);
    expect(movimentoTelaX(1, -1, true)).toBe(2);
    expect(movimentoTelaX(1, -1, false)).toBe(1);
  });
});

describe('detecção de toque (§4.2)', () => {
  const nada: SinaisDispositivo = { temToque: false, ponteiroGrosso: false, semHover: false, uaMobile: false, telaPequena: false, temMouse: false };

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

  it('marco 26 (D-107): com mouse, o direcional some mesmo em janela pequena de tela de toque', () => {
    expect(mostrarDirecional({ ...nada, temToque: true, telaPequena: true, temMouse: true })).toBe(false);
    expect(detectarToque({ ...nada, temToque: true, telaPequena: true, temMouse: true })).toBe(true);
    expect(mostrarDirecional({ ...nada, temToque: true, uaMobile: true })).toBe(true);
    expect(mostrarDirecional({ ...nada, temMouse: true })).toBe(false);
  });
});
