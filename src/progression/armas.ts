// Armas fora da classe (marco 23, 24/10/2026, D-093). Cada arma é de uma família (data/armas.json): lâmina (espada,
// machado, adaga, maça, lança), cajado ou arco; e cada classe tem a sua família natural. Com a arma principal de outra
// família na mão, o ataque básico vira o da arma: o Mago de espada golpeia corpo a corpo, o Guerreiro de cajado lança
// o dardo mágico de longe, o Mago de arco atira flechas. Sem arma, ou com a da família natural, fica o básico da
// classe. O básico emprestado bate `danoForaDaClassePct` menos (falta de prática), e o resto vem dos atributos: o
// Guerreiro tem pouca Inteligência para o dardo, o Mago pouca Força para a espada. Número em balance.armas.

import type { ContextoSimulacao } from '../core/contexto';
import { Leitor } from '../core/validar';
import type { Entidade } from '../entities/entidade';
import { baseDaArma } from './buffs';

export const FAMILIAS_DE_ARMA = ['lamina', 'cajado', 'arco'] as const;
export type FamiliaDeArma = (typeof FAMILIAS_DE_ARMA)[number];

/**
 * Marco 24 (25/10/2026, D-098): a natureza do golpe de cada arma, para a animação e o rastro (só apresentação). O
 * machado corta e esmaga; a maça e o cajado esmagam; a lança e a adaga estocam.
 */
export const GOLPES_DE_ARMA = ['corte', 'corte_pesado', 'contundente', 'contundente_leve', 'estocada', 'estocada_rapida', 'disparo'] as const;
export type GolpeDeArma = (typeof GOLPES_DE_ARMA)[number];

export interface RegrasDeArmas {
  /** Desenho da arma (`arma` da base ou o ícone) -> família. */
  familias: ReadonlyMap<string, FamiliaDeArma>;
  basicoDaFamilia: Readonly<Record<FamiliaDeArma, string>>;
  naturalDaClasse: ReadonlyMap<string, FamiliaDeArma>;
  /** Marco 24 (D-098): desenho da arma -> natureza do golpe. */
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
  const familias = new Map(Object.entries(l.objeto(raiz.familias, 'familias')).map(([k, v]) => [k, familia(v, `familias.${k}`)] as const));
  const naturalDaClasse = new Map(Object.entries(l.objeto(raiz.naturalDaClasse, 'naturalDaClasse')).map(([k, v]) => [k, familia(v, `naturalDaClasse.${k}`)] as const));
  const b = l.objeto(raiz.basicoDaFamilia, 'basicoDaFamilia');
  const basicoDaFamilia = { lamina: l.texto(b, 'lamina'), cajado: l.texto(b, 'cajado'), arco: l.texto(b, 'arco') };
  const golpe = (v: unknown, onde: string): GolpeDeArma => {
    if (typeof v === 'string' && (GOLPES_DE_ARMA as readonly string[]).includes(v)) return v as GolpeDeArma;
    l.erro(`${onde}: golpe desconhecido "${String(v)}"`);
    return 'corte';
  };
  const golpes = new Map(Object.entries(raiz.golpes === undefined ? {} : l.objeto(raiz.golpes, 'golpes')).map(([k, v]) => [k, golpe(v, `golpes.${k}`)] as const));
  return { armas: { familias, basicoDaFamilia, naturalDaClasse, golpes }, erros: l.erros };
}

/** A família da arma principal equipada, ou null sem arma (ou com uma que não é de nenhuma família). */
export function familiaEquipada(ctx: Pick<ContextoSimulacao, 'conteudo'>, e: Entidade): FamiliaDeArma | null {
  const desenho = baseDaArma(ctx, e.bolsa?.equipamento.arma_principal?.itemId);
  return desenho ? (ctx.conteudo.armas.familias.get(desenho) ?? null) : null;
}

/** A arma na mão é de outra família que a da classe? Devolve a família dela. */
export function armaForaDaClasse(ctx: Pick<ContextoSimulacao, 'conteudo'>, e: Entidade): FamiliaDeArma | null {
  const classeId = e.bolsa?.classeId;
  if (!classeId) return null;
  const familia = familiaEquipada(ctx, e);
  const natural = ctx.conteudo.armas.naturalDaClasse.get(classeId);
  return familia && natural && familia !== natural ? familia : null;
}

/** O ataque básico do personagem: o da arma de outra família, ou o da classe. */
export function basicoDoPersonagem(ctx: Pick<ContextoSimulacao, 'conteudo'>, e: Entidade): string {
  const daClasse = (e.bolsa ? ctx.conteudo.classes.get(e.bolsa.classeId)?.ataqueBasico : undefined) ?? e.ataqueBasico;
  const fora = armaForaDaClasse(ctx, e);
  return fora ? ctx.conteudo.armas.basicoDaFamilia[fora] : daClasse;
}

/** O básico emprestado de outra família bate menos. */
export function multiplicadorArma(ctx: Pick<ContextoSimulacao, 'conteudo' | 'balance'>, e: Entidade, habilidadeId: string): number {
  if (habilidadeId !== e.ataqueBasico || !armaForaDaClasse(ctx, e)) return 1;
  return 1 + ctx.balance.armas.danoForaDaClassePct / 100;
}
