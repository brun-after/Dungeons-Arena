// Marco 11A (16/10/2026, D-066): o aceite — uma aventura de 2 fases criada e testada no celular (retângulo, balde,
// baú, porta interna, saída, inspetor por toque longo, fase nova pelo painel, testar a aventura e chegar à fase 2) —
// e, no desktop, um tileset enviado como imagem vira o terreno da fase.

import { expect, test, type Page } from '@playwright/test';
import { pararNaPorta } from './porta';

/** Mesmo enquadramento do "ajustar" do editor: fase 24×16 centrada, célula de 48 px × zoom. */
async function grade(page: Page) {
  const caixa = await page.locator('.editor canvas').boundingBox();
  if (!caixa) throw new Error('canvas sem caixa');
  const zoom = Math.min(caixa.width / (24 * 48), (caixa.height - 120) / (16 * 48)) * 0.95;
  return (x: number, y: number) => ({
    x: caixa.x + caixa.width / 2 + ((x + 0.5) * 48 - 12 * 48) * zoom,
    y: caixa.y + caixa.height / 2 + ((y + 0.5) * 48 - 8 * 48) * zoom,
  });
}

async function tocar(page: Page, p: { x: number; y: number }) {
  await page.mouse.click(p.x, p.y);
}

test('celular: aventura de 2 fases criada no toque, testada da fase 1 até a 2', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'só celular');
  test.setTimeout(150_000);
  const erros: string[] = [];
  page.on('pageerror', (e) => erros.push(e.message));
  await page.setViewportSize({ width: 915, height: 412 });
  await page.goto('./?editor');
  await page.getByLabel('Nome da aventura').fill('Aventura no celular');
  await page.getByRole('button', { name: 'Criar e editar' }).click();
  const status = page.locator('.status-editor');
  await expect(status).toHaveText('1 aviso(s)');
  const tela = await grade(page);

  // Retângulo de parede e balde de vazio por dentro dele.
  await page.locator('[data-modo="retangulo"]').click();
  await page.locator('[data-ferramenta="parede"]').click();
  const a = tela(14, 3);
  const b = tela(16, 5);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(b.x, b.y, { steps: 6 });
  await page.mouse.up();
  await page.locator('[data-modo="balde"]').click();
  await page.locator('[data-ferramenta="vazio"]').click();
  await tocar(page, tela(15, 4));
  await page.locator('[data-modo="pincel"]').click();

  // Baú (o padrão do seletor de objeto), porta interna em dois toques e a saída ao lado do início.
  await page.locator('[data-ferramenta="objeto"]').click();
  await tocar(page, tela(4, 10));
  await page.locator('[data-ferramenta="porta"]').click();
  await tocar(page, tela(3, 12));
  await tocar(page, tela(10, 12));
  await page.locator('[data-ferramenta="saida"]').click();
  await tocar(page, tela(3, 1));
  await expect(status).toHaveText('1 aviso(s)');

  // Toque longo no baú abre o inspetor.
  const bau = tela(4, 10);
  await page.mouse.move(bau.x, bau.y);
  await page.mouse.down();
  await page.waitForTimeout(700);
  await page.mouse.up();
  const inspetor = page.getByRole('dialog', { name: 'Célula (4, 10)' });
  await expect(inspetor).toBeVisible();
  await expect(inspetor.getByRole('heading', { name: 'Baú' })).toBeVisible();
  await inspetor.getByRole('button', { name: 'Fechar o inspetor' }).click();

  // Fase 2 pelo painel de fases.
  await page.getByTestId('fases-editor').click();
  await page.getByRole('button', { name: 'Fase em branco' }).click();
  await expect(page).toHaveURL(/fase=1/);
  await expect(page.getByTestId('fases-editor')).toHaveText('2/2');

  // Testar a aventura desde a fase 1: a saída leva à fase 2.
  await page.getByRole('button', { name: 'Testar a aventura desde a fase 1' }).click();
  await expect(page).toHaveURL(/jogo=teste.*indice=0.*seguir=1/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Fase 1');
  // Marco 24 (D-099): para na saída (ao lado do início) e fica parado nela até sair.
  await page.goto(`${page.url()}&diag=1`);
  await pararNaPorta(page, 'd', '3,1');
  await expect(page.getByText('Fase concluída! Indo para a próxima fase da aventura…')).toBeVisible({ timeout: 30_000 });
  await expect(page).toHaveURL(/indice=1/, { timeout: 10_000 });
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Fase 2');
  expect(erros).toEqual([]);
});

/** Um atlas 4×4 de 128 px desenhado no navegador (cores lisas por célula), como PNG. */
async function atlasDeTeste(page: Page): Promise<Buffer> {
  const dataUrl = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext('2d');
    if (!ctx) return '';
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        ctx.fillStyle = `hsl(${(x * 4 + y) * 22}, 60%, ${30 + y * 8}%)`;
        ctx.fillRect(x * 32, y * 32, 32, 32);
      }
    }
    return c.toDataURL('image/png');
  });
  return Buffer.from(dataUrl.split(',')[1] ?? '', 'base64');
}

test('desktop: um tileset enviado como imagem vira o terreno da fase', async ({ page, isMobile }) => {
  test.skip(isMobile, 'só desktop');
  const erros: string[] = [];
  page.on('pageerror', (e) => erros.push(e.message));
  await page.goto('./?editor');
  await page.getByRole('button', { name: 'Criar e editar' }).click();
  await expect(page.locator('.status-editor')).toHaveText('1 aviso(s)');
  const png = await atlasDeTeste(page);
  await page.getByTestId('fases-editor').click();
  await page.getByRole('button', { name: 'Tileset desta fase' }).click();
  await page.locator('input[type="file"][accept^="image"]').setInputFiles({ name: 'atlas.png', mimeType: 'image/png', buffer: png });
  const novo = page.getByRole('dialog', { name: 'Novo tileset' });
  await expect(novo.locator('.celula-tileset')).toHaveCount(16);
  await expect(novo.getByRole('button', { name: 'Célula 1,0: parede_N' })).toBeVisible();
  await novo.getByRole('button', { name: 'Salvar tileset' }).click();
  await expect(page.getByTestId('fases-editor')).toBeVisible();
  await page.getByTestId('fases-editor').click();
  await expect(page.getByRole('button', { name: 'Tileset desta fase' })).toHaveText('Tileset próprio…');
  await page.keyboard.press('Escape');
  // O jogo carrega o atlas no teste da fase.
  await page.getByRole('button', { name: 'Testar esta fase' }).click();
  await expect(page).toHaveURL(/jogo=teste/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Fase 1');
  expect(erros).toEqual([]);
});
