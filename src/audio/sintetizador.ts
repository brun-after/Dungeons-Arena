// Sintetizador (§2.14). Marco 12 (14/10/2026), D-056. Todos os sons do jogo nascem aqui, por Web Audio:
// osciladores, ruído e envelopes. Nenhum arquivo, nenhuma licença de terceiros, nenhum host externo.
// Cada receita agenda os próprios nós e se desliga sozinha ao fim.

import type { SomId } from './mapeamento';

/** Duração de cada som, para o teto de vozes do limitador. */
export const DURACAO_MS: Readonly<Record<SomId, number>> = {
  golpe: 600, acerto: 480, critico: 700, falha: 300, conjuracao: 700,
  magia: 800, projetil: 400, explosao: 1000, cura: 1200, moeda: 500,
  coleta: 650, passo: 160, porta: 900, armadilha: 650, invocacao: 1200,
  morte: 1000, nivel: 1600, clique: 120, recusa: 300,
  fogo: 950, gelo: 850, raio: 700, veneno: 900, psiquico: 1000,
  terra: 1000, trevas: 1200, sagrado: 1200, lamina: 600,
  contundente: 650, arco: 450, quebra: 800, teleporte: 1000,
};

const ruidos = new WeakMap<BaseAudioContext, AudioBuffer>();

/** Um segundo de ruído branco, criado uma vez por contexto. */
export function ruido(ctx: BaseAudioContext): AudioBuffer {
  const pronto = ruidos.get(ctx);
  if (pronto) return pronto;
  const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const dados = buffer.getChannelData(0);
  let semente = 12345;
  for (let i = 0; i < dados.length; i++) {
    semente = (Math.imul(semente, 1664525) + 1013904223) >>> 0;
    dados[i] = (semente / 4294967296) * 2 - 1;
  }
  ruidos.set(ctx, buffer);
  return buffer;
}

interface Tom {
  ctx: BaseAudioContext;
  destino: AudioNode;
  t0: number;
  tom: number;
}

function envelope(t: Tom, pico: number, ataque: number, duracao: number): GainNode {
  const g = t.ctx.createGain();
  g.gain.setValueAtTime(0.0001, t.t0);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, pico), t.t0 + ataque);
  g.gain.exponentialRampToValueAtTime(0.0001, t.t0 + duracao);
  g.connect(t.destino);
  return g;
}

function osc(t: Tom, tipo: OscillatorType, de: number, para: number, duracao: number, pico: number, inicio = 0): void {
  const tt = { ...t, t0: t.t0 + inicio };
  const o = t.ctx.createOscillator();
  o.type = tipo;
  o.frequency.setValueAtTime(de * t.tom, tt.t0);
  if (para !== de) o.frequency.exponentialRampToValueAtTime(Math.max(1, para * t.tom), tt.t0 + duracao);
  o.connect(envelope(tt, pico, Math.min(0.01, duracao / 4), duracao));
  o.start(tt.t0);
  o.stop(tt.t0 + duracao + 0.02);
}

function chiado(t: Tom, filtro: BiquadFilterType, de: number, para: number, duracao: number, pico: number, inicio = 0): void {
  const tt = { ...t, t0: t.t0 + inicio };
  const fonte = t.ctx.createBufferSource();
  fonte.buffer = ruido(t.ctx);
  const f = t.ctx.createBiquadFilter();
  f.type = filtro;
  f.frequency.setValueAtTime(de, tt.t0);
  if (para !== de) f.frequency.exponentialRampToValueAtTime(Math.max(20, para), tt.t0 + duracao);
  fonte.connect(f);
  f.connect(envelope(tt, pico, 0.005, duracao));
  fonte.start(tt.t0);
  fonte.stop(tt.t0 + duracao + 0.02);
}

/** Ressonâncias inarmônicas: metal, madeira, vidro e pedra, sem bipes quadrados. */
function ressoar(t: Tom, fundamental: number, parciais: readonly number[], duracao: number, volume: number): void {
  parciais.forEach((razao, i) => { osc(t, 'sine', fundamental * razao, fundamental * razao * 0.997,
    duracao / (1 + i * 0.38), volume / (1 + i * 1.7)); });
}

/** Cada ação combina transiente, corpo e cauda; pitch varia só entre execuções. */
export function tocarEfeito(ctx: BaseAudioContext, destino: AudioNode, som: SomId, tom: number): void {
  const t: Tom = { ctx, destino, t0: ctx.currentTime, tom };
  const impacto = (peso = 1) => {
    chiado(t, 'lowpass', 1900, 180, 0.18, 0.28 * peso);
    ressoar(t, 95, [1, 1.47, 2.09], 0.42, 0.22 * peso);
  };
  const cristal = (base: number, duracao = 0.65) => { ressoar(t, base, [1, 2.76, 5.4, 8.93], duracao, 0.12); };
  switch (som) {
    case 'golpe': case 'lamina':
      chiado(t, 'bandpass', 2600, 650, 0.2, 0.32);
      ressoar({ ...t, t0: t.t0 + 0.045 }, 420, [1, 2.32, 4.7, 6.1], 0.48, 0.15);
      break;
    case 'acerto': case 'contundente':
      impacto(); break;
    case 'critico':
      impacto(1.4); chiado(t, 'highpass', 3200, 800, 0.35, 0.2);
      ressoar(t, 185, [1, 2.4, 4.3], 0.65, 0.14); break;
    case 'falha':
      chiado(t, 'bandpass', 1800, 450, 0.26, 0.18); break;
    case 'conjuracao': case 'magia':
      chiado(t, 'bandpass', 350, 2200, 0.6, 0.14);
      ressoar(t, 185, [1, 1.5, 2.01, 3.02], 0.65, 0.1); break;
    case 'projetil': case 'arco':
      ressoar(t, 170, [1, 2.03, 3.9], 0.18, 0.14);
      chiado(t, 'bandpass', 2800, 700, 0.32, 0.2, 0.025); break;
    case 'fogo':
      chiado(t, 'lowpass', 2800, 160, 0.9, 0.4);
      osc(t, 'sine', 95, 38, 0.6, 0.24);
      for (let i = 0; i < 6; i++) chiado(t, 'highpass', 1800 + i * 280, 900, 0.06, 0.12, i * 0.12);
      break;
    case 'gelo':
      for (let i = 0; i < 5; i++) cristal(780 + i * 173, 0.75 - i * 0.08);
      chiado(t, 'highpass', 6500, 2400, 0.4, 0.13); break;
    case 'raio':
      for (let i = 0; i < 5; i++) chiado(t, 'bandpass', 6500, 700, 0.045, 0.5, i * 0.035);
      chiado(t, 'lowpass', 650, 70, 0.65, 0.32); break;
    case 'veneno':
      for (let i = 0; i < 6; i++) osc({ ...t, t0: t.t0 + i * 0.105 }, 'sine', 210 + i * 41, 70, 0.18, 0.15);
      chiado(t, 'bandpass', 900, 350, 0.8, 0.14); break;
    case 'terra': case 'explosao':
      chiado(t, 'lowpass', 1800, 65, 0.95, 0.42);
      ressoar(t, 53, [1, 1.39, 2.71, 4.18], 0.9, 0.3);
      for (let i = 0; i < 4; i++) chiado(t, 'bandpass', 1500, 350, 0.12, 0.15, i * 0.17);
      break;
    case 'psiquico': case 'trevas':
      ressoar(t, som === 'trevas' ? 68 : 220, [1, 1.03, 1.49, 2.02], 0.95, 0.13);
      chiado(t, 'bandpass', 1600, 180, 0.95, 0.16); break;
    case 'cura': case 'sagrado':
      [392, 587.33, 783.99].forEach((f, i) => { ressoar({ ...t, t0: t.t0 + i * 0.1 }, f, [1, 2.01, 3.98], 0.9, 0.08); });
      chiado(t, 'highpass', 4200, 6500, 0.7, 0.045); break;
    case 'moeda':
      cristal(2140, 0.42); cristal(2860, 0.34); break;
    case 'coleta':
      ressoar(t, 520, [1, 1.5, 2.02], 0.6, 0.1);
      chiado(t, 'bandpass', 1700, 600, 0.16, 0.1); break;
    case 'passo':
      chiado(t, 'lowpass', 850, 220, 0.1, 0.16);
      ressoar(t, 120, [1, 1.8], 0.12, 0.08); break;
    case 'porta':
      ressoar(t, 83, [1, 1.48, 2.73, 4.2], 0.85, 0.18);
      chiado(t, 'bandpass', 650, 160, 0.65, 0.22); break;
    case 'armadilha':
      ressoar(t, 650, [1, 2.32, 4.1], 0.6, 0.18); impacto(0.7); break;
    case 'invocacao': case 'teleporte':
      chiado(t, 'bandpass', 180, 2800, 0.75, 0.23);
      ressoar({ ...t, t0: t.t0 + 0.18 }, 146.83, [1, 1.5, 2.01], 0.75, 0.15); break;
    case 'morte':
      chiado(t, 'bandpass', 650, 95, 0.85, 0.22);
      ressoar(t, 73, [1, 1.37, 2.13], 0.9, 0.16); break;
    case 'quebra':
      for (let i = 0; i < 5; i++) {
        chiado(t, 'bandpass', 2500 - i * 300, 400, 0.18, 0.18, i * 0.1);
        ressoar({ ...t, t0: t.t0 + i * 0.1 }, 320 + i * 79, [1, 2.17, 3.4], 0.25, 0.08);
      } break;
    case 'nivel':
      [293.66, 440, 587.33, 880].forEach((f, i) => { ressoar({ ...t, t0: t.t0 + i * 0.16 }, f, [1, 2.01, 3], 1, 0.1); }); break;
    case 'clique':
      chiado(t, 'bandpass', 1600, 950, 0.05, 0.09); ressoar(t, 420, [1, 2.3], 0.08, 0.06); break;
    case 'recusa':
      ressoar(t, 140, [1, 1.06, 1.48], 0.25, 0.12); break;
  }
}

// --- Instrumentos da música ---

export function tocarNota(ctx: BaseAudioContext, destino: AudioNode, quando: number, freq: number, duracao: number, tipo: OscillatorType, pico: number): void {
  osc({ ctx, destino, t0: quando, tom: 1 }, tipo, freq, freq, duracao, pico);
}

/** Marco 11A: nota com passa-baixa (casual brilhante, dark abafado). */
export function tocarNotaFiltrada(ctx: BaseAudioContext, destino: AudioNode, quando: number, freq: number, duracao: number, _tipo: OscillatorType, pico: number, corte: number): void {
  const filtro = ctx.createBiquadFilter();
  filtro.type = 'lowpass';
  filtro.frequency.value = corte;
  filtro.Q.value = 0.5;
  filtro.connect(destino);
  const t: Tom = { ctx, destino: filtro, t0: quando, tom: 1 };
  // Sopro/corda: harmônicos decrescentes, ataque suave e pequena desafinação.
  for (const [i, amplitude] of [1, 0.32, 0.13, 0.06].entries()) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq * (i + 1);
    o.detune.value = i % 2 ? -3 : 3;
    o.connect(envelope(t, pico * amplitude, Math.min(0.16, duracao / 3), duracao));
    o.start(quando); o.stop(quando + duracao + 0.02);
  }
  chiado(t, 'bandpass', freq * 2, freq, duracao, pico * 0.08);
  setTimeout(() => { filtro.disconnect(); }, Math.max(0, quando - ctx.currentTime + duracao + 0.1) * 1000);
}

/** Marco 11A: pad — dois osciladores levemente desafinados por nota, com ataque e soltura lentos. */
export function tocarPad(ctx: BaseAudioContext, destino: AudioNode, quando: number, freqs: readonly number[], duracao: number, _tipo: OscillatorType, pico: number): void {
  const ganho = ctx.createGain();
  const filtro = ctx.createBiquadFilter();
  filtro.type = 'lowpass';
  filtro.frequency.value = 1400;
  ganho.connect(filtro);
  filtro.connect(destino);
  const ataque = Math.min(0.6, duracao / 3);
  ganho.gain.setValueAtTime(0.0001, quando);
  ganho.gain.exponentialRampToValueAtTime(pico, quando + ataque);
  ganho.gain.setValueAtTime(pico, quando + duracao - ataque);
  ganho.gain.exponentialRampToValueAtTime(0.0001, quando + duracao);
  for (const f of freqs) {
    for (const desafino of [-6, 6]) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      o.detune.value = desafino;
      o.connect(ganho);
      o.start(quando);
      o.stop(quando + duracao + 0.05);
    }
  }
  setTimeout(() => {
    filtro.disconnect();
  }, (quando - ctx.currentTime + duracao + 0.3) * 1000);
}

export function tocarBumbo(ctx: BaseAudioContext, destino: AudioNode, quando: number): void {
  ressoar({ ctx, destino, t0: quando, tom: 1 }, 58, [1, 1.59, 2.14, 2.92], 0.8, 0.24);
  chiado({ ctx, destino, t0: quando, tom: 1 }, 'lowpass', 900, 110, 0.18, 0.18);
}

export function tocarCaixa(ctx: BaseAudioContext, destino: AudioNode, quando: number): void {
  ressoar({ ctx, destino, t0: quando, tom: 1 }, 150, [1, 1.47, 2.09], 0.38, 0.15);
  chiado({ ctx, destino, t0: quando, tom: 1 }, 'bandpass', 1400, 600, 0.2, 0.12);
}

export function tocarChimbal(ctx: BaseAudioContext, destino: AudioNode, quando: number): void {
  chiado({ ctx, destino, t0: quando, tom: 1 }, 'highpass', 5200, 2800, 0.5, 0.045);
}

/** Som ambiente em laço (fontes sonoras da fase, §2.14): devolve o ganho e como parar. */
export type SomAmbiente = 'fogo' | 'agua' | 'vento' | 'goteira';
export const SONS_AMBIENTE: readonly SomAmbiente[] = ['fogo', 'agua', 'vento', 'goteira'];

export function criarAmbiente(ctx: BaseAudioContext, destino: AudioNode, tipo: SomAmbiente): { ganho: GainNode; parar: () => void } {
  const ganho = ctx.createGain();
  ganho.gain.value = 0;
  ganho.connect(destino);
  const parar: (() => void)[] = [];
  let vivo = true;
  let timer: ReturnType<typeof setTimeout>;
  const detalhe = () => {
    if (!vivo) return;
    const t: Tom = { ctx, destino: ganho, t0: ctx.currentTime, tom: 0.94 + Math.random() * 0.12 };
    if (tipo === 'goteira') {
      osc(t, 'sine', 1800, 720, 0.09, 0.15);
      ressoar({ ...t, t0: t.t0 + 0.035 }, 680, [1, 2.71], 0.65, 0.045);
    } else if (tipo === 'fogo') {
      chiado(t, 'highpass', 2500 + Math.random() * 1800, 900, 0.04, 0.1);
    } else if (tipo === 'agua') {
      osc(t, 'sine', 280 + Math.random() * 450, 110, 0.14, 0.045);
    }
    timer = setTimeout(detalhe, tipo === 'goteira' ? 1100 + Math.random() * 2300 : 140 + Math.random() * 620);
  };
  detalhe();
  parar.push(() => { vivo = false; clearTimeout(timer); });
  if (tipo !== 'goteira') {
    // Duas bandas com movimentos lentos: evita o antigo chiado uniforme de um segundo.
    for (const [i, centro] of (tipo === 'fogo' ? [240, 1800] : tipo === 'agua' ? [420, 2400] : [220, 680]).entries()) {
      const fonte = ctx.createBufferSource();
      fonte.buffer = ruido(ctx);
      fonte.loop = true;
      fonte.playbackRate.value = 0.73 + i * 0.31;
      const filtro = ctx.createBiquadFilter();
      filtro.type = 'bandpass'; filtro.frequency.value = centro; filtro.Q.value = 0.65;
      const nivel = ctx.createGain(); nivel.gain.value = tipo === 'vento' ? 0.16 : 0.12;
      const lfo = ctx.createOscillator(); const modulacao = ctx.createGain();
      lfo.frequency.value = 0.07 + i * 0.11; modulacao.gain.value = centro * 0.4;
      lfo.connect(modulacao); modulacao.connect(filtro.frequency);
      fonte.connect(filtro); filtro.connect(nivel); nivel.connect(ganho);
      fonte.start(); lfo.start();
      parar.push(() => { fonte.stop(); lfo.stop(); fonte.disconnect(); filtro.disconnect(); nivel.disconnect(); lfo.disconnect(); modulacao.disconnect(); });
    }
  }
  return {
    ganho,
    parar: () => {
      for (const p of parar) p();
      ganho.disconnect();
    },
  };
}
