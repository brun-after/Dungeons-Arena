// D-075: estoque garantido, preço crescente e consumo pela mochila em desktop/celular.
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { RegistroProgresso } from '../../src/save/esquema';
import { novoObjeto } from '../../src/world/objetos';

test('loja mantém tomo a preço fixo e mochila permanece aberta ao trocar equipamentos', async ({ page, isMobile }) => {
  await page.goto('./?jogo=campanha&slot=1&diag=1&classe=mago');
  await expect(page.locator('#diag')).toHaveAttribute('data-celula', /^\d+,\d+$/);
  await page.getByRole('button', { name: 'Salvar e voltar aos slots' }).click();
  const download = page.waitForEvent('download');
  await page.locator('[data-slot="1"]').getByRole('button', { name: 'Exportar' }).click();
  const caminho = await (await download).path();
  if (!caminho) throw new Error('Exportação ausente');
  const salvo = JSON.parse(await readFile(caminho, 'utf8')) as { registro: RegistroProgresso };
  const j = salvo.registro.estado.entidades.find((e) => e.bolsa);
  if (!j?.bolsa) throw new Error('Personagem ausente');
  j.nivel = 2;
  j.bolsa.ouro = 100000;
  j.bolsa.mochila.push({ invId: 'teste-elmo', itemId: 'elmo_ferro', qtd: 1, ref: null }, { invId: 'teste-escudo', itemId: 'escudo_madeira', qtd: 1, ref: null });
  j.bolsa.proximoInv = 1000;
  salvo.registro.estado.entidades = [j];
  salvo.registro.estado.objetos = [novoObjeto('loja-progresso', 'loja', j.x, j.y)];
  await page.locator('[data-slot="2"] input[type="file"]').setInputFiles({ name: 'loja.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(salvo)) });
  await page.goto('./?jogo=campanha&slot=2&diag=1');
  await expect(page.locator('#diag')).toHaveAttribute('data-celula', /^\d+,\d+$/);
  if (isMobile) await page.getByTestId('interagir').click();
  else await page.keyboard.press('KeyE');
  const loja = page.getByRole('dialog', { name: 'Loja' });
  await expect(loja.locator('[data-chave="comprar-aceleracao_mente_comum"]')).toBeVisible();
  const tomo = loja.locator('[data-chave="comprar-tomo_potencial"]');
  await expect(tomo).toContainText('10000');
  await tomo.click();
  await expect(tomo).toContainText('10000');
  await expect(loja.locator('[data-ouro]')).toHaveAttribute('data-ouro', '90000');
  await tomo.click();
  await expect(tomo).toContainText('10000');
  await expect(loja.locator('[data-ouro]')).toHaveAttribute('data-ouro', '80000');
  await loja.getByRole('button', { name: 'Fechar a loja' }).click();
  // A loja não tem prazo: todas as aberturas têm o mesmo ateTick. Cada sessão deve reabrir.
  for (let abertura = 0; abertura < 2; abertura++) {
    await expect(async () => {
      if (isMobile) await page.getByTestId('interagir').click();
      else await page.keyboard.press('KeyE');
      await expect(loja).toBeVisible({ timeout: 500 });
    }).toPass({ intervals: [1000], timeout: 30000 });
    await expect(loja.locator('[data-chave="comprar-tomo_potencial"]')).toBeVisible();
    if (!isMobile && abertura === 0) await page.keyboard.press('Escape');
    else await loja.getByRole('button', { name: 'Fechar a loja' }).click();
    await expect(loja).not.toBeVisible();
  }
  await page.getByRole('button', { name: /Abrir a mochila/ }).click();
  const mochila = page.getByRole('dialog', { name: 'Mochila' });
  await mochila.getByRole('button', { name: 'Usar: Tomo do potencial', exact: true }).click();
  if (isMobile) await page.getByRole('button', { name: /Abrir a mochila/ }).click();
  await mochila.getByRole('button', { name: /^Habilidades/ }).click();
  await expect(mochila.locator('[data-pontos-habilidade]')).toHaveAttribute('data-pontos-habilidade', '1');
  await expect(page.locator('.barra-consumiveis [data-item="tomo_potencial"]')).toHaveCount(0);
  await mochila.getByRole('button', { name: 'Itens', exact: true }).click();
  await expect(mochila.locator('[data-chave="inv-teste-elmo"]')).toBeEnabled();
  await mochila.locator('[data-chave="inv-teste-elmo"]').click();
  await expect(mochila).toBeVisible();
  await expect(mochila.locator('[data-chave="slot-cabeca"]')).toBeVisible();
  await mochila.locator('[data-chave="inv-teste-escudo"]').click();
  await expect(mochila).toBeVisible();
  await expect(mochila.locator('[data-chave="slot-arma_secundaria"]')).toBeVisible();
  await mochila.locator('[data-chave="slot-cabeca"]').click();
  await expect(mochila).toBeVisible();
  await expect(mochila.getByRole('button', { name: 'Equipar: Elmo de ferro', exact: true })).toBeVisible();
  await mochila.getByRole('button', { name: 'Soltar 1: Elmo de ferro', exact: true }).click();
  await expect(mochila).toBeVisible();
  await expect(mochila.getByRole('button', { name: 'Equipar: Elmo de ferro', exact: true })).toHaveCount(0);
  // O item não volta automaticamente enquanto o dono está parado, e é persistido no chão.
  await mochila.getByRole('button', { name: 'Fechar a mochila' }).click();
  await page.getByRole('button', { name: 'Salvar e voltar aos slots' }).click();
  const exportado = page.waitForEvent('download');
  await page.locator('[data-slot="2"]').getByRole('button', { name: 'Exportar' }).click();
  const arquivo = await (await exportado).path();
  if (!arquivo) throw new Error('Exportação ausente');
  const registro = JSON.parse(await readFile(arquivo, 'utf8')) as { registro: RegistroProgresso };
  expect(registro.registro.estado.objetos.some((o) => o.itemId === 'elmo_ferro' && o.valor === 1)).toBe(true);
});
