// Personagens pré-renderizados (marco 32, 31/10/2026, D-131): `npx tsx tools/sprites/render.ts [--so nome,nome]` grava
// src/assets/personagens/<nome>.webp (o atlas: 8 direções × os quadros dos estados) e catalogo.json. Os pacotes brutos
// ficam em .brutos/ (fora do git; as pastas estão em PASTAS). Roda o three.js no Chromium do Playwright, como
// tools/objetos/render.ts. As classes saem também com as medidas das mãos e as camadas de armadura por grau
// (`<nome>~<peça>-<grau>.webp`, src/render/equipamento-3d.ts); `--so-corpo` pula as camadas. `--armas` grava as armas
// (`armas/<desenho>.webp`, os 6 graus lado a lado, e armas/catalogo.json).

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import { build } from 'esbuild';
import { RECEITAS, VARIANTES, type Receita } from './receitas';
import type { PedidoDeCamada, SaidaAtlas } from './pagina';
import { ARMAS_3D } from './armas3d';
import { GRAUS, nomeDaCamada, PECAS_DE_ARMADURA } from '../../src/render/equipamento-3d';

const RAIZ = join(import.meta.dirname, '..', '..');
const B = join(RAIZ, '.brutos');
/** O prefixo de cada pacote e a pasta dos arquivos dele (as texturas da Quaternius às vezes ficam numa irmã). */
const PASTAS: Record<string, string[]> = {
  cethiel: [join(B, 'dragao-realista', 'x')],
  base: [join(B, 'q-base', 'x', 'Universal Base Characters[Standard]', 'Base Characters', 'Godot - UE')],
  cabelo: [
    join(B, 'q-base', 'x', 'Universal Base Characters[Standard]', 'Hairstyles', 'Rigged to Head Bone', 'glTF (Godot -Unreal)'),
    join(B, 'q-base', 'x', 'Universal Base Characters[Standard]', 'Hairstyles', 'Textures'),
  ],
  traje: [join(B, 'q-trajes', 'x', 'Modular Character Outfits - Fantasy[Standard]', 'Exports', 'glTF (Godot-Unreal)')],
  ual1: [join(B, 'q-anim', 'x', 'Universal Animation Library[Standard]', 'Unreal-Godot')],
  ual2: [
    join(B, 'q-anim2', 'x', 'Universal Animation Library 2[Standard]', 'Unreal-Godot'),
    join(B, 'q-anim2', 'x', 'Universal Animation Library 2 [Standard]', 'Unreal-Godot'),
  ],
  kes: [join(B, 'k-esqueletos', 'x', 'KayKit_Skeletons_1.1_FREE')],
  q: [join(B, 'quaternius-props', 'x', 'Exports', 'glTF'), join(B, 'quaternius-props', 'x', 'Textures')],
};
const DESTINO = join(RAIZ, 'src', 'assets', 'personagens');
const QUALIDADE_WEBP = 0.85;
/** Camadas por chamada da página (cada uma é um canvas do tamanho do atlas). */
const LOTE = 6;
const HOST = 'http://modelos.local/';

/** O caminho (no HOST) de cada referência da receita. */
function caminhoDe(ref: string): string {
  const [pacote = '', ...resto] = ref.split(':');
  const nome = resto.join(':');
  if (pacote.startsWith('cethiel_')) return `cethiel/dragon_${pacote.slice(8)}.dae`;
  if (pacote === 'ual1') return 'ual1/UAL1_Standard.glb';
  if (pacote === 'ual2') return 'ual2/UAL2_Standard.glb';
  if (pacote === 'kes-anim') return `kes/Animations/gltf/Rig_Medium/Rig_Medium_${nome === 'Movement' ? 'MovementBasic' : nome}.glb`;
  if (pacote === 'q') return `q/${nome}.gltf`;
  if (pacote === 'base' || pacote === 'traje' || pacote === 'cabelo') return `${pacote}/${nome}.gltf`;
  return `${pacote}/${nome}`;
}

function arquivoNoDisco(caminho: string): string | null {
  const [pacote = '', ...resto] = caminho.split('/');
  const rel = resto.join('/');
  const nome = resto[resto.length - 1] ?? '';
  if (pacote === 'cethiel' && nome === 'dragon.png') return join(B, 'dragao-realista', 'x', 'dragon_black.png');
  for (const pasta of PASTAS[pacote] ?? []) {
    for (const f of [join(pasta, rel), join(pasta, nome), join(pasta, nome.replace(/_png\.png$/, '.png'))]) {
      if (existsSync(f)) return f;
    }
  }
  // As texturas do traje ficam ao lado de cada gltf (Outfits/ ou Modular Parts/).
  if (pacote === 'traje') for (const sub of ['Outfits', 'Modular Parts']) {
    const f = join(PASTAS.traje?.[0] ?? '', sub, nome);
    if (existsSync(f)) return f;
  }
  return null;
}

/** A cor de destaque de cada grau: a da raridade (render/objetos.ts COR_RARIDADE). */
const ACENTOS = [0x888888, 0x2ecc71, 0x3498db, 0x9b59b6, 0xf39c12, 0xff4d6d];

/** As camadas de armadura da classe: a capa, o peito e a cabeça, um atlas por grau. */
function camadasDe(r: Receita): PedidoDeCamada[] {
  const eq = r.equipamento;
  if (!eq) return [];
  return PECAS_DE_ARMADURA.flatMap((peca) =>
    GRAUS.map((_, grau) => {
      const armadura = { peca, grau, acento: ACENTOS[grau] ?? 0x888888 };
      const nome = `${peca}-${grau}`;
      if (peca === 'capa') return { nome, tingir: false, armadura };
      // O peito sempre tinge o pano do traje; a cabeça, só enquanto é capuz (o elmo entra no raro).
      if (peca === 'corpo') return { nome, tingir: false, armadura, ...eq.corpo, pecas: [] };
      // O elmo cobre o capuz e o cabelo: eles saem da máscara do corpo.
      if (grau >= 2) return { nome, tingir: false, armadura, esconder: 'Hood|Hair' };
      return { nome, tingir: false, armadura, ...eq.cabeca };
    }),
  );
}

function urlsDe(r: Receita, camadas: PedidoDeCamada[]): Record<string, string> {
  const refs = [
    ...(r.corpo.startsWith('proc:') ? [] : [r.corpo]),
    ...(r.cabeca ? [r.cabeca] : []),
    ...(r.adornosCabeca ?? []),
    ...(r.armas ?? []).map((a) => a.m),
    ...camadas.flatMap((c) => [...(c.pecas ?? []), ...(c.armas ?? []).map((a) => a.m)]),
  ];
  const urls: Record<string, string> = {};
  for (const ref of refs) urls[ref] = HOST + caminhoDe(ref);
  // Marco 32 (D-131): mais os golpes de cada arma das classes.
  for (const nome of [...Object.values(r.animacoes ?? {}), ...(r.equipamento && r.animacoes ? Object.values(VARIANTES) : [])]) {
    const [bib = '', grupo = ''] = nome.split(':');
    const chave = bib === 'kes' ? `kes-anim:${grupo}` : bib;
    urls[chave] = HOST + caminhoDe(chave);
  }
  return urls;
}

const args = process.argv.slice(2);
const iSo = args.indexOf('--so');
const so = iSo >= 0 ? new Set((args[iSo + 1] ?? '').split(',')) : null;
const soCorpo = args.includes('--so-corpo');
// Use só em revisões que preservam os rigs, a arma, a pose e a geometria do tronco.
const reusarMaos = args.includes('--reusar-maos');
const comArmas = args.includes('--armas');
const iModelos = args.indexOf('--modelos');
const pastaModelos = iModelos >= 0 ? args[iModelos + 1] : undefined;
if (iModelos >= 0 && (!pastaModelos || pastaModelos.startsWith('--'))) throw new Error('Use --modelos <diretório>');
if (pastaModelos) mkdirSync(pastaModelos, { recursive: true });
mkdirSync(DESTINO, { recursive: true });
const pacote = await build({ entryPoints: [join(import.meta.dirname, 'pagina.ts')], bundle: true, format: 'iife', write: false, platform: 'browser' });
const codigo = pacote.outputFiles[0]?.text ?? '';
// O padrão em software é reproduzível no CI. --gpu permite usar o driver local na geração, fora do jogo.
const navegador = await chromium.launch({
  args: args.includes('--gpu') ? ['--enable-gpu'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
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

async function webpDe(png: string): Promise<Buffer> {
  const webp = await pagina.evaluate(
    async ([p, q]) => {
      const img = new Image();
      img.src = p;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      c.getContext('2d')?.drawImage(img, 0, 0);
      return c.toDataURL('image/webp', q);
    },
    [png, QUALIDADE_WEBP] as const,
  );
  return Buffer.from(webp.split(',')[1] ?? '', 'base64');
}

const caminhoCatalogo = join(DESTINO, 'catalogo.json');
type Entrada = Omit<SaidaAtlas, 'png' | 'camadas' | 'maos'> & { altura: number; maos?: SaidaAtlas['maos'] };

if (comArmas) {
  const nomes = Object.keys(ARMAS_3D);
  for (const [pastaArmas, px] of [[join(DESTINO, 'armas'), 72], [join(RAIZ, 'src/assets/retratos/armas'), 288]] as const) {
    mkdirSync(pastaArmas, { recursive: true });
    const cat: Record<string, { celL: number; celA: number; pegaX: number; pegaY: number }> = {};
    for (let i = 0; i < nomes.length; i += LOTE) {
      const saidas = await pagina.evaluate(([lote, escala]) => window.personagens.renderizarArmas(lote, escala, 1.25),
        [nomes.slice(i, i + LOTE), px] as const);
      for (const a of saidas) {
        writeFileSync(join(pastaArmas, `${a.nome}.webp`), await webpDe(a.png));
        cat[a.nome] = { celL: a.celL, celA: a.celA, pegaX: a.pegaX, pegaY: a.pegaY };
      }
    }
    writeFileSync(join(pastaArmas, 'catalogo.json'), `${JSON.stringify(cat, null, 2)}
`);
    console.log('armas', px, nomes.length);
  }
}
const catalogo: Record<string, Entrada> = existsSync(caminhoCatalogo) ? (JSON.parse(readFileSync(caminhoCatalogo, 'utf8')) as Record<string, Entrada>) : {};
for (const receita of RECEITAS) {
  if ((so && !so.has(receita.nome)) || (comArmas && !so)) continue;
  if (pastaModelos) {
    if (!receita.manga) continue;
    const urls = urlsDe(receita, []);
    const base64 = await pagina.evaluate(([r, u]) => window.personagens.exportarModelo(r, u), [receita, urls] as const);
    const bytes = Buffer.from(base64, 'base64');
    writeFileSync(join(pastaModelos, `${receita.nome}.glb`), bytes);
    console.log(receita.nome, `${Math.round(bytes.length / 1024)} KB GLB`);
    continue;
  }
  const inicio = Date.now();
  const camadas = soCorpo ? [] : camadasDe(receita);
  const urls = urlsDe(receita, camadas);
  const lotes: PedidoDeCamada[][] = [];
  for (let k = 0; k < Math.max(1, camadas.length); k += LOTE) lotes.push(camadas.slice(k, k + LOTE));
  let bytesTotal = 0;
  for (const [k, lote] of lotes.entries()) {
    const referencia = reusarMaos ? catalogo[receita.nome]?.maos ?? null : null;
    const saida = await pagina.evaluate(([r, u, c, corpo, maos]) => window.personagens.renderizarAtlas(r, u, c, corpo, maos),
      [receita, urls, lote, k === 0, referencia] as const);
    const { quadroL, quadroA, ancoraX, ancoraY, pxCelula, colunas, faixa, estados } = saida;
    const entrada = { quadroL, quadroA, ancoraX, ancoraY, pxCelula, colunas, faixa, estados, altura: receita.altura };
    const anterior = catalogo[receita.nome];
    if ((soCorpo || reusarMaos) && receita.equipamento && anterior && (
      quadroL !== anterior.quadroL || quadroA !== anterior.quadroA ||
      ancoraX !== anterior.ancoraX || ancoraY !== anterior.ancoraY ||
      pxCelula !== anterior.pxCelula || colunas !== anterior.colunas || faixa !== anterior.faixa ||
      JSON.stringify(estados) !== JSON.stringify(anterior.estados)
    )) throw new Error(`Regere também as camadas de ${receita.nome}: a geometria do atlas mudou.`);
    const gravar = async (nome: string, png: string) => {
      const bytes = await webpDe(png);
      writeFileSync(join(DESTINO, `${nome}.webp`), bytes);
      catalogo[nome] = entrada;
      bytesTotal += bytes.length;
    };
    if (k === 0) {
      await gravar(receita.nome, saida.png);
      if (saida.maos) catalogo[receita.nome] = { ...entrada, maos: saida.maos };
    }
    for (const [j, png] of saida.camadas.entries()) {
      const nome = nomeDaCamada(receita.nome, lote[j]?.nome ?? '');
      if (!png) {
        if (!reusarMaos || !catalogo[nome] || !existsSync(join(DESTINO, `${nome}.webp`))) {
          throw new Error(`Camada de equipamento vazia: ${nome}`);
        }
        console.warn(`Camada vazia: preservando ${nome}.webp`);
        continue;
      }
      await gravar(nome, png);
    }
    if (k === 0) console.log(receita.nome, `${faixa * quadroL}×${Math.ceil(colunas / faixa) * 8 * quadroA}`);
  }
  console.log(' ', receita.nome, `${camadas.length} camadas`, `${Math.round(bytesTotal / 1024)} KB`, `${Date.now() - inicio} ms`);
}
if (!pastaModelos) writeFileSync(caminhoCatalogo, `${JSON.stringify(Object.fromEntries(Object.entries(catalogo).sort(([a], [b]) => a.localeCompare(b))), null, 2)}\n`);
await navegador.close();
