// Sintetizador (§2.14). Marco 12 (14/10/2026), D-056. Todos os sons do jogo nascem aqui, por Web Audio:
// osciladores, ruído e envelopes. Nenhum arquivo, nenhuma licença de terceiros, nenhum host externo.
// Cada receita agenda os próprios nós e se desliga sozinha ao fim.

import type { SomId } from './mapeamento';

/** Duração de cada som, para o teto de vozes do limitador. */
export const DURACAO_MS: Readonly<Record<SomId, number>> = {
  golpe: 120,
  acerto: 140,
  critico: 260,
  falha: 160,
  conjuracao: 320,
  magia: 260,
  projetil: 220,
  explosao: 650,
  cura: 360,
  moeda: 140,
  coleta: 180,
  passo: 50,
  porta: 420,
  armadilha: 300,
  invocacao: 520,
  morte: 620,
  nivel: 520,
  clique: 30,
  recusa: 220,
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
    semente = (semente * 1103515245 + 12345) >>> 0;
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

/** Toca um efeito sonoro em `destino`, agora, com o fator de tom dado. */
export function tocarEfeito(ctx: BaseAudioContext, destino: AudioNode, som: SomId, tom: number): void {
  const t: Tom = { ctx, destino, t0: ctx.currentTime, tom };
  switch (som) {
    case 'golpe':
      chiado(t, 'bandpass', 1400, 600, 0.09, 0.5);
      osc(t, 'sine', 140, 70, 0.11, 0.5);
      break;
    case 'acerto':
      osc(t, 'square', 220, 80, 0.13, 0.25);
      chiado(t, 'lowpass', 2000, 400, 0.08, 0.3);
      break;
    case 'critico':
      osc(t, 'square', 260, 70, 0.16, 0.3);
      osc(t, 'triangle', 1320, 1320, 0.22, 0.25, 0.03);
      chiado(t, 'highpass', 3000, 1500, 0.1, 0.25);
      break;
    case 'falha':
      chiado(t, 'highpass', 2500, 900, 0.15, 0.2);
      break;
    case 'conjuracao':
      osc(t, 'triangle', 300, 900, 0.3, 0.12);
      break;
    case 'magia':
      osc(t, 'sine', 660, 990, 0.25, 0.22);
      osc(t, 'triangle', 330, 495, 0.25, 0.12);
      break;
    case 'projetil':
      chiado(t, 'bandpass', 600, 3000, 0.2, 0.18);
      break;
    case 'explosao':
      chiado(t, 'lowpass', 1600, 90, 0.62, 0.7);
      osc(t, 'sine', 90, 40, 0.5, 0.6);
      break;
    case 'cura':
      for (const [i, f] of [523, 659, 784].entries()) osc(t, 'triangle', f, f, 0.16, 0.18, i * 0.07);
      break;
    case 'moeda':
      osc(t, 'square', 988, 988, 0.06, 0.12);
      osc(t, 'square', 1319, 1319, 0.08, 0.12, 0.06);
      break;
    case 'coleta':
      osc(t, 'triangle', 660, 880, 0.16, 0.22);
      break;
    case 'passo':
      chiado(t, 'lowpass', 500, 300, 0.045, 0.12);
      break;
    case 'porta':
      osc(t, 'sawtooth', 110, 90, 0.4, 0.15);
      chiado(t, 'lowpass', 700, 200, 0.35, 0.15);
      break;
    case 'armadilha':
      osc(t, 'square', 180, 90, 0.12, 0.3);
      chiado(t, 'highpass', 4000, 1500, 0.28, 0.25, 0.02);
      break;
    case 'invocacao':
      osc(t, 'sine', 200, 800, 0.5, 0.25);
      osc(t, 'triangle', 300, 1200, 0.5, 0.1);
      break;
    case 'morte':
      osc(t, 'sawtooth', 220, 55, 0.6, 0.22);
      break;
    case 'nivel':
      for (const [i, f] of [523, 659, 784, 1047].entries()) osc(t, 'triangle', f, f, 0.18, 0.22, i * 0.09);
      break;
    case 'clique':
      osc(t, 'sine', 1200, 1200, 0.025, 0.12);
      break;
    case 'recusa':
      osc(t, 'square', 150, 150, 0.08, 0.15);
      osc(t, 'square', 120, 120, 0.1, 0.15, 0.11);
      break;
  }
}

// --- Instrumentos da música ---

export function tocarNota(ctx: BaseAudioContext, destino: AudioNode, quando: number, freq: number, duracao: number, tipo: OscillatorType, pico: number): void {
  osc({ ctx, destino, t0: quando, tom: 1 }, tipo, freq, freq, duracao, pico);
}

/** Marco 11A: nota com passa-baixa (casual brilhante, dark abafado). */
export function tocarNotaFiltrada(ctx: BaseAudioContext, destino: AudioNode, quando: number, freq: number, duracao: number, tipo: OscillatorType, pico: number, corte: number): void {
  const filtro = ctx.createBiquadFilter();
  filtro.type = 'lowpass';
  filtro.frequency.setValueAtTime(corte, quando);
  filtro.Q.value = 0.7;
  filtro.connect(destino);
  osc({ ctx, destino: filtro, t0: quando, tom: 1 }, tipo, freq, freq, duracao, pico);
  setTimeout(() => {
    filtro.disconnect();
  }, (quando - ctx.currentTime + duracao + 0.2) * 1000);
}

/** Marco 11A: pad — dois osciladores levemente desafinados por nota, com ataque e soltura lentos. */
export function tocarPad(ctx: BaseAudioContext, destino: AudioNode, quando: number, freqs: readonly number[], duracao: number, tipo: OscillatorType, pico: number): void {
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
      o.type = tipo;
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
  osc({ ctx, destino, t0: quando, tom: 1 }, 'sine', 150, 45, 0.18, 0.7);
}

export function tocarCaixa(ctx: BaseAudioContext, destino: AudioNode, quando: number): void {
  chiado({ ctx, destino, t0: quando, tom: 1 }, 'highpass', 1800, 1200, 0.12, 0.35);
}

export function tocarChimbal(ctx: BaseAudioContext, destino: AudioNode, quando: number): void {
  chiado({ ctx, destino, t0: quando, tom: 1 }, 'highpass', 7000, 7000, 0.035, 0.12);
}

/** Som ambiente em laço (fontes sonoras da fase, §2.14): devolve o ganho e como parar. */
export type SomAmbiente = 'fogo' | 'agua' | 'vento' | 'goteira';
export const SONS_AMBIENTE: readonly SomAmbiente[] = ['fogo', 'agua', 'vento', 'goteira'];

export function criarAmbiente(ctx: BaseAudioContext, destino: AudioNode, tipo: SomAmbiente): { ganho: GainNode; parar: () => void } {
  const ganho = ctx.createGain();
  ganho.gain.value = 0;
  ganho.connect(destino);
  const parar: (() => void)[] = [];
  if (tipo === 'goteira') {
    // Pingos esparsos, agendados em JS (o laço segue enquanto o contexto roda).
    let vivo = true;
    const pingar = () => {
      if (!vivo) return;
      osc({ ctx, destino: ganho, t0: ctx.currentTime, tom: 1 }, 'sine', 1300, 700, 0.12, 0.3);
      setTimeout(pingar, 1200 + Math.random() * 1800);
    };
    pingar();
    parar.push(() => {
      vivo = false;
    });
  } else {
    const fonte = ctx.createBufferSource();
    fonte.buffer = ruido(ctx);
    fonte.loop = true;
    const filtro = ctx.createBiquadFilter();
    filtro.type = tipo === 'vento' ? 'bandpass' : 'lowpass';
    filtro.frequency.value = tipo === 'fogo' ? 900 : tipo === 'agua' ? 500 : 400;
    const lfo = ctx.createOscillator();
    const lfoGanho = ctx.createGain();
    lfo.frequency.value = tipo === 'fogo' ? 7 : tipo === 'agua' ? 0.3 : 0.15;
    lfoGanho.gain.value = tipo === 'fogo' ? 300 : 150;
    lfo.connect(lfoGanho);
    lfoGanho.connect(filtro.frequency);
    const nivel = ctx.createGain();
    nivel.gain.value = tipo === 'vento' ? 0.5 : 0.35;
    fonte.connect(filtro);
    filtro.connect(nivel);
    nivel.connect(ganho);
    fonte.start();
    lfo.start();
    parar.push(() => {
      fonte.stop();
      lfo.stop();
    });
  }
  return {
    ganho,
    parar: () => {
      for (const p of parar) p();
      ganho.disconnect();
    },
  };
}
