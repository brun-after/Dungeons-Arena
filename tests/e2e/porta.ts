// Marco 24 (25/10/2026, D-099): sair da fase pede ficar parado na porta por 3 s. Anda com a tecla, um passo por vez
// (segurar a tecla passaria da porta), até a célula da porta (lida no #diag, com ?diag=1) e fica parado em cima.
import type { Page } from '@playwright/test';

const celula = (page: Page) => page.locator('#diag').getAttribute('data-celula');

export async function pararNaPorta(page: Page, tecla: string, alvo: string): Promise<void> {
  for (let passo = 0; passo < 60; passo++) {
    const antes = await celula(page);
    if (antes === alvo) return;
    await page.keyboard.down(tecla);
    await page.waitForTimeout(90);
    await page.keyboard.up(tecla);
    await page.waitForFunction((c) => document.querySelector('#diag')?.getAttribute('data-celula') !== c, antes, { polling: 'raf', timeout: 5_000 });
  }
  throw new Error(`não chegou à porta ${alvo}`);
}
