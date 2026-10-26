// Marco 15 (15/10/2026, D-061): campanha cooperativa em dois navegadores — o anfitrião cria o grupo pelo slot, o
// convidado entra pelo código; os dois se veem no painel do grupo e o convidado vê a própria mochila e habilidades.
// Usa o servidor local (webServer `npm run servidor` do playwright.config.ts).

import { expect, test, type Page } from '@playwright/test';

async function personagemNoSlot(page: Page, classe: string): Promise<void> {
  await page.goto(`./?jogo=campanha&slot=1&diag=1&classe=${classe}`);
  await expect(page.locator('#diag')).toHaveAttribute('data-celula', /^\d+,\d+$/);
  await page.getByRole('button', { name: 'Salvar e voltar aos slots' }).click();
  await expect(page.locator('[data-slot="1"]')).toContainText('nível 1');
}

test.describe('campanha em grupo', () => {
  test.skip(({ isMobile }) => isMobile, 'só desktop');

  test('o anfitrião cria, o convidado entra pelo código; os dois se veem e cada um tem a sua mochila', async ({ browser }) => {
    const erros: string[] = [];
    const contextoAnfitriao = await browser.newContext();
    const contextoConvidado = await browser.newContext();
    try {
      const anfitriao = await contextoAnfitriao.newPage();
      const convidado = await contextoConvidado.newPage();
      for (const p of [anfitriao, convidado]) p.on('pageerror', (e) => erros.push(e.message));
      await personagemNoSlot(anfitriao, 'guerreiro');
      await personagemNoSlot(convidado, 'mago');

      await anfitriao.locator('[data-slot="1"]').getByRole('link', { name: 'Criar um grupo com o personagem do slot 1' }).click();
      const titulo = anfitriao.locator('.painel-grupo h2');
      await expect(titulo).toHaveText(/^Grupo [A-Z0-9]{6}$/, { timeout: 20_000 });
      const codigo = ((await titulo.textContent()) ?? '').replace('Grupo ', '');

      await convidado.locator('[data-slot="1"]').getByLabel('Código do grupo para o personagem do slot 1').fill(codigo.toLowerCase());
      await convidado.locator('[data-slot="1"]').getByRole('button', { name: 'Entrar no grupo' }).click();
      await expect(convidado.locator('.painel-grupo h2')).toHaveText(`Grupo ${codigo}`, { timeout: 20_000 });

      // Os dois aparecem nos dois painéis; o anfitrião vem marcado.
      for (const p of [anfitriao, convidado]) {
        await expect(p.locator('.painel-grupo .membro-grupo')).toHaveCount(2, { timeout: 15_000 });
        await expect(p.locator('.painel-grupo')).toContainText('anfitrião');
        await expect(p.locator('.painel-grupo [role="meter"]')).toHaveCount(0);
        const mapa = await p.locator('.minimapa').boundingBox();
        const painel = await p.locator('.painel-grupo').boundingBox();
        expect(mapa).not.toBeNull();
        expect(painel).not.toBeNull();
        if (mapa && painel) expect(painel.y).toBeGreaterThanOrEqual(mapa.y + mapa.height);
      }

      // A mochila do convidado é a dele (mago: as habilidades da classe).
      await convidado.keyboard.press('KeyI');
      const mochila = convidado.getByRole('dialog', { name: 'Mochila' });
      await expect(mochila).toBeVisible();
      await mochila.getByRole('button', { name: 'Habilidades' }).click();
      await expect(mochila.locator('[data-habilidade="bola_de_fogo"]')).toBeVisible();
      await convidado.keyboard.press('Escape');

      // Só o anfitrião troca a dificuldade (online, o menu não pausa a partida).
      await convidado.getByRole('button', { name: 'Menu (Esc)' }).click();
      const pausa = convidado.getByRole('dialog', { name: 'Menu (a partida continua)' });
      // Marco 26: o seletor do convidado fica desabilitado, com a nota fixa (o aviso passageiro era substituído).
      await expect(pausa.getByLabel('Dificuldade')).toBeDisabled();
      await expect(pausa.getByText('Só quem criou o grupo troca a dificuldade.')).toBeVisible();
      expect(erros).toEqual([]);
    } finally {
      await Promise.all([contextoAnfitriao.close(), contextoConvidado.close()]);
    }
  });
});
