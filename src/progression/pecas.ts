// As peças de armadura por propósito, estilo, grau e efeito (marco 46, 16/11/2026, D-189). Puro.
//
// O visual sai da classe: cada peça tem um PROPÓSITO (a silhueta: baluarte, batedor, arcano, espreita, ossuário) e um
// ESTILO (só visual, a persona: simples, medieval, colorida, arcana, meme), além do GRAU (0 a 5) que já existia.
// Cada peça também tem EFEITOS no modelo único `gatilho > condição > efeito`, tudo em data/pecas.json, medido em
// ticks. O que cada tipo de peça aceita está em `aceita` (sem código por peça).
//
// O perfil é fixo na peça e nasce do id (como o resto do item gerado): a semente do id sorteia o propósito, o estilo,
// o elemento das receitas com `"*"` (o elemento do item, se ele tiver) e as receitas, uma por nível do grau (1 nos
// graus 0–1, 2 nos 2–3, 3 nos 4–5). Os números crescem com `escalaPorGrau` e o motor respeita os `tetos`.

import { ehElemento, type Elemento } from '../combat/elementos';
import { criarRng, hashTexto, inteiro, type EstadoRng, aleatorio } from '../core/rng';
import { Leitor, ehObjeto, type Objeto } from '../core/validar';
import { ehPecaDeArmadura, grauDe, PECAS_DE_ARMADURA, type PecaDeArmadura } from './graus';

export const GATILHOS_DE_PECA = ['pisar', 'usar', 'atingido', 'atacar', 'movimento', 'chegada', 'passivo'] as const;
export type GatilhoDePeca = (typeof GATILHOS_DE_PECA)[number];
export const TIPOS_EFEITO_DE_PECA = ['velocidade', 'dano', 'refletir', 'recargaMovimento', 'rastro', 'chegadaDano', 'chegadaEscudo', 'poderElemento', 'absorver', 'resistencia'] as const;
export type TipoEfeitoDePeca = (typeof TIPOS_EFEITO_DE_PECA)[number];
export const ATAQUES_DE_PECA = ['corpoACorpo', 'distancia', 'magia', 'qualquer'] as const;
export type AtaqueDePeca = (typeof ATAQUES_DE_PECA)[number];
/** As marcas visuais do efeito (a peça se reconhece pelo que faz: os espinhos do reflexo, as penas da velocidade). */
export const MARCAS_DE_PECA = ['espinhos', 'garras', 'penas', 'filigrana', 'brasa', 'placas'] as const;
export type MarcaDePeca = (typeof MARCAS_DE_PECA)[number];

/** O elemento da condição: um elemento, o Físico (golpe sem elemento) ou `*` (o da peça, resolvido no perfil). */
export type ElementoDaCondicao = Elemento | 'fisico';

export interface CondicaoDePeca {
  /** null = qualquer elemento (ou nenhum). */
  elemento: ElementoDaCondicao | null;
  ataque: AtaqueDePeca;
}

export type EfeitoDePeca =
  /** Bônus de velocidade por `ticks`; disparar de novo renova o tempo (não acumula). */
  | { tipo: 'velocidade'; pct: number; ticks: number }
  /** Dano a mais no golpe que cumpre a condição. */
  | { tipo: 'dano'; pct: number }
  /** Parte do dano levado volta a quem bateu (só se ele for hostil, pela `relacao()`). */
  | { tipo: 'refletir'; pct: number }
  /** O movimento da classe recarrega tanto % mais rápido. */
  | { tipo: 'recargaMovimento'; pct: number }
  /** O movimento deixa por `ticks` um rastro que passa o estado do elemento a quem é hostil e pisa nele. */
  | { tipo: 'rastro'; ticks: number }
  /** Na chegada do movimento, dano (em % do poder base) nos hostis a até `raio` células. */
  | { tipo: 'chegadaDano'; pctDoPoder: number; raio: number }
  /** Na chegada do movimento, escudo de tanto % da vida por `ticks`. */
  | { tipo: 'chegadaEscudo'; pctDaVida: number; ticks: number }
  /** Passivo: mais poder nas skills do elemento. */
  | { tipo: 'poderElemento'; pct: number }
  /** Contra-ataque: absorve tanto % do golpe do elemento e o converte em poder (por `ticks`) ou em sintonia. */
  | { tipo: 'absorver'; pct: number; em: 'poder' | 'sintonia'; ticks: number }
  /** Passivo: resistência ao elemento. */
  | { tipo: 'resistencia'; pct: number };

export interface ReceitaDePeca {
  id: string;
  peca: PecaDeArmadura;
  gatilho: GatilhoDePeca;
  /** A condição como está nos dados (`elemento: "*"` ainda sem resolver). */
  se: { elemento: ElementoDaCondicao | '*' | null; ataque: AtaqueDePeca };
  efeito: EfeitoDePeca;
  marca: MarcaDePeca;
  /** A receita só sai em peças a partir deste grau. */
  grauMinimo: number;
}

/** Um efeito da peça já resolvido (elemento e números pelo grau). */
export interface EfeitoDaPeca {
  receita: string;
  gatilho: GatilhoDePeca;
  se: CondicaoDePeca;
  efeito: EfeitoDePeca;
}

export interface PerfilDePeca {
  peca: PecaDeArmadura;
  proposito: string;
  estilo: string;
  grau: number;
  /** O elemento da peça (o do item ou o sorteado), que as receitas com `*` usam. */
  elemento: Elemento;
  efeitos: EfeitoDaPeca[];
  /** A marca visual do primeiro efeito (o que define a peça). */
  marca: MarcaDePeca;
}

export interface RegrasDePecas {
  propositos: ReadonlyMap<string, { classe: string; peso: number }>;
  estilos: ReadonlyMap<string, { peso: number }>;
  efeitosPorGrau: readonly number[];
  escalaPorGrau: readonly number[];
  elementosSorteaveis: readonly Elemento[];
  tetos: Readonly<Record<'velocidadePct' | 'danoPct' | 'refletirPct' | 'recargaMovimentoPct' | 'poderElementoPct' | 'absorverPct' | 'resistenciaPct', number>>;
  /** De quantos em quantos ticks o chão sob os pés é lido (o gatilho `pisar`). */
  pisarCadaTicks: number;
  aceita: ReadonlyMap<PecaDeArmadura, ReadonlySet<string>>;
  receitas: readonly ReceitaDePeca[];
}

const par = (g: string, t: string) => `${g}>${t}`;

function lerEfeito(l: Leitor, o: Objeto): EfeitoDePeca | null {
  const tipo = l.opcao(o, 'tipo', TIPOS_EFEITO_DE_PECA);
  const pct = (campo = 'pct') => l.numero(o, campo, { min: 0, max: 100 });
  const ticks = (min = 1) => l.numero(o, 'ticks', { min, max: 60 * 60, inteiro: true });
  switch (tipo) {
    case 'velocidade': return { tipo, pct: pct(), ticks: ticks() };
    case 'dano': case 'refletir': case 'recargaMovimento': case 'poderElemento': case 'resistencia': return { tipo, pct: pct() };
    case 'rastro': return { tipo, ticks: ticks() };
    case 'chegadaDano': return { tipo, pctDoPoder: l.numero(o, 'pctDoPoder', { min: 0, max: 500 }), raio: l.numero(o, 'raio', { min: 1, max: 6, inteiro: true }) };
    case 'chegadaEscudo': return { tipo, pctDaVida: pct('pctDaVida'), ticks: ticks() };
    case 'absorver': {
      const em = l.opcao(o, 'em', ['poder', 'sintonia'] as const);
      return { tipo, pct: pct(), em, ticks: em === 'poder' ? ticks() : 0 };
    }
  }
  return null;
}

function pesos(l: Leitor, v: unknown, campo: string): Map<string, Objeto> {
  const o = l.objeto(v, campo);
  const m = new Map<string, Objeto>();
  for (const [k, x] of Object.entries(o)) m.set(k, l.objeto(x, `${campo}.${k}`));
  if (m.size === 0) l.erro(`${campo}: vazio`);
  return m;
}

export function lerPecas(json: unknown): { pecas: RegrasDePecas; erros: string[] } {
  const l = new Leitor('pecas.json');
  const o = l.objeto(json, 'raiz');
  const propositos = new Map([...pesos(l, o.propositos, 'propositos')].map(([k, p]) => [k, { classe: l.texto(p, 'classe'), peso: l.numero(p, 'peso', { min: 0, max: 100 }) }]));
  const estilos = new Map([...pesos(l, o.estilos, 'estilos')].map(([k, p]) => [k, { peso: l.numero(p, 'peso', { min: 0, max: 100 }) }]));
  for (const k of [...propositos.keys(), ...estilos.keys()]) if (!/^[a-z]+$/.test(k)) l.erro(`"${k}": só letras minúsculas (vai na chave do atlas)`);
  const lista = (campo: string, n: number) => {
    const v = l.lista(o, campo).map((x) => (typeof x === 'number' && x >= 0 ? x : (l.erro(`${campo}: só números`), 0)));
    if (v.length !== n) l.erro(`${campo}: precisa de ${String(n)} valores (um por grau)`);
    return v;
  };
  const efeitosPorGrau = lista('efeitosPorGrau', 6);
  const escalaPorGrau = lista('escalaPorGrau', 6);
  const elementosSorteaveis = l.listaDeTextos(o, 'elementosSorteaveis').filter((e): e is Elemento => ehElemento(e) || (l.erro(`elementosSorteaveis: "${e}"`), false));
  if (elementosSorteaveis.length === 0) l.erro('elementosSorteaveis: vazio');
  const t = l.objeto(o.tetos, 'tetos');
  const teto = (c: string) => l.numero(t, c, { min: 0, max: 100 });
  const tetos = {
    velocidadePct: teto('velocidadePct'), danoPct: teto('danoPct'), refletirPct: teto('refletirPct'), recargaMovimentoPct: teto('recargaMovimentoPct'),
    poderElementoPct: teto('poderElementoPct'), absorverPct: teto('absorverPct'), resistenciaPct: teto('resistenciaPct'),
  };
  const aceita = new Map<PecaDeArmadura, Set<string>>();
  const a = l.objeto(o.aceita, 'aceita');
  for (const peca of PECAS_DE_ARMADURA) {
    const pares = Array.isArray(a[peca]) ? (a[peca] as unknown[]) : (l.erro(`aceita.${peca}: precisa de uma lista`), []);
    const s = new Set<string>();
    for (const p of pares) {
      const [g, e]: unknown[] = Array.isArray(p) ? (p as unknown[]) : [];
      if (!(GATILHOS_DE_PECA as readonly unknown[]).includes(g) || !(TIPOS_EFEITO_DE_PECA as readonly unknown[]).includes(e)) l.erro(`aceita.${peca}: par desconhecido ${JSON.stringify(p)}`);
      else s.add(par(String(g), String(e)));
    }
    aceita.set(peca, s);
  }
  const ids = new Set<string>();
  const receitas: ReceitaDePeca[] = [];
  for (const bruto of l.lista(o, 'receitas')) {
    const r = l.objeto(bruto, 'receitas[]');
    const id = l.texto(r, 'id');
    if (ids.has(id)) l.erro(`receita "${id}" repetida`);
    ids.add(id);
    const peca = ehPecaDeArmadura(r.peca) ? r.peca : (l.erro(`receita "${id}": peça desconhecida`), 'capa' as const);
    const gatilho = l.opcao(r, 'gatilho', GATILHOS_DE_PECA);
    const se = ehObjeto(r.se) ? r.se : {};
    const elemento = se.elemento === undefined ? null : se.elemento === '*' || se.elemento === 'fisico' || ehElemento(se.elemento) ? se.elemento : (l.erro(`receita "${id}": elemento desconhecido`), null);
    const ataque = se.ataque === undefined ? 'qualquer' : l.opcao(se, 'ataque', ATAQUES_DE_PECA);
    const efeito = lerEfeito(l, l.objeto(r.efeito, `receita "${id}".efeito`));
    if (!efeito) continue;
    if (!aceita.get(peca)?.has(par(gatilho, efeito.tipo))) l.erro(`receita "${id}": a peça "${peca}" não aceita ${gatilho} > ${efeito.tipo}`);
    // Os efeitos que dependem do elemento precisam dele na condição.
    if ((efeito.tipo === 'poderElemento' || efeito.tipo === 'absorver' || efeito.tipo === 'rastro' || efeito.tipo === 'resistencia') && elemento === null) l.erro(`receita "${id}": ${efeito.tipo} precisa de "se.elemento"`);
    receitas.push({
      id, peca, gatilho, se: { elemento, ataque }, efeito,
      marca: l.opcao(r, 'marca', MARCAS_DE_PECA),
      grauMinimo: r.grauMinimo === undefined ? 0 : l.numero(r, 'grauMinimo', { min: 0, max: 5, inteiro: true }),
    });
  }
  for (const peca of PECAS_DE_ARMADURA) if (!receitas.some((r) => r.peca === peca && r.grauMinimo === 0)) l.erro(`a peça "${peca}" precisa de ao menos uma receita do grau 0`);
  return { pecas: { propositos, estilos, efeitosPorGrau, escalaPorGrau, elementosSorteaveis, tetos, pisarCadaTicks: l.numero(o, 'pisarCadaTicks', { min: 1, max: 60, inteiro: true }), aceita, receitas }, erros: l.erros };
}

function porPeso<T>(rng: EstadoRng, lista: readonly [T, number][]): T | undefined {
  const total = lista.reduce((s, [, p]) => s + p, 0);
  let x = aleatorio(rng) * total;
  for (const [v, p] of lista) {
    x -= p;
    if (x < 0) return v;
  }
  return lista[lista.length - 1]?.[0];
}

/** Os números do efeito na escala do grau (o tempo e o raio não crescem, exceto o do rastro). */
function escalar(ef: EfeitoDePeca, k: number): EfeitoDePeca {
  const r = (v: number) => Math.round(v * k * 10) / 10;
  switch (ef.tipo) {
    case 'velocidade': return { ...ef, pct: r(ef.pct) };
    // o rastro cresce no tempo (o estado é o do elemento)
    case 'rastro': return { ...ef, ticks: Math.round(ef.ticks * k) };
    case 'chegadaDano': return { ...ef, pctDoPoder: r(ef.pctDoPoder) };
    case 'chegadaEscudo': return { ...ef, pctDaVida: r(ef.pctDaVida) };
    default: return { ...ef, pct: r(ef.pct) };
  }
}

/** O que basta da peça para o perfil: o id (a semente), o slot, a raridade, a forma e o elemento. */
export interface ItemDaPeca {
  id: string;
  slotPadrao: string | null;
  raridade: string;
  forma?: string | null;
  elemento?: Elemento | null;
  /** Os itens fixos podem escolher o propósito e o estilo (itens.json); senão, a semente escolhe. */
  proposito?: string;
  estilo?: string;
}

/**
 * O perfil da peça (null: não é peça de armadura). Determinístico pelo id: o mesmo item tem sempre o mesmo propósito,
 * estilo, elemento e efeitos, em qualquer máquina (cliente, servidor, certificado).
 */
export function perfilDaPeca(regras: RegrasDePecas, item: ItemDaPeca): PerfilDePeca | null {
  const peca = item.slotPadrao;
  if (!ehPecaDeArmadura(peca)) return null;
  const grau = grauDe(item.raridade, item.forma ?? null);
  const rng = criarRng(hashTexto(`peca:${item.id}`));
  const proposito = item.proposito && regras.propositos.has(item.proposito) ? item.proposito : (porPeso(rng, [...regras.propositos].map(([k, v]) => [k, v.peso])) ?? 'baluarte');
  const estilo = item.estilo && regras.estilos.has(item.estilo) ? item.estilo : (porPeso(rng, [...regras.estilos].map(([k, v]) => [k, v.peso])) ?? 'simples');
  const elemento = item.elemento ?? regras.elementosSorteaveis[inteiro(rng, 0, regras.elementosSorteaveis.length - 1)] ?? 'fogo';
  const pool = regras.receitas.filter((r) => r.peca === peca && r.grauMinimo <= grau);
  const n = Math.min(pool.length, regras.efeitosPorGrau[grau] ?? 1);
  const k = regras.escalaPorGrau[grau] ?? 1;
  const efeitos: EfeitoDaPeca[] = [];
  const escolhidas: ReceitaDePeca[] = [];
  while (escolhidas.length < n) {
    const resto = pool.filter((r) => !escolhidas.includes(r));
    const r = resto[inteiro(rng, 0, resto.length - 1)];
    if (!r) break;
    escolhidas.push(r);
    efeitos.push({ receita: r.id, gatilho: r.gatilho, se: { elemento: r.se.elemento === '*' ? elemento : r.se.elemento, ataque: r.se.ataque }, efeito: escalar(r.efeito, k) });
  }
  return { peca, proposito, estilo, grau, elemento, efeitos, marca: escolhidas[0]?.marca ?? 'placas' };
}

/** A chave visual da peça (propósito, estilo e marca), a que vai na aparência pública. */
export const codigoVisual = (p: Pick<PerfilDePeca, 'proposito' | 'estilo' | 'marca'>): string => `${p.proposito}.${p.estilo}.${p.marca}`;

/** Lê a chave visual (null se não tiver a forma). */
export function lerCodigoVisual(codigo: string | null | undefined): { proposito: string; estilo: string; marca: string } | null {
  const [proposito, estilo, marca] = (codigo ?? '').split('.');
  return proposito && estilo && marca ? { proposito, estilo, marca } : null;
}

/** O propósito que veio do kit da classe (o atlas antigo de cada classe vira o deste propósito). */
export function propositoDaClasse(regras: Pick<RegrasDePecas, 'propositos'>, classe: string): string | null {
  for (const [k, v] of regras.propositos) if (v.classe === classe) return k;
  return null;
}
