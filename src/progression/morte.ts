// Mortes, XP, revivescência e respawn (§2.7 "Morte", §2.12) — etapa 8 do tick.
// HP 0 é morte direta. Entidades de IA saem do mundo e voltam pelo respawn agendado, com o mesmo
// id e a geração incrementada; jogadores na campanha revivem no spawn.
// Marco 3: a perda de XP e ouro do jogador e os drops entram com a progressão e os itens (9A, 10A).

import type { ContextoSimulacao } from '../core/contexto';
import { buscarEntidade, type EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import type { Entidade } from '../entities/entidade';
import { criarInimigo } from '../entities/fabrica';
import { podeFerir } from '../modos/relacao';

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
    saida.push({ t: 'morreu', tick: estado.tick, id: e.id, porId: porId?.id ?? null });

    if (e.controlador === 'ia') {
      concederXp(estado, ctx, e, saida);
      removidos.add(e.id);
      if (e.preset) {
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
    } else {
      e.reviverEmTick = estado.tick + ticksDe(ctx.balance.morte.reviverMs);
    }
  }
  if (removidos.size > 0) estado.entidades = estado.entidades.filter((e) => !removidos.has(e.id));

  reviverJogadores(estado, ctx, saida);
  processarRespawns(estado, ctx, saida);
}

function reviverJogadores(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  const spawn = ctx.fase.spawns[0] ?? { x: 0, y: 0 };
  for (const e of estado.entidades) {
    if (!e.morto || e.reviverEmTick === 0 || estado.tick < e.reviverEmTick) continue;
    e.morto = false;
    e.reviverEmTick = 0;
    e.hp = e.hpMax;
    e.efeitos = [];
    e.participacao = [];
    e.x = spawn.x;
    e.y = spawn.y;
    zerarMovimento(e);
    // Invisível para inimigos por alguns segundos, para se reposicionar (§2.12).
    e.invisivelAteTick = estado.tick + ticksDe(ctx.balance.morte.invisivelMs);
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
    e.geracao = r.geracao;
    e.abates = r.abates;
    estado.entidades.push(e);
    saida.push({ t: 'surgiu', tick: estado.tick, id: e.id });
  }
  estado.respawns = pendentes;
}
