// Marco 19 (17/10/2026): importar uma build, executar o triplo pelos controles e persistir a descoberta.
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { RegistroProgresso } from '../../src/save/esquema';

test('Estaca, Névoa e Abalo concluem Prisão pestilenta e o diário persiste', async ({ page, isMobile }) => {
  test.setTimeout(180000);
  const erros: string[] = []; page.on('pageerror', (e) => erros.push(e.message));
  await page.clock.install({ time: new Date() });
  await page.goto('./?jogo=campanha&slot=1&diag=1&classe=mago');
  await expect(page.locator('#diag')).toHaveAttribute('data-celula', /^\d+,\d+$/, { timeout: 30000 });
  await page.getByRole('button', { name: 'Salvar e voltar aos slots' }).click();
  const baixar = page.waitForEvent('download');
  await page.locator('[data-slot="1"]').getByRole('button', { name: 'Exportar' }).click();
  const arquivo = await (await baixar).path(); if (!arquivo) throw new Error('Save ausente');
  const salvo = JSON.parse(await readFile(arquivo, 'utf8')) as { registro: RegistroProgresso };
  const j = salvo.registro.estado.entidades.find((e) => e.bolsa);
  const a = salvo.registro.estado.entidades.find((e) => e.preset === 'boneco');
  if (!j?.bolsa || !a) throw new Error('Cena de treino ausente');
  j.x = 7; j.y = 8; j.caminho = []; j.waypoints = [];
  j.nivel = 20; j.autoAtaque = false; j.alvoSelecionado = a.id; j.alvoTravado = true;
  j.bolsa.barra = ['estaca_de_pedra','nevoa_venenosa','abalo_sismico',null];
  // O save guarda também a barra derivada; a fixture mantém as duas representações coerentes.
  j.habilidades = j.bolsa.barra.filter((id): id is string => id !== null);
  // Carisma 30 converte o d20 em 20; o smoke mede a sequência, sem falhas críticas aleatórias.
  j.atributos.carisma = j.bolsa.atributosBase.carisma = 30;
  j.bolsa.conhecidas.push(...j.bolsa.barra.filter((id): id is string => id !== null).map((id) => ({ id, rank: 1, caminhos: [] })));
  a.hp = a.hpMax = 5000; a.ia = null;
  salvo.registro.estado.entidades = [j,a]; salvo.registro.estado.objetos = [];
  await page.locator('[data-slot="2"] input[type="file"]').setInputFiles({ name:'combo.json', mimeType:'application/json', buffer:Buffer.from(JSON.stringify(salvo)) });
  await page.goto('./?jogo=campanha&slot=2&diag=1');
  await expect(page.getByTestId('habilidade-estaca_de_pedra')).toBeVisible({ timeout:30000 });
  // A automação e as capturas do WebGL lento não consomem a janela de gameplay.
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.getByTestId('habilidade-estaca_de_pedra').click();
  await page.clock.runFor(800);
  await expect(page.locator('.indicador-combo')).toContainText('Névoa venenosa', { timeout:20000 });
  await page.getByTestId('habilidade-nevoa_venenosa').click();
  await page.clock.runFor(800);
  await expect(page.locator('.indicador-combo')).toContainText('Abalo sísmico', { timeout:20000 });
  await page.getByTestId('habilidade-abalo_sismico').click();
  await page.clock.runFor(800);
  await expect(page.locator('.log-combate')).toContainText('Prisão pestilenta', { timeout:20000 });
  await page.clock.resume();
  if (isMobile) await page.getByRole('button', { name:/Abrir a mochila/ }).click(); else await page.keyboard.press('KeyI');
  const mochila = page.getByRole('dialog', { name:'Mochila' });
  await mochila.getByRole('button', { name:/Habilidades/ }).click();
  await mochila.locator('.catalogo-combos summary').click();
  await expect(mochila.locator('[data-combo="prisao_pestilenta"]')).toContainText('Estaca de pedra › Névoa venenosa › Abalo sísmico');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name:'Salvar e voltar aos slots' }).click();
  const baixarFinal = page.waitForEvent('download');
  await page.locator('[data-slot="2"]').getByRole('button', { name:'Exportar' }).click();
  const final = await (await baixarFinal).path(); if (!final) throw new Error('Save final ausente');
  expect(await readFile(final,'utf8')).toContain('combo:prisao_pestilenta');
  expect(erros).toEqual([]);
});
