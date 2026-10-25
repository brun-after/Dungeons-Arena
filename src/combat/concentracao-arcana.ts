// 18/10/2026: o Dardo progride por nível e por acertos efetivos no mesmo alvo, sem bônus para efeitos derivados.
import type { ContextoSimulacao } from '../core/contexto';
import { ticksDe } from '../core/tempo';
import { vivo, type Entidade } from '../entities/entidade';
import type { Habilidade } from './habilidades';
import { podeFerir } from '../modos/relacao';
import { concentracaoExtra } from './encarnacao-efeitos';

function elegivel(ator: Entidade, alvo: Entidade, hab: Habilidade, ctx: ContextoSimulacao): boolean {
  return (ator.bolsa?.classeId ?? ator.classeId) === 'mago' && !ator.invocacao && hab.id === 'dardo_arcano'
    && ator !== alvo && vivo(ator) && podeFerir(ator, alvo, ctx.modo);
}

export function multiplicadorDardo(ctx: ContextoSimulacao, ator: Entidade, alvo: Entidade, hab: Habilidade, tick: number): number {
  if (!elegivel(ator, alvo, hab, ctx)) return 1;
  const r = ctx.balance.ajustesClasses.mago;
  const nivel = Math.max(0, Math.min(1, (ator.nivel - r.dardoRecuperacaoNivel) / (r.dardoPlenoNivel - r.dardoRecuperacaoNivel)));
  const inicial = r.dardoInicioMult + (1 - r.dardoInicioMult) * nivel;
  const foco = ator.concentracaoArcana;
  const acertos = foco && foco.alvoId === alvo.id && foco.geracao === alvo.geracao && foco.abates === alvo.abates
    && tick >= foco.ultimoTick && tick - foco.ultimoTick <= ticksDe(r.concentracaoJanelaMs) ? foco.acertos : 0;
  const progresso = Math.min(1, acertos / r.concentracaoAcertos);
  // O poder adicional só chega com a concentração plena, sem antecipar o pico em alvos curtos.
  return inicial + (1 - inicial) * progresso + (acertos >= r.concentracaoAcertos ? r.concentracaoExtraPct / 100 : 0);
}

/** Só perdas reais de HP carregam a concentração. Escudo completo, falha e imunidade não carregam. */
export function registrarDardo(ctx: ContextoSimulacao, ator: Entidade, alvo: Entidade, hab: Habilidade, tick: number, danoEfetivo: number): void {
  if (!elegivel(ator, alvo, hab, ctx) || danoEfetivo <= 0) return;
  if (!vivo(alvo)) { delete ator.concentracaoArcana; return; }
  const r = ctx.balance.ajustesClasses.mago;
  const anterior = ator.concentracaoArcana;
  const continua = anterior && anterior.alvoId === alvo.id && anterior.geracao === alvo.geracao && anterior.abates === alvo.abates
    && tick >= anterior.ultimoTick && tick - anterior.ultimoTick <= ticksDe(r.concentracaoJanelaMs);
  ator.concentracaoArcana = { alvoId: alvo.id, geracao: alvo.geracao, abates: alvo.abates,
    // Marco 24 (D-095): a sintonia arcana do Mago concentra mais rápido.
    acertos: Math.min(r.concentracaoAcertos, (continua ? anterior.acertos : 0) + 1 + concentracaoExtra(ctx, ator, tick)), ultimoTick: tick };
}
