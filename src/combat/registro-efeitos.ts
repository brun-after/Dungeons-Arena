// Registro de efeitos (§2.8): fonte única de verdade. Marco 8A (13/10/2026), D-048.
// Cada tipo declara o que é (status, positivo, elegível ao orbe e peso), quais campos usa, os
// padrões do `construir()` e os ganchos declarativos que o resto do jogo consulta. Não há
// `if (tipo === ...)` espalhado: movimento, ações, dano, colisão e projéteis leem estes campos.
// Registrar um tipo com `elegivelParaOrbe: true` o coloca sozinho no sorteio do orbe e no editor.
// Marco 8A-2 (14/10/2026): os 6 de fluxo próprio (atrasado, rastros, invocar, dominar, armadilha).
// Marco 14 (14/10/2026), D-059: os estados dos 5 elementos (queimando, resfriado, congelado, eletrizado,
// envenenado, exposto), escudo, puxão, troca de lugar e dano direto; ganchos de lentidão, cura recebida,
// dano recebido e escudo. Acúmulo, oposições e sinergias ficam em dados (interacoes.json, acumulo.ts).
// Marco 24 (24/10/2026, D-094/D-097): cego, aterrorizado, confuso, desafiado, marca do caçador, Frenesi, esquiva,
// interceptar projéteis, contragolpe, presságio, crítico garantido, sobrecarga, escudo que soma até um teto e
// invisível; os instantâneos dissipar, consumir estado, detonar invocação, arremessar, zerar recarga, libertar,
// fúria e carga da ultimate; e os fluxos fase (lança outra habilidade depois de um prazo) e invocação temporária.

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
  'acelerado',
  'atravessar',
  'engenho',
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
  // marco 18 (D-068): estados de terra, sombra e sagrado, e os das reações novas
  'enraizado',
  'marcado',
  'consagrado',
  'molhado',
  'atolado',
  'definhando',
  'drenar_invocacao',
  'comandar_mortos',
  // marco 14: escudo e os instantâneos novos
  'escudo',
  'puxao',
  'trocar_lugar',
  'dano_direto',
  'sangrando', 'aparando', 'resposta_aparo', 'veu_noturno', 'purificar', 'passo_sombrio', 'muralha_pedra', 'campo_cura', 'campo_veneno',
  // marco 24
  'cego', 'aterrorizado', 'confuso', 'desafiado', 'marca_cacador', 'frenesi', 'esquiva', 'intercepta', 'contragolpe', 'presagio',
  'critico_garantido', 'sobrecarga', 'escudo_acumulado', 'invisivel', 'dissipar', 'consumir', 'detonar_invocacao', 'arremessar',
  'zerar_recarga', 'libertar', 'furia', 'carga_ultimate', 'fase', 'invocar_temporario', 'reflexo', 'executar',
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
export type Fluxo = 'atrasado' | 'armadilha' | 'invocar' | 'fase';

export type Periodico = 'dano' | 'cura' | 'recurso';
export type Instantaneo = 'drenar_invocacao' | 'comandar_mortos' | 'purificar' | 'passo_sombrio' | 'muralha_pedra' | 'campo_cura' | 'campo_veneno' | 'cura' | 'recurso' | 'teleporte' | 'avanco' | 'empurrao' | 'puxao' | 'trocar' | 'dano'
  | 'invisivel' | 'dissipar' | 'consumir' | 'detonar' | 'arremessar' | 'zerar_recarga' | 'libertar' | 'furia' | 'carga_ultimate' | 'executar';
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
  /**
   * Marco 26 (29/10/2026, D-125): com `em: conjurador`, desloca quem lança uma vez, no lançamento (avanço,
   * teleporte), e não a cada alvo atingido: a Investida avança mesmo sem acertar ninguém.
   */
  deslocaConjurador: boolean;
  /** Enquanto ativo, a entidade deixa rastro de dano ou de efeito nas células por onde passa. */
  rastro: 'dano' | 'efeito' | null;
  /** Quem morre com este efeito ativo é dominado por quem o aplicou (§2.9). */
  domina: boolean;
  /** Campos extras exigidos na autoria. */
  exige: readonly ('interno' | 'ref')[];
  /** Marco 14: o `pct` reduz a velocidade de movimento (resfriado). */
  lentidao: boolean;
  velocidade: boolean;
  /** Marco 14: −1 = o `pct` reduz a cura recebida (envenenado). */
  curaRecebida: -1 | 0;
  /** Marco 14: +1 = o `pct` aumenta o dano recebido (exposto). */
  danoRecebido: 1 | 0;
  /** Marco 14: o `valor` absorve dano antes da vida e se gasta. */
  escudo: boolean;
  /** Marco 18 (D-068): sai no primeiro golpe que o alvo leva (marcado). */
  someAoLevarGolpe: boolean;
  /** Marco 18 (D-068): quem acerta o alvo se cura `valor` (consagrado). */
  curaQuemAcerta: boolean;
  /** Marco 24 (D-097): o `pct` é a chance de errar os golpes (cego). */
  erroPct: boolean;
  /** Marco 24: a IA foge de quem aplicou (aterrorizado), vaga sem atacar (confuso) ou só persegue quem aplicou (desafiado). */
  ia: 'foge' | 'vaga' | 'persegue' | null;
  /** Marco 24: o `pct` aumenta só o dano que vem de quem aplicou (desafiado, marca do caçador). */
  danoDaOrigem: boolean;
  /** Marco 24: quem tem o efeito não fica invisível para quem o aplicou (marca do caçador). */
  revela: boolean;
  /** Marco 24: o `pct` é a chance de esquivar golpes diretos (soma, com teto em `balance.estados`). */
  esquiva: boolean;
  /** Marco 24: o `valor` é quantos projéteis hostis o portador ainda bloqueia. */
  intercepta: boolean;
  /** Marco 24: o próximo golpe do portador é crítico, e o efeito sai nele. */
  criticoGarantido: boolean;
  /** Marco 24: sai quando o portador lança uma habilidade com dano desse tipo (a sobrecarga sai na magia que fortalece). */
  someAoLancar: 'magico' | 'fisico' | null;
  /** Marco 24: o `valor` soma ao que já existe, até o `pct` (o escudo de cada acerto). */
  somaAteTeto: boolean;
  /** Marco 24: quem golpeia o portador de perto recebe o efeito carregado (Seiva corrosiva, Égide flamejante). */
  reflexo: boolean;
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
  deslocaConjurador: false,
  rastro: null,
  domina: false,
  exige: [],
  lentidao: false,
  velocidade: false,
  curaRecebida: 0,
  danoRecebido: 0,
  escudo: false,
  someAoLevarGolpe: false,
  curaQuemAcerta: false,
  erroPct: false,
  ia: null,
  danoDaOrigem: false,
  revela: false,
  esquiva: false,
  intercepta: false,
  criticoGarantido: false,
  someAoLancar: null,
  somaAteTeto: false,
  reflexo: false,
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
  sangrando: negativo('espada', '#ae3445', ['valor'], { duracaoMs: 4000, valor: 2, pct: 0 }, { periodico: 'dano' }),
  aparando: { ...BASE, icone: 'escudo', cor: '#b6cee0', positivo: true, campos: ['pct'], padrao: { duracaoMs: 1500, valor: 0, pct: 65 } },
  resposta_aparo: { ...BASE, icone: 'espada', cor: '#e0d0a8', positivo: true, campos: ['pct'], padrao: { duracaoMs: 3000, valor: 0, pct: 20 } },
  veu_noturno: { ...BASE, icone: 'fantasma', cor: '#8d75b9', positivo: true, campos: ['pct'], padrao: { duracaoMs: 3000, valor: 0, pct: 35 } },
  purificar: instantaneo('cura', '#e5fff6', [], { duracaoMs: 0, valor: 0, pct: 0 }, 'purificar', true),
  passo_sombrio: instantaneo('teleporte', '#685186', ['valor'], { duracaoMs: 0, valor: 3, pct: 0 }, 'passo_sombrio', true),
  muralha_pedra: instantaneo('pedra', '#a1887f', ['valor'], { duracaoMs: 5000, valor: 1, pct: 0 }, 'muralha_pedra', true),
  campo_cura: instantaneo('cura', '#6cdbac', ['valor'], { duracaoMs: 6000, valor: 3, pct: 0 }, 'campo_cura', true),
  campo_veneno: instantaneo('veneno', '#69ad67', ['valor'], { duracaoMs: 5000, valor: 2, pct: 0 }, 'campo_veneno', false),
  dano_periodico: negativo('caveira', '#8e44ad', ['valor'], { duracaoMs: 4000, valor: 2, pct: 0 }, { periodico: 'dano' }),
  atordoar: negativo('atordoar', '#f1c40f', [], { duracaoMs: 1500, valor: 0, pct: 0 }, { bloqueiaMovimento: true, bloqueiaAcoes: 'todas' }),
  silenciar: negativo('silencio', '#9b59b6', [], { duracaoMs: 3000, valor: 0, pct: 0 }, { bloqueiaAcoes: 'magicas' }),
  sem_movimento: negativo('corrente', '#95a5a6', [], { duracaoMs: 2000, valor: 0, pct: 0 }, { bloqueiaMovimento: true }),
  sem_ataque: negativo('mao', '#e67e22', [], { duracaoMs: 3000, valor: 0, pct: 0 }, { bloqueiaAcoes: 'fisicas' }),
  modificar_dano: negativo('seta_baixo', '#c0392b', ['pct'], { duracaoMs: 5000, valor: 0, pct: 30 }, { danoCausado: -1 }),

  cura_periodica: positivo('cura', '#2ecc71', 20, ['valor'], { duracaoMs: 6000, valor: 3, pct: 0 }, { periodico: 'cura' }),
  bonus_dano: positivo('seta_cima', '#e74c3c', 18, ['pct'], { duracaoMs: 10_000, valor: 0, pct: 25 }, { danoCausado: 1 }),
  ab_dano: positivo('espada', '#d35400', 14, ['valor'], { duracaoMs: 15_000, valor: 3, pct: 0 }, { ataqueBasico: 'dano' }),
  ab_recarga: positivo('relogio', '#16a085', 10, ['pct'], { duracaoMs: 15_000, valor: 0, pct: 30 }, { ataqueBasico: 'recarga' }),
  recuperar_recurso: positivo('gota', '#3498db', 8, ['valor', 'pct'], { duracaoMs: 8000, valor: 2, pct: 0 }, { periodico: 'recurso' }),
  ab_alcance: positivo('longo', '#2980b9', 8, ['valor'], { duracaoMs: 15_000, valor: 1, pct: 0 }, { ataqueBasico: 'alcance' }),
  ab_multi_alvo: positivo('multi', '#e67e22', 6, ['valor'], { duracaoMs: 15_000, valor: 1, pct: 0 }, { ataqueBasico: 'alvos' }),
  imune_dano: positivo('escudo', '#f1c40f', 4, [], { duracaoMs: 3000, valor: 0, pct: 0 }, { imuneDano: true }),
  acelerado: { ...BASE, icone: 'botas', cor: '#74d9ca', positivo: true, campos: ['pct'], padrao: { duracaoMs: 3000, valor: 0, pct: 30 }, velocidade: true },
  fantasma: positivo('fantasma', '#bdc3c7', 2, [], { duracaoMs: 8000, valor: 0, pct: 0 }, { semColisao: true }),
  engenho: positivo('aviso', '#50e3c2', 4, [], { duracaoMs: 20000, valor: 0, pct: 0 }, {}),
  atravessar: positivo('flecha', '#1abc9c', 2, [], { duracaoMs: 12_000, valor: 0, pct: 0 }, { projeteisAtravessam: true }),

  cura: instantaneo('cura', '#2ecc71', ['valor', 'pct'], { duracaoMs: 0, valor: 10, pct: 0 }, 'cura', true),
  teleporte: { ...instantaneo('teleporte', '#9b59b6', [], { duracaoMs: 0, valor: 0, pct: 0 }, 'teleporte', true), deslocaConjurador: true },
  avanco: { ...instantaneo('investida', '#34495e', ['valor'], { duracaoMs: 0, valor: 2, pct: 0 }, 'avanco', true), deslocaConjurador: true },
  empurrao: instantaneo('empurrar', '#7f8c8d', ['valor'], { duracaoMs: 0, valor: 2, pct: 0 }, 'empurrao', false),

  efeito_atrasado: { ...BASE, icone: 'ampulheta', cor: '#e67e22', positivo: false, ehStatus: false, campos: [], padrao: { duracaoMs: 1500, valor: 0, pct: 0 }, fluxo: 'atrasado', exige: ['interno'] },
  rastro_dano: positivo('fogo', '#e74c3c', 2, ['valor'], { duracaoMs: 8000, valor: 3, pct: 0 }, { rastro: 'dano' }),
  rastro_efeito: { ...BASE, icone: 'gota', cor: '#27ae60', positivo: true, campos: [], padrao: { duracaoMs: 6000, valor: 0, pct: 0 }, rastro: 'efeito', exige: ['interno'] },
  invocar: { ...BASE, icone: 'invocar', cor: '#16a085', positivo: true, ehStatus: false, campos: ['valor'], padrao: { duracaoMs: 20_000, valor: 1, pct: 0 }, fluxo: 'invocar', aoLancar: true, exige: ['ref'] },
  dominar_ao_matar: negativo('coroa', '#8e44ad', [], { duracaoMs: 8000, valor: 0, pct: 0 }, { domina: true }),
  armadilha: { ...BASE, icone: 'aviso', cor: '#d35400', positivo: true, ehStatus: false, campos: ['valor'], padrao: { duracaoMs: 30_000, valor: 8, pct: 0 }, fluxo: 'armadilha', aoLancar: true },

  queimando: negativo('fogo', '#ff7b39', ['valor'], { duracaoMs: 3000, valor: 3, pct: 0 }, { periodico: 'dano' }),
  resfriado: negativo('gelo', '#74b9ff', ['pct'], { duracaoMs: 3000, valor: 0, pct: 30 }, { lentidao: true }),
  congelado: negativo('gelo', '#a0d8ef', [], { duracaoMs: 1500, valor: 0, pct: 0 }, { bloqueiaMovimento: true, bloqueiaAcoes: 'todas' }),
  eletrizado: negativo('raio', '#f7dc6f', [], { duracaoMs: 2500, valor: 0, pct: 0 }, {}),
  envenenado: negativo('veneno', '#58d68d', ['valor', 'pct'], { duracaoMs: 5000, valor: 2, pct: 50 }, { periodico: 'dano', curaRecebida: -1 }),
  exposto: negativo('olho', '#d980fa', ['pct'], { duracaoMs: 4000, valor: 0, pct: 20 }, { danoRecebido: 1 }),
  enraizado: negativo('pedra', '#8d6e63', [], { duracaoMs: 1000, valor: 0, pct: 0 }, { bloqueiaMovimento: true }),
  marcado: negativo('alvo', '#8e44ad', ['pct'], { duracaoMs: 4000, valor: 0, pct: 25 }, { danoRecebido: 1, someAoLevarGolpe: true }),
  consagrado: negativo('estrela', '#f7e9a0', ['valor'], { duracaoMs: 4000, valor: 2, pct: 0 }, { curaQuemAcerta: true }),
  molhado: negativo('gota', '#5dade2', [], { duracaoMs: 5000, valor: 0, pct: 0 }, {}),
  atolado: negativo('gota', '#7d6b4f', ['pct'], { duracaoMs: 4000, valor: 0, pct: 50 }, { lentidao: true }),
  definhando: negativo('caveira', '#8b68d9', ['pct'], { duracaoMs: 4000, valor: 0, pct: 20 }, { danoCausado: -1, curaRecebida: -1 }),
  drenar_invocacao: instantaneo('caveira', '#7ee0bb', ['valor'], { duracaoMs: 0, valor: 18, pct: 0 }, 'drenar_invocacao', true),
  comandar_mortos: instantaneo('caveira', '#8b68d9', ['pct'], { duracaoMs: 6000, valor: 0, pct: 25 }, 'comandar_mortos', true),
  escudo: { ...BASE, icone: 'barreira', cor: '#5dade2', positivo: true, campos: ['valor'], padrao: { duracaoMs: 8000, valor: 12, pct: 0 }, escudo: true },
  puxao: instantaneo('puxar', '#7f8c8d', ['valor'], { duracaoMs: 0, valor: 2, pct: 0 }, 'puxao', false),
  trocar_lugar: instantaneo('troca', '#8e44ad', [], { duracaoMs: 0, valor: 0, pct: 0 }, 'trocar', true),
  dano_direto: instantaneo('runa', '#e74c3c', ['valor'], { duracaoMs: 0, valor: 5, pct: 0 }, 'dano', false),

  cego: negativo('olho', '#5b5b6e', ['pct'], { duracaoMs: 3000, valor: 0, pct: 30 }, { erroPct: true }),
  aterrorizado: negativo('caveira', '#6c3483', [], { duracaoMs: 1500, valor: 0, pct: 0 }, { bloqueiaAcoes: 'todas', ia: 'foge' }),
  confuso: negativo('estrela', '#c39bd3', [], { duracaoMs: 2000, valor: 0, pct: 0 }, { bloqueiaAcoes: 'todas', ia: 'vaga' }),
  desafiado: negativo('alvo', '#e74c3c', ['pct'], { duracaoMs: 3000, valor: 0, pct: 15 }, { ia: 'persegue', danoDaOrigem: true }),
  marca_cacador: negativo('alvo', '#d4ac0d', ['pct'], { duracaoMs: 8000, valor: 0, pct: 20 }, { danoDaOrigem: true, revela: true }),
  frenesi: { ...BASE, icone: 'fogo', cor: '#ff6a00', positivo: true, campos: ['pct'], padrao: { duracaoMs: 6000, valor: 0, pct: 20 }, danoCausado: 1 },
  esquiva: { ...BASE, icone: 'fantasma', cor: '#aab7b8', positivo: true, campos: ['pct'], padrao: { duracaoMs: 4000, valor: 0, pct: 20 }, esquiva: true },
  intercepta: { ...BASE, icone: 'escudo', cor: '#d5dbdb', positivo: true, campos: ['valor'], padrao: { duracaoMs: 5000, valor: 5, pct: 0 }, intercepta: true },
  contragolpe: { ...BASE, icone: 'espada', cor: '#f0f3f4', positivo: true, campos: [], padrao: { duracaoMs: 1500, valor: 0, pct: 0 } },
  presagio: { ...BASE, icone: 'olho', cor: '#bb8fce', positivo: true, campos: [], padrao: { duracaoMs: 4000, valor: 0, pct: 0 } },
  critico_garantido: { ...BASE, icone: 'estrela', cor: '#f4d03f', positivo: true, campos: [], padrao: { duracaoMs: 5000, valor: 0, pct: 0 }, criticoGarantido: true },
  sobrecarga: { ...BASE, icone: 'raio', cor: '#a569bd', positivo: true, campos: ['pct'], padrao: { duracaoMs: 10_000, valor: 0, pct: 40 }, danoCausado: 1, someAoLancar: 'magico' },
  escudo_acumulado: { ...BASE, icone: 'barreira', cor: '#85929e', positivo: true, campos: ['valor', 'pct'], padrao: { duracaoMs: 5000, valor: 2, pct: 10 }, escudo: true, somaAteTeto: true },
  invisivel: instantaneo('fantasma', '#5d6d7e', [], { duracaoMs: 1500, valor: 0, pct: 0 }, 'invisivel', true),
  dissipar: instantaneo('runa', '#aed6f1', ['valor'], { duracaoMs: 0, valor: 2, pct: 0 }, 'dissipar', false),
  consumir: { ...instantaneo('fogo', '#ff7b39', ['pct'], { duracaoMs: 0, valor: 0, pct: 50 }, 'consumir', false), exige: ['ref'] },
  detonar_invocacao: instantaneo('caveira', '#7d3c98', ['valor', 'pct'], { duracaoMs: 0, valor: 2, pct: 50 }, 'detonar', false),
  arremessar: instantaneo('empurrar', '#8e44ad', ['valor'], { duracaoMs: 0, valor: 3, pct: 0 }, 'arremessar', false),
  zerar_recarga: { ...instantaneo('relogio', '#16a085', [], { duracaoMs: 0, valor: 0, pct: 0 }, 'zerar_recarga', true), exige: ['ref'] },
  libertar: instantaneo('botas', '#76d7c4', [], { duracaoMs: 0, valor: 0, pct: 0 }, 'libertar', true),
  furia: instantaneo('fogo', '#e74c3c', ['valor'], { duracaoMs: 0, valor: 10, pct: 0 }, 'furia', true),
  carga_ultimate: instantaneo('estrela', '#f5b041', ['valor'], { duracaoMs: 0, valor: 5, pct: 0 }, 'carga_ultimate', true),
  fase: { ...BASE, icone: 'ampulheta', cor: '#f5b041', positivo: true, ehStatus: false, campos: [], padrao: { duracaoMs: 0, valor: 0, pct: 0 }, fluxo: 'fase', aoLancar: true, exige: ['ref'] },
  reflexo: { ...BASE, icone: 'escudo', cor: '#58d68d', positivo: true, campos: [], padrao: { duracaoMs: 5000, valor: 0, pct: 0 }, reflexo: true, exige: ['interno'] },
  executar: instantaneo('caveira', '#c0392b', ['pct'], { duracaoMs: 0, valor: 0, pct: 20 }, 'executar', false),
  invocar_temporario: { ...BASE, icone: 'invocar', cor: '#48c9b0', positivo: true, ehStatus: false, campos: ['valor'], padrao: { duracaoMs: 12_000, valor: 1, pct: 0 }, fluxo: 'invocar', aoLancar: true, exige: ['ref'] },
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
export function sortearEfeitoDeOrbe(rng: EstadoRng, registro: Readonly<Record<string, DefinicaoEfeito>> = REGISTRO_EFEITOS, revelarArmadilhas = true): EfeitoCanonico | null {
  // D-079 (17/10/2026): Engenho só é oferecido onde armadilhas podem ser percebidas/interagidas.
  const elegiveis = elegiveisParaOrbe(registro).filter((d) => revelarArmadilhas || d.id !== 'engenho');
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
