// Pentagrama de estilos (marco 39, 12/11/2026, D-147). Substitui as ressonâncias. Cada classe tem cinco estilos, cada um
// com um par de atributos (principal 0,65 e secundário 0,35). A intensidade de um estilo é linear nos pontos postos
// acima de 10 nesses atributos (o que a classe já traz acima de 10 também conta), dividida por `pontosMax` (90: de 10
// a 100). Cada ponto move o radar na hora, desde o nível 2, sem marcos distantes. Os itens formam uma camada por cima
// (o que os afixos de atributo somam, pelos mesmos pesos), limitada a `itemTetoPct` p.p. por ponta e crescendo com o
// nível; com ela, uma ponta pode passar de 100% (até 100 + itemTetoPct).
// O estilo entrega dois tipos de coisa, ambos proporcionais à intensidade:
// - efeitos numéricos (dano, cadência, área, invocações, vida, recuperação, reforço aos aliados), somados entre os
//   cinco estilos e consultados pelo combate e pela ficha;
// - a mecânica do estilo, em ganchos (o mesmo formato de itens e conjuntos): a chance (ou o valor do passivo) é a do
//   catálogo vezes a intensidade.
// Os números do modelo foram medidos no simulador "Pentagrama de Estilos" (paridade ≤ 1,15× entre estilos). Puro.

import type { ContextoSimulacao } from '../core/contexto';
import { MODIFICADORES, type Modificador } from '../combat/habilidades';
import { Leitor } from '../core/validar';
import type { Atributos, Bolsa, Entidade } from '../entities/entidade';
import { faixaDaForma } from '../combat/forma-do-estilo';
import { ehEixo, formaDoEixo, type Eixo } from '../combat/eixos';
import { lerGanchos, type Gancho, type PassivosDeGancho } from './ganchos';
import { NOMES_ATRIBUTOS, type NomeAtributo } from './itens';

export const COMPONENTES_DE_ESTILO = ['dano', 'cadencia', 'area', 'invoc', 'ehp', 'sustain', 'suporte'] as const;
export type ComponenteDeEstilo = (typeof COMPONENTES_DE_ESTILO)[number];
export type EfeitosDeEstilo = Record<ComponenteDeEstilo, number>;

export interface Estilo {
  id: string;
  classe: string;
  nome: string;
  pesos: Partial<Record<NomeAtributo, number>>;
  /** Os efeitos com o estilo em 100% (fração: 0,5 = +50%). */
  efeitos: Partial<EfeitosDeEstilo>;
  texto: string;
  ganchos: Gancho[];
  /**
   * Marco 39 (12/11/2026, D-152; gradual desde D-156): a forma do estilo. De `formaInicioPct` da ponta em diante, o
   * estilo muda o comportamento das skills da etiqueta (`tag`; null = todas) com um modificador que cresce em faixas até
   * `formaPlenaPct`, e cobra até `danoPct` por alvo, na fração da faixa (o orçamento se conserva).
   */
  forma?: FormaDoEstilo;
  /**
   * Marco 40 (12/11/2026, D-157): o eixo principal e o secundário do estilo. A forma empurra o principal nas skills que o
   * têm; nas que não têm, o secundário, na metade da faixa. Quem tem núcleo usa os eixos; as skills antigas, a `forma`.
   */
  eixos: readonly [Eixo, Eixo];
  /** Marco 39 (12/11/2026, D-155): as melhorias de classe que o estilo traz, uma a cada degrau da ponta. */
  melhorias: MelhoriaDeClasse[];
}

/**
 * D-155: uma melhoria de classe. Do degrau `desde` em diante, a chave vale `base + porDegrau × degraus` (arredondada
 * para baixo se `inteiro`). As chaves de fator (fúria, aura, servos...) são em %; as de marco, no valor do marco.
 */
export interface MelhoriaDeClasse {
  chave: string;
  porDegrau: number;
  desde: number;
  base: number;
  inteiro: boolean;
}

/** D-152/D-156: a forma pela etiqueta, das skills sem núcleo (as antigas, até a etapa 2 do marco 40). O custo é por forma (`balance.habilidades.eixos.custoPct`). */
export interface FormaDoEstilo {
  tag: string | null;
  mod: Modificador;
}

export interface RegrasEstilos {
  /**
   * Marco 39 (12/11/2026, D-153): a inclinação. O estilo que lidera o radar ganha esta intensidade (em %) a mais, desde o
   * nível 1: quem se dirige a um estilo o sente desde o primeiro ponto, e o generalista também tem o seu.
   */
  inclinacaoPct: number;
  /**
   * Marco 39 (12/11/2026, D-154): o foco. O quanto um estilo se destaca dos outros (a ponta dele menos a média das outras
   * quatro, de 0 a 1) amplifica a marca dele: o maior componente de efeito cresce `focoMarcaPct` × foco e a mecânica
   * própria (os ganchos), `focoGanchoPct` × foco. O generalista tem foco perto de zero e fica como está.
   */
  focoMarcaPct: number;
  focoGanchoPct: number;
  /** D-156: a forma do estilo aparece nesta intensidade (em %, faixa 1)... */
  formaInicioPct: number;
  /** ...e chega ao máximo (faixa 10) nesta. */
  formaPlenaPct: number;
  /** Pontos acima de 10 que levam um estilo a 100% (90: de 10 a 100). */
  pontosMax: number;
  /** A camada dos itens: até tantos p.p. por ponta no nível máximo... */
  itemTetoPct: number;
  /** ...começando em tanto % desse teto no nível 1. */
  itemEscalaMinPct: number;
}

export const EFEITOS_NEUTROS: EfeitosDeEstilo = { dano: 0, cadencia: 0, area: 0, invoc: 0, ehp: 0, sustain: 0, suporte: 0 };

export function lerEstilos(json: unknown): { estilos: Map<string, Estilo[]>; erros: string[] } {
  const l = new Leitor('estilos.json');
  const lista = l.lista(l.objeto(json, 'raiz'), 'estilos');
  const estilos = new Map<string, Estilo[]>();
  const ids = new Set<string>();
  for (const bruto of lista) {
    const o = l.objeto(bruto, 'estilo');
    const id = l.texto(o, 'id');
    const classe = l.texto(o, 'classe');
    if (ids.has(id)) l.erro(`estilo "${id}" repetido`);
    ids.add(id);
    const po = l.objeto(o.pesos, `${id}.pesos`);
    const pesos: Partial<Record<NomeAtributo, number>> = {};
    for (const k of Object.keys(po)) {
      if (!(NOMES_ATRIBUTOS as readonly string[]).includes(k)) l.erro(`${id}: atributo desconhecido "${k}"`);
      else pesos[k as NomeAtributo] = l.numero(po, k, { min: 0, max: 1 });
    }
    const eo = l.objeto(o.efeitos, `${id}.efeitos`);
    const efeitos: Partial<EfeitosDeEstilo> = {};
    for (const k of Object.keys(eo)) {
      if (!(COMPONENTES_DE_ESTILO as readonly string[]).includes(k)) l.erro(`${id}: efeito desconhecido "${k}"`);
      else efeitos[k as ComponenteDeEstilo] = l.numero(eo, k, { min: 0, max: 2 });
    }
    const melhorias = (o.melhorias === undefined ? [] : l.lista(o, 'melhorias')).map((m): MelhoriaDeClasse => {
      const mo = l.objeto(m, `${id}.melhorias`);
      return {
        chave: l.texto(mo, 'chave'),
        porDegrau: l.numero(mo, 'porDegrau', { min: 0, max: 1000 }),
        desde: mo.desde === undefined ? 1 : l.numero(mo, 'desde', { min: 1, max: 30 }),
        base: mo.base === undefined ? 0 : l.numero(mo, 'base', { min: 0, max: 1000 }),
        inteiro: mo.inteiro === true,
      };
    });
    const eixos = l.listaDeTextos(o, 'eixos');
    const [principal, secundario] = eixos;
    if (eixos.length !== 2 || !ehEixo(principal) || !ehEixo(secundario) || principal === secundario) l.erro(`${id}: eixos precisa de dois eixos diferentes (principal e secundário)`);
    const e: Estilo = { id, classe, nome: l.texto(o, 'nome'), pesos, efeitos, texto: l.texto(o, 'texto'), ganchos: lerGanchos(l, o.ganchos), eixos: [ehEixo(principal) ? principal : 'area', ehEixo(secundario) ? secundario : 'eco'], melhorias };
    if (o.forma !== undefined) {
      const f = l.objeto(o.forma, `${id}.forma`);
      e.forma = { tag: f.tag === undefined ? null : l.texto(f, 'tag'), mod: l.opcao(f, 'mod', MODIFICADORES) };
      if (formaDoEixo(e.eixos[0]) !== e.forma.mod) l.erro(`${id}: a forma das skills antigas precisa ser a do eixo principal`);
    }
    estilos.set(classe, [...(estilos.get(classe) ?? []), e]);
  }
  for (const [classe, l5] of estilos) if (l5.length !== 5) l.erro(`${classe}: precisa de 5 estilos (tem ${String(l5.length)})`);
  return { estilos, erros: l.erros };
}

const acimaDe10 = (v: number) => Math.max(0, v - 10);

/** A intensidade de cada estilo (0 a 1) só pelos pontos (a base da ficha: classe + pontos postos). */
export function intensidadesBase(estilos: readonly Estilo[], base: Atributos, regras: RegrasEstilos): number[] {
  return estilos.map((e) => {
    let p = 0;
    for (const [a, peso] of Object.entries(e.pesos) as [NomeAtributo, number][]) p += peso * acimaDe10(base[a]);
    return Math.max(0, Math.min(1, p / regras.pontosMax));
  });
}

/** A camada dos itens (p.p. em fração): o que os itens somam aos atributos, pelos mesmos pesos, até o teto do nível. */
export function camadaDosItens(estilos: readonly Estilo[], base: Atributos, efetivos: Atributos, nivel: number, nivelMax: number, regras: RegrasEstilos): number[] {
  const escala = (regras.itemTetoPct / 100) * (regras.itemEscalaMinPct / 100 + (1 - regras.itemEscalaMinPct / 100) * Math.max(0, nivel - 1) / Math.max(1, nivelMax - 1));
  return estilos.map((e) => {
    let p = 0;
    for (const [a, peso] of Object.entries(e.pesos) as [NomeAtributo, number][]) p += peso * Math.max(0, efetivos[a] - base[a]);
    return Math.min(escala, p / regras.pontosMax);
  });
}

export interface RadarDeEstilos {
  estilos: readonly Estilo[];
  /** Só pelos pontos (0 a 1). */
  base: number[];
  /** A camada dos itens (0 a `itemTetoPct`/100). */
  itens: number[];
  /** O total de cada ponta (0 a 1 + `itemTetoPct`/100), com a inclinação na que lidera. */
  total: number[];
  /** D-153: a ponta que lidera (a de maior base + itens; no empate, a primeira) e quanto a inclinação somou nela. */
  lider: number;
  inclinacao: number;
  /** D-154: o foco de cada ponta (0 a 1): o quanto ela passa da média das outras. */
  foco: number[];
  efeitos: EfeitosDeEstilo;
}

/** D-154: a marca do estilo, o componente de efeito em que ele é mais forte (o primeiro, no empate). */
export function marcaDoEstilo(e: Estilo): ComponenteDeEstilo | null {
  let melhor: ComponenteDeEstilo | null = null;
  for (const [c, v] of Object.entries(e.efeitos) as [ComponenteDeEstilo, number][]) if (melhor === null || v > (e.efeitos[melhor] ?? 0)) melhor = c;
  return melhor;
}

/** D-154: o foco de cada ponta: ela menos a média das outras, entre 0 e 1. */
export function focoDasPontas(total: readonly number[]): number[] {
  const n = total.length;
  const soma = total.reduce((s, v) => s + v, 0);
  return total.map((v) => (n > 1 ? Math.max(0, Math.min(1, v - (soma - v) / (n - 1))) : 0));
}

export function somarEfeitos(estilos: readonly Estilo[], intensidades: readonly number[]): EfeitosDeEstilo {
  const t = { ...EFEITOS_NEUTROS };
  estilos.forEach((e, k) => {
    const i = intensidades[k] ?? 0;
    for (const [c, v] of Object.entries(e.efeitos) as [ComponenteDeEstilo, number][]) t[c] += i * v;
  });
  return t;
}

type CtxEstilos = Pick<ContextoSimulacao, 'conteudo' | 'balance'>;

/**
 * O combate consulta o radar muitas vezes por tick (cada golpe, cura e gancho). O resultado só depende da classe, do
 * nível e dos atributos, então fica guardado por ficha, catálogo e balance, com essa assinatura. A memória é fraca: some
 * com a ficha. Não muda o resultado, só evita refazer a conta.
 */
interface Memoria { conteudo: object; balance: object; chave: string; radar: RadarDeEstilos | null; ganchos?: Gancho[]; formas?: FormaAtiva[] }
const MEMORIA = new WeakMap<Bolsa, Memoria>();

function assinatura(bolsa: Bolsa, efetivos: Atributos, nivel: number): string {
  let s = `${bolsa.classeId}|${String(nivel)}`;
  for (const a of NOMES_ATRIBUTOS) s += `|${String(bolsa.atributosBase[a])}:${String(efetivos[a])}`;
  return s;
}

function memorizado(ctx: CtxEstilos, bolsa: Bolsa, efetivos: Atributos, nivel: number): Memoria {
  const chave = assinatura(bolsa, efetivos, nivel);
  const m = MEMORIA.get(bolsa);
  if (m && m.chave === chave && m.conteudo === ctx.conteudo && m.balance === ctx.balance) return m;
  const novo: Memoria = { conteudo: ctx.conteudo, balance: ctx.balance, chave, radar: calcularRadar(ctx, bolsa, efetivos, nivel) };
  MEMORIA.set(bolsa, novo);
  return novo;
}

/** O radar de quem tem ficha (sem ficha ou classe sem estilos: null). `efetivos` são os atributos com os itens. */
export function radarDe(ctx: CtxEstilos, bolsa: Bolsa, efetivos: Atributos, nivel: number): RadarDeEstilos | null {
  return memorizado(ctx, bolsa, efetivos, nivel).radar;
}

function calcularRadar(ctx: CtxEstilos, bolsa: Bolsa, efetivos: Atributos, nivel: number): RadarDeEstilos | null {
  const estilos = ctx.conteudo.estilos.get(bolsa.classeId);
  if (!estilos) return null;
  const regras = ctx.balance.estilos;
  const base = intensidadesBase(estilos, bolsa.atributosBase, regras);
  const itens = camadaDosItens(estilos, bolsa.atributosBase, efetivos, nivel, ctx.balance.xp.nivelMax, regras);
  // D-153: lidera a ponta que mais subiu pelos pontos postos (o rumo que o jogador escolheu); sem pontos, a que a classe
  // já favorece. A inclinação não leva a parte dos pontos além de 100% (só os itens passam disso).
  const daClasse = ctx.conteudo.classes.get(bolsa.classeId)?.atributos;
  const postos = daClasse ? intensidadesBase(estilos, daClasse, regras).map((v, k) => (base[k] ?? 0) - v) : base;
  const rumo = postos.some((v) => v > 1e-9) ? postos : base;
  const lider = rumo.reduce((m, v, k) => (v > (rumo[m] ?? 0) + 1e-9 ? k : m), 0);
  const inclinacao = Math.max(0, Math.min(regras.inclinacaoPct / 100, 1 - (base[lider] ?? 0)));
  const total = base.map((v, k) => v + (itens[k] ?? 0) + (k === lider ? inclinacao : 0));
  // D-154: a marca de cada estilo cresce com o foco dele.
  const foco = focoDasPontas(total);
  const efeitos = somarEfeitos(estilos, total);
  estilos.forEach((e, k) => {
    const marca = marcaDoEstilo(e);
    if (marca) efeitos[marca] += (total[k] ?? 0) * (e.efeitos[marca] ?? 0) * (foco[k] ?? 0) * (regras.focoMarcaPct / 100);
  });
  return { estilos, base, itens, total, lider, inclinacao, foco, efeitos };
}

/** Os efeitos numéricos dos estilos da entidade (sem ficha: neutros). */
export function efeitosDeEstiloDe(ctx: CtxEstilos, e: Entidade): EfeitosDeEstilo {
  return e.bolsa ? (radarDe(ctx, e.bolsa, e.atributos, e.nivel)?.efeitos ?? EFEITOS_NEUTROS) : EFEITOS_NEUTROS;
}

const CAMPOS_NUMERICOS: readonly (keyof PassivosDeGancho)[] = [
  'estudoPct', 'revelarPct', 'desarmarPct', 'refugioMaisPct', 'buffArmadoPrazoPct', 'buffArmadoDuracaoPct', 'renascerPct',
  'escudoPct', 'auraDefesaPct', 'potenciaPct', 'negativosMenosPct', 'cargaUltimatePct', 'cargaVidaBaixaPct',
];

/** O gancho com a força da intensidade: a chance (ou os números do passivo) × intensidade. */
export function escalarGancho(g: Gancho, intensidade: number): Gancho | null {
  const i = Math.max(0, intensidade);
  if (i <= 0) return null;
  if (g.efeito.tipo === 'passivo') {
    const p: Partial<PassivosDeGancho> = { ...g.efeito.passivo };
    for (const c of CAMPOS_NUMERICOS) {
      const v = p[c];
      if (typeof v === 'number') (p as Record<string, unknown>)[c] = v * i;
    }
    if (p.atravessaMagico !== undefined) p.atravessaMagico = Math.floor(p.atravessaMagico * i);
    if (p.inamovivel !== undefined) p.inamovivel = p.inamovivel && i >= 0.5;
    if (p.resistencias) p.resistencias = p.resistencias.map((r) => ({ ...r, pct: r.pct * i }));
    return { ...g, efeito: { tipo: 'passivo', passivo: p } };
  }
  return { ...g, se: { ...g.se, chancePct: Math.min(100, g.se.chancePct * i) } };
}

/** Os ganchos das mecânicas dos estilos, cada um na força da intensidade da sua ponta. */
export function ganchosDosEstilos(ctx: CtxEstilos, e: Entidade): Gancho[] {
  if (!e.bolsa) return [];
  const m = memorizado(ctx, e.bolsa, e.atributos, e.nivel);
  const radar = m.radar;
  if (!radar) return [];
  if (m.ganchos) return m.ganchos;
  const saida: Gancho[] = [];
  radar.estilos.forEach((est, k) => {
    for (const g of est.ganchos) {
      // D-154: a mecânica própria do estilo cresce com o foco (a chance passa de 100% da base, até o teto de 100%).
      const escalado = escalarGancho(g, Math.min(1, radar.total[k] ?? 0) * (1 + ((radar.foco[k] ?? 0) * ctx.balance.estilos.focoGanchoPct) / 100));
      if (escalado) saida.push(escalado);
    }
  });
  m.ganchos = saida;
  return saida;
}

/** D-156: um estilo com a forma em curso e a faixa dela (1 a 10). */
export interface FormaAtiva {
  estilo: Estilo;
  faixa: number;
}

/**
 * D-156: as formas dos estilos que valem agora, cada uma na faixa da sua ponta (com os itens e a inclinação). Começa em
 * `formaInicioPct` e cresce até `formaPlenaPct`. Marco 40 (D-157): todo estilo tem forma (a dos eixos dele).
 */
export function formasDosEstilos(ctx: CtxEstilos, e: Pick<Entidade, 'bolsa' | 'atributos' | 'nivel'>): FormaAtiva[] {
  if (!e.bolsa) return [];
  const m = memorizado(ctx, e.bolsa, e.atributos, e.nivel);
  if (m.formas) return m.formas;
  const radar = m.radar;
  const r = ctx.balance.estilos;
  m.formas = radar
    ? radar.estilos.flatMap((est, k) => {
        const faixa = faixaDaForma(radar.total[k] ?? 0, r.formaInicioPct / 100, r.formaPlenaPct / 100);
        return faixa > 0 ? [{ estilo: est, faixa }] : [];
      })
    : [];
  return m.formas;
}
