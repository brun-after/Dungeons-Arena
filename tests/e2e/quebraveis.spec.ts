// Marco 26 (26/10/2026, D-113): os quebráveis desenhados pelo estado nas duas projeções; ao quebrar, o desenho sai e o
// saque aparece no lugar. A simulação (quem quebra, o saque) fica nos testes de unidade.

import { expect, test } from '@playwright/test';
import { build } from 'esbuild';

test('quebráveis em pé no isométrico, no chão de cima, e somem ao quebrar', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Galeria do renderizador nas duas projeções');
  const erros: string[] = [];
  page.on('pageerror', (e) => erros.push(e.message));
  const script = await build({ stdin: { resolveDir: process.cwd(), loader: 'ts', contents: `
    import { Application, Container, Matrix, Text } from 'pixi.js';
    import { conteudoOficial, modoPorId } from './src/core/conteudo';
    import { BALANCE_PADRAO } from './src/core/contexto';
    import { criarEstado } from './src/core/estado';
    import { quebrarEm } from './src/combat/quebraveis';
    import { criarJogador } from './src/entities/fabrica';
    import { CamadaObjetos } from './src/render/objetos';
    import { criarProjecao } from './src/render/projecao';
    import { criarTerreno } from './src/render/terreno';
    import { carregarFase } from './src/world/fase';
    import { novoObjeto } from './src/world/objetos';
    (async () => {
      document.body.replaceChildren(); document.body.style.cssText = 'margin:0;background:#14121a';
      const conteudo = conteudoOficial();
      const app = new Application(); await app.init({ width: 1000, height: 850, background: '#14121a', antialias: true, autoStart: false });
      document.body.append(app.canvas);
      const fase = carregarFase({ id: 'visual', nome: 'Quebráveis', ordem: 1, tipo: 'campanha',
        mapa: Array.from({ length: 7 }, () => '.'.repeat(16)), spawns: [] });
      const ctx = { fase, balance: BALANCE_PADRAO, conteudo, modo: modoPorId(conteudo, 'campanha') };
      const formas = BALANCE_PADRAO.quebraveis.tipos;
      const estado = criarEstado({ semente: 1, faseId: 'visual' });
      estado.objetos = formas.map((f, i) => novoObjeto('q:' + i, 'quebravel', 1 + i * 2 - (i > 6 ? 13 : 0), i > 6 ? 5 : 3, { ref: f }));
      const resultados = {};
      for (const [visao, y] of [['cima', 45], ['iso', 430]]) {
        const grupo = new Container(); grupo.position.set(70, y); app.stage.addChild(grupo);
        const plano = new Container(), altos = new Container({ sortableChildren: true }); grupo.addChild(plano, altos);
        const proj = criarProjecao(visao, 16, 7), m = proj.matriz;
        plano.setFromMatrix(new Matrix(m.a, m.b, m.c, m.d, m.tx, m.ty));
        criarTerreno(plano, fase);
        const chao = new Container(); plano.addChild(chao);
        const camada = new CamadaObjetos(chao, () => undefined, 1, { camada: altos, projecao: () => proj }, () => undefined, null);
        camada.desenhar(estado, 0, true);
        const contar = () => (visao === 'iso' ? altos.children.length : chao.children.length);
        const antes = contar();
        // Quebra o primeiro com o golpe de um jogador: o desenho dele sai no próximo quadro.
        const copia = { ...estado, objetos: [...estado.objetos] };
        const j = criarJogador(conteudo.classes.get('guerreiro'), 'j', 0, 0, BALANCE_PADRAO);
        copia.entidades = [j];
        const eventos = [];
        quebrarEm(copia, ctx, [{ x: 1, y: 3 }], j, eventos);
        camada.desenhar(copia, 0, true);
        resultados[visao] = { antes, depois: contar(), quebrou: eventos.some((e) => e.t === 'quebrou') };
        camada.desenhar(estado, 0, true);
        const titulo = new Text({ text: visao === 'cima' ? 'Vista de cima' : 'Vista isométrica', style: { fontSize: 22, fill: '#f4e6cf' } });
        titulo.position.set(0, -30); grupo.addChild(titulo);
      }
      app.render();
      document.body.dataset.resultados = JSON.stringify(resultados);
      document.body.dataset.galeria = 'sim';
    })().catch((e) => { document.body.dataset.erro = String(e); });
  ` }, bundle: true, platform: 'browser', format: 'iife', write: false });
  await page.setViewportSize({ width: 1000, height: 850 });
  await page.goto('/');
  await page.addScriptTag({ content: script.outputFiles[0]?.text ?? '' });
  await expect(page.locator('body')).toHaveAttribute('data-galeria', 'sim');
  await page.screenshot({ path: info.outputPath('quebraveis.png') });
  const r = JSON.parse((await page.locator('body').getAttribute('data-resultados')) ?? '{}') as Record<string, { antes: number; depois: number; quebrou: boolean }>;
  for (const visao of ['cima', 'iso']) {
    const v = r[visao];
    expect(v?.quebrou, visao).toBe(true);
    // O quebrável saiu; o saque (se houve) entra no lugar: no máximo o mesmo número de desenhos.
    expect(v?.depois ?? 99, visao).toBeLessThanOrEqual((v?.antes ?? 0));
  }
  expect(erros).toEqual([]);
});
