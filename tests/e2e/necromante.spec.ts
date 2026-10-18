import { expect, test } from '@playwright/test';
import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';
import type { RegistroProgresso } from '../../src/save/esquema';

let semear = '';
test.beforeAll(async () => {
  const bundle = await build({ stdin: { resolveDir: process.cwd(), loader: 'ts', contents: `
    import { conteudoOficial } from './src/core/conteudo';
    import { criarJogador, criarInimigo } from './src/entities/fabrica';
    import { contextoDaFase, faseOficialOuGerada, estadoInicialDaFase } from './src/save/fases-campanha';
    import { gravarRegistro } from './src/plataforma/saves';
    import { VERSAO_SCHEMA } from './src/save/esquema';
    import { gravarNoBanco } from './src/plataforma/banco';
    import { PREFERENCIAS_PADRAO } from './src/plataforma/preferencias';
    (async () => {
      const conteudo = conteudoOficial(), faseRef = { tipo: 'oficial', id: 'fase-01' };
      const r = contextoDaFase(conteudo, faseOficialOuGerada(faseRef, conteudo));
      if (!r.ok) throw Error('fase inválida');
      const estado = estadoInicialDaFase(r.ctx); estado.tick = 10;
      const j = criarJogador(conteudo.classes.get('necromante'), 'j1', 5, 5, r.ctx.balance);
      const aliado = criarJogador(conteudo.classes.get('mago'), 'aliado', 6, 5, r.ctx.balance);
      const inimigo = criarInimigo(conteudo.presets.get('goblin'), 'inimigo', 7, 5, r.ctx.balance);
      j.hp -= 40; j.autoAtaque = false; aliado.equipe = j.equipe; aliado.hp = 0;
      inimigo.hp = 0; inimigo.participacao = [{ id: j.id, tick: estado.tick }];
      estado.entidades = [j, aliado, inimigo]; estado.objetos = []; estado.armadilhas = [];
      await gravarRegistro({ versaoSchema: VERSAO_SCHEMA, slot: 1, criadoEm: 1, atualizadoEm: 1, faseRef,
        nomeFase: r.ctx.fase.nome, estado, estatisticas: { mortes: 0, inimigosDerrotados: 0 }, fasesVisitadas: {}, certificado: null });
      await gravarNoBanco('perfil', { chave: 'preferencias', valor: { ...PREFERENCIAS_PADRAO, visao: 'iso', movimentoReduzido: 'sempre', mudo: true } });
      document.body.dataset.semeado = 'sim';
    })();
  ` }, bundle: true, platform: 'browser', format: 'iife', write: false });
  semear = bundle.outputFiles[0]?.text ?? '';
});

test('Necromante é selecionável ao criar um personagem', async ({ page }) => {
  await page.goto('/?jogo=campanha&slot=1');
  const cartao = page.locator('[data-classe="necromante"]');
  await expect(cartao.getByRole('heading', { name: 'Necromante', exact: true })).toBeVisible();
  await expect(cartao).toContainText('Trevas');
  await cartao.getByRole('link', { name: 'Jogar de Necromante' }).click();
  await expect(page.getByTestId('habilidade-dizimo_vital')).toBeVisible({ timeout: 30000 });
  await expect(page.getByTestId('habilidade-comando_sepulcral')).toBeVisible();
});

test('passiva, reanimado, eco e Dízimo funcionam e persistem no save', async ({ page }, info) => {
  const erros: string[] = []; page.on('pageerror', (e) => erros.push(e.message));
  await page.goto('/'); await page.addScriptTag({ content: semear });
  await expect(page.locator('body')).toHaveAttribute('data-semeado', 'sim');
  await page.goto('/?jogo=campanha&slot=1&diag=1');
  await expect(page.getByTestId('habilidade-dizimo_vital')).toBeVisible({ timeout: 30000 });
  await expect.poll(async () => Number(await page.locator('#diag').getAttribute('data-tick'))).toBeGreaterThan(100);
  await page.screenshot({ path: info.outputPath('necromante-e-mortos.png') });
  await page.getByTestId('habilidade-dizimo_vital').click();
  await page.getByRole('button', { name: /Abrir a mochila/ }).click();
  const mochila = page.getByRole('dialog', { name: 'Mochila' });
  await mochila.getByRole('button', { name: /^Habilidades/ }).click();
  await mochila.getByText('Combos da sua build', { exact: true }).click();
  await expect(mochila.getByText('Sepultura aberta', { exact: true })).toBeVisible();
  await expect(mochila.getByText('Tributo da legião', { exact: true })).toBeVisible();
  await mochila.getByRole('button', { name: 'Fechar a mochila' }).click();
  await page.getByRole('button', { name: 'Salvar e voltar aos slots' }).click();
  const download = page.waitForEvent('download');
  await page.locator('[data-slot="1"]').getByRole('button', { name: 'Exportar' }).click();
  const arquivo = await (await download).path(); if (!arquivo) throw Error('save ausente');
  const { registro } = JSON.parse(await readFile(arquivo, 'utf8')) as { registro: RegistroProgresso };
  const mortos = registro.estado.entidades.filter((e) => e.invocacao?.donoId === 'j1');
  expect(mortos.map((e) => e.invocacao?.necromancia).sort()).toEqual(['eco', 'reanimado', 'servo']);
  expect(mortos.some((e) => e.hp < e.hpMax)).toBe(true);
  expect(mortos.find((e) => e.invocacao?.necromancia === 'eco')?.invocacao?.modeloOriginal).toBe('mago');
  expect(registro.estado.entidades.find((e) => e.id === 'aliado')?.morto).toBe(false);
  await page.goto('/?jogo=campanha&slot=1');
  await expect(page.getByTestId('habilidade-dizimo_vital')).toBeVisible({ timeout: 30000 });
  expect(erros).toEqual([]);
});
