// 17/10/2026: visual nativo e ida/volta reais, com dados gravados pelo mesmo código do jogo.
import { expect, test } from '@playwright/test';
import { build } from 'esbuild';
import { pararNaPorta } from './porta';

let semear = '';
let galeria = '';
test.beforeAll(async () => {
  const s = await build({ stdin: { resolveDir: process.cwd(), loader: 'ts', contents: `
    import { conteudoOficial } from './src/core/conteudo';
    import { criarJogador } from './src/entities/fabrica';
    import { contextoDaFase, faseOficialOuGerada, estadoInicialDaFase } from './src/save/fases-campanha';
    import { gravarRegistro } from './src/plataforma/saves';
    import { VERSAO_SCHEMA } from './src/save/esquema';
    import { gravarNoBanco } from './src/plataforma/banco';
    import { PREFERENCIAS_PADRAO } from './src/plataforma/preferencias';
    (async () => {
      const conteudo = conteudoOficial();
      const faseRef = { tipo: 'oficial', id: 'fase-02' };
      const r = contextoDaFase(conteudo, faseOficialOuGerada(faseRef, conteudo));
      const a = contextoDaFase(conteudo, faseOficialOuGerada({ tipo: 'oficial', id: 'fase-01' }, conteudo));
      if (!r.ok || !a.ok) throw Error('fase inválida');
      const estado = estadoInicialDaFase(r.ctx), anterior = estadoInicialDaFase(a.ctx);
      // A primeira fase já foi concluída: a revisita deve manter a saída aberta e o baú consumido.
      anterior.saidaAberta = true; anterior.entidades = []; anterior.objetos = [];
      const classe = conteudo.classes.get('aventureiro');
      // Marco 24 (D-099): já em cima da porta azul (o retorno pede 3 s parado nela).
      estado.entidades.unshift(criarJogador(classe, 'j1', 4, 4, r.ctx.balance));
      await gravarRegistro({ versaoSchema: VERSAO_SCHEMA, slot: 1, criadoEm: 1, atualizadoEm: 1, faseRef,
        nomeFase: r.ctx.fase.nome, estado, estatisticas: { mortes: 0, inimigosDerrotados: 1 },
        fasesVisitadas: { 'oficial:fase-01': anterior }, certificado: null });
      await gravarNoBanco('perfil', { chave: 'preferencias', valor: { ...PREFERENCIAS_PADRAO, visao: 'cima', movimentoReduzido: 'sempre', mudo: true } });
      document.body.dataset.semeado = 'sim';
    })();
  ` }, bundle: true, platform: 'browser', format: 'iife', write: false });
  semear = s.outputFiles[0]?.text ?? '';
  const g = await build({ stdin: { resolveDir: process.cwd(), loader: 'ts', contents: `
    import { Application, Container, Text } from 'pixi.js';
    import { criarTerreno } from './src/render/terreno';
    import { CamadaFluxo } from './src/render/fluxo';
    import { carregarFase } from './src/world/fase';
    import { criarEstado } from './src/core/estado';
    (async () => {
      const app = new Application(); await app.init({ width: 1152, height: 720, background: '#15131b', antialias: true });
      document.body.append(app.canvas);
      const fase = carregarFase({ id: 'visual', nome: 'Terreno', ordem: 1, tipo: 'campanha',
        mapa: Array.from({ length: 14 }, (_, y) => y < 2 || y > 11 ? '#'.repeat(24) : '##' + '.'.repeat(20) + '##'),
        spawns: [], ambientes: [{ tipo: 'agua', x: 6, y: 5, raio: 1 }, { tipo: 'brasas', x: 12, y: 5, raio: 1 }, { tipo: 'miasma', x: 18, y: 5, raio: 1 }] });
      criarTerreno(app.stage, fase);
      const estado = criarEstado({ semente: 1, faseId: 'visual' }); estado.tick = 10;
      estado.armadilhas = [{ id: 1, donoId: 'j', equipeDono: 'j', x: 6, y: 9, valor: 30, interno: null, ateTick: 0,
        origem: 'fase', permanente: true, rearmeTicks: 270, inerteAteTick: 0, reveladaPara: [] },
        { id: 2, donoId: 'fase', equipeDono: 'fase', x: 12, y: 9, valor: 30, interno: null, ateTick: 0,
        origem: 'fase', permanente: true, rearmeTicks: 270, inerteAteTick: 0, reveladaPara: ['j'] }];
      const fluxo = new CamadaFluxo(app.stage); fluxo.disparou(18, 9, 0); fluxo.desenhar(estado, 'j', true);
      for (const [texto, x, y] of [['Água', 6, 6.8], ['Brasas', 12, 6.8], ['Miasma', 18, 6.8], ['Convertida', 6, 10.8], ['Revelada', 12, 10.8], ['Disparo', 18, 10.8]]) {
        const t = new Text({ text: texto, style: { fill: '#e2dce6', fontSize: 16 } }); t.anchor.set(.5); t.position.set((x + .5) * 48, y * 48); app.stage.addChild(t);
      }
      app.render(); document.body.dataset.galeria = 'sim';
    })();
  ` }, bundle: true, platform: 'browser', format: 'iife', write: false });
  galeria = g.outputFiles[0]?.text ?? '';
});

test('porta azul retorna e a saída reabre a fase seguinte, sem perder o mundo visitado', async ({ page }, info) => {
  const erros: string[] = []; page.on('pageerror', (e) => erros.push(e.message));
  await page.goto('/');
  await page.addScriptTag({ content: semear });
  await expect(page.locator('body')).toHaveAttribute('data-semeado', 'sim');
  await page.goto('/?jogo=campanha&slot=1&diag=1');
  await expect(page.locator('#diag')).toHaveAttribute('data-celula', '4,4', { timeout: 30000 });
  // Marco 24 (D-099): a porta só leva depois de 3 s parado nela; antes, a contagem no prompt.
  await expect(page.locator('.prompt-interacao')).toContainText('Fique parado na porta');
  await page.screenshot({ path: info.outputPath('porta-retorno.png') });
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Salões da entrada', { timeout: 30000 });
  await expect(page.locator('#diag')).toHaveAttribute('data-celula', '36,25');
  await pararNaPorta(page, 'w', '36,24');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Catacumbas', { timeout: 30000 });
  expect(erros).toEqual([]);
});

test('terreno contínuo, áreas elementais e disparos são desenhados sem partículas', async ({ page }, info) => {
  const erros: string[] = []; page.on('pageerror', (e) => erros.push(e.message));
  await page.setViewportSize({ width: 1152, height: 720 });
  await page.goto('/');
  await page.setContent('<html><body style="margin:0;background:#15131b"></body></html>');
  await page.addScriptTag({ content: galeria });
  await expect(page.locator('body')).toHaveAttribute('data-galeria', 'sim');
  await expect(page.locator('canvas')).toBeVisible();
  await page.screenshot({ path: info.outputPath('fases-vivas.png') });
  expect(erros).toEqual([]);
});
