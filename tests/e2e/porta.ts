// Marco 24 (25/10/2026, D-099): sair da fase pede ficar parado na porta por 3 s. Pela tecla não dá para parar numa
// célula exata (o comando chega alguns ticks depois e o passo seguinte já começou), então o teste clica na célula da
// porta: o #diag (com ?diag=1) dá a célula do jogador e onde ela e as vizinhas (+x, +y) caem na tela. O caminho termina
// na porta e o jogador fica parado em cima.
import { expect, type Page } from '@playwright/test';

export async function pararNaPorta(page: Page, alvo: string): Promise<void> {
  const diag = page.locator('#diag');
  await page.locator('#diag[data-celula][data-grade]').waitFor({ state: 'attached', timeout: 30_000 });
  // Uma leitura estável (parado) da célula e da grade.
  await expect.poll(async () => (await diag.getAttribute('data-celula')) === (await diag.getAttribute('data-destino'))).toBe(true);
  const [cx = 0, cy = 0] = ((await diag.getAttribute('data-celula')) ?? '').split(',').map(Number);
  const [ox = 0, oy = 0, xx = 0, xy = 0, yx = 0, yy = 0] = ((await diag.getAttribute('data-grade')) ?? '').split(',').map(Number);
  const [ax = 0, ay = 0] = alvo.split(',').map(Number);
  const dx = ax - cx;
  const dy = ay - cy;
  const canvas = await page.locator('canvas').first().boundingBox();
  const x = (canvas?.x ?? 0) + ox + dx * (xx - ox) + dy * (yx - ox);
  const y = (canvas?.y ?? 0) + oy + dx * (xy - oy) + dy * (yy - oy);
  await page.mouse.click(x, y);
  await expect(diag).toHaveAttribute('data-celula', alvo, { timeout: 20_000 });
  await expect(diag).toHaveAttribute('data-destino', alvo);
}
