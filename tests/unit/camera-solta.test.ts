// Marco 26 (28/10/2026, D-117): depois de arrastar, a câmera em janela fica onde o jogador a deixou; andar só a move
// quando o boneco sai inteiro da vista (até a borda mais perto), e recentralizar volta ao normal.

import { describe, expect, it } from 'vitest';
import { Camera } from '../../src/render/camera';
import { acomodarNaBorda, CELULA_PX } from '../../src/render/camera-calculo';
import { criarProjecao } from '../../src/render/projecao';

const P = CELULA_PX;

/** Anda célula a célula (a câmera só reage à troca de célula) e deixa a suavização terminar. */
function andar(cam: Camera, de: { x: number; y: number }, ate: { x: number; y: number }): void {
  const passos = Math.max(Math.abs(ate.x - de.x), Math.abs(ate.y - de.y));
  for (let i = 1; i <= passos; i++) {
    const c = { x: de.x + Math.round(((ate.x - de.x) * i) / passos), y: de.y + Math.round(((ate.y - de.y) * i) / passos) };
    cam.seguirCelula(c);
    for (let k = 0; k < 30; k++) cam.atualizar(0.1, c, 3);
  }
}

describe('câmera solta (D-117)', () => {
  it('acomodar: visível não muda; fora, vai à borda por onde saiu', () => {
    expect(acomodarNaBorda(100, 150, 190, 400, 40)).toEqual({ origem: 100, presa: 0 });
    expect(acomodarNaBorda(100, 20, 60, 400, 40)).toEqual({ origem: -20, presa: -1 });
    expect(acomodarNaBorda(100, 600, 640, 400, 40)).toEqual({ origem: 280, presa: 1 });
    // Preso à borda do fim, segue o boneco que continua saindo; de volta para dentro, solta.
    expect(acomodarNaBorda(280, 650, 690, 400, 40, 1)).toEqual({ origem: 330, presa: 1 });
    expect(acomodarNaBorda(280, 400, 440, 400, 40, 1)).toEqual({ origem: 280, presa: 0 });
  });

  it('depois do arrasto, andar dentro da vista não recentraliza', () => {
    for (const v of ['cima', 'iso'] as const) {
      const cam = new Camera(criarProjecao(v, 80, 60), 'janela', false);
      cam.definirVista({ largura: 1280, altura: 720 });
      cam.centralizar({ x: 40, y: 30 });
      cam.seguirCelula({ x: 40, y: 30 });
      cam.arrastar(-200, 0);
      expect(cam.estaSolta).toBe(true);
      const x = cam.x;
      andar(cam, { x: 40, y: 30 }, { x: 41, y: 30 });
      expect(cam.x, v).toBe(x);
    }
  });

  it('o boneco que sai inteiro da vista volta pela borda, sem centralizar', () => {
    const cam = new Camera(criarProjecao('cima', 80, 60), 'janela', false);
    cam.definirVista({ largura: 1280, altura: 720 });
    cam.centralizar({ x: 40, y: 30 });
    cam.seguirCelula({ x: 40, y: 30 });
    cam.arrastar(500, 0);
    andar(cam, { x: 40, y: 30 }, { x: 70, y: 30 });
    const t = cam.paraTela(70, 30);
    // Fica perto da borda direita, não no meio.
    expect(t.x).toBeGreaterThan(1280 - 3 * P);
    expect(t.x).toBeLessThanOrEqual(1280);
  });

  it('recentralizar volta a seguir pela janela morta', () => {
    const cam = new Camera(criarProjecao('cima', 80, 60), 'janela', false);
    cam.definirVista({ largura: 1280, altura: 720 });
    cam.centralizar({ x: 40, y: 30 });
    cam.seguirCelula({ x: 40, y: 30 });
    cam.arrastar(-300, 0);
    cam.recentralizar();
    expect(cam.estaSolta).toBe(false);
    for (let k = 0; k < 60; k++) cam.atualizar(0.1, { x: 40, y: 30 }, 3);
    const t = cam.paraTela(40, 30);
    expect(Math.abs(t.x - 640)).toBeLessThan(P);
  });
});
