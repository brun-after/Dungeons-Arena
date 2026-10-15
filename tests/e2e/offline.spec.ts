// Marco 16 (15/10/2026, D-062, §3.8, aceite 5): o PWA funciona sem rede depois da primeira visita — o Service Worker
// fica ativo com o precache, e offline a campanha abre, anda e salva no slot; uma navegação qualquer cai no
// index.html do precache. Roda no projeto `offline` do Playwright (o único com Service Worker liberado).

import { expect, test } from '@playwright/test';

test('offline: depois da primeira visita, a campanha abre, anda e salva sem rede', async ({ page, context }) => {
  const erros: string[] = [];
  page.on('pageerror', (e) => erros.push(e.message));
  await page.goto('./');
  // Service Worker ativo e controlando a página, com o precache pronto.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null), { timeout: 20_000 }).toBe(true);
  await expect
    .poll(() => page.evaluate(async () => (await caches.keys()).some((k) => k.includes('precache'))), { timeout: 20_000 })
    .toBe(true);

  await context.setOffline(true);
  await page.goto('./?jogo=campanha&slot=1&diag=1&classe=aventureiro');
  const diag = page.locator('#diag');
  await expect(diag).toHaveAttribute('data-celula', /^\d+,\d+$/, { timeout: 20_000 });
  const antes = await diag.getAttribute('data-celula');
  await page.keyboard.down('d');
  await expect.poll(() => diag.getAttribute('data-celula'), { timeout: 15_000 }).not.toBe(antes);
  await page.keyboard.up('d');
  await page.getByRole('button', { name: 'Salvar e voltar aos slots' }).click();
  await expect(page.locator('[data-slot="1"]')).toContainText('Nível 1');

  // Navegação para um endereço que o cache nunca viu: cai no index.html do precache (o menu abre).
  await page.goto('./qualquer-pagina');
  await expect(page.locator('body')).not.toBeEmpty();
  await expect(page.getByRole('link').first()).toBeVisible({ timeout: 15_000 });
  await context.setOffline(false);
  expect(erros).toEqual([]);
});
