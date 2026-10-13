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

    await page.keyboard.down('d');
    await page.waitForTimeout(900);
    await page.keyboard.up('d');
    await expect.poll(async () => (await ler(diag, 'celula'))[0]).toBeGreaterThan(x0);
    await page.waitForTimeout(500);

    const [x, y] = await ler(diag, 'celula');
    const [tx, ty] = await ler(diag, 'tela');
    // Zoom inicial 1: uma célula = 48 px. Clica 3 células abaixo do jogador.
    await page.mouse.click(tx, ty + 3 * 48);
    await expect.poll(async () => ler(diag, 'celula'), { timeout: 5_000 }).toEqual([x, y + 3]);
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
    await page.waitForTimeout(900);
    await page.mouse.up();
    await expect.poll(async () => (await ler(diag, 'celula'))[0]).toBeGreaterThan(x0);
    expect(erros).toEqual([]);
  });

  test('dois dedos: segurar o joystick e atacar ao mesmo tempo', async ({ page }) => {
    const { diag, erros } = await abrir(page);
    const [x0] = await ler(diag, 'celula');
    const j = await centro(page.getByTestId('joystick'));
    const a = await centro(page.getByTestId('ataque'));
    const cdp = await page.context().newCDPSession(page);
    const dedo1 = { x: j.x + 45, y: j.y, id: 1 };

    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: j.x, y: j.y, id: 1 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [dedo1] });
    await page.waitForTimeout(300);
    // Segundo dedo no ataque enquanto o primeiro continua no joystick.
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [dedo1, { x: a.x, y: a.y, id: 2 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [dedo1] });
    await page.waitForTimeout(700);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

    await expect(diag).not.toHaveAttribute('data-ataques', '0');
    expect((await ler(diag, 'celula'))[0]).toBeGreaterThan(x0);
    expect(erros).toEqual([]);
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
