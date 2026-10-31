// Marco 26 (28/10/2026, D-116, D-117): a seleção de classe em colunas com runa e retrato, a runa nas skills de classe
// e a câmera solta depois do arrasto, que só o toque duplo no botão de centralizar recentraliza.
import { expect, test } from '@playwright/test';

test('a seleção mostra runa e retrato de cada classe, e "Ver mais" abre a lore', async ({ page }) => {
  const erros: string[] = [];
  page.on('pageerror', (e) => erros.push(e.message));
  await page.goto('./?jogo=campanha&slot=1&diag=1');
  await expect(page.getByRole('heading', { name: 'Escolha a classe' })).toBeVisible();
  const colunas = page.locator('.classe-coluna');
  await expect(colunas).toHaveCount(5);
  await expect(page.locator('.classe-coluna svg[data-runa]')).toHaveCount(5);
  // Marco 32 (D-131): o retrato pré-renderizado (canvas) troca o desenho (img) quando carrega.
  const retratos = page.locator('.classe-coluna .retrato-classe');
  await expect(retratos).toHaveCount(5);
  await expect.poll(() => page.locator('.classe-coluna canvas.retrato-3d').count()).toBe(5);

  const guerreiro = page.locator('[data-classe="guerreiro"]');
  await expect(guerreiro.locator('.estilo-classe')).toContainText('Estilo:');
  const mais = guerreiro.locator('details.mais-classe');
  await expect(mais.locator('.detalhe-classe')).toBeHidden();
  await mais.locator('summary').click();
  await expect(mais.locator('.detalhe-classe')).toContainText('Começa com:');

  // As skills de classe levam a runa na aba Habilidades.
  await guerreiro.getByRole('link', { name: 'Jogar de Guerreiro' }).click();
  await expect(page.locator('#diag')).toHaveAttribute('data-celula', /^\d+,\d+$/);
  await page.keyboard.press('KeyI');
  const mochila = page.getByRole('dialog', { name: 'Mochila' });
  await mochila.getByRole('button', { name: 'Habilidades' }).click();
  await expect(mochila.locator('.cartao-habilidade svg[data-runa="guerreiro"]').first()).toBeVisible();
  expect(erros).toEqual([]);
});

test('arrastar solta a câmera; andar não recentraliza; o toque duplo no botão sim', async ({ page }) => {
  await page.goto('./?jogo=campanha&slot=1&diag=1&classe=mago');
  await expect(page.locator('#diag')).toHaveAttribute('data-celula', /^\d+,\d+$/);
  const botao = page.getByTestId('centralizar');
  await expect(botao).toHaveAttribute('data-solta', 'false');
  const caixa = await page.locator('canvas').first().boundingBox();
  if (!caixa) throw new Error('canvas sem caixa');
  const x = caixa.x + caixa.width / 2;
  const y = caixa.y + caixa.height / 2;
  await page.mouse.move(x, y);
  // D-115: com o mouse, a câmera arrasta pelo botão direito (o esquerdo guia o personagem).
  await page.mouse.down({ button: 'right' });
  await page.mouse.move(x + 60, y + 30, { steps: 4 });
  await page.mouse.move(x + 140, y + 60, { steps: 4 });
  await page.mouse.up({ button: 'right' });
  await expect(botao).toHaveAttribute('data-solta', 'true');

  await page.keyboard.down('KeyD');
  await page.waitForTimeout(400);
  await page.keyboard.up('KeyD');
  await expect(botao).toHaveAttribute('data-solta', 'true');

  await botao.dblclick();
  await expect(botao).toHaveAttribute('data-solta', 'false');
});
