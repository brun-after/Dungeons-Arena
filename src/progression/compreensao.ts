// Marco 50 (21/11/2026, D-196): a compreensão de uma skill, o uso que ela pede antes de entrar numa fórmula. Cada
// lançamento que acerta um inimigo de nível igual ou maior que o do personagem menos a faixa (10) soma 2% numa skill
// comum e 1% numa fusão (cerca de 50 e 100 acertos). Só o primeiro alvo de cada golpe conta, e só a skill conhecida
// que pode entrar numa fórmula. Em ticks de combate, sem relógio de parede.

import type { Habilidade } from '../combat/habilidades';
import { ehFusao } from '../combat/fusao/receita';
import type { ContextoSimulacao } from '../core/contexto';
import type { Entidade } from '../entities/entidade';
import { podeFerir } from '../modos/relacao';
import { fundivel } from './alquimia';

export function compreender(ctx: ContextoSimulacao, atacante: Entidade | undefined, alvo: Entidade, hab: Habilidade, indice: number): void {
  const bolsa = atacante?.bolsa;
  if (!atacante || !bolsa || indice !== 0 || atacante === alvo) return;
  const r = ctx.balance.alquimia.compreensao;
  if (alvo.nivel < atacante.nivel - r.faixaNivel || !podeFerir(atacante, alvo, ctx.modo)) return;
  const atual = bolsa.compreensao?.[hab.id] ?? 0;
  if (atual >= 100 || !bolsa.conhecidas.some((c) => c.id === hab.id) || !fundivel(ctx, hab.id)) return;
  (bolsa.compreensao ??= {})[hab.id] = Math.min(100, atual + (ehFusao(hab.id) ? r.fusaoPct : r.comumPct));
}

/** A essência da família acelera a compreensão (uma vez por skill): devolve o novo valor, ou null quando não serve. */
export function acelerarCompreensao(ctx: Pick<ContextoSimulacao, 'balance'>, e: Entidade, id: string): number | null {
  const bolsa = e.bolsa;
  if (!bolsa || !bolsa.conhecidas.some((c) => c.id === id) || bolsa.compreensaoAcelerada?.includes(id)) return null;
  const atual = bolsa.compreensao?.[id] ?? 0;
  if (atual >= 100) return null;
  const novo = Math.min(100, atual + ctx.balance.alquimia.compreensao.essenciaPct);
  (bolsa.compreensao ??= {})[id] = novo;
  (bolsa.compreensaoAcelerada ??= []).push(id);
  return novo;
}
