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
import { reducaoEstudoPct } from './efeitos-atributo';
import type { EstadoJogo } from '../core/estado';
import { ticksDe } from '../core/tempo';
import { estudoAvanca } from '../modos/regras';

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
  // Marco 18 (D-068): um estudo por vez (e a própria habilidade em estudo não se aprende de novo).
  if (!conhecida && bolsa.estudo) return 'estudando';
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
  const conhecida = bolsa.conhecidas.find((c) => c.id === id);
  if (!conhecida) {
    // Marco 18 (D-068): aprender não é instantâneo — gasta o ponto e começa o estudo (um por vez).
    if (bolsa.estudo) {
      saida.push({ t: 'habilidadeRecusada', tick, id: e.id, habilidadeId: id, motivo: 'estudando' });
      return false;
    }
    bolsa.pontosHabilidade--;
    iniciarEstudo(e, ctx, id, tick, saida);
    return true;
  }
  bolsa.pontosHabilidade--;
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

/**
 * Livro (marco 14): ensina no rank 1, sem ponto e sem a restrição de classe. Marco 18 (D-068): o livro também começa
 * um estudo (e é recusado sem gastar se já houver outro, ou se a habilidade já é conhecida ou está em estudo).
 */
export function aprenderPorLivro(e: Entidade, ctx: ContextoSimulacao, id: string, tick: number, saida: EventoSimulacao[]): 'ok' | 'ja_conhece' | 'estudando' {
  const bolsa = e.bolsa;
  if (!bolsa || !definicaoDe(ctx, id) || bolsa.conhecidas.some((c) => c.id === id) || bolsa.estudo?.id === id) return 'ja_conhece';
  if (bolsa.estudo) return 'estudando';
  iniciarEstudo(e, ctx, id, tick, saida);
  return 'ok';
}

/** Marco 18 (D-068): o tempo de estudo de uma habilidade para quem estuda, em ticks (grau e Inteligência). */
export function ticksDeEstudo(ctx: ContextoSimulacao, e: Entidade, id: string): number {
  const grau = definicaoDe(ctx, id)?.base.grau ?? 'B';
  const regras = ctx.balance.habilidades.estudo;
  return Math.max(1, ticksDe(regras[grau] * (1 - reducaoEstudoPct(e.atributos, ctx.balance) / 100)));
}

function iniciarEstudo(e: Entidade, ctx: ContextoSimulacao, id: string, tick: number, saida: EventoSimulacao[]): void {
  const bolsa = e.bolsa;
  if (!bolsa) return;
  const totalTicks = ticksDeEstudo(ctx, e, id);
  bolsa.estudo = { id, totalTicks, restanteTicks: totalTicks, aceleracoes: 0 };
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

/**
 * Comando `acelerarEstudo` (D-068): gasta 1 ponto de habilidade e tira 1/3 do tempo **total** do que falta; até
 * `estudo.aceleracoes` vezes (3 = instantâneo). Chegando a zero, conclui na hora.
 */
export function acelerarEstudo(e: Entidade, ctx: ContextoSimulacao, tick: number, saida: EventoSimulacao[]): boolean {
  const bolsa = e.bolsa;
  const estudo = bolsa?.estudo;
  const recusar = (motivo: MotivoHabilidade) => {
    saida.push({ t: 'habilidadeRecusada', tick, id: e.id, habilidadeId: estudo?.id ?? '', motivo });
    return false;
  };
  if (!bolsa) return recusar('sem_ficha');
  if (!estudo) return recusar('sem_estudo');
  if (estudo.aceleracoes >= ctx.balance.habilidades.estudo.aceleracoes) return recusar('aceleracoes_esgotadas');
  if (bolsa.pontosHabilidade <= 0) return recusar('sem_pontos');
  bolsa.pontosHabilidade--;
  estudo.aceleracoes++;
  estudo.restanteTicks = Math.max(0, estudo.restanteTicks - Math.ceil(estudo.totalTicks / ctx.balance.habilidades.estudo.aceleracoes));
  saida.push({ t: 'estudoAcelerado', tick, id: e.id, habilidadeId: estudo.id, restanteTicks: estudo.restanteTicks });
  if (estudo.restanteTicks <= 0) concluirEstudo(e, ctx, tick, saida);
  return true;
}

/** Etapa do tick (D-068): o estudo anda um tick por tick de jogo, nos modos em que vale. */
export function avancarEstudos(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  if (!estudoAvanca(ctx.modo)) return;
  for (const e of estado.entidades) {
    const estudo = e.bolsa?.estudo;
    if (!estudo) continue;
    estudo.restanteTicks--;
    if (estudo.restanteTicks <= 0) concluirEstudo(e, ctx, estado.tick, saida);
  }
}
