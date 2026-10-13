import { expect, test } from '@playwright/test';

test('a página abre e o núcleo da simulação avança no navegador', async ({ page }) => {
  const erros: string[] = [];
  page.on('pageerror', (e) => erros.push(e.message));

  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Dungeons Arena');

  const tick = page.getByTestId('tick');
  await expect.poll(async () => Number(await tick.textContent()), { timeout: 5_000 }).toBeGreaterThan(30);
  await expect(page.getByTestId('digest')).toHaveText(/^[0-9a-f]{14}$/);

  expect(erros).toEqual([]);
});
