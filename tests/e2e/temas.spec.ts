// Marco 23 (24/10/2026, D-092): dez slots e as fases com tema.
import { expect, test } from '@playwright/test';

test('a tela de slots mostra dez slots', async ({ page }) => {
  await page.goto('/?jogo=campanha');
  await expect(page.locator('.cartao-slot')).toHaveCount(10, { timeout: 30000 });
  await expect(page.locator('.cartao-slot[data-slot="10"]')).toBeVisible();
});

test('a fase gerada com tema mostra o chip e anuncia o clima', async ({ page }) => {
  await page.goto('/?jogo=campanha&slot=0&classe=mago&fase=tema:caverna_gelo');
  const chip = page.locator('.chip-tema');
  await expect(chip).toBeVisible({ timeout: 30000 });
  await expect(chip).toHaveText('Caverna de gelo');
  await expect(chip).toHaveAttribute('data-elemento', 'gelo');
  await expect(page.locator('.log-combate')).toContainText('Gelo +25%', { timeout: 10000 });
});
