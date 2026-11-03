// 02/11/2026: mapa do Mundo no desktop e no toque, com persistência e faixa temporária.
import { expect, test } from '@playwright/test';

test('expande pelo minimapa, marca lugares e pontos e apaga a faixa em cinco segundos', async ({ page }, testInfo) => {
  const erros: string[] = [];
  page.on('pageerror', e => erros.push(e.message));
  await page.clock.install();
  await page.goto('./?jogo=mundo');
  await page.locator('#mundo-nome-1').fill('Cartografo');
  await page.locator('#mundo-nome-1').locator('..').getByRole('button', { name: 'Começar' }).click();
  const mini = page.locator('.minimapa');
  await expect(mini).toBeVisible({ timeout: 30000 });
  await page.clock.fastForward(5100);
  await expect(page.locator('.faixa-lugar')).toHaveCSS('opacity', '0');
  await mini.click();
  const mapa = page.locator('.mapa-expandido');
  await expect(mapa).toBeVisible();
  await expect(mapa).toContainText('Você está em: Vila do Centro');
  await expect(mapa).toContainText('Reino do Eclipse');
  await mapa.getByRole('button',{name:'Reino do Eclipse',exact:true}).click();
  await expect(mapa.locator('.regiao-mapa')).toHaveCount(12);
  await mapa.getByRole('button',{name:'Reino Central',exact:true}).click();
  await expect(mapa.locator('.regiao-mapa')).toHaveCount(9);
  const lugar = mapa.getByRole('button', { name: 'Marcar: Gruta do Orvalho', exact: true });
  await lugar.click();
  await expect(lugar).toHaveAttribute('aria-pressed', 'true');
  await mapa.locator('.mapa-terreno').click({ position: { x: 55, y: 55 } });
  const pontos = await page.evaluate(() => localStorage.getItem('mapa:pontos:regiao:vila_do_centro'));
  expect(JSON.parse(pontos ?? '[]')).toHaveLength(1);
  await mapa.getByRole('button', { name: 'Fechar', exact: true }).click();
  await mini.click();
  await expect(lugar).toHaveAttribute('aria-pressed', 'true');
  await mapa.locator('.mapa-terreno').click({ position: { x: 55, y: 55 } });
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem('mapa:pontos:regiao:vila_do_centro')) ?? '[]')).toHaveLength(0);
  await page.screenshot({ path: testInfo.outputPath('mapa-expandido.png') });
  await lugar.click();
  await expect(lugar).toHaveAttribute('aria-pressed', 'false');
  expect(erros).toEqual([]);
});
