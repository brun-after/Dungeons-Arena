// Marco 50 (21/11/2026, D-196): a definição de uma fusão aberta, refeita do id (a receita). Cada posição dá uma coisa:
// - 1ª, o núcleo: o papel, a fórmula, o elemento principal, o ícone e o visual;
// - 2ª, a forma: o desenho do golpe (projétil, área, alcance) e a entrega dela (a própria, ou a forma natural do núcleo
//   dela em alquimia.json);
// - 3ª, o eco: os estados dela e a marca ou a permanência da forma dela.
// O orçamento (balance.alquimia) divide o poder pelas funções: o par põe 112% em 2 (56% cada), o trio 130% em 3 (cerca
// de 43%); o par harmônico ganha a ressonância (+15%), o trio só se os 3 pares forem harmônicos; cada par instável
// encarece. O dano soma a fatia de cada parte que fere (dois golpes num par dão 112%); os estados de cada parte saem na
// fatia dela. Os elementos além do principal entram como a camada do estado deles. A runa de um elemento presente
// amplifica os estados dele; a de um elemento novo põe a camada dele (mesmo além de 3). O material soma o efeito dele na
// magia. Assinaturas (misturas com nome) somam poder e trocam a forma. Puro.

import type { ContextoSimulacao } from '../../core/contexto';
import { Leitor } from '../../core/validar';
import type { Elemento } from '../elementos';
import { ENTREGA_PADRAO, lerEntrega, type Entrega } from '../entrega/tipos';
import { GRAUS, type DefinicaoHabilidade, type Grau, type Habilidade } from '../habilidades';
import type { EfeitoCanonico } from '../registro-efeitos';
import { chaveDoPar, type Assinatura, type TipoPar } from './catalogo';
import { lerIdDaFusao, type Receita } from './receita';

type Ctx = Pick<ContextoSimulacao, 'conteudo' | 'balance'>;
type Resolver = (id: string) => DefinicaoHabilidade | null;

/** O retrato da mistura: o que a bancada mostra antes de transmutar e o que a definição usa. */
export interface Mistura {
  receita: Receita;
  elementos: Elemento[];
  pares: { chave: string; tipo: TipoPar }[];
  ressonante: boolean;
  instaveis: number;
  /** O orçamento total (%) e a fatia de cada função. */
  orcamentoPct: number;
  fatiaPct: number;
  custoMult: number;
  recargaMult: number;
  assinatura: Assinatura | null;
}

const ehSuporte = (h: Habilidade): boolean => h.formulaDano === null && h.formulaCura !== null;

/** Mesmo multiconjunto de núcleos (a assinatura não depende da ordem). */
const mesmosNucleos = (a: readonly string[], b: readonly string[]): boolean => a.length === b.length && [...a].sort().join() === [...b].sort().join();

export function misturar(ctx: Ctx, receita: Receita, defs: readonly DefinicaoHabilidade[]): Mistura {
  const r = ctx.balance.alquimia;
  const cat = ctx.conteudo.alquimia;
  const elementos: Elemento[] = [];
  for (const d of defs) if (d.base.elemento && !elementos.includes(d.base.elemento) && elementos.length < 3) elementos.push(d.base.elemento);
  const pares: Mistura['pares'] = [];
  for (let i = 0; i < elementos.length; i++) {
    for (let j = i + 1; j < elementos.length; j++) {
      const a = elementos[i];
      const b = elementos[j];
      if (!a || !b) continue;
      const chave = chaveDoPar(a, b);
      pares.push({ chave, tipo: cat.pares.get(chave)?.tipo ?? 'neutro' });
    }
  }
  const trio = receita.partes.length === 3;
  const regra = trio ? r.trio : r.par;
  const ressonante = pares.length > 0 && pares.every((p) => p.tipo === 'harmonico');
  const instaveis = pares.filter((p) => p.tipo === 'instavel').length;
  const nucleos = defs.map((d) => d.nucleo ?? '');
  const assinatura = cat.assinaturas.find((a) => mesmosNucleos(a.nucleos, nucleos)) ?? null;
  const orcamentoPct = regra.orcamentoPct + (ressonante ? r.ressonanciaPct : 0) + (assinatura?.danoPct ?? 0);
  const custoMult = regra.custo + (instaveis * (trio ? r.instavel.custoTrioPct : r.instavel.custoParPct)) / 100;
  const recargaMult = regra.recarga * (instaveis > 0 ? 1 + r.instavel.recargaPct / 100 : 1);
  return { receita, elementos, pares, ressonante, instaveis, orcamentoPct, fatiaPct: orcamentoPct / receita.partes.length, custoMult, recargaMult, assinatura };
}

/** O estado na fatia: a duração e a força escalam, sem cair abaixo de meio segundo. */
function naFatia(e: EfeitoCanonico, f: number): EfeitoCanonico {
  return { ...e, duracaoMs: e.duracaoMs > 0 ? Math.max(500, Math.round(e.duracaoMs * f)) : 0, valor: e.valor > 0 ? Math.max(1, Math.round(e.valor * f)) : 0 };
}

/** A entrega da fusão: a forma da 2ª parte por cima do corpo do núcleo, a marca e a permanência do eco; ajustada para valer. */
function entregaDa(ctx: Ctx, defs: readonly DefinicaoHabilidade[], extra: readonly Readonly<Record<string, unknown>>[]): Entrega | undefined {
  const formas = ctx.conteudo.alquimia.formas;
  const natural = (d: DefinicaoHabilidade | undefined): Record<string, unknown> => (d ? { ...(d.base.entrega ?? formas.get(d.nucleo ?? '') ?? {}) } : {});
  const [nucleo, forma, eco] = defs;
  const bruto: Record<string, unknown> = { ...natural(forma) };
  const doNucleo = natural(nucleo);
  if (doNucleo.corpo !== undefined && bruto.corpo === undefined) bruto.corpo = doNucleo.corpo;
  const doEco = natural(eco);
  for (const k of ['marca', 'permanencia'] as const) if (doEco[k] !== undefined && doEco[k] !== 'nenhuma') bruto[k] = doEco[k];
  for (const e of extra) Object.assign(bruto, e);
  // As combinações que o motor não aceita se acertam pela ordem: o feixe anda em reta e sem corpo; o céu e o círculo
  // sob o alvo não andam de lado; quem volta ou invoca sai da mão.
  if (bruto.cadencia === 'feixe') {
    bruto.trajetoria = 'reta';
    delete bruto.corpo;
    if (bruto.permanencia === 'gira') delete bruto.permanencia;
  }
  if (bruto.origem === 'ceu' || bruto.origem === 'sob_alvo') delete bruto.trajetoria;
  if (bruto.sentido !== undefined && bruto.sentido !== 'ida') bruto.origem = 'mao';
  if (bruto.origem !== 'circulos_atras' && bruto.origem !== 'circulos_frente') delete bruto.circulos;
  if (bruto.cadencia !== 'salva') delete bruto.quantidade;
  if (bruto.cadencia !== 'rajada' && bruto.cadencia !== 'feixe') delete bruto.duracaoMs;
  const l = new Leitor('fusao');
  const e = lerEntrega(l, bruto);
  if (l.erros.length > 0 || !e) return undefined;
  const igualPadrao = (Object.keys(ENTREGA_PADRAO) as (keyof Entrega)[]).every((k) => ENTREGA_PADRAO[k] === e[k]);
  return igualPadrao ? undefined : e;
}

/** O nome: o da assinatura, ou o do núcleo com o jeito da forma e o elemento novo. */
function nomeDa(ctx: Ctx, m: Mistura, nucleo: Habilidade, entrega: Entrega | undefined): string {
  if (m.assinatura) return m.assinatura.nome;
  const n = ctx.conteudo.alquimia.nomes;
  const e = entrega ?? ENTREGA_PADRAO;
  const extra = m.elementos.find((x) => x !== nucleo.elemento) ?? m.receita.runas.find((x) => x !== nucleo.elemento);
  const sufixo = `${n.trajetoria[e.trajetoria] ?? ''}${n.origem[e.origem] ?? ''}${n.cadencia[e.cadencia] ?? ''}`;
  return `${nucleo.nome}${sufixo}${extra ? ` e ${n.elemento[extra] ?? extra}` : ''}`;
}

const grauMaior = (gs: readonly Grau[]): Grau => GRAUS[Math.max(...gs.map((g) => GRAUS.indexOf(g)))] ?? 'B';

/** A definição da fusão (null quando o id não é de fusão ou alguma parte não serve). */
export function definicaoDaFusao(ctx: Ctx, id: string, resolver: Resolver): DefinicaoHabilidade | null {
  const receita = lerIdDaFusao(id);
  if (!receita) return null;
  const defs = receita.partes.map(resolver);
  if (!defs.every((d): d is DefinicaoHabilidade => !!d && !d.basico && !d.interna && d.base.passiva === null)) return null;
  const material = receita.material ? ctx.conteudo.alquimia.materiais.get(receita.material) : undefined;
  if (receita.material && !material) return null;
  const r = ctx.balance.alquimia;
  const m = misturar(ctx, receita, defs);
  const [dNucleo, dForma] = defs;
  if (!dNucleo || !dForma) return null;
  const nucleo = dNucleo.base;
  const forma = dForma.base;
  const fatia = m.fatiaPct / 100;
  // O desenho do golpe vem da forma quando ela voa ou cai em área (e o núcleo não é de suporte com alvo aliado).
  const formaDesenha = (forma.politicaImpacto === 'projetil' || forma.politicaImpacto === 'area') && !ehSuporte(nucleo);
  const desenho = formaDesenha ? forma : nucleo;
  const extras = [m.assinatura?.entrega ?? {}, material?.entrega ?? {}];
  const entrega = desenho.politicaImpacto === 'projetil' || desenho.politicaImpacto === 'area' ? entregaDa(ctx, defs, extras) : undefined;
  // Os estados: os de cada parte na fatia; os elementos a mais, como a camada deles; as runas por cima; o material.
  const efeitos: EfeitoCanonico[] = [];
  defs.forEach((d, i) => {
    for (const e of d.base.efeitos) if (i === 0 || !e.em || e.em === 'alvo' || e.em === 'conjurador') efeitos.push(naFatia(e, fatia));
  });
  const camada = (el: Elemento, f: number) => {
    const estado = ctx.conteudo.elementos.get(el)?.estado;
    if (estado && !efeitos.some((e) => e.tipo === estado.tipo)) efeitos.push(naFatia(estado, f));
  };
  for (const el of m.elementos) if (el !== nucleo.elemento) camada(el, fatia);
  for (const runa of receita.runas) {
    const estado = ctx.conteudo.elementos.get(runa)?.estado;
    if (!estado) continue;
    const ja = efeitos.findIndex((e) => e.tipo === estado.tipo);
    const amp = 1 + r.runa.amplificaPct / 100;
    if (ja >= 0) {
      const e = efeitos[ja];
      if (e) efeitos[ja] = { ...e, duracaoMs: Math.round(e.duracaoMs * amp), valor: Math.round(e.valor * amp), pct: Math.round(e.pct * amp) };
    } else efeitos.push(naFatia(estado, r.runa.camadaPct / 100));
  }
  const duracaoMat = 1 + (material?.duracaoPct ?? 0) / 100;
  const finais = efeitos.map((e) => (duracaoMat !== 1 && e.duracaoMs > 0 ? { ...e, duracaoMs: Math.round(e.duracaoMs * duracaoMat) } : e));
  // O estado do material que a magia já tem reforça o dela (o maior de cada número); o novo entra inteiro.
  for (const m of material?.efeitos ?? []) {
    const i = finais.findIndex((e) => e.tipo === m.tipo && e.em === m.em);
    const e = finais[i];
    if (e) finais[i] = { ...e, duracaoMs: Math.max(e.duracaoMs, m.duracaoMs), valor: Math.max(e.valor, m.valor), pct: Math.max(e.pct, m.pct) };
    else finais.push(m);
  }
  // O dano soma a fatia de cada parte que fere; a cura, a de cada parte que cura.
  const ferem = Math.max(1, defs.filter((d) => d.base.formulaDano !== null).length);
  const curam = Math.max(1, defs.filter((d) => d.base.formulaCura !== null).length);
  const formulaDano = nucleo.formulaDano ?? defs.find((d) => d.base.formulaDano !== null)?.base.formulaDano ?? null;
  const formulaCura = nucleo.formulaCura ?? defs.find((d) => d.base.formulaCura !== null)?.base.formulaCura ?? null;
  const maior = (f: (h: Habilidade) => number) => Math.max(...defs.map((d) => f(d.base)));
  const custo = Math.round(maior((h) => h.custoRecurso) * m.custoMult * (1 + (material?.custoPct ?? 0) / 100));
  const recarga = Math.round(maior((h) => h.recargaMs) * m.recargaMult * (1 + (material?.recargaPct ?? 0) / 100));
  const saltosBase = desenho.saltos ?? nucleo.saltos;
  const saltosExtra = (material?.saltos ?? 0) + (m.assinatura?.saltos ?? 0);
  const base: Habilidade = {
    ...nucleo,
    id,
    chave: id,
    nome: '',
    alcanceCelulas: desenho.alcanceCelulas,
    tipoArea: desenho.tipoArea,
    raioArea: Math.max(desenho.raioArea, formaDesenha ? 0 : forma.raioArea),
    politicaImpacto: desenho.politicaImpacto,
    velocidadeProjetil: desenho.velocidadeProjetil,
    perfura: desenho.perfura || nucleo.perfura || !!material?.perfura,
    saltos: saltosBase ? { ...saltosBase, quantidade: saltosBase.quantidade + saltosExtra } : saltosExtra > 0 ? { quantidade: saltosExtra, raio: 3, pct: 75 } : null,
    formulaDano,
    formulaCura,
    multDano: nucleo.multDano * fatia * ferem * (1 + (material?.danoPct ?? 0) / 100),
    multCura: nucleo.multCura * fatia * curam,
    custoRecurso: Math.max(1, custo),
    custoVida: nucleo.custoVida + (material?.custoVidaPct ?? 0),
    recargaMs: Math.max(500, recarga),
    conjuracaoMs: maior((h) => h.conjuracaoMs),
    efeitos: finais,
    tags: [...new Set([...defs.flatMap((d) => d.base.tags), 'fusao'])],
    nivelMinimo: maior((h) => h.nivelMinimo),
    grau: receita.partes.length === 3 ? 'S' : grauMaior(defs.map((d) => d.base.grau)),
    ...(entrega ? { entrega } : {}),
  };
  if (!entrega) delete base.entrega;
  base.nome = nomeDa(ctx, m, nucleo, entrega);
  return {
    familiaEvolucao: 'fusao',
    base,
    basico: false,
    evolucoes: {},
    mods: [...new Set(defs.flatMap((d) => d.mods))],
    marcos: {},
    fusao: receita.partes,
    variantes: {},
    interna: false,
    ...(dNucleo.nucleo !== undefined && { nucleo: dNucleo.nucleo }),
    ...(dNucleo.eixos !== undefined && { eixos: dNucleo.eixos }),
  };
}

/** A memória por catálogo: a mesma receita não se refaz a cada golpe. */
const MEMORIA = new WeakMap<object, Map<string, DefinicaoHabilidade | null>>();

export function definicaoDaFusaoMemo(ctx: Ctx, id: string, resolver: Resolver): DefinicaoHabilidade | null {
  let porId = MEMORIA.get(ctx.conteudo);
  if (!porId) MEMORIA.set(ctx.conteudo, (porId = new Map()));
  const pronto = porId.get(id);
  if (pronto !== undefined) return pronto;
  const def = definicaoDaFusao(ctx, id, resolver);
  porId.set(id, def);
  return def;
}
