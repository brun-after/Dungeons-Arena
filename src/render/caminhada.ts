// Caminhada procedural por fatias (§2.16). Marco 13 (14/10/2026), D-058. Pura e testável.
// O token é uma imagem única de corpo inteiro, fatiada em 18 tiras horizontais; a pose diz quanto cada tira
// se desloca. Unidades: deslocamentos em fração da largura (x) ou da altura (y) do token; tempo em ms de
// apresentação (é visual: nunca entra na simulação).
// Tira 0 é a de cima; a tira i cobre a altura de i/18 a (i+1)/18 a partir do topo.

import type { GolpeDeArma } from '../progression/armas';

export type EstiloCaminhada = 'quique' | 'passada' | 'marcha' | 'flutuar' | 'deslizar';

/** Marco 24 (25/10/2026, D-098): o golpe da arma, ou o giro (Redemoinho e afins). */
export type Golpe = GolpeDeArma | 'giro';

export const TIRAS = 18;

interface ParametrosBipede {
  cadenciaMs: number;
  amplitude: number;
  balanco: number;
  /** Fração da altura, a partir dos pés, abaixo da qual a tira vira perna (duas colunas). */
  corte: number;
  inclinacao: number;
  compressao: number;
}

/** Parâmetros da tabela da §2.16. */
export const PARAMETROS = {
  passada: { cadenciaMs: 380, amplitude: 0.1, balanco: 0.05, corte: 0.42, inclinacao: 0.018, compressao: 0 },
  marcha: { cadenciaMs: 540, amplitude: 0.13, balanco: 0.08, corte: 0.4, inclinacao: 0.018, compressao: 0.05 },
  flutuar: { cadenciaPairarMs: 1400, cadenciaAsasMs: 760, amplitude: 0.05 },
  deslizar: { cadenciaMs: 520, corte: 0.45, amplitude: 0.09 },
  quique: { cadenciaMs: 420, amplitude: 0.06, respiracaoMs: 2200 },
  ataque: { duracaoMs: 400, empurrao: 0.2, esticamento: 1.06 },
} as const satisfies { passada: ParametrosBipede; marcha: ParametrosBipede } & Record<string, unknown>;

export interface EntradaPose {
  estilo: EstiloCaminhada;
  /** Tempo de apresentação, em ms. */
  tMs: number;
  andando: boolean;
  /** ms desde o início do ataque (null fora do ataque). */
  ataqueMs: number | null;
  /** Desloca a fase para criaturas iguais não andarem em uníssono. */
  fase: number;
  /** Atalho de qualidade (§4.10): um desenho só, sem tiras. */
  tiras: boolean;
  /** Movimento reduzido: pose parada. */
  reduzido: boolean;
  /** Marco 24 (D-098): a natureza do golpe (null: o empurrão genérico de sempre). */
  golpe?: Golpe | null;
  /** Fração da conjuração em curso, de 0 a 1 (null: sem conjuração) — a preparação do golpe. */
  preparo?: number | null;
  /**
   * Marco 26 (25/10/2026, D-108): o modelo mexe braços e pernas nos quadros do atlas; as tiras de baixo não se
   * dividem em duas colunas (as pernas não andam duas vezes) e a bainha não balança por fatia.
   */
  membros?: boolean;
}

export interface PoseTira {
  /** Deslocamento da tira inteira (acima do corte) ou de cada coluna (pernas). */
  dx: number;
  dy: number;
  /** Abaixo do corte do bípede: a tira se divide em duas colunas com deslocamentos próprios. */
  colunas: { esquerda: { dx: number; dy: number }; direita: { dx: number; dy: number } } | null;
}

export interface Pose {
  /** Elevação global (fração da altura; negativo sobe). */
  dy: number;
  /** Empurrão do ataque, na direção do olhar (fração da largura). */
  empurrao: number;
  escalaX: number;
  escalaY: number;
  rotacao: number;
  /** Vazio quando o atalho de qualidade está ligado. */
  tiras: PoseTira[];
  /**
   * Marco 24 (D-098): a arma em torno da mão — rotação em rad (positiva gira para a frente) e deslocamento em fração
   * do token. Ausente: a arma parada na mão.
   */
  arma?: { rotacao: number; dx: number; dy: number };
  /** O giro do corpo em rad (Redemoinho): de cima gira de verdade; em pé, o corpo vira de lado e volta. */
  giro?: number;
}

const POSE_NEUTRA: Pose = { dy: 0, empurrao: 0, escalaX: 1, escalaY: 1, rotacao: 0, tiras: [] };

/** Altura da tira i a partir dos pés (0 nos pés, 1 no topo), pelo meio da tira. */
export function alturaDaTira(i: number): number {
  return 1 - (i + 0.5) / TIRAS;
}

const onda = (tMs: number, cadenciaMs: number, fase: number) => Math.sin(((tMs / cadenciaMs) * 2 + fase) * Math.PI);

/**
 * Marco 26 (D-108): o balanço da passada, de −1 a 1, na mesma fase do quique e do contrabalanço das tiras. Escolhe o
 * quadro de braços e pernas (modelos/membros.ts `quadroDoBalanco`).
 */
export function balancoDaPassada(estilo: EstiloCaminhada, tMs: number, fase: number): number {
  const cadencia =
    estilo === 'passada' ? PARAMETROS.passada.cadenciaMs
    : estilo === 'marcha' ? PARAMETROS.marcha.cadenciaMs
    : estilo === 'deslizar' ? PARAMETROS.deslizar.cadenciaMs
    : estilo === 'quique' ? PARAMETROS.quique.cadenciaMs
    : PARAMETROS.flutuar.cadenciaAsasMs;
  return onda(tMs, cadencia, fase);
}

function tirasVazias(): PoseTira[] {
  return Array.from({ length: TIRAS }, () => ({ dx: 0, dy: 0, colunas: null }));
}

/** Motor genérico: parado (respiração) e ataque (empurrão e esticamento), iguais para todos os estilos. */
function generico(e: EntradaPose): Pose {
  const tiras = e.tiras ? tirasVazias() : [];
  if (e.ataqueMs !== null && e.ataqueMs < PARAMETROS.ataque.duracaoMs) {
    const f = Math.sin((e.ataqueMs / PARAMETROS.ataque.duracaoMs) * Math.PI);
    const estica = 1 + (PARAMETROS.ataque.esticamento - 1) * f;
    return { dy: 0, empurrao: PARAMETROS.ataque.empurrao * f, escalaX: 1 / Math.sqrt(estica), escalaY: estica, rotacao: 0, tiras };
  }
  const respira = 1 + 0.012 * onda(e.tMs, PARAMETROS.quique.respiracaoMs, e.fase);
  return { dy: 0, empurrao: 0, escalaX: 1, escalaY: respira, rotacao: 0, tiras };
}

function bipede(e: EntradaPose, p: ParametrosBipede): Pose {
  const s = onda(e.tMs, p.cadenciaMs, e.fase);
  // Duas elevações por ciclo (um passo de cada perna).
  const quique = Math.abs(s);
  const pose: Pose = {
    dy: -p.balanco * 0.25 * quique,
    empurrao: 0,
    escalaX: 1,
    escalaY: 1 - p.compressao * (1 - quique),
    rotacao: p.inclinacao,
    tiras: [],
  };
  if (!e.tiras) return pose;
  pose.tiras = Array.from({ length: TIRAS }, (_, i) => {
    const h = alturaDaTira(i);
    if (h < p.corte && e.membros) return { dx: 0, dy: 0, colunas: null };
    if (h < p.corte) {
      // Pernas: cada coluna com elevação e deslocamento em fase oposta (π).
      const peso = 1 - h / p.corte;
      const dx = p.amplitude * s * peso;
      const dy = -p.amplitude * 0.5 * Math.max(0, s) * peso;
      const dyOposta = -p.amplitude * 0.5 * Math.max(0, -s) * peso;
      return { dx: 0, dy: 0, colunas: { esquerda: { dx, dy }, direita: { dx: -dx, dy: dyOposta } } };
    }
    // Acima do corte: contrabalanço (oposto ao passo), mais forte no tronco; a faixa da arma (topo) amortecida.
    const amortecida = h > 0.8 ? 0.5 : 1;
    return { dx: -p.balanco * s * 0.5 * amortecida * (h - p.corte), dy: 0, colunas: null };
  });
  return pose;
}

function quique(e: EntradaPose): Pose {
  const s = onda(e.tMs, PARAMETROS.quique.cadenciaMs, e.fase);
  const pose: Pose = { dy: -PARAMETROS.quique.amplitude * Math.abs(s), empurrao: 0, escalaX: 1 + 0.03 * (1 - Math.abs(s)), escalaY: 1 - 0.03 * (1 - Math.abs(s)), rotacao: 0, tiras: [] };
  if (e.tiras) pose.tiras = Array.from({ length: TIRAS }, (_, i) => ({ dx: 0.04 * s * alturaDaTira(i), dy: 0, colunas: null }));
  return pose;
}

function flutuar(e: EntradaPose): Pose {
  const p = PARAMETROS.flutuar;
  const pairar = onda(e.tMs, p.cadenciaPairarMs, e.fase);
  const asas = onda(e.tMs, p.cadenciaAsasMs, e.fase);
  const pose: Pose = { dy: -p.amplitude * (0.5 + 0.5 * pairar), empurrao: 0, escalaX: 1 + 0.02 * asas, escalaY: 1, rotacao: 0, tiras: [] };
  if (e.tiras) pose.tiras = Array.from({ length: TIRAS }, (_, i) => ({ dx: 0.015 * asas * (1 - alturaDaTira(i)), dy: 0, colunas: null }));
  return pose;
}

function deslizar(e: EntradaPose): Pose {
  const p = PARAMETROS.deslizar;
  const s = onda(e.tMs, p.cadenciaMs, e.fase);
  const pose: Pose = { dy: 0, empurrao: 0, escalaX: 1, escalaY: 1, rotacao: 0.01 * s, tiras: [] };
  if (!e.tiras) return pose;
  // A bainha como pêndulo: abaixo do corte, quanto mais perto do chão, mais balança.
  pose.tiras = Array.from({ length: TIRAS }, (_, i) => {
    const h = alturaDaTira(i);
    return { dx: h < p.corte && !e.membros ? p.amplitude * s * (1 - h / p.corte) : 0, dy: 0, colunas: null };
  });
  return pose;
}

// --- Marco 24 (25/10/2026, D-098): o golpe de cada arma. A preparação acontece na conjuração (a arma recua ou sobe);
// o golpe sai no lançamento, quando o dano acontece. Ângulos em rad, em torno da mão; positivo leva a arma para a frente.

/** Quanto dura cada golpe depois do lançamento, em ms. */
export const DURACAO_GOLPE: Readonly<Record<Golpe, number>> = {
  corte: 380,
  corte_pesado: 520,
  contundente: 540,
  contundente_leve: 400,
  estocada: 340,
  estocada_rapida: 420,
  disparo: 320,
  giro: 720,
  // Marco 27 (D-126): o arremesso do bumerangue e a leitura do tomo.
  arremesso: 380,
  leitura: 420,
};

export function duracaoDoGolpe(golpe: Golpe | null | undefined): number {
  return golpe ? DURACAO_GOLPE[golpe] : PARAMETROS.ataque.duracaoMs;
}

const suave = (t: number) => t * t * (3 - 2 * t);
const entre01 = (t: number) => Math.min(1, Math.max(0, t));
/** Vai de `de` até `ate` na janela [a, b] de t, com suavização. */
const trecho = (t: number, a: number, b: number, de: number, ate: number) => de + (ate - de) * suave(entre01((t - a) / (b - a)));

interface Arco {
  /** Ângulo da arma no fim da preparação e no fim do golpe. */
  alto: number;
  baixo: number;
  /** Até onde do tempo o golpe desce (o resto é a volta). */
  impacto: number;
  empurrao: number;
  /** Inclinação do corpo na preparação (negativa: para trás) e no golpe. */
  recua: number;
  inclina: number;
  /** Achatamento no impacto (esmagar). */
  esmaga: number;
}

const ARCOS: Readonly<Record<'corte' | 'corte_pesado' | 'contundente' | 'contundente_leve', Arco>> = {
  corte: { alto: -1.25, baixo: 1.7, impacto: 0.32, empurrao: 0.22, recua: -0.08, inclina: 0.12, esmaga: 0 },
  corte_pesado: { alto: -2.3, baixo: 2.0, impacto: 0.3, empurrao: 0.26, recua: -0.14, inclina: 0.22, esmaga: 0.06 },
  contundente: { alto: -2.5, baixo: 2.1, impacto: 0.28, empurrao: 0.16, recua: -0.12, inclina: 0.18, esmaga: 0.12 },
  contundente_leve: { alto: -1.3, baixo: 1.25, impacto: 0.3, empurrao: 0.12, recua: -0.06, inclina: 0.08, esmaga: 0.04 },
};

function poseDoArco(a: Arco, preparo: number | null, t: number | null, tiras: PoseTira[]): Pose {
  if (t === null) {
    const p = suave(entre01(preparo ?? 0));
    return { dy: 0, empurrao: -0.04 * p, escalaX: 1, escalaY: 1 + 0.03 * p, rotacao: a.recua * p, tiras, arma: { rotacao: a.alto * p, dx: 0, dy: -0.02 * p } };
  }
  // A arma sai de cima (ou de trás) e desce rápido até o impacto; depois volta à mão.
  const rotacao = t < a.impacto ? trecho(t, 0, a.impacto, a.alto, a.baixo) : trecho(t, a.impacto + 0.15, 1, a.baixo, 0);
  const golpe = Math.sin(Math.PI * entre01(t / (a.impacto * 2.2)));
  const esmaga = a.esmaga * Math.max(0, 1 - Math.abs(t - a.impacto) / 0.18);
  return {
    dy: esmaga * 0.3,
    empurrao: a.empurrao * golpe,
    escalaX: 1 + esmaga,
    escalaY: 1 - esmaga,
    rotacao: trecho(t, 0, a.impacto, a.recua, a.inclina) * (1 - entre01((t - a.impacto) / (1 - a.impacto))),
    tiras,
    arma: { rotacao, dx: 0, dy: 0 },
  };
}

function poseDoGolpe(golpe: Golpe, preparo: number | null, t: number | null, tiras: PoseTira[]): Pose {
  switch (golpe) {
    case 'corte':
    case 'corte_pesado':
    case 'contundente':
    case 'contundente_leve':
      return poseDoArco(ARCOS[golpe], preparo, t, tiras);
    case 'estocada':
    case 'estocada_rapida': {
      const rapida = golpe === 'estocada_rapida';
      if (t === null) {
        const p = suave(entre01(preparo ?? 0));
        return { dy: 0, empurrao: -0.06 * p, escalaX: 1, escalaY: 1, rotacao: -0.05 * p, tiras, arma: { rotacao: 1.5 * p, dx: -0.12 * p, dy: 0.05 * p } };
      }
      // A ponta vai longe na direção do alvo (a adaga, duas vezes curtas).
      const s = rapida ? Math.abs(Math.sin(2 * Math.PI * t)) : Math.sin(Math.PI * Math.min(1, t * 1.6));
      const alcance = rapida ? 0.24 : 0.38;
      return {
        dy: 0,
        empurrao: (rapida ? 0.14 : 0.28) * s,
        escalaX: 1,
        escalaY: 1,
        rotacao: 0.08 * s,
        tiras,
        arma: { rotacao: 1.5 * (1 - entre01((t - 0.7) / 0.3)), dx: alcance * s - 0.12 * (1 - s), dy: 0.05 },
      };
    }
    case 'arremesso': {
      // Marco 27 (D-126): o braço vai atrás e lança de lado, girando o pulso.
      if (t === null) {
        const p = suave(entre01(preparo ?? 0));
        return { dy: 0, empurrao: -0.05 * p, escalaX: 1, escalaY: 1, rotacao: -0.08 * p, tiras, arma: { rotacao: -1.9 * p, dx: -0.08 * p, dy: -0.02 * p } };
      }
      const s = Math.sin(Math.PI * entre01(t * 1.4));
      return { dy: 0, empurrao: 0.16 * s, escalaX: 1, escalaY: 1, rotacao: 0.1 * s, tiras, arma: { rotacao: trecho(t, 0, 0.35, -1.9, 1.6) * (1 - entre01((t - 0.6) / 0.4)), dx: 0.1 * s, dy: 0 } };
    }
    case 'leitura': {
      // O tomo sobe aberto à frente e pulsa quando a magia sai.
      if (t === null) {
        const p = suave(entre01(preparo ?? 0));
        return { dy: 0, empurrao: 0, escalaX: 1, escalaY: 1 + 0.02 * p, rotacao: -0.03 * p, tiras, arma: { rotacao: -0.5 * p, dx: 0.06 * p, dy: -0.08 * p } };
      }
      const s = Math.sin(Math.PI * t);
      return { dy: 0, empurrao: 0.05 * s, escalaX: 1 + 0.02 * s, escalaY: 1, rotacao: 0.03 * s, tiras, arma: { rotacao: -0.5 * (1 - t), dx: 0.06 + 0.06 * s, dy: -0.08 * (1 - t) } };
    }
    case 'disparo': {
      if (t === null) {
        const p = suave(entre01(preparo ?? 0));
        return { dy: 0, empurrao: -0.03 * p, escalaX: 1, escalaY: 1, rotacao: -0.04 * p, tiras, arma: { rotacao: 0, dx: 0.04 * p, dy: 0 } };
      }
      const s = Math.sin(Math.PI * t);
      return { dy: 0, empurrao: -0.06 * s, escalaX: 1, escalaY: 1, rotacao: -0.05 * s, tiras, arma: { rotacao: -0.15 * s, dx: -0.04 * s, dy: 0 } };
    }
    case 'giro': {
      if (t === null) {
        const p = suave(entre01(preparo ?? 0));
        return { dy: 0.02 * p, empurrao: 0, escalaX: 1, escalaY: 1 - 0.04 * p, rotacao: -0.1 * p, tiras, arma: { rotacao: 1.57 * p, dx: 0.06 * p, dy: 0 }, giro: -0.6 * p };
      }
      // Duas voltas, acelerando e soltando; a arma estendida para fora, como contrapeso.
      const giro = -0.6 + (4 * Math.PI + 0.6) * (1 - (1 - t) * (1 - t));
      const fim = entre01((t - 0.85) / 0.15);
      return {
        dy: 0.02 * (1 - fim),
        empurrao: 0,
        escalaX: 1,
        escalaY: 0.96 + 0.04 * fim,
        rotacao: 0,
        tiras,
        arma: { rotacao: 1.57 * (1 - fim), dx: 0.1 * (1 - fim), dy: 0 },
        giro: giro * (1 - fim) + 4 * Math.PI * fim,
      };
    }
  }
}

/** Pose do quadro. Parado e ataque usam o motor genérico; andando, o motor do estilo. Quem flutua paira parado. */
export function pose(e: EntradaPose): Pose {
  if (e.reduzido) return { ...POSE_NEUTRA, tiras: e.tiras ? tirasVazias() : [] };
  // Marco 24 (D-098): com o golpe da arma, a preparação na conjuração e o golpe no lançamento.
  if (e.golpe && (e.ataqueMs !== null || (e.preparo ?? null) !== null)) {
    const t = e.ataqueMs !== null ? entre01(e.ataqueMs / DURACAO_GOLPE[e.golpe]) : null;
    return poseDoGolpe(e.golpe, e.preparo ?? null, t, e.tiras ? tirasVazias() : []);
  }
  if (e.ataqueMs !== null || (!e.andando && e.estilo !== 'flutuar')) return generico(e);
  switch (e.estilo) {
    case 'passada':
      return bipede(e, PARAMETROS.passada);
    case 'marcha':
      return bipede(e, PARAMETROS.marcha);
    case 'quique':
      return quique(e);
    case 'flutuar':
      return flutuar(e);
    case 'deslizar':
      return deslizar(e);
  }
}

