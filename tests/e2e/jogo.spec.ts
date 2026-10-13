import { expect, test, type Locator, type Page } from '@playwright/test';

async function abrir(page: Page) {
  const erros: string[] = [];
  page.on('pageerror', (e) => erros.push(e.message));
  await page.goto('./?diag=1');
  const diag = page.locator('#diag');
  await expect(diag).toHaveAttribute('data-celula', /^\d+,\d+$/);
  return { diag, erros };
}

async function ler(diag: Locator, atributo: 'celula' | 'tela'): Promise<[number, number]> {
  const valor = (await diag.getAttribute(`data-${atributo}`)) ?? '0,0';
  const [a = 0, b = 0] = valor.split(',').map(Number);
  return [a, b];
}

/** Espera o jogador e a câmera pararem (célula e posição na tela iguais em duas leituras). */
async function esperarParado(page: Page, diag: Locator) {
  await expect
    .poll(
      async () => {
        const antes = `${await diag.getAttribute('data-celula')}|${await diag.getAttribute('data-tela')}`;
        await page.waitForTimeout(400);
        const depois = `${await diag.getAttribute('data-celula')}|${await diag.getAttribute('data-tela')}`;
        return antes === depois;
      },
      { timeout: 15_000 },
    )
    .toBe(true);
}

async function centro(locator: Locator) {
  const caixa = await locator.boundingBox();
  if (!caixa) throw new Error('elemento sem caixa');
  return { x: caixa.x + caixa.width / 2, y: caixa.y + caixa.height / 2 };
}

test.describe('desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'só desktop');

  test('teclado move o jogador e o clique no mapa leva até a célula', async ({ page }) => {
    const { diag, erros } = await abrir(page);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Salões da entrada');
    const [x0] = await ler(diag, 'celula');

    // Segura D até o jogador andar (sem prazo fixo: o navegador de teste pode estar lento).
    await page.keyboard.down('d');
    await expect.poll(async () => (await ler(diag, 'celula'))[0], { timeout: 15_000 }).toBeGreaterThan(x0);
    await page.keyboard.up('d');
    await esperarParado(page, diag);

    const [x, y] = await ler(diag, 'celula');
    const [tx, ty] = await ler(diag, 'tela');
    // Zoom inicial 1: uma célula = 48 px. Clica 3 células abaixo do jogador.
    await page.mouse.click(tx, ty + 3 * 48);
    await expect.poll(async () => ler(diag, 'celula'), { timeout: 15_000 }).toEqual([x, y + 3]);
    expect(erros).toEqual([]);
  });

  test('combate: selecionar o boneco, atacar sozinho e lançar habilidade', async ({ page }) => {
    const { diag, erros } = await abrir(page);
    // Anda até (16,5), duas células à esquerda do boneco em (18,5).
    await page.mouse.click(16.5 * 48, 5.5 * 48);
    await expect.poll(async () => ler(diag, 'celula'), { timeout: 20_000 }).toEqual([16, 5]);
    await esperarParado(page, diag);
    const [tx, ty] = await ler(diag, 'tela');
    await page.mouse.click(tx + 2 * 48, ty);
    await expect.poll(async () => Number(await diag.getAttribute('data-impactos')), { timeout: 15_000 }).toBeGreaterThan(0);
    await page.keyboard.press('Digit1');
    await expect(page.locator('.log-combate li').first()).toBeVisible();
    expect(erros).toEqual([]);
  });

  test('controles de toque ficam escondidos no desktop', async ({ page }) => {
    await abrir(page);
    await expect(page.getByTestId('joystick')).toBeHidden();
  });
});

test.describe('celular (emulação)', () => {
  test.skip(({ isMobile }) => !isMobile, 'só celular');

  test('arrastar o joystick só com o mouse move o jogador', async ({ page }) => {
    const { diag, erros } = await abrir(page);
    const [x0] = await ler(diag, 'celula');
    const j = await centro(page.getByTestId('joystick'));
    await page.mouse.move(j.x, j.y);
    await page.mouse.down();
    await page.mouse.move(j.x + 45, j.y, { steps: 4 });
    await expect.poll(async () => (await ler(diag, 'celula'))[0], { timeout: 15_000 }).toBeGreaterThan(x0);
    await page.mouse.up();
    expect(erros).toEqual([]);
  });

  test('dois dedos: segurar o joystick e usar habilidade ao mesmo tempo', async ({ page }) => {
    const { diag, erros } = await abrir(page);
    const [x0] = await ler(diag, 'celula');
    const j = await centro(page.getByTestId('joystick'));
    const h = await centro(page.getByTestId('habilidade-curar'));
    const cdp = await page.context().newCDPSession(page);
    const dedo1 = { x: j.x + 45, y: j.y, id: 1 };

    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: j.x, y: j.y, id: 1 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [dedo1] });
    await page.waitForTimeout(300);
    // Segundo dedo na roda de habilidades enquanto o primeiro continua no joystick.
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [dedo1, { x: h.x, y: h.y, id: 2 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [dedo1] });

    // Com o primeiro dedo ainda no joystick: a cura gera um impacto (no próprio jogador) e o
    // movimento continua depois da conjuração.
    await expect(diag).not.toHaveAttribute('data-impactos', '0', { timeout: 15_000 });
    await expect.poll(async () => (await ler(diag, 'celula'))[0], { timeout: 15_000 }).toBeGreaterThan(x0);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    expect(erros).toEqual([]);
  });

  test('a roda de habilidades cabe na tela e não cobre o joystick', async ({ page }) => {
    await abrir(page);
    const viewport = page.viewportSize();
    const joystick = await page.getByTestId('joystick').boundingBox();
    for (const id of ['seta_arcana', 'explosao', 'curar', 'golpe_atordoante']) {
      const caixa = await page.getByTestId(`habilidade-${id}`).boundingBox();
      expect(caixa, id).not.toBeNull();
      if (!caixa || !viewport || !joystick) continue;
      expect(caixa.x).toBeGreaterThanOrEqual(0);
      expect(caixa.x + caixa.width).toBeLessThanOrEqual(viewport.width);
      expect(caixa.x).toBeGreaterThan(joystick.x + joystick.width);
    }
  });

  test('a página não rola nem dá zoom', async ({ page }) => {
    await abrir(page);
    const j = await centro(page.getByTestId('joystick'));
    await page.mouse.move(j.x, j.y - 200);
    await page.mouse.down();
    await page.mouse.move(j.x, j.y - 400, { steps: 5 });
    await page.mouse.up();
    const estado = await page.evaluate(() => [window.scrollX, window.scrollY, window.visualViewport?.scale ?? 1]);
    expect(estado).toEqual([0, 0, 1]);
  });
});
