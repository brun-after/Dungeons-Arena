// O golpe que o token anima (marco 24, 25/10/2026, D-098). Puro: pela habilidade da ação e pela arma desenhada na mão
// (a `aparencia` pública, ou a arma da classe com a mão vazia), decide a pose — corte, machadada, esmagar, estocar,
// disparar — ou o giro das habilidades com `animacao: 'giro'`. Magias e habilidades de longe ficam com o empurrão
// genérico. Só apresentação: nada aqui entra na simulação.

import { resolverHabilidade } from '../combat/compilar-habilidade';
import { ehElemento, type Elemento } from '../combat/elementos';
import type { ContextoSimulacao } from '../core/contexto';
import type { Entidade } from '../entities/entidade';
import type { GolpeDeArma } from '../progression/armas';
import type { Golpe } from './caminhada';
import { ARMA_DE_CLASSE } from './modelos';

/** Até onde (células) uma habilidade física ainda é golpe de arma, e não ataque de longe. */
const ALCANCE_CORPO_A_CORPO = 2;

/** A arma na mão: a do equipamento, ou a da classe do modelo com a mão vazia (null: criatura sem arma de classe). */
export function armaNaMao(e: Entidade, modelo: string): string | null {
  return e.aparencia?.arma ?? (Object.hasOwn(ARMA_DE_CLASSE, modelo) ? ARMA_DE_CLASSE[modelo as keyof typeof ARMA_DE_CLASSE].arma : null);
}

/** A natureza do golpe da arma na mão (null: sem arma conhecida). */
export function golpeDaArmaNaMao(ctx: Pick<ContextoSimulacao, 'conteudo'>, e: Entidade, modelo: string): GolpeDeArma | null {
  const arma = armaNaMao(e, modelo);
  return arma ? (ctx.conteudo.armas.golpes.get(arma) ?? null) : null;
}

/** O golpe que a ação (pela chave da habilidade) anima no token. */
export function golpeDaAcao(ctx: ContextoSimulacao, e: Entidade, chave: string, modelo: string): Golpe | null {
  const h = resolverHabilidade(ctx, chave);
  if (!h) return null;
  if (h.visual?.animacao === 'giro') return 'giro';
  const golpe = golpeDaArmaNaMao(ctx, e, modelo);
  // Marco 27 (D-126): o tomo lê a magia (o dardo e as de longe); de perto, bate com o livro.
  if (golpe === 'leitura') return h.tipoAtaque === 'magico' || h.alcanceCelulas > ALCANCE_CORPO_A_CORPO ? 'leitura' : 'contundente_leve';
  if (h.tipoAtaque !== 'fisico') return null;
  if (!golpe) return null;
  if (golpe === 'disparo' || golpe === 'arremesso') return h.politicaImpacto === 'projetil' ? golpe : h.alcanceCelulas <= ALCANCE_CORPO_A_CORPO ? 'contundente_leve' : null;
  return h.politicaImpacto === 'projetil' || h.alcanceCelulas > ALCANCE_CORPO_A_CORPO ? null : golpe;
}

/**
 * Marco 32 (31/10/2026, D-131): o elemento que a ação lança (o da habilidade, senão o da arma), para a runa do tomo;
 * null: sem elemento (o arcano).
 */
export function elementoDaAcao(ctx: ContextoSimulacao, e: Entidade, chave: string): Elemento | null {
  const h = resolverHabilidade(ctx, chave);
  const daArma = e.aparencia?.elementoArma ?? null;
  return h?.elemento ?? (daArma && ehElemento(daArma) ? daArma : null);
}
