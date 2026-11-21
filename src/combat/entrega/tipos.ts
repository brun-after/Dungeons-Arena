// Marco 49 (21/11/2026, D-194): a entrega de uma magia em sete eixos que se combinam livremente (o Grimório da
// Alquimia, capítulo I): de onde nasce (origem), por onde anda (trajetória), em que ritmo sai (cadência), o que deixa
// no chão (marca), o que fica no alvo (permanência), para onde vai (sentido) e de que é feita (corpo). Tudo em dados
// (`entrega` na skill); os números em balance.json, no bloco `entrega`. Puro.

import type { Leitor } from '../../core/validar';

export const ORIGENS = ['mao', 'chao', 'ceu', 'sob_alvo', 'circulos_atras', 'circulos_frente'] as const;
export const TRAJETORIAS = ['reta', 'parabola', 'espiral', 'convergente', 'caotica', 'orbita'] as const;
export const CADENCIAS = ['golpe', 'salva', 'rajada', 'feixe'] as const;
export const MARCAS = ['nenhuma', 'chao', 'trilha'] as const;
export const PERMANENCIAS = ['nenhuma', 'gira', 'pulsa', 'erupcao'] as const;
export const SENTIDOS = ['ida', 'volta', 'invocacao_usuario', 'invocacao_alvo'] as const;
export const CORPOS = ['graos', 'medio', 'grande'] as const;

export type Origem = (typeof ORIGENS)[number];
export type Trajetoria = (typeof TRAJETORIAS)[number];
export type Cadencia = (typeof CADENCIAS)[number];
export type Marca = (typeof MARCAS)[number];
export type Permanencia = (typeof PERMANENCIAS)[number];
export type Sentido = (typeof SENTIDOS)[number];
export type Corpo = (typeof CORPOS)[number];

/** A entrega de uma skill. Ausente na skill = a entrega antiga (reta, da mão, um golpe). */
export interface Entrega {
  origem: Origem;
  /** Quantos círculos (só nas origens de círculos): 2 a 5 atrás, 1 a 3 à frente. */
  circulos: number;
  trajetoria: Trajetoria;
  cadencia: Cadencia;
  /** A salva: quantos projéteis (3 a 7). */
  quantidade: number;
  /** A rajada e o feixe: quanto dura o canal, em ms. */
  duracaoMs: number;
  marca: Marca;
  permanencia: Permanencia;
  sentido: Sentido;
  corpo: Corpo;
}

export const ENTREGA_PADRAO: Entrega = {
  origem: 'mao',
  circulos: 0,
  trajetoria: 'reta',
  cadencia: 'golpe',
  quantidade: 1,
  duracaoMs: 0,
  marca: 'nenhuma',
  permanencia: 'nenhuma',
  sentido: 'ida',
  corpo: 'medio',
};

const CAMPOS = ['origem', 'circulos', 'trajetoria', 'cadencia', 'quantidade', 'duracaoMs', 'marca', 'permanencia', 'sentido', 'corpo'];

/** Lê a `entrega` de uma skill (cada eixo ausente fica no padrão). */
export function lerEntrega(l: Leitor, v: unknown): Entrega | undefined {
  if (v === undefined) return undefined;
  const o = l.objeto(v, 'entrega');
  for (const k of Object.keys(o)) if (!CAMPOS.includes(k)) l.erro(`entrega: campo desconhecido "${k}"`);
  const op = <T extends string>(campo: string, valores: readonly T[], padrao: T): T => (o[campo] === undefined ? padrao : l.opcao(o, campo, valores));
  const e: Entrega = {
    origem: op('origem', ORIGENS, ENTREGA_PADRAO.origem),
    circulos: 0,
    trajetoria: op('trajetoria', TRAJETORIAS, ENTREGA_PADRAO.trajetoria),
    cadencia: op('cadencia', CADENCIAS, ENTREGA_PADRAO.cadencia),
    quantidade: 1,
    duracaoMs: 0,
    marca: op('marca', MARCAS, ENTREGA_PADRAO.marca),
    permanencia: op('permanencia', PERMANENCIAS, ENTREGA_PADRAO.permanencia),
    sentido: op('sentido', SENTIDOS, ENTREGA_PADRAO.sentido),
    corpo: op('corpo', CORPOS, ENTREGA_PADRAO.corpo),
  };
  if (e.origem === 'circulos_atras') e.circulos = o.circulos === undefined ? 3 : l.numero(o, 'circulos', { min: 2, max: 5, inteiro: true });
  if (e.origem === 'circulos_frente') e.circulos = o.circulos === undefined ? 2 : l.numero(o, 'circulos', { min: 1, max: 3, inteiro: true });
  if (e.cadencia === 'salva') e.quantidade = o.quantidade === undefined ? 4 : l.numero(o, 'quantidade', { min: 3, max: 7, inteiro: true });
  if (e.cadencia === 'rajada' || e.cadencia === 'feixe') e.duracaoMs = o.duracaoMs === undefined ? 2000 : l.numero(o, 'duracaoMs', { min: 500, max: 6000 });
  if (o.circulos !== undefined && e.circulos === 0) l.erro('entrega: "circulos" só vale com origem de círculos');
  if (o.quantidade !== undefined && e.cadencia !== 'salva') l.erro('entrega: "quantidade" só vale na salva');
  if (o.duracaoMs !== undefined && e.duracaoMs === 0) l.erro('entrega: "duracaoMs" só vale na rajada e no feixe');
  // As combinações que o motor ajusta sozinho (o grimório): o feixe anda em reta; o céu e o círculo sob o alvo não
  // andam de lado; no sentido de volta e no da invocação, a origem é o alvo ou o servo.
  if (e.cadencia === 'feixe' && e.trajetoria !== 'reta') l.erro('entrega: o feixe anda em reta');
  if ((e.origem === 'ceu' || e.origem === 'sob_alvo') && e.trajetoria !== 'reta') l.erro(`entrega: a origem "${e.origem}" não tem trajetória lateral`);
  if (e.sentido !== 'ida' && e.origem !== 'mao') l.erro(`entrega: o sentido "${e.sentido}" sai do alvo ou do servo (origem "mao")`);
  if (e.cadencia === 'feixe' && (e.corpo !== 'medio' || e.permanencia === 'gira')) l.erro('entrega: o feixe não tem corpo nem giro');
  return e;
}

/** O canal em curso (a rajada e o feixe), na entidade que canaliza. Só primitivos (vai para a rede e o save). */
export interface CanalAtivo {
  chave: string;
  habilidadeId: string;
  acaoId: number;
  tipo: 'rajada' | 'feixe';
  alvoId: string | null;
  miraX: number;
  miraY: number;
  ateTick: number;
  proximoTick: number;
  pulsos: number;
  /** A fonte de dano congelada no início (como a do projétil). */
  bonusAtributo: number;
  carisma: number;
  multRolagem: number;
  potencia: number;
  multDano: number;
  multCura: number;
  /** O feixe: a exposição de cada alvo, em % (cresce por pulso, até o teto). */
  exposicao: Record<string, number>;
}
