// Personagens pré-renderizados (marco 32, 31/10/2026, D-131): `npx tsx tools/sprites/render.ts [--so nome,nome]` grava
// src/assets/personagens/<nome>.webp (o atlas: 8 direções × os quadros dos estados) e catalogo.json. Os pacotes brutos
// ficam em .brutos/ (fora do git; as pastas estão em PASTAS). Roda o three.js no Chromium do Playwright, como
// tools/objetos/render.ts.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import { build } from 'esbuild';
import { RECEITAS, type Receita } from './receitas';
import type { SaidaAtlas } from './pagina';

const RAIZ = join(import.meta.dirname, '..', '..');
const B = join(RAIZ, '.brutos');
/** O prefixo de cada pacote e a pasta dos arquivos dele (as texturas da Quaternius às vezes ficam numa irmã). */
const PASTAS: Record<string, string[]> = {
  base: [join(B, 'q-base', 'x', 'Universal Base Characters[Standard]', 'Base Characters', 'Godot - UE')],
  traje: [join(B, 'q-trajes', 'x', 'Modular Character Outfits - Fantasy[Standard]', 'Exports', 'glTF (Godot-Unreal)')],
  ual1: [join(B, 'q-anim', 'x', 'Universal Animation Library[Standard]', 'Unreal-Godot')],
  ual2: [join(B, 'q-anim2', 'x', 'Universal Animation Library 2 [Standard]', 'Unreal-Godot')],
  kes: [join(B, 'k-esqueletos', 'x', 'KayKit_Skeletons_1.1_FREE')],
  q: [join(B, 'quaternius-props', 'x', 'Exports', 'glTF'), join(B, 'quaternius-props', 'x', 'Textures')],
};
const DESTINO = join(RAIZ, 'src', 'assets', 'personagens');
const QUALIDADE_WEBP = 0.85;
const HOST = 'http://modelos.local/';

/** O caminho (no HOST) de cada referência da receita. */
function caminhoDe(ref: string): string {
  const [pacote = '', ...resto] = ref.split(':');
  const nome = resto.join(':');
  if (pacote === 'ual1') return 'ual1/UAL1_Standard.glb';
  if (pacote === 'ual2') return 'ual2/UAL2_Standard.glb';
  if (pacote === 'kes-anim') return `kes/Animations/gltf/Rig_Medium/Rig_Medium_${nome === 'Movement' ? 'MovementBasic' : nome}.glb`;
  if (pacote === 'q') return `q/${nome}.gltf`;
  if (pacote === 'base' || pacote === 'traje') return `${pacote}/${nome}.gltf`;
  return `${pacote}/${nome}`;
}

function arquivoNoDisco(caminho: string): string | null {
  const [pacote = '', ...resto] = caminho.split('/');
  const rel = resto.join('/');
  const nome = resto[resto.length - 1] ?? '';
  for (const pasta of PASTAS[pacote] ?? []) {
    for (const f of [join(pasta, rel), join(pasta, nome)]) if (existsSync(f)) return f;
  }
  // As texturas do traje ficam ao lado de cada gltf (Outfits/ ou Modular Parts/).
  if (pacote === 'traje') for (const sub of ['Outfits', 'Modular Parts']) {
    const f = join(PASTAS.traje?.[0] ?? '', sub, nome);
    if (existsSync(f)) return f;
  }
  return null;
}

function urlsDe(r: Receita): Record<string, string> {
  const refs = [r.corpo, ...(r.cabeca ? [r.cabeca] : []), ...(r.armas ?? []).map((a) => a.m)];
  const urls: Record<string, string> = {};
  for (const ref of refs) urls[ref] = HOST + caminhoDe(ref);
  for (const nome of Object.values(r.animacoes ?? {})) {
    const [bib = '', grupo = ''] = nome.split(':');
    const chave = bib === 'kes' ? `kes-anim:${grupo}` : bib;
    urls[chave] = HOST + caminhoDe(chave);
  }
  return urls;
}

const args = process.argv.slice(2);
const so = args[0] === '--so' ? new Set((args[1] ?? '').split(',')) : null;
mkdirSync(DESTINO, { recursive: true });
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

const caminhoCatalogo = join(DESTINO, 'catalogo.json');
type Entrada = Omit<SaidaAtlas, "png"> & { altura: number };
const catalogo: Record<string, Entrada> = existsSync(caminhoCatalogo) ? (JSON.parse(readFileSync(caminhoCatalogo, 'utf8')) as Record<string, Entrada>) : {};
for (const receita of RECEITAS) {
  if (so && !so.has(receita.nome)) continue;
  const inicio = Date.now();
  const saida = await pagina.evaluate(async ([r, u]) => window.personagens.renderizarAtlas(r, u), [receita, urlsDe(receita)] as const);
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
  const bytes = Buffer.from(webp.split(',')[1] ?? '', 'base64');
  writeFileSync(join(DESTINO, `${receita.nome}.webp`), bytes);
  const { quadroL, quadroA, ancoraX, ancoraY, pxCelula, colunas, estados } = saida;
  catalogo[receita.nome] = { quadroL, quadroA, ancoraX, ancoraY, pxCelula, colunas, estados, altura: receita.altura };
  console.log(receita.nome, `${saida.colunas * saida.quadroL}×${8 * saida.quadroA}`, `${Math.round(bytes.length / 1024)} KB`, `${Date.now() - inicio} ms`);
}
writeFileSync(caminhoCatalogo, `${JSON.stringify(Object.fromEntries(Object.entries(catalogo).sort(([a], [b]) => a.localeCompare(b))), null, 2)}\n`);
await navegador.close();
