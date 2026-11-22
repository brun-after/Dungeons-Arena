// 22/11/2026 (D-202): quem está longe da vista não é desenhado (o atlas da criatura só sobe para a placa perto dela).

import { describe, expect, it } from 'vitest';
import { CELULA_PX } from '../../src/render/camera-calculo';
import { longeDaVista } from '../../src/render/projecao';

describe('longe da vista (D-202)', () => {
  const vista = [10 * CELULA_PX, 10 * CELULA_PX, 30 * CELULA_PX, 20 * CELULA_PX];

  it('dentro da vista ou na folga, desenha; além da folga, não', () => {
    expect(longeDaVista(vista, 15, 15)).toBe(false);
    expect(longeDaVista(vista, 35, 15)).toBe(false);
    expect(longeDaVista(vista, 41, 15)).toBe(true);
    expect(longeDaVista(vista, 15, -1)).toBe(true);
    expect(longeDaVista(vista, 15, 1, 3)).toBe(true);
  });

  it('sem a vista do quadro ainda, desenha tudo', () => {
    expect(longeDaVista([], 999, 999)).toBe(false);
  });
});
