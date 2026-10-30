// O atributo de classe (marco 28, 30/10/2026, D-127): `dominio`, com o nome da classe na interface (Bravura,
// Instinto, Arcano, Ritual, Engenho). Cada ponto acima de 10 (pelo rendimento decrescente) fortalece as skills de
// classe e as ultimates e a passiva; nos valores 25, 50, 75 e 100 destrava os marcos. Tudo em
// `balance.dominio.classes.<classe>`: `porPonto` (o ganho contínuo, por chave) e `marcos` (o valor por degrau). Quem
// consulta pede a chave; uma classe sem a chave simplesmente não ganha nada (sem `if` de classe). Sem a arma natural,
// o atributo rende só `semFamiliaridadePct`. Puro.

import type { ContextoSimulacao } from '../core/contexto';
import type { Entidade } from '../entities/entidade';
import { temFamiliaridade } from './armas';
import { pontosUteis } from './efeitos-atributo';

type Ctx = Pick<ContextoSimulacao, 'balance' | 'conteudo'>;

/** Um degrau: a partir do valor `em` do atributo, a chave vale `valor`. */
export interface MarcoDeDominio {
  em: number;
  valor: number;
}

export interface DominioDaClasse {
  porPonto: Readonly<Record<string, number>>;
  marcos: Readonly<Record<string, readonly MarcoDeDominio[]>>;
}

function classeDe(e: Entidade): string | null {
  if (e.invocacao) return null;
  return e.bolsa?.classeId ?? null;
}

function regrasDe(ctx: Ctx, e: Entidade): DominioDaClasse | undefined {
  const c = classeDe(e);
  return c ? ctx.balance.dominio.classes[c] : undefined;
}

/** Pontos de domínio acima de 10, já com o rendimento decrescente e a familiaridade. */
export function pontosDeDominio(ctx: Ctx, e: Entidade): number {
  if (!regrasDe(ctx, e)) return 0;
  const pontos = Math.max(0, pontosUteis(e.atributos.dominio, ctx.balance) - 10);
  return temFamiliaridade(ctx, e) ? pontos : (pontos * ctx.balance.dominio.semFamiliaridadePct) / 100;
}

/** O multiplicador contínuo da chave (`1 + pontos × porPonto%`); 1 se a classe não tem a chave. */
export function fatorDeDominio(ctx: Ctx, e: Entidade, chave: string): number {
  const pct = regrasDe(ctx, e)?.porPonto[chave];
  if (pct === undefined) return 1;
  return 1 + (pontosDeDominio(ctx, e) * pct) / 100;
}

/**
 * O valor do marco mais alto que o atributo já alcançou (0 se nenhum). O degrau olha o valor efetivo (com itens),
 * e sem a arma natural os marcos ficam travados.
 */
export function marcoDe(ctx: Ctx, e: Entidade, chave: string): number {
  const lista = regrasDe(ctx, e)?.marcos[chave];
  if (!lista || !temFamiliaridade(ctx, e)) return 0;
  let valor = 0;
  for (const m of lista) if (e.atributos.dominio >= m.em) valor = m.valor;
  return valor;
}

/** A skill é de classe para quem a lança: exclusiva da classe ou ultimate (e etapa dela) da própria classe. */
export function ehSkillDeClasse(ctx: Ctx, e: Entidade, habId: string): boolean {
  const classe = classeDe(e);
  if (!classe) return false;
  if (ctx.conteudo.classes.get(classe)?.exclusivas.includes(habId)) return true;
  const ult = ctx.conteudo.ultimates.get(habId) ?? ctx.conteudo.ultimates.get(habId.replace(/_\d+$/, ''));
  return ult?.classe === classe;
}

/** O multiplicador das skills de classe e ultimates (dano, cura e potência). */
export function fatorDeSkillDeClasse(ctx: Ctx, e: Entidade, habId: string): number {
  if (!ehSkillDeClasse(ctx, e, habId)) return 1;
  return 1 + (pontosDeDominio(ctx, e) * ctx.balance.dominio.skillsPorPontoPct) / 100;
}

/** Os marcos da classe, em ordem, para a ficha (a chave e o degrau). */
export function marcosDaClasse(ctx: Ctx, classeId: string): { chave: string; em: number; valor: number }[] {
  const r = ctx.balance.dominio.classes[classeId];
  if (!r) return [];
  return Object.entries(r.marcos)
    .flatMap(([chave, lista]) => lista.map((m) => ({ chave, em: m.em, valor: m.valor })))
    .sort((a, b) => a.em - b.em);
}
