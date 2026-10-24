// Habilidades do personagem (D-057, D-059). Marco 14 (14/10/2026). Tudo chega por comando (§3.3).
// Marco 24 (24/10/2026, D-094): as skills de classe não gastam ponto (sobem com o nível; o livro de classe ensina na
// hora) e as gerais pedem o livro (que libera) e um ponto; as teclas 1–2 são de classe e as 3–6, gerais
// (habilidades-classe.ts). O que segue vale para as gerais:
// - `subirRank`: gasta 1 ponto de habilidade (1 por nível). Do rank 0 para o 1, aprende — só o que a classe pode
//   aprender. O nível libera cada rank (balance.habilidades.ranks). Nos ranks de evolução (3 e 5), escolhe 1
//   entre 2 ou 3 caminhos, e a escolha é definitiva.
// - `equiparHabilidade`: põe uma habilidade conhecida (não passiva) numa das 4 teclas, ou limpa a tecla.
// - livros ensinam no rank 1, sem gastar ponto.
// `Entidade.habilidades` é sempre derivada da barra (`habilidadesDaBarra`), como a ficha deriva da bolsa.

import { familiaDaHabilidade } from './itens-progressao';
import { definicaoDe } from '../combat/compilar-habilidade';
import type { ContextoSimulacao } from '../core/contexto';
import type { EventoSimulacao, MotivoHabilidade } from '../core/eventos-simulacao';
import { type Bolsa, type Entidade } from '../entities/entidade';
import { ehDaClasse, ehDeAlgumaClasse, ocuparTeclaLivre, rankDeClassePeloNivel, teclaRecusa } from './habilidades-classe';
import { recalcularFicha } from './derivados';
import { reducaoEstudoPct } from './efeitos-atributo';
import { passivosDe } from './ganchos-do-portador';
import type { EstadoJogo } from '../core/estado';
import { ticksDe } from '../core/tempo';
import { estudoAvanca } from '../modos/regras';

/** As habilidades ativas na barra, na ordem das teclas (só as conhecidas). */
export function habilidadesDaBarra(bolsa: Bolsa): string[] {
  return bolsa.barra.filter((id): id is string => id !== null && bolsa.conhecidas.some((c) => c.id === id));
}

/** Marco 24 (D-094): o que se aprende com ponto — as gerais que um livro liberou. */
export function aprendiveisDa(_ctx: ContextoSimulacao, bolsa: Bolsa): string[] {
  return [...(bolsa.liberadas ?? [])];
}

/** Marco 18: a runa de fusão (item de missão) que destrava uma fusão. */
export const ID_RUNA_DE_FUSAO = 'runa_de_fusao';

/** Por que a fusão ainda não pode ser aprendida (null = pode). */
export function motivoDaFusao(ctx: ContextoSimulacao, bolsa: Bolsa, partes: readonly string[]): MotivoHabilidade | null {
  const jaTemFusao = bolsa.conhecidas.some((c) => definicaoDe(ctx, c.id)?.fusao) || (bolsa.estudo ? !!definicaoDe(ctx, bolsa.estudo.id)?.fusao : false);
  if (jaTemFusao) return 'fusao_unica';
  const max = ctx.balance.habilidades.rankMax;
  if (!partes.every((p) => bolsa.conhecidas.some((c) => c.id === p && c.rank >= max))) return 'fusao_niveis';
  if (!bolsa.mochila.some((i) => i.itemId === ID_RUNA_DE_FUSAO)) return 'fusao_runa';
  return null;
}

/** As fusões que o personagem pode ver (as duas partes conhecidas). */
export function fusoesVisiveis(ctx: ContextoSimulacao, bolsa: Bolsa): string[] {
  return [...ctx.conteudo.definicoes.values()]
    .filter((d) => d.fusao && d.fusao.every((p) => bolsa.conhecidas.some((c) => c.id === p)))
    .map((d) => d.base.id);
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
export function motivoParaNaoSubir(ctx: ContextoSimulacao, e: Entidade, id: string, caminho?: string, invId?: string): MotivoHabilidade | null {
  const bolsa = e.bolsa;
  if (!bolsa) return 'sem_ficha';
  const def = definicaoDe(ctx, id);
  if (!def) return 'desconhecida';
  const conhecida = bolsa.conhecidas.find((c) => c.id === id);
  // Marco 24 (D-094): a skill de classe vem do livro e sobe com o nível; com ponto, nunca. O comando só serve para
  // escolher o caminho no rank de evolução, quando o nível já chegou lá.
  if (ehDaClasse(ctx, bolsa, id)) {
    if (!conhecida) return 'de_classe';
    const novoRank = conhecida.rank + 1;
    if (novoRank > ctx.balance.habilidades.rankMax) return 'rank_maximo';
    const opcoesClasse = caminhosDoRank(ctx, id, novoRank);
    if (opcoesClasse.length === 0) return 'de_classe';
    if (e.nivel < nivelParaRank(ctx, id, novoRank)) return 'nivel_baixo';
    return caminho !== undefined && opcoesClasse.includes(caminho) ? null : 'caminho_invalido';
  }
  if (!conhecida && ehDeAlgumaClasse(ctx, id)) return 'nao_aprendivel';
  // Marco 18 (D-068, camada 7): a fusão pede a runa, as duas habilidades no nível máximo e nenhuma outra fusão.
  if (!conhecida && def.fusao) {
    const motivoFusao = motivoDaFusao(ctx, bolsa, def.fusao);
    if (motivoFusao) return motivoFusao;
  } else if (!conhecida && !aprendiveisDa(ctx, bolsa).includes(id)) return 'nao_liberada';
  // Marco 18 (D-068): um estudo por vez (e a própria habilidade em estudo não se aprende de novo).
  if (!conhecida && bolsa.estudo) return 'estudando';
  const novo = (conhecida?.rank ?? 0) + 1;
  if (novo > ctx.balance.habilidades.rankMax) return 'rank_maximo';
  if (invId !== undefined) {
    const entrada = bolsa.mochila.find((i) => i.invId === invId && i.qtd > 0);
    const item = entrada ? ctx.conteudo.itens.get(entrada.itemId) : undefined;
    if (!conhecida || item?.progressao?.tipo !== 'rank' || item.progressao.familia !== familiaDaHabilidade(ctx, id)) return 'essencia_incompativel';
  } else if (bolsa.pontosHabilidade <= 0) return 'sem_pontos';
  if (e.nivel < nivelParaRank(ctx, id, novo)) return 'nivel_baixo';
  const opcoes = caminhosDoRank(ctx, id, novo);
  if (caminho !== undefined && opcoes.length > 0 && !opcoes.includes(caminho)) return 'caminho_invalido';
  if (caminho === undefined && opcoes.length > 0) return 'caminho_invalido';
  return null;
}

function atualizar(e: Entidade, ctx: ContextoSimulacao): void {
  recalcularFicha(e, ctx);
}

export function subirRank(e: Entidade, ctx: ContextoSimulacao, id: string, caminho: string | undefined, tick: number, saida: EventoSimulacao[], invId?: string, rankEsperado?: number): boolean {
  const motivo = rankEsperado !== undefined && rankEsperado !== (e.bolsa?.conhecidas.find((c) => c.id === id)?.rank ?? 0) + 1 ? 'rank_desatualizado' : motivoParaNaoSubir(ctx, e, id, caminho, invId);
  const bolsa = e.bolsa;
  if (motivo || !bolsa) {
    saida.push({ t: 'habilidadeRecusada', tick, id: e.id, habilidadeId: id, motivo: motivo ?? 'sem_ficha' });
    return false;
  }
  const conhecida = bolsa.conhecidas.find((c) => c.id === id);
  if (!conhecida) {
    // Marco 18 (D-068): aprender não é instantâneo — gasta o ponto e começa o estudo (um por vez).
    if (bolsa.estudo) {
      saida.push({ t: 'habilidadeRecusada', tick, id: e.id, habilidadeId: id, motivo: 'estudando' });
      return false;
    }
    bolsa.pontosHabilidade--;
    // A fusão gasta a runa ao começar o estudo.
    if (definicaoDe(ctx, id)?.fusao) {
      const i = bolsa.mochila.findIndex((x) => x.itemId === ID_RUNA_DE_FUSAO);
      const runa = bolsa.mochila[i];
      if (runa) {
        runa.qtd--;
        if (runa.qtd <= 0) bolsa.mochila.splice(i, 1);
      }
    }
    iniciarEstudo(e, ctx, id, tick, saida);
    return true;
  }
  const deClasse = ehDaClasse(ctx, bolsa, id);
  if (deClasse) {
    // Marco 24: o caminho da skill de classe é escolhido sem ponto; depois o nível leva o rank adiante.
  } else if (invId !== undefined) {
    const entrada = bolsa.mochila.find((i) => i.invId === invId);
    if (!entrada) return false;
    entrada.qtd--;
    bolsa.mochila = bolsa.mochila.filter((i) => i.qtd > 0);
    bolsa.ranksPorItens = (bolsa.ranksPorItens ?? 0) + 1;
    saida.push({ t: 'usouItem', tick, id: e.id, itemId: entrada.itemId, hp: 0, mana: 0 });
  } else bolsa.pontosHabilidade--;
  conhecida.rank++;
  const escolhido = caminhosDoRank(ctx, id, conhecida.rank).length > 0 && caminho !== undefined ? caminho : null;
  if (escolhido) conhecida.caminhos.push(escolhido);
  if (deClasse) conhecida.rank = Math.max(conhecida.rank, rankDeClassePeloNivel(ctx, id, e.nivel, conhecida.caminhos));
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
  if (!Number.isInteger(slot) || slot < 0 || slot >= bolsa.barra.length) return recusar('tecla_invalida');
  if (id !== null) {
    if (!bolsa.conhecidas.some((c) => c.id === id)) return recusar('desconhecida');
    const recusa = teclaRecusa(ctx, bolsa, slot, id);
    if (recusa) return recusar(recusa);
    // A mesma habilidade em outra tecla troca de lugar com a desta.
    const outra = bolsa.barra.indexOf(id);
    if (outra >= 0) bolsa.barra[outra] = bolsa.barra[slot] ?? null;
  }
  bolsa.barra[slot] = id;
  atualizar(e, ctx);
  saida.push({ t: 'barraMudou', tick, id: e.id });
  return true;
}

/**
 * Livro. Marco 24 (D-094): o de skill de classe ensina na hora, no rank do nível, e só serve para a dona; o de geral
 * libera a skill, que se aprende com um ponto (e o estudo de sempre). Recusado sem gastar quando não serve.
 */
export function aprenderPorLivro(e: Entidade, ctx: ContextoSimulacao, id: string, tick: number, saida: EventoSimulacao[]): 'ok' | 'ja_conhece' | 'outra_classe' {
  const bolsa = e.bolsa;
  if (!bolsa || !definicaoDe(ctx, id) || bolsa.conhecidas.some((c) => c.id === id) || bolsa.estudo?.id === id) return 'ja_conhece';
  if (ehDeAlgumaClasse(ctx, id)) {
    if (!ehDaClasse(ctx, bolsa, id)) return 'outra_classe';
    const rank = Math.max(1, rankDeClassePeloNivel(ctx, id, e.nivel, []));
    bolsa.conhecidas.push({ id, rank, caminhos: [] });
    ocuparTeclaLivre(ctx, bolsa, id);
    atualizar(e, ctx);
    saida.push({ t: 'habilidadeMudou', tick, id: e.id, habilidadeId: id, rank, caminho: null });
    return 'ok';
  }
  if (bolsa.liberadas?.includes(id)) return 'ja_conhece';
  (bolsa.liberadas ??= []).push(id);
  saida.push({ t: 'habilidadeLiberada', tick, id: e.id, habilidadeId: id });
  return 'ok';
}

/** Marco 18 (D-068): o tempo de estudo de uma habilidade para quem estuda, em ticks (grau e Inteligência). */
export function ticksDeEstudo(ctx: ContextoSimulacao, e: Entidade, id: string): number {
  const grau = definicaoDe(ctx, id)?.base.grau ?? 'B';
  const regras = ctx.balance.habilidades.estudo;
  // Marco 18: a Inteligência e o Tomo Último encurtam (o total nunca passa de 80% de desconto).
  const desconto = Math.min(80, reducaoEstudoPct(e.atributos, ctx.balance) + passivosDe(ctx, e).estudoPct);
  return Math.max(1, ticksDe(regras[grau] * (1 - desconto / 100)));
}

function iniciarEstudo(e: Entidade, ctx: ContextoSimulacao, id: string, tick: number, saida: EventoSimulacao[]): void {
  const bolsa = e.bolsa;
  if (!bolsa) return;
  const totalTicks = ticksDeEstudo(ctx, e, id);
  bolsa.estudo = { id, totalTicks, restanteTicks: totalTicks, aceleracoes: 0, velocidade12: 12, fracao12: 0 };
  saida.push({ t: 'estudoIniciado', tick, id: e.id, habilidadeId: id, totalTicks });
}

/** Fim do estudo: a habilidade entra no rank 1 (e numa tecla livre, se for ativa). */
function concluirEstudo(e: Entidade, ctx: ContextoSimulacao, tick: number, saida: EventoSimulacao[]): void {
  const bolsa = e.bolsa;
  const estudo = bolsa?.estudo;
  if (!bolsa || !estudo) return;
  bolsa.estudo = null;
  if (!bolsa.conhecidas.some((c) => c.id === estudo.id)) {
    bolsa.conhecidas.push({ id: estudo.id, rank: 1, caminhos: [] });
    ocuparTeclaLivre(ctx, bolsa, estudo.id);
    atualizar(e, ctx);
    saida.push({ t: 'habilidadeMudou', tick, id: e.id, habilidadeId: estudo.id, rank: 1, caminho: null });
  }
  saida.push({ t: 'estudoConcluido', tick, id: e.id, habilidadeId: estudo.id });
}

/** D-075 (17/10/2026): clientes antigos não podem mais gastar pontos para acelerar. */
export function acelerarEstudo(e: Entidade, _ctx: ContextoSimulacao, tick: number, saida: EventoSimulacao[]): boolean {
  saida.push({ t: 'habilidadeRecusada', tick, id: e.id, habilidadeId: e.bolsa?.estudo?.id ?? '', motivo: 'usar_acelerador' });
  return false;
}

export const velocidadeDoEstudo = (estudo: NonNullable<Entidade['bolsa']>['estudo']): number => (estudo?.velocidade12 ?? 12) / 12;
export const ticksRestantesDoEstudo = (estudo: NonNullable<Entidade['bolsa']>['estudo']): number => estudo ? Math.ceil((estudo.restanteTicks * 12 - (estudo.fracao12 ?? 0)) / (estudo.velocidade12 ?? 12)) : 0;

/** Etapa do tick (D-068): o estudo anda um tick por tick de jogo, nos modos em que vale. */
export function avancarEstudos(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  if (!estudoAvanca(ctx.modo)) return;
  for (const e of estado.entidades) {
    const estudo = e.bolsa?.estudo;
    if (!estudo) continue;
    const progresso = (estudo.fracao12 ?? 0) + (estudo.velocidade12 ?? 12);
    estudo.restanteTicks -= Math.floor(progresso / 12);
    estudo.fracao12 = progresso % 12;
    if (estudo.restanteTicks <= 0) concluirEstudo(e, ctx, estado.tick, saida);
  }
}
