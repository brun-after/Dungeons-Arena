// Habilidades (§2.8). Habilidade nova é registro novo em src/data/skills.json, não cirurgia:
// a lógica lê só estes campos e nunca depende do tempo de uma animação do cliente (§2.7).
// Marco 12 (14/10/2026): `visual` descreve a aparência como dado (D-055/D-056). É só apresentação: a
// simulação nunca o lê, e o jogo funciona igual sem ele.
// Marco 14 (14/10/2026), D-059: `Habilidade` é a forma **compilada** (rank, caminhos e modificadores já
// aplicados, por compilar-habilidade.ts); o skills.json traz a `DefinicaoHabilidade`: as camadas (efeito,
// forma, tempo, custo, tema e apresentação), o elemento, as etiquetas, o nível mínimo, a passiva e as
// evoluções. Formas novas (linha, cone, ao redor) e alvos novos (aliado, aliados, célula livre).

import { ehObjeto, Leitor, type Objeto } from '../core/validar';
import { formulaValida } from './dados';
import { ehElemento, type Elemento } from './elementos';
import { normalizarEfeitos } from './normalizar-efeito';
import type { EfeitoCanonico } from './registro-efeitos';

export type TipoAtaque = 'fisico' | 'magico';
export const TIPOS_AREA = ['nenhuma', 'quadrado', 'linha', 'cone', 'ao_redor'] as const;
export type TipoArea = (typeof TIPOS_AREA)[number];
/** Marco 14: `aliado` (um, pode ser o próprio), `aliados` (todos no raio, em volta de quem conjura) e `celula`. */
export const POLITICAS_ALVO = ['hostil', 'proprio', 'aliado', 'aliados', 'celula'] as const;
export type PoliticaAlvo = (typeof POLITICAS_ALVO)[number];
/** Como o impacto é resolvido (§2.7): contato e área consultam a geometria no tick do impacto. */
export type PoliticaImpacto = 'contato' | 'projetil' | 'area' | 'proprio';
export type Interrupcao = 'interrompivel' | 'ininterrupta';

/**
 * Ajuste de 15/10/2026 (D-060): o que quem conjura faz com as pernas. `trava` não começa passo novo (a D-017 de
 * antes, o padrão); `lenta` anda mais devagar; `livre` anda normalmente. Andar conjurando custa no orçamento.
 */
export const MOBILIDADES = ['trava', 'lenta', 'livre'] as const;
export type Mobilidade = (typeof MOBILIDADES)[number];

/** Marco 14: modificadores de evolução e de equipamento (D-057). */
export const MODIFICADORES = ['atravessar', 'encadear', 'ecoar', 'maior_e_mais_lenta'] as const;
export type Modificador = (typeof MODIFICADORES)[number];

/** Saltos para alvos próximos depois do golpe principal (encadear; raio sobre eletrizado). */
export interface Saltos {
  quantidade: number;
  raio: number;
  /** Dano de cada salto, em % do golpe. */
  pct: number;
}

/**
 * Passiva (marco 14, só passivas, D-057): vale enquanto a habilidade é conhecida. `tag` restringe os bônus de
 * habilidade às que têm a etiqueta (null = todas); os de ficha valem sempre.
 */
export interface Passiva {
  tag: string | null;
  danoPct: number;
  curaPct: number;
  alcance: number;
  custoPct: number;
  recargaPct: number;
  hpMaxPct: number;
  manaMaxPct: number;
  defesa: number;
}

export interface Habilidade {
  id: string;
  nome: string;
  icone: string;
  tipoAtaque: TipoAtaque;
  formulaDano: string | null;
  formulaCura: string | null;
  alcanceCelulas: number;
  tipoArea: TipoArea;
  raioArea: number;
  custoRecurso: number;
  recargaMs: number;
  conjuracaoMs: number;
  politicaAlvo: PoliticaAlvo;
  politicaImpacto: PoliticaImpacto;
  interrupcao: Interrupcao;
  /** Células por segundo; só para `politicaImpacto: 'projetil'`. */
  velocidadeProjetil: number;
  /** Já normalizados (§2.8): uma entrada canônica por componente. */
  efeitos: EfeitoCanonico[];
  /** Marco 12: aparência (só apresentação); null = deduzida dos efeitos (render/visual-habilidade.ts). */
  visual: VisualHabilidade | null;
  // Marco 14: camadas novas e o resultado da compilação.
  elemento: Elemento | null;
  /** Custo em vida (pago na conjuração; recusa se a vida não bastar). */
  custoVida: number;
  /** Etiquetas: as autoradas mais as deduzidas (físico/mágico, impacto, forma, elemental, custo de vida). */
  tags: readonly string[];
  nivelMinimo: number;
  passiva: Passiva | null;
  rank: number;
  /** A chave compilada (`id@rank/caminhos+mods`), guardada na ação e no projétil. */
  chave: string;
  /** Rank e caminhos multiplicam o dano e a cura (os dados não mudam). */
  multDano: number;
  multCura: number;
  /** Projétil que atravessa os alvos (modificador `atravessar`). */
  perfura: boolean;
  saltos: Saltos | null;
  /** Só apresentação: o rank aumenta o efeito visual. */
  escalaVisual: number;
  /** Ajuste de 15/10/2026: anda enquanto conjura? */
  mobilidade: Mobilidade;
}

// Marco 11A (D-066): um preset por fantasia (corte, runas, cristais, bolhas, sombra, sangue, sagrado, pedra, vento,
// chamas e relâmpago), além dos do marco 12.
export const PRESETS_VISUAIS = [
  'faiscas',
  'brilho',
  'fumaca',
  'anel',
  'rastro',
  'estrelas',
  'brasas',
  'explosao',
  'raio',
  'corte',
  'runas',
  'cristais',
  'bolhas',
  'sombra',
  'sangue',
  'sagrado',
  'pedra',
  'vento',
  'chamas',
  'relampago',
] as const;
export type PresetVisual = (typeof PRESETS_VISUAIS)[number];

/** Aparência de uma habilidade (§2.16, D-055): presets de partícula por momento da ação. */
export interface VisualHabilidade {
  cor: string | null;
  conjuracao: PresetVisual | null;
  viagem: PresetVisual | null;
  impacto: PresetVisual | null;
  camera: 'nenhum' | 'leve' | 'forte';
  /** Id do som (audio/mapeamento.ts); validado lá, pois o catálogo de sons é da apresentação. */
  som: string | null;
}

/** Marco 14: o que o skills.json descreve. A base é a habilidade no rank 1, sem caminhos. */
export interface DefinicaoHabilidade {
  base: Habilidade;
  /** Ataque básico e afins: fora do orçamento de poder. */
  basico: boolean;
  /** Caminhos de evolução por rank (3 e 5), escolha definitiva entre 2 ou 3. */
  evolucoes: Readonly<Record<number, readonly string[]>>;
  /** Modificadores de nascença (ex.: o raio em cadeia sempre encadeia). */
  mods: readonly Modificador[];
}

function lerVisual(l: Leitor, v: unknown): VisualHabilidade | null {
  if (v === undefined || v === null) return null;
  const o = l.objeto(v, 'visual');
  const preset = (campo: string): PresetVisual | null => (o[campo] === undefined ? null : l.opcao(o, campo, PRESETS_VISUAIS));
  const cor = o.cor === undefined ? null : l.texto(o, 'cor');
  if (cor !== null && !/^#[0-9a-f]{6}$/i.test(cor)) l.erro(`visual.cor precisa ser #rrggbb ("${cor}")`);
  for (const k of Object.keys(o)) {
    if (!['cor', 'conjuracao', 'viagem', 'impacto', 'camera', 'som'].includes(k)) l.erro(`visual: campo desconhecido "${k}"`);
  }
  return {
    cor,
    conjuracao: preset('conjuracao'),
    viagem: preset('viagem'),
    impacto: preset('impacto'),
    camera: o.camera === undefined ? 'nenhum' : l.opcao(o, 'camera', ['nenhum', 'leve', 'forte'] as const),
    som: o.som === undefined ? null : l.texto(o, 'som'),
  };
}

const CAMPOS_PASSIVA = ['tag', 'danoPct', 'curaPct', 'alcance', 'custoPct', 'recargaPct', 'hpMaxPct', 'manaMaxPct', 'defesa'];

export function lerPassiva(l: Leitor, v: unknown): Passiva | null {
  if (v === undefined || v === null) return null;
  const o = l.objeto(v, 'passiva');
  for (const k of Object.keys(o)) if (!CAMPOS_PASSIVA.includes(k)) l.erro(`passiva: campo desconhecido "${k}"`);
  const n = (campo: string, min: number, max: number) => (o[campo] === undefined ? 0 : l.numero(o, campo, { min, max }));
  return {
    tag: o.tag === undefined ? null : l.texto(o, 'tag'),
    danoPct: n('danoPct', -100, 300),
    curaPct: n('curaPct', -100, 300),
    alcance: n('alcance', -5, 5),
    custoPct: n('custoPct', -90, 300),
    recargaPct: n('recargaPct', -90, 300),
    hpMaxPct: n('hpMaxPct', -50, 200),
    manaMaxPct: n('manaMaxPct', -50, 200),
    defesa: n('defesa', -20, 20),
  };
}

/** Etiquetas deduzidas das camadas; as autoradas vêm junto, sem repetição, em ordem fixa. */
export function etiquetasDe(h: Pick<Habilidade, 'tipoAtaque' | 'politicaImpacto' | 'tipoArea' | 'politicaAlvo' | 'elemento' | 'custoVida' | 'formulaCura' | 'passiva'>, autoradas: readonly string[]): string[] {
  const t = new Set<string>(autoradas);
  t.add(h.tipoAtaque);
  t.add(h.politicaImpacto);
  if (h.tipoArea !== 'nenhuma') t.add(h.tipoArea);
  if (h.politicaAlvo === 'aliado' || h.politicaAlvo === 'aliados') t.add('suporte');
  if (h.elemento) {
    t.add('elemental');
    t.add(h.elemento);
  }
  if (h.custoVida > 0) t.add('custo_vida');
  if (h.formulaCura !== null) t.add('cura');
  if (h.passiva) t.add('passiva');
  return [...t].sort();
}

export type Catalogo<T> = ReadonlyMap<string, T>;

/** Marco 14: como a apresentação acha a habilidade de um evento (pela chave compilada ou pelo id). */
export type BuscaHabilidade = (chave: string) => Habilidade | undefined;

function lerEvolucoes(l: Leitor, v: unknown): Record<number, string[]> {
  if (v === undefined) return {};
  const o: Objeto = l.objeto(v, 'evolucoes');
  const saida: Record<number, string[]> = {};
  for (const k of Object.keys(o)) {
    const rank = Number(k);
    if (!Number.isInteger(rank) || rank < 2 || rank > 9) l.erro(`evolucoes: rank inválido "${k}"`);
    const caminhos = l.listaDeTextos(o, k);
    if (caminhos.length < 2 || caminhos.length > 3) l.erro(`evolucoes ${k}: escolha entre 2 ou 3 caminhos`);
    saida[rank] = caminhos;
  }
  return saida;
}

/** Lê uma definição (catálogo ou gerada); erros vão para o `Leitor`. */
export function lerDefinicao(item: unknown, l: Leitor): DefinicaoHabilidade {
  const o = l.objeto(item, 'habilidade');
  const elemento = o.elemento === undefined || o.elemento === null ? null : ehElemento(o.elemento) ? o.elemento : null;
  if (o.elemento !== undefined && o.elemento !== null && !elemento) l.erro(`elemento desconhecido "${JSON.stringify(o.elemento)}"`);
  const base: Habilidade = {
    id: l.texto(o, 'id'),
    nome: l.texto(o, 'nome'),
    icone: l.icone(o, 'icone'),
    tipoAtaque: l.opcao(o, 'tipoAtaque', ['fisico', 'magico'] as const),
    formulaDano: l.textoOuNulo(o, 'formulaDano'),
    formulaCura: l.textoOuNulo(o, 'formulaCura'),
    alcanceCelulas: l.numero(o, 'alcanceCelulas', { min: 0, max: 30, inteiro: true }),
    tipoArea: l.opcao(o, 'tipoArea', TIPOS_AREA),
    raioArea: l.numero(o, 'raioArea', { min: 0, max: 5, inteiro: true }),
    custoRecurso: l.numero(o, 'custoRecurso', { min: 0, inteiro: true }),
    recargaMs: l.numero(o, 'recargaMs', { min: 0 }),
    conjuracaoMs: l.numero(o, 'conjuracaoMs', { min: 0 }),
    politicaAlvo: l.opcao(o, 'politicaAlvo', POLITICAS_ALVO),
    politicaImpacto: l.opcao(o, 'politicaImpacto', ['contato', 'projetil', 'area', 'proprio'] as const),
    interrupcao: l.opcao(o, 'interrupcao', ['interrompivel', 'ininterrupta'] as const),
    velocidadeProjetil: l.numero(o, 'velocidadeProjetil', { min: 0, max: 60 }),
    efeitos: normalizarEfeitos(l.lista(o, 'efeitos'), l),
    visual: lerVisual(l, o.visual),
    elemento,
    custoVida: o.custoVida === undefined ? 0 : l.numero(o, 'custoVida', { min: 0, max: 100, inteiro: true }),
    tags: [],
    nivelMinimo: o.nivelMinimo === undefined ? 1 : l.numero(o, 'nivelMinimo', { min: 1, max: 20, inteiro: true }),
    passiva: lerPassiva(l, o.passiva),
    mobilidade: o.mobilidade === undefined ? 'trava' : l.opcao(o, 'mobilidade', MOBILIDADES),
    rank: 1,
    chave: '',
    multDano: 1,
    multCura: 1,
    perfura: false,
    saltos: null,
    escalaVisual: 1,
  };
  base.tags = etiquetasDe(base, o.tags === undefined ? [] : l.listaDeTextos(o, 'tags'));
  base.chave = base.id;
  const h = base;
  if (!/^[a-z0-9_]+$/.test(h.id)) l.erro(`id "${h.id}" só aceita a–z, 0–9 e _`);
  if (h.formulaDano !== null && !formulaValida(h.formulaDano)) l.erro(`fórmula de dano inválida: ${h.formulaDano}`);
  if (h.formulaCura !== null && !formulaValida(h.formulaCura)) l.erro(`fórmula de cura inválida: ${h.formulaCura}`);
  if (h.politicaImpacto === 'projetil' && h.velocidadeProjetil <= 0) l.erro('projétil precisa de velocidade');
  if (h.politicaImpacto === 'area' && h.tipoArea === 'nenhuma') l.erro('impacto em área precisa de tipoArea');
  if (h.politicaImpacto !== 'area' && h.tipoArea !== 'nenhuma') l.erro(`tipoArea "${h.tipoArea}" só vale com impacto em área`);
  if ((h.politicaAlvo === 'proprio') !== (h.politicaImpacto === 'proprio')) {
    l.erro('politicaAlvo e politicaImpacto "proprio" andam juntos');
  }
  if (h.politicaAlvo === 'aliados' && h.tipoArea !== 'ao_redor') l.erro('alvo "aliados" é em volta de quem conjura (tipoArea "ao_redor")');
  if (h.passiva && (h.politicaImpacto !== 'proprio' || h.formulaDano !== null || h.formulaCura !== null || h.efeitos.length > 0)) {
    l.erro('passiva não se conjura: impacto "proprio", sem dano, cura nem efeitos');
  }
  for (const k of Object.keys(o)) {
    if (!CAMPOS_DEFINICAO.includes(k)) l.erro(`campo desconhecido "${k}"`);
  }
  return {
    base,
    basico: o.basico === undefined ? false : l.booleano(o, 'basico'),
    evolucoes: lerEvolucoes(l, o.evolucoes),
    mods: o.mods === undefined ? [] : l.listaDeTextos(o, 'mods').filter((m): m is Modificador => {
      if ((MODIFICADORES as readonly string[]).includes(m)) return true;
      l.erro(`modificador desconhecido "${m}"`);
      return false;
    }),
  };
}

const CAMPOS_DEFINICAO = [
  'id', 'nome', 'icone', 'tipoAtaque', 'formulaDano', 'formulaCura', 'alcanceCelulas', 'tipoArea', 'raioArea',
  'custoRecurso', 'recargaMs', 'conjuracaoMs', 'politicaAlvo', 'politicaImpacto', 'interrupcao', 'velocidadeProjetil',
  'efeitos', 'visual', 'elemento', 'custoVida', 'tags', 'nivelMinimo', 'passiva', 'basico', 'evolucoes', 'mods',
  'mobilidade',
];

export function lerHabilidades(json: unknown): { definicoes: Map<string, DefinicaoHabilidade>; erros: string[] } {
  const definicoes = new Map<string, DefinicaoHabilidade>();
  const raiz = new Leitor('skills.json');
  const lista = raiz.lista(raiz.objeto(json, 'raiz'), 'habilidades');
  const erros = [...raiz.erros];

  for (const item of lista) {
    const id = ehObjeto(item) && typeof item.id === 'string' ? item.id : '?';
    const l = new Leitor(`habilidade ${id}`);
    const def = lerDefinicao(item, l);
    if (definicoes.has(def.base.id)) l.erro('id repetido');
    if (def.base.id.startsWith('g_')) l.erro('o prefixo "g_" é das habilidades geradas');
    erros.push(...l.erros);
    definicoes.set(def.base.id, def);
  }
  return { definicoes, erros };
}
