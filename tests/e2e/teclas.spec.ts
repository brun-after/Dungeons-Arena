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
      localStorage.setItem('dungeons-arena:preferencias', JSON.stringify({ visao: 'iso', teclasMovimento: 'ewas' }));
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
});
