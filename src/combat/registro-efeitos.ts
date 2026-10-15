// Registro de efeitos (§2.8): fonte única de verdade. Marco 8A (13/10/2026), D-048.
// Cada tipo declara o que é (status, positivo, elegível ao orbe e peso), quais campos usa, os
// padrões do `construir()` e os ganchos declarativos que o resto do jogo consulta. Não há
// `if (tipo === ...)` espalhado: movimento, ações, dano, colisão e projéteis leem estes campos.
// Registrar um tipo com `elegivelParaOrbe: true` o coloca sozinho no sorteio do orbe e no editor.
// Marco 8A-2 (14/10/2026): os 6 de fluxo próprio (atrasado, rastros, invocar, dominar, armadilha).
// Marco 14 (14/10/2026), D-059: os estados dos 5 elementos (queimando, resfriado, congelado, eletrizado,
// envenenado, exposto), escudo, puxão, troca de lugar e dano direto; ganchos de lentidão, cura recebida,
// dano recebido e escudo. Acúmulo, oposições e sinergias ficam em dados (interacoes.json, acumulo.ts).

import { aleatorio, type EstadoRng } from '../core/rng';

export const TIPOS_EFEITO = [
  // negativos
  'dano_periodico',
  'atordoar',
  'silenciar',
  'sem_movimento',
  'sem_ataque',
  'modificar_dano',
  // positivos (elegíveis a orbe)
  'cura_periodica',
  'bonus_dano',
  'ab_dano',
  'ab_recarga',
  'recuperar_recurso',
  'ab_alcance',
  'ab_multi_alvo',
  'imune_dano',
  'fantasma',
  'atravessar',
  // instantâneos
  'cura',
  'teleporte',
  'avanco',
  'empurrao',
  // fluxo próprio (marco 8A-2)
  'efeito_atrasado',
  'rastro_dano',
  'rastro_efeito',
  'invocar',
  'dominar_ao_matar',
  'armadilha',
  // estados dos elementos (marco 14)
  'queimando',
  'resfriado',
  'congelado',
  'eletrizado',
  'envenenado',
  'exposto',
  // marco 14: escudo e os instantâneos novos
  'escudo',
  'puxao',
  'trocar_lugar',
  'dano_direto',
] as const;
export type TipoEfeito = (typeof TIPOS_EFEITO)[number];

/** Campos numéricos que um efeito pode usar; os que o tipo não usa ficam em 0 (D-048). */
export type CampoEfeito = 'valor' | 'pct';

/** Sobre quem o efeito de uma habilidade cai: o alvo do impacto (padrão) ou quem conjurou. */
export type DestinoEfeito = 'alvo' | 'conjurador';

/** Forma canônica: uma entrada por componente, só com os campos do tipo (§2.8, normalização). */
export interface EfeitoCanonico {
  tipo: TipoEfeito;
  /** 0 = instantâneo. */
  duracaoMs: number;
  valor: number;
  pct: number;
  em: DestinoEfeito;
  /** Efeito carregado (atrasado, rastro de efeito, armadilha); um nível só. */
  interno: EfeitoCanonico | null;
  /** Referência a conteúdo: o preset do `invocar`. */
  ref: string | null;
}

/** Fluxos próprios de um disparo só: agendar, armar ou invocar (não ficam como status). */
export type Fluxo = 'atrasado' | 'armadilha' | 'invocar';

export type Periodico = 'dano' | 'cura' | 'recurso';
export type Instantaneo = 'cura' | 'recurso' | 'teleporte' | 'avanco' | 'empurrao' | 'puxao' | 'trocar' | 'dano';
export type BonusDeAtaqueBasico = 'dano' | 'recarga' | 'alcance' | 'alvos';

export interface DefinicaoEfeito {
  id: TipoEfeito;
  icone: string;
  cor: string;
  /** Aparece como status (ícone no HUD e marcador na entidade). */
  ehStatus: boolean;
  positivo: boolean;
  elegivelParaOrbe: boolean;
  pesoOrbe: number;
  campos: readonly CampoEfeito[];
  /** Padrões do `construir()` (orbe, editor e campos omitidos na autoria). */
  padrao: { duracaoMs: number; valor: number; pct: number };
  bloqueiaMovimento: boolean;
  /** Quais ações não podem começar nem continuar. */
  bloqueiaAcoes: 'todas' | 'magicas' | 'fisicas' | 'nenhuma';
  /** Sinal aplicado ao `pct` no multiplicador de dano causado (+1 aumenta, −1 reduz). */
  danoCausado: 1 | -1 | 0;
  imuneDano: boolean;
  semColisao: boolean;
  projeteisAtravessam: boolean;
  ataqueBasico: BonusDeAtaqueBasico | null;
  /** Periódico: aplica `valor` a cada intervalo. Com duração 0, vira instantâneo (cura/recurso). */
  periodico: Periodico | null;
  instantaneo: Instantaneo | null;
  /** Marco 8A-2: fluxo próprio de um disparo; `aoLancar` aplica uma vez no lançamento da habilidade. */
  fluxo: Fluxo | null;
  aoLancar: boolean;
  /** Enquanto ativo, a entidade deixa rastro de dano ou de efeito nas células por onde passa. */
  rastro: 'dano' | 'efeito' | null;
  /** Quem morre com este efeito ativo é dominado por quem o aplicou (§2.9). */
  domina: boolean;
  /** Campos extras exigidos na autoria. */
  exige: readonly ('interno' | 'ref')[];
  /** Marco 14: o `pct` reduz a velocidade de movimento (resfriado). */
  lentidao: boolean;
  /** Marco 14: −1 = o `pct` reduz a cura recebida (envenenado). */
  curaRecebida: -1 | 0;
  /** Marco 14: +1 = o `pct` aumenta o dano recebido (exposto). */
  danoRecebido: 1 | 0;
  /** Marco 14: o `valor` absorve dano antes da vida e se gasta. */
  escudo: boolean;
}

type Def = Omit<DefinicaoEfeito, 'id'>;

const BASE: Omit<Def, 'icone' | 'cor' | 'positivo' | 'padrao' | 'campos'> = {
  ehStatus: true,
  elegivelParaOrbe: false,
  pesoOrbe: 0,
  bloqueiaMovimento: false,
  bloqueiaAcoes: 'nenhuma',
  danoCausado: 0,
  imuneDano: false,
  semColisao: false,
  projeteisAtravessam: false,
  ataqueBasico: null,
  periodico: null,
  instantaneo: null,
  fluxo: null,
  aoLancar: false,
  rastro: null,
  domina: false,
  exige: [],
  lentidao: false,
  curaRecebida: 0,
  danoRecebido: 0,
  escudo: false,
};

const negativo = (icone: string, cor: string, campos: readonly CampoEfeito[], padrao: Def['padrao'], extra: Partial<Def>): Def => ({
  ...BASE,
  icone,
  cor,
  positivo: false,
  campos,
  padrao,
  ...extra,
});

const positivo = (icone: string, cor: string, peso: number, campos: readonly CampoEfeito[], padrao: Def['padrao'], extra: Partial<Def>): Def => ({
  ...BASE,
  icone,
  cor,
  positivo: true,
  elegivelParaOrbe: true,
  pesoOrbe: peso,
  campos,
  padrao,
  ...extra,
});

const instantaneo = (icone: string, cor: string, campos: readonly CampoEfeito[], padrao: Def['padrao'], tipo: Instantaneo, positivoSim: boolean): Def => ({
  ...BASE,
  ehStatus: false,
  icone,
  cor,
  positivo: positivoSim,
  campos,
  padrao,
  instantaneo: tipo,
});

const DEFINICOES: Readonly<Record<TipoEfeito, Def>> = {
  dano_periodico: negativo('☠', '#8e44ad', ['valor'], { duracaoMs: 4000, valor: 2, pct: 0 }, { periodico: 'dano' }),
  atordoar: negativo('✷', '#f1c40f', [], { duracaoMs: 1500, valor: 0, pct: 0 }, { bloqueiaMovimento: true, bloqueiaAcoes: 'todas' }),
  silenciar: negativo('🔇', '#9b59b6', [], { duracaoMs: 3000, valor: 0, pct: 0 }, { bloqueiaAcoes: 'magicas' }),
  sem_movimento: negativo('⛓', '#95a5a6', [], { duracaoMs: 2000, valor: 0, pct: 0 }, { bloqueiaMovimento: true }),
  sem_ataque: negativo('✋', '#e67e22', [], { duracaoMs: 3000, valor: 0, pct: 0 }, { bloqueiaAcoes: 'fisicas' }),
  modificar_dano: negativo('⬇', '#c0392b', ['pct'], { duracaoMs: 5000, valor: 0, pct: 30 }, { danoCausado: -1 }),

  cura_periodica: positivo('✚', '#2ecc71', 20, ['valor'], { duracaoMs: 6000, valor: 3, pct: 0 }, { periodico: 'cura' }),
  bonus_dano: positivo('⬆', '#e74c3c', 18, ['pct'], { duracaoMs: 10_000, valor: 0, pct: 25 }, { danoCausado: 1 }),
  ab_dano: positivo('⚔', '#d35400', 14, ['valor'], { duracaoMs: 15_000, valor: 3, pct: 0 }, { ataqueBasico: 'dano' }),
  ab_recarga: positivo('⏩', '#16a085', 10, ['pct'], { duracaoMs: 15_000, valor: 0, pct: 30 }, { ataqueBasico: 'recarga' }),
  recuperar_recurso: positivo('💧', '#3498db', 8, ['valor', 'pct'], { duracaoMs: 8000, valor: 2, pct: 0 }, { periodico: 'recurso' }),
  ab_alcance: positivo('↔', '#2980b9', 8, ['valor'], { duracaoMs: 15_000, valor: 1, pct: 0 }, { ataqueBasico: 'alcance' }),
  ab_multi_alvo: positivo('⁂', '#e67e22', 6, ['valor'], { duracaoMs: 15_000, valor: 1, pct: 0 }, { ataqueBasico: 'alvos' }),
  imune_dano: positivo('🛡', '#f1c40f', 4, [], { duracaoMs: 3000, valor: 0, pct: 0 }, { imuneDano: true }),
  fantasma: positivo('👻', '#bdc3c7', 2, [], { duracaoMs: 8000, valor: 0, pct: 0 }, { semColisao: true }),
  atravessar: positivo('➶', '#1abc9c', 2, [], { duracaoMs: 12_000, valor: 0, pct: 0 }, { projeteisAtravessam: true }),

  cura: instantaneo('✚', '#2ecc71', ['valor', 'pct'], { duracaoMs: 0, valor: 10, pct: 0 }, 'cura', true),
  teleporte: instantaneo('⌖', '#9b59b6', [], { duracaoMs: 0, valor: 0, pct: 0 }, 'teleporte', true),
  avanco: instantaneo('»', '#34495e', ['valor'], { duracaoMs: 0, valor: 2, pct: 0 }, 'avanco', true),
  empurrao: instantaneo('⇥', '#7f8c8d', ['valor'], { duracaoMs: 0, valor: 2, pct: 0 }, 'empurrao', false),

  efeito_atrasado: { ...BASE, icone: '⏳', cor: '#e67e22', positivo: false, ehStatus: false, campos: [], padrao: { duracaoMs: 1500, valor: 0, pct: 0 }, fluxo: 'atrasado', exige: ['interno'] },
  rastro_dano: positivo('🔥', '#e74c3c', 2, ['valor'], { duracaoMs: 8000, valor: 3, pct: 0 }, { rastro: 'dano' }),
  rastro_efeito: { ...BASE, icone: '〰', cor: '#27ae60', positivo: true, campos: [], padrao: { duracaoMs: 6000, valor: 0, pct: 0 }, rastro: 'efeito', exige: ['interno'] },
  invocar: { ...BASE, icone: '☥', cor: '#16a085', positivo: true, ehStatus: false, campos: ['valor'], padrao: { duracaoMs: 20_000, valor: 1, pct: 0 }, fluxo: 'invocar', aoLancar: true, exige: ['ref'] },
  dominar_ao_matar: negativo('♛', '#8e44ad', [], { duracaoMs: 8000, valor: 0, pct: 0 }, { domina: true }),
  armadilha: { ...BASE, icone: '⚠', cor: '#d35400', positivo: true, ehStatus: false, campos: ['valor'], padrao: { duracaoMs: 30_000, valor: 8, pct: 0 }, fluxo: 'armadilha', aoLancar: true },

  queimando: negativo('🔥', '#ff7b39', ['valor'], { duracaoMs: 3000, valor: 3, pct: 0 }, { periodico: 'dano' }),
  resfriado: negativo('❄', '#74b9ff', ['pct'], { duracaoMs: 3000, valor: 0, pct: 30 }, { lentidao: true }),
  congelado: negativo('🧊', '#a0d8ef', [], { duracaoMs: 1500, valor: 0, pct: 0 }, { bloqueiaMovimento: true, bloqueiaAcoes: 'todas' }),
  eletrizado: negativo('⚡', '#f7dc6f', [], { duracaoMs: 2500, valor: 0, pct: 0 }, {}),
  envenenado: negativo('🧪', '#58d68d', ['valor', 'pct'], { duracaoMs: 5000, valor: 2, pct: 50 }, { periodico: 'dano', curaRecebida: -1 }),
  exposto: negativo('👁', '#d980fa', ['pct'], { duracaoMs: 4000, valor: 0, pct: 20 }, { danoRecebido: 1 }),
  escudo: { ...BASE, icone: '🔰', cor: '#5dade2', positivo: true, campos: ['valor'], padrao: { duracaoMs: 8000, valor: 12, pct: 0 }, escudo: true },
  puxao: instantaneo('⇤', '#7f8c8d', ['valor'], { duracaoMs: 0, valor: 2, pct: 0 }, 'puxao', false),
  trocar_lugar: instantaneo('⇄', '#8e44ad', [], { duracaoMs: 0, valor: 0, pct: 0 }, 'trocar', true),
  dano_direto: instantaneo('✦', '#e74c3c', ['valor'], { duracaoMs: 0, valor: 5, pct: 0 }, 'dano', false),
};

export const REGISTRO_EFEITOS: Readonly<Record<TipoEfeito, DefinicaoEfeito>> = Object.fromEntries(
  TIPOS_EFEITO.map((id) => [id, { id, ...DEFINICOES[id] }]),
) as Record<TipoEfeito, DefinicaoEfeito>;

export function ehTipoEfeito(v: unknown): v is TipoEfeito {
  return typeof v === 'string' && (TIPOS_EFEITO as readonly string[]).includes(v);
}

/** `construir()` da §2.8: o efeito com os padrões do registro. */
export function construirEfeito(tipo: TipoEfeito, parcial: Partial<Omit<EfeitoCanonico, 'tipo'>> = {}): EfeitoCanonico {
  const d = REGISTRO_EFEITOS[tipo];
  return {
    tipo,
    duracaoMs: parcial.duracaoMs ?? d.padrao.duracaoMs,
    valor: d.campos.includes('valor') ? (parcial.valor ?? d.padrao.valor) : 0,
    pct: d.campos.includes('pct') ? (parcial.pct ?? d.padrao.pct) : 0,
    em: parcial.em ?? 'alvo',
    interno: parcial.interno ? { ...parcial.interno, interno: null } : null,
    ref: parcial.ref ?? null,
  };
}

/** Elegíveis ao orbe de efeito, na ordem do registro (determinística). */
export function elegiveisParaOrbe(registro: Readonly<Record<string, DefinicaoEfeito>> = REGISTRO_EFEITOS): DefinicaoEfeito[] {
  return Object.values(registro).filter((d) => d.elegivelParaOrbe && d.pesoOrbe > 0);
}

/**
 * Sorteio do orbe de efeito (§2.10): um elegível por peso, com os padrões do `construir()`. Só lê
 * o registro: um tipo novo elegível entra aqui sem tocar em mais nada (§2.8).
 */
export function sortearEfeitoDeOrbe(rng: EstadoRng, registro: Readonly<Record<string, DefinicaoEfeito>> = REGISTRO_EFEITOS): EfeitoCanonico | null {
  const elegiveis = elegiveisParaOrbe(registro);
  const total = elegiveis.reduce((s, d) => s + d.pesoOrbe, 0);
  if (total <= 0) return null;
  let sorteio = aleatorio(rng) * total;
  for (const d of elegiveis) {
    sorteio -= d.pesoOrbe;
    if (sorteio < 0) return construirEfeito(d.id);
  }
  const ultimo = elegiveis.at(-1);
  return ultimo ? construirEfeito(ultimo.id) : null;
}
