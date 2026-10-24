// Ajustes de produção (18/10/2026). A aura resolve dano sem voltar ao dispatcher de acertos.
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import { vivo, type Entidade } from '../entities/entidade';
import { podeFerir } from '../modos/relacao';
import { absorverEscudo, imuneADano, multiplicadorCuraRecebida, multiplicadorDanoRecebido } from './efeitos';
import { celulaOcupada, chebyshev } from './geometria';
import type { Habilidade } from './habilidades';
import { multiplicadorEncarnacao, protecaoEncarnacao } from './encarnacao';
import { multiplicadorFuria } from './furia';
import { registrarParticipacao } from './participacao';

export const classeDe = (e: Entidade): string => e.bolsa?.classeId ?? e.classeId ?? '';

/** 18/10/2026: 20% do reforço no 16, chegando a 100% no 20. */
export function progressoReforcosGuerreiro(ctx: ContextoSimulacao, nivel: number): number {
  const r = ctx.balance.ajustesClasses.guerreiro;
  return Math.max(0, Math.min(1, (nivel - r.reforcosInicioNivel + 1) / (r.reforcosPlenosNivel - r.reforcosInicioNivel + 1)));
}

export function extraGuerreiro(ctx: ContextoSimulacao, fonte: Entidade, alvo: Entidade): number {
  if (classeDe(fonte) !== 'guerreiro' || fonte.invocacao || fonte === alvo || !podeFerir(fonte, alvo, ctx.modo)) return 1;
  const r = ctx.balance.ajustesClasses.guerreiro;
  return 1 + r.extraMaxPct / 100 * Math.max(0, Math.min(ctx.balance.xp.nivelMax, fonte.nivel) - r.extraInicioNivel) / (ctx.balance.xp.nivelMax - r.extraInicioNivel);
}

/** Um encontro começa na primeira agressão e só termina na troca de fase. Ondas e respawn não renovam a janela. */
export function protecaoInicial(estado: EstadoJogo, ctx: ContextoSimulacao, alvo: Entidade, fonte?: Entidade): number {
  if (!fonte || fonte === alvo || !podeFerir(fonte, alvo, ctx.modo)) return 1;
  for (const e of [fonte, alvo]) {
    if (!e.encontro || e.encontro.faseId !== estado.faseId) e.encontro = { faseId: estado.faseId, inicioTick: estado.tick };
  }
  if (classeDe(alvo) === 'guerreiro' && !alvo.invocacao) {
    const g = ctx.balance.ajustesClasses.guerreiro;
    const hostis = estado.entidades.filter(e => vivo(e) && podeFerir(e, alvo, ctx.modo) && chebyshev(celulaOcupada(e), celulaOcupada(alvo)) <= g.grupoRaio).length;
    const faixa = Math.min(1, Math.max(0, (alvo.nivel - 1) / (g.grupoNivelPleno - 1)));
    const progresso = 1 - (1 - faixa) ** g.contatoExpoente;
    return hostis >= 2 ? 1 - g.grupoReducaoMaxPct / 100 * progresso : 1;
  }
  // Marco 22 (D-089): o Mago encarnado em gelo recebe menos dano.
  if (classeDe(alvo) === 'mago' && !alvo.invocacao) return protecaoEncarnacao(ctx, alvo);
  if (classeDe(alvo) !== 'necromante' || alvo.invocacao) return 1;
  const r = ctx.balance.ajustesClasses.necromante;
  if (estado.tick - (alvo.encontro?.inicioTick ?? estado.tick) >= ticksDe(r.protecaoMs)) return 1;
  const n = estado.entidades.filter(e => vivo(e) && podeFerir(e, alvo, ctx.modo)).length;
  return 1 - (n >= 3 ? r.grupoPct : n === 2 ? r.doisPct : 0) / 100;
}

/** Entrega remota explícita: projétil ou quadrado na mira. Cones, linhas e redemoinhos são locais. */
export function entregaRemota(hab: Habilidade): boolean {
  return hab.politicaImpacto === 'projetil' || (hab.politicaImpacto === 'area' && hab.tipoArea === 'quadrado');
}

export function multiplicadorDireto(ctx: ContextoSimulacao, ator: Entidade, hab: Habilidade, secundario: boolean): number {
  const classe = classeDe(ator);
  // Marco 22 (D-089): o Mago encarnado em fogo.
  if (classe === 'mago') return multiplicadorEncarnacao(ctx, ator, hab);
  if (classe === 'aventureiro' && ator.nivel >= ctx.balance.ajustesClasses.aventureiro.nivelCorte && ['seta_arcana', 'explosao'].includes(hab.id)) return ctx.balance.ajustesClasses.aventureiro.danoMult;
  if (classe === 'arqueiro' && secundario && ['chuva_de_flechas', 'tiro_em_leque'].includes(hab.id)) return ctx.balance.ajustesClasses.arqueiro.secundariosMult;
  return 1;
}

/** Marco 21 (23/10/2026, D-088): progresso linear do nível 1 (0) ao nível máximo (1), para as curvas da aura. */
function progressoDoNivel(ctx: ContextoSimulacao, nivel: number): number {
  return (Math.min(ctx.balance.xp.nivelMax, Math.max(1, nivel)) - 1) / (ctx.balance.xp.nivelMax - 1);
}

/** Dano da aura (% do dano efetivo do golpe) e cura (% do que a aura causou) no nível. */
export function curvaDaAura(ctx: ContextoSimulacao, nivel: number): { danoPct: number; curaPct: number } {
  const r = ctx.balance.ajustesClasses.guerreiro;
  const p = progressoDoNivel(ctx, nivel);
  return { danoPct: r.auraMinPct + (r.auraMaxPct - r.auraMinPct) * p, curaPct: r.auraCuraMinPct + (r.auraCuraMaxPct - r.auraCuraMinPct) * p };
}

// Marco 21 (23/10/2026, D-088): a aura vale com força desde o nível 1 (de 3% a 15% de dano e de 20% a 50% de cura), desconta
// só metade da defesa e o pulso dos golpes à distância deixa de esperar o nível 16. Com a fúria cheia, a cura dobra.
export function pulsarAura(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, alvo: Entidade, danoEfetivo: number, saida: EventoSimulacao[], remoto = false): void {
  if (danoEfetivo <= 0 || !vivo(ator) || !extraElegivel(ator, alvo, ctx)) return;
  const r = ctx.balance.ajustesClasses.guerreiro;
  const { danoPct: pct, curaPct } = curvaDaAura(ctx, ator.nivel);
  // Um impacto remoto gera somente o pulso centrado no atingido.
  const centro = celulaOcupada(remoto ? alvo : ator);
  let soma = 0;
  // Frações pertencem à vida atual do destinatário (não atravessam respawns).
  const presentes = new Set(estado.entidades.filter(vivo).map(e => `${e.id}/${e.geracao}`));
  const fracoes = ator.auraFracoes = Object.fromEntries(Object.entries(ator.auraFracoes ?? {}).filter(([id]) => presentes.has(id)));
  for (const e of estado.entidades) {
    if (!vivo(e) || !podeFerir(ator, e, ctx.modo) || chebyshev(centro, celulaOcupada(e)) > r.auraRaio || imuneADano(e, estado.tick)) continue;
    const id = `${e.id}/${e.geracao}`;
    const bruto = Math.max(0, danoEfetivo * pct / 100 - e.defesa * r.auraDefesaPct / 100) * multiplicadorDanoRecebido(e, estado.tick) * protecaoInicial(estado, ctx, e, ator);
    const total = bruto + (fracoes[id] ?? 0);
    const inteiro = Math.floor(total + 1e-9);
    fracoes[id] = Math.max(0, total - inteiro);
    const dano = Math.min(e.hp, absorverEscudo(e, inteiro, estado.tick));
    e.hp -= dano;
    soma += dano;
    if (dano > 0) {
      registrarParticipacao(e, ator.id, estado.tick, ctx);
      // Nenhuma habilidade é creditada à aura: ganchos de acerto e crítico não são chamados.
      e.ultimoGolpe = null;
      saida.push({ t: 'efeitoResultado', tick: estado.tick, alvoId: e.id, origemId: ator.id, tipo: 'dano_direto', dano, cura: 0, mana: 0 });
    }
  }
  const curaTotal = (ator.auraCuraFracao ?? 0) + soma * curaPct / 100 * multiplicadorCuraRecebida(ator, estado.tick) * multiplicadorFuria(ctx, ator, estado.tick);
  const curaInteira = Math.floor(curaTotal + 1e-9);
  ator.auraCuraFracao = Math.max(0, curaTotal - curaInteira);
  const cura = Math.min(ator.hpMax - ator.hp, curaInteira);
  ator.hp += cura;
  if (cura > 0) saida.push({ t: 'efeitoResultado', tick: estado.tick, alvoId: ator.id, origemId: ator.id, tipo: 'cura', dano: 0, cura, mana: 0 });
}

function extraElegivel(ator: Entidade, alvo: Entidade, ctx: ContextoSimulacao): boolean {
  return classeDe(ator) === 'guerreiro' && !ator.invocacao && ator !== alvo && podeFerir(ator, alvo, ctx.modo);
}
