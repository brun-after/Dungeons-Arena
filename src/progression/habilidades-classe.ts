// Skills de classe e gerais na barra (marco 24, 24/10/2026, D-094). As 8 skills exclusivas de cada classe ficam nas
// teclas 1 e 2 e sobem de rank com o nível, sem ponto (o rank de evolução espera a escolha do caminho, também sem
// ponto); as 6 que a classe não traz de início vêm de livros só dela, que ensinam na hora. As gerais ficam nas teclas
// 3 a 6: o livro libera, e aprender (rank 1, com estudo) e subir custam pontos.

import { definicaoDe } from '../combat/compilar-habilidade';
import type { ContextoSimulacao } from '../core/contexto';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { SLOTS_BARRA, SLOTS_CLASSE, type Bolsa, type Entidade } from '../entities/entidade';

type Ctx = Pick<ContextoSimulacao, 'conteudo' | 'balance'>;

/** A skill é uma das 8 exclusivas da classe do personagem. */
export function ehDaClasse(ctx: Pick<ContextoSimulacao, 'conteudo'>, bolsa: Pick<Bolsa, 'classeId'>, id: string): boolean {
  return ctx.conteudo.classes.get(bolsa.classeId)?.exclusivas.includes(id) ?? false;
}

/** A skill é exclusiva de alguma classe (de qualquer uma). */
export function ehDeAlgumaClasse(ctx: Pick<ContextoSimulacao, 'conteudo'>, id: string): boolean {
  return [...ctx.conteudo.classes.values()].some((c) => c.exclusivas.includes(id));
}

/** Por que a tecla não aceita a skill (null = aceita): 1–2 só de classe, 3–6 só ativas gerais (ou fusões). */
export function teclaRecusa(ctx: Ctx, bolsa: Pick<Bolsa, 'classeId'>, slot: number, id: string): 'tecla_invalida' | 'tecla_errada' | 'passiva' | null {
  if (!Number.isInteger(slot) || slot < 0 || slot >= SLOTS_BARRA) return 'tecla_invalida';
  if (definicaoDe(ctx, id)?.base.passiva) return 'passiva';
  return ehDaClasse(ctx, bolsa, id) === slot < SLOTS_CLASSE ? null : 'tecla_errada';
}

/** O maior rank que o nível dá à skill de classe, parando no rank de evolução cujo caminho ainda não foi escolhido. */
export function rankDeClassePeloNivel(ctx: Ctx, id: string, nivel: number, caminhos: readonly string[]): number {
  const regras = ctx.balance.habilidades;
  const def = definicaoDe(ctx, id);
  let rank = 0;
  for (let r = 1; r <= regras.rankMax; r++) {
    const nivelDoRank = Math.max(regras.ranks[r - 1]?.nivelMinimo ?? Infinity, def?.base.nivelMinimo ?? 1);
    if (nivel < nivelDoRank) break;
    const evolucao = regras.ranksEvolucao.includes(r) && (def?.evolucoes[r]?.length ?? 0) > 0;
    if (evolucao && caminhos.length < regras.ranksEvolucao.filter((x) => x <= r && (def?.evolucoes[x]?.length ?? 0) > 0).length) break;
    rank = r;
  }
  return rank;
}

/**
 * Leva cada skill de classe conhecida ao rank do nível (só sobe; a evolução espera o caminho). Devolve as que mudaram,
 * para quem chama emitir `habilidadeMudou` e refazer a ficha.
 */
export function sincronizarRanksDeClasse(e: Entidade, ctx: Ctx, tick: number, saida: EventoSimulacao[] | null): boolean {
  const bolsa = e.bolsa;
  if (!bolsa) return false;
  let mudou = false;
  for (const c of bolsa.conhecidas) {
    if (!ehDaClasse(ctx, bolsa, c.id)) continue;
    const alvo = rankDeClassePeloNivel(ctx, c.id, e.nivel, c.caminhos);
    if (alvo <= c.rank) continue;
    c.rank = alvo;
    mudou = true;
    saida?.push({ t: 'habilidadeMudou', tick, id: e.id, habilidadeId: c.id, rank: c.rank, caminho: null });
  }
  return mudou;
}

/** Põe a skill na primeira tecla livre do tipo dela (1–2 de classe, 3–6 gerais); passivas não vão para a barra. */
export function ocuparTeclaLivre(ctx: Ctx, bolsa: Bolsa, id: string): void {
  if (definicaoDe(ctx, id)?.base.passiva || bolsa.barra.includes(id)) return;
  const deClasse = ehDaClasse(ctx, bolsa, id);
  for (let slot = deClasse ? 0 : SLOTS_CLASSE; slot < (deClasse ? SLOTS_CLASSE : SLOTS_BARRA); slot++) {
    if (bolsa.barra[slot] === null || bolsa.barra[slot] === undefined) {
      bolsa.barra[slot] = id;
      return;
    }
  }
}

/** A barra inicial de uma classe: as 2 iniciais nas teclas 1–2 e a geral inicial na 3. */
export function barraInicial(iniciais: readonly string[], geralInicial: string | null): (string | null)[] {
  return Array.from({ length: SLOTS_BARRA }, (_, i) => (i < SLOTS_CLASSE ? (iniciais[i] ?? null) : i === SLOTS_CLASSE ? geralInicial : null));
}
