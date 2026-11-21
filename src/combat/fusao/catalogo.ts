// Marco 50 (21/11/2026, D-196): o catálogo da alquimia (data/alquimia.json): os pares de elementos, a forma natural de
// cada núcleo, as assinaturas, as peças do nome gerado e o efeito de cada material na magia. Os números do orçamento
// ficam em `balance.alquimia` (regras.ts). Puro.

import { Leitor } from '../../core/validar';
import { ELEMENTOS, type Elemento } from '../elementos';
import { lerEntrega } from '../entrega/tipos';
import { ehTipoEfeito, type EfeitoCanonico, type DestinoEfeito } from '../registro-efeitos';

export type TipoPar = 'harmonico' | 'instavel' | 'neutro';

export interface ParDeElementos {
  tipo: TipoPar;
  nome: string;
  texto: string;
}

export interface Assinatura {
  id: string;
  nome: string;
  texto: string;
  /** Os núcleos das partes (em qualquer ordem, com repetição). */
  nucleos: readonly string[];
  danoPct: number;
  saltos: number;
  /** A forma da assinatura (eixos crus, aplicados por cima da forma da fusão). */
  entrega: Readonly<Record<string, unknown>>;
}

/** O que um material faz na magia em que entra. */
export interface MaterialNaMagia {
  texto: string;
  danoPct: number;
  custoPct: number;
  recargaPct: number;
  duracaoPct: number;
  custoVidaPct: number;
  perfura: boolean;
  saltos: number;
  encaixes: number;
  efeitos: readonly EfeitoCanonico[];
  entrega: Readonly<Record<string, unknown>> | null;
}

export interface CatalogoAlquimia {
  pares: ReadonlyMap<string, ParDeElementos>;
  /** A forma natural de cada núcleo (eixos crus da entrega). */
  formas: ReadonlyMap<string, Readonly<Record<string, unknown>>>;
  assinaturas: readonly Assinatura[];
  nomes: { trajetoria: Readonly<Record<string, string>>; origem: Readonly<Record<string, string>>; cadencia: Readonly<Record<string, string>>; elemento: Readonly<Record<string, string>> };
  materiais: ReadonlyMap<string, MaterialNaMagia>;
  /** As fusões fixas antigas e a fusão aberta que as substitui (saves e fichas). */
  legado: ReadonlyMap<string, string>;
}

/** A chave de um par (os dois elementos em ordem alfabética). */
export const chaveDoPar = (a: Elemento, b: Elemento): string => [a, b].sort().join('+');

const DESTINOS: readonly DestinoEfeito[] = ['alvo', 'conjurador'];

function lerEfeitos(l: Leitor, lista: readonly unknown[], onde: string): EfeitoCanonico[] {
  const out: EfeitoCanonico[] = [];
  for (const bruto of lista) {
    const o = l.objeto(bruto, onde);
    if (!ehTipoEfeito(o.tipo)) {
      l.erro(`${onde}: tipo de efeito desconhecido "${String(o.tipo)}"`);
      continue;
    }
    out.push({ tipo: o.tipo, em: l.opcao(o, 'em', DESTINOS), duracaoMs: l.numero(o, 'duracaoMs', { min: 0 }), valor: l.numero(o, 'valor', { min: 0 }), pct: l.numero(o, 'pct', { min: 0 }), interno: null, ref: null });
  }
  return out;
}

function conferirEntrega(l: Leitor, v: unknown, onde: string): Readonly<Record<string, unknown>> {
  const o = l.objeto(v, onde);
  const teste = new Leitor(onde);
  lerEntrega(teste, o);
  for (const e of teste.erros) l.erro(`${onde}: ${e}`);
  return o;
}

const numeroOu = (l: Leitor, o: Record<string, unknown>, campo: string, padrao: number, min = -100): number =>
  o[campo] === undefined ? padrao : l.numero(o, campo, { min });

export function lerAlquimia(json: unknown, nucleos: ReadonlySet<string>, itens: ReadonlySet<string>): { alquimia: CatalogoAlquimia; erros: string[] } {
  const l = new Leitor('alquimia.json');
  const raiz = l.objeto(json, 'raiz');
  const pares = new Map<string, ParDeElementos>();
  for (const [k, v] of Object.entries(l.objeto(raiz.pares, 'pares'))) {
    const o = l.objeto(v, `par ${k}`);
    pares.set(k, { tipo: l.opcao(o, 'tipo', ['harmonico', 'instavel', 'neutro'] as const), nome: l.texto(o, 'nome'), texto: l.texto(o, 'texto') });
  }
  for (let i = 0; i < ELEMENTOS.length; i++) {
    for (let j = i + 1; j < ELEMENTOS.length; j++) {
      const a = ELEMENTOS[i];
      const b = ELEMENTOS[j];
      if (a && b && !pares.has(chaveDoPar(a, b))) l.erro(`pares: falta o par ${chaveDoPar(a, b)}`);
    }
  }
  const formas = new Map<string, Readonly<Record<string, unknown>>>();
  for (const [k, v] of Object.entries(l.objeto(raiz.formas, 'formas'))) {
    if (!nucleos.has(k)) l.erro(`formas: núcleo desconhecido "${k}"`);
    formas.set(k, conferirEntrega(l, v, `forma ${k}`));
  }
  const assinaturas: Assinatura[] = [];
  for (const bruto of l.lista(raiz, 'assinaturas')) {
    const o = l.objeto(bruto, 'assinatura');
    const id = l.texto(o, 'id');
    const ns = l.listaDeTextos(o, 'nucleos');
    for (const n of ns) if (!nucleos.has(n)) l.erro(`assinatura ${id}: núcleo desconhecido "${n}"`);
    if (ns.length < 2 || ns.length > 3) l.erro(`assinatura ${id}: de 2 a 3 núcleos`);
    assinaturas.push({ id, nome: l.texto(o, 'nome'), texto: l.texto(o, 'texto'), nucleos: ns, danoPct: numeroOu(l, o, 'danoPct', 0, 0), saltos: numeroOu(l, o, 'saltos', 0, 0), entrega: conferirEntrega(l, o.entrega ?? {}, `assinatura ${id}`) });
  }
  const n = l.objeto(raiz.nomes, 'nomes');
  const mapa = (v: unknown, onde: string): Record<string, string> => Object.fromEntries(Object.entries(l.objeto(v, onde)).map(([k, x]) => [k, typeof x === 'string' ? x : '']));
  const nomes = { trajetoria: mapa(n.trajetoria, 'nomes.trajetoria'), origem: mapa(n.origem, 'nomes.origem'), cadencia: mapa(n.cadencia, 'nomes.cadencia'), elemento: mapa(n.elemento, 'nomes.elemento') };
  const materiais = new Map<string, MaterialNaMagia>();
  for (const [id, v] of Object.entries(l.objeto(raiz.materiais, 'materiais'))) {
    if (!itens.has(id)) l.erro(`materiais: item desconhecido "${id}"`);
    const o = l.objeto(v, `material ${id}`);
    materiais.set(id, {
      texto: l.texto(o, 'texto'),
      danoPct: numeroOu(l, o, 'danoPct', 0),
      custoPct: numeroOu(l, o, 'custoPct', 0),
      recargaPct: numeroOu(l, o, 'recargaPct', 0),
      duracaoPct: numeroOu(l, o, 'duracaoPct', 0),
      custoVidaPct: numeroOu(l, o, 'custoVidaPct', 0, 0),
      perfura: o.perfura === true,
      saltos: numeroOu(l, o, 'saltos', 0, 0),
      encaixes: numeroOu(l, o, 'encaixes', 0, 0),
      efeitos: lerEfeitos(l, Array.isArray(o.efeitos) ? o.efeitos : [], `material ${id}`),
      entrega: o.entrega === undefined ? null : conferirEntrega(l, o.entrega, `material ${id}`),
    });
  }
  const legado = new Map<string, string>();
  for (const [k, v] of Object.entries(raiz.legado === undefined ? {} : l.objeto(raiz.legado, 'legado'))) if (typeof v === 'string') legado.set(k, v);
  return { alquimia: { pares, formas, assinaturas, nomes, materiais, legado }, erros: l.erros };
}
