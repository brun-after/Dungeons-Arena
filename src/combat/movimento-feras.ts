// D-188 (19/11/2026): o X do Aventureiro, pela fera da vez (chamado por combat/movimento-classe.ts, sem importá-lo):
// - desmontado, o Chamado: a fera vem para junto do dono (o falcão voa; o lobo e o urso correm);
// - no voo, o Arremesso do falcão: o voo acaba num salto de 1/4 do alcance do voo (1/3 no nível 90) e o falcão cansa
//   com o descanso em dobro (a força de arremessar o dono);
// - no lobo, a Disparada: de +60% a +80% (+100% no nível 90), gastando o dobro do fôlego por segundo;
// - no urso, o Círculo de Contenção: 3 s (4 s no nível 90) em que as magias vindas de fora não entram, gastando todo o
//   fôlego que resta; quanto mais ele barra, mais cedo volta do descanso.
// Os estilos mudam cada um (pets-estilos.ts): o Batedor arremessa mais longe e dispara gastando menos; o Implacável
// atordoa na queda, derruba quem a Disparada toca e empurra no fim do círculo; o Sobrevivente segura o círculo por
// mais tempo e volta antes; o Xamã leva a runa à queda, à Disparada e ao círculo. Puro.

import type { Celula } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import { buscarEntidade, type EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import { posicionar, vivo, type Entidade } from '../entities/entidade';
import { podeAjudar, podeFerir } from '../modos/relacao';
import { corpoCabe } from '../world/corpo';
import { passavel } from '../world/fase';
import { aplicarEfeito } from './efeitos';
import { cansar, feraDe } from './feras';
import { celulaOcupada, chebyshev } from './geometria';
import type { Habilidade } from './habilidades';
import { tocarEmVolta, tocarPonta, pontaDaAfinidade } from './movimento-extras';
import { leituraDoPet } from './pets-estilos';
import { petDoCompanheiro, type Pet } from './pets';
import { construirEfeito } from './registro-efeitos';

const feras = (ctx: ContextoSimulacao) => ctx.balance.ajustesClasses.aventureiro.feras;
const cabeAli = (ctx: ContextoSimulacao, x: number, y: number) => passavel(ctx.fase, x, y) && corpoCabe(ctx.fase, x, y, ctx.balance.movimento.raioCorpo);

/** A fera da vez em campo (viva). */
export function feraEmCampo(estado: EstadoJogo, dono: Entidade): Entidade | undefined {
  return estado.entidades.find((c) => vivo(c) && c.invocacao?.companheiro === true && c.invocacao.donoId === dono.id);
}

/** O Chamado: a fera vem para a célula livre ao lado do dono mais perto dela. False: não há fera ou lugar. */
export function chamarFera(estado: EstadoJogo, ctx: ContextoSimulacao, dono: Entidade, saida: EventoSimulacao[]): boolean {
  const fera = feraEmCampo(estado, dono);
  if (!fera) return false;
  const de = celulaOcupada(fera);
  let melhor: Celula | null = null;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const c = { x: dono.x + dx, y: dono.y + dy };
      if ((dx === 0 && dy === 0) || !cabeAli(ctx, c.x, c.y)) continue;
      if (!melhor || chebyshev(c, de) < chebyshev(melhor, de)) melhor = c;
    }
  }
  const destino = melhor ?? { x: dono.x, y: dono.y };
  const celulas = chebyshev(de, destino);
  posicionar(fera, destino.x, destino.y);
  fera.caminho = [];
  fera.waypoints = [];
  if (celulas > 0) {
    const passo = petDoCompanheiro(fera) === 'falcao' ? ctx.balance.ajustesClasses.aventureiro.falcaoPassoMs : ctx.balance.ajustesClasses.aventureiro.pets[petDoCompanheiro(fera) === 'lobo' ? 'lobo' : 'urso'].passoMs;
    saida.push({ t: 'deslocado', tick: estado.tick, id: fera.id, deX: de.x, deY: de.y, paraX: destino.x, paraY: destino.y, origemId: dono.id, causa: 'avanco', ms: Math.min(900, (celulas * passo) / 3) });
  }
  return true;
}

/** As células do Arremesso: 1/4 do alcance do voo (1/3 no nível 90), mais o do Batedor. */
export function celulasDoArremesso(ctx: ContextoSimulacao, dono: Entidade, alcanceDoVoo: number): number {
  const f = feras(ctx);
  const fracao = dono.nivel >= f.marcos.auge ? f.auge.arremesso : f.falcao.arremesso;
  return Math.max(1, Math.round(alcanceDoVoo * fracao * (1 + leituraDoPet(ctx, dono, 'falcao', 'arremessoPct') / 100)));
}

/** O falcão que arremessou cansa, com o descanso em dobro. */
export function cansarNoArremesso(estado: EstadoJogo, ctx: ContextoSimulacao, dono: Entidade, saida: EventoSimulacao[]): void {
  cansar(estado, ctx, dono, 'falcao', saida, feras(ctx).falcao.arremessoDescanso);
}

/** A queda do Arremesso: atordoa em volta no Implacável e leva a ponta no Xamã (ou no marco elemental, `ponta`). */
export function quedaDoArremesso(estado: EstadoJogo, ctx: ContextoSimulacao, dono: Entidade, ponta: ReturnType<typeof pontaDaAfinidade> | undefined, saida: EventoSimulacao[]): void {
  const atordoa = Math.round(leituraDoPet(ctx, dono, 'falcao', 'quedaAtordoaMs'));
  if (atordoa > 0) {
    for (const o of estado.entidades) {
      if (o === dono || !vivo(o) || chebyshev(o, dono) > 1 || !podeFerir(dono, o, ctx.modo)) continue;
      aplicarEfeito(estado, ctx, o, construirEfeito('atordoar', { duracaoMs: atordoa }), { id: dono.id, x: dono.x, y: dono.y }, null, saida);
    }
  }
  const raio = leituraDoPet(ctx, dono, 'falcao', 'quedaRuna');
  const daPonta = ponta ?? (raio > 0 ? pontaDaAfinidade(ctx, dono, estado.tick) : undefined);
  if (daPonta) tocarEmVolta(estado, ctx, dono, { x: dono.x, y: dono.y }, Math.max(1, Math.floor(raio)), daPonta, saida);
}

/** O pulso da Disparada (a cada meio segundo): o Implacável derruba quem ela toca; o Xamã leva a runa. */
export function pulsoDaDisparada(estado: EstadoJogo, ctx: ContextoSimulacao, dono: Entidade, saida: EventoSimulacao[]): void {
  if (estado.tick % Math.max(1, ticksDe(500)) !== 0) return;
  const empurra = Math.floor(leituraDoPet(ctx, dono, 'lobo', 'disparadaEmpurra'));
  const runa = leituraDoPet(ctx, dono, 'lobo', 'disparadaRuna') >= 0.5 ? pontaDaAfinidade(ctx, dono, estado.tick) : undefined;
  if (empurra <= 0 && !runa) return;
  for (const o of estado.entidades) {
    if (o === dono || !vivo(o) || o.invocacao?.companheiro || chebyshev(o, dono) > 1 || !podeFerir(dono, o, ctx.modo)) continue;
    if (empurra > 0) aplicarEfeito(estado, ctx, o, construirEfeito('empurrao', { valor: empurra }), { id: dono.id, x: dono.x, y: dono.y }, null, saida);
    if (runa) tocarPonta(estado, ctx, dono, o, runa, saida);
  }
}

/** O Círculo de Contenção: em volta do urso, gastando todo o fôlego dele (o descanso começa quando acaba). */
export function iniciarContencao(estado: EstadoJogo, ctx: ContextoSimulacao, dono: Entidade, saida: EventoSimulacao[]): void {
  const f = feras(ctx);
  const tick = estado.tick;
  const base = dono.nivel >= f.marcos.auge ? f.auge.contencaoMs : f.urso.contencao.duracaoMs;
  const ms = base + Math.max(0, leituraDoPet(ctx, dono, 'urso', 'contencaoMaisMs'));
  const urso = feraEmCampo(estado, dono);
  const centro = urso ? celulaOcupada(urso) : { x: dono.x, y: dono.y };
  feraDe(dono, 'urso').energia = 0;
  (dono.movimentoClasse ??= { ativo: '', cargas: {} }).contencao = { x: centro.x, y: centro.y, raio: f.urso.contencao.raio, desdeTick: tick, ateTick: tick + ticksDe(ms), bloqueado: 0 };
  if (leituraDoPet(ctx, dono, 'urso', 'contencaoRuna') >= 0.5) tocarEmVolta(estado, ctx, dono, centro, f.urso.contencao.raio + 1, pontaDaAfinidade(ctx, dono, tick), saida);
}

/** A cada tick: o urso fica plantado no centro; no fim, o Implacável empurra e o urso cansa (menos quanto mais barrou). */
export function processarContencao(estado: EstadoJogo, ctx: ContextoSimulacao, dono: Entidade, saida: EventoSimulacao[]): void {
  const c = dono.movimentoClasse?.contencao;
  if (!c) return;
  const urso = feraEmCampo(estado, dono);
  const tick = estado.tick;
  if (tick < c.ateTick && vivo(dono)) {
    if (urso && petDoCompanheiro(urso) === 'urso') {
      if (urso.x !== c.x || urso.y !== c.y) posicionar(urso, c.x, c.y);
      urso.caminho = [];
      urso.waypoints = [];
      urso.direcao = 'parado';
    }
    return;
  }
  delete dono.movimentoClasse?.contencao;
  const f = feras(ctx).urso.contencao;
  const empurra = Math.floor(leituraDoPet(ctx, dono, 'urso', 'contencaoEmpurra'));
  if (empurra > 0) {
    for (const o of estado.entidades) {
      if (!vivo(o) || o.invocacao?.companheiro || Math.hypot(o.px - c.x, o.py - c.y) > c.raio + 1.5 || !podeFerir(dono, o, ctx.modo)) continue;
      aplicarEfeito(estado, ctx, o, construirEfeito('empurrao', { valor: empurra }), { id: dono.id, x: c.x, y: c.y }, null, saida);
    }
  }
  const desconto = Math.min(f.descontoMaxPct, c.bloqueado) / 100;
  cansar(estado, ctx, dono, 'urso', saida, 1 - desconto);
}

/**
 * O golpe mágico que vem de fora do Círculo de Contenção não entra em quem está dentro (o dono, o urso, os aliados).
 * Cada magia barrada conta `bloqueioVidaPct`% da vida do dono (o Sobrevivente conta mais) para encurtar o descanso.
 */
export function barradoPelaContencao(estado: EstadoJogo, ctx: ContextoSimulacao, alvo: Entidade, hab: Habilidade, atacanteId: string): boolean {
  if (hab.tipoAtaque !== 'magico' || hab.formulaDano === null) return false;
  const tick = estado.tick;
  for (const dono of estado.entidades) {
    const c = dono.movimentoClasse?.contencao;
    if (!c || tick >= c.ateTick || !vivo(dono)) continue;
    if (Math.hypot(alvo.px - c.x, alvo.py - c.y) > c.raio + 0.5) continue;
    if (alvo !== dono && alvo.invocacao?.donoId !== dono.id && !podeAjudar(dono, alvo, ctx.modo)) continue;
    const atacante = buscarEntidade(estado, atacanteId);
    if (atacante && (Math.hypot(atacante.px - c.x, atacante.py - c.y) <= c.raio + 0.5 || !podeFerir(dono, atacante, ctx.modo))) continue;
    c.bloqueado += feras(ctx).urso.contencao.bloqueioVidaPct * (1 + leituraDoPet(ctx, dono, 'urso', 'bloqueioMaisPct') / 100);
    return true;
  }
  return false;
}

/** O pet da montaria em curso (o voo do falcão, o lobo, o urso). */
export const petDaMontaria = (pet: string | null | undefined): Pet | null => (pet === 'falcao' || pet === 'lobo' || pet === 'urso' ? pet : null);
