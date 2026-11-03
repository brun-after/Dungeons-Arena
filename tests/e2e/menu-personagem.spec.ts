import { expect, test } from '@playwright/test';

test('menu mantém navegação e equipamento visíveis e atualiza o retrato ao desequipar', async ({ page }, info) => {
  await page.goto('./?jogo=campanha&slot=1&diag=1&classe=guerreiro');
  await expect(page.locator('#diag')).toHaveAttribute('data-celula', /^\d+,\d+$/, { timeout: 30000 });
  await page.getByRole('button', { name: /Abrir.*mochila/i }).click();
  const modal = page.getByRole('dialog', { name: 'Mochila', exact: true });
  const retrato = modal.locator('.retrato-personagem');
  await expect(retrato).toHaveAttribute('data-pronto', '1');
  await page.screenshot({ path: info.outputPath('retrato-equipado.png') });
  const antes = await retrato.locator('canvas').evaluate((c: HTMLCanvasElement) => c.toDataURL());
  const abas = modal.locator('.abas-modal');
  const pos = await abas.boundingBox();
  await modal.locator('.bolsa-rolavel').evaluate(e => { e.scrollTop = e.scrollHeight; });
  expect(await abas.boundingBox()).toEqual(pos);
  await expect(modal.locator('.equipamento-fixo')).toBeVisible();
  await modal.getByRole('button', { name: /Tirar: Arma:/i }).click();
  await expect(retrato).toHaveAttribute('data-pronto', '1');
  await expect.poll(() => retrato.locator('canvas').evaluate((c: HTMLCanvasElement) => c.toDataURL())).not.toBe(antes);
  await page.screenshot({ path: info.outputPath('inventario-personagem.png') });
  await modal.getByRole('button', { name: 'Visão geral', exact: true }).click();
  await expect(modal.locator('.resumo-personagem')).toContainText('Guerreiro');
  await modal.getByRole('button', { name: 'Preparar habilidades' }).click();
  await expect(modal.getByRole('button', { name: 'Visão geral', exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('menu-personagem.png') });
});
