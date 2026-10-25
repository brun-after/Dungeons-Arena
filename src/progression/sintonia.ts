// Sintonia (marco 24, 24/10/2026, D-095). A família de cada geral nas teclas 3 a 6 liga um efeito na passiva da classe;
// com 2 da mesma família há Domínio (a sintonia dobra e a família marca a ultimate); com 2 de uma família e 2 de outra,
// certos pares ligam uma vertente da classe. Só as gerais de tecla contam (as passivas gerais não). Os textos e as
// listas vêm de data/sintonia.json; o mínimo do Domínio, de balance.sintonia.

import { definicaoDe } from '../combat/compilar-habilidade';
import type { ContextoSimulacao } from '../core/contexto';
import { Leitor } from '../core/validar';
import { SLOTS_CLASSE, type Entidade } from '../entities/entidade';
import { emFrenesi } from '../combat/furia';
import { lerEfeitosSintonia, type EfeitoSintonia, type TipoSintonia } from './sintonia-efeitos';

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
  /** Marco 24 (D-095): o efeito da fusão, no vocabulário da sintonia. */
  efeitos: readonly EfeitoSintonia[];
}

export interface RegrasSintonia {
  /** O texto da marca de Domínio de cada família (as 9 famílias das gerais). */
  dominios: Readonly<Record<string, string>>;
  /** O texto da sintonia de cada classe com cada família. */
  classes: Readonly<Record<string, Readonly<Record<string, string>>>>;
  vertentes: readonly Vertente[];
  encarnacoesDuplas: readonly EncarnacaoDupla[];
  /** Marco 24 (D-095): a mecânica de cada sintonia (por classe e família) e de cada vertente, no vocabulário fechado. */
  efeitosDaClasse: Readonly<Record<string, Readonly<Record<string, readonly EfeitoSintonia[]>>>>;
  efeitosDaVertente: Readonly<Record<string, readonly EfeitoSintonia[]>>;
  /** O efeito de cada encarnação do Mago (por elemento). */
  efeitosDaEncarnacao: Readonly<Record<string, readonly EfeitoSintonia[]>>;
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
    return { id, nome: l.texto(v, 'nome'), elementos: par(l, l.listaDeTextos(v, 'elementos'), `dupla ${id}`), texto: l.texto(v, 'texto'), efeitos: lerEfeitosSintonia(l, v.efeitos, `dupla ${id}`) };
  });
  const mec = l.objeto(o.mecanicas ?? {}, 'mecanicas');
  const mecClasses = l.objeto(mec.classes ?? {}, 'mecanicas.classes');
  const efeitosDaClasse = Object.fromEntries(Object.keys(mecClasses).map((c) => {
    const m = l.objeto(mecClasses[c], `mecanicas.classes.${c}`);
    for (const f of Object.keys(m)) if (!familias.has(f)) l.erro(`mecanicas.classes.${c}: família "${f}" desconhecida`);
    return [c, Object.fromEntries(Object.keys(m).map((f) => [f, lerEfeitosSintonia(l, m[f], `sintonia ${c}/${f}`)]))];
  }));
  const mecVertentes = l.objeto(mec.vertentes ?? {}, 'mecanicas.vertentes');
  for (const id of Object.keys(mecVertentes)) if (!vertentes.some((v) => v.id === id)) l.erro(`mecanicas.vertentes: vertente "${id}" desconhecida`);
  const efeitosDaVertente = Object.fromEntries(Object.keys(mecVertentes).map((id) => [id, lerEfeitosSintonia(l, mecVertentes[id], `vertente ${id}`)]));
  const mecEncarnacoes = l.objeto(mec.encarnacoes ?? {}, 'mecanicas.encarnacoes');
  const efeitosDaEncarnacao = Object.fromEntries(Object.keys(mecEncarnacoes).map((el) => [el, lerEfeitosSintonia(l, mecEncarnacoes[el], `encarnação ${el}`)]));
  return { sintonia: { dominios, classes, vertentes, encarnacoesDuplas, efeitosDaClasse, efeitosDaVertente, efeitosDaEncarnacao }, erros: l.erros };
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

/** A condição `quando` de uma entrada vale agora? */
function vale(ef: EfeitoSintonia, e: Entidade, tick: number): boolean {
  switch (ef.quando) {
    case 'sempre': return true;
    case 'frenesi': return emFrenesi(e, tick);
    case 'foraDoFrenesi': return !emFrenesi(e, tick);
    case 'invisivel': return e.invisivelAteTick > tick;
    case 'parado': return e.direcao === 'parado' && e.caminho.length === 0;
  }
}

const dobrar = (ef: EfeitoSintonia, forca: number): EfeitoSintonia =>
  forca > 1 && ef.dobra
    ? { ...ef, valor: ef.valor * forca, pct: ef.pct * forca, efeito: ef.efeito ? { ...ef.efeito, valor: ef.efeito.valor * forca } : null }
    : ef;

/**
 * Marco 24 (24/10/2026, D-095): os efeitos do tipo `t` que valem para `e` agora — os da sintonia de cada família das
 * gerais de tecla (dobrados pelo Domínio quando a entrada `dobra`) e os da vertente ligada. Invocação não tem sintonia.
 */
export function efeitosDeSintonia(ctx: Pick<ContextoSimulacao, 'conteudo' | 'balance'>, e: Entidade, t: TipoSintonia, tick: number): EfeitoSintonia[] {
  if (e.invocacao) return [];
  const classe = e.bolsa?.classeId ?? e.classeId ?? '';
  const regras = ctx.conteudo.sintonia;
  const daClasse = regras.efeitosDaClasse[classe];
  if (!daClasse) return [];
  const s = sintoniaDe(ctx, e);
  const saida: EfeitoSintonia[] = [];
  for (const familia of Object.keys(s.familias)) {
    const forca = forcaDaSintonia(s, familia);
    for (const ef of daClasse[familia] ?? []) if (ef.t === t && vale(ef, e, tick)) saida.push(dobrar(ef, forca));
  }
  if (s.vertente) for (const ef of regras.efeitosDaVertente[s.vertente.id] ?? []) if (ef.t === t && vale(ef, e, tick)) saida.push(ef);
  return saida;
}

/** O primeiro efeito do tipo (ou null), para as mecânicas que só ligam ou desligam. */
export function efeitoDeSintonia(ctx: Pick<ContextoSimulacao, 'conteudo' | 'balance'>, e: Entidade, t: TipoSintonia, tick: number): EfeitoSintonia | null {
  return efeitosDeSintonia(ctx, e, t, tick)[0] ?? null;
}

/** A soma de um campo nos efeitos do tipo (0 sem nenhum). */
export function somaDeSintonia(ctx: Pick<ContextoSimulacao, 'conteudo' | 'balance'>, e: Entidade, t: TipoSintonia, campo: 'valor' | 'pct' | 'ms', tick: number): number {
  return efeitosDeSintonia(ctx, e, t, tick).reduce((soma, ef) => soma + ef[campo], 0);
}
