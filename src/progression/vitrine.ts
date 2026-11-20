// A vitrine de armadura das lojas (marco 47, 20/11/2026, D-190). Puro.
//
// O ferreiro (e a loja sem ofício da campanha) mostra, além da lista fixa, peças de armadura geradas pelo sorteio
// compartilhado com o loot (progression/sorteio-pecas.ts). A vitrine nasce da semente da loja e da RODADA: no Mundo, a
// sala posta no objeto o dia do ciclo (a vila) ou a semana (a dungeon), com o nível do lugar; fora dele, a rodada conta
// em ticks, um ciclo do dia do Mundo por rodada, e o nível é o dos inimigos da fase. Não usa o RNG do combate: cliente
// e servidor chegam à mesma vitrine. Pelo menos uma peça de cada propósito, quando cabe. Regras em
// data/equipamento-sorteio.json.

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo, ObjetoNoMundo } from '../core/estado';
import { criarRng, hashTexto } from '../core/rng';
import { ticksDe } from '../core/tempo';
import { duracaoDoCiclo } from '../mundo/ciclo';
import { nivelDaFase, sortearPeca, type PerfilDeSorteio, type RegrasDoSorteio } from './sorteio-pecas';

/** O que basta para sortear: a semente da loja, a rodada, o nível e o perfil. */
export interface AlvoDaVitrine {
  semente: string;
  rodada: number;
  nivel: number;
  perfil: PerfilDeSorteio;
}

/** Quantos sorteios a vitrine tenta por vaga (a garantia de propósitos recusa alguns). */
const TENTATIVAS_POR_VAGA = 8;

/** A loja tem vitrine pelo ofício? (a sala do Mundo marca as dela; esta é a regra das que ela não marca) */
export const oficioComVitrine = (r: RegrasDoSorteio, loja: Pick<ObjetoNoMundo, 'ref'>): boolean => (loja.ref === null ? r.lojas.semOficio : r.lojas.oficios.includes(loja.ref));

/** O período da rodada fora do Mundo, em ticks: um ciclo do dia do Mundo. */
export const periodoDaRodada = (ctx: ContextoSimulacao): number => Math.max(1, ticksDe(duracaoDoCiclo(ctx.balance.mundo.ciclo)));

const deslocamentoDaLoja = (estado: EstadoJogo, loja: ObjetoNoMundo, periodo: number): number => hashTexto(`${estado.faseId}/${loja.objetoId}/vitrine`) % periodo;

/** Quantos ticks faltam para a vitrine renovar (null: a rodada vem da sala do Mundo, pelo relógio). */
export function ticksAteRenovar(estado: EstadoJogo, ctx: ContextoSimulacao, loja: ObjetoNoMundo): number | null {
  if (loja.vitrine !== undefined || ctx.fase.exterior) return null;
  const periodo = periodoDaRodada(ctx);
  return periodo - ((estado.tick + deslocamentoDaLoja(estado, loja, periodo)) % periodo);
}

/** O alvo da vitrine desta loja agora (null: a loja não tem vitrine, ou a sala ainda não postou a rodada). */
export function alvoDaVitrine(estado: EstadoJogo, ctx: ContextoSimulacao, loja: ObjetoNoMundo): AlvoDaVitrine | null {
  const r = ctx.conteudo.sorteio;
  const semente = `${estado.faseId}/${loja.objetoId}`;
  if (loja.vitrine !== undefined) {
    const perfil = r.perfis.get(loja.vitrine);
    return perfil && loja.rodadaVitrine !== undefined ? { semente, rodada: loja.rodadaVitrine, nivel: loja.nivelVitrine ?? 1, perfil } : null;
  }
  // O exterior do Mundo espera a sala (ela marca as lojas da vila a cada segundo).
  if (ctx.fase.exterior || !oficioComVitrine(r, loja)) return null;
  const perfil = r.perfis.get(r.lojas.perfilVila);
  if (!perfil) return null;
  const periodo = periodoDaRodada(ctx);
  return { semente, rodada: Math.floor((estado.tick + deslocamentoDaLoja(estado, loja, periodo)) / periodo), nivel: nivelDaFase(ctx), perfil };
}

/**
 * As peças da vitrine (ids `gi_`), determinísticas pelo alvo. A garantia recusa um propósito repetido quando as vagas
 * que sobram só bastam para os que faltam.
 */
export function sortearVitrine(ctx: ContextoSimulacao, alvo: AlvoDaVitrine): string[] {
  const rng = criarRng(hashTexto(`vitrine:${alvo.semente}:${alvo.rodada}`));
  const faltam = new Set(ctx.conteudo.pecas.propositos.keys());
  const { perfil } = alvo;
  const saida: string[] = [];
  for (let i = 0; i < perfil.quantidade * TENTATIVAS_POR_VAGA && saida.length < perfil.quantidade; i++) {
    const id = sortearPeca(ctx, rng, { nivel: alvo.nivel, perfil });
    if (!id) return saida;
    const proposito = ctx.conteudo.itens.get(id)?.peca?.proposito;
    if (!proposito || saida.includes(id)) continue;
    if (!faltam.has(proposito) && perfil.quantidade - saida.length <= faltam.size) continue;
    faltam.delete(proposito);
    saida.push(id);
  }
  return saida;
}

/** A vitrine desta loja agora (vazia quando ela não tem). */
export function vitrineDaLoja(estado: EstadoJogo, ctx: ContextoSimulacao, loja: ObjetoNoMundo): string[] {
  const alvo = alvoDaVitrine(estado, ctx, loja);
  return alvo ? sortearVitrine(ctx, alvo) : [];
}
