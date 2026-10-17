// Composição procedural (§2.14). Marco 12 (14/10/2026), D-056. Pura: a partir do id da fase e do clima,
// gera um laço de 4 compassos (64 passos de semicolcheia) com melodia, baixo e percussão. A mesma fase
// gera sempre a mesma música (o PRNG é semeado pelo id); a tônica é a mesma nos três climas da fase,
// para a troca de clima soar como variação da mesma peça.
// Marco 11A (16/10/2026, D-066): trilhas entre um polo casual e um dark fantasy. A `faixa` (0 casual … 4 dark, de
// `sombraDaCena`) escolhe os modos, o andamento e os timbres; entram uma voz de pad com os acordes da progressão, um
// arpejo nas faixas do meio e duas seções (A e B, 8 compassos, a B variando a melodia e o último acorde).

import { aleatorio, criarRng, escolher, hashTexto, inteiro } from '../core/rng';
import type { Clima } from './contexto-musical';

export interface Passo {
  /** Nota MIDI da melodia, ou null (pausa). */
  melodia: number | null;
  baixo: number | null;
  bumbo: boolean;
  caixa: boolean;
  chimbal: boolean;
  /** Marco 11A: acorde do pad (notas MIDI) no começo do compasso; null nos outros passos. */
  pad: readonly number[] | null;
  /** Marco 11A: nota do arpejo (faixas do meio), ou null. */
  arpejo: number | null;
}

/** Os instrumentos da faixa (o motor toca; aqui só se escolhe). */
export interface Timbres {
  melodia: OscillatorType;
  /** Corte do passa-baixa da melodia em Hz (casual brilhante, dark abafado). */
  corte: number;
  /** Duração da nota da melodia em passos (pluck curto no casual, legato no dark). */
  sustentacao: number;
  pad: OscillatorType;
  volumePad: number;
  /** Baixo segura o compasso inteiro (drone) nas faixas escuras. */
  drone: boolean;
}

export interface Composicao {
  bpm: number;
  faixa: number;
  timbres: Timbres;
  passos: Passo[];
}

export const PASSOS_POR_COMPASSO = 16;
export const COMPASSOS = 8;
export const PASSOS_POR_LACO = PASSOS_POR_COMPASSO * COMPASSOS;
export const FAIXAS = 5;

/** Modos de cada faixa, do mais claro ao mais escuro. */
const MODOS: readonly (readonly (readonly number[])[])[] = [
  // 0 casual: lídio e pentatônica maior.
  [
    [0, 2, 4, 6, 7, 9, 11],
    [0, 2, 4, 7, 9],
  ],
  // 1: mixolídio e maior.
  [
    [0, 2, 4, 5, 7, 9, 10],
    [0, 2, 4, 5, 7, 9, 11],
  ],
  // 2: dórico e pentatônica menor (o "exploração" de antes).
  [
    [0, 2, 3, 5, 7, 9, 10],
    [0, 3, 5, 7, 10],
  ],
  // 3: eólio e menor harmônica.
  [
    [0, 2, 3, 5, 7, 8, 10],
    [0, 2, 3, 5, 7, 8, 11],
  ],
  // 4 dark: frígio e um lócrio suavizado (quinta justa no lugar da diminuta).
  [
    [0, 1, 3, 5, 7, 8, 10],
    [0, 1, 3, 5, 6, 8, 10],
  ],
];

const ANDAMENTO: Readonly<Record<Clima, readonly [number, number]>> = {
  exploracao: [80, 94],
  combate: [118, 132],
  chefe: [136, 150],
};

/** Quantos passos têm nota de melodia, por clima. */
const DENSIDADE: Readonly<Record<Clima, number>> = { exploracao: 0.22, combate: 0.36, chefe: 0.46 };

const TIMBRES: readonly Timbres[] = [
  { melodia: 'square', corte: 2600, sustentacao: 1.2, pad: 'sine', volumePad: 0.04, drone: false },
  { melodia: 'square', corte: 2000, sustentacao: 1.5, pad: 'triangle', volumePad: 0.05, drone: false },
  { melodia: 'triangle', corte: 1800, sustentacao: 1.8, pad: 'triangle', volumePad: 0.06, drone: false },
  { melodia: 'sawtooth', corte: 1100, sustentacao: 2.4, pad: 'sawtooth', volumePad: 0.06, drone: true },
  { melodia: 'sawtooth', corte: 750, sustentacao: 3, pad: 'sawtooth', volumePad: 0.08, drone: true },
];

function nota(escala: readonly number[], raiz: number, grau: number): number {
  const oitava = Math.floor(grau / escala.length);
  const indice = ((grau % escala.length) + escala.length) % escala.length;
  return raiz + 12 * oitava + (escala[indice] ?? 0);
}

/** A faixa (0 a 4) de uma sombra de 0 a 1. */
export function faixaDaSombra(sombra: number): number {
  return Math.max(0, Math.min(FAIXAS - 1, Math.floor(Math.max(0, Math.min(1, sombra)) * FAIXAS)));
}

export function compor(faseId: string, clima: Clima, faixa = 2): Composicao {
  const f = Math.max(0, Math.min(FAIXAS - 1, Math.round(faixa)));
  const raiz = 45 + (hashTexto(faseId) % 8);
  const rng = criarRng(hashTexto(`${faseId}:${clima}:${f}`));
  const escala = escolher(rng, MODOS[f] ?? MODOS[2] ?? [[0, 2, 3, 5, 7, 9, 10]]);
  const [min, max] = ANDAMENTO[clima];
  // Casual mais ligeiro, dark mais arrastado (o combate continua mais rápido que a exploração).
  const bpm = Math.round(inteiro(rng, min, max) * (1.08 - 0.04 * f));
  const timbres = TIMBRES[f] ?? (TIMBRES[2] as Timbres);
  const progressao = [0, inteiro(rng, 2, 5), inteiro(rng, 3, 6), inteiro(rng, 1, 4)];
  // Seção B: a mesma progressão, com o último acorde trocado (cadência diferente).
  const acordes = [...progressao, progressao[0] ?? 0, progressao[1] ?? 3, progressao[2] ?? 4, inteiro(rng, 4, 6)];
  const arpeja = clima === 'exploracao' && f >= 1 && f <= 3;
  const passos: Passo[] = [];
  let grauMelodia = 7;
  for (let i = 0; i < PASSOS_POR_LACO; i++) {
    const compasso = Math.floor(i / PASSOS_POR_COMPASSO);
    const noCompasso = i % PASSOS_POR_COMPASSO;
    const acorde = acordes[compasso] ?? 0;
    // Na seção B, a melodia sobe um grau e fica um pouco mais densa.
    const secaoB = compasso >= COMPASSOS / 2;
    const temMelodia = aleatorio(rng) < DENSIDADE[clima] * (secaoB ? 1.2 : 1);
    if (temMelodia) grauMelodia = Math.max(acorde + 4, Math.min(acorde + 11, grauMelodia + inteiro(rng, -2, 2)));
    const ritmoBaixo = timbres.drone ? PASSOS_POR_COMPASSO : clima === 'exploracao' ? 8 : clima === 'combate' ? 4 : 2;
    const triade = [acorde, acorde + 2, acorde + 4].map((g) => nota(escala, raiz, g));
    passos.push({
      melodia: temMelodia ? nota(escala, raiz + 12, grauMelodia + (secaoB ? 1 : 0)) : null,
      baixo: noCompasso % ritmoBaixo === 0 ? nota(escala, raiz - 12, acorde) : null,
      bumbo: clima === 'exploracao' ? noCompasso === 0 : clima === 'combate' ? noCompasso % 8 === 0 : [0, 6, 8, 14].includes(noCompasso),
      caixa: clima !== 'exploracao' && (noCompasso === 4 || noCompasso === 12),
      chimbal: clima === 'exploracao' ? noCompasso % 8 === 4 : clima === 'combate' ? noCompasso % 2 === 0 : true,
      pad: noCompasso === 0 ? triade : null,
      arpejo: arpeja && noCompasso % 2 === 0 ? ((triade[(noCompasso / 2) % 3] ?? raiz) + 12) : null,
    });
  }
  return { bpm, faixa: f, timbres, passos };
}

/** Frequência em Hz de uma nota MIDI. */
export function frequencia(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}
