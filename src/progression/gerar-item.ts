// Equipamento gerado por semente (marco 17, 15/10/2026, D-063): o item nasce do id — `gi_<base>_<nível>_<raridade>_<semente>`
// — como as habilidades geradas (D-057). O catálogo resolve esses ids sob demanda (`CatalogoDeItens`), então mochila,
// ficha, loja, conferência da sala e certificado funcionam sem saber que o item é gerado.
//
// Força do item: pontos de atributo = (base + por nível × nível) × multiplicador da raridade, repartidos 70/30 entre
// os atributos da base (anéis e amuletos sorteiam o par pela semente); defesa da base mais um pouco por nível. Tudo
// em balance.itensGerados; as bases e os nomes, em data/itens-base.json.

import type { Catalogo } from '../combat/habilidades';
import { aleatorio, criarRng, inteiro, type EstadoRng } from '../core/rng';
import { Leitor } from '../core/validar';
import { RARIDADES, SLOTS_DE_EQUIPAMENTO, type Raridade, type Slot } from '../modos/modo';
import { NOMES_ATRIBUTOS, type Bonus, type Item, type NomeAtributo } from './itens';

export interface BaseDeItem {
  base: string;
  nome: string;
  genero: 'm' | 'f';
  slot: Slot;
  icone: string;
  defesa: number;
  /** Os pares (ou unidades) de atributo que a base pode favorecer; a semente escolhe um. */
  atributos: NomeAtributo[][];
}

export interface BasesDeItem {
  bases: Catalogo<BaseDeItem>;
  /** O adjetivo da raridade, por gênero (o nome do item concorda com a base). */
  raridades: Readonly<Record<Raridade, { m: string; f: string }>>;
}

export interface RegrasItensGerados {
  pontosBase: number;
  pontosPorNivel: number;
  defesaPorNivel: number;
  valorPorPonto: number;
  /** Chance de um drop de equipamento ser gerado (o resto vem do catálogo fixo). */
  chanceGerado: number;
  multiplicador: Record<Raridade, number>;
  pesoRaridade: Record<Raridade, number>;
  /** Quanto cada nível do inimigo aumenta o peso das raridades acima de comum (%). */
  raridadePorNivelPct: number;
  nivelMax: number;
}

export function lerBasesDeItem(json: unknown): { bases: BasesDeItem; erros: string[] } {
  const l = new Leitor('itens-base.json');
  const o = l.objeto(json, 'raiz');
  const r = l.objeto(o.raridades, 'raridades');
  const raridades = Object.fromEntries(
    RARIDADES.map((x) => {
      const v = l.objeto(r[x], `raridades.${x}`);
      return [x, { m: l.texto(v, 'm'), f: l.texto(v, 'f') }];
    }),
  ) as Record<Raridade, { m: string; f: string }>;
  const bases = new Map<string, BaseDeItem>();
  for (const item of l.lista(o, 'bases')) {
    const b = l.objeto(item, 'bases[]');
    const base = l.texto(b, 'base');
    if (!/^[a-z]+$/.test(base)) l.erro(`base "${base}": só letras minúsculas (o id gerado usa "_" como separador)`);
    const atributos = l.lista(b, 'atributos').map((par) =>
      (Array.isArray(par) ? par : []).filter((a): a is NomeAtributo => typeof a === 'string' && (NOMES_ATRIBUTOS as string[]).includes(a)),
    );
    if (atributos.length === 0 || atributos.some((p) => p.length === 0)) l.erro(`base "${base}": atributos vazios ou desconhecidos`);
    bases.set(base, {
      base,
      nome: l.texto(b, 'nome'),
      genero: l.opcao(b, 'genero', ['m', 'f'] as const),
      slot: l.opcao(b, 'slot', SLOTS_DE_EQUIPAMENTO),
      icone: l.texto(b, 'icone'),
      defesa: l.numero(b, 'defesa', { min: 0, max: 20, inteiro: true }),
      atributos,
    });
  }
  return { bases: { bases, raridades }, erros: l.erros };
}

const PREFIXO = 'gi_';

export function idItemGerado(base: string, nivel: number, raridade: Raridade, semente: number): string {
  return `${PREFIXO}${base}_${nivel}_${raridade}_${(semente >>> 0).toString(36)}`;
}

export function lerIdItemGerado(id: string): { base: string; nivel: number; raridade: Raridade; semente: number } | null {
  const m = /^gi_([a-z]+)_(\d{1,2})_([a-z]+)_([0-9a-z]{1,7})$/.exec(id);
  if (!m?.[1] || !m[2] || !m[3] || !m[4]) return null;
  const raridade = RARIDADES.find((r) => r === m[3]);
  const semente = parseInt(m[4], 36);
  if (!raridade || !Number.isFinite(semente)) return null;
  return { base: m[1], nivel: Number(m[2]), raridade, semente };
}

/** O item de um id gerado (null: id fora da forma, base desconhecida ou nível fora da faixa). */
export function gerarItem(id: string, bases: BasesDeItem, regras: RegrasItensGerados): Item | null {
  const p = lerIdItemGerado(id);
  const base = p ? bases.bases.get(p.base) : undefined;
  if (!p || !base || p.nivel < 1 || p.nivel > regras.nivelMax) return null;
  const rng = criarRng(p.semente);
  const mult = regras.multiplicador[p.raridade];
  const pontos = Math.max(1, Math.round((regras.pontosBase + regras.pontosPorNivel * p.nivel) * mult));
  const par = base.atributos[inteiro(rng, 0, base.atributos.length - 1)] ?? base.atributos[0] ?? [];
  const bonusAtributos: Partial<Record<NomeAtributo, Bonus>> = {};
  const [a1, a2] = par;
  if (a1 && a2) {
    const principal = Math.max(1, Math.round(pontos * 0.7));
    bonusAtributos[a1] = { modo: 'abs', valor: principal };
    if (pontos - principal > 0) bonusAtributos[a2] = { modo: 'abs', valor: pontos - principal };
  } else if (a1) {
    bonusAtributos[a1] = { modo: 'abs', valor: pontos };
  }
  const defesa = base.defesa + Math.floor(p.nivel * mult * regras.defesaPorNivel);
  const adjetivo = bases.raridades[p.raridade][base.genero];
  return {
    id,
    nome: `${base.nome} ${adjetivo} · nv ${p.nivel}`,
    tipo: 'equipamento',
    descricao: '',
    icone: base.icone,
    raridade: p.raridade,
    valorBase: Math.round(regras.valorPorPonto * (pontos + defesa) * (1 + p.nivel / 10)),
    slotPadrao: base.slot,
    nivelMinimo: p.nivel,
    bonusAtributos,
    bonusDefesa: defesa,
    efeitos: [],
    dropavel: false,
    ensina: null,
    modificadores: [],
  };
}

/** Sorteia o id de um equipamento gerado para um drop de nível `nivel` (pesos de raridade sobem com o nível). */
export function sortearItemGerado(rng: EstadoRng, nivel: number, bases: BasesDeItem, regras: RegrasItensGerados, raridadeMin: Raridade = 'comum'): string | null {
  const lista = [...bases.bases.values()];
  if (lista.length === 0) return null;
  const candidatas = RARIDADES.slice(RARIDADES.indexOf(raridadeMin));
  const peso = (r: Raridade) => regras.pesoRaridade[r] * (r === 'comum' ? 1 : 1 + (regras.raridadePorNivelPct / 100) * (nivel - 1));
  const total = candidatas.reduce((s, r) => s + peso(r), 0);
  let sorteio = aleatorio(rng) * total;
  let raridade: Raridade = candidatas[0] ?? 'comum';
  for (const r of candidatas) {
    raridade = r;
    sorteio -= peso(r);
    if (sorteio < 0) break;
  }
  const base = lista[inteiro(rng, 0, lista.length - 1)];
  if (!base) return null;
  const n = Math.max(1, Math.min(regras.nivelMax, Math.round(nivel)));
  return idItemGerado(base.base, n, raridade, inteiro(rng, 0, 0x7fffffff));
}

/**
 * O catálogo de itens: os fixos de data/itens.json e, sob demanda, os gerados (que ficam guardados depois da primeira
 * vez). Iterar dá só os fixos — os pools de drop e de loja não mudam.
 */
export class CatalogoDeItens extends Map<string, Item> {
  constructor(
    fixos: ReadonlyMap<string, Item>,
    private readonly bases: BasesDeItem,
    private readonly regras: RegrasItensGerados,
  ) {
    super(fixos);
    this.gerados = new Map();
  }

  private readonly gerados: Map<string, Item>;

  override get(id: string): Item | undefined {
    const fixo = super.get(id);
    if (fixo || !id.startsWith(PREFIXO)) return fixo;
    const pronto = this.gerados.get(id);
    if (pronto) return pronto;
    const item = gerarItem(id, this.bases, this.regras);
    if (item) this.gerados.set(id, item);
    return item ?? undefined;
  }

  override has(id: string): boolean {
    return this.get(id) !== undefined;
  }

  get basesDeItem(): BasesDeItem {
    return this.bases;
  }

  get regrasDeItem(): RegrasItensGerados {
    return this.regras;
  }
}

/** O catálogo sabe gerar? (o conteúdo oficial sempre sabe; um catálogo montado à mão em teste, não) */
export function ehCatalogoDeItens(c: Catalogo<Item>): c is CatalogoDeItens {
  return c instanceof CatalogoDeItens;
}

