// Sintonia (marco 24, 24/10/2026, D-095). A família de cada geral nas teclas 3 a 6 liga um efeito na passiva da classe;
// com 2 da mesma família há Domínio (a sintonia dobra e a família marca a ultimate); com 2 de uma família e 2 de outra,
// certos pares ligam uma vertente da classe. Só as gerais de tecla contam (as passivas gerais não). Os textos e as
// listas vêm de data/sintonia.json; o mínimo do Domínio, de balance.sintonia.

import { definicaoDe } from '../combat/compilar-habilidade';
import type { ContextoSimulacao } from '../core/contexto';
import { Leitor } from '../core/validar';
import { SLOTS_CLASSE, type Entidade } from '../entities/entidade';

export interface Vertente {
  id: string;
  nome: string;
  classe: string;
  familias: readonly [string, string];
  texto: string;
}

export interface EncarnacaoDupla {
  id: string;
  nome: string;
  elementos: readonly [string, string];
  texto: string;
}

export interface RegrasSintonia {
  /** O texto da marca de Domínio de cada família (as 9 famílias das gerais). */
  dominios: Readonly<Record<string, string>>;
  /** O texto da sintonia de cada classe com cada família. */
  classes: Readonly<Record<string, Readonly<Record<string, string>>>>;
  vertentes: readonly Vertente[];
  encarnacoesDuplas: readonly EncarnacaoDupla[];
}

export interface Sintonia {
  /** Quantas gerais de cada família estão nas teclas 3 a 6. */
  familias: Readonly<Record<string, number>>;
  /** As famílias com Domínio (2 ou mais). */
  dominios: readonly string[];
  vertente: Vertente | null;
}

const par = (l: Leitor, v: string[], onde: string): [string, string] => {
  if (v.length !== 2 || v[0] === v[1]) l.erro(`${onde}: precisa de dois itens diferentes`);
  return [v[0] ?? '', v[1] ?? ''];
};

export function lerSintonia(json: unknown): { sintonia: RegrasSintonia; erros: string[] } {
  const l = new Leitor('sintonia.json');
  const o = l.objeto(json, 'raiz');
  const textos = (v: unknown, onde: string) => {
    const m = l.objeto(v, onde);
    return Object.fromEntries(Object.keys(m).map((k) => [k, l.texto(m, k)]));
  };
  const dominios = textos(o.dominios, 'dominios');
  const familias = new Set(Object.keys(dominios));
  const brutoClasses = l.objeto(o.classes, 'classes');
  const classes = Object.fromEntries(Object.keys(brutoClasses).map((c) => [c, textos(brutoClasses[c], `classes.${c}`)]));
  for (const [c, m] of Object.entries(classes)) for (const f of Object.keys(m)) if (!familias.has(f)) l.erro(`classes.${c}: família "${f}" sem Domínio`);
  const vertentes = l.lista(o, 'vertentes').map((b): Vertente => {
    const v = l.objeto(b, 'vertente');
    const id = l.texto(v, 'id');
    const fs = par(l, l.listaDeTextos(v, 'familias'), `vertente ${id}`);
    for (const f of fs) if (!familias.has(f)) l.erro(`vertente ${id}: família "${f}" desconhecida`);
    return { id, nome: l.texto(v, 'nome'), classe: l.texto(v, 'classe'), familias: fs, texto: l.texto(v, 'texto') };
  });
  const encarnacoesDuplas = l.lista(o, 'encarnacoesDuplas').map((b): EncarnacaoDupla => {
    const v = l.objeto(b, 'encarnação dupla');
    const id = l.texto(v, 'id');
    return { id, nome: l.texto(v, 'nome'), elementos: par(l, l.listaDeTextos(v, 'elementos'), `dupla ${id}`), texto: l.texto(v, 'texto') };
  });
  return { sintonia: { dominios, classes, vertentes, encarnacoesDuplas }, erros: l.erros };
}

/** As gerais de tecla de quem usa: as teclas 3 a 6 da barra (sem bolsa, como na arena, as habilidades da ficha a partir da 3ª). */
export function geraisDeTecla(e: Entidade): string[] {
  const ids = e.bolsa ? e.bolsa.barra.slice(SLOTS_CLASSE) : e.habilidades.slice(SLOTS_CLASSE);
  return ids.filter((id): id is string => typeof id === 'string');
}

/** A sintonia de uma classe com essas gerais de tecla. */
export function sintoniaDasGerais(ctx: Pick<ContextoSimulacao, 'conteudo' | 'balance'>, classeId: string, gerais: readonly string[]): Sintonia {
  const familias: Record<string, number> = {};
  for (const id of gerais) {
    const d = definicaoDe(ctx, id);
    const f = d?.familiaGeral;
    if (f && !d.base.passiva) familias[f] = (familias[f] ?? 0) + 1;
  }
  const minimo = ctx.balance.sintonia.dominioMinimo;
  const dominios = Object.keys(familias).filter((f) => (familias[f] ?? 0) >= minimo).sort();
  const vertente = ctx.conteudo.sintonia.vertentes.find((v) => v.classe === classeId && v.familias.every((f) => dominios.includes(f))) ?? null;
  return { familias, dominios, vertente };
}

/** A sintonia de quem usa (classe e barra). */
export function sintoniaDe(ctx: Pick<ContextoSimulacao, 'conteudo' | 'balance'>, e: Entidade): Sintonia {
  return sintoniaDasGerais(ctx, e.bolsa?.classeId ?? e.classeId ?? '', geraisDeTecla(e));
}

/** A família está sintonizada (≥ 1 geral dela nas teclas) e quanto vale: 1, ou 2 com Domínio. */
export function forcaDaSintonia(s: Sintonia, familia: string): number {
  const n = s.familias[familia] ?? 0;
  return n === 0 ? 0 : s.dominios.includes(familia) ? 2 : 1;
}
