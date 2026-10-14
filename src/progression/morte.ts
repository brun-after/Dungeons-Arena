// Mortes, XP, revivescência e respawn (§2.7 "Morte", §2.12) — etapa 8 do tick.
// HP 0 é morte direta. Entidades de IA saem do mundo e voltam pelo respawn agendado, com o mesmo
// id e a geração incrementada; jogadores reaparecem pelas regras do modo (§2.13).
// Marco 6 (13/10/2026): XP sobe de nível e inimigos soltam itens. A perda de XP e ouro na morte
// da campanha entra no 10A. Marco 9A (14/10/2026): ouro nos drops; morrer fecha baú e loja.

import type { ContextoSimulacao } from '../core/contexto';
import { buscarEntidade, type EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import type { Entidade } from '../entities/entidade';
import { criarInimigo } from '../entities/fabrica';
import { aleatorio } from '../core/rng';
import { podeFerir } from '../modos/relacao';
import { atrasoDeRespawnTicks, localDeRespawn, podeRespawnar, protecaoDeRespawnTicks } from '../modos/regras';
import { celulaLivrePara } from '../world/colisao';
import { tentarDominar } from '../combat/efeitos-fluxo';
import { sortearEfeitoDeOrbe } from '../combat/registro-efeitos';
import { encerrarInteracao } from '../world/interacao';
import { aoMorrerBoss } from '../world/portas';
import { largarItem, largarObjeto, largarOrbeEfeito, largarOuro, largarPerto } from '../world/objetos';
import { aplicarSubidas } from './nivel';
import { sortearItem } from './sorteio';

function zerarMovimento(e: Entidade): void {
  e.acao = null;
  e.direcao = 'parado';
  e.caminho = [];
  e.waypoints = [];
  e.destinoX = e.x;
  e.destinoY = e.y;
  e.progressoPasso = 0;
}

/** XP a quem abateu e a quem participou na janela (§2.7), com antifarm (§2.12). */
function concederXp(estado: EstadoJogo, ctx: ContextoSimulacao, morto: Entidade, saida: EventoSimulacao[]): void {
  if (morto.xpBase <= 0) return;
  const janela = ticksDe(ctx.balance.combate.janelaParticipacaoS * 1000);
  const participantes = morto.participacao
    .filter((p) => estado.tick - p.tick <= janela)
    .map((p) => buscarEntidade(estado, p.id))
    .filter((e): e is Entidade => e !== undefined && podeFerir(e, morto, ctx.modo))
    .sort((a, b) => (a.id < b.id ? -1 : 1));
  if (participantes.length === 0) return;
  const total = Math.max(1, Math.round(morto.xpBase * ctx.balance.xp.decaimentoAntifarm ** morto.abates));
  const cota = Math.max(1, Math.round(total / participantes.length));
  for (const p of participantes) {
    p.xp += cota;
    saida.push({ t: 'xpGanho', tick: estado.tick, id: p.id, xp: cota });
    aplicarSubidas(p, ctx, estado.tick, saida);
  }
}

export function processarMortes(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  const removidos = new Set<string>();
  for (const e of estado.entidades) {
    if (e.morto || e.hp > 0) continue;
    const porId = e.participacao.reduce<{ id: string; tick: number } | null>(
      (ultimo, p) => (!ultimo || p.tick > ultimo.tick || (p.tick === ultimo.tick && p.id < ultimo.id) ? p : ultimo),
      null,
    );
    e.morto = true;
    zerarMovimento(e);
    // Baú ou loja abertos se fecham: libera o congelamento e arma a recarga da loja (§2.12).
    encerrarInteracao(estado, ctx, e, saida);
    saida.push({ t: 'morreu', tick: estado.tick, id: e.id, porId: porId?.id ?? null });

    if (e.controlador === 'ia') {
      concederXp(estado, ctx, e, saida);
      // Boss morto abre a passagem (§2.1, marco 10A-1).
      aoMorrerBoss(estado, ctx, e, saida);
      // Invocações não soltam nada nem voltam (§2.9).
      if (e.abates === 0 && !e.invocacao) largarDrops(estado, ctx, e, saida);
      // Dominação (§2.9, marco 8A-2): volta do lado de quem a marcou, em vez de sair do mundo.
      if (tentarDominar(estado, ctx, e, saida)) {
        e.morto = false;
        continue;
      }
      removidos.add(e.id);
      if (e.preset && !e.invocacao) {
        const segundos = e.arquetipo === 'boss' ? ctx.balance.respawn.bossS : ctx.balance.respawn.inimigoS;
        estado.respawns.push({
          id: e.id,
          preset: e.preset,
          x: e.origemX,
          y: e.origemY,
          nivel: e.nivel,
          geracao: e.geracao + 1,
          abates: e.abates + 1,
          noTick: estado.tick + ticksDe(segundos * 1000),
        });
      }
    } else if (podeRespawnar(ctx.modo)) {
      // Jogador: reaparece pelas regras do modo (§2.13), sem penalidade de campanha na arena.
      e.reviverEmTick = estado.tick + Math.max(1, atrasoDeRespawnTicks(ctx.modo, e.abates));
      e.abates++;
    }
  }
  if (removidos.size > 0) estado.entidades = estado.entidades.filter((e) => !removidos.has(e.id));

  reviverJogadores(estado, ctx, saida);
  processarRespawns(estado, ctx, saida);
}

/**
 * Drops só na primeira morte (§2.10), sorteados pelo PRNG do estado: orbe de HP ou de recurso e,
 * num sorteio independente, um item (marco 6, só onde o modo solta itens).
 */
function largarDrops(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, saida: EventoSimulacao[]): void {
  if (!ctx.modo.objetosDeFase) return;
  const d = ctx.balance.drops;
  if (aleatorio(estado.rng) < d.chanceOrbeHp) {
    largarObjeto(estado, 'orbe_hp', e.x, e.y, d.orbeHpPct, 'pct', saida);
  } else if (aleatorio(estado.rng) < d.chanceOrbeRecurso) {
    largarObjeto(estado, 'orbe_recurso', e.x, e.y, d.orbeRecursoPct, 'pct', saida);
  }
  // Orbe de efeito (§2.10, marco 8A): sorteio independente; o efeito vem do registro, por peso.
  if (aleatorio(estado.rng) < d.chanceOrbeEfeito) {
    const efeito = sortearEfeitoDeOrbe(estado.rng);
    if (efeito) largarPerto(ctx, e.x, e.y, (x, y) => largarOrbeEfeito(estado, efeito, x, y, saida));
  }
  if (!ctx.modo.loot.itens) return;
  // Ouro (marco 9A): só onde o modo solta itens, proporcional ao XP do inimigo.
  const ouro = Math.round(e.xpBase * d.ouroPorXp * (0.5 + aleatorio(estado.rng)));
  if (ouro > 0) largarPerto(ctx, e.x, e.y, (x, y) => largarOuro(estado, ouro, x, y, saida));
  const boss = e.arquetipo === 'boss';
  if (aleatorio(estado.rng) >= (boss ? d.chanceItemBoss : d.chanceItem)) return;
  const item = sortearItem(estado, ctx, boss);
  if (!item) return;
  largarPerto(ctx, e.x, e.y, (x, y) => largarItem(estado, item.id, x, y, saida));
}

function reviverJogadores(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  for (const e of estado.entidades) {
    if (!e.morto || e.reviverEmTick === 0 || estado.tick < e.reviverEmTick) continue;
    const local = localDeRespawn(estado, ctx.fase, ctx.modo, e, estado.rng);
    e.morto = false;
    e.reviverEmTick = 0;
    e.hp = e.hpMax;
    e.efeitos = [];
    e.participacao = [];
    e.x = local.x;
    e.y = local.y;
    zerarMovimento(e);
    // Invisível para inimigos por alguns segundos, para se reposicionar (§2.12; duração do modo).
    e.invisivelAteTick = estado.tick + protecaoDeRespawnTicks(ctx.modo);
    saida.push({ t: 'reviveu', tick: estado.tick, id: e.id });
  }
}

function processarRespawns(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  if (estado.respawns.length === 0) return;
  const pendentes = [];
  for (const r of estado.respawns) {
    const preset = ctx.conteudo.presets.get(r.preset);
    if (estado.tick < r.noTick || !preset) {
      if (preset) pendentes.push(r);
      continue;
    }
    const e = criarInimigo(preset, r.id, r.x, r.y, ctx.balance, { nivel: r.nivel });
    // Origem ocupada por quem bloqueia: o respawn espera a célula liberar.
    if (!celulaLivrePara(e, r.x, r.y, estado.entidades, ctx.balance.colisao)) {
      pendentes.push(r);
      continue;
    }
    e.geracao = r.geracao;
    e.abates = r.abates;
    estado.entidades.push(e);
    saida.push({ t: 'surgiu', tick: estado.tick, id: e.id });
  }
  estado.respawns = pendentes;
}
