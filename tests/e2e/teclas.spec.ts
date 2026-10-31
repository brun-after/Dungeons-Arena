// Marco 26 (25/10/2026, D-107): EWAS no isométrico anda nos eixos da fase; o direcional não aparece no computador.
import { expect, test } from '@playwright/test';

async function ler(page: import('@playwright/test').Page, atributo: 'celula' | 'pos'): Promise<[number, number]> {
  const valor = (await page.locator('#diag').getAttribute(`data-${atributo}`)) ?? '0,0';
  const [a = 0, b = 0] = valor.split(',').map(Number);
  return [a, b];
}

test.describe('teclas de movimento', () => {
  test.skip(({ isMobile }) => isMobile, 'teclado do computador');

  test('EWAS no isométrico: E anda só para o norte da fase, sem direcional na tela', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('dungeons-arena:preferencias', JSON.stringify({ visao: 'iso', teclasMovimento: 'ewas', versaoVisual: 1 }));
    });
    await page.goto('./?jogo=campanha&slot=1&diag=1&classe=aventureiro');
    await expect(page.locator('#diag')).toHaveAttribute('data-celula', /^\d+,\d+$/, { timeout: 30_000 });
    await expect(page.locator('body')).toHaveAttribute('data-visao', 'iso');
    await expect(page.getByTestId('joystick')).toHaveCount(0);
    await expect(page.getByTestId('dpad')).toHaveCount(0);

    const [x0, y0] = await ler(page, 'pos');
    await page.keyboard.down('e');
    await expect.poll(async () => (await ler(page, 'pos'))[1], { timeout: 15_000, intervals: [50] }).toBeLessThan(y0 - 0.5);
    await page.keyboard.up('e');
    const [x1] = await ler(page, 'pos');
    expect(Math.abs(x1 - x0)).toBeLessThan(0.01);
  });

  // Marco 26 (26/10/2026, D-115): o botão esquerdo segurado guia como o joystick; soltar para na hora.
  test('mouse segurado guia o personagem e soltar para', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('dungeons-arena:preferencias', JSON.stringify({ visao: 'cima', versaoVisual: 1 }));
    });
    await page.goto('./?jogo=campanha&slot=1&diag=1&classe=aventureiro');
    await expect(page.locator('#diag')).toHaveAttribute('data-tela', /^\d+,\d+$/, { timeout: 30_000 });
    const tela = ((await page.locator('#diag').getAttribute('data-tela')) ?? '0,0').split(',').map(Number);
    const caixa = await page.locator('canvas').first().boundingBox();
    if (!caixa) throw new Error('sem canvas');
    const [tx = 0, ty = 0] = tela;
    const [x0, y0] = await ler(page, 'pos');
    // À direita do personagem: a posição cresce em x enquanto o botão está apertado.
    await page.mouse.move(caixa.x + tx + 120, caixa.y + ty);
    await page.mouse.down();
    await expect.poll(async () => (await ler(page, 'pos'))[0], { timeout: 5_000, intervals: [50] }).toBeGreaterThan(x0 + 0.5);
    // Subir o cursor muda o rumo sem soltar: y cai.
    await page.mouse.move(caixa.x + tx, caixa.y + ty - 160, { steps: 4 });
    await expect.poll(async () => (await ler(page, 'pos'))[1], { timeout: 5_000, intervals: [50] }).toBeLessThan(y0 - 0.3);
    await page.mouse.up();
    await page.waitForTimeout(200);
    const [xa, ya] = await ler(page, 'pos');
    await page.waitForTimeout(400);
    const [xb, yb] = await ler(page, 'pos');
    expect(Math.hypot(xb - xa, yb - ya)).toBeLessThan(0.05);
  });
});
