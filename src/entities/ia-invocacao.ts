// IA das invocações (§2.9). Marco 10A-3 (14/10/2026), D-054. Etapa 2 do tick, no lugar da IA comum
// para quem tem `invocacao`. Alvos sempre por `relacao()` (alvoOfensivoValido), com o avatar hostil
// primeiro. Raio de engajamento de 5 células; ataca adjacente (Chebyshev ≤ 1); sem alvo, segue o
// dono a 2 células. Comportamentos:
//   agressivo -> o hostil mais próximo;  assassino -> o de menor HP;
//   protetor  -> só quem ameaça o dono, a até 3 células dele, sem se afastar mais que isso do dono;
//   curador   -> não ataca: cura o dono pelo dispatcher, com recarga própria;
//   isca      -> imóvel.
// Ao engajar, a invocação fica em `perseguindo` (a regeneração enxerga o perigo).

import { alvoOfensivoValido, iniciarAcao, prioridadeDeAlvo } from '../combat/acao';
import { aplicarEfeito } from '../combat/efeitos';
import { celulaOcupada, chebyshev } from '../combat/geometria';
import { construirEfeito } from '../combat/registro-efeitos';
import type { ContextoSimulacao } from '../core/contexto';
import { buscarEntidade, type EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import { pararMovimento, planejarCaminho } from '../world/movimento';
import { emPasso, vivo, type Entidade, type EstadoIa } from './entidade';
import type { PresetInvocacao, PresetInimigo } from './presets';

const chaveCura = (id: string) => `${id}_cura_invocacao`;

function ameacaODono(estado: EstadoJogo, x: Entidade, dono: Entidade, janelaTicks: number): boolean {
  if (x.ia?.alvoId === dono.id) return true;
  return dono.participacao.some((p) => p.id === x.id && estado.tick - p.tick <= janelaTicks);
}

/** O alvo da vez pelo comportamento; avatar hostil sempre primeiro. */
function escolherAlvo(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, dono: Entidade | undefined): Entidade | null {
  const inv = e.invocacao;
  if (!inv) return null;
  const r = ctx.balance.invocacoes;
  const origem = celulaOcupada(e);
  const janela = ticksDe(ctx.balance.combate.janelaParticipacaoS * 1000);
  let melhor: Entidade | null = null;
  let chaveMelhor: number[] = [];
  for (const x of estado.entidades) {
    if (x.id === e.id || !alvoOfensivoValido(estado, ctx, e, x)) continue;
    const d = chebyshev(origem, celulaOcupada(x));
    if (d > r.raioEngajamento) continue;
    if (inv.comportamento === 'protetor') {
      if (!dono || chebyshev(celulaOcupada(dono), celulaOcupada(x)) > r.raioProtetor || !ameacaODono(estado, x, dono, janela)) continue;
    }
    const chave = inv.comportamento === 'assassino' ? [prioridadeDeAlvo(x), x.hp, d] : [prioridadeDeAlvo(x), d, x.hp];
    const c = melhor ? compara(chave, chaveMelhor) : -1;
    if (!melhor || c < 0 || (c === 0 && x.id < melhor.id)) {
      melhor = x;
      chaveMelhor = chave;
    }
  }
  return melhor;
}

function compara(a: readonly number[], b: readonly number[]): number {
  for (let i = 0; i < a.length; i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

function seguirDono(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, dono: Entidade | undefined): void {
  if (!dono || !vivo(dono) || emPasso(e) || e.caminho.length > 0) return;
  if (chebyshev(celulaOcupada(e), celulaOcupada(dono)) <= ctx.balance.invocacoes.distanciaDono) return;
  planejarCaminho(e, { x: dono.x, y: dono.y }, ctx, estado.tick, [], ctx.balance.ia.maxPassosPerseguicao);
}

function curarDono(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, dono: Entidade | undefined, p: PresetInvocacao, saida: EventoSimulacao[]): void {
  const cura = p.cura;
  if (!cura || !dono || !vivo(dono) || dono.hp >= dono.hpMax) return;
  if (chebyshev(celulaOcupada(e), celulaOcupada(dono)) > ctx.balance.invocacoes.raioEngajamento) return;
  const chave = chaveCura(e.id);
  if ((estado.recargas[chave] ?? 0) > estado.tick) return;
  estado.recargas[chave] = estado.tick + ticksDe(cura.recargaMs);
  const antes = dono.hp;
  aplicarEfeito(estado, ctx, dono, construirEfeito('cura', { valor: cura.valor }), { id: e.id, x: e.x, y: e.y }, null, saida);
  saida.push({ t: 'invocacaoCurou', tick: estado.tick, id: e.id, donoId: dono.id, cura: dono.hp - antes });
}

function mudarModo(ia: EstadoIa, modo: EstadoIa['modo'], alvoId: string | null, tick: number): void {
  if (ia.modo === modo && ia.alvoId === alvoId) return;
  ia.modo = modo;
  ia.alvoId = alvoId;
  ia.modoDesdeTick = tick;
  ia.alvoCacheX = -1;
  ia.alvoCacheY = -1;
}

export function processarInvocacao(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, ia: EstadoIa, preset: PresetInimigo, saida: EventoSimulacao[]): void {
  const inv = e.invocacao;
  if (!inv) return;
  const dono = buscarEntidade(estado, inv.donoId);
  if (inv.comportamento === 'isca') return;
  if (inv.comportamento === 'curador') {
    if (preset.invocacao) curarDono(estado, ctx, e, dono, preset.invocacao, saida);
    mudarModo(ia, 'patrulha', null, estado.tick);
    seguirDono(estado, ctx, e, dono);
    return;
  }
  const alvo = escolherAlvo(estado, ctx, e, dono);
  // O protetor não se afasta do dono além do raio dele.
  const longeDemais = inv.comportamento === 'protetor' && dono !== undefined && chebyshev(celulaOcupada(e), celulaOcupada(dono)) > ctx.balance.invocacoes.raioProtetor;
  if (!alvo || longeDemais) {
    mudarModo(ia, 'patrulha', null, estado.tick);
    seguirDono(estado, ctx, e, dono);
    return;
  }
  mudarModo(ia, 'perseguindo', alvo.id, estado.tick);
  const celulaAlvo = celulaOcupada(alvo);
  if (chebyshev(celulaOcupada(e), celulaAlvo) <= 1) {
    if (!emPasso(e)) pararMovimento(e);
    if (!e.acao && estado.tick >= ia.proximoAtaqueTick && iniciarAcao(estado, ctx, e, e.ataqueBasico, alvo.id, saida)) {
      ia.proximoAtaqueTick = estado.tick + ticksDe(preset.intervaloAtaqueMs);
      ia.ataquesFeitos++;
    }
    return;
  }
  // Recalcula o caminho quando o alvo andou ou o caminho acabou (cache como o do perseguidor, §2.3).
  const andou = ia.alvoCacheX !== celulaAlvo.x || ia.alvoCacheY !== celulaAlvo.y;
  if (!andou && (emPasso(e) || e.caminho.length > 0 || e.waypoints.length > 0)) return;
  ia.alvoCacheX = celulaAlvo.x;
  ia.alvoCacheY = celulaAlvo.y;
  planejarCaminho(e, celulaAlvo, ctx, estado.tick, saida, ctx.balance.ia.maxPassosPerseguicao);
}
