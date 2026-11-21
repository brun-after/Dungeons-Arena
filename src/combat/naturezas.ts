// Marco 48 (20/11/2026, D-193): a natureza das criaturas (data/naturezas.json). Os elementos não se opõem entre si
// (eneágono, D-150); quem dá fraqueza a um elemento é o corpo da criatura: o morto-vivo arde no sagrado, o constructo
// conduz o raio, a besta foge do fogo, o voador cai com o vento. Cada natureza soma resistências (negativas =
// fraquezas) e imunidades às do preset e reage aos estados que a pegam. Tudo pela entidade (o preset dela), nunca pelo
// `tipo`. Puro.

import type { ContextoSimulacao } from '../core/contexto';
import { Leitor } from '../core/validar';
import type { Entidade } from '../entities/entidade';
import { ELEMENTOS, type Elemento } from './elementos';
import { ehTipoEfeito, type TipoEfeito } from './registro-efeitos';

export type PontaDaNatureza = Elemento | 'fisico';

export interface ReacaoDaNatureza {
  /** O estado que dispara a reação quando pega na criatura. */
  estado: TipoEfeito;
  aplica: { tipo: TipoEfeito; duracaoMs: number; pct: number; valor: number };
  /** Com valor, o efeito periódico aplicado fere este % do golpe que trouxe o estado. */
  pctDoGolpe: number;
  intervaloMs: number;
}

export interface Natureza {
  id: string;
  resistencias: Readonly<Partial<Record<PontaDaNatureza, number>>>;
  imunidades: readonly TipoEfeito[];
  reacoes: readonly ReacaoDaNatureza[];
  semRemontarCom: TipoEfeito | null;
}

/** O que vale para um preset: as naturezas dele somadas. */
export interface NaturezaDoPreset {
  ids: readonly string[];
  resistencias: Readonly<Partial<Record<PontaDaNatureza, number>>>;
  imunidades: ReadonlySet<TipoEfeito>;
  reacoes: readonly ReacaoDaNatureza[];
  semRemontarCom: readonly TipoEfeito[];
}

export interface CatalogoNaturezas {
  naturezas: ReadonlyMap<string, Natureza>;
  presets: ReadonlyMap<string, NaturezaDoPreset>;
}

// Lido na hora (não no carregamento do módulo): combat/elementos.ts consulta este arquivo e este, a lista dele.
const ehPontaDaNatureza = (v: string): v is PontaDaNatureza => v === 'fisico' || (ELEMENTOS as readonly string[]).includes(v);

function lerEfeito(l: Leitor, v: unknown, campo: string): TipoEfeito | null {
  if (ehTipoEfeito(v)) return v;
  l.erro(`${campo}: tipo de efeito desconhecido "${String(v)}"`);
  return null;
}

export function lerNaturezas(json: unknown, presetsConhecidos: ReadonlySet<string>): { naturezas: CatalogoNaturezas; erros: string[] } {
  const l = new Leitor('naturezas.json');
  const raiz = l.objeto(json, 'raiz');
  const naturezas = new Map<string, Natureza>();
  for (const bruto of l.lista(raiz, 'naturezas')) {
    const o = l.objeto(bruto, 'natureza');
    const id = l.texto(o, 'id');
    const resistencias: Partial<Record<PontaDaNatureza, number>> = {};
    if (o.resistencias !== undefined) {
      for (const [k, v] of Object.entries(l.objeto(o.resistencias, `${id}.resistencias`))) {
        if (!ehPontaDaNatureza(k) || typeof v !== 'number' || v < -100 || v > 100) l.erro(`${id}: resistência inválida "${k}"`);
        else resistencias[k] = v;
      }
    }
    const imunidades = (o.imunidades === undefined ? [] : l.listaDeTextos(o, 'imunidades')).map((t) => lerEfeito(l, t, `${id}.imunidades`)).filter((t): t is TipoEfeito => t !== null);
    const reacoes: ReacaoDaNatureza[] = [];
    for (const r of o.reacoes === undefined ? [] : l.lista(o, 'reacoes')) {
      const x = l.objeto(r, `${id}.reacao`);
      const a = l.objeto(x.aplica, `${id}.reacao.aplica`);
      const estado = lerEfeito(l, x.estado, `${id}.reacao.estado`);
      const tipo = lerEfeito(l, a.tipo, `${id}.reacao.aplica`);
      if (!estado || !tipo) continue;
      reacoes.push({
        estado,
        aplica: { tipo, duracaoMs: l.numero(a, 'duracaoMs', { min: 0, max: 60_000, inteiro: true }), pct: typeof a.pct === 'number' ? a.pct : 0, valor: typeof a.valor === 'number' ? a.valor : 0 },
        pctDoGolpe: x.pctDoGolpe === undefined ? 0 : l.numero(x, 'pctDoGolpe', { min: 0, max: 200 }),
        intervaloMs: l.numero(x, 'intervaloMs', { min: 0, max: 600_000, inteiro: true }),
      });
    }
    const sem = o.semRemontarCom === undefined ? null : lerEfeito(l, o.semRemontarCom, `${id}.semRemontarCom`);
    if (naturezas.has(id)) l.erro(`natureza repetida "${id}"`);
    naturezas.set(id, { id, resistencias, imunidades, reacoes, semRemontarCom: sem });
  }
  const presets = new Map<string, NaturezaDoPreset>();
  for (const [preset, lista] of Object.entries(l.objeto(raiz.presets, 'presets'))) {
    if (!presetsConhecidos.has(preset)) l.erro(`presets: criatura desconhecida "${preset}"`);
    const ids = Array.isArray(lista) ? lista.filter((x): x is string => typeof x === 'string') : [];
    const doPreset = ids.map((id) => naturezas.get(id)).filter((n): n is Natureza => {
      if (!n) l.erro(`${preset}: natureza desconhecida`);
      return !!n;
    });
    const resistencias: Partial<Record<PontaDaNatureza, number>> = {};
    for (const n of doPreset) for (const [k, v] of Object.entries(n.resistencias) as [PontaDaNatureza, number][]) resistencias[k] = (resistencias[k] ?? 0) + v;
    presets.set(preset, {
      ids: doPreset.map((n) => n.id),
      resistencias,
      imunidades: new Set(doPreset.flatMap((n) => n.imunidades)),
      reacoes: doPreset.flatMap((n) => n.reacoes),
      semRemontarCom: doPreset.map((n) => n.semRemontarCom).filter((t): t is TipoEfeito => t !== null),
    });
  }
  return { naturezas: { naturezas, presets }, erros: l.erros };
}

export const SEM_NATUREZAS: CatalogoNaturezas = { naturezas: new Map(), presets: new Map() };

/** As naturezas da entidade (pelo preset; quem tem ficha não tem natureza). */
export function naturezaDe(ctx: Pick<ContextoSimulacao, 'conteudo'>, e: Pick<Entidade, 'preset' | 'bolsa'>): NaturezaDoPreset | undefined {
  if (e.bolsa) return undefined;
  return ctx.conteudo.naturezas.presets.get(e.preset);
}

/** A resistência que a natureza dá ao elemento do golpe (sem elemento = físico), em %. */
export function resistenciaDaNatureza(ctx: Pick<ContextoSimulacao, 'conteudo'>, e: Pick<Entidade, 'preset' | 'bolsa'>, elemento: Elemento | null): number {
  return naturezaDe(ctx, e)?.resistencias[elemento ?? 'fisico'] ?? 0;
}

export function imunePelaNatureza(ctx: Pick<ContextoSimulacao, 'conteudo'>, e: Pick<Entidade, 'preset' | 'bolsa'>, tipo: TipoEfeito): boolean {
  return naturezaDe(ctx, e)?.imunidades.has(tipo) ?? false;
}
