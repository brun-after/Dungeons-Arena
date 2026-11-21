// Marco 48 (20/11/2026, D-193): o estado elemental guarda uma fração do golpe que o aplicou, e cada tique dele passa
// pela resistência do alvo. Separado de combat/elementos-ferem.ts para o dispatcher (efeitos.ts) consultar sem ciclo.
// Puro.

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { buscarEntidade } from '../core/estado';
import type { Entidade } from '../entities/entidade';
import { resistenciaPct, type Elemento } from './elementos';
import type { EfeitoCanonico, TipoEfeito } from './registro-efeitos';

type Ctx = Pick<ContextoSimulacao, 'balance'>;

/** O elemento de um estado (o queimando é do fogo…); o sangrando e o dano periódico genérico não têm. */
export function elementoDoEstado(ctx: Pick<ContextoSimulacao, 'conteudo'>, tipo: TipoEfeito): Elemento | null {
  for (const [id, def] of ctx.conteudo.elementos) if (def.estado.tipo === tipo) return id;
  return null;
}

/** O estado com o valor tirado do golpe (nunca abaixo do que já trazia). Sem golpe, fica como veio. */
export function escalarEstado(ctx: Ctx, ef: EfeitoCanonico, golpe: number): EfeitoCanonico {
  const pct = ctx.balance.elementosFerem.estadoPctDoGolpe[ef.tipo];
  if (!pct || golpe <= 0) return ef;
  return { ...ef, valor: Math.max(ef.valor, Math.round((golpe * pct) / 100)) };
}

/** O que uma reação aplica, já com o golpe: o dano direto vale % do golpe por ponto (piso: o valor que trazia). */
export function prepararDaReacao(ctx: Ctx, ef: EfeitoCanonico, golpe: number): EfeitoCanonico {
  if (ef.tipo === 'dano_direto' && golpe > 0) {
    return { ...ef, valor: Math.max(ef.valor, Math.round((golpe * ef.valor * ctx.balance.elementosFerem.reacaoDanoDiretoPorPontoPct) / 100)) };
  }
  return escalarEstado(ctx, ef, golpe);
}

/** É de um jogador: controlado por alguém, ou invocação (fera, morto, servo) de quem é. */
function deJogador(estado: EstadoJogo, e: Entidade): boolean {
  if (e.controlador !== 'ia') return true;
  const dono = e.invocacao ? buscarEntidade(estado, e.invocacao.donoId) : undefined;
  return !!dono && dono.controlador !== 'ia';
}

/** O golpe é entre dois jogadores (o duelo da arena, o PvP das regiões perigosas)? */
export function entreJogadores(estado: EstadoJogo, atacante: Entidade | null | undefined, alvo: Entidade): boolean {
  return !!atacante && deJogador(estado, atacante) && deJogador(estado, alvo);
}

/** Quanto de um tique o alvo sente: a resistência dele ao elemento do estado (fraqueza aumenta, imunidade zera). */
export function fatorDoTique(ctx: ContextoSimulacao, alvo: Entidade, tipo: TipoEfeito, tick: number): number {
  const r = resistenciaPct(ctx, alvo, elementoDoEstado(ctx, tipo), tick);
  return r >= 100 ? 0 : Math.max(0, 1 - r / 100);
}
