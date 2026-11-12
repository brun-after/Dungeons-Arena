// Quais skills têm encaixe de runa e a runa padrão da classe (marco 39, 12/11/2026, D-151). Separado de runas.ts para
// o vínculo (progression/vinculo.ts) consultar sem depender dele. Puro.

import type { ContextoSimulacao } from '../core/contexto';
import type { Bolsa } from '../entities/entidade';
import { ehDeAlgumaClasse } from '../progression/habilidades-classe';
import type { Elemento } from './elementos';

type Ctx = Pick<ContextoSimulacao, 'conteudo'>;

/** O id da ultimate de uma etapa (`<ultimate>_N`), ou o próprio id. */
export function idDoEncaixe(ctx: Ctx, id: string): string {
  if (ctx.conteudo.ultimates.has(id)) return id;
  const m = /^(.+)_\d+$/.exec(id);
  return m?.[1] && ctx.conteudo.ultimates.has(m[1]) ? m[1] : id;
}

/** A skill tem encaixe de runa? (as exclusivas das classes e as ultimates, com as etapas delas) */
export function levaRuna(ctx: Ctx, id: string): boolean {
  return ehDeAlgumaClasse(ctx, id) || ctx.conteudo.ultimates.has(idDoEncaixe(ctx, id));
}

/** A runa padrão da classe. */
export function runaPadrao(ctx: Ctx, bolsa: Pick<Bolsa, 'classeId'>): 'fisico' | Elemento {
  return ctx.conteudo.classes.get(bolsa.classeId)?.runaPadrao ?? 'fisico';
}

/** A runa que o encaixe tem sem escolha: o elemento da skill no catálogo, se ela tem um; senão, a da classe. */
export function runaPadraoDaSkill(ctx: Ctx, bolsa: Pick<Bolsa, 'classeId'>, id: string): 'fisico' | Elemento {
  return ctx.conteudo.definicoes.get(idDoEncaixe(ctx, id))?.base.elemento ?? ctx.conteudo.definicoes.get(id)?.base.elemento ?? runaPadrao(ctx, bolsa);
}
