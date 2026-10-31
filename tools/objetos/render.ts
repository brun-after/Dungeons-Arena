// Objetos pré-renderizados (marco 31, 31/10/2026, D-130): `npx tsx tools/objetos/render.ts [--so nome,nome]` grava
// src/assets/objetos/<nome>.webp e catalogo.json (tamanho e âncora dos pés de cada um) a partir das receitas
// (receitas.ts). `--medir k:chest q:Stall_Empty` mostra o tamanho e as animações de modelos (para calibrar).
// Os pacotes brutos ficam em .brutos/ (fora do git): .brutos/kaykit-dungeon/x/... e .brutos/quaternius-props/x/...
// Roda o three.js no Chromium do Playwright (WebGL), sem servidor: as requisições vão direto aos arquivos.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import { build } from 'esbuild';
import { RECEITAS } from './receitas';
import type { Modelos, Saida } from './pagina';

const RAIZ = join(import.meta.dirname, '..', '..');
const KAYKIT = join(RAIZ, '.brutos', 'kaykit-dungeon', 'x', 'KayKit-Dungeon-Remastered-1.0-main', 'addons', 'kaykit_dungeon_remastered', 'Assets', 'gltf');
const QUATERNIUS = join(RAIZ, '.brutos', 'quaternius-props', 'x');
const DESTINO = join(RAIZ, 'src', 'assets', 'objetos');
const QUALIDADE_WEBP = 0.86;
/**
 * Células por unidade de cada pacote: o KayKit mede o piso em 4 unidades por ladrilho grande (2 por célula do jogo);
 * o Quaternius está em metros (uma célula do jogo, ~1,6 m: a altura de uma pessoa é ~1,1 célula).
 */
const ESCALA = { k: 0.5, q: 0.62 } as const;
const HOST = 'http://modelos.local/';

function arquivoDoModelo(m: string): string {
  const [pacote, nome = ''] = m.split(':');
  if (pacote === 'k') {
    for (const f of [`${nome}.gltf.glb`, `${nome}.glb`]) if (existsSync(join(KAYKIT, f))) return `k/${f}`;
    throw new Error(`modelo KayKit não encontrado: ${nome}`);
  }
  if (pacote === 'q') {
    if (existsSync(join(QUATERNIUS, 'Exports', 'glTF', `${nome}.gltf`))) return `q/${nome}.gltf`;
    throw new Error(`modelo Quaternius não encontrado: ${nome}`);
  }
  throw new Error(`pacote desconhecido: ${m}`);
}

/** O arquivo no disco para um caminho pedido pela página (as texturas do Quaternius ficam em Textures/). */
function arquivoNoDisco(caminho: string): string | null {
  if (caminho.startsWith('k/')) return join(KAYKIT, caminho.slice(2));
  if (caminho.startsWith('q/')) {
    const nome = caminho.slice(2);
    const emGltf = join(QUATERNIUS, 'Exports', 'glTF', nome);
    if (existsSync(emGltf)) return emGltf;
    const emTexturas = join(QUATERNIUS, 'Textures', nome);
    if (existsSync(emTexturas)) return emTexturas;
  }
  return null;
}

const args = process.argv.slice(2);
const pacote = await build({ entryPoints: [join(import.meta.dirname, 'pagina.ts')], bundle: true, format: 'iife', write: false, platform: 'browser' });
const codigo = pacote.outputFiles[0]?.text ?? '';
const navegador = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pagina = await navegador.newPage();
pagina.on('console', (m) => {
  if (m.type() === 'error') console.error('[página]', m.text());
});
await pagina.route(`${HOST}**`, async (rota) => {
  const caminho = decodeURIComponent(new URL(rota.request().url()).pathname.slice(1));
  if (caminho === 'index.html') {
    await rota.fulfill({ contentType: 'text/html', body: `<!doctype html><meta charset="utf-8"><body><script>${codigo}</script>` });
    return;
  }
  const arquivo = arquivoNoDisco(caminho);
  if (!arquivo) {
    await rota.fulfill({ status: 404, body: '' });
    return;
  }
  await rota.fulfill({ body: readFileSync(arquivo) });
});
await pagina.goto(`${HOST}index.html`);

if (args[0] === '--medir') {
  for (const m of args.slice(1)) {
    const r = await pagina.evaluate(async (url) => window.objetos.medir(url), HOST + arquivoDoModelo(m));
    console.log(m, JSON.stringify(r));
  }
} else {
  const so = args[0] === '--so' ? new Set((args[1] ?? '').split(',')) : null;
  const caminhoCatalogo = join(DESTINO, 'catalogo.json');
  const catalogo: Record<string, Omit<Saida, 'png'>> = existsSync(caminhoCatalogo) ? (JSON.parse(readFileSync(caminhoCatalogo, 'utf8')) as Record<string, Omit<Saida, 'png'>>) : {};
  for (const receita of RECEITAS) {
    if (so && !so.has(receita.nome)) continue;
    const modelos: Modelos = {};
    for (const p of receita.pecas) {
      const pac = p.m.startsWith('k:') ? 'k' : 'q';
      modelos[p.m] = { url: HOST + arquivoDoModelo(p.m), escala: ESCALA[pac] };
    }
    const saida = await pagina.evaluate(async ([r, m]) => window.objetos.renderizar(r, m), [receita, modelos] as const);
    const webp = await pagina.evaluate(
      async ([png, q]) => {
        const img = new Image();
        img.src = png;
        await img.decode();
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        c.getContext('2d')?.drawImage(img, 0, 0);
        return c.toDataURL('image/webp', q);
      },
      [saida.png, QUALIDADE_WEBP] as const,
    );
    writeFileSync(join(DESTINO, `${receita.nome}.webp`), Buffer.from(webp.split(',')[1] ?? '', 'base64'));
    catalogo[receita.nome] = { largura: saida.largura, altura: saida.altura, ancoraX: Math.round(saida.ancoraX * 10) / 10, ancoraY: Math.round(saida.ancoraY * 10) / 10 };
    console.log(receita.nome, saida.largura, '×', saida.altura);
  }
  const ordenado = Object.fromEntries(Object.entries(catalogo).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(caminhoCatalogo, `${JSON.stringify(ordenado, null, 2)}\n`);
}
await navegador.close();
