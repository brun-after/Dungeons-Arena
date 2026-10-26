import { expect, test } from '@playwright/test';
import { build } from 'esbuild';

test('drops usam os desenhos dos itens nas duas projeções e limpam sprites coletados', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Galeria do renderizador nas duas projeções');
  const erros: string[] = [];
  page.on('pageerror', (e) => erros.push(e.message));
  const script = await build({ stdin: { resolveDir: process.cwd(), loader: 'ts', contents: `
    import { Application, Container, Matrix, Text } from 'pixi.js';
    import { conteudoOficial } from './src/core/conteudo';
    import { criarEstado } from './src/core/estado';
    import { CamadaObjetos } from './src/render/objetos';
    import { carregarTexturasDeIcones } from './src/render/icones-textura';
    import { criarProjecao } from './src/render/projecao';
    import { criarTerreno } from './src/render/terreno';
    import { carregarFase } from './src/world/fase';
    import { novoObjeto } from './src/world/objetos';
    (async () => {
      document.body.replaceChildren(); document.body.style.cssText = 'margin:0;background:#14121a';
      const itens = conteudoOficial().itens;
      const ids = ['espada_curta', 'escudo_madeira', 'elmo_ferro', 'pocao_vida', 'livro_raro', 'chave_ferro'];
      await carregarTexturasDeIcones(ids.map(id => itens.get(id).icone));
      const app = new Application(); await app.init({ width: 1000, height: 850, background: '#14121a', antialias: true, autoStart: false });
      document.body.append(app.canvas);
      const fase = carregarFase({ id: 'visual', nome: 'Drops', ordem: 1, tipo: 'campanha',
        mapa: Array.from({ length: 7 }, () => '.'.repeat(16)), spawns: [] });
      const estado = criarEstado({ semente: 1, faseId: 'visual' });
      estado.objetos = ids.map((id, i) => novoObjeto('item-' + i, 'item', 2 + i * 2, 3, { itemId: id, valor: id === 'pocao_vida' ? 4 : 1 }));
      // Marco 26 (D-109): ouro e orbe ficam de pé no isométrico (camada alta); de cima, no chão.
      estado.objetos.push(novoObjeto('ouro', 'ouro', 3, 5, { valor: 10 }), novoObjeto('orbe', 'orbe_hp', 6, 5, { valor: 10 }));
      for (const [visao, y] of [['cima', 45], ['iso', 430]]) {
        const grupo = new Container(); grupo.position.set(70, y); app.stage.addChild(grupo);
        const plano = new Container(), altos = new Container({ sortableChildren: true }); grupo.addChild(plano, altos);
        const proj = criarProjecao(visao, 16, 7), m = proj.matriz;
        plano.setFromMatrix(new Matrix(m.a, m.b, m.c, m.d, m.tx, m.ty));
        criarTerreno(plano, fase);
        const chao = new Container(); plano.addChild(chao);
        const camada = new CamadaObjetos(chao, id => itens.get(id)?.raridade, 1, { camada: altos, projecao: () => proj }, id => itens.get(id)?.icone);
        camada.desenhar(estado, 0, true);
        const antes = visao === 'iso' ? altos.children.length : chao.children.length;
        camada.desenhar({ ...estado, objetos: [] }, 0, true);
        const depois = visao === 'iso' ? altos.children.length : chao.children.length;
        if (antes - depois !== ids.length + (visao === 'iso' ? 2 : 0)) throw Error('Sprites não foram removidos: ' + visao);
        camada.desenhar(estado, 0, true);
        const titulo = new Text({ text: visao === 'cima' ? 'Vista de cima' : 'Vista isométrica', style: { fontSize: 22, fill: '#f4e6cf' } });
        titulo.position.set(0, -30); grupo.addChild(titulo);
      }
      app.render(); document.body.dataset.galeria = 'sim';
    })();
  ` }, bundle: true, platform: 'browser', format: 'iife', write: false });
  await page.setViewportSize({ width: 1000, height: 850 });
  await page.goto('/');
  await page.addScriptTag({ content: script.outputFiles[0]?.text ?? '' });
  await expect(page.locator('body')).toHaveAttribute('data-galeria', 'sim');
  await page.screenshot({ path: info.outputPath('drops.png') });
  expect(erros).toEqual([]);
});
