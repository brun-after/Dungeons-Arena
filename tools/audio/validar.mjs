/* global biblioteca, window, AudioContext, OfflineAudioContext, document */
// Valida o mesmo motor e os MP3 distribuídos. Uso: node tools/audio/validar.mjs [executavel-chromium]
import { build } from 'esbuild';
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import assert from 'node:assert/strict';

const publico = resolve('public');
const servidor = createServer(async (req, res) => {
  const caminho = resolve(publico, decodeURIComponent((req.url ?? '/').split('?')[0]).replace(/^\/Dungeons-Arena\//, ''));
  if (!caminho.startsWith(publico + sep)) { res.writeHead(404).end(); return; }
  try {
    const dados = await readFile(caminho);
    res.setHeader('Content-Type', caminho.endsWith('.mp3') ? 'audio/mpeg' : caminho.endsWith('.wav') ? 'audio/wav' : caminho.endsWith('.json') ? 'application/json' : 'text/html; charset=utf-8');
    res.end(dados);
  } catch { res.writeHead(404).end(); }
});
await new Promise(r => servidor.listen(0, '127.0.0.1', r));
const endereco = servidor.address();
assert(endereco && typeof endereco !== 'string');
let navegador;
try {
  const bundle = await build({ stdin: { contents: "export { MotorAudio } from './src/audio/motor'; export * from './src/audio/gravacoes'; export { SONS } from './src/audio/mapeamento';", resolveDir: process.cwd() }, bundle: true, write: false, format: 'iife', globalName: 'biblioteca', define: { 'import.meta.env.BASE_URL': '"/Dungeons-Arena/"' } });
  navegador = await chromium.launch({ headless: true, ...(process.argv[2] ? { executablePath: process.argv[2] } : {}) });
  const pagina = await navegador.newPage();
  const erros = [];
  pagina.on('pageerror', e => erros.push(e.message));
  await pagina.goto(`http://127.0.0.1:${endereco.port}/Dungeons-Arena/audio/index.html`);
  await pagina.waitForSelector('article audio');
  assert.equal(await pagina.locator('article audio').count(), 6);
  await pagina.addScriptTag({ content: bundle.outputFiles[0].text });
  const medidas = await pagina.evaluate(async () => {
    const ctx = new OfflineAudioContext(1, 1, 32000);
    const resultados = [];
    // Todas as gravações devem decodificar no navegador, inclusive faixas e ambientes.
    for (const id of Object.keys(biblioteca.GRAVACOES)) {
      const r = await fetch(biblioteca.urlDaGravacao(id));
      if (!r.ok) throw new Error(`${id}: HTTP ${r.status}`);
      const buffer = await ctx.decodeAudioData(await r.arrayBuffer());
      let pico = 0, energia = 0;
      for (let canal = 0; canal < buffer.numberOfChannels; canal++) {
        const d = buffer.getChannelData(canal);
        for (let i = 0; i < d.length; i++) {
          if (!Number.isFinite(d[i])) throw new Error(`Amostra inválida: ${id}`);
          pico = Math.max(pico, Math.abs(d[i])); energia += d[i] * d[i];
        }
      }
      resultados.push({ id, duracao: buffer.duration, pico, rms: Math.sqrt(energia / buffer.length / buffer.numberOfChannels) });
    }
    return resultados;
  });
  for (const m of medidas) { assert(m.pico > 0 && m.pico < 1, JSON.stringify(m)); assert(m.rms > 0.0001); }
  await pagina.evaluate(() => {
    // O teste falha se algum caminho tentar voltar ao sintetizador.
    AudioContext.prototype.createOscillator = () => { throw new Error('Síntese proibida neste motor'); };
    window.motorTeste = new biblioteca.MotorAudio({ musica: 0.45, efeitos: 0.75, mudo: false });
    window.motorTeste.definirMusica('fase-01', 'exploracao', 0.2, 0);
    const botao = document.createElement('button'); botao.id = 'iniciar-teste'; botao.textContent = 'Iniciar teste'; document.body.prepend(botao);
  });
  await pagina.locator('#iniciar-teste').click();
  await pagina.waitForFunction(() => window.motorTeste.banco?.pronto('clique-1') && window.motorTeste.atual);
  await pagina.evaluate(() => {
    window.motorTeste.definirMusica('fase-01', 'combate', 0.3, 0);
    window.motorTeste.definirMusica('fase-01', 'chefe', 0.9, 0);
    for (const som of biblioteca.SONS) window.motorTeste.tocar(som);
    window.motorTeste.definirFonte('tocha', 'fogo');
    window.motorTeste.atualizarFonte('tocha', 0.8, -0.6);
  });
  await pagina.waitForFunction(() => window.motorTeste.atual?.chave === biblioteca.musicaDaCena('fase-01', 'chefe', 0.9, 0));
  await pagina.evaluate(() => window.motorTeste.pausar(true));
  await pagina.waitForFunction(() => window.motorTeste.ctx.state === 'suspended');
  const parado = await pagina.evaluate(() => window.motorTeste.ctx.currentTime);
  await pagina.waitForTimeout(150);
  assert.equal(await pagina.evaluate(() => window.motorTeste.ctx.currentTime), parado);
  await pagina.evaluate(() => window.motorTeste.pausar(false));
  await pagina.waitForFunction(() => window.motorTeste.ativo());
  await pagina.evaluate(() => window.motorTeste.destruir());
  assert.equal(await pagina.evaluate(() => window.motorTeste.vozes.size), 0);
  assert.deepEqual(erros, []);
  if (process.env.AUDIO_RELATORIO) await writeFile(process.env.AUDIO_RELATORIO, JSON.stringify(medidas, null, 2));
  console.log(`${medidas.length} MP3 decodificados: sem silêncio, NaN ou clipping; galeria, subdiretório, troca concorrente, pausa e destruição aprovados.`);
} finally {
  await navegador?.close();
  await new Promise(r => servidor.close(r));
}

