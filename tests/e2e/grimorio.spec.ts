import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { RegistroProgresso } from '../../src/save/esquema';

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

// D-071: prepara um save pelo fluxo público de exportação/importação, sem pontos gratuitos no jogo.
test('estudo: iniciar, persistir, acelerar, aprender e equipar', async ({ page }) => {
  await page.goto('./?jogo=campanha&slot=1&diag=1&classe=mago');
  await expect(page.locator('#diag')).toHaveAttribute('data-celula', /^\d+,\d+$/);
  await page.getByRole('button', { name: 'Salvar e voltar aos slots' }).click();
  const download = page.waitForEvent('download');
  await page.locator('[data-slot="1"]').getByRole('button', { name: 'Exportar' }).click();
  const arquivo = await (await download).path();
  if (!arquivo) throw new Error('save não exportado');
  const salvo = JSON.parse(await readFile(arquivo, 'utf8')) as { formato: string; registro: RegistroProgresso };
  const j = salvo.registro.estado.entidades.find(e => e.bolsa);
  if (!j?.bolsa) throw new Error('personagem ausente');
  j.nivel = 5;
  j.bolsa.pontosHabilidade = 4;
  await page.locator('[data-slot="2"] input[type="file"]').setInputFiles({
    name: 'personagem-com-pontos.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(salvo)),
  });
  await expect(page.locator('[data-slot="2"]')).toContainText('Nível 5');
  await page.goto('./?jogo=campanha&slot=2&diag=1');
  await expect(page.locator('#diag')).toHaveAttribute('data-celula', /^\d+,\d+$/);
  await page.keyboard.press('KeyI');
  const mochila = page.getByRole('dialog', { name: 'Mochila' });
  await mochila.getByRole('button', { name: /^Habilidades/ }).click();
  await mochila.locator('[data-chave="subir-seta_arcana"]').click();
  await expect(mochila.locator('[data-estudo-restante="seta_arcana"]')).toBeVisible();
  await expect(mochila.locator('[data-pontos-habilidade]')).toHaveAttribute('data-pontos-habilidade', '3');
  await expect(mochila.locator('[data-chave="subir-explosao"]')).toBeDisabled();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Salvar e voltar aos slots' }).click();
  await page.goto('./?jogo=campanha&slot=2&diag=1');
  await expect(page.locator('#diag')).toHaveAttribute('data-celula', /^\d+,\d+$/);
  await page.keyboard.press('KeyI');
  await mochila.getByRole('button', { name: /^Habilidades/ }).click();
  await expect(mochila.locator('[data-estudo-restante="seta_arcana"]')).toBeVisible();
  for (let n = 2; n >= 0; n--) {
    await mochila.locator('[data-chave="acelerar-seta_arcana"]').click();
    await expect(mochila.locator('[data-pontos-habilidade]')).toHaveAttribute('data-pontos-habilidade', String(n));
  }
  await expect(mochila.locator('[data-estudo-restante="seta_arcana"]')).toHaveCount(0);
  await mochila.locator('[data-chave="tecla-seta_arcana-0"]').click();
  await expect(mochila.locator('[data-tecla="1"]')).toContainText('Seta arcana');
});
