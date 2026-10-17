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

// D-075: fluxo público de importação, consumo na mochila, escolha de evolução e persistência.
test('progressão: acelerar estudo por item, consumir tomo e escolher evolução por essência', async ({ page }) => {
  test.setTimeout(150000);
  const erros: string[] = [];
  page.on('pageerror', (e) => erros.push(e.message));
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
  j.nivel = 20;
  j.bolsa.pontosHabilidade = 3;
  // Estudo curto para testar conclusão sem aguardar minutos de tempo real.
  j.bolsa.estudo = { id: 'seta_arcana', totalTicks: 18000, restanteTicks: 18000, aceleracoes: 0, velocidade12: 12, fracao12: 0 };
  const bola = j.bolsa.conhecidas.find(h => h.id === 'bola_de_fogo');
  if (!bola) throw new Error('Bola de fogo ausente');
  bola.rank = 2;
  j.bolsa.mochila.push(
    { invId: 'teste-acelerador', itemId: 'aceleracao_mente_rara', qtd: 2, ref: null },
    { invId: 'teste-tomo', itemId: 'tomo_potencial', qtd: 1, ref: null },
    { invId: 'teste-essencia', itemId: 'essencia_fogo', qtd: 1, ref: null },
  );
  j.bolsa.proximoInv = 100;
  await page.locator('[data-slot="2"] input[type="file"]').setInputFiles({
    name: 'personagem-progressao.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(salvo)),
  });
  await page.goto('./?jogo=campanha&slot=2&diag=1');
  await expect(page.locator('#diag')).toHaveAttribute('data-celula', /^\d+,\d+$/);
  await page.keyboard.press('KeyI');
  const mochila = page.getByRole('dialog', { name: 'Mochila' });
  await mochila.locator('[data-chave="inv-teste-acelerador"]').click();
  await mochila.locator('[data-chave="inv-teste-acelerador"]').click();
  await mochila.locator('[data-chave="inv-teste-tomo"]').click();
  await mochila.getByRole('button', { name: /^Habilidades/ }).click();
  await expect(mochila.getByText(/Velocidade do estudo: 2×/)).toBeVisible();
  await expect(mochila.locator('[data-pontos-habilidade]')).toHaveAttribute('data-pontos-habilidade', '4');
  await expect(mochila.locator('[data-chave^="acelerar-"]')).toHaveCount(0);
  await mochila.getByRole('button', { name: 'Itens', exact: true }).click();
  await mochila.locator('[data-chave="inv-teste-essencia"]').click();
  await expect(mochila.getByText('Escolha uma habilidade compatível', { exact: false })).toBeVisible();
  await mochila.locator('[data-chave="caminho-bola_de_fogo-eficiente-teste-essencia"]').click();
  await expect(mochila.locator('[data-habilidade="bola_de_fogo"]')).toContainText('Eficiente');
  await expect(mochila.locator('[data-pontos-habilidade]')).toHaveAttribute('data-pontos-habilidade', '4');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Salvar e voltar aos slots' }).click();
  const downloadFinal = page.waitForEvent('download');
  await page.locator('[data-slot="2"]').getByRole('button', { name: 'Exportar' }).click();
  const caminhoFinal = await (await downloadFinal).path();
  if (!caminhoFinal) throw new Error('save não exportado');
  const final = JSON.parse(await readFile(caminhoFinal, 'utf8')) as typeof salvo;
  const b = final.registro.estado.entidades.find(e => e.bolsa)?.bolsa;
  if (!b?.estudo) throw new Error('estudo não persistido');
  expect(b.estudo.velocidade12).toBe(24);
  expect(b.pontosHabilidade).toBe(4);
  expect(b.ranksPorItens).toBe(1);
  expect(b.conhecidas.find(h => h.id === 'bola_de_fogo')?.caminhos).toContain('eficiente');
  b.estudo.restanteTicks = 60;
  await page.locator('[data-slot="3"] input[type="file"]').setInputFiles({
    name: 'estudo-curto.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(final)),
  });
  await page.goto('./?jogo=campanha&slot=3&diag=1');
  await expect(page.locator('#diag')).toHaveAttribute('data-celula', /^\d+,\d+$/);
  await page.keyboard.press('KeyI');
  await mochila.getByRole('button', { name: /^Habilidades/ }).click();
  await expect(mochila.locator('[data-habilidade="bola_de_fogo"]')).toContainText('Eficiente');
  await expect(mochila.locator('[data-estudo-restante="seta_arcana"]')).toHaveCount(0, { timeout: 30000 });
  await mochila.locator('[data-chave="tecla-seta_arcana-0"]').click();
  await expect(mochila.locator('[data-tecla="1"]')).toContainText('Seta arcana');
  expect(erros).toEqual([]);
});
