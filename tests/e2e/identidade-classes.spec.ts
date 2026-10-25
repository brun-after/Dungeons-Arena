// Marco 22 (23/10/2026, D-089): as classes mostram a sua identidade em jogo.
import { expect, test } from '@playwright/test';

test('o Arqueiro começa com a Mira firme no HUD', async ({ page }) => {
  await page.goto('/?jogo=campanha&slot=1&dificuldade=normal&classe=arqueiro');
  const barra = page.locator('.barra.classe[data-tipo="mira"]');
  await expect(barra).toBeVisible({ timeout: 30000 });
  await expect(barra).toHaveAttribute('data-cheia', 'true', { timeout: 15000 });
  await expect(barra).toHaveAttribute('aria-label', /Mira firme/);
});

test('o Mago encarna o elemento da magia lançada', async ({ page }) => {
  await page.goto('/?jogo=campanha&slot=2&dificuldade=normal&classe=mago');
  await expect(page.getByTestId('habilidade-bola_de_fogo')).toBeVisible({ timeout: 30000 });
  const chip = page.locator('.chip-encarnacao');
  await expect(chip).toBeHidden();
  await page.getByTestId('habilidade-bola_de_fogo').click();
  await expect(chip).toBeVisible({ timeout: 10000 });
  await expect(chip).toHaveAttribute('data-elemento', 'fogo');
});

test('o Aventureiro chega com o falcão', async ({ page }) => {
  await page.goto('/?jogo=campanha&slot=3&dificuldade=normal&classe=aventureiro');
  // Marco 24 (D-094): o kit inicial do Aventureiro começa pelo Mergulho (tecla 1).
  await expect(page.getByTestId('habilidade-mergulho')).toBeVisible({ timeout: 30000 });
  await expect(page.locator('.log-combate')).toContainText('Falcão', { timeout: 10000 });
  await expect(page.locator('.barra.classe')).toBeHidden();
});
