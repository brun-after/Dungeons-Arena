// Marco 16 (15/10/2026, D-062, §4.8–4.9): celular de verdade — girar para retrato mostra o aviso toda vez; voltar a
// deitar enquadra o jogador; com uma área segura (entalhe e barra de gestos, emuladas pelas variáveis de CSS), nada da
// interface sai dela.

import { expect, test, type Page } from '@playwright/test';

async function abrir(page: Page) {
  const erros: string[] = [];
  page.on('pageerror', (e) => erros.push(e.message));
  await page.goto('./?jogo=campanha&slot=1&diag=1&classe=aventureiro');
  await expect(page.locator('#diag')).toHaveAttribute('data-celula', /^\d+,\d+$/);
  return erros;
}

test.describe('celular: girar e área segura', () => {
  test.skip(({ isMobile }) => !isMobile, 'só celular');

  test('girar para retrato mostra o aviso toda vez; deitado de novo, o jogador continua na tela', async ({ page }) => {
    const erros = await abrir(page);
    const aviso = page.getByRole('status').filter({ hasText: 'aparelho deitado' });
    await page.setViewportSize({ width: 915, height: 412 });
    await expect(aviso).toHaveCount(0, { timeout: 8000 });
    for (let volta = 0; volta < 2; volta++) {
      await page.setViewportSize({ width: 412, height: 915 });
      await expect(aviso).toBeVisible();
      await page.setViewportSize({ width: 915, height: 412 });
      await expect(aviso).toHaveCount(0, { timeout: 8000 });
    }
    // A câmera volta a enquadrar: a posição do jogador na tela fica dentro da janela deitada.
    await expect
      .poll(async () => {
        const [x = -1, y = -1] = ((await page.locator('#diag').getAttribute('data-tela')) ?? '').split(',').map(Number);
        return x > 0 && x < 915 && y > 0 && y < 412;
      })
      .toBe(true);
    expect(erros).toEqual([]);
  });

  test('com área segura de 40 px em volta, cabeçalho, minimapa, joystick e habilidades ficam dentro dela', async ({ page }) => {
    const erros = await abrir(page);
    await page.setViewportSize({ width: 915, height: 412 });
    await page.evaluate(() => {
      for (const lado of ['topo', 'base', 'esq', 'dir']) document.documentElement.style.setProperty(`--seguro-${lado}`, '40px');
    });
    await page.waitForTimeout(500);
    const caixas = await page.evaluate(() =>
      ['.cabecalho button', '.cabecalho a', '.minimapa', '[data-testid="joystick"]', '.barra-habilidades button'].flatMap((sel) =>
        [...document.querySelectorAll<HTMLElement>(sel)]
          .filter((el) => el.offsetParent !== null)
          .map((el) => {
            const r = el.getBoundingClientRect();
            return { sel, esq: r.left, dir: r.right, topo: r.top, base: r.bottom };
          }),
      ),
    );
    expect(caixas.length).toBeGreaterThan(4);
    for (const c of caixas) {
      expect(c.esq, c.sel).toBeGreaterThanOrEqual(40 - 0.5);
      expect(c.dir, c.sel).toBeLessThanOrEqual(915 - 40 + 0.5);
      expect(c.topo, c.sel).toBeGreaterThanOrEqual(40 - 0.5);
      expect(c.base, c.sel).toBeLessThanOrEqual(412 - 40 + 0.5);
    }
    expect(erros).toEqual([]);
  });
});
