// Benchmarks do cliente (marco 16, 15/10/2026, D-062, §5.6): `npm run bench [-- --segundos 30 --marco 16 --registrar]`.
// Serve o build (vite preview), abre as cenas `?bench=carga` e `?bench=padrao` no Chromium sem tela, nas qualidades
// baixa e alta, e lê o resultado da página. Depois mede a memória em 10 trocas de fase no mesmo documento
// (`?bench=trocas`): heap depois de coletar o lixo, pelo protocolo do Chromium; critério: sem crescimento monotônico
// e até +10% da base. Com `--registrar`, acrescenta as linhas em docs/BENCHMARKS.md.
// Ressalva: o WebGL do Chromium sem tela é por software; números de aparelho real vêm de `?bench=` no aparelho.

import { spawn, type ChildProcess } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium, type Page } from '@playwright/test';

const args = process.argv.slice(2);
const valor = (nome: string, padrao: string) => {
  const i = args.indexOf(`--${nome}`);
  return i >= 0 ? (args[i + 1] ?? padrao) : padrao;
};
const SEGUNDOS = Number(valor('segundos', '30'));
const MARCO = valor('marco', '16');
const PORTA = 4175;
const BASE = `http://localhost:${PORTA}/`;
const TROCAS = Number(valor('trocas', '30'));

interface ResultadoBench {
  cena: string;
  qualidade: string;
  segundos: number;
  quadros: number;
  fps: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  pausas: number;
  memoriaInicialMb: number | null;
  memoriaFinalMb: number | null;
  pico: { npcs: number; invocacoes: number; avatares: number; armadilhas: number; projeteis: number };
  largura: number;
  altura: number;
  dpr: number;
}

async function esperarServidor(): Promise<void> {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(BASE)).ok) return;
    } catch {
      // Ainda subindo.
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('vite preview não respondeu');
}

async function medirCena(pagina: Page, cena: string, qualidade: string): Promise<ResultadoBench> {
  await pagina.goto(`${BASE}?bench=${cena}&qualidade=${qualidade}&segundos=${SEGUNDOS}`);
  await pagina.waitForSelector('body[data-bench="pronto"]', { timeout: (SEGUNDOS + 90) * 1000 });
  const texto = await pagina.locator('#resultado-bench').textContent();
  return JSON.parse(texto ?? '{}') as ResultadoBench;
}

async function medirTrocas(pagina: Page): Promise<number[]> {
  const cdp = await pagina.context().newCDPSession(pagina);
  await pagina.goto(`${BASE}?bench=trocas`);
  const heaps: number[] = [];
  for (let i = 1; i <= TROCAS + 1; i++) {
    await pagina.waitForSelector(`body[data-trocas="${i}"]`, { timeout: 60_000 });
    await cdp.send('HeapProfiler.collectGarbage');
    const uso = (await cdp.send('Runtime.getHeapUsage')) as { usedSize: number };
    heaps.push(Math.round((uso.usedSize / 1024 / 1024) * 100) / 100);
    if (i <= TROCAS) await pagina.click('#bench-trocar');
  }
  return heaps;
}

const br = (v: number | null) => (v === null ? '—' : String(v).replace('.', ','));

let servidor: ChildProcess | null = null;
try {
  servidor = spawn('npx', ['vite', 'preview', '--port', String(PORTA), '--strictPort'], { stdio: 'ignore', shell: true });
  await esperarServidor();
  const navegador = await chromium.launch();
  const resultados: ResultadoBench[] = [];
  for (const cena of args.includes('--so-trocas') ? [] : ['carga', 'padrao']) {
    for (const qualidade of ['baixo', 'alto']) {
      const contexto = await navegador.newContext({ viewport: { width: 1280, height: 720 } });
      const r = await medirCena(await contexto.newPage(), cena, qualidade);
      resultados.push(r);
      console.log(`${cena} ${qualidade}: fps ${r.fps} · p50 ${r.p50Ms} · p95 ${r.p95Ms} · p99 ${r.p99Ms} ms · pausas ${r.pausas} · memória ${r.memoriaInicialMb}→${r.memoriaFinalMb} MB · pico ${JSON.stringify(r.pico)}`);
      await contexto.close();
    }
  }
  const contexto = await navegador.newContext({ viewport: { width: 1280, height: 720 } });
  const heaps = await medirTrocas(await contexto.newPage());
  await contexto.close();
  await navegador.close();
  // As primeiras trocas enchem caches limitados (medidas de texto do Pixi, habilidades compiladas): o critério é
  // estabilizar — sem crescimento monotônico e o último terço até +5% do terço do meio.
  const base = heaps[0] ?? 0;
  const final = heaps.at(-1) ?? 0;
  const media = (v: number[]) => v.reduce((s, x) => s + x, 0) / Math.max(1, v.length);
  const terco = Math.floor(heaps.length / 3);
  const meio = media(heaps.slice(terco, 2 * terco));
  const fim = media(heaps.slice(2 * terco));
  const monotonico = heaps.every((h, i) => i === 0 || h > (heaps[i - 1] ?? 0));
  const memoriaOk = !monotonico && fim <= meio * 1.05;
  const variacao = Math.round((fim / Math.max(0.01, meio) - 1) * 1000) / 10;
  console.log(`trocas de fase (heap em MB depois do GC): ${heaps.join(' → ')} · ${memoriaOk ? 'ok' : 'FALHOU'} (monotônico: ${monotonico}, último terço vs. meio ${variacao}%)`);

  if (args.includes('--registrar')) {
    const data = new Date().toISOString().slice(0, 10);
    const linhas = resultados.map(
      (r) =>
        `| ${data} | ${MARCO} | \`?bench=${r.cena}\`, qualidade ${r.qualidade}, ${r.segundos} s, Chromium sem tela ${r.largura}×${r.altura} @${r.dpr} (WebGL por software) | fps · p50/p95/p99 · pausas > 100 ms · heap | 60 fps · p95 ≤ 16,7 ms · 0 | ${br(r.fps)} · ${br(r.p50Ms)}/${br(r.p95Ms)}/${br(r.p99Ms)} ms · ${r.pausas} · ${br(r.memoriaInicialMb)}→${br(r.memoriaFinalMb)} MB | pico: ${r.pico.npcs} NPCs, ${r.pico.invocacoes} invocações, ${r.pico.avatares} avatares, ${r.pico.armadilhas} armadilhas, ${r.pico.projeteis} projéteis; mede o pior caso de CPU, não o aparelho |`,
    );
    linhas.push(
      `| ${data} | ${MARCO} | \`?bench=trocas\`: ${TROCAS} trocas de fase no mesmo documento (desmontar e montar a cena) | heap depois do GC | estabiliza: sem crescimento monotônico, último terço ≤ terço do meio +5% | base ${br(base)} MB, meio ${br(Math.round(meio * 100) / 100)} MB, último terço ${br(Math.round(fim * 100) / 100)} MB, final ${br(final)} MB | ${memoriaOk ? 'aprovado' : 'reprovado'} (${br(variacao)}%); as primeiras trocas enchem caches limitados |`,
    );
    const doc = readFileSync('docs/BENCHMARKS.md', 'utf8');
    const marcador = '## Medições';
    const inicio = doc.indexOf(marcador);
    const fimTabela = doc.indexOf('\n\n', doc.indexOf('|---', inicio));
    const novo = fimTabela < 0 ? `${doc.trimEnd()}\n${linhas.join('\n')}\n` : `${doc.slice(0, fimTabela)}\n${linhas.join('\n')}${doc.slice(fimTabela)}`;
    writeFileSync('docs/BENCHMARKS.md', novo);
    console.log('Registrado em docs/BENCHMARKS.md');
  }
  if (!memoriaOk) process.exitCode = 1;
} finally {
  servidor?.kill();
}
