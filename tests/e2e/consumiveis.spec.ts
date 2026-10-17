// 17/10/2026: leitura dos consumíveis e espaço dos controles em desktop e celular.
import { expect, test } from '@playwright/test';

test('consumíveis mostram recurso, potência e estoque nos dois dispositivos', async ({ page }) => {
  await page.goto('./?jogo=campanha&slot=1&diag=1&classe=aventureiro');
  await expect(page.locator('#diag')).toHaveAttribute('data-celula', /^\d+,\d+$/);
  const barra = page.locator('.barra-consumiveis');
  const vida = barra.locator('[data-item="pocao_vida"]');
  await expect(vida.locator('.nome')).toHaveText(/^Vida \+\d+$/);
  await expect(vida.locator('.nome')).toBeVisible();
  await expect(vida).toHaveAttribute('aria-label', /Usar Poção de vida/);
  const nomes = await barra.locator('.nome').allTextContents();
  expect(nomes.every((n) => !n.includes('Pergaminho') && !n.includes('Poção'))).toBe(true);
  for (const nome of await barra.locator('.nome').all()) {
    expect(await nome.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(true);
  }
});

test('interação e alvo ficam em fileira à direita sem sobrepor a roda', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'controles de toque');
  for (const largura of [915, 568, 393]) {
    await page.setViewportSize({ width: largura, height: largura === 393 ? 851 : 412 });
    await page.goto('./?jogo=campanha&slot=1&diag=1&classe=aventureiro');
    await expect(page.locator('#diag')).toHaveAttribute('data-celula', /^\d+,\d+$/);
    const interagir = await page.getByTestId('interagir').boundingBox();
    const alvo = await page.getByTestId('alvo').boundingBox();
    expect(interagir).not.toBeNull();
    expect(alvo).not.toBeNull();
    if (!interagir || !alvo) throw new Error('Controles sem caixa');
    expect(Math.abs(interagir.y + interagir.height / 2 - alvo.y - alvo.height / 2)).toBeLessThan(1);
    expect(alvo.x).toBeGreaterThanOrEqual(interagir.x + interagir.width);
    expect(interagir.x + interagir.width / 2).toBeGreaterThan(largura / 2);
    for (const botao of await page.locator('.botao-habilidade, .joystick, .botao-acao.ataque').all()) {
      const caixa = await botao.boundingBox();
      if (!caixa) continue;
      for (const controle of [interagir, alvo]) {
        const sobrepoe = controle.x < caixa.x + caixa.width && controle.x + controle.width > caixa.x && controle.y < caixa.y + caixa.height && controle.y + controle.height > caixa.y;
        expect(sobrepoe, JSON.stringify({ largura, controle, caixa, classe: await botao.getAttribute('class') })).toBe(false);
      }
    }
  }
});
