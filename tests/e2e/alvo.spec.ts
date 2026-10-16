// Ajuste de 15/10/2026 (D-065): no navegador — Q seleciona e trava o boneco de treino, T destrava, Esc limpa antes
// de pausar; no celular, o 🎯 troca para o alvo mais próximo. O quadro do alvo mostra o estado.

import { expect, test, type Page } from '@playwright/test';

async function abrir(page: Page): Promise<string[]> {
  const erros: string[] = [];
  page.on('pageerror', (e) => erros.push(e.message));
  await page.goto('./?jogo=campanha&slot=1&diag=1&classe=aventureiro');
  await expect(page.locator('#diag')).toHaveAttribute('data-celula', /^\d+,\d+$/);
  return erros;
}

test('desktop: Q trava o boneco, T destrava e Esc limpa antes de pausar', async ({ page, isMobile }) => {
  test.skip(isMobile, 'só desktop');
  const erros = await abrir(page);
  const quadro = page.locator('.quadro-alvo');
  const pausa = page.getByRole('dialog', { name: 'Jogo pausado' });
  await expect(quadro).toBeHidden();
  await page.keyboard.press('KeyQ');
  await expect(quadro).toBeVisible();
  await expect(quadro).toHaveAttribute('data-travado', 'true');
  await page.keyboard.press('KeyT');
  await expect(quadro).toHaveAttribute('data-travado', 'false');
  await page.keyboard.press('Escape');
  await expect(quadro).toBeHidden();
  await expect(pausa).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(pausa).toBeVisible();
  expect(erros).toEqual([]);
});

test('celular: o 🎯 troca para o alvo mais próximo e mostra o quadro do alvo', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'só celular');
  const erros = await abrir(page);
  await page.getByTestId('alvo').tap();
  await expect(page.locator('.quadro-alvo')).toHaveAttribute('data-travado', 'true');
  expect(erros).toEqual([]);
});
