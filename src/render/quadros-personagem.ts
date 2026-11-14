// Os quadros dos personagens pré-renderizados (marco 32, 31/10/2026, D-131): a direção pelo rumo e o quadro de cada
// estado pelo tempo. À parte de personagens-3d.ts (que carrega os atlas pelo Vite), para quem só desenha.

import type { Golpe } from './caminhada';

/** Os golpes de cada tipo de arma no atlas das classes (tools/sprites/receitas.ts). */
export type GolpeDoAtlas = 'golpeCorte' | 'golpePesado' | 'golpeEsmagar' | 'golpeLeve' | 'golpeEstocada' | 'golpeDisparo' | 'golpeArremesso' | 'golpeGiro';
/** Os estados do atlas; o golpe e a conjuração andando levam o passo nas pernas (tools/sprites/receitas.ts). */
/** Marco 40 (13/11/2026): os estados do movimento da classe (tools/sprites/receitas.ts, MOVIMENTOS). */
export type MovimentoDoAtlas = 'correr' | 'saltar' | 'voar' | 'montar';
export type EstadoPersonagem = 'parado' | 'andar' | 'golpe' | 'conjurar' | 'morte' | 'andarGolpe' | 'andarConjurar' | GolpeDoAtlas | MovimentoDoAtlas;

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
  correr: 'andar',
  saltar: 'andar',
  voar: 'parado',
  montar: 'parado',
};

/** Quanto do golpe de arma a preparação mostra (o recuo antes do golpe, no lugar da pose de magia). */
export const RECUO_DO_GOLPE = 0.4;

/**
 * Marco 32 (31/10/2026, D-131): o estado do quadro. Quem golpeia ou conjura andando dá passos (antes o corpo inteiro
 * ficava na pose do golpe e parecia arrastado).
 */
export function estadoDoPersonagem(q: { morto: boolean; golpeando: boolean; conjurando: boolean; andando: boolean; golpe: Golpe | null; fisico?: boolean; movimento?: MovimentoDoAtlas | null | undefined }): EstadoPersonagem {
  if (q.morto) return 'morte';
  // Marco 40 (13/11/2026): o movimento da classe tem a pose dele (o golpe e a magia ainda saem com a pose deles).
  if (q.movimento && !q.golpeando && !q.conjurando) return q.movimento;
  // O golpe de arma tem a animação dela (e a preparação é o recuo dele); a magia estende a mão.
  const daArma = q.golpe ? GOLPE_DO_ATLAS[q.golpe] : null;
  if ((q.golpeando || q.conjurando) && daArma) return daArma;
  // Marco 37 (05/11/2026): o golpe físico sem arma de classe (as criaturas) também prepara no golpe, não na magia.
  if (q.conjurando && q.fisico) return q.andando ? 'andarGolpe' : 'golpe';
  if (q.golpeando) return q.andando ? 'andarGolpe' : 'golpe';
  if (q.conjurando) return q.andando ? 'andarConjurar' : 'conjurar';
  return q.andando ? 'andar' : 'parado';
}

/** O estado segue a fração (o golpe), e não o relógio? */
export const peloGolpe = (estado: EstadoPersonagem): boolean => SEM_PASSO[estado] === 'golpe';

const DIRECOES = 8;
/** Quanto dura cada quadro dos ciclos (ms). */
const MS_QUADRO: Readonly<Record<'parado' | 'andar' | 'conjurar' | 'morte' | 'andarConjurar' | MovimentoDoAtlas, number>> = {
  parado: 220, andar: 95, conjurar: 110, morte: 110, andarConjurar: 110, correr: 75, saltar: 110, voar: 140, montar: 170,
};
const CICLICOS: ReadonlySet<EstadoPersonagem> = new Set(['parado', 'andar', 'conjurar', 'andarConjurar', 'correr', 'saltar', 'montar']);
/**
 * 14/11/2026: o voo bate os braços uma vez (do começo do nado até os braços junto ao corpo) e plana nessa pose; o tempo
 * do voo é o desde o começo dele. `FRACAO_PLANAR`: onde o clipe do nado tem os braços colados (medida no GLB).
 */
export const BATIDA_DO_VOO_MS = 1000;
export const FRACAO_PLANAR = 0.76;

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
  if (estado === 'voar') return Math.min(n - 1, Math.floor((Math.max(0, tMs) / BATIDA_DO_VOO_MS) * n));
  if (CICLICOS.has(estado)) return Math.floor(tMs / MS_QUADRO[estado as keyof typeof MS_QUADRO]) % n;
  return Math.min(n - 1, Math.max(0, Math.floor((fracao ?? 0) * n)));
}

// --- Marco 37 (05/11/2026): o tempo do golpe. Antes, o clipe inteiro (preparação, golpe e volta, 1 a 1,5 s) cabia em
// 0,3–0,5 s depois do lançamento e recomeçava do zero ao lançar: um chacoalhão rápido. Agora a preparação acompanha a
// conjuração (o recuo cresce devagar e o golpe acelera até o impacto, que cai no lançamento, quando o dano acontece),
// o impacto segura um instante (o peso do golpe) e a volta sai sem pressa. Os pontos de cada clipe foram medidos pela
// velocidade da mão (o pico é o golpe; o mínimo antes dele, o fim da carga).

/** O clipe do golpe: a duração (s), o fim da carga e o impacto (frações), e o deslocamento dos clipes em laço. */
export interface PerfilDoGolpe {
  dur: number;
  carga: number;
  impacto: number;
  /** Clipes em laço (o machado de lenhador): onde começa a preparação, somado com volta ao início. */
  desloc?: number;
}

export const PERFIS_DE_GOLPE: Readonly<Record<string, PerfilDoGolpe>> = {
  Sword_Attack: { dur: 1.53, carga: 0.15, impacto: 0.32 },
  Sword_Regular_A: { dur: 0.43, carga: 0.5, impacto: 0.68 },
  Sword_Regular_B: { dur: 0.53, carga: 0.4, impacto: 0.58 },
  Sword_Regular_C: { dur: 2, carga: 0.25, impacto: 0.36 },
  TreeChopping_Loop: { dur: 0.97, carga: 0.5, impacto: 0.68, desloc: 0.5 },
  Melee_Hook: { dur: 0.47, carga: 0.42, impacto: 0.6 },
  Punch_Cross: { dur: 1, carga: 0.12, impacto: 0.25 },
  Punch_Jab: { dur: 0.87, carga: 0.13, impacto: 0.23 },
  Pistol_Shoot: { dur: 0.63, carga: 0, impacto: 0.06 },
  OverhandThrow: { dur: 1.33, carga: 0.23, impacto: 0.32 },
  Spell_Simple_Shoot: { dur: 0.5, carga: 0, impacto: 0.2 },
  Shield_OneShot: { dur: 0.83, carga: 0.05, impacto: 0.17 },
  Zombie_Scratch: { dur: 1.8, carga: 0.25, impacto: 0.38 },
};
/** O perfil das criaturas sem clipe medido (o lobo, a aranha, o esqueleto). */
export const PERFIL_PADRAO: PerfilDoGolpe = { dur: 1, carga: 0.3, impacto: 0.45 };

/** O clipe de cada golpe de arma no atlas das classes (tools/sprites/receitas.ts VARIANTES). */
const CLIPE_DO_ATLAS: Readonly<Partial<Record<EstadoPersonagem, string>>> = {
  golpeCorte: 'Sword_Regular_A', golpePesado: 'Sword_Attack', golpeEsmagar: 'TreeChopping_Loop', golpeLeve: 'Melee_Hook',
  golpeEstocada: 'Punch_Jab', golpeDisparo: 'Pistol_Shoot', golpeArremesso: 'OverhandThrow', golpeGiro: 'Sword_Regular_A',
};
/** O clipe do golpe genérico de cada modelo no atlas (as receitas; o resto fica com o perfil padrão). */
const GOLPE_DO_MODELO: Readonly<Record<string, string>> = {
  guerreiro: 'Sword_Attack', aventureiro: 'Sword_Attack', mago: 'Spell_Simple_Shoot', arqueiro: 'Spell_Simple_Shoot',
  necromante: 'Spell_Simple_Shoot', goblin: 'Sword_Attack', orc: 'Sword_Attack', troll: 'Sword_Attack', sentinela: 'Sword_Attack',
  vampiro: 'Zombie_Scratch', sombra: 'Zombie_Scratch', demonio: 'Punch_Cross', cultista: 'Spell_Simple_Shoot', fada: 'Spell_Simple_Shoot',
};

/** O perfil do golpe que o atlas do modelo mostra no estado. */
export function perfilDoAtlas(estado: EstadoPersonagem, modelo: string): PerfilDoGolpe {
  const clipe = CLIPE_DO_ATLAS[estado] ?? (Object.hasOwn(GOLPE_DO_MODELO, modelo) ? GOLPE_DO_MODELO[modelo] : undefined);
  return (clipe ? PERFIS_DE_GOLPE[clipe] : undefined) ?? PERFIL_PADRAO;
}

/** O instante em que o golpe segura no impacto (ms). */
export const PAUSA_DO_IMPACTO_MS = 70;
/** O golpe sem conjuração visível desce do recuo ao impacto nesse tempo (ms). */
const GOLPE_RAPIDO_MS = 120;
/** Na preparação, a fração da conjuração que é carga (o resto é o golpe acelerando até o impacto). */
const CARGA = 0.7;

/** A volta depois do impacto (ms): o resto do clipe no tempo dele, sem ficar arrastada nem sumir. */
export function voltaDoGolpe(p: PerfilDoGolpe): number {
  return Math.min(620, Math.max(260, (1 - p.impacto) * p.dur * 1000));
}

/** Quanto o golpe fica na tela depois do lançamento (ms). */
export function duracaoVisualDoGolpe(p: PerfilDoGolpe, comPreparo: boolean): number {
  return (comPreparo ? 0 : GOLPE_RAPIDO_MS) + PAUSA_DO_IMPACTO_MS + voltaDoGolpe(p);
}

const saida = (t: number) => 1 - (1 - t) * (1 - t);
const entrada = (t: number) => t * t;
const em01 = (t: number) => Math.min(1, Math.max(0, t));

/**
 * A fração do clipe no instante do golpe: `preparo` (0 a 1 da conjuração) enquanto prepara; `desdeMs` desde o
 * lançamento depois dele. `comPreparo`: a conjuração foi vista (o golpe já desceu até o impacto); sem ela, o golpe
 * desce rápido depois do lançamento.
 */
export function progressoDoGolpe(p: PerfilDoGolpe, preparo: number | null, desdeMs: number | null, comPreparo = true): number {
  let x: number;
  if (desdeMs === null) {
    const t = em01(preparo ?? 0);
    x = t < CARGA ? p.carga * saida(t / CARGA) : p.carga + (p.impacto - p.carga) * entrada((t - CARGA) / (1 - CARGA));
  } else {
    let t = desdeMs;
    if (!comPreparo && t < GOLPE_RAPIDO_MS) x = p.carga + (p.impacto - p.carga) * entrada(t / GOLPE_RAPIDO_MS);
    else {
      if (!comPreparo) t -= GOLPE_RAPIDO_MS;
      x = t < PAUSA_DO_IMPACTO_MS ? p.impacto : p.impacto + (1 - p.impacto) * saida(em01((t - PAUSA_DO_IMPACTO_MS) / voltaDoGolpe(p)));
    }
  }
  const real = x + (p.desloc ?? 0);
  return Math.min(0.999, real > 1 ? real - 1 : real);
}
