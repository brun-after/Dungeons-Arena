import { criarEstado } from '../../src/core/estado';
import { criarEntidade } from '../../src/entities/entidade';
import { expect, test } from '@playwright/test';
test('painel social começa recolhido e recebe cliques e toques sem atingir o mundo', async ({ page, isMobile }) => {
    await page.goto('./?jogo=mundo');
    await page.locator('#mundo-nome-1').fill('ChatInteracao');
    await page.locator('#mundo-nome-1').locator('..').getByRole('button', { name: 'Começar' }).click();
    const social = page.locator('.painel-social');
    const alternar = social.locator(':scope > button');
    await expect(alternar).toHaveAttribute('aria-expanded', 'false', { timeout: 30000 });
    await expect(social.locator('.form-chat')).toBeHidden();
    // Registra os eventos no canvas real: nem o fundo, nem os controles devem atravessar o painel.
    await page.evaluate(() => {
        document.querySelectorAll('canvas').forEach(canvas => {
            canvas.addEventListener('pointerdown', () => { document.body.dataset.cliquesNoMundo = '1'; });
        });
    });
    const ativar = async (alvo: import('@playwright/test').Locator) => {
        if (isMobile) await alvo.tap();
        else await alvo.click();
    };
    await ativar(alternar);
    await expect(alternar).toHaveAttribute('aria-expanded', 'true');
    const codigo = social.getByRole('textbox', { name: 'Código da party', exact: true });
    await ativar(codigo);
    await expect(codigo).toBeFocused();
    await page.keyboard.type('AB12CD34EF56');
    await expect(codigo).toHaveValue('AB12CD34EF56');
    const mensagem = social.locator('.form-chat input');
    await ativar(mensagem);
    await expect(mensagem).toBeFocused();
    await page.keyboard.type('teste de chat');
    await expect(mensagem).toHaveValue('teste de chat');
    await ativar(social.locator('.form-chat select'));
    await page.keyboard.press('Escape');
    await ativar(social.locator('.grupo-mundo .subtitulo-modal'));
    await expect(page.locator('body')).not.toHaveAttribute('data-cliques-no-mundo', '1');
    await ativar(alternar);
    await expect(alternar).toHaveAttribute('aria-expanded', 'false');
});

test('dois clientes entram por código e preservam mapas e configurações pessoais', async ({ browser }, testInfo) => {
    test.setTimeout(180000);
    const a = await browser.newContext(), b = await browser.newContext();
    try {
        const p = await a.newPage(), q = await b.newPage();
        for (const [pagina, nome] of [[p, 'AnaParty'], [q, 'BiaParty']] as const) {
            await pagina.goto('./?jogo=mundo');
            await pagina.locator('#mundo-nome-1').fill(nome);
            await pagina.locator('#mundo-nome-1').locator('..').getByRole('button', { name: 'Começar' }).click();
            await expect(pagina.locator('.minimapa')).toBeVisible({ timeout: 30000 });
            // O painel começa recolhido em qualquer dispositivo; abra-o como o jogador faria.
            const social = pagina.locator('.painel-social');
            if (await social.getAttribute('data-fechado') === '1')
                await social.locator(':scope > button').click();
        }
        await p.getByRole('button', { name: 'Criar party por código' }).click();
        await expect(p.locator('.grupo-mundo')).toContainText('Código da party:');
        const codigo = (await p.locator('.grupo-mundo').innerText()).match(/Código da party: ([A-Z0-9]{12})/)?.[1];
        if (!codigo)
            throw new Error('código ausente');
        await q.getByRole('textbox', { name: 'Código da party', exact: true }).fill(codigo);
        await q.getByRole('button', { name: 'Entrar na party', exact: true }).click();
        await expect(p.locator('.grupo-mundo')).toContainText('BiaParty');
        await expect(q.locator('.grupo-mundo')).toContainText('AnaParty');
        for (const pagina of [p, q])
            await pagina.locator('.painel-social > button[aria-expanded="true"]').click();
        await p.keyboard.press('Escape');
        await p.getByRole('button', { name: 'Configurações', exact: true }).click();
        await p.locator('[data-config="visaoParty"]').check();
        await p.keyboard.press('Escape');
        await p.keyboard.press('Escape');
        await expect(p.locator('.camera-party:visible')).toHaveCount(1);
        await expect(q.locator('.camera-party:visible')).toHaveCount(0);
        await q.locator('.minimapa').click();
        await expect(q.locator('.mapa-expandido')).toBeVisible();
        await expect(p.locator('.mapa-expandido')).toHaveCount(0);
        await q.keyboard.press('Escape');
        await q.keyboard.down('d');
        try {
            await expect(p.locator('.camera-party:visible')).toHaveCount(2, { timeout: 25000 });
        }
        finally {
            await q.keyboard.up('d');
        }
        await p.screenshot({ path: testInfo.outputPath('party-duas-cameras.png') });
        await q.keyboard.down('a');
        try {
            await expect(p.locator('.camera-party:visible')).toHaveCount(1, { timeout: 25000 });
        }
        finally {
            await q.keyboard.up('a');
        }
    }
    finally {
        await a.close();
        await b.close();
    }
});
test('observador de outra região mostra a câmera sem menus ou conexão de jogador', async ({ page }) => {
    const estado = criarEstado({ semente: 1, faseId: 'teste' });
    const jogador = criarEntidade({ id: 'remoto', tipo: 'jogador', x: 90, y: 90 });
    jogador.grupo = 'party';
    estado.entidades.push(jogador);
    await page.goto('./?party-observador=1');
    await expect(page.locator('body')).toHaveAttribute('data-party-observador','pronto');
    await page.evaluate(v => { window.postMessage({ ...v, tipo: 'camera-party' }, location.origin); }, { lugar: 'regiao:campos_do_oeste', idLocal: 'remoto', estado });
    await expect(page.locator('.camera-party:visible')).toHaveCount(1, { timeout: 30000 });
    await expect(page.locator('.camada-ui')).toBeHidden();
    await expect(page.locator('.rotulo-party-remoto')).toHaveText('remoto');
    estado.entidades = Array.from({length:6},(_,i)=>{const e=criarEntidade({id:i===0?'remoto':`remoto${i}`,tipo:'jogador',x:20+i*30,y:90});e.grupo='party';return e;});
    await page.evaluate(v=> { window.postMessage({...v,tipo:'camera-party'},location.origin); },{lugar:'regiao:campos_do_oeste',idLocal:'remoto',estado});
    await expect(page.locator('.camera-party:visible')).toHaveCount(6,{timeout:15000});
    for(const e of estado.entidades){e.x=90;e.y=90;e.px=90;e.py=90;}
    await page.evaluate(v=> { window.postMessage({...v,tipo:'camera-party'},location.origin); },{lugar:'regiao:campos_do_oeste',idLocal:'remoto',estado});
    await expect(page.locator('.camera-party:visible')).toHaveCount(1,{timeout:15000});
});
