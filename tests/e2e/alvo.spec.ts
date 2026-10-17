// Ajuste de 15/10/2026 (D-065): no navegador — Q seleciona e trava o boneco de treino, T destrava, Esc limpa antes
// de pausar; no celular, o 🎯 troca para o alvo mais próximo. O quadro do alvo mostra o estado.

import { expect, test, type Page } from '@playwright/test';

async function abrir(page: Page): Promise<string[]> {
  const erros: string[] = [];
  page.on('pageerror', (e) => erros.push(e.message));
  await page.goto('./?jogo=campanha&slot=1&diag=1&classe=aventureiro');
  await expect(page.locator('#diag')).toHaveAttribute('data-celula', /^\d+,\d+$/);
  return erros;
}

test('desktop: Q trava o boneco, T destrava e Esc limpa antes de pausar', async ({ page, isMobile }) => {
  test.skip(isMobile, 'só desktop');
  const erros = await abrir(page);
  const quadro = page.locator('.quadro-alvo');
  const pausa = page.getByRole('dialog', { name: 'Jogo pausado' });
  await expect(quadro).toBeHidden();
  await page.keyboard.press('KeyQ');
  await expect(quadro).toBeVisible();
  await expect(quadro).toHaveAttribute('data-travado', 'true');
  await page.keyboard.press('KeyT');
  await expect(quadro).toHaveAttribute('data-travado', 'false');
  await page.keyboard.press('Escape');
  await expect(quadro).toBeHidden();
  await expect(pausa).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(pausa).toBeVisible();
  expect(erros).toEqual([]);
});

test('celular: o 🎯 troca para o alvo mais próximo e mostra o quadro do alvo', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'só celular');
  const erros = await abrir(page);
  await page.getByTestId('alvo').tap();
  await expect(page.locator('.quadro-alvo')).toHaveAttribute('data-travado', 'true');
  expect(erros).toEqual([]);
});

// Ajuste de 17/10/2026: aviso real emitido pela campanha e alvo selecionado pelo controle de toque.
test('celular: aviso junto ao topo, sem cobrir o alvo, e vida do alvo do tamanho da vida do jogador', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'só celular');
  await page.setViewportSize({ width: 915, height: 412 });
  await page.goto('./?jogo=campanha&slot=1&classe=aventureiro&pesquisa=1');
  await expect(page.locator('.aviso')).toContainText('Obrigado por testar');
  await page.getByTestId('alvo').tap();
  await expect(page.locator('.quadro-alvo')).toBeVisible();

  for (const c of [
    { largura: 915, altura: 412, seguro: 0, escala: 1 },
    { largura: 568, altura: 320, seguro: 0, escala: 1 },
    { largura: 915, altura: 412, seguro: 40, escala: 1.5 },
  ]) {
    await page.setViewportSize({ width: c.largura, height: c.altura });
    const medidas = await page.evaluate(({ seguro, escala }) => {
      const raiz = document.documentElement;
      for (const lado of ['topo', 'base', 'esq', 'dir']) raiz.style.setProperty(`--seguro-${lado}`, `${seguro}px`);
      raiz.style.setProperty('--escala-ui', String(escala));
      const aviso = document.querySelector<HTMLElement>('.aviso');
      const alvo = document.querySelector<HTMLElement>('.quadro-alvo');
      const vidaAlvo = alvo?.querySelector('.barra');
      const vidaJogador = document.querySelector('.status-jogador .vida');
      if (!aviso || !alvo || !vidaAlvo || !vidaJogador) throw new Error('HUD ausente');
      return {
        topo: aviso.getBoundingClientRect().top,
        base: aviso.getBoundingClientRect().bottom,
        topoAlvo: alvo.getBoundingClientRect().top,
        fonteAviso: getComputedStyle(aviso).fontSize,
        fonteAlvo: getComputedStyle(alvo).fontSize,
        larguraAlvo: vidaAlvo.getBoundingClientRect().width,
        larguraJogador: vidaJogador.getBoundingClientRect().width,
        alturaAlvo: vidaAlvo.getBoundingClientRect().height,
        alturaJogador: vidaJogador.getBoundingClientRect().height,
        mesmaFaixa: aviso.parentElement === alvo.parentElement,
        eventos: getComputedStyle(aviso).pointerEvents,
      };
    }, c);
    expect(medidas.mesmaFaixa).toBe(true);
    expect(medidas.topo).toBeCloseTo(c.seguro + 4, 0);
    expect(medidas.base).toBeLessThanOrEqual(medidas.topoAlvo - 3);
    expect(medidas.fonteAviso).toBe(medidas.fonteAlvo);
    expect(medidas.larguraAlvo).toBeCloseTo(medidas.larguraJogador, 0);
    expect(medidas.alturaAlvo).toBeCloseTo(medidas.alturaJogador, 0);
    expect(medidas.eventos).toBe('none');
  }
});
