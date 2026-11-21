// Marco 51 (21/11/2026, D-197): os engastes. Uma arma ou peça leva de 1 a 3 materiais alquímicos (pela raridade e pelo
// nível), gravados no id, como o `fu_` da fusão elemental: `en_<m1>.<m2>.<m3>__<id da peça>`. O catálogo resolve a
// peça engastada sob demanda, então ela circula por mochila, banco, loja, troca, mercado e certificado sem campo novo.
// Cada material tem uma leitura na arma e outra no equipamento (`alquimia.json`, em `materiais`), em ganchos. Os conjuntos
// dentro da peça:
// - 2 ou 3 do mesmo elemento: +25% ou +40% nos efeitos dos materiais;
// - 2 ou 3 da mesma dimensão de Filo: +15% ou +30%, e com 3 o eco da fenda (o estado da dimensão em volta, às vezes);
// - um par instável (pela matriz da alquimia): a reação do par entra na peça, mas os efeitos caem 15%.
// Puro.

import type { CatalogoAlquimia, MaterialNaMagia } from '../combat/fusao/catalogo';
import { chaveDoPar } from '../combat/fusao/catalogo';
import type { DefinicaoElemento, Elemento } from '../combat/elementos';
import { ehElemento } from '../combat/elementos';
import type { Raridade } from '../modos/modo';
import type { Gancho } from './ganchos';
import type { Item } from './itens';

const PREFIXO = 'en_';
const SEP = '__';
export const MAX_ENGASTES = 3;

export interface RegrasDeEngaste {
  /** Engastes pela raridade. */
  porRaridade: Readonly<Record<Raridade, number>>;
  /** O teto pelo nível da peça: a partir de `nivel`, até `engastes`. */
  tetoPorNivel: readonly { nivel: number; engastes: number }[];
  mesmoElementoPct: readonly [number, number];
  mesmaDimensaoPct: readonly [number, number];
  instavelPct: number;
  /** O eco da fenda: chance por golpe e raio. */
  ecoChancePct: number;
  ecoRaio: number;
  /** O valor de venda soma esta fração do valor dos materiais. */
  valorMaterialPct: number;
  /** O ouro de engastar ou extrair: base + por nível da peça. */
  ouroBase: number;
  ouroPorNivel: number;
  /** A chance de o material voltar inteiro ao ser extraído. */
  extrairVoltaPct: number;
  /** As receitas como loot: a chance pela criatura que a guarda (preset ou dimensão) e pelo chefe. */
  dropReceitaPct: number;
  dropReceitaChefePct: number;
  /** Um material alquímico da dimensão da criatura (e no chefe dela). */
  dropMaterialPct: number;
  dropMaterialChefePct: number;
}

export const ehIdEngastado = (id: string): boolean => id.startsWith(PREFIXO);

const materialValido = (m: string): boolean => /^[a-z0-9_]+$/.test(m) && !m.includes(SEP);

export function idEngastado(materiais: readonly string[], base: string): string {
  return `${PREFIXO}${materiais.join('.')}${SEP}${base}`;
}

export function lerIdEngastado(id: string): { materiais: string[]; base: string } | null {
  if (!ehIdEngastado(id)) return null;
  const resto = id.slice(PREFIXO.length);
  const i = resto.indexOf(SEP);
  if (i <= 0) return null;
  const materiais = resto.slice(0, i).split('.');
  const base = resto.slice(i + SEP.length);
  if (materiais.length < 1 || materiais.length > MAX_ENGASTES || !materiais.every(materialValido) || !base || ehIdEngastado(base)) return null;
  return { materiais, base };
}

/** A peça sem os engastes (o id de dentro) e os materiais que ela já leva. */
export function semEngastes(id: string): { base: string; materiais: string[] } {
  const p = lerIdEngastado(id);
  return p ?? { base: id, materiais: [] };
}

/** Quantos engastes a peça tem: o menor entre o da raridade e o teto do nível. */
export function engastesDaPeca(item: Pick<Item, 'raridade' | 'nivelMinimo'>, r: RegrasDeEngaste): number {
  const porRaridade = r.porRaridade[item.raridade];
  let teto = 1;
  for (const t of r.tetoPorNivel) if (item.nivelMinimo >= t.nivel) teto = Math.max(teto, t.engastes);
  return Math.max(1, Math.min(MAX_ENGASTES, porRaridade, teto));
}

/** A peça aceita engaste? (equipável) */
export const engastavel = (item: Item | undefined): item is Item => !!item && item.tipo === 'equipamento' && item.slotPadrao !== null;

export const ehArma = (item: Pick<Item, 'slotPadrao' | 'base' | 'arma'>): boolean => item.slotPadrao === 'arma_principal' || item.base === 'aljava' || !!item.arma;

/** O gancho com os efeitos multiplicados (a chance, quando há; senão a duração, o valor e o pct; e os passivos). */
function escalar(g: Gancho, f: number): Gancho {
  if (f === 1) return g;
  if (g.efeito.tipo === 'passivo') {
    const p = { ...g.efeito.passivo };
    for (const k of Object.keys(p) as (keyof typeof p)[]) {
      const v = p[k];
      if (typeof v === 'number' && k !== 'atravessaMagico') (p as Record<string, unknown>)[k] = Math.round(v * f);
    }
    if (p.resistencias) p.resistencias = p.resistencias.map((x) => ({ ...x, pct: Math.min(100, Math.round(x.pct * f)) }));
    return { ...g, efeito: { tipo: 'passivo', passivo: p } };
  }
  if (g.se.chancePct < 100) return { ...g, se: { ...g.se, chancePct: Math.min(100, Math.round(g.se.chancePct * f)) } };
  const e = g.efeito;
  if ('efeito' in e) {
    const ef = e.efeito;
    return { ...g, efeito: { ...e, efeito: { ...ef, duracaoMs: Math.round(ef.duracaoMs * f), valor: Math.round(ef.valor * f), pct: Math.round(ef.pct * f) } } };
  }
  if (e.tipo === 'curarPct') return { ...g, efeito: { tipo: 'curarPct', pct: Math.round(e.pct * f * 10) / 10 } };
  if (e.tipo === 'mana') return { ...g, efeito: { tipo: 'mana', valor: Math.round(e.valor * f) } };
  return g;
}

export interface LeituraDaPeca {
  ganchos: Gancho[];
  /** O multiplicador dos efeitos e de onde ele veio (para o texto da peça). */
  fator: number;
  conjuntos: { tipo: 'elemento' | 'dimensao' | 'instavel'; chave: string; n: number }[];
}

/** O que os materiais fazem nesta peça (arma ou equipamento), com os conjuntos. */
export function lerMateriaisNaPeca(arma: boolean, ids: readonly string[], cat: CatalogoAlquimia, elementos: ReadonlyMap<Elemento, DefinicaoElemento>, r: RegrasDeEngaste): LeituraDaPeca | null {
  const mats = ids.map((id) => cat.materiais.get(id));
  if (!mats.every((m): m is MaterialNaMagia => !!m)) return null;
  const conjuntos: LeituraDaPeca['conjuntos'] = [];
  let fator = 1;
  const contar = (chaves: readonly (string | null)[]) => {
    const n = new Map<string, number>();
    for (const c of chaves) if (c) n.set(c, (n.get(c) ?? 0) + 1);
    return n;
  };
  for (const [el, n] of contar(mats.map((m) => m.elemento))) {
    if (n < 2) continue;
    fator *= 1 + (r.mesmoElementoPct[n - 2] ?? 0) / 100;
    conjuntos.push({ tipo: 'elemento', chave: el, n });
  }
  const ganchos: Gancho[] = [];
  for (const [dim, n] of contar(mats.map((m) => m.dimensao))) {
    if (n < 2) continue;
    fator *= 1 + (r.mesmaDimensaoPct[n - 2] ?? 0) / 100;
    conjuntos.push({ tipo: 'dimensao', chave: dim, n });
    // O eco da fenda: com 3 da mesma dimensão, o estado do elemento dela em volta de quem é golpeado.
    const el = mats.find((m) => m.dimensao === dim)?.elemento;
    const estado = el && ehElemento(el) ? elementos.get(el)?.estado : undefined;
    if (n >= 3 && estado) ganchos.push({ quando: 'aoAcertar', se: { tag: null, habilidade: null, elemento: null, tipoAtaque: null, estadoDoAlvo: null, chancePct: r.ecoChancePct }, efeito: { tipo: 'aplicarEmVolta', efeito: estado, raio: r.ecoRaio } });
  }
  // O par instável: a reação do par (o estado do 2º elemento sobre o 1º, às vezes) e os efeitos caem.
  const els = [...new Set(mats.map((m) => m.elemento).filter((x): x is Elemento => !!x && ehElemento(x)))];
  for (let i = 0; i < els.length; i++) {
    for (let j = i + 1; j < els.length; j++) {
      const a = els[i];
      const b = els[j];
      if (!a || !b || cat.pares.get(chaveDoPar(a, b))?.tipo !== 'instavel') continue;
      fator *= 1 - r.instavelPct / 100;
      conjuntos.push({ tipo: 'instavel', chave: chaveDoPar(a, b), n: 2 });
      const estado = elementos.get(b)?.estado;
      if (estado) ganchos.push({ quando: 'aoAcertar', se: { tag: null, habilidade: null, elemento: null, tipoAtaque: null, estadoDoAlvo: null, chancePct: r.ecoChancePct }, efeito: { tipo: 'aplicar', efeito: estado, em: 'alvo' } });
    }
  }
  for (const m of mats) for (const g of (arma ? m.arma : m.peca).ganchos) ganchos.push(escalar(g, fator));
  return { ganchos, fator, conjuntos };
}

/** A peça engastada a partir da base (null: id fora da forma, base que não aceita, material desconhecido ou demais). */
export function gerarItemEngastado(id: string, base: (id: string) => Item | undefined, cat: CatalogoAlquimia, elementos: ReadonlyMap<Elemento, DefinicaoElemento>, valorDe: (id: string) => number, r: RegrasDeEngaste): Item | null {
  const p = lerIdEngastado(id);
  const item = p ? base(p.base) : undefined;
  if (!p || !engastavel(item) || p.materiais.length > engastesDaPeca(item, r)) return null;
  const leitura = lerMateriaisNaPeca(ehArma(item), p.materiais, cat, elementos, r);
  if (!leitura) return null;
  const valor = p.materiais.reduce((s, m) => s + valorDe(m), 0);
  return {
    ...item,
    id,
    nome: `${item.nome} · ${String(p.materiais.length)} ${p.materiais.length > 1 ? 'engastes' : 'engaste'}`,
    ganchos: [...item.ganchos, ...leitura.ganchos],
    valorBase: Math.round(item.valorBase + valor * (r.valorMaterialPct / 100)),
  };
}
