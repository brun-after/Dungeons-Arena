// A descrição de uma habilidade como o menu de habilidades a mostra (09/11/2026, D-144): o seletor da barra (clique
// direito ou toque longo numa tecla) mostra a da tecla e a de cada opção ao passar o mouse ou o foco.

import { resolverHabilidade } from '../combat/compilar-habilidade';
import { chaveDoAtor, perfilPara } from '../combat/perfil';
import type { ContextoSimulacao } from '../core/contexto';
import type { Entidade } from '../entities/entidade';
import { descreverHabilidade, linhasDeEscala } from './descrever';
import { historiaDaSkill } from './historia-skill';

/** As linhas da descrição da habilidade para este personagem (com o rank, o perfil e a escala). */
export function linhasDaSkill(ctx: ContextoSimulacao, j: Entidade, id: string): string[] {
  const h = resolverHabilidade(ctx, chaveDoAtor(ctx, j, id)) ?? resolverHabilidade(ctx, id);
  if (!h) return [];
  // D-175 (15/11/2026): a história (o que é) e o visual (o que se vê) abrem a descrição; os números vêm depois.
  const historia = historiaDaSkill(ctx, j, id, 0);
  const linhas = [historia?.narrativa ?? '', historia?.visual ?? ''].filter((x) => x !== '');
  linhas.push(...descreverHabilidade(h, { rankMax: ctx.balance.habilidades.rankMax, perfilDanoPct: perfilPara(ctx, j, h).danoPct }));
  if (!h.passiva && (h.formulaDano !== null || h.formulaCura !== null)) linhas.push(...linhasDeEscala(ctx, j, h));
  return linhas;
}
