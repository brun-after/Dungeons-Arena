// Os itens base com formas (marco 18, 17/10/2026, D-069). Cada base (espada, cajado, escudo, …) existe em 4 formas —
// Comum, Épica, Lendária e Última —, cada uma com nome, raridade, poder e aparência próprios; as Lendárias e Últimas
// trazem ganchos (data/itens-formas.json). Algumas bases têm afinidade com elementos (uma tem 3, outras 1 ou 2, a
// maioria nenhuma) e existem também na versão elemental de cada forma. Total do marco: 20 × 4 + 10 × 4 = 120.
//
// Como o equipamento gerado do marco 17, o item nasce do id — `ib_<base>_<forma>_<elemento|n>_<nível>_<semente>` —
// e o catálogo o resolve sob demanda: mochila, loja, certificado e save funcionam sem saber que ele é gerado.

import { ehElemento, type DefinicaoElemento, type Elemento } from '../combat/elementos';
import type { Catalogo } from '../combat/habilidades';
import { aleatorio, criarRng, inteiro, type EstadoRng } from '../core/rng';
import { ehObjeto, Leitor } from '../core/validar';
import { RARIDADES, SLOTS_DE_EQUIPAMENTO, type Raridade, type Slot } from '../modos/modo';
import { lerGanchos, type Gancho } from './ganchos';
import type { RegrasItensGerados } from './gerar-item';
import { NOMES_ATRIBUTOS, type Bonus, type Item, type NomeAtributo } from './itens';

export const FORMAS_ITEM = ['comum', 'epica', 'lendaria', 'ultima'] as const;
export type FormaItem = (typeof FORMAS_ITEM)[number];

export interface DefinicaoForma {
  raridade: Raridade;
  /** Multiplicador dos pontos de atributo e da defesa. */
  poder: number;
  /** Peso no sorteio dos drops (a Última não cai: vem da forja e de missões). */
  peso: number;
  /** Chance (%) de o elemento do item agir num golpe. */
  elementalPct: number;
  visual: 'simples' | 'gema' | 'brilho' | 'aura';
}

export interface FormaDaBase {
  nome: string;
  genero: 'm' | 'f';
  texto: string;
  ganchos: Gancho[];
}

export interface BaseComFormas {
  base: string;
  slot: Slot;
  icone: string;
  /** O desenho da arma no token (null: não é arma de mão). */
  arma: string | null;
  defesa: number;
  atributos: NomeAtributo[][];
  elementos: Elemento[];
  formas: Readonly<Record<FormaItem, FormaDaBase>>;
}

export interface ItensComFormas {
  formas: Readonly<Record<FormaItem, DefinicaoForma>>;
  /** O adjetivo do elemento, por gênero ("ígnea", "glacial"…). */
  qualificadores: Readonly<Partial<Record<Elemento, { m: string; f: string }>>>;
  bases: Catalogo<BaseComFormas>;
}

export function ehForma(v: unknown): v is FormaItem {
  return typeof v === 'string' && (FORMAS_ITEM as readonly string[]).includes(v);
}

export function lerItensComFormas(json: unknown): { dados: ItensComFormas; erros: string[] } {
  const l = new Leitor('itens-formas.json');
  const o = l.objeto(json, 'raiz');
  const fo = l.objeto(o.formas, 'formas');
  const formas = Object.fromEntries(
    FORMAS_ITEM.map((f) => {
      const v = l.objeto(fo[f], `formas.${f}`);
      return [
        f,
        {
          raridade: l.opcao(v, 'raridade', RARIDADES),
          poder: l.numero(v, 'poder', { min: 0.1, max: 20 }),
          peso: l.numero(v, 'peso', { min: 0 }),
          elementalPct: l.numero(v, 'elementalPct', { min: 0, max: 100 }),
          visual: l.opcao(v, 'visual', ['simples', 'gema', 'brilho', 'aura'] as const),
        },
      ];
    }),
  ) as Record<FormaItem, DefinicaoForma>;
  const qo = l.objeto(o.qualificadores, 'qualificadores');
  const qualificadores: Partial<Record<Elemento, { m: string; f: string }>> = {};
  for (const [k, v] of Object.entries(qo)) {
    if (!ehElemento(k)) l.erro(`qualificadores: elemento desconhecido "${k}"`);
    else {
      const q = l.objeto(v, `qualificadores.${k}`);
      qualificadores[k] = { m: l.texto(q, 'm'), f: l.texto(q, 'f') };
    }
  }
  const bases = new Map<string, BaseComFormas>();
  for (const bruto of l.lista(o, 'bases')) {
    const b = l.objeto(bruto, 'bases[]');
    const base = l.texto(b, 'base');
    if (!/^[a-z]+$/.test(base)) l.erro(`base "${base}": só letras minúsculas (o id gerado usa "_" como separador)`);
    const atributos = l.lista(b, 'atributos').map((par) =>
      (Array.isArray(par) ? par : []).filter((a): a is NomeAtributo => typeof a === 'string' && (NOMES_ATRIBUTOS as string[]).includes(a)),
    );
    if (atributos.length === 0 || atributos.some((p) => p.length === 0)) l.erro(`base "${base}": atributos vazios ou desconhecidos`);
    const elementos = l.listaDeTextos(b, 'elementos').filter((e): e is Elemento => {
      if (ehElemento(e)) return true;
      l.erro(`base "${base}": elemento desconhecido "${e}"`);
      return false;
    });
    for (const e of elementos) if (!qualificadores[e]) l.erro(`base "${base}": falta o qualificador do elemento "${e}"`);
    const fb = l.objeto(b.formas, `${base}.formas`);
    const formasDaBase = Object.fromEntries(
      FORMAS_ITEM.map((f) => {
        const v = l.objeto(fb[f], `${base}.formas.${f}`);
        return [
          f,
          {
            nome: l.texto(v, 'nome'),
            genero: l.opcao(v, 'genero', ['m', 'f'] as const),
            texto: v.texto === undefined ? '' : l.texto(v, 'texto'),
            ganchos: lerGanchos(l, v.ganchos),
          },
        ];
      }),
    ) as Record<FormaItem, FormaDaBase>;
    if (bases.has(base)) l.erro(`base "${base}" repetida`);
    bases.set(base, {
      base,
      slot: l.opcao(b, 'slot', SLOTS_DE_EQUIPAMENTO),
      icone: l.icone(b, 'icone'),
      arma: b.arma === undefined ? null : l.texto(b, 'arma'),
      defesa: l.numero(b, 'defesa', { min: 0, max: 20, inteiro: true }),
      atributos,
      elementos,
      formas: formasDaBase,
    });
  }
  return { dados: { formas, qualificadores, bases }, erros: l.erros };
}

const PREFIXO = 'ib_';

export function idItemBase(base: string, forma: FormaItem, elemento: Elemento | null, nivel: number, semente: number): string {
  return `${PREFIXO}${base}_${forma}_${elemento ?? 'n'}_${nivel}_${(semente >>> 0).toString(36)}`;
}

export function lerIdItemBase(id: string): { base: string; forma: FormaItem; elemento: Elemento | null; nivel: number; semente: number } | null {
  const m = /^ib_([a-z]+)_([a-z]+)_([a-z]+)_(\d{1,2})_([0-9a-z]{1,7})$/.exec(id);
  if (!m?.[1] || !m[2] || !m[3] || !m[4] || !m[5]) return null;
  const forma = m[2];
  // IDs antigos continuam identificando o mesmo item, agora no elemento unificado Trevas.
  const elemento = m[3] === 'n' ? null : m[3] === 'sombra' ? 'trevas' : m[3];
  if (!ehForma(forma) || (elemento !== null && !ehElemento(elemento))) return null;
  const semente = parseInt(m[5], 36);
  if (!Number.isFinite(semente)) return null;
  return { base: m[1], forma, elemento, nivel: Number(m[4]), semente };
}

export function ehIdItemBase(id: string): boolean {
  return id.startsWith(PREFIXO);
}

/**
 * O gancho que o elemento dá ao item: na arma, os golpes físicos aplicam o estado do elemento; nas outras peças, quem
 * acerta o portador leva o estado (a chance vem da forma).
 */
function ganchoElemental(base: BaseComFormas, def: DefinicaoElemento, chancePct: number): Gancho {
  const arma = base.slot === 'arma_principal' || base.base === 'aljava';
  return {
    quando: arma ? 'aoAcertar' : 'aoReceberGolpe',
    se: { tag: null, habilidade: null, elemento: null, tipoAtaque: arma ? 'fisico' : null, estadoDoAlvo: null, chancePct },
    efeito: { tipo: 'aplicar', efeito: { ...def.estado }, em: 'alvo' },
  };
}

/** O item de um id `ib_` (null: id fora da forma, base desconhecida, elemento sem afinidade ou nível fora da faixa). */
export function gerarItemBase(
  id: string,
  dados: ItensComFormas,
  regras: RegrasItensGerados,
  elementos: ReadonlyMap<Elemento, DefinicaoElemento>,
): Item | null {
  const p = lerIdItemBase(id);
  const base = p ? dados.bases.get(p.base) : undefined;
  if (!p || !base || p.nivel < 1 || p.nivel > regras.nivelMax) return null;
  if (p.elemento !== null && !base.elementos.includes(p.elemento)) return null;
  const def = dados.formas[p.forma];
  const forma = base.formas[p.forma];
  const rng = criarRng(p.semente);
  const pontos = Math.max(1, Math.round((regras.pontosBase + regras.pontosPorNivel * p.nivel) * def.poder));
  const par = base.atributos[inteiro(rng, 0, base.atributos.length - 1)] ?? base.atributos[0] ?? [];
  const bonusAtributos: Partial<Record<NomeAtributo, Bonus>> = {};
  const [a1, a2] = par;
  if (a1 && a2) {
    const principal = Math.max(1, Math.round(pontos * 0.7));
    bonusAtributos[a1] = { modo: 'abs', valor: principal };
    if (pontos - principal > 0) bonusAtributos[a2] = { modo: 'abs', valor: pontos - principal };
  } else if (a1) bonusAtributos[a1] = { modo: 'abs', valor: pontos };
  const defesa = base.defesa + Math.floor(p.nivel * def.poder * regras.defesaPorNivel);
  const ganchos = [...forma.ganchos];
  const elemento = p.elemento ? elementos.get(p.elemento) : undefined;
  if (elemento) ganchos.push(ganchoElemental(base, elemento, def.elementalPct));
  const qualificador = p.elemento ? dados.qualificadores[p.elemento]?.[forma.genero] : undefined;
  const nome = qualificador ? `${forma.nome} ${qualificador}` : forma.nome;
  return {
    id,
    nome: `${nome} · nv ${p.nivel}`,
    tipo: 'equipamento',
    descricao: forma.texto,
    icone: base.icone,
    raridade: def.raridade,
    valorBase: Math.round(regras.valorPorPonto * (pontos + defesa) * (1 + p.nivel / 10) * (1 + forma.ganchos.length * 0.5)),
    slotPadrao: base.slot,
    nivelMinimo: p.nivel,
    bonusAtributos,
    bonusDefesa: defesa,
    efeitos: [],
    dropavel: false,
    ensina: null,
    modificadores: [],
    base: base.base,
    forma: p.forma,
    elemento: p.elemento,
    ganchos,
  };
}

/** A forma do drop: pesos da forma, os altos mais prováveis quanto maior o nível; `formaMin` corta as de baixo. */
function sortearForma(rng: EstadoRng, nivel: number, dados: ItensComFormas, regras: RegrasItensGerados, formaMin: FormaItem): FormaItem {
  const candidatas = FORMAS_ITEM.slice(FORMAS_ITEM.indexOf(formaMin)).filter((f) => dados.formas[f].peso > 0);
  if (candidatas.length === 0) return formaMin;
  const peso = (f: FormaItem) => dados.formas[f].peso * (f === 'comum' ? 1 : 1 + (regras.raridadePorNivelPct / 100) * (nivel - 1));
  const total = candidatas.reduce((s, f) => s + peso(f), 0);
  let sorteio = aleatorio(rng) * total;
  let escolhida: FormaItem = candidatas[0] ?? formaMin;
  for (const f of candidatas) {
    escolhida = f;
    sorteio -= peso(f);
    if (sorteio < 0) break;
  }
  return escolhida;
}

/** A forma mínima para uma raridade mínima (o chefe garante raro: a forma vira Épica). */
export function formaMinimaDe(raridade: Raridade): FormaItem {
  const i = RARIDADES.indexOf(raridade);
  if (i <= 0) return 'comum';
  if (raridade === 'lendario') return 'lendaria';
  if (raridade === 'ultima') return 'ultima';
  return 'epica';
}

/** Sorteia o id de um item base para um drop do nível `nivel`: a base, a forma e, às vezes, o elemento da afinidade. */
export function sortearItemBase(
  rng: EstadoRng,
  nivel: number,
  dados: ItensComFormas,
  regras: RegrasItensGerados,
  chanceElemental: number,
  formaMin: FormaItem = 'comum',
): string | null {
  const lista = [...dados.bases.values()];
  if (lista.length === 0) return null;
  const forma = sortearForma(rng, nivel, dados, regras, formaMin);
  const base = lista[inteiro(rng, 0, lista.length - 1)];
  if (!base) return null;
  const elemental = base.elementos.length > 0 && aleatorio(rng) < chanceElemental;
  const elemento = elemental ? (base.elementos[inteiro(rng, 0, base.elementos.length - 1)] ?? null) : null;
  const n = Math.max(1, Math.min(regras.nivelMax, Math.round(nivel)));
  return idItemBase(base.base, forma, elemento, n, inteiro(rng, 0, 0x7fffffff));
}

/** As 120 variações (base × forma × [neutro + afinidades]), para o diário e os testes. */
export function variacoesDeItem(dados: ItensComFormas): { base: string; forma: FormaItem; elemento: Elemento | null }[] {
  const saida: { base: string; forma: FormaItem; elemento: Elemento | null }[] = [];
  for (const b of dados.bases.values()) {
    for (const forma of FORMAS_ITEM) {
      saida.push({ base: b.base, forma, elemento: null });
      for (const e of b.elementos) saida.push({ base: b.base, forma, elemento: e });
    }
  }
  return saida;
}

/** Fora do formato esperado (proteção do catálogo contra ids montados à mão). */
export function ehItemComForma(item: unknown): item is Item & { forma: FormaItem } {
  return ehObjeto(item) && ehForma(item.forma);
}
