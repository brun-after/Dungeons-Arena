import { readFile } from 'node:fs/promises';
import { expect, test, type Locator, type Page } from '@playwright/test';

async function abrir(page: Page) {
  const erros: string[] = [];
  page.on('pageerror', (e) => erros.push(e.message));
  await page.goto('./?jogo=campanha&slot=1&diag=1');
  const diag = page.locator('#diag');
  await expect(diag).toHaveAttribute('data-celula', /^\d+,\d+$/);
  return { diag, erros };
}

async function ler(diag: Locator, atributo: 'celula' | 'tela'): Promise<[number, number]> {
  const valor = (await diag.getAttribute(`data-${atributo}`)) ?? '0,0';
  const [a = 0, b = 0] = valor.split(',').map(Number);
  return [a, b];
}

/** Espera o jogador e a câmera pararem (célula e posição na tela iguais em duas leituras). */
async function esperarParado(page: Page, diag: Locator) {
  await expect
    .poll(
      async () => {
        const antes = `${await diag.getAttribute('data-celula')}|${await diag.getAttribute('data-tela')}`;
        await page.waitForTimeout(400);
        const depois = `${await diag.getAttribute('data-celula')}|${await diag.getAttribute('data-tela')}`;
        return antes === depois;
      },
      { timeout: 15_000 },
    )
    .toBe(true);
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

    // Segura D até o jogador andar (sem prazo fixo: o navegador de teste pode estar lento).
    // Checa a cada 50 ms para soltar a tecla logo depois do primeiro passo.
    await page.keyboard.down('d');
    await expect.poll(async () => (await ler(diag, 'celula'))[0], { timeout: 15_000, intervals: [50] }).toBeGreaterThan(x0);
    await page.keyboard.up('d');
    await esperarParado(page, diag);

    const [x, y] = await ler(diag, 'celula');
    const [tx, ty] = await ler(diag, 'tela');
    // Zoom inicial 1: uma célula = 48 px. Clica na célula (3,3) da sala inicial: livre (longe do
    // boneco de treino, que seleciona alvo em vez de andar) e alcançável de onde o jogador estiver.
    await page.mouse.click(tx + (3 - x) * 48, ty + (3 - y) * 48);
    await expect.poll(async () => ler(diag, 'celula'), { timeout: 15_000 }).toEqual([3, 3]);
    expect(erros).toEqual([]);
  });

  test('combate: selecionar o boneco, atacar sozinho e lançar habilidade', async ({ page }) => {
    const { diag, erros } = await abrir(page);
    // Anda até (7,8), duas células à esquerda do boneco de treino em (9,8).
    await esperarParado(page, diag);
    const [px, py] = await ler(diag, 'celula');
    const [sx, sy] = await ler(diag, 'tela');
    await page.mouse.click(sx + (7 - px) * 48, sy + (8 - py) * 48);
    await expect.poll(async () => ler(diag, 'celula'), { timeout: 20_000 }).toEqual([7, 8]);
    await esperarParado(page, diag);
    const [tx, ty] = await ler(diag, 'tela');
    await page.mouse.click(tx + 2 * 48, ty);
    await expect.poll(async () => Number(await diag.getAttribute('data-impactos')), { timeout: 15_000 }).toBeGreaterThan(0);
    await page.keyboard.press('Digit1');
    await expect(page.locator('.log-combate li').first()).toBeVisible();
    expect(erros).toEqual([]);
  });

  test('inimigos da sala B notam o jogador, perseguem e atacam', async ({ page }) => {
    const { diag, erros } = await abrir(page);
    // Vai até (16,3) e depois (19,3), perto dos goblins.
    for (const [cx, cy] of [
      [16, 3],
      [19, 3],
    ] as const) {
      await esperarParado(page, diag);
      const [px, py] = await ler(diag, 'celula');
      const [tx, ty] = await ler(diag, 'tela');
      await page.mouse.click(tx + (cx - px) * 48, ty + (cy - py) * 48);
      await expect.poll(async () => ler(diag, 'celula'), { timeout: 20_000 }).toEqual([cx, cy]);
    }
    // O registro guarda as últimas linhas: "notou você" pode já ter saído quando a luta começa.
    await expect(page.locator('.log-combate')).toContainText('Goblin', { timeout: 20_000 });
    await expect.poll(async () => Number(await diag.getAttribute('data-hp')), { timeout: 30_000 }).toBeLessThan(100);
    expect(erros).toEqual([]);
  });

  test('mochila: equipar a espada inicial muda a ficha; Esc fecha e o jogo segue', async ({ page }) => {
    const { diag, erros } = await abrir(page);
    await page.keyboard.press('KeyI');
    const mochila = page.getByRole('dialog', { name: 'Mochila' });
    await expect(mochila).toBeVisible();
    await mochila.getByRole('button', { name: 'Equipar: Espada curta' }).click();
    await expect(mochila.getByText('Arma: Espada curta')).toBeVisible();
    await expect(diag).toHaveAttribute('data-equipados', '1');
    await mochila.getByRole('button', { name: 'Ficha' }).click();
    await expect(mochila.locator('tr[data-atributo="forca"]')).toHaveAttribute('data-efetivo', '14');
    await page.keyboard.press('Escape');
    await expect(mochila).toBeHidden();
    // Com o modal fechado, o teclado volta a mover o jogador.
    const [x0] = await ler(diag, 'celula');
    await page.keyboard.down('d');
    await expect.poll(async () => (await ler(diag, 'celula'))[0], { timeout: 15_000, intervals: [50] }).not.toBe(x0);
    await page.keyboard.up('d');
    expect(erros).toEqual([]);
  });

  test('save: equipar, sair pelo Menu, continuar do slot e exportar', async ({ page }) => {
    const { diag, erros } = await abrir(page);
    await page.keyboard.press('KeyI');
    const mochila = page.getByRole('dialog', { name: 'Mochila' });
    await mochila.getByRole('button', { name: 'Equipar: Espada curta' }).click();
    await expect(diag).toHaveAttribute('data-equipados', '1');
    await page.keyboard.press('Escape');
    // "Menu" grava e volta para a tela de slots.
    await page.getByRole('button', { name: 'Salvar e voltar aos slots' }).click();
    const slot1 = page.locator('[data-slot="1"]');
    await expect(slot1).toContainText('Nível 1 · Salões da entrada');
    const download = page.waitForEvent('download');
    await slot1.getByRole('button', { name: 'Exportar' }).click();
    expect((await download).suggestedFilename()).toBe('dungeons-arena-slot1.json');
    await page.goto('./?jogo=campanha&slot=1&diag=1');
    await expect(page.locator('#diag')).toHaveAttribute('data-equipados', '1');
    expect(erros).toEqual([]);
  });

  test('pesquisa: jogar, terminar o teste, responder e enviar o relatório anônimo', async ({ page }) => {
    const erros: string[] = [];
    page.on('pageerror', (e) => erros.push(e.message));
    await page.goto('./?pesquisa=1&diag=1');
    await expect(page.locator('#diag')).toHaveAttribute('data-celula', /^\d+,\d+$/);
    await page.keyboard.press('Space');
    await page.getByRole('button', { name: 'Terminar teste' }).click();
    const dialogo = page.getByRole('dialog', { name: 'Como foi?' });
    await dialogo.getByRole('button', { name: 'Enviar relatório' }).click();
    await expect(dialogo.getByRole('alert')).toContainText('Responda');
    for (const grupo of ['Quadrado vermelho', 'Linha vermelha', 'Bolinha vermelha']) {
      await dialogo.getByRole('group', { name: new RegExp(grupo) }).getByLabel('Reconheci e tentei desviar').check();
    }
    await dialogo.getByRole('group', { name: /pegar e equipar/ }).getByLabel('Sim').check();
    await dialogo.getByRole('button', { name: 'Enviar relatório' }).click();
    await expect(dialogo.getByRole('alert')).toContainText('consentimento');
    await dialogo.getByRole('checkbox').check();
    await dialogo.getByRole('button', { name: 'Enviar relatório' }).click();
    await expect(dialogo.getByRole('status')).toHaveText('Relatório enviado. Muito obrigado pela ajuda!');
    expect(erros).toEqual([]);
  });

  test('orbe de efeito: pisar no orbe da sala inicial mostra o efeito no HUD', async ({ page }) => {
    const { diag, erros } = await abrir(page);
    await esperarParado(page, diag);
    const [px, py] = await ler(diag, 'celula');
    const [tx, ty] = await ler(diag, 'tela');
    // Orbe de "Fúria" (bonus_dano) em (3,8) na fase 1.
    await page.mouse.click(tx + (3 - px) * 48, ty + (8 - py) * 48);
    await expect(page.locator('.chip-efeito[data-efeito="bonus_dano"]')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('.log-combate')).toContainText('Orbe de efeito');
    expect(erros).toEqual([]);
  });

  // Marco 9A: loja e baú da sala inicial da fase 1.
  async function irPara(page: Page, diag: Locator, x: number, y: number) {
    await esperarParado(page, diag);
    const [px, py] = await ler(diag, 'celula');
    const [tx, ty] = await ler(diag, 'tela');
    await page.mouse.click(tx + (x - px) * 48, ty + (y - py) * 48);
    await expect.poll(async () => ler(diag, 'celula'), { timeout: 15_000 }).toEqual([x, y]);
  }

  test('loja: comprar uma poção desconta o ouro; fechar arma a recarga; a tecla 5 usa a poção', async ({ page }) => {
    const { diag, erros } = await abrir(page);
    // Loja em (8,3); (7,3) fica ao lado.
    await irPara(page, diag, 7, 3);
    await page.keyboard.press('KeyE');
    const loja = page.getByRole('dialog', { name: 'Loja' });
    await expect(loja).toBeVisible();
    await expect(loja.locator('.saldo-loja')).toHaveAttribute('data-ouro', '15');
    await loja.getByRole('button', { name: 'Comprar (10): Poção de vida' }).click();
    await expect(loja.locator('.saldo-loja')).toHaveAttribute('data-ouro', '5');
    await expect(loja.getByRole('button', { name: 'Comprar (10): Poção de vida' })).toBeDisabled();
    await loja.getByRole('button', { name: 'Fechar a loja' }).click();
    await expect(loja).toBeHidden();
    const log = page.locator('.log-combate');
    await expect(log).toContainText('Comprou Poção de vida por 10 de ouro');
    await page.keyboard.press('KeyE');
    await expect(log).toContainText('A loja ainda não atende você de novo');
    // Vida cheia: a poção do atalho 5 é recusada sem gastar (prova que a tecla chegou ao item).
    await page.keyboard.press('Digit5');
    await expect(log).toContainText('Não teria efeito agora');
    expect(erros).toEqual([]);
  });

  test('baú: abrir o baú da sala inicial congela, entrega itens e ouro', async ({ page }) => {
    const { diag, erros } = await abrir(page);
    // Baú em (11,2); (10,2) fica ao lado.
    await irPara(page, diag, 10, 2);
    await page.keyboard.press('KeyE');
    const log = page.locator('.log-combate');
    await expect(log).toContainText('Abrindo o baú');
    await expect(log).toContainText('Baú: Poção de vida, Poção de mana, +25 de ouro', { timeout: 10_000 });
    await page.keyboard.press('KeyI');
    const mochila = page.getByRole('dialog', { name: 'Mochila' });
    await expect(mochila.locator('.saldo-loja')).toHaveAttribute('data-ouro', '40');
    await expect(mochila.getByText('Poção de mana')).toBeVisible();
    expect(erros).toEqual([]);
  });

  test('invocação: o boss chama lacaios (fase montada no editor)', async ({ page }) => {
    test.setTimeout(150_000);
    const erros: string[] = [];
    page.on('pageerror', (e) => erros.push(e.message));
    await page.goto('./?editor');
    await page.getByRole('button', { name: 'Criar e editar' }).click();
    await expect(page.locator('.status-editor')).toHaveText('⚠ 1 aviso(s)');
    const caixa = await page.locator('.editor canvas').boundingBox();
    if (!caixa) throw new Error('canvas sem caixa');
    // Mesmo enquadramento do "ajustar" do editor: fase 24×16 centrada, célula de 48 px × zoom.
    const zoom = Math.min(caixa.width / (24 * 48), (caixa.height - 120) / (16 * 48)) * 0.95;
    const tela = (x: number, y: number) => ({
      x: caixa.x + caixa.width / 2 + ((x + 0.5) * 48 - 12 * 48) * zoom,
      y: caixa.y + caixa.height / 2 + ((y + 0.5) * 48 - 8 * 48) * zoom,
    });
    await page.getByRole('button', { name: 'Início do jogador' }).click();
    await page.mouse.click(tela(9, 8).x, tela(9, 8).y);
    await page.getByRole('button', { name: 'Inimigo', exact: true }).click();
    await page.getByLabel('Tipo de inimigo').selectOption('boss');
    await page.mouse.click(tela(13, 8).x, tela(13, 8).y);
    await expect(page.locator('.status-editor')).toHaveText('✓ pronta');
    await page.getByRole('button', { name: 'Testar' }).click();
    await expect(page).toHaveURL(/jogo=teste/);
    await page.goto(`${page.url()}&diag=1`);
    const diag = page.locator('#diag');
    // Você + o boss + 2 lacaios.
    await expect
      .poll(async () => Number(/entidades (\d+)/.exec((await diag.textContent()) ?? '')?.[1] ?? 0), { timeout: 90_000 })
      .toBeGreaterThanOrEqual(4);
    await expect(page.locator('.log-combate')).toContainText('invocou');
    expect(erros).toEqual([]);
  });

  // Marco 10A-1: porta de saída e troca de fase.
  test('saída: numa fase do editor, pisar na saída conclui a fase e volta ao editor', async ({ page }) => {
    const erros: string[] = [];
    page.on('pageerror', (e) => erros.push(e.message));
    await page.goto('./?editor');
    await page.getByRole('button', { name: 'Criar e editar' }).click();
    const caixa = await page.locator('.editor canvas').boundingBox();
    if (!caixa) throw new Error('canvas sem caixa');
    const zoom = Math.min(caixa.width / (24 * 48), (caixa.height - 120) / (16 * 48)) * 0.95;
    const tela = (x: number, y: number) => ({
      x: caixa.x + caixa.width / 2 + ((x + 0.5) * 48 - 12 * 48) * zoom,
      y: caixa.y + caixa.height / 2 + ((y + 0.5) * 48 - 8 * 48) * zoom,
    });
    await page.getByRole('button', { name: 'Início do jogador' }).click();
    await page.mouse.click(tela(9, 8).x, tela(9, 8).y);
    await page.getByRole('button', { name: 'Saída', exact: true }).click();
    await page.mouse.click(tela(11, 8).x, tela(11, 8).y);
    await page.getByRole('button', { name: 'Testar' }).click();
    await expect(page).toHaveURL(/jogo=teste/);
    await page.goto(`${page.url()}&diag=1`);
    await expect(page.locator('#diag')).toHaveAttribute('data-celula', '9,8');
    await page.keyboard.down('d');
    await expect(page.getByText('Fase concluída! Voltando ao editor…')).toBeVisible({ timeout: 20_000 });
    await page.keyboard.up('d');
    await expect(page).toHaveURL(/editor=/, { timeout: 10_000 });
    expect(erros).toEqual([]);
  });

  test('campanha: com o boss derrotado, a saída da fase 1 leva às Catacumbas', async ({ page }) => {
    test.setTimeout(150_000);
    const { erros } = await abrir(page);
    await page.getByRole('button', { name: 'Salvar e voltar aos slots' }).click();
    const slot1 = page.locator('[data-slot="1"]');
    await expect(slot1).toContainText('Salões da entrada');
    const download = page.waitForEvent('download');
    await slot1.getByRole('button', { name: 'Exportar' }).click();
    const caminho = await (await download).path();
    // Save preparado: boss fora do mundo, saída aberta e o jogador ao lado do S (36,24).
    type Ent = { bolsa: unknown; preset: string; x: number; y: number };
    const arquivo = JSON.parse(await readFile(caminho, 'utf8')) as { registro: { estado: { saidaAberta: boolean; entidades: Ent[] } } };
    const estado = arquivo.registro.estado;
    estado.saidaAberta = true;
    estado.entidades = estado.entidades.filter((e) => e.bolsa || e.preset !== 'boss');
    const j = estado.entidades.find((e) => e.bolsa);
    Object.assign(j ?? {}, { x: 35, y: 24, destinoX: 35, destinoY: 24, origemX: 35, origemY: 24 });
    await page.locator('[data-slot="2"] input[type=file]').setInputFiles({ name: 'save.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(arquivo)) });
    await expect(page.locator('[data-slot="2"]')).toContainText('Salões da entrada');
    await page.goto('./?jogo=campanha&slot=2&diag=1');
    await expect(page.locator('#diag')).toHaveAttribute('data-celula', '35,24');
    await page.keyboard.down('d');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Catacumbas', { timeout: 30_000 });
    await page.keyboard.up('d');
    await expect(page.locator('#diag')).toHaveAttribute('data-celula', '4,4');
    expect(erros).toEqual([]);
  });

  test('controles de toque ficam escondidos no desktop', async ({ page }) => {
    await abrir(page);
    await expect(page.getByTestId('joystick')).toBeHidden();
  });
});

test.describe('arena em loopback', () => {
  test.skip(({ isMobile }) => isMobile, 'só desktop');

  test('abre, o jogador anda com predição, o bot entra e o indicador de rede aparece', async ({ page }) => {
    const erros: string[] = [];
    page.on('pageerror', (e) => erros.push(e.message));
    await page.goto('./?arena=loopback&latencia=40&jitter=10&diag=1');
    const diag = page.locator('#diag');
    await expect(diag).toHaveAttribute('data-rtt', /^\d+$/, { timeout: 20_000 });
    // Você + o bot + os NPCs da arena.
    await expect.poll(async () => Number(/entidades (\d+)/.exec((await diag.textContent()) ?? '')?.[1] ?? 0), { timeout: 20_000 }).toBeGreaterThanOrEqual(2);
    const [x0] = await ler(diag, 'celula');
    await page.keyboard.down('d');
    await expect.poll(async () => (await ler(diag, 'celula'))[0], { timeout: 15_000 }).not.toBe(x0);
    await page.keyboard.up('d');
    await expect(page.locator('.chip-rede')).toBeVisible();
    expect(erros).toEqual([]);
  });
});

test.describe('menu e arena online', () => {
  test.skip(({ isMobile }) => isMobile, 'só desktop');

  test('o menu leva à campanha, à arena online e ao treino', async ({ page }) => {
    await page.goto('./');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Dungeons Arena');
    for (const nome of ['Campanha', 'Arena online', 'Treino de arena (contra um bot)', 'Editor de fases']) {
      await expect(page.getByRole('link', { name: nome })).toBeVisible();
    }
  });

  test('dois jogadores: um cria a sala, o outro entra pelo código e os dois se veem', async ({ browser }) => {
    // Dois navegadores com WebGL por software: mais lento que os outros testes.
    test.setTimeout(240_000);
    const erros: string[] = [];
    const criador = await browser.newPage();
    const convidado = await browser.newPage();
    for (const p of [criador, convidado]) p.on('pageerror', (e) => erros.push(e.message));

    await criador.goto('./?arena=online&diag=1');
    await expect(criador.locator('.status-servidor')).toContainText('ping', { timeout: 15_000 });
    await criador.getByRole('button', { name: 'Criar sala' }).click();
    const aviso = criador.locator('.aviso').filter({ hasText: 'Código da sala' });
    await expect(aviso).toBeVisible({ timeout: 15_000 });
    const codigo = /([A-Z0-9]{6})/.exec((await aviso.textContent()) ?? '')?.[1];
    expect(codigo).toBeTruthy();

    await convidado.goto('./?arena=online&diag=1');
    await convidado.getByLabel('Código da sala').fill(codigo ?? '');
    await convidado.getByRole('button', { name: 'Entrar' }).click();

    // Os dois jogadores + NPCs da arena aparecem nos dois navegadores.
    for (const p of [criador, convidado]) {
      await expect(p.locator('#diag')).toHaveAttribute('data-rtt', /^\d+$/, { timeout: 20_000 });
      await expect
        .poll(async () => Number(/entidades (\d+)/.exec((await p.locator('#diag').textContent()) ?? '')?.[1] ?? 0), { timeout: 20_000 })
        .toBeGreaterThanOrEqual(5);
    }
    // O criador sai: o convidado continua na sala.
    await criador.close();
    const tickAntes = Number(await convidado.locator('#diag').getAttribute('data-tick'));
    await expect.poll(async () => Number(await convidado.locator('#diag').getAttribute('data-tick')), { timeout: 10_000 }).toBeGreaterThan(tickAntes + 30);
    expect(erros).toEqual([]);
    await convidado.close();
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
    await expect.poll(async () => (await ler(diag, 'celula'))[0], { timeout: 15_000 }).toBeGreaterThan(x0);
    await page.mouse.up();
    expect(erros).toEqual([]);
  });

  test('dois dedos: segurar o joystick e usar habilidade ao mesmo tempo', async ({ page }) => {
    const { diag, erros } = await abrir(page);
    const [x0] = await ler(diag, 'celula');
    const j = await centro(page.getByTestId('joystick'));
    const h = await centro(page.getByTestId('habilidade-curar'));
    const cdp = await page.context().newCDPSession(page);
    const dedo1 = { x: j.x + 45, y: j.y, id: 1 };

    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: j.x, y: j.y, id: 1 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [dedo1] });
    await page.waitForTimeout(300);
    // Segundo dedo na roda de habilidades enquanto o primeiro continua no joystick.
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [dedo1, { x: h.x, y: h.y, id: 2 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [dedo1] });

    // Com o primeiro dedo ainda no joystick: a cura gera um impacto (no próprio jogador) e o
    // movimento continua depois da conjuração.
    await expect(diag).not.toHaveAttribute('data-impactos', '0', { timeout: 15_000 });
    await expect.poll(async () => (await ler(diag, 'celula'))[0], { timeout: 15_000 }).toBeGreaterThan(x0);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    expect(erros).toEqual([]);
  });

  test('mochila no toque: tocar a linha equipa e fecha', async ({ page }) => {
    const { diag, erros } = await abrir(page);
    await page.getByRole('button', { name: /Abrir a mochila/ }).click();
    const mochila = page.getByRole('dialog', { name: 'Mochila' });
    await mochila.getByRole('button', { name: 'Equipar: Espada curta' }).click();
    await expect(mochila).toBeHidden();
    await expect(diag).toHaveAttribute('data-equipados', '1');
    expect(erros).toEqual([]);
  });

  test('editor: criar fase, pintar, pôr inimigo, testar e voltar ao editor', async ({ page }) => {
    const erros: string[] = [];
    page.on('pageerror', (e) => erros.push(e.message));
    await page.goto('./?editor');
    await page.getByLabel('Nome da fase').fill('Fase do teste');
    await page.getByRole('button', { name: 'Criar e editar' }).click();
    const status = page.locator('.status-editor');
    await expect(status).toHaveText('⚠ 1 aviso(s)');
    const canvas = page.locator('.editor canvas');
    const caixa = await canvas.boundingBox();
    if (!caixa) throw new Error('canvas sem caixa');
    const cx = caixa.x + caixa.width / 2;
    const cy = caixa.y + caixa.height / 2;
    // Parede (ferramenta inicial): um traço arrastando o dedo.
    await page.mouse.move(cx - 60, cy - 40);
    await page.mouse.down();
    await page.mouse.move(cx + 60, cy - 40, { steps: 8 });
    await page.mouse.up();
    await expect(page.getByRole('button', { name: 'Desfazer' })).toBeEnabled();
    await page.getByRole('button', { name: 'Inimigo', exact: true }).click();
    await page.mouse.click(cx, cy + 40);
    await expect(status).toHaveText('✓ pronta');
    // Marco 8A: orbe de efeito, escolhido na lista que vem do registro.
    await page.getByRole('button', { name: 'Orbe', exact: true }).click();
    await page.getByLabel('Tipo de orbe').selectOption('efeito:cura_periodica');
    await page.mouse.click(cx + 60, cy + 40);
    await expect(status).toHaveText('✓ pronta');
    await page.getByRole('button', { name: 'Testar' }).click();
    await expect(page).toHaveURL(/jogo=teste/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Fase do teste');
    await page.getByRole('link', { name: 'Voltar ao editor' }).click();
    await expect(page.locator('.nome-editor')).toHaveValue('Fase do teste');
    await expect(status).toHaveText('✓ pronta');
    expect(erros).toEqual([]);
  });

  test('a roda de habilidades cabe na tela e não cobre o joystick', async ({ page }) => {
    await abrir(page);
    const viewport = page.viewportSize();
    const joystick = await page.getByTestId('joystick').boundingBox();
    for (const id of ['seta_arcana', 'explosao', 'curar', 'golpe_atordoante']) {
      const caixa = await page.getByTestId(`habilidade-${id}`).boundingBox();
      expect(caixa, id).not.toBeNull();
      if (!caixa || !viewport || !joystick) continue;
      expect(caixa.x).toBeGreaterThanOrEqual(0);
      expect(caixa.x + caixa.width).toBeLessThanOrEqual(viewport.width);
      expect(caixa.x).toBeGreaterThan(joystick.x + joystick.width);
    }
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
