// Armas de classe (marco 27, 29/10/2026, D-126; substitui a regra do básico emprestado da D-093). Cada classe tem uma
// família de armas (data/armas.json) e 8 armas dela, e cada arma tem o seu básico, com uma variação fixa da mecânica
// (o leque, o bumerangue que volta, o solo que cresce…). A raridade só aumenta a força, o gancho e o visual.
// - Familiaridade: a arma da família natural alimenta a passiva da classe (`passiva` da família); sem ela, a classe
//   perde parte (números em balance.armas.semFamiliaridade). A do Aventureiro só vale na mão principal.
// - Arma de outra classe: dá uma fração da passiva daquela classe (`emprestimo` da família), só por status e acúmulo.
// - Qualquer arma pode ir para a mão secundária: o 3º básico sai por ela (combat/basico.ts), sem penalidade.
// Regras em dados, lidas por funções pequenas; nenhum `if` de classe.

import type { ContextoSimulacao } from '../core/contexto';
import { Leitor } from '../core/validar';
import type { Entidade } from '../entities/entidade';
import { baseDaArma } from './buffs';

export const FAMILIAS_DE_ARMA = ['lamina', 'arco', 'tomo', 'cajado', 'arremesso'] as const;
export type FamiliaDeArma = (typeof FAMILIAS_DE_ARMA)[number];

/** A passiva de classe que a família alimenta (e que se perde em parte sem ela). */
export const PASSIVAS_DE_FAMILIA = ['cura', 'alcance', 'elemental', 'servos', 'pergaminhos'] as const;
export type PassivaDeFamilia = (typeof PASSIVAS_DE_FAMILIA)[number];

/** A fração da passiva que a arma dá a quem é de outra classe. */
export const EMPRESTIMOS = ['curaAoAbater', 'recargaLenta', 'basicoElemental', 'reanimar', 'invocacaoDuracao'] as const;
export type Emprestimo = (typeof EMPRESTIMOS)[number];

/**
 * Marco 24 (25/10/2026, D-098): a natureza do golpe de cada arma, para a animação e o rastro (só apresentação). Marco 27:
 * o arremesso (bumerangue) e a leitura (o tomo aberto na mão).
 */
export const GOLPES_DE_ARMA = ['corte', 'corte_pesado', 'contundente', 'contundente_leve', 'estocada', 'estocada_rapida', 'disparo', 'arremesso', 'leitura'] as const;
export type GolpeDeArma = (typeof GOLPES_DE_ARMA)[number];

export interface DefinicaoFamilia {
  /** O básico de base da família (o das armas de partida). */
  basico: string;
  /** A classe dona da família. */
  classe: string;
  /** Onde a arma precisa estar para a familiaridade: em qualquer mão ou só na principal. */
  maos: 'qualquer' | 'principal';
  passiva: PassivaDeFamilia;
  emprestimo: Emprestimo;
}

export interface DefinicaoArma {
  familia: FamiliaDeArma;
  /** O básico desta arma (com a variação dela). */
  basico: string;
  golpe: GolpeDeArma;
  /** O modelo desenhado na mão (por padrão, o próprio desenho). */
  modelo: string;
}

export interface RegrasDeArmas {
  porFamilia: Readonly<Record<FamiliaDeArma, DefinicaoFamilia>>;
  /** Desenho da arma (`arma` do item) -> definição. */
  armas: ReadonlyMap<string, DefinicaoArma>;
  /** Derivados: desenho -> família; classe -> família natural; família -> básico de base. */
  familias: ReadonlyMap<string, FamiliaDeArma>;
  naturalDaClasse: ReadonlyMap<string, FamiliaDeArma>;
  basicoDaFamilia: Readonly<Record<FamiliaDeArma, string>>;
  /** O básico de cada arma -> família (a fração do arco deixa lento o básico que vem de um arco). */
  familiaDoBasico: ReadonlyMap<string, FamiliaDeArma>;
  /** Desenho -> natureza do golpe (as armas e os desenhos só de monstro, como a foice do esqueleto). */
  golpes: ReadonlyMap<string, GolpeDeArma>;
}

export function lerArmas(json: unknown): { armas: RegrasDeArmas; erros: string[] } {
  const l = new Leitor('armas.json');
  const raiz = l.objeto(json, 'raiz');
  const familia = (v: unknown, onde: string): FamiliaDeArma => {
    if (typeof v === 'string' && (FAMILIAS_DE_ARMA as readonly string[]).includes(v)) return v as FamiliaDeArma;
    l.erro(`${onde}: família desconhecida "${String(v)}"`);
    return 'lamina';
  };
  const golpe = (v: unknown, onde: string): GolpeDeArma => {
    if (typeof v === 'string' && (GOLPES_DE_ARMA as readonly string[]).includes(v)) return v as GolpeDeArma;
    l.erro(`${onde}: golpe desconhecido "${String(v)}"`);
    return 'corte';
  };
  const fams = l.objeto(raiz.familias, 'familias');
  const porFamilia = Object.fromEntries(
    FAMILIAS_DE_ARMA.map((f) => {
      const o = l.objeto(fams[f], `familias.${f}`);
      const def: DefinicaoFamilia = {
        basico: l.texto(o, 'basico'),
        classe: l.texto(o, 'classe'),
        maos: l.opcao(o, 'maos', ['qualquer', 'principal'] as const),
        passiva: l.opcao(o, 'passiva', PASSIVAS_DE_FAMILIA),
        emprestimo: l.opcao(o, 'emprestimo', EMPRESTIMOS),
      };
      return [f, def];
    }),
  ) as Record<FamiliaDeArma, DefinicaoFamilia>;
  const armas = new Map<string, DefinicaoArma>();
  for (const [desenho, v] of Object.entries(l.objeto(raiz.armas, 'armas'))) {
    const o = l.objeto(v, `armas.${desenho}`);
    armas.set(desenho, {
      familia: familia(o.familia, `armas.${desenho}.familia`),
      basico: l.texto(o, 'basico'),
      golpe: golpe(o.golpe, `armas.${desenho}.golpe`),
      modelo: o.modelo === undefined ? desenho : l.texto(o, 'modelo'),
    });
  }
  const golpes = new Map<string, GolpeDeArma>([...armas].map(([k, a]) => [k, a.golpe]));
  for (const [k, v] of Object.entries(raiz.golpes === undefined ? {} : l.objeto(raiz.golpes, 'golpes'))) golpes.set(k, golpe(v, `golpes.${k}`));
  return {
    armas: {
      porFamilia,
      armas,
      familias: new Map([...armas].map(([k, a]) => [k, a.familia])),
      naturalDaClasse: new Map(FAMILIAS_DE_ARMA.map((f) => [porFamilia[f].classe, f])),
      familiaDoBasico: new Map([...FAMILIAS_DE_ARMA.map((f) => [porFamilia[f].basico, f] as const), ...[...armas.values()].map((a) => [a.basico, a.familia] as const)]),
      basicoDaFamilia: Object.fromEntries(FAMILIAS_DE_ARMA.map((f) => [f, porFamilia[f].basico])) as Record<FamiliaDeArma, string>,
      golpes,
    },
    erros: l.erros,
  };
}

type Ctx = Pick<ContextoSimulacao, 'conteudo'>;

/** A arma (definição) num slot de mão, ou null sem arma (escudo, aljava ou vazio). */
export function armaNaMao(ctx: Ctx, e: Entidade, mao: 'arma_principal' | 'arma_secundaria'): DefinicaoArma | null {
  const desenho = baseDaArma(ctx, e.bolsa?.equipamento[mao]?.itemId);
  return desenho ? (ctx.conteudo.armas.armas.get(desenho) ?? null) : null;
}

/** A família da arma principal equipada, ou null sem arma. */
export function familiaEquipada(ctx: Ctx, e: Entidade): FamiliaDeArma | null {
  return armaNaMao(ctx, e, 'arma_principal')?.familia ?? null;
}

/** A família natural da classe do personagem (null para quem não tem bolsa). */
function familiaNatural(ctx: Ctx, e: Entidade): FamiliaDeArma | null {
  const classeId = e.bolsa?.classeId;
  return classeId ? (ctx.conteudo.armas.naturalDaClasse.get(classeId) ?? null) : null;
}

/** A arma natural está onde precisa estar? Quem não tem bolsa (monstros, invocações) não perde nada. */
export function temFamiliaridade(ctx: Ctx, e: Entidade): boolean {
  const natural = familiaNatural(ctx, e);
  if (!natural) return true;
  const def = ctx.conteudo.armas.porFamilia[natural];
  if (armaNaMao(ctx, e, 'arma_principal')?.familia === natural) return true;
  return def.maos === 'qualquer' && armaNaMao(ctx, e, 'arma_secundaria')?.familia === natural;
}

/** A passiva da classe que depende da arma natural está de pé? (falso só quando a passiva é esta e falta a arma) */
export function passivaSemArma(ctx: Ctx, e: Entidade, passiva: PassivaDeFamilia): boolean {
  const natural = familiaNatural(ctx, e);
  return !!natural && ctx.conteudo.armas.porFamilia[natural].passiva === passiva && !temFamiliaridade(ctx, e);
}

/** A passiva da classe que depende da arma natural está ativa (a classe tem esta passiva e a arma certa)? */
export function passivaAtiva(ctx: Ctx, e: Entidade, passiva: PassivaDeFamilia): boolean {
  const natural = familiaNatural(ctx, e);
  return !!natural && ctx.conteudo.armas.porFamilia[natural].passiva === passiva && temFamiliaridade(ctx, e);
}

/** O básico usado vem de uma arma de outra família que dá este empréstimo? (o arco deixa o básico dele lento) */
export function basicoEmprestado(ctx: Ctx, e: Entidade, habilidadeId: string, emp: Emprestimo): boolean {
  const natural = familiaNatural(ctx, e);
  const familia = ctx.conteudo.armas.familiaDoBasico.get(habilidadeId);
  return !!natural && !!familia && familia !== natural && ctx.conteudo.armas.porFamilia[familia].emprestimo === emp;
}

/** As frações de passiva das armas de outra classe nas duas mãos (cada uma vale uma vez). */
export function emprestimosDe(ctx: Ctx, e: Entidade): Emprestimo[] {
  const natural = familiaNatural(ctx, e);
  if (!natural) return [];
  const saida: Emprestimo[] = [];
  for (const mao of ['arma_principal', 'arma_secundaria'] as const) {
    const familia = armaNaMao(ctx, e, mao)?.familia;
    if (!familia || familia === natural) continue;
    const emp = ctx.conteudo.armas.porFamilia[familia].emprestimo;
    if (!saida.includes(emp)) saida.push(emp);
  }
  return saida;
}

export const temEmprestimo = (ctx: Ctx, e: Entidade, emp: Emprestimo): boolean => emprestimosDe(ctx, e).includes(emp);

/** O ataque básico do personagem: o da arma principal; sem arma, o da classe. */
export function basicoDoPersonagem(ctx: Ctx, e: Entidade): string {
  const daClasse = (e.bolsa ? ctx.conteudo.classes.get(e.bolsa.classeId)?.ataqueBasico : undefined) ?? e.ataqueBasico;
  return armaNaMao(ctx, e, 'arma_principal')?.basico ?? daClasse;
}

/** O básico da arma da mão secundária (o 3º golpe sai por ele), ou null sem arma lá. */
export function basicoSecundario(ctx: Ctx, e: Entidade): string | null {
  return armaNaMao(ctx, e, 'arma_secundaria')?.basico ?? null;
}
