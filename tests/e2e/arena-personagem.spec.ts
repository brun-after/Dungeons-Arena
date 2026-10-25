// Marco 17 (15/10/2026, D-063): no navegador — o personagem do slot entra na arena online (o servidor local do
// playwright.config.ts certifica), joga e volta para o slot com "Salvar e sair"; e a nuvem (falsa, `?nuvem=falsa`) na
// tela de slots: entrar, enviar, apagar o local e baixar de volta.

import { expect, test, type Page } from '@playwright/test';

async function personagemNoSlot(page: Page, classe: string): Promise<void> {
  await page.goto(`./?jogo=campanha&slot=1&diag=1&classe=${classe}`);
  await expect(page.locator('#diag')).toHaveAttribute('data-celula', /^\d+,\d+$/);
  await page.getByRole('button', { name: 'Salvar e voltar aos slots' }).click();
  await expect(page.locator('[data-slot="1"]')).toContainText('nível 1');
}

test.describe('arena com o personagem e a nuvem', () => {
  test.skip(({ isMobile }) => isMobile, 'só desktop');

  test('o personagem do slot entra inteiro na arena e volta para o slot ao sair', async ({ page }) => {
    const erros: string[] = [];
    page.on('pageerror', (e) => erros.push(e.message));
    await personagemNoSlot(page, 'arqueiro');
    await page.goto('./?arena=online&diag=1');
    const escolha = page.locator('.escolha-personagem');
    await expect(escolha).toHaveValue('1');
    await expect(escolha.locator('option:checked')).toContainText(/\d+ descobertas/);
    await expect(page.locator('.salas-da-faixa h2')).toHaveText('Salas da faixa 1-5');
    await page.getByRole('button', { name: 'Criar sala' }).click();
    await expect(page.locator('#diag')).toHaveAttribute('data-celula', /^\d+,\d+$/, { timeout: 20_000 });
    // Ficha inteira: a mochila do slot está lá (o arqueiro começa com poções).
    await page.keyboard.press('KeyI');
    await expect(page.getByRole('dialog', { name: 'Mochila' })).toContainText('Poção');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Gravar o personagem no slot e sair da arena' }).click();
    await expect(page.getByText('Personagem salvo no slot 1.')).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/arena=online/);
    expect(erros).toEqual([]);
  });

  test('nuvem: entrar, enviar o slot, apagar o local e baixar de volta', async ({ page }) => {
    const erros: string[] = [];
    page.on('pageerror', (e) => erros.push(e.message));
    await personagemNoSlot(page, 'mago');
    await page.goto('./?jogo=campanha&nuvem=falsa');
    await page.getByRole('button', { name: 'Entrar com Google' }).click();
    await expect(page.getByText('Nuvem: Pessoa de teste')).toBeVisible();
    const slot1 = page.locator('[data-slot="1"]');
    await expect(slot1).toContainText('Na nuvem: vazio');
    await slot1.getByRole('button', { name: 'Enviar para a nuvem' }).click();
    await expect(slot1).toContainText('Na nuvem: nível 1');
    // Apaga o local (dois toques) e baixa da nuvem.
    await slot1.getByRole('button', { name: 'Excluir' }).click();
    await slot1.getByRole('button', { name: /Confirmar/ }).click();
    await expect(slot1).toContainText('Vazio');
    await slot1.getByRole('button', { name: 'Baixar da nuvem' }).click();
    await expect(slot1).toContainText('nível 1');
    expect(erros).toEqual([]);
  });
});
