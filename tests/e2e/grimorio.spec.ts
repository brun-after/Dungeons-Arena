import { expect, test } from '@playwright/test';

test.skip(({ isMobile }) => isMobile, 'só desktop');

// Marco 18 (D-068, D-070): o "?" de cada atributo explica com os números do personagem; o diário lista o que falta.
test('ficha: a dica rápida do atributo e a aba Diário', async ({ page }) => {
  const erros: string[] = [];
  page.on('pageerror', (e) => erros.push(e.message));
  await page.goto('./?jogo=campanha&slot=1&diag=1&classe=aventureiro');
  await expect(page.locator('#diag')).toHaveAttribute('data-celula', /^\d+,\d+$/);
  await page.keyboard.press('KeyI');
  const mochila = page.getByRole('dialog', { name: 'Mochila' });
  await mochila.getByRole('button', { name: 'Ficha' }).click();
  await mochila.locator('[data-chave="dica-inteligencia"]').click();
  const dica = mochila.locator('.dica-atributo');
  await expect(dica).toBeVisible();
  await expect(dica).toContainText('Potência dos efeitos');
  await expect(dica).toContainText('Estudo de habilidades');
  await mochila.locator('[data-chave="dica-sabedoria"]').click();
  await expect(dica).toContainText('Armadilhas');
  await mochila.getByRole('button', { name: 'Diário' }).click();
  await expect(mochila.getByText(/Descobertas: \d+ de \d+/)).toBeVisible();
  await expect(mochila.locator('.missao')).toHaveCount(4);
  await expect(mochila.locator('.grupo-diario[data-tipo="reacao"] summary')).toContainText('Reações');
  expect(erros).toEqual([]);
});
