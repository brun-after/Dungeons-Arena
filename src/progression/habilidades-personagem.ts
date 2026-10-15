// Habilidades do personagem (D-057, D-059). Marco 14 (14/10/2026). Tudo chega por comando (§3.3):
// - `subirRank`: gasta 1 ponto de habilidade (1 por nível). Do rank 0 para o 1, aprende — só o que a classe pode
//   aprender. O nível libera cada rank (balance.habilidades.ranks). Nos ranks de evolução (3 e 5), escolhe 1
//   entre 2 ou 3 caminhos, e a escolha é definitiva.
// - `equiparHabilidade`: põe uma habilidade conhecida (não passiva) numa das 4 teclas, ou limpa a tecla.
// - livros ensinam no rank 1, sem gastar ponto.
// `Entidade.habilidades` é sempre derivada da barra (`habilidadesDaBarra`), como a ficha deriva da bolsa.

import { definicaoDe } from '../combat/compilar-habilidade';
import type { ContextoSimulacao } from '../core/contexto';
import type { EventoSimulacao, MotivoHabilidade } from '../core/eventos-simulacao';
import { SLOTS_BARRA, type Bolsa, type Entidade } from '../entities/entidade';
import { recalcularFicha } from './derivados';

/** As habilidades ativas na barra, na ordem das teclas (só as conhecidas). */
export function habilidadesDaBarra(bolsa: Bolsa): string[] {
  return bolsa.barra.filter((id): id is string => id !== null && bolsa.conhecidas.some((c) => c.id === id));
}

/** O que a classe deixa aprender com pontos: as iniciais e as `aprendiveis`. */
export function aprendiveisDa(ctx: ContextoSimulacao, bolsa: Bolsa): string[] {
  const classe = ctx.conteudo.classes.get(bolsa.classeId);
  return classe ? [...new Set([...classe.habilidades, ...classe.aprendiveis])] : [];
}

/** Nível mínimo para ter a habilidade no rank (o maior entre o do rank e o da definição). */
export function nivelParaRank(ctx: ContextoSimulacao, id: string, rank: number): number {
  const doRank = ctx.balance.habilidades.ranks[rank - 1]?.nivelMinimo ?? Infinity;
  return Math.max(doRank, definicaoDe(ctx, id)?.base.nivelMinimo ?? 1);
}

/** Os caminhos oferecidos ao chegar no rank (vazio quando o rank não é de evolução). */
export function caminhosDoRank(ctx: ContextoSimulacao, id: string, rank: number): readonly string[] {
  if (!ctx.balance.habilidades.ranksEvolucao.includes(rank)) return [];
  return definicaoDe(ctx, id)?.evolucoes[rank] ?? [];
}

/** Por que não dá para subir (ou aprender) agora; null = pode. `caminho` só é conferido quando dado. */
export function motivoParaNaoSubir(ctx: ContextoSimulacao, e: Entidade, id: string, caminho?: string): MotivoHabilidade | null {
  const bolsa = e.bolsa;
  if (!bolsa) return 'sem_ficha';
  const def = definicaoDe(ctx, id);
  if (!def) return 'desconhecida';
  const conhecida = bolsa.conhecidas.find((c) => c.id === id);
  if (!conhecida && !aprendiveisDa(ctx, bolsa).includes(id)) return 'nao_aprendivel';
  const novo = (conhecida?.rank ?? 0) + 1;
  if (novo > ctx.balance.habilidades.rankMax) return 'rank_maximo';
  if (bolsa.pontosHabilidade <= 0) return 'sem_pontos';
  if (e.nivel < nivelParaRank(ctx, id, novo)) return 'nivel_baixo';
  const opcoes = caminhosDoRank(ctx, id, novo);
  if (caminho !== undefined && opcoes.length > 0 && !opcoes.includes(caminho)) return 'caminho_invalido';
  if (caminho === undefined && opcoes.length > 0) return 'caminho_invalido';
  return null;
}

/** Põe a habilidade na primeira tecla vazia (ativas apenas). */
function ocuparTeclaLivre(ctx: ContextoSimulacao, bolsa: Bolsa, id: string): void {
  if (definicaoDe(ctx, id)?.base.passiva || bolsa.barra.includes(id)) return;
  const livre = bolsa.barra.indexOf(null);
  if (livre >= 0) bolsa.barra[livre] = id;
}

function atualizar(e: Entidade, ctx: ContextoSimulacao): void {
  recalcularFicha(e, ctx);
}

export function subirRank(e: Entidade, ctx: ContextoSimulacao, id: string, caminho: string | undefined, tick: number, saida: EventoSimulacao[]): boolean {
  const motivo = motivoParaNaoSubir(ctx, e, id, caminho);
  const bolsa = e.bolsa;
  if (motivo || !bolsa) {
    saida.push({ t: 'habilidadeRecusada', tick, id: e.id, habilidadeId: id, motivo: motivo ?? 'sem_ficha' });
    return false;
  }
  bolsa.pontosHabilidade--;
  let conhecida = bolsa.conhecidas.find((c) => c.id === id);
  if (!conhecida) {
    conhecida = { id, rank: 0, caminhos: [] };
    bolsa.conhecidas.push(conhecida);
  }
  conhecida.rank++;
  const escolhido = caminhosDoRank(ctx, id, conhecida.rank).length > 0 && caminho !== undefined ? caminho : null;
  if (escolhido) conhecida.caminhos.push(escolhido);
  if (conhecida.rank === 1) ocuparTeclaLivre(ctx, bolsa, id);
  atualizar(e, ctx);
  saida.push({ t: 'habilidadeMudou', tick, id: e.id, habilidadeId: id, rank: conhecida.rank, caminho: escolhido });
  return true;
}

export function equiparHabilidade(e: Entidade, ctx: ContextoSimulacao, id: string | null, slot: number, tick: number, saida: EventoSimulacao[]): boolean {
  const bolsa = e.bolsa;
  const recusar = (motivo: MotivoHabilidade) => {
    saida.push({ t: 'habilidadeRecusada', tick, id: e.id, habilidadeId: id ?? '', motivo });
    return false;
  };
  if (!bolsa) return recusar('sem_ficha');
  if (!Number.isInteger(slot) || slot < 0 || slot >= SLOTS_BARRA) return recusar('tecla_invalida');
  if (id !== null) {
    if (!bolsa.conhecidas.some((c) => c.id === id)) return recusar('desconhecida');
    if (definicaoDe(ctx, id)?.base.passiva) return recusar('passiva');
    // A mesma habilidade em outra tecla troca de lugar com a desta.
    const outra = bolsa.barra.indexOf(id);
    if (outra >= 0) bolsa.barra[outra] = bolsa.barra[slot] ?? null;
  }
  bolsa.barra[slot] = id;
  atualizar(e, ctx);
  saida.push({ t: 'barraMudou', tick, id: e.id });
  return true;
}

/** Livro (marco 14): ensina no rank 1, sem ponto e sem a restrição de classe. Devolve se aprendeu. */
export function aprenderPorLivro(e: Entidade, ctx: ContextoSimulacao, id: string, tick: number, saida: EventoSimulacao[]): boolean {
  const bolsa = e.bolsa;
  if (!bolsa || !definicaoDe(ctx, id) || bolsa.conhecidas.some((c) => c.id === id)) return false;
  bolsa.conhecidas.push({ id, rank: 1, caminhos: [] });
  ocuparTeclaLivre(ctx, bolsa, id);
  atualizar(e, ctx);
  saida.push({ t: 'habilidadeMudou', tick, id: e.id, habilidadeId: id, rank: 1, caminho: null });
  return true;
}
