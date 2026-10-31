// Os quadros dos personagens pré-renderizados (marco 32, 31/10/2026, D-131): a direção pelo rumo e o quadro de cada
// estado pelo tempo. À parte de personagens-3d.ts (que carrega os atlas pelo Vite), para quem só desenha.

import type { Golpe } from './caminhada';

/** Os golpes de cada tipo de arma no atlas das classes (tools/sprites/receitas.ts). */
export type GolpeDoAtlas = 'golpeCorte' | 'golpePesado' | 'golpeEsmagar' | 'golpeLeve' | 'golpeEstocada' | 'golpeDisparo' | 'golpeArremesso' | 'golpeGiro';
/** Os estados do atlas; o golpe e a conjuração andando levam o passo nas pernas (tools/sprites/receitas.ts). */
export type EstadoPersonagem = 'parado' | 'andar' | 'golpe' | 'conjurar' | 'morte' | 'andarGolpe' | 'andarConjurar' | GolpeDoAtlas;

/**
 * Marco 32 (31/10/2026, D-131): o golpe do atlas de cada golpe de arma (null: a leitura do tomo, que usa o golpe de
 * magia da receita).
 */
const GOLPE_DO_ATLAS: Readonly<Record<Golpe, GolpeDoAtlas | null>> = {
  corte: 'golpeCorte',
  corte_pesado: 'golpePesado',
  contundente: 'golpeEsmagar',
  contundente_leve: 'golpeLeve',
  estocada: 'golpeEstocada',
  estocada_rapida: 'golpeEstocada',
  disparo: 'golpeDisparo',
  arremesso: 'golpeArremesso',
  giro: 'golpeGiro',
  leitura: null,
};

/** O estado de reserva (o atlas sem os estados andando ou sem os golpes de arma: os monstros). */
export const SEM_PASSO: Readonly<Record<EstadoPersonagem, EstadoPersonagem>> = {
  parado: 'parado',
  andar: 'andar',
  golpe: 'golpe',
  conjurar: 'conjurar',
  morte: 'morte',
  andarGolpe: 'golpe',
  andarConjurar: 'conjurar',
  golpeCorte: 'golpe',
  golpePesado: 'golpe',
  golpeEsmagar: 'golpe',
  golpeLeve: 'golpe',
  golpeEstocada: 'golpe',
  golpeDisparo: 'golpe',
  golpeArremesso: 'golpe',
  golpeGiro: 'golpe',
};

/** Quanto do golpe de arma a preparação mostra (o recuo antes do golpe, no lugar da pose de magia). */
export const RECUO_DO_GOLPE = 0.4;

/**
 * Marco 32 (31/10/2026, D-131): o estado do quadro. Quem golpeia ou conjura andando dá passos (antes o corpo inteiro
 * ficava na pose do golpe e parecia arrastado).
 */
export function estadoDoPersonagem(q: { morto: boolean; golpeando: boolean; conjurando: boolean; andando: boolean; golpe: Golpe | null }): EstadoPersonagem {
  if (q.morto) return 'morte';
  // O golpe de arma tem a animação dela (e a preparação é o recuo dele); a magia estende a mão.
  const daArma = q.golpe ? GOLPE_DO_ATLAS[q.golpe] : null;
  if ((q.golpeando || q.conjurando) && daArma) return daArma;
  if (q.golpeando) return q.andando ? 'andarGolpe' : 'golpe';
  if (q.conjurando) return q.andando ? 'andarConjurar' : 'conjurar';
  return q.andando ? 'andar' : 'parado';
}

/** O estado segue a fração (o golpe), e não o relógio? */
export const peloGolpe = (estado: EstadoPersonagem): boolean => SEM_PASSO[estado] === 'golpe';

const DIRECOES = 8;
/** Quanto dura cada quadro dos ciclos (ms). */
const MS_QUADRO: Readonly<Record<'parado' | 'andar' | 'conjurar' | 'morte' | 'andarConjurar', number>> = { parado: 220, andar: 95, conjurar: 110, morte: 110, andarConjurar: 110 };

/** A direção do atlas para o rumo na grade (rad, de +x para +y). */
export function direcaoDoAngulo(angulo: number): number {
  const d = Math.round(angulo / (Math.PI / 4));
  return ((d % DIRECOES) + DIRECOES) % DIRECOES;
}

/**
 * O quadro do estado: os ciclos (parado, andar, conjurar) pelo relógio; o golpe pela fração (0 a 1) dele; a morte
 * pelo tempo desde a queda, parando no último.
 */
export function quadroDoEstado(estado: EstadoPersonagem, n: number, tMs: number, fracao: number | null): number {
  if (estado === 'morte') return Math.min(n - 1, Math.floor(tMs / MS_QUADRO.morte));
  if (estado === 'parado' || estado === 'andar' || estado === 'conjurar' || estado === 'andarConjurar') return Math.floor(tMs / MS_QUADRO[estado]) % n;
  return Math.min(n - 1, Math.max(0, Math.floor((fracao ?? 0) * n)));
}
