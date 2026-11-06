/* global OfflineAudioContext */
// Adaptações feitas no navegador, sem FFmpeg (06/11/2026). Uso: node tools/audio/adaptar.mjs CAMINHO_FONTES
// FONTES contém swishes/swishes/*.wav (artisticdude, Swishes Sound Pack) e evil_laugh_02.flac (AntumDeluge,
// Evil Laugh 2), os dois CC0. O Chromium decodifica, muda a velocidade (o tom da risada desce), recorta, normaliza
// o pico em -5 dBFS como importar.py e grava WAV mono de 16 bits a 32 kHz em public/audio, atualizando o manifesto
// e os créditos. importar.py preserva estas entradas quando reconstrói o manifesto.
import { chromium } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const FONTES = resolve(process.argv[2] ?? '.brutos/audio-novo');
const SAIDA = resolve('public/audio');
const TAXA = 32000;

/** O ataque básico mágico (zunido) e o surgimento da invocação (a risada baixa). */
const RECEITAS = [
  { id: 'zunido-1', fonte: 'swishes', caminho: 'swishes/swishes/swish-4.wav', som: 'zunido', velocidade: 1, ate: null, fadeMs: 25 },
  { id: 'zunido-2', fonte: 'swishes', caminho: 'swishes/swishes/swish-7.wav', som: 'zunido', velocidade: 1, ate: null, fadeMs: 25 },
  { id: 'invocacao-1', fonte: 'risada', caminho: 'evil_laugh_02.flac', som: 'invocacao', velocidade: 0.8, ate: 1.35, fadeMs: 300 },
  { id: 'invocacao-2', fonte: 'risada', caminho: 'evil_laugh_02.flac', som: 'invocacao', velocidade: 0.72, ate: 1.35, fadeMs: 300 },
];

const FONTES_NOVAS = {
  swishes: { autor: 'artisticdude', titulo: 'Swishes Sound Pack', pagina: 'https://opengameart.org/content/swishes-sound-pack', licenca: 'CC0-1.0', licencaUrl: 'https://creativecommons.org/publicdomain/zero/1.0/' },
  risada: { autor: 'AntumDeluge', titulo: 'Evil Laugh 2', pagina: 'https://opengameart.org/node/129475', licenca: 'CC0-1.0', licencaUrl: 'https://creativecommons.org/publicdomain/zero/1.0/' },
};

function wav(amostras) {
  const dados = Buffer.alloc(amostras.length * 2);
  amostras.forEach((v, i) => dados.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), i * 2));
  const cab = Buffer.alloc(44);
  cab.write('RIFF', 0); cab.writeUInt32LE(36 + dados.length, 4); cab.write('WAVE', 8); cab.write('fmt ', 12);
  cab.writeUInt32LE(16, 16); cab.writeUInt16LE(1, 20); cab.writeUInt16LE(1, 22); cab.writeUInt32LE(TAXA, 24);
  cab.writeUInt32LE(TAXA * 2, 28); cab.writeUInt16LE(2, 32); cab.writeUInt16LE(16, 34); cab.write('data', 36); cab.writeUInt32LE(dados.length, 40);
  return Buffer.concat([cab, dados]);
}

const nav = await chromium.launch();
const pg = await nav.newPage();
await pg.goto('about:blank');
const manifesto = JSON.parse(readFileSync(join(SAIDA, 'manifesto.json'), 'utf8'));
Object.assign(manifesto.fontes, FONTES_NOVAS);
const efeitos = {};
for (const r of RECEITAS) {
  const original = readFileSync(join(FONTES, r.caminho));
  const amostras = await pg.evaluate(async ({ b64, r, taxa }) => {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const buf = await new OfflineAudioContext(1, 1, 44100).decodeAudioData(bytes.buffer);
    const fim = Math.min(buf.duration, r.ate ?? buf.duration);
    const ctx = new OfflineAudioContext(1, Math.ceil((fim / r.velocidade) * taxa), taxa);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = r.velocidade;
    src.connect(ctx.destination);
    src.start(0, 0, fim);
    const d = (await ctx.startRendering()).getChannelData(0);
    let pico = 0;
    for (const v of d) pico = Math.max(pico, Math.abs(v));
    const ganho = pico > 0 ? 10 ** (-5 / 20) / pico : 1;
    const fade = Math.round((r.fadeMs / 1000) * taxa);
    return Array.from(d, (v, i) => v * ganho * Math.min(1, (d.length - i) / fade, i / Math.round(0.004 * taxa) || 0));
  }, { b64: original.toString('base64'), r, taxa: TAXA });
  const arquivo = `${r.id}.wav`;
  const bytes = wav(amostras);
  writeFileSync(join(SAIDA, arquivo), bytes);
  manifesto.arquivos[r.id] = {
    arquivo, fonte: r.fonte, original: r.caminho.split('/').pop(), tipo: 'efeito', duracao: +(amostras.length / TAXA).toFixed(3),
    sha256: createHash('sha256').update(bytes).digest('hex'), originalSha256: createHash('sha256').update(original).digest('hex'),
    adaptacao: `navegador: velocidade ${r.velocidade}${r.ate ? `, primeiros ${r.ate} s` : ''}, pico -5 dBFS, saída de ${r.fadeMs} ms`,
  };
  (efeitos[r.som] ??= []).push(r.id);
}
await nav.close();
Object.assign(manifesto.efeitos, efeitos);
// A gravação antiga da invocação (fout-03) segue nas trevas; só a entrada própria dela sai.
writeFileSync(join(SAIDA, 'manifesto.json'), JSON.stringify(manifesto, null, 2) + '\n');
const creditos = readFileSync(join(SAIDA, 'CREDITOS.md'), 'utf8').split('\n## Adaptações no navegador')[0].trimEnd();
const linhas = ['', '', '## Adaptações no navegador', 'Feitas por tools/audio/adaptar.mjs: velocidade (o tom da risada desce), recorte, pico de -5 dBFS e WAV mono de 32 kHz.', ''];
for (const [k, f] of Object.entries(FONTES_NOVAS)) {
  const usados = Object.values(manifesto.arquivos).filter((a) => a.fonte === k);
  linhas.push(`### ${f.titulo}`, `Autor: ${f.autor}. Fonte: ${f.pagina}`, `Licença: ${f.licenca} — ${f.licencaUrl}`, 'Arquivos: ' + usados.map((a) => `${a.arquivo} (original: ${a.original})`).join(', '), '');
}
writeFileSync(join(SAIDA, 'CREDITOS.md'), creditos + linhas.join('\n'));
console.log(RECEITAS.map((r) => `${r.id}: ${manifesto.arquivos[r.id].duracao} s`).join('\n'));
