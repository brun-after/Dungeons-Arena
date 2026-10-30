// IA das invocações (§2.9). Marco 10A-3 (14/10/2026), D-054. Etapa 2 do tick, no lugar da IA comum
// para quem tem `invocacao`. Alvos sempre por `relacao()` (alvoOfensivoValido), com o avatar hostil
// primeiro. Raio de engajamento de 5 células; ataca adjacente (Chebyshev ≤ 1); sem alvo, segue o
// dono a 2 células. Comportamentos:
//   agressivo -> o hostil mais próximo;  assassino -> o de menor HP;
//   protetor  -> só quem ameaça o dono, a até 3 células dele, sem se afastar mais que isso do dono;
//   curador   -> não ataca: cura o dono pelo dispatcher, com recarga própria;
//   isca      -> imóvel.
//   companheiro (marco 22, D-089) -> o falcão do Aventureiro: não ataca; IA própria em ia-falcao.ts (D-091).
// Ao engajar, a invocação fica em `perseguindo` (a regeneração enxerga o perigo).

import { alvoOfensivoValido, iniciarAcao, prioridadeDeAlvo } from '../combat/acao';
import { aplicarEfeito } from '../combat/efeitos';
import { celulaOcupada, chebyshev } from '../combat/geometria';
import { construirEfeito } from '../combat/registro-efeitos';
import { ataqueDoMorto } from '../combat/sintonia-necromante';
import type { ContextoSimulacao } from '../core/contexto';
import { buscarEntidade, type EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import type { Celula } from '../core/comandos';
import { passavel } from '../world/fase';
import { pararMovimento, planejarCaminho } from '../world/movimento';
import { emPasso, vivo, type Entidade, type EstadoIa } from './entidade';
import type { PresetInvocacao, PresetInimigo } from './presets';
import { processarFalcao } from './ia-falcao';

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

// Marco 28 (30/10/2026, D-127): invocação não colide com aliado, então criaturas iguais seguiam o dono e cercavam o alvo
// pela mesma célula, uma sobre a outra. Cada uma tem um lugar próprio: o índice entre as do mesmo dono (por id).
const ANEL: readonly (readonly [number, number])[] = [[-1, 1], [1, 1], [-1, -1], [1, -1], [0, 2], [-2, 0], [2, 0], [0, -2], [-2, 2], [2, 2], [-2, -2], [2, -2]];
const VIZINHAS: readonly (readonly [number, number])[] = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]];

function irmas(estado: EstadoJogo, e: Entidade): Entidade[] {
  const dono = e.invocacao?.donoId;
  if (!dono) return [];
  return estado.entidades.filter((x) => vivo(x) && x.invocacao?.donoId === dono && !x.invocacao.companheiro).sort((a, b) => (a.id < b.id ? -1 : 1));
}

/** A célula da vez em volta de `centro`, a partir do índice de `e` entre as irmãs, pulando paredes e irmãs. */
function lugarProprio(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, centro: Celula, offsets: readonly (readonly [number, number])[]): Celula | null {
  const lista = irmas(estado, e);
  const i = Math.max(0, lista.indexOf(e));
  for (let k = 0; k < offsets.length; k++) {
    const [dx, dy] = offsets[(i + k) % offsets.length] ?? [0, 0];
    const c = { x: centro.x + dx, y: centro.y + dy };
    if (!passavel(ctx.fase, c.x, c.y)) continue;
    if (lista.some((x) => x !== e && celulaOcupada(x).x === c.x && celulaOcupada(x).y === c.y)) continue;
    return c;
  }
  return null;
}

/** Outra irmã com id menor está na mesma célula: esta é quem sai. */
function empilhada(estado: EstadoJogo, e: Entidade): boolean {
  const aqui = celulaOcupada(e);
  return irmas(estado, e).some((x) => x.id < e.id && celulaOcupada(x).x === aqui.x && celulaOcupada(x).y === aqui.y);
}

function seguirDono(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, dono: Entidade | undefined): void {
  if (!dono || !vivo(dono) || emPasso(e) || e.caminho.length > 0) return;
  const perto = chebyshev(celulaOcupada(e), celulaOcupada(dono)) <= ctx.balance.invocacoes.distanciaDono;
  if (perto && !empilhada(estado, e)) return;
  const lugar = lugarProprio(estado, ctx, e, celulaOcupada(dono), ANEL) ?? { x: dono.x, y: dono.y };
  planejarCaminho(e, lugar, ctx, estado.tick, [], ctx.balance.ia.maxPassosPerseguicao);
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
  // Marco 28 (D-127): a Flecha-âncora do Arqueiro não anda; atira no hostil mais perto no alcance do básico dela.
  if (inv.comportamento === 'torre') {
    atirarDaTorre(estado, ctx, e, ia, preset, saida);
    return;
  }
  if (inv.comportamento === 'curador') {
    if (preset.invocacao) curarDono(estado, ctx, e, dono, preset.invocacao, saida);
    mudarModo(ia, 'patrulha', null, estado.tick);
    seguirDono(estado, ctx, e, dono);
    return;
  }
  // Ajuste de 24/10/2026 (D-091): o falcão do Aventureiro tem IA própria (passeia, mergulha e recolhe).
  if (inv.comportamento === 'companheiro') {
    processarFalcao(estado, ctx, e, ia, dono, saida);
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
  // Marco 24 (D-095): com a vertente Lich, os mortos atiram de longe.
  const lich = ataqueDoMorto(estado, ctx, e);
  if (chebyshev(celulaOcupada(e), celulaAlvo) <= (lich?.alcance ?? 1)) {
    // Na mesma célula de uma irmã: dá um passo para outra vizinha do alvo antes de golpear.
    if (!emPasso(e) && e.caminho.length === 0 && empilhada(estado, e)) {
      const lugar = lugarProprio(estado, ctx, e, celulaAlvo, VIZINHAS);
      if (lugar) {
        planejarCaminho(e, lugar, ctx, estado.tick, saida, ctx.balance.ia.maxPassosPerseguicao);
        return;
      }
    }
    if (!emPasso(e) && e.caminho.length === 0) pararMovimento(e);
    if (!e.acao && estado.tick >= ia.proximoAtaqueTick && iniciarAcao(estado, ctx, e, lich?.habilidade ?? e.ataqueBasico, alvo.id, saida)) {
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
  planejarCaminho(e, lugarProprio(estado, ctx, e, celulaAlvo, VIZINHAS) ?? celulaAlvo, ctx, estado.tick, saida, ctx.balance.ia.maxPassosPerseguicao);
}

function atirarDaTorre(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, ia: EstadoIa, preset: PresetInimigo, saida: EventoSimulacao[]): void {
  const alvo = escolherAlvo(estado, ctx, e, undefined);
  mudarModo(ia, alvo ? 'perseguindo' : 'patrulha', alvo?.id ?? null, estado.tick);
  if (!alvo || e.acao || estado.tick < ia.proximoAtaqueTick) return;
  if (iniciarAcao(estado, ctx, e, e.ataqueBasico, alvo.id, saida)) ia.proximoAtaqueTick = estado.tick + ticksDe(preset.intervaloAtaqueMs);
}
