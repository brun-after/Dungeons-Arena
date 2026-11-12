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
import { Leitor } from '../core/validar';
import type { Atributos, Bolsa, Entidade } from '../entities/entidade';
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
}

export interface RegrasEstilos {
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
    const e: Estilo = { id, classe, nome: l.texto(o, 'nome'), pesos, efeitos, texto: l.texto(o, 'texto'), ganchos: lerGanchos(l, o.ganchos) };
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
  /** O total de cada ponta (0 a 1 + `itemTetoPct`/100). */
  total: number[];
  efeitos: EfeitosDeEstilo;
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
interface Memoria { conteudo: object; balance: object; chave: string; radar: RadarDeEstilos | null; ganchos?: Gancho[] }
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
  const total = base.map((v, k) => v + (itens[k] ?? 0));
  return { estilos, base, itens, total, efeitos: somarEfeitos(estilos, total) };
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
      const escalado = escalarGancho(g, Math.min(1, radar.total[k] ?? 0));
      if (escalado) saida.push(escalado);
    }
  });
  m.ganchos = saida;
  return saida;
}
