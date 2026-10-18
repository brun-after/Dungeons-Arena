import { novaMemoria } from '../combat/estado-tatico';
// Mortes, XP, revivescência e respawn (§2.7 "Morte", §2.12) — etapa 8 do tick.
// HP 0 é morte direta. Entidades de IA saem do mundo e voltam pelo respawn agendado, com o mesmo
// id e a geração incrementada; jogadores reaparecem pelas regras do modo (§2.13).
// Marco 6 (13/10/2026): XP sobe de nível e inimigos soltam itens. A perda de XP e ouro na morte
// da campanha entra no 10A. Marco 9A (14/10/2026): ouro nos drops; morrer fecha baú e loja.

import { abateDe, sortearOrigensRaras, type Abate } from './missoes';
import { dispararGanchosDe, passivosDe } from './ganchos-do-portador';
import type { ContextoSimulacao } from '../core/contexto';
import { buscarEntidade, type EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import { vivo, type Entidade } from '../entities/entidade';
import { criarInimigo } from '../entities/fabrica';
import { aleatorio, inteiro, proximoU32, criarRng, hashTexto } from '../core/rng';
import { idGerada } from '../combat/chave-habilidade';
import { fatoresDoMundo, ladoDoJogador } from '../modos/dificuldade';
import { podeFerir } from '../modos/relacao';
import { atrasoDeRespawnTicks, localDeRespawn, penalidadeDeMorte, podeRespawnar, protecaoDeRespawnTicks } from '../modos/regras';
import { celulaLivrePara } from '../world/colisao';
import { passavel } from '../world/fase';
import { tentarDominar } from '../combat/efeitos-fluxo';
import { explodirSeIsca } from '../combat/invocacoes';
import { sortearEfeitoDeOrbe } from '../combat/registro-efeitos';
import { encerrarInteracao } from '../world/interacao';
import { aoMorrerBoss } from '../world/portas';
import { largarItem, largarObjeto, largarOrbeEfeito, largarOuro, largarPerto } from '../world/objetos';
import { concederXpDeProgressao, perderXp } from './nivel';
import { ID_LIVRO_RARO } from './itens';
import { familiaDaHabilidade } from './itens-progressao';
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
  // Marco 15: a recompensa da dificuldade e do grupo vale para quem derruba o mundo (não entre jogadores).
  const recompensa = ladoDoJogador(estado, morto) ? 1 : fatoresDoMundo(estado, ctx).recompensa;
  const total = Math.max(1, Math.round(morto.xpBase * ctx.balance.xp.decaimentoAntifarm ** morto.abates * recompensa));
  const cota = Math.max(1, Math.round(total / participantes.length));
  for (const p of participantes) {
    const faixa = ctx.balance.xp.faixaAvancada;
    const fator = p.nivel >= faixa.nivelInicio && ctx.modo.sobrevivencia.estudoAvanca
      ? faixa.percentuais[estado.dificuldade] / ctx.balance.dificuldades[estado.dificuldade].recompensaPct : 1;
    // Na faixa avançada, usa a cota antes do arredondamento e do mínimo de 1 XP.
    const bruto = p.nivel >= faixa.nivelInicio && ctx.modo.sobrevivencia.estudoAvanca
      ? morto.xpBase * ctx.balance.xp.decaimentoAntifarm ** morto.abates * recompensa / participantes.length : cota;
    concederXpDeProgressao(p, ctx, bruto * fator, estado.tick, saida);
  }
}

export function processarMortes(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): Abate[] {
  const abates: Abate[] = [];
  const removidos = new Set<string>();
  for (const e of estado.entidades) {
    if (e.morto || e.hp > 0) continue;
    // Marco 18 (D-069): o item que renasce (uma vez por fase) devolve a vida em vez de deixar cair.
    if (e.bolsa && e.renascerFase !== estado.faseId) {
      const pct = passivosDe(ctx, e).renascerPct;
      if (pct > 0) {
        e.renascerFase = estado.faseId;
        e.hp = Math.max(1, Math.round((e.hpMax * pct) / 100));
        saida.push({ t: 'renasceu', tick: estado.tick, id: e.id, hp: e.hp });
        continue;
      }
    }
    const porId = e.participacao.reduce<{ id: string; tick: number } | null>(
      // A participação é inserida na ordem dos golpes: o último do mesmo tick dá o abate.
      (ultimo, p) => (!ultimo || p.tick >= ultimo.tick ? p : ultimo),
      null,
    );
    e.morto = true;
    if (e.tatica) e.tatica = novaMemoria();
    zerarMovimento(e);
    // Baú ou loja abertos se fecham: libera o congelamento e arma a recarga da loja (§2.12).
    encerrarInteracao(estado, ctx, e, saida);
    saida.push({ t: 'morreu', tick: estado.tick, id: e.id, porId: porId?.id ?? null });
    // Marco 18: os ganchos "ao abater" de quem derrubou (com a habilidade do último golpe, se foi dele).
    const quemAbateu = porId ? buscarEntidade(estado, porId.id) : undefined;
    if (quemAbateu) {
      // D-071 (17/10/2026): metade da vida que falta, uma vez por morte confirmada.
      // Aliados do jogador não ganham a cura de inimigo; mortes simultâneas não ressuscitam o matador.
      if (quemAbateu.controlador === 'ia' && !ladoDoJogador(estado, quemAbateu) && vivo(quemAbateu) && podeFerir(quemAbateu, e, ctx.modo)) {
        const cura = Math.round((quemAbateu.hpMax - quemAbateu.hp) * ctx.balance.recursos.curaNpcAoAbaterPct / 100);
        quemAbateu.hp = Math.min(quemAbateu.hpMax, quemAbateu.hp + cura);
        if (cura > 0) saida.push({ t: 'efeitoResultado', tick: estado.tick, alvoId: quemAbateu.id, origemId: quemAbateu.id, tipo: 'cura', dano: 0, cura, mana: 0 });
      }
      const abate = abateDe(ctx, quemAbateu, e);
      abates.push(abate);
      dispararGanchosDe(estado, ctx, quemAbateu, 'aoMatar', { outro: e, hab: abate.golpe ?? null }, saida);
      // Marco 18 (D-070): os drops que só existem nesta situação.
      sortearOrigensRaras(estado, ctx, abate, saida);
    }

    if (e.controlador === 'ia') {
      // Marco 10A-3: abate de invocação conta na rampa dela; a isca explosiva explode ao cair.
      const matador = porId ? buscarEntidade(estado, porId.id) : undefined;
      if (matador?.invocacao && !e.invocacao) matador.invocacao.abates++;
      explodirSeIsca(estado, ctx, e, saida);
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
          // Marco 14: as habilidades geradas da instância voltam com ela.
          habilidades: e.habilidades.filter((h) => !ctx.conteudo.presets.get(e.preset)?.habilidades.includes(h)),
        });
      }
    } else {
      // Marco 10A-2: a morte do jogador custa XP e ouro onde o modo manda (§2.12).
      penalizar(estado, ctx, e, saida);
      // Marco 17 (D-063): onde o modo recompensa abater jogadores (a arena com a ficha inteira), quem derrubou ganha XP
      // (com o decaimento por abates, contra o farm) e, na primeira queda, o drop.
      if (ctx.modo.recompensaJogador && e.xpBase > 0) {
        concederXp(estado, ctx, e, saida);
        if (e.abates === 0) largarDrops(estado, ctx, e, saida);
      }
    }
    if (e.controlador !== 'ia' && podeRespawnar(ctx.modo)) {
      // Jogador: reaparece pelas regras do modo (§2.13), sem penalidade de campanha na arena.
      e.reviverEmTick = estado.tick + Math.max(1, atrasoDeRespawnTicks(ctx.modo, e.abates));
      e.abates++;
    }
  }
  if (removidos.size > 0) estado.entidades = estado.entidades.filter((e) => !removidos.has(e.id));

  reviverJogadores(estado, ctx, saida);
  processarRespawns(estado, ctx, saida);
  return abates;
}

/** Penalidade de morte do modo: XP (com ou sem perder nível) e uma fração sorteada do ouro. */
function penalizar(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, saida: EventoSimulacao[]): void {
  const p = penalidadeDeMorte(ctx.modo);
  if (!p || !e.bolsa) return;
  const xpAntes = e.xp;
  const niveis = perderXp(e, ctx, p.xp, p.perdeNivel);
  const pct = inteiro(estado.rng, p.ouroPctMin, p.ouroPctMax);
  const ouro = Math.floor((e.bolsa.ouro * pct) / 100);
  e.bolsa.ouro -= ouro;
  saida.push({ t: 'penalidadeMorte', tick: estado.tick, id: e.id, xp: niveis > 0 ? p.xp : xpAntes - e.xp, ouro, niveis });
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
  const ouro = Math.round(e.xpBase * d.ouroPorXp * (0.5 + aleatorio(estado.rng)) * fatoresDoMundo(estado, ctx).recompensa);
  if (ouro > 0) largarPerto(ctx, e.x, e.y, (x, y) => largarOuro(estado, ouro, x, y, saida));
  // Marco 14: livro raro, com uma habilidade gerada pela semente no nível do inimigo (D-057).
  const livro = ctx.conteudo.itens.get(ID_LIVRO_RARO);
  if (livro && aleatorio(estado.rng) < ctx.balance.geracao.chanceLivroRaro) {
    const ref = idGerada(proximoU32(estado.rng), e.nivel);
    largarPerto(ctx, e.x, e.y, (x, y) => largarItem(estado, livro.id, x, y, saida, 1, undefined, ref));
  }
  const boss = e.arquetipo === 'boss';
  // D-075: essências temáticas têm sorteio independente, sem deslocar o RNG do combate e do loot existente.
  const rngEssencia = criarRng(hashTexto(`${estado.faseId}/${e.id}/${e.nivel}/essencia`));
  const chance = boss ? ctx.balance.progressaoItens.essenciaBossChancePct : ctx.balance.progressaoItens.essenciaChancePct;
  if (ctx.modo.sobrevivencia.estudoAvanca && aleatorio(rngEssencia) * 100 < chance) {
    const familias = [...new Set([e.ataqueBasico, ...e.habilidades].map((h) => familiaDaHabilidade(ctx, h)).filter(Boolean))];
    const familia = boss ? 'fusao' : familias[inteiro(rngEssencia, 0, Math.max(0, familias.length - 1))] ?? 'arcana';
    const essencia = ctx.conteudo.itens.get(`essencia_${familia}`);
    if (essencia) largarPerto(ctx, e.x, e.y, (x, y) => largarItem(estado, essencia.id, x, y, saida));
  }
  if (aleatorio(estado.rng) >= (boss ? d.chanceItemBoss : d.chanceItem)) return;
  const item = sortearItem(estado, ctx, boss, e.nivel);
  if (!item) return;
  largarPerto(ctx, e.x, e.y, (x, y) => largarItem(estado, item.id, x, y, saida));
}

function celulaLivreParaRenascer(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, c: { x: number; y: number }): { x: number; y: number } {
  const outras = estado.entidades.filter((x) => x !== e && !x.morto);
  for (let r = 0; r <= 4; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = c.x + dx;
        const y = c.y + dy;
        if (passavel(ctx.fase, x, y) && celulaLivrePara(e, x, y, outras, ctx.balance.colisao)) return { x, y };
      }
    }
  }
  return c;
}

function reviverJogadores(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  for (const e of estado.entidades) {
    if (!e.morto || e.reviverEmTick === 0 || estado.tick < e.reviverEmTick) continue;
    const preferido = localDeRespawn(estado, ctx.fase, ctx.modo, e, estado.rng);
    e.morto = false;
    // Ajuste de 16/10/2026: renascer numa célula que alguém ocupa ou está entrando juntava os dois; a mais próxima
    // livre (até 4 células, em anéis) resolve.
    e.reviverEmTick = 0;
    e.hp = e.hpMax;
    const local = celulaLivreParaRenascer(estado, ctx, e, preferido);
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
    const e = criarInimigo(preset, r.id, r.x, r.y, ctx.balance, { nivel: r.nivel, habilidadesExtras: r.habilidades });
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
