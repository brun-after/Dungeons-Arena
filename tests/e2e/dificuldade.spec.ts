// Marco 15 (15/10/2026, D-061): a dificuldade escolhida no slot, trocada na pausa e lembrada pelo slot.
import { expect, test } from '@playwright/test';

test.describe('dificuldade', () => {
  test.skip(({ isMobile }) => isMobile, 'só desktop');

  // Marco 15: escolher a dificuldade no slot e trocar na pausa; o slot lembra a última.
  test('dificuldade: Difícil no slot, Pesadelo na pausa, e o slot lembra', async ({ page }) => {
    const erros: string[] = [];
    page.on('pageerror', (e) => erros.push(e.message));
    await page.goto('./?jogo=campanha');
    const slot1 = page.locator('[data-slot="1"]');
    await slot1.getByLabel('Dificuldade do slot 1').selectOption('dificil');
    const href = await slot1.getByRole('link', { name: 'Novo jogo' }).getAttribute('href');
    expect(href).toContain('dificuldade=dificil');
    await page.goto(`${href ?? ''}&diag=1&classe=aventureiro`);
    const diag = page.locator('#diag');
    await expect(diag).toHaveAttribute('data-dificuldade', 'dificil', { timeout: 15_000 });

    await page.keyboard.press('Escape');
    const pausa = page.getByRole('dialog', { name: 'Jogo pausado' });
    await expect(pausa.getByLabel('Dificuldade')).toHaveValue('dificil');
    await pausa.getByLabel('Dificuldade').selectOption('pesadelo');
    await pausa.getByRole('button', { name: 'Continuar' }).click();
    await expect(diag).toHaveAttribute('data-dificuldade', 'pesadelo', { timeout: 10_000 });
    await expect(diag).toHaveAttribute('data-nivel', '1');

    await page.getByRole('button', { name: 'Salvar e voltar aos slots' }).click();
    await expect(slot1).toContainText('Última dificuldade: Pesadelo');
    await expect(slot1.getByRole('link', { name: 'Continuar' })).toHaveAttribute('href', /dificuldade=pesadelo/);
    expect(erros).toEqual([]);
  });
});
