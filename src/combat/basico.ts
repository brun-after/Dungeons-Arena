// O ataque básico com as armas de classe (marco 27, 29/10/2026, D-126). O básico vem da arma principal; com uma arma
// na mão secundária, o 3º básico sai por ela, sem penalidade, com o scaling e a variação dela. A passiva da classe
// continua valendo nele (o tiro carregado do Arqueiro pela espada vira uma linha que atravessa). Aqui também ficam as
// variações que agem no lançamento (o giro do Montante, os dardos do Tomo orbital, a riposta da Rapieira) e as frações
// de passiva que mexem no básico (o elemento do tomo, o arco lento). Puro.

import type { Celula, EntidadeId } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import { buscarEntidade, type EstadoJogo } from '../core/estado';
import { aleatorio } from '../core/rng';
import { ticksDe } from '../core/tempo';
import type { Entidade } from '../entities/entidade';
import { basicoEmprestado, passivaAtiva, passivaSemArma, temEmprestimo } from '../progression/armas';
import { celulaOcupada, chebyshev } from './geometria';
import type { Habilidade } from './habilidades';
import type { Multiplos } from './variacoes';

/** É o básico (o da mão principal ou o da secundária)? Os ganchos do básico valem para os dois. */
export function ehBasico(e: Pick<Entidade, 'ataqueBasico' | 'armas'>, habilidadeId: string): boolean {
  return habilidadeId === e.ataqueBasico || habilidadeId === e.armas?.secundario;
}

/** O básico da mão principal: a recarga do automático é contada nele, mesmo quando o golpe saiu pela secundária. */
export function chaveDoBasico(e: Pick<Entidade, 'ataqueBasico' | 'armas'>, habilidadeId: string): string {
  return ehBasico(e, habilidadeId) ? e.ataqueBasico : habilidadeId;
}

/**
 * Chegou a vez da mão secundária? Troca o básico pedido pelo dela quando o alvo está no alcance dela; senão, o golpe
 * fica pendente (sai no próximo básico que alcance).
 */
export function basicoDaVez(
  estado: EstadoJogo,
  ctx: ContextoSimulacao,
  ator: Entidade,
  habilidadeId: string,
  alvo: EntidadeId | Celula | undefined,
  alcanceDe: (id: string) => number | null,
): string {
  const sec = ator.armas?.secundario;
  if (!sec || habilidadeId !== ator.ataqueBasico || sec === habilidadeId) return habilidadeId;
  if ((ator.armas?.contador ?? 0) < ctx.balance.armas.secundariaACada - 1) return habilidadeId;
  const alcance = alcanceDe(sec);
  if (alcance === null) return habilidadeId;
  const destino = typeof alvo === 'object' ? alvo : alvo ? buscarEntidade(estado, alvo) : ator.alvoSelecionado ? buscarEntidade(estado, ator.alvoSelecionado) : undefined;
  if (!destino) return habilidadeId;
  return chebyshev(celulaOcupada(ator), 'id' in destino ? celulaOcupada(destino) : destino) <= alcance ? sec : habilidadeId;
}

/** Conta o básico que saiu: o da secundária zera o contador do 3º golpe. */
export function contarBasico(ator: Entidade, habilidadeId: string): void {
  if (!ehBasico(ator, habilidadeId)) return;
  const a = (ator.armas ??= { contador: 0, golpes: 0 });
  a.golpes++;
  a.contador = habilidadeId === a.secundario && a.secundario !== ator.ataqueBasico ? 0 : a.contador + 1;
}

/**
 * O básico como ele sai agora: o giro do Montante a cada n golpes (vira uma área em volta), o elemento que o tomo de
 * outra classe deixou pronto e a riposta da Rapieira (o crítico garantido vem pela fonte, em acao.ts).
 */
export function basicoComVariacao(estado: EstadoJogo, ator: Entidade, hab: Habilidade): Habilidade {
  if (!ehBasico(ator, hab.id)) return hab;
  let h = hab;
  const golpes = ator.armas?.golpes ?? 0;
  const giro = hab.variacao?.giroACada;
  if (giro && (golpes + 1) % giro === 0) h = { ...h, politicaImpacto: 'area', tipoArea: 'ao_redor', raioArea: Math.max(1, h.raioArea) };
  const a = ator.armas;
  if (a?.elemento && (a.elementoAteTick ?? 0) > estado.tick) {
    h = { ...h, elemento: a.elemento };
    delete a.elemento;
    delete a.elementoAteTick;
  }
  return h;
}

/** Os dardos do Tomo orbital: a cada n básicos, saem vários de uma vez, em leque. */
export function multiplosDaVez(ator: Entidade, hab: Habilidade): Multiplos | undefined {
  const m = hab.variacao?.multiplosACada;
  if (!m || !ehBasico(ator, hab.id)) return hab.variacao?.multiplos;
  return ((ator.armas?.golpes ?? 0) + 1) % m.n === 0 ? { quantidade: m.quantidade, aberturaGraus: m.aberturaGraus, recuo: 0, pctExtras: 100 } : hab.variacao?.multiplos;
}

/** A riposta da Rapieira está pronta? Consome ao usar. */
export function consumirRiposta(estado: EstadoJogo, ator: Entidade, hab: Habilidade): boolean {
  const a = ator.armas;
  if (!a?.ripostaAteTick || !ehBasico(ator, hab.id)) return false;
  const pronta = a.ripostaAteTick > estado.tick;
  delete a.ripostaAteTick;
  return pronta;
}

/** Levou um golpe: quem tem a Rapieira (no básico de qualquer mão) fica com a riposta pronta. */
export function aoLevarGolpe(estado: EstadoJogo, alvo: Entidade, habDe: (id: string) => Habilidade | undefined): void {
  const ms = Math.max(habDe(alvo.ataqueBasico)?.variacao?.ripostaMs ?? 0, alvo.armas?.secundario ? (habDe(alvo.armas.secundario)?.variacao?.ripostaMs ?? 0) : 0);
  if (ms <= 0) return;
  (alvo.armas ??= { contador: 0, golpes: 0 }).ripostaAteTick = estado.tick + ticksDe(ms);
}

/** O tomo de outra classe: depois de uma skill elemental, chance de o próximo básico sair com aquele elemento. */
export function aoUsarSkill(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, hab: Habilidade): void {
  if (ehBasico(ator, hab.id) || !hab.elemento || !hab.formulaDano || !temEmprestimo(ctx, ator, 'basicoElemental')) return;
  const emp = ctx.balance.armas.emprestimo;
  if (aleatorio(estado.rng) * 100 >= emp.elementalChancePct) return;
  const a = (ator.armas ??= { contador: 0, golpes: 0 });
  a.elemento = hab.elemento;
  a.elementoAteTick = estado.tick + ticksDe(emp.elementalMs);
}

/** Quanto a recarga do básico muda pela arma: o arco de outra classe é lento; sem o arco, o Arqueiro perde a cadência. */
export function recargaDoBasicoPct(ctx: ContextoSimulacao, ator: Entidade, hab: Habilidade): number {
  if (!ehBasico(ator, hab.id)) return 0;
  return basicoEmprestado(ctx, ator, hab.id, 'recargaLenta') ? ctx.balance.armas.emprestimo.arcoRecargaPct : 0;
}

/** O quanto da redução de recarga pela Destreza fica (sem o arco, o Arqueiro perde parte do multiplicador). */
export function fatorDaVelocidade(ctx: ContextoSimulacao, ator: Entidade): number {
  return passivaSemArma(ctx, ator, 'alcance') ? 1 + ctx.balance.armas.semFamiliaridade.velocidadePct / 100 : 1;
}

/** O alcance que o básico perde sem o arco (o alcance característico do Arqueiro). */
export function alcanceSemArma(ctx: ContextoSimulacao, ator: Entidade, hab: Habilidade): number {
  return ehBasico(ator, hab.id) && passivaSemArma(ctx, ator, 'alcance') ? ctx.balance.armas.semFamiliaridade.alcance : 0;
}

/**
 * O multiplicador da arma no dano: o bônus do básico do Aventureiro (com o arremessável na principal) e a parte
 * elemental do Mago sem o tomo.
 */
export function multiplicadorArma(ctx: ContextoSimulacao, e: Entidade, hab: Habilidade): number {
  let m = 1;
  if (ehBasico(e, hab.id) && passivaAtiva(ctx, e, 'pergaminhos')) m *= 1 + ctx.balance.armas.aventureiro.danoBasicoPct / 100;
  if (hab.elemento && passivaSemArma(ctx, e, 'elemental')) m *= 1 + ctx.balance.armas.semFamiliaridade.elementalPct / 100;
  return m;
}

/** A cura da classe que depende da lâmina (o Guerreiro): o fator que sobra sem ela. */
export function fatorDeCura(ctx: ContextoSimulacao, e: Entidade): number {
  return passivaSemArma(ctx, e, 'cura') ? 1 + ctx.balance.armas.semFamiliaridade.curaPct / 100 : 1;
}

/** A força e a vida dos mortos que dependem do cajado (o Necromante): o fator que sobra sem ele. */
export function fatorDosServos(ctx: ContextoSimulacao, e: Entidade): number {
  return passivaSemArma(ctx, e, 'servos') ? 1 + ctx.balance.armas.semFamiliaridade.servosPct / 100 : 1;
}
