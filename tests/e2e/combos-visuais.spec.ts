// Renderiza todo o catálogo real no Pixi, inclusive com movimento reduzido.
import { test, expect } from '@playwright/test';
import { build } from 'esbuild';
import dados from '../../src/data/combos.json' with { type: 'json' };

let roteiro = '';
test.beforeAll(async () => {
  const r = await build({ stdin: { resolveDir: process.cwd(), contents: `
    import { Application, Text } from 'pixi.js';
    import { Barramento } from './src/core/events';
    import { criarEstado } from './src/core/estado';
    import { CamadaCombosTaticos, VISUAIS_COMBO } from './src/render/combos-taticos';
    import { criarProjecao } from './src/render/projecao';
    import dados from './src/data/combos.json';
    (async () => {
      const app = new Application(); await app.init({ width: 1000, height: Math.ceil(dados.combos.length / 5) * 192 + 100, background: '#13101a', antialias: true });
      document.body.append(app.canvas);
      const bus = new Barramento(); const estado = criarEstado({ semente: 1, faseId: 'visual' });
      const camada = new CamadaCombosTaticos(app.stage, () => criarProjecao('cima', 22, 30), () => document.body.dataset.reduzido === 'sim', () => document.body.dataset.simples === 'sim', dados.combos.length);
      camada.ligar(bus, () => estado, () => 0);
      dados.combos.forEach((c, i) => {
        const x = 1.5 + i % 5 * 4, y = 1.7 + Math.floor(i / 5) * 4;
        const t = new Text({ text: c.nome, style: { fill: '#eee5f8', fontSize: 12, wordWrap: true, wordWrapWidth: 180 } });
        t.x = x * 48 - 55; t.y = y * 48 + 55; app.stage.addChild(t);
        bus.emitir('comboFeito', { t: 'comboFeito', tick: 0, id: 'j', combo: c.id, alvoId: null, x, y, origemX: x - .5, origemY: y, atorX: x, atorY: y, miraX: x, miraY: y });
      });
      // A galeria mantém todos os efeitos; no jogo a fila é limitada por quadro.
      app.ticker.add(() => camada.desenhar(estado, 350));
      document.body.dataset.combos = String(VISUAIS_COMBO.size);
    })();
  `, loader: 'ts' }, bundle: true, format: 'iife', platform: 'browser', write: false });
  roteiro = r.outputFiles[0]?.text ?? '';
});

test('todos os combos têm desenhos válidos no navegador', async ({ page }, info) => {
  test.setTimeout(120000);
  const erros: string[] = []; page.on('pageerror', (e) => erros.push(e.message));
  await page.setViewportSize({ width: 1020, height: Math.ceil(dados.combos.length / 5) * 192 + 150 });
  await page.goto('/');
  await page.setContent('<html><body style="margin:0;background:#13101a"></body></html>');
  await page.addScriptTag({ content: roteiro });
  await expect(page.locator('body')).toHaveAttribute('data-combos', String(dados.combos.length));
  await expect(page.locator('canvas')).toBeVisible();
  for (const modo of ['normal', 'reduzido', 'minimo']) {
    await page.evaluate((m) => { document.body.dataset.reduzido = m === 'reduzido' ? 'sim' : 'nao'; document.body.dataset.simples = m === 'minimo' ? 'sim' : 'nao'; }, modo);
    // Captura após um quadro de desenho, sem aguardar tempo de jogo.
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => { resolve(); }))));
    const imagem = info.outputPath(`combos-${modo}.png`);
    await page.screenshot({ path: imagem, fullPage: true });
    await info.attach(`combos-${modo}`, { path: imagem, contentType: 'image/png' });
  }
  expect(erros).toEqual([]);
});
