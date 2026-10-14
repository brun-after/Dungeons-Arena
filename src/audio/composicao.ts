// Composição procedural (§2.14). Marco 12 (14/10/2026), D-056. Pura: a partir do id da fase e do clima,
// gera um laço de 4 compassos (64 passos de semicolcheia) com melodia, baixo e percussão. A mesma fase
// gera sempre a mesma música (o PRNG é semeado pelo id); a tônica é a mesma nos três climas da fase,
// para a troca de clima soar como variação da mesma peça.

import { aleatorio, criarRng, escolher, hashTexto, inteiro } from '../core/rng';
import type { Clima } from './contexto-musical';

export interface Passo {
  /** Nota MIDI da melodia, ou null (pausa). */
  melodia: number | null;
  baixo: number | null;
  bumbo: boolean;
  caixa: boolean;
  chimbal: boolean;
}

export interface Composicao {
  bpm: number;
  passos: Passo[];
}

export const PASSOS_POR_LACO = 64;

const ESCALAS: Readonly<Record<Clima, readonly (readonly number[])[]>> = {
  // Dórico e pentatônica menor: calmo, misterioso.
  exploracao: [
    [0, 2, 3, 5, 7, 9, 10],
    [0, 3, 5, 7, 10],
  ],
  // Eólio: tenso.
  combate: [[0, 2, 3, 5, 7, 8, 10]],
  // Frígio e menor harmônica: pesado.
  chefe: [
    [0, 1, 3, 5, 7, 8, 10],
    [0, 2, 3, 5, 7, 8, 11],
  ],
};

const ANDAMENTO: Readonly<Record<Clima, readonly [number, number]>> = {
  exploracao: [78, 94],
  combate: [118, 134],
  chefe: [138, 152],
};

/** Quantos passos têm nota de melodia, por clima. */
const DENSIDADE: Readonly<Record<Clima, number>> = { exploracao: 0.22, combate: 0.38, chefe: 0.5 };

function nota(escala: readonly number[], raiz: number, grau: number): number {
  const oitava = Math.floor(grau / escala.length);
  const indice = ((grau % escala.length) + escala.length) % escala.length;
  return raiz + 12 * oitava + (escala[indice] ?? 0);
}

export function compor(faseId: string, clima: Clima): Composicao {
  const raiz = 45 + (hashTexto(faseId) % 8);
  const rng = criarRng(hashTexto(`${faseId}:${clima}`));
  const escala = escolher(rng, ESCALAS[clima]);
  const [min, max] = ANDAMENTO[clima];
  const bpm = inteiro(rng, min, max);
  const acordes = [0, inteiro(rng, 2, 5), inteiro(rng, 3, 6), inteiro(rng, 1, 4)];
  const passos: Passo[] = [];
  let grauMelodia = 7;
  for (let i = 0; i < PASSOS_POR_LACO; i++) {
    const compasso = Math.floor(i / 16);
    const noCompasso = i % 16;
    const acorde = acordes[compasso] ?? 0;
    const temMelodia = aleatorio(rng) < DENSIDADE[clima];
    if (temMelodia) grauMelodia = Math.max(acorde + 4, Math.min(acorde + 11, grauMelodia + inteiro(rng, -2, 2)));
    const ritmoBaixo = clima === 'exploracao' ? 8 : clima === 'combate' ? 4 : 2;
    passos.push({
      melodia: temMelodia ? nota(escala, raiz + 12, grauMelodia) : null,
      baixo: noCompasso % ritmoBaixo === 0 ? nota(escala, raiz - 12, acorde) : null,
      bumbo: clima === 'exploracao' ? noCompasso === 0 : clima === 'combate' ? noCompasso % 8 === 0 : [0, 6, 8, 14].includes(noCompasso),
      caixa: clima !== 'exploracao' && (noCompasso === 4 || noCompasso === 12),
      chimbal: clima === 'exploracao' ? noCompasso % 8 === 4 : clima === 'combate' ? noCompasso % 2 === 0 : true,
    });
  }
  return { bpm, passos };
}

/** Frequência em Hz de uma nota MIDI. */
export function frequencia(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}
