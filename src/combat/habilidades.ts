// Habilidades (§2.8). Habilidade nova é registro novo em src/data/skills.json, não cirurgia:
// a lógica lê só estes campos e nunca depende do tempo de uma animação do cliente (§2.7).
// Marco 12 (14/10/2026): `visual` descreve a aparência como dado (D-055/D-056). É só apresentação: a
// simulação nunca o lê, e o jogo funciona igual sem ele.
// Marco 14 (14/10/2026), D-059: `Habilidade` é a forma **compilada** (rank, caminhos e modificadores já
// aplicados, por compilar-habilidade.ts); o skills.json traz a `DefinicaoHabilidade`: as camadas (efeito,
// forma, tempo, custo, tema e apresentação), o elemento, as etiquetas, o nível mínimo, a passiva e as
// evoluções. Formas novas (linha, cone, ao redor) e alvos novos (aliado, aliados, célula livre).

import { lerVariacao, type VariacaoBasico } from './variacoes';
import { ehObjeto, Leitor, type Objeto } from '../core/validar';
import { formulaValida } from './dados';
import { ehElemento, type Elemento } from './elementos';
import { normalizarEfeitos } from './normalizar-efeito';
import type { Atributos } from '../entities/entidade';
import { ehTipoEfeito, type EfeitoCanonico, type TipoEfeito } from './registro-efeitos';
import { ASSINATURAS_VISUAIS, VARIANTES_VISUAIS, type AssinaturaVisual, type VarianteVisual } from './assinaturas-visuais';

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

/** Marco 18 (17/10/2026, D-068): o grau da habilidade (B, A, S) — decide o tempo de estudo para aprender. */
export const GRAUS = ['B', 'A', 'S'] as const;
export type Grau = (typeof GRAUS)[number];

/** Marco 18 (D-068): o atributo do bônus fixo de dano. Sem `escalaCom`, físico usa Força e mágico, Inteligência. */
export type AtributoDeEscala = keyof Atributos;
const ATRIBUTOS_DE_ESCALA: readonly AtributoDeEscala[] = ['forca', 'destreza', 'constituicao', 'inteligencia', 'sabedoria', 'carisma'];
export type Mobilidade = (typeof MOBILIDADES)[number];

/** Marco 14: modificadores de evolução e de equipamento (D-057). */
export const MODIFICADORES = ['atravessar', 'encadear', 'ecoar', 'maior_e_mais_lenta'] as const;
export type Modificador = (typeof MODIFICADORES)[number];

/**
 * Marco 24 (24/10/2026, D-094): as variantes de uma habilidade, ligadas pelo estado de quem usa. `frenesi` (o
 * Guerreiro em Frenesi), `furia_alta` (fúria acima da metade) e `enc_<elemento>` (o elemento que o Mago encarna).
 */
export const VARIANTES = ['frenesi', 'furia_alta', 'enc_fogo', 'enc_gelo', 'enc_raio', 'enc_terra', 'enc_veneno', 'enc_trevas', 'enc_sagrado',
  // Marco 24 (D-095): as marcas de Domínio nas ultimates (2 gerais da mesma família nas teclas 3–6).
  'dom_tecnica', 'dom_arcana', 'dom_suporte', 'dom_fogo', 'dom_veneno', 'dom_terra', 'dom_sombra', 'dom_sagrado', 'dom_psiquico'] as const;
export type Variante = (typeof VARIANTES)[number];

/** Marco 24: o que uma variante muda — os ajustes de um marco, mais a conjuração, o elemento e efeitos trocados. */
export interface AjusteDeVariante extends MarcoDeNivel {
  conjuracaoPct: number;
  elemento: Elemento | null;
  /** Efeitos que substituem os do mesmo tipo (a Investida que avança 4, o arco do Contragolpe que vira 360°). */
  trocar: readonly EfeitoCanonico[];
}

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
  tenacidadePct?: number;
  fluxoEscudoPct?: number;
  tag: string | null;
  danoPct: number;
  curaPct: number;
  alcance: number;
  custoPct: number;
  recargaPct: number;
  hpMaxPct: number;
  manaMaxPct: number;
  defesa: number;
  // Marco 24 (24/10/2026, D-095): as passivas gerais (uma defensiva e uma ofensiva por família).
  /** Dano físico e mágico recebido a menos, em %. */
  reducaoFisicoPct?: number;
  reducaoMagicoPct?: number;
  /** Resistência por elemento, em %. */
  resistencias?: Partial<Record<Elemento, number>>;
  /** Quanto duram em você os estados recebidos (−20 = 20% menos). */
  duracaoRecebidaPct?: Partial<Record<TipoEfeito, number>>;
  /** Estados que não pegam em você. */
  imunes?: readonly TipoEfeito[];
  /** Chance de aplicar um estado a cada golpe que acerta. */
  aoAcertar?: { chancePct: number; efeito: EfeitoCanonico } | null;
  /** Os estados desse tipo que você aplica batem mais (`valorPct`) e duram mais (`duracaoMs`). */
  reforcoEstado?: { tipo: TipoEfeito; valorPct: number; duracaoMs: number } | null;
  /** Dano a mais contra alvos com algum destes estados. */
  danoContraEstados?: { estados: readonly TipoEfeito[]; pct: number } | null;
  esquivaPct?: number;
  esquivaInvisivelPct?: number;
  /** Dano a mais nos golpes pelas costas. */
  costasPct?: number;
  /** Cura recebida a mais, em %. */
  curaRecebidaPct?: number;
  /** Resistência elemental do alvo ignorada, em %. */
  resistenciaIgnoradaPct?: number;
  /** `defensiva` ou `ofensiva` nas passivas gerais; null nas demais. */
  tipo?: 'defensiva' | 'ofensiva' | null;
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
  saltosExtrasCombo?: number;
  /** Só apresentação: o rank aumenta o efeito visual. */
  escalaVisual: number;
  /** Ajuste de 15/10/2026: anda enquanto conjura? */
  mobilidade: Mobilidade;
  /** Marco 18 (D-068): o atributo do bônus fixo de dano. */
  escalaCom: AtributoDeEscala;
  /** Marco 18 (D-068): grau B, A ou S (tempo de estudo para aprender). */
  grau: Grau;
  /** Marco 27 (29/10/2026, D-126): a variação do básico da arma (combat/variacoes.ts); ausente = nenhuma. */
  variacao?: VariacaoBasico;
  /** D-126: os atributos que escalam a rolagem do básico da arma (ausente = Força e Inteligência, ou Destreza). */
  escalaRolagem?: readonly AtributoDeEscala[];
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
  // Ajuste de 16/10/2026 (D-067): flechas de verdade — a esteira fina e orientada, as farpas do acerto, a chuva caindo
  // e o leque de flechas.
  'esteira',
  'farpas',
  'chuva',
  'leque',
] as const;
export type PresetVisual = (typeof PRESETS_VISUAIS)[number];

/** Ajuste de 16/10/2026 (D-067): o corpo do projétil em voo (o físico deduz `flecha`; o mágico, `orbe`). */
export const FORMAS_PROJETIL = ['orbe', 'flecha', 'teia'] as const;
export type FormaProjetil = (typeof FORMAS_PROJETIL)[number];

/** Aparência de uma habilidade (§2.16, D-055): presets de partícula por momento da ação. */
export interface VisualHabilidade {
  cor: string | null;
  conjuracao: PresetVisual | null;
  viagem: PresetVisual | null;
  impacto: PresetVisual | null;
  camera: 'nenhum' | 'leve' | 'forte';
  /** D-067: o corpo do projétil (null = deduz pelo tipo de ataque). */
  projetil: FormaProjetil | null;
  /** Id do som (audio/mapeamento.ts); validado lá, pois o catálogo de sons é da apresentação. */
  som: string | null;
  /** Marco 24 (25/10/2026, D-098): a animação do corpo (`giro`: o Redemoinho e afins); ausente, a da arma. */
  animacao?: 'giro';
  /** Marco 26 (29/10/2026, D-124): o desenho próprio da skill (lista fechada); ausente, o render deduz. */
  assinatura?: AssinaturaVisual;
  /** D-124: o toque que se soma à assinatura (distingue duas skills com a mesma). */
  variante?: VarianteVisual;
}

/** Marco 14: o que o skills.json descreve. A base é a habilidade no rank 1, sem caminhos. */
export interface DefinicaoHabilidade {
  familiaEvolucao?: string;
  base: Habilidade;
  /** Ataque básico e afins: fora do orçamento de poder. */
  basico: boolean;
  /** Caminhos de evolução por rank (3 e 5), escolha definitiva entre 2 ou 3. */
  evolucoes: Readonly<Record<number, readonly string[]>>;
  /** Modificadores de nascença (ex.: o raio em cadeia sempre encadeia). */
  mods: readonly Modificador[];
  /**
   * Marco 18 (17/10/2026, D-068, camada 2): o que cada nível muda além do número — o toque do nível 2 e a assinatura
   * do nível 4. Valem sozinhos ao chegar no nível, como um caminho sem escolha.
   */
  marcos: Readonly<Record<number, MarcoDeNivel>>;
  /** Marco 18 (camada 7): a fusão nasce de duas habilidades no nível máximo (null = não é fusão). */
  fusao: readonly string[] | null;
  /** Marco 24 (D-094): o que muda em cada variante (vazio = nenhuma). */
  variantes: Readonly<Partial<Record<Variante, AjusteDeVariante>>>;
  /** Marco 24: habilidade interna (fase de ultimate, resposta do Contragolpe): não vai para barra, livro nem orçamento. */
  interna: boolean;
  /** Marco 24 (D-095): a família da sintonia de uma skill geral (tecnica, arcana, suporte, fogo, …). */
  familiaGeral?: string;
}

/** Marco 18: um marco de nível — os mesmos ajustes de um caminho, com o texto que a carta mostra. */
export interface MarcoDeNivel {
  texto: string;
  danoPct: number;
  custoPct: number;
  recargaPct: number;
  duracaoPct: number;
  alcance: number;
  raio: number;
  efeitos: readonly EfeitoCanonico[];
  mods: readonly Modificador[];
}

function lerMarcos(l: Leitor, v: unknown): Record<number, MarcoDeNivel> {
  if (v === undefined) return {};
  const o: Objeto = l.objeto(v, 'marcos');
  const saida: Record<number, MarcoDeNivel> = {};
  for (const k of Object.keys(o)) {
    const nivel = Number(k);
    if (!Number.isInteger(nivel) || nivel < 2 || nivel > 9) l.erro(`marcos: nível inválido "${k}"`);
    const m = l.objeto(o[k], `marcos.${k}`);
    const n = (campo: string, min: number, max: number) => (m[campo] === undefined ? 0 : l.numero(m, campo, { min, max }));
    saida[nivel] = {
      texto: l.texto(m, 'texto'),
      danoPct: n('danoPct', -50, 100),
      custoPct: n('custoPct', -90, 100),
      recargaPct: n('recargaPct', -90, 100),
      duracaoPct: n('duracaoPct', -50, 200),
      alcance: n('alcance', -3, 3),
      raio: n('raio', -1, 2),
      efeitos: m.efeitos === undefined ? [] : normalizarEfeitos(l.lista(m, 'efeitos'), l),
      mods: m.mods === undefined ? [] : l.listaDeTextos(m, 'mods').filter((x): x is Modificador => (MODIFICADORES as readonly string[]).includes(x)),
    };
  }
  return saida;
}

function lerVariantes(l: Leitor, v: unknown): Partial<Record<Variante, AjusteDeVariante>> {
  if (v === undefined) return {};
  const o: Objeto = l.objeto(v, 'variantes');
  const saida: Partial<Record<Variante, AjusteDeVariante>> = {};
  for (const k of Object.keys(o)) {
    if (!(VARIANTES as readonly string[]).includes(k)) {
      l.erro(`variantes: "${k}" desconhecida`);
      continue;
    }
    const m = l.objeto(o[k], `variantes.${k}`);
    const n = (campo: string, min: number, max: number) => (m[campo] === undefined ? 0 : l.numero(m, campo, { min, max }));
    const elemento = m.elemento === undefined ? null : ehElemento(m.elemento) ? m.elemento : null;
    if (m.elemento !== undefined && !elemento) l.erro(`variantes.${k}: elemento desconhecido`);
    const resto = Object.fromEntries(Object.entries(m).filter(([c]) => !['conjuracaoPct', 'elemento', 'trocar'].includes(c)));
    const base = lerMarcos(l, { 2: { ...resto, texto: m.texto ?? k } })[2];
    if (!base) continue;
    saida[k as Variante] = {
      ...base,
      conjuracaoPct: n('conjuracaoPct', -100, 200),
      elemento,
      trocar: m.trocar === undefined ? [] : normalizarEfeitos(l.lista(m, 'trocar'), l),
    };
  }
  return saida;
}

function lerVisual(l: Leitor, v: unknown): VisualHabilidade | null {
  if (v === undefined || v === null) return null;
  const o = l.objeto(v, 'visual');
  const preset = (campo: string): PresetVisual | null => (o[campo] === undefined ? null : l.opcao(o, campo, PRESETS_VISUAIS));
  const cor = o.cor === undefined ? null : l.texto(o, 'cor');
  if (cor !== null && !/^#[0-9a-f]{6}$/i.test(cor)) l.erro(`visual.cor precisa ser #rrggbb ("${cor}")`);
  for (const k of Object.keys(o)) {
    if (!['cor', 'conjuracao', 'viagem', 'impacto', 'camera', 'som', 'projetil', 'animacao', 'assinatura', 'variante'].includes(k)) l.erro(`visual: campo desconhecido "${k}"`);
  }
  return {
    cor,
    conjuracao: preset('conjuracao'),
    viagem: preset('viagem'),
    impacto: preset('impacto'),
    camera: o.camera === undefined ? 'nenhum' : l.opcao(o, 'camera', ['nenhum', 'leve', 'forte'] as const),
    projetil: o.projetil === undefined ? null : l.opcao(o, 'projetil', FORMAS_PROJETIL),
    som: o.som === undefined ? null : l.texto(o, 'som'),
    ...(o.animacao === undefined ? {} : { animacao: l.opcao(o, 'animacao', ['giro'] as const) }),
    ...(o.assinatura === undefined ? {} : { assinatura: l.opcao(o, 'assinatura', ASSINATURAS_VISUAIS) }),
    ...(o.variante === undefined ? {} : { variante: l.opcao(o, 'variante', VARIANTES_VISUAIS) }),
  };
}

const CAMPOS_PASSIVA = ['tag', 'danoPct', 'curaPct', 'alcance', 'custoPct', 'recargaPct', 'hpMaxPct', 'manaMaxPct', 'defesa', 'tenacidadePct', 'fluxoEscudoPct',
  'reducaoFisicoPct', 'reducaoMagicoPct', 'resistencias', 'duracaoRecebidaPct', 'imunes', 'aoAcertar', 'reforcoEstado', 'danoContraEstados',
  'esquivaPct', 'esquivaInvisivelPct', 'costasPct', 'curaRecebidaPct', 'resistenciaIgnoradaPct', 'tipo'];

/** Marco 24 (D-095): um mapa de chave para porcentagem (`resistencias`, `duracaoRecebidaPct`), com as chaves conferidas. */
function lerMapaPct<K extends string>(l: Leitor, o: Objeto, campo: string, valida: (k: string) => k is K): Partial<Record<K, number>> | undefined {
  if (o[campo] === undefined) return undefined;
  const m = l.objeto(o[campo], campo);
  const saida: Partial<Record<K, number>> = {};
  for (const k of Object.keys(m)) {
    if (!valida(k)) l.erro(`passiva.${campo}: chave desconhecida "${k}"`);
    else saida[k] = l.numero(m, k, { min: -100, max: 100 });
  }
  return saida;
}

function tiposValidos(l: Leitor, lista: readonly string[], campo: string): TipoEfeito[] {
  return lista.filter((x): x is TipoEfeito => {
    if (ehTipoEfeito(x)) return true;
    l.erro(`passiva.${campo}: efeito desconhecido "${x}"`);
    return false;
  });
}

export function lerPassiva(l: Leitor, v: unknown): Passiva | null {
  if (v === undefined || v === null) return null;
  const o = l.objeto(v, 'passiva');
  for (const k of Object.keys(o)) if (!CAMPOS_PASSIVA.includes(k)) l.erro(`passiva: campo desconhecido "${k}"`);
  const n = (campo: string, min: number, max: number) => (o[campo] === undefined ? 0 : l.numero(o, campo, { min, max }));
  return {
    tenacidadePct: n('tenacidadePct', 0, 50),
    fluxoEscudoPct: n('fluxoEscudoPct', 0, 50),
    tag: o.tag == null ? null : l.texto(o, 'tag'),
    danoPct: n('danoPct', -100, 300),
    curaPct: n('curaPct', -100, 300),
    alcance: n('alcance', -5, 5),
    custoPct: n('custoPct', -90, 300),
    recargaPct: n('recargaPct', -90, 300),
    hpMaxPct: n('hpMaxPct', -50, 200),
    manaMaxPct: n('manaMaxPct', -50, 200),
    defesa: n('defesa', -20, 20),
    ...lerPassivaGeral(l, o, n),
  };
}

/** Marco 24 (D-095): os campos das passivas gerais (só os presentes entram, para as passivas antigas ficarem iguais). */
function lerPassivaGeral(l: Leitor, o: Objeto, n: (campo: string, min: number, max: number) => number): Partial<Passiva> {
  const p: Partial<Passiva> = {};
  const nums = [['reducaoFisicoPct', 0, 75], ['reducaoMagicoPct', 0, 75], ['esquivaPct', 0, 50], ['esquivaInvisivelPct', 0, 50], ['costasPct', 0, 100],
    ['curaRecebidaPct', -50, 100], ['resistenciaIgnoradaPct', 0, 100]] as const;
  for (const [campo, min, max] of nums) if (o[campo] !== undefined) p[campo] = n(campo, min, max);
  const resist = lerMapaPct(l, o, 'resistencias', ehElemento);
  if (resist) p.resistencias = resist;
  const duracao = lerMapaPct(l, o, 'duracaoRecebidaPct', ehTipoEfeito);
  if (duracao) p.duracaoRecebidaPct = duracao;
  if (o.imunes !== undefined) p.imunes = tiposValidos(l, l.listaDeTextos(o, 'imunes'), 'imunes');
  if (o.aoAcertar !== undefined) {
    const a = l.objeto(o.aoAcertar, 'aoAcertar');
    const [efeito] = normalizarEfeitos([a.efeito], l);
    if (efeito) p.aoAcertar = { chancePct: l.numero(a, 'chancePct', { min: 1, max: 100 }), efeito };
  }
  if (o.reforcoEstado !== undefined) {
    const r = l.objeto(o.reforcoEstado, 'reforcoEstado');
    const [tipo] = tiposValidos(l, [l.texto(r, 'tipo')], 'reforcoEstado');
    if (tipo) p.reforcoEstado = { tipo, valorPct: r.valorPct === undefined ? 0 : l.numero(r, 'valorPct', { min: 0, max: 200 }), duracaoMs: r.duracaoMs === undefined ? 0 : l.numero(r, 'duracaoMs', { min: 0, max: 10_000 }) };
  }
  if (o.danoContraEstados !== undefined) {
    const d = l.objeto(o.danoContraEstados, 'danoContraEstados');
    p.danoContraEstados = { estados: tiposValidos(l, l.listaDeTextos(d, 'estados'), 'danoContraEstados'), pct: l.numero(d, 'pct', { min: 0, max: 100 }) };
  }
  if (o.tipo !== undefined) p.tipo = l.opcao(o, 'tipo', ['defensiva', 'ofensiva'] as const);
  return p;
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

/** Efeitos que agem na célula mirada (o resto de uma skill de célula cai em quem lança; marco 24: Piscar, Rolamento). */
const DA_CELULA: readonly string[] = ['muralha_pedra', 'passo_sombrio', 'campo_cura', 'campo_veneno'];

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
    raioArea: l.numero(o, 'raioArea', { min: 0, max: 8, inteiro: true }),
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
    nivelMinimo: o.nivelMinimo === undefined ? 1 : l.numero(o, 'nivelMinimo', { min: 1, max: 30, inteiro: true }),
    passiva: lerPassiva(l, o.passiva),
    mobilidade: o.mobilidade === undefined ? 'trava' : l.opcao(o, 'mobilidade', MOBILIDADES),
    escalaCom: 'forca',
    grau: o.grau === undefined ? 'B' : l.opcao(o, 'grau', GRAUS),
    rank: 1,
    chave: '',
    multDano: 1,
    multCura: 1,
    perfura: false,
    saltos: null,
    escalaVisual: 1,
  };
  base.escalaCom = o.escalaCom === undefined ? escalaPadrao(base.tipoAtaque) : l.opcao(o, 'escalaCom', ATRIBUTOS_DE_ESCALA);
  const variacao = lerVariacao(l, o.variacao);
  if (variacao) base.variacao = variacao;
  if (o.escalaRolagem !== undefined) base.escalaRolagem = l.listaDeTextos(o, 'escalaRolagem').map((a) => {
    if ((ATRIBUTOS_DE_ESCALA as readonly string[]).includes(a)) return a as AtributoDeEscala;
    l.erro(`escalaRolagem: atributo desconhecido "${a}"`);
    return 'forca';
  });
  base.tags = etiquetasDe(base, o.tags === undefined ? [] : l.listaDeTextos(o, 'tags'));
  base.chave = base.id;
  const h = base;
  if (!/^[a-z0-9_]+$/.test(h.id)) l.erro(`id "${h.id}" só aceita a–z, 0–9 e _`);
  if (h.formulaDano !== null && !formulaValida(h.formulaDano)) l.erro(`fórmula de dano inválida: ${h.formulaDano}`);
  if (h.formulaCura !== null && !formulaValida(h.formulaCura)) l.erro(`fórmula de cura inválida: ${h.formulaCura}`);
  if (h.politicaImpacto === 'projetil' && h.velocidadeProjetil <= 0) l.erro('projétil precisa de velocidade');
  if (h.politicaImpacto === 'area' && h.tipoArea === 'nenhuma') l.erro('impacto em área precisa de tipoArea');
  if (h.politicaImpacto !== 'area' && h.tipoArea !== 'nenhuma') l.erro(`tipoArea "${h.tipoArea}" só vale com impacto em área`);
  if ((h.politicaAlvo === 'proprio') !== (h.politicaImpacto === 'proprio') && !(h.politicaImpacto === 'proprio' && h.politicaAlvo === 'celula' && h.efeitos.some((e) => DA_CELULA.includes(e.tipo)) && h.efeitos.every((e) => DA_CELULA.includes(e.tipo) || e.em === 'conjurador')) && !(h.politicaImpacto === 'area' && h.tipoArea === 'ao_redor' && h.politicaAlvo === 'proprio')) {
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
    ...(o.familiaEvolucao !== undefined ? { familiaEvolucao: l.texto(o, 'familiaEvolucao') } : {}),
    basico: o.basico === undefined ? false : l.booleano(o, 'basico'),
    evolucoes: lerEvolucoes(l, o.evolucoes),
    mods: o.mods === undefined ? [] : l.listaDeTextos(o, 'mods').filter((m): m is Modificador => {
      if ((MODIFICADORES as readonly string[]).includes(m)) return true;
      l.erro(`modificador desconhecido "${m}"`);
      return false;
    }),
    marcos: lerMarcos(l, o.marcos),
    fusao: o.fusao === undefined ? null : l.listaDeTextos(o, 'fusao'),
    variantes: lerVariantes(l, o.variantes),
    interna: o.interna === undefined ? false : l.booleano(o, 'interna'),
    ...(o.familiaGeral !== undefined ? { familiaGeral: l.texto(o, 'familiaGeral') } : {}),
  };
}

const CAMPOS_DEFINICAO = [
  'id', 'nome', 'icone', 'tipoAtaque', 'formulaDano', 'formulaCura', 'alcanceCelulas', 'tipoArea', 'raioArea',
  'custoRecurso', 'recargaMs', 'conjuracaoMs', 'politicaAlvo', 'politicaImpacto', 'interrupcao', 'velocidadeProjetil',
  'efeitos', 'visual', 'elemento', 'custoVida', 'tags', 'nivelMinimo', 'passiva', 'basico', 'evolucoes', 'mods',
  'mobilidade', 'escalaCom', 'grau', 'marcos', 'fusao', 'familiaEvolucao',
  // Marco 24
  'variantes', 'interna', 'familiaGeral',
  // Marco 27 (D-126)
  'variacao', 'escalaRolagem',
];

/** Marco 18 (D-068): sem `escalaCom`, o físico escala com Força e o mágico com Inteligência. */
export function escalaPadrao(tipo: TipoAtaque): AtributoDeEscala {
  return tipo === 'magico' ? 'inteligencia' : 'forca';
}

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
