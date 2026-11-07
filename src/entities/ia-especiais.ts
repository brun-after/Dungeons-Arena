// Os jeitos próprios de caçar (06/11/2026, D-135), pelo `comportamento` do preset. Agem pelas mesmas funções dos
// comandos (iniciarAcao, planejarCaminho, aplicarEfeito), nunca por atalho (D-025). Números em `balance.ia`.
// - saltador (Duende saltador): perto o bastante, dá uma corridinha (acelerado) e, no fim dela, pula no alvo com a
//   habilidade de salto (a primeira do preset). Fugir dele não adianta: o salto fecha a distância.
// - armadilheiro (Runista medroso): foge girando em volta do alvo, rápido, e a cada tantas células larga uma pedra que
//   vira runa de pé (a primeira habilidade do preset), cercando quem caça. Depois para e descansa um pouco: é a hora
//   de bater nele. Não ataca.

import type { Celula } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import { iniciarAcao, recargaRestante } from '../combat/acao';
import { aplicarEfeito } from '../combat/efeitos';
import { celulaOcupada, chebyshev } from '../combat/geometria';
import { tiroLivre } from '../combat/linha-de-tiro';
import { habilidadeDoAtor } from '../combat/perfil';
import { construirEfeito } from '../combat/registro-efeitos';
import { passavel } from '../world/fase';
import { pararMovimento, planejarCaminho } from '../world/movimento';
import { emPasso, type Entidade, type EstadoIa } from './entidade';
import type { PresetInimigo } from './presets';

/** Acelera quem corre (o efeito `acelerado`, que a velocidade de movimento já lê). */
function acelerar(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, ms: number, pct: number, saida: EventoSimulacao[]): void {
  aplicarEfeito(estado, ctx, e, construirEfeito('acelerado', { duracaoMs: ms, pct }), { id: e.id, x: e.x, y: e.y }, null, saida);
}

/**
 * O tick do comportamento especial durante a perseguição. Devolve true quando ele tomou o tick (a IA do arquétipo não
 * roda); false deixa a perseguição comum seguir (o saltador correndo até o alvo, ou sem salto pronto).
 */
export function perseguirEspecial(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, ia: EstadoIa, preset: PresetInimigo, alvo: Entidade, saida: EventoSimulacao[]): boolean {
  if (preset.comportamento === 'saltador') return saltador(estado, ctx, e, ia, alvo, saida);
  if (preset.comportamento === 'armadilheiro') {
    armadilheiro(estado, ctx, e, ia, alvo, saida);
    return true;
  }
  return false;
}

function saltador(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, ia: EstadoIa, alvo: Entidade, saida: EventoSimulacao[]): boolean {
  const r = ctx.balance.ia.saltador;
  const id = e.habilidades[0];
  const salto = id ? habilidadeDoAtor(ctx, e, id, estado.tick) : undefined;
  if (!salto) return false;
  const de = celulaOcupada(e);
  const ate = celulaOcupada(alvo);
  const d = chebyshev(de, ate);
  const pronto = !e.acao && recargaRestante(estado, e.id, salto.id) === 0;
  if (ia.especial === 'corrida') {
    // A corrida acaba no salto (ou no fim do tempo, se o alvo escapou do alcance).
    const acabou = estado.tick >= (ia.especialAteTick ?? 0);
    const alcanca = d >= 1 && d <= salto.alcanceCelulas && tiroLivre(estado, ctx, de, ate);
    if (!acabou && !(alcanca && d <= r.distanciaMin + 1)) return false;
    delete ia.especial;
    if (pronto && alcanca && iniciarAcao(estado, ctx, e, salto.id, alvo.id, saida)) {
      ia.ataquesFeitos++;
      return true;
    }
    return false;
  }
  if (pronto && d >= r.distanciaMin && d <= salto.alcanceCelulas + r.folgaCorrida) {
    ia.especial = 'corrida';
    ia.especialAteTick = estado.tick + ticksDe(r.corridaMs);
    acelerar(estado, ctx, e, r.corridaMs, r.corridaPct, saida);
  }
  return false;
}

/** A célula do giro: no anel de `raioCerco` em volta do alvo, um passo angular adiante no sentido da fuga. */
function proximoPontoDoCerco(ctx: ContextoSimulacao, e: Entidade, ia: EstadoIa, alvo: Entidade): Celula | null {
  const r = ctx.balance.ia.armadilheiro;
  const angulo = Math.atan2(e.y - alvo.y, e.x - alvo.x);
  for (const sentido of [ia.sentidoCerco ?? 1, -(ia.sentidoCerco ?? 1)]) {
    for (const raio of [r.raioCerco, r.raioCerco + 1, r.raioCerco - 1]) {
      const a = angulo + sentido * r.passoRad;
      const c = { x: Math.round(alvo.x + Math.cos(a) * raio), y: Math.round(alvo.y + Math.sin(a) * raio) };
      if (passavel(ctx.fase, c.x, c.y) && (c.x !== e.x || c.y !== e.y)) {
        ia.sentidoCerco = sentido;
        return c;
      }
    }
  }
  return null;
}

function armadilheiro(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, ia: EstadoIa, alvo: Entidade, saida: EventoSimulacao[]): void {
  const r = ctx.balance.ia.armadilheiro;
  const tick = estado.tick;
  // Fuga e descanso se alternam; a primeira vez que vê o alvo, foge.
  if (!ia.especial || tick >= (ia.especialAteTick ?? 0)) {
    if (ia.especial === 'fuga') {
      ia.especial = 'descanso';
      ia.especialAteTick = tick + ticksDe(r.descansoMs);
      pararMovimento(e);
      e.caminho = [];
    } else {
      ia.especial = 'fuga';
      ia.especialAteTick = tick + ticksDe(r.fugaMs);
      ia.sentidoCerco = -(ia.sentidoCerco ?? -1);
      acelerar(estado, ctx, e, r.fugaMs, r.fugaPct, saida);
    }
  }
  if (ia.especial === 'descanso') {
    if (!emPasso(e)) pararMovimento(e);
    return;
  }
  // Planta a runa na célula por onde passa, a cada `plantarACadaCelulas`.
  const id = e.habilidades[0];
  const ultima = ia.ultimaRuna;
  if (id && !e.acao && (!ultima || chebyshev(ultima, e) >= r.plantarACadaCelulas) && iniciarAcao(estado, ctx, e, id, { x: e.x, y: e.y }, saida)) {
    ia.ultimaRuna = { x: e.x, y: e.y };
  }
  if (emPasso(e) || e.caminho.length > 0) return;
  const destino = proximoPontoDoCerco(ctx, e, ia, alvo);
  if (destino) planejarCaminho(e, destino, ctx, tick, saida, ctx.balance.ia.maxPassosPerseguicao);
}
