// Caminhada procedural por fatias (§2.16). Marco 13 (14/10/2026), D-058. Pura e testável.
// O token é uma imagem única de corpo inteiro, fatiada em 18 tiras horizontais; a pose diz quanto cada tira
// se desloca. Unidades: deslocamentos em fração da largura (x) ou da altura (y) do token; tempo em ms de
// apresentação (é visual: nunca entra na simulação).
// Tira 0 é a de cima; a tira i cobre a altura de i/18 a (i+1)/18 a partir do topo.

export type EstiloCaminhada = 'quique' | 'passada' | 'marcha' | 'flutuar' | 'deslizar';

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
}

const POSE_NEUTRA: Pose = { dy: 0, empurrao: 0, escalaX: 1, escalaY: 1, rotacao: 0, tiras: [] };

/** Altura da tira i a partir dos pés (0 nos pés, 1 no topo), pelo meio da tira. */
export function alturaDaTira(i: number): number {
  return 1 - (i + 0.5) / TIRAS;
}

const onda = (tMs: number, cadenciaMs: number, fase: number) => Math.sin(((tMs / cadenciaMs) * 2 + fase) * Math.PI);

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
    return { dx: h < p.corte ? p.amplitude * s * (1 - h / p.corte) : 0, dy: 0, colunas: null };
  });
  return pose;
}

/** Pose do quadro. Parado e ataque usam o motor genérico; andando, o motor do estilo. Quem flutua paira parado. */
export function pose(e: EntradaPose): Pose {
  if (e.reduzido) return { ...POSE_NEUTRA, tiras: e.tiras ? tirasVazias() : [] };
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

