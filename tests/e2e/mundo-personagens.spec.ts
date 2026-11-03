import { expect, test } from '@playwright/test';

test('cinco slots, confirmação de exclusão e recriação pelo menu do Mundo', async ({ page }, testInfo) => {
  await page.goto('./?jogo=mundo');
  await expect(page.locator('.cartao-slot')).toHaveCount(5);
  await page.locator('#mundo-nome-5').fill('Quinta');
  await page.locator('#mundo-nome-5').locator('..').getByRole('button', { name: 'Começar' }).click();
  await expect(page.locator('.minimapa')).toBeVisible({ timeout: 30000 });
  await page.getByRole('button', { name: /^Sair do Mundo/ }).click();
  const excluir = page.getByRole('button', { name: 'Excluir Quinta', exact: true });
  await expect(excluir).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('cinco-personagens.png'), fullPage: true });
  await excluir.click();
  const confirmar = page.getByRole('button', { name: 'Excluir permanentemente', exact: true });
  await expect(confirmar).toBeDisabled();
  await page.getByLabel('Nome do personagem', { exact: true }).fill('Outro');
  await expect(confirmar).toBeDisabled();
  await page.getByRole('button', { name: 'Fechar', exact: true }).click();
  await expect(excluir).toBeVisible();
  await excluir.click();
  await page.getByLabel('Nome do personagem', { exact: true }).fill('Quinta');
  await expect(confirmar).toBeEnabled();
  await confirmar.click();
  await expect(page.locator('#mundo-nome-5')).toBeVisible();
  await expect(page.locator('.cartao-slot')).toHaveCount(5);
});
