// Ciclo de vida das invocações (§2.9). Marco 10A-3 (14/10/2026), D-054.
// - Rampa: a invocação causa mais dano com o tempo vivo e com os abates, até um teto.
// - Golpes do avatar: cada dano maior que zero consome um golpe; no zero, ele cai.
// - Isca explosiva: ao cair, fere os hostis (por `relacao()`) no raio do preset.
// - Dispensa: o dono derruba as próprias invocações (não as dominadas), sem XP para ninguém.

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { msDe } from '../core/tempo';
import { vivo, type Entidade } from '../entities/entidade';
import { podeFerir } from '../modos/relacao';
import { causarDano } from './efeitos-fluxo';
import { celulaOcupada, chebyshev } from './geometria';

/** Multiplicador de dano da rampa: `1 + min(máx, porMinuto × minutos + porAbate × abates)`. */
export function rampaDeInvocacao(e: Entidade, tick: number, ctx: ContextoSimulacao): number {
  const inv = e.invocacao;
  if (!inv) return 1;
  const r = ctx.balance.invocacoes;
  const minutos = Math.max(0, msDe(tick - inv.criadoTick)) / 60_000;
  return 1 + Math.min(r.rampaMaxPct, r.rampaPorMinutoPct * minutos + r.rampaPorAbatePct * inv.abates) / 100;
}

/** Chamado por todo dano maior que zero (participacao.ts): o avatar perde um golpe. */
export function contarGolpe(alvo: Entidade): void {
  const inv = alvo.invocacao;
  if (!inv?.avatar || inv.golpesRestantes <= 0) return;
  inv.golpesRestantes--;
  if (inv.golpesRestantes === 0) alvo.hp = 0;
}

/** Isca explosiva caindo: dano em área aos hostis, uma vez. */
export function explodirSeIsca(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, saida: EventoSimulacao[]): void {
  const explosao = e.invocacao ? ctx.conteudo.presets.get(e.preset)?.invocacao?.explosao : undefined;
  if (!explosao) return;
  saida.push({ t: 'explodiu', tick: estado.tick, id: e.id, x: e.x, y: e.y, raio: explosao.raio });
  const centro = celulaOcupada(e);
  for (const alvo of estado.entidades) {
    if (alvo.id === e.id || !vivo(alvo) || chebyshev(centro, celulaOcupada(alvo)) > explosao.raio || !podeFerir(e, alvo, ctx.modo)) continue;
    causarDano(estado, ctx, alvo, explosao.dano, e.invocacao?.donoId ?? e.id, 'armadilha', saida);
  }
}

/** Comando `dispensar`: as invocações não dominadas do dono caem agora. */
export function dispensarInvocacoes(estado: EstadoJogo, dono: Entidade, saida: EventoSimulacao[]): void {
  let n = 0;
  for (const e of estado.entidades) {
    if (!vivo(e) || e.invocacao?.donoId !== dono.id || e.invocacao.dominado) continue;
    e.hp = 0;
    e.participacao = [];
    n++;
  }
  if (n > 0) saida.push({ t: 'dispensou', tick: estado.tick, id: dono.id, quantidade: n });
}
