import { retirarVida } from './reserva-necromante';
// Ajustes de produção (18/10/2026). A aura resolve dano sem voltar ao dispatcher de acertos.
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import { vivo, type Entidade } from '../entities/entidade';
import { podeAjudar, podeFerir } from '../modos/relacao';
import { aleatorio } from '../core/rng';
import { marcoDe, fatorDeDominio } from '../progression/dominio';
import { ehElemento } from './elementos';
import { absorverEscudo, aplicarEfeito, imuneADano, multiplicadorCuraRecebida, multiplicadorDanoRecebido } from './efeitos';
import { celulaOcupada, chebyshev } from './geometria';
import type { Habilidade } from './habilidades';
import { multiplicadorEncarnacao, protecaoEncarnacao } from './encarnacao';
import { emFrenesi, multiplicadorFuria } from './furia';
import { fatorDeCura } from './basico';
import { registrarParticipacao } from './participacao';
import { curarAliadosDaAura, efeitosDoPulso, pesoDoHostil, prolongarFrenesi, raioExtraDaAura } from './sintonia-guerreiro';

export const classeDe = (e: Entidade): string => e.bolsa?.classeId ?? e.classeId ?? '';

/** 18/10/2026: 20% do reforço no 16, chegando a 100% no 20. */
export function progressoReforcosGuerreiro(ctx: ContextoSimulacao, nivel: number): number {
  const r = ctx.balance.ajustesClasses.guerreiro;
  return Math.max(0, Math.min(1, (nivel - r.reforcosInicioNivel + 1) / (r.reforcosPlenosNivel - r.reforcosInicioNivel + 1)));
}

export function extraGuerreiro(ctx: ContextoSimulacao, fonte: Entidade, alvo: Entidade): number {
  if (classeDe(fonte) !== 'guerreiro' || fonte.invocacao || fonte === alvo || !podeFerir(fonte, alvo, ctx.modo)) return 1;
  const r = ctx.balance.ajustesClasses.guerreiro;
  return 1 + r.extraMaxPct / 100 * Math.max(0, Math.min(ctx.balance.xp.nivelPlenoDasClasses, fonte.nivel) - r.extraInicioNivel) / (ctx.balance.xp.nivelPlenoDasClasses - r.extraInicioNivel);
}

/** Um encontro começa na primeira agressão e só termina na troca de fase. Ondas e respawn não renovam a janela. */
export function protecaoInicial(estado: EstadoJogo, ctx: ContextoSimulacao, alvo: Entidade, fonte?: Entidade): number {
  if (!fonte || fonte === alvo || !podeFerir(fonte, alvo, ctx.modo)) return 1;
  for (const e of [fonte, alvo]) {
    if (!e.encontro || e.encontro.faseId !== estado.faseId) e.encontro = { faseId: estado.faseId, inicioTick: estado.tick };
  }
  if (classeDe(alvo) === 'guerreiro' && !alvo.invocacao) {
    // Marco 24 (D-094): no Frenesi, a resistência contra grupos vai a zero.
    if (emFrenesi(alvo, estado.tick)) return 1;
    const g = ctx.balance.ajustesClasses.guerreiro;
    // Marco 24 (D-095): a sintonia do veneno faz o hostil envenenado contar em dobro.
    const hostis = estado.entidades.filter(e => vivo(e) && podeFerir(e, alvo, ctx.modo) && chebyshev(celulaOcupada(e), celulaOcupada(alvo)) <= g.grupoRaio).reduce((s, e) => s + pesoDoHostil(ctx, alvo, e, estado.tick), 0);
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
  // Marco 24 (24/10/2026, D-094): o kit do Aventureiro sai do falcão; o ajuste da classe pesa nas skills dele.
  // Marco 28 (D-127): o Engenho fortalece o falcão.
  if (classe === 'aventureiro' && hab.tags.includes('falcao')) return ctx.balance.ajustesClasses.aventureiro.falcaoDanoMult * fatorDeDominio(ctx, ator, 'falcao');
  if (classe === 'arqueiro' && secundario && ['chuva_de_flechas', 'tiro_em_leque'].includes(hab.id)) return ctx.balance.ajustesClasses.arqueiro.secundariosMult;
  return 1;
}

/** Marco 21 (23/10/2026, D-088): progresso linear do nível 1 (0) ao nível máximo (1), para as curvas da aura. */
function progressoDoNivel(ctx: ContextoSimulacao, nivel: number): number {
  // Marco 28 (D-127): as curvas chegam ao máximo no nível pleno (30), não no teto de nível (100).
  return (Math.min(ctx.balance.xp.nivelPlenoDasClasses, Math.max(1, nivel)) - 1) / (ctx.balance.xp.nivelPlenoDasClasses - 1);
}

/** Marco 24 (25/10/2026, D-098): a fração do dano no falcão que chega ao dono (de 80% no nível 1 a 60% no máximo). */
export function reflexoDoFalcao(ctx: ContextoSimulacao, nivel: number): number {
  const r = ctx.balance.ajustesClasses.aventureiro.falcao;
  return (r.reflexoInicioPct + (r.reflexoFimPct - r.reflexoInicioPct) * progressoDoNivel(ctx, nivel)) / 100;
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
  const curva = curvaDaAura(ctx, ator.nivel);
  // Marco 28 (D-127): a Bravura fortalece o dano e a cura da aura e, nos marcos, aumenta o raio.
  const bravura = fatorDeDominio(ctx, ator, 'aura');
  const pct = curva.danoPct * bravura;
  const curaPct = curva.curaPct * bravura;
  // Um impacto remoto gera somente o pulso centrado no atingido.
  const centro = celulaOcupada(remoto ? alvo : ator);
  let soma = 0;
  // Frações pertencem à vida atual do destinatário (não atravessam respawns).
  const presentes = new Set(estado.entidades.filter(vivo).map(e => `${e.id}/${e.geracao}`));
  const fracoes = ator.auraFracoes = Object.fromEntries(Object.entries(ator.auraFracoes ?? {}).filter(([id]) => presentes.has(id)));
  // Marco 24 (D-095): a sintonia arcana aumenta o raio; a do fogo e a psíquica aplicam estados em quem o pulso atinge.
  const raio = raioDaAura(ctx, ator, estado.tick);
  const atingidos: Entidade[] = [];
  for (const e of estado.entidades) {
    if (!vivo(e) || !podeFerir(ator, e, ctx.modo) || chebyshev(centro, celulaOcupada(e)) > raio || imuneADano(e, estado.tick)) continue;
    atingidos.push(e);
    const id = `${e.id}/${e.geracao}`;
    const bruto = Math.max(0, danoEfetivo * pct / 100 - e.defesa * r.auraDefesaPct / 100) * multiplicadorDanoRecebido(e, estado.tick) * protecaoInicial(estado, ctx, e, ator);
    const total = bruto + (fracoes[id] ?? 0);
    const inteiro = Math.floor(total + 1e-9);
    fracoes[id] = Math.max(0, total - inteiro);
    const dano = retirarVida(e, absorverEscudo(e, inteiro, estado.tick));
    soma += dano;
    if (dano > 0) {
      registrarParticipacao(e, ator.id, estado.tick, ctx);
      // Nenhuma habilidade é creditada à aura: ganchos de acerto e crítico não são chamados.
      e.ultimoGolpe = null;
      saida.push({ t: 'efeitoResultado', tick: estado.tick, alvoId: e.id, origemId: ator.id, tipo: 'dano_direto', dano, cura: 0, mana: 0 });
    }
  }
  efeitosDoPulso(estado, ctx, ator, atingidos, saida);
  auraElemental(estado, ctx, ator, atingidos, saida);
  prolongarFrenesi(estado, ctx, ator, atingidos);
  // Marco 27 (D-126): sem a lâmina, o Guerreiro perde parte da cura.
  const curaDaAura = soma * curaPct / 100 * multiplicadorFuria(ctx, ator, estado.tick) * fatorDeCura(ctx, ator);
  curarAliadosDaAura(estado, ctx, ator, curaDaAura, saida);
  estandarte(estado, ctx, ator, raio, curaDaAura, saida);
  const curaTotal = (ator.auraCuraFracao ?? 0) + curaDaAura * multiplicadorCuraRecebida(ator, estado.tick);
  const curaInteira = Math.floor(curaTotal + 1e-9);
  ator.auraCuraFracao = Math.max(0, curaTotal - curaInteira);
  const cura = Math.min(ator.hpMax - ator.hp, curaInteira);
  ator.hp += cura;
  if (cura > 0) saida.push({ t: 'efeitoResultado', tick: estado.tick, alvoId: ator.id, origemId: ator.id, tipo: 'cura', dano: 0, cura, mana: 0 });
}

function extraElegivel(ator: Entidade, alvo: Entidade, ctx: ContextoSimulacao): boolean {
  return classeDe(ator) === 'guerreiro' && !ator.invocacao && ator !== alvo && podeFerir(ator, alvo, ctx.modo);
}

/** O raio da aura agora: o do balance, o da sintonia e o dos marcos da Bravura (marco 28, D-127). */
export function raioDaAura(ctx: ContextoSimulacao, ator: Entidade, tick: number): number {
  return ctx.balance.ajustesClasses.guerreiro.auraRaio + raioExtraDaAura(ctx, ator, tick) + marcoDe(ctx, ator, 'auraRaio');
}

/** Marco 28 (D-127): no marco da aura elemental, cada pulso aplica, com chance, o estado do elemento da arma. */
function auraElemental(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, atingidos: readonly Entidade[], saida: EventoSimulacao[]): void {
  const chance = marcoDe(ctx, ator, 'auraElementalPct');
  const elemento = ator.aparencia?.elementoArma;
  const def = chance > 0 && ehElemento(elemento) ? ctx.conteudo.elementos.get(elemento) : undefined;
  if (!def) return;
  for (const e of atingidos) {
    if (!vivo(e) || aleatorio(estado.rng) * 100 >= chance) continue;
    aplicarEfeito(estado, ctx, e, def.estado, { id: ator.id, x: ator.x, y: ator.y }, { x: e.x, y: e.y }, saida);
  }
}

/** Marco 28 (D-127): o Estandarte: os aliados no raio da aura recebem parte da cura dela. */
function estandarte(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, raio: number, curaDaAura: number, saida: EventoSimulacao[]): void {
  const pct = marcoDe(ctx, ator, 'estandartePct');
  if (pct <= 0 || curaDaAura <= 0) return;
  for (const e of estado.entidades) {
    if (e === ator || !vivo(e) || !podeAjudar(ator, e, ctx.modo) || chebyshev(celulaOcupada(e), celulaOcupada(ator)) > raio) continue;
    const cura = Math.min(e.hpMax - e.hp, Math.round(((curaDaAura * pct) / 100) * multiplicadorCuraRecebida(e, estado.tick)));
    if (cura <= 0) continue;
    e.hp += cura;
    saida.push({ t: 'efeitoResultado', tick: estado.tick, alvoId: e.id, origemId: ator.id, tipo: 'cura', dano: 0, cura, mana: 0 });
  }
}
