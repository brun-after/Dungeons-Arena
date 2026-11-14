// Mira firme do Arqueiro (marco 22, 23/10/2026, D-089). Uma barra enche enquanto o Arqueiro não leva dano (6 s; a
// Destreza acima de 10 encurta até 25%). Cheia, o próximo disparo de projétil é um tiro carregado: crítico garantido
// (d20 mínimo 16: x1,5, ou x2 no 20), atravessa todos na linha e vai até o alcance máximo. Levar dano ou disparar o tiro carregado zera a barra.
// Calculada na leitura a partir de `mira.desdeTick` (sem sistema por tick). Números em balance.ajustesClasses.arqueiro.
// 14/11/2026 (D-171): sem a barra cheia, o alcance ofensivo cai (`alcanceSemMiraPct`); cada skill fora da classe enche
// `porSkillPct` da barra (o Flecheiro arcano, mais); no Inabalável, o dano tira só parte do que já encheu.

import type { ContextoSimulacao } from '../core/contexto';
import { ticksDe } from '../core/tempo';
import type { Entidade } from '../entities/entidade';
import { ehSkillDeClasse, fatorDeDominio, marcoDe } from '../progression/dominio';

/** Tem Mira firme? O Arqueiro (pela bolsa ou, na rede, pelo `classeId`), não as invocações. */
export function temMira(e: Entidade): boolean {
  return (e.bolsa?.classeId ?? e.classeId ?? '') === 'arqueiro' && !e.invocacao;
}

/** Ticks para encher a barra (a Destreza acima de 10 encurta). */
export function ticksParaCarregar(ctx: ContextoSimulacao, e: Entidade): number {
  const r = ctx.balance.ajustesClasses.arqueiro.mira;
  const reducao = Math.min(r.reducaoMaxPct, Math.max(0, e.atributos.destreza - 10) * r.reducaoPorDestrezaPct);
  // Marco 28 (D-127): o Instinto enche a Mira mais rápido.
  return Math.max(1, ticksDe((r.cargaMs * (1 - reducao / 100)) / fatorDeDominio(ctx, e, 'carga')));
}

/** Fração da barra (0..1); null para quem não tem. */
export function fracaoMira(ctx: ContextoSimulacao, e: Entidade, tick: number): number | null {
  if (!temMira(e)) return null;
  return Math.max(0, Math.min(1, (tick - (e.mira?.desdeTick ?? 0)) / ticksParaCarregar(ctx, e)));
}

/** Levou dano (ou disparou o tiro carregado): a barra recomeça. */
export function zerarMira(e: Entidade, tick: number): void {
  if (temMira(e)) e.mira = { desdeTick: tick };
}

/** No disparo: se a barra está cheia, consome e diz que este tiro é carregado. */
export function consumirMira(ctx: ContextoSimulacao, e: Entidade, tick: number): boolean {
  if (fracaoMira(ctx, e, tick) !== 1) return false;
  zerarMira(e, tick);
  return true;
}

/** D-171: a barra está cheia (o alcance inteiro e o próximo tiro carregado). */
export function miraCheia(ctx: ContextoSimulacao, e: Entidade, tick: number): boolean {
  return fracaoMira(ctx, e, tick) === 1;
}

/** D-171: o que a barra tem agora, posto de volta a partir de `tick` (sem guardar além da barra cheia). */
function porNaBarra(ctx: ContextoSimulacao, e: Entidade, tick: number, fracao: number): void {
  e.mira = { desdeTick: tick - Math.round(Math.max(0, Math.min(1, fracao)) * ticksParaCarregar(ctx, e)) };
}

/** D-171: a skill que não é de classe (nem o básico) adianta a barra; o Flecheiro arcano (`miraSkill`) enche mais. */
export function adiantarMiraPorSkill(ctx: ContextoSimulacao, e: Entidade, habId: string, basico: boolean, tick: number): void {
  if (basico || !temMira(e) || ehSkillDeClasse(ctx, e, habId)) return;
  const atual = fracaoMira(ctx, e, tick) ?? 0;
  if (atual >= 1) return;
  porNaBarra(ctx, e, tick, atual + (ctx.balance.ajustesClasses.arqueiro.mira.porSkillPct / 100) * fatorDeDominio(ctx, e, 'miraSkill'));
}

/** Levou dano: a barra recomeça; no Inabalável (`miraRetidaPct`), fica parte do que já tinha. */
export function perderMiraPorDano(ctx: ContextoSimulacao, e: Entidade, tick: number): void {
  if (!temMira(e)) return;
  const retida = Math.min(100, marcoDe(ctx, e, 'miraRetidaPct')) / 100;
  if (retida <= 0) {
    zerarMira(e, tick);
    return;
  }
  porNaBarra(ctx, e, tick, (fracaoMira(ctx, e, tick) ?? 0) * retida);
}
