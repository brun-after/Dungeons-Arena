import { extraGuerreiro, protecaoInicial, pulsarAura } from './ajustes-classes';
// Efeitos de fluxo próprio (§2.8, §2.9, §2.11). Marco 8A-2 (14/10/2026), D-049.
//   efeito_atrasado  -> estado.atrasados, dispara o efeito carregado no alvo depois do prazo;
//   rastro_*         -> status na entidade; cada célula por onde ela passa vira rastro (estado.rastros);
//   armadilha        -> estado.armadilhas, disparo único no primeiro hostil (por `relacao()`);
//   invocar          -> entidades `invocacao` da equipe do dono, com prazo e limite do modo;
//   dominar_ao_matar -> status no alvo; quem morre com ele volta do lado de quem o aplicou.
// Tudo passa pelo dispatcher único (`aplicarEfeito`); aqui ficam o estado e os gatilhos por tick.
// Marco 10A-3 (14/10/2026): comportamento e avatar vindos do preset, avatares contados à parte,
// cascata de dominação em dados, dispensa e a explosão da isca (D-054).

import type { Celula, EntidadeId } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import { buscarEntidade, type Armadilha, type EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import { posicionar, vivo, type Entidade } from '../entities/entidade';
import { criarInimigo } from '../entities/fabrica';
import { podeFerir } from '../modos/relacao';
import { celulaLivrePara, ordemRotativa } from '../world/colisao';
import { passavel } from '../world/fase';
import { aprenderArmadilha } from '../world/perigos';
import { celulaOcupada } from './geometria';
import { registrarParticipacao } from './participacao';
import { rolar } from './dados';
import { REGISTRO_EFEITOS, type EfeitoCanonico } from './registro-efeitos';

export interface OrigemFluxo {
  id: EntidadeId;
  x: number;
  y: number;
}

/** Dano direto (rastro, armadilha): sem rolagem, respeitando imunidade; conta participação. */
export type AplicarDireto = (alvo: Entidade, ef: EfeitoCanonico, origem: OrigemFluxo, mira: Celula | null) => void;

/** Invocações vivas (não dominadas e que não são avatar) de um dono. */
export function contarInvocacoes(estado: EstadoJogo, donoId: EntidadeId): number {
  // Marco 22: o falcão do Aventureiro tem vaga própria.
  // Marco 24: as temporárias (Levante profano) ficam fora do limite.
  return estado.entidades.filter((e) => vivo(e) && e.invocacao?.donoId === donoId && !e.invocacao.dominado && !e.invocacao.avatar && !e.invocacao.companheiro && !e.invocacao.extra).length;
}

export function contarAvatares(estado: EstadoJogo, donoId: EntidadeId): number {
  return estado.entidades.filter((e) => vivo(e) && e.invocacao?.donoId === donoId && e.invocacao.avatar).length;
}

/** O Necromante tem dois espaços próprios adicionais; todos os seus mortos contam no mesmo teto. */
export function limiteDeInvocacoes(ctx: ContextoSimulacao, dono: Entidade): number {
  const necromante = (dono.classeId ?? dono.bolsa?.classeId) === 'necromante';
  return ctx.modo.limites.invocacoesPorJogador + (necromante ? ctx.balance.necromancia.servosExtras : 0);
}

/** Só as de habilidade contam no limite do modo (as de fase e do spawner não têm dono jogador). */
export function contarArmadilhas(estado: EstadoJogo, donoId: EntidadeId): number {
  return estado.armadilhas.filter((a) => a.donoId === donoId && a.origem === 'habilidade').length;
}

/** Os limites do modo valem antes de cobrar recurso e recarga (§5.6): a ação é recusada inteira. */
export function excedeLimite(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, efeitos: readonly EfeitoCanonico[]): boolean {
  const lim = ctx.modo.limites;
  let invocacoes = contarInvocacoes(estado, ator.id);
  let avatares = contarAvatares(estado, ator.id);
  let armadilhas = contarArmadilhas(estado, ator.id);
  for (const ef of efeitos) {
    if (ef.tipo === 'invocar_temporario') continue;
    const fluxo = REGISTRO_EFEITOS[ef.tipo].fluxo;
    const avatar = fluxo === 'invocar' && ef.ref !== null && ctx.conteudo.presets.get(ef.ref)?.invocacao?.avatar === true;
    if (avatar) avatares += Math.max(1, ef.valor);
    else if (fluxo === 'invocar') invocacoes += Math.max(1, ef.valor);
    if (fluxo === 'armadilha') armadilhas += 1;
  }
  return invocacoes > limiteDeInvocacoes(ctx, ator) || avatares > lim.avataresPorJogador || armadilhas > lim.armadilhasPorJogador;
}

export function agendarAtrasado(estado: EstadoJogo, alvo: Entidade, ef: EfeitoCanonico, origem: OrigemFluxo): void {
  if (!ef.interno) return;
  estado.atrasados.push({
    alvoId: alvo.id,
    origemId: origem.id,
    origemX: origem.x,
    origemY: origem.y,
    disparaTick: estado.tick + ticksDe(ef.duracaoMs),
    efeito: { ...ef.interno, interno: null },
  });
}

export function armarArmadilha(
  estado: EstadoJogo,
  ctx: ContextoSimulacao,
  dono: Entidade,
  ef: EfeitoCanonico,
  mira: Celula | null,
  saida: EventoSimulacao[],
): void {
  const c = mira ?? { x: dono.x, y: dono.y };
  if (!passavel(ctx.fase, c.x, c.y) || estado.armadilhas.some((a) => a.x === c.x && a.y === c.y)) return;
  const id = estado.proximoId++;
  estado.armadilhas.push({
    id,
    donoId: dono.id,
    equipeDono: dono.equipe,
    x: c.x,
    y: c.y,
    valor: ef.valor,
    interno: ef.interno ? { ...ef.interno, interno: null } : null,
    ateTick: estado.tick + ticksDe(ef.duracaoMs),
    origem: 'habilidade',
    permanente: false,
    rearmeTicks: 0,
    inerteAteTick: 0,
    reveladaPara: [],
  });
  saida.push({ t: 'armadilhaArmada', tick: estado.tick, donoId: dono.id, armadilhaId: id, x: c.x, y: c.y });
}

/** Células livres ao redor do dono, das mais próximas às mais distantes (até 2), em ordem fixa. */
function vizinhasLivres(estado: EstadoJogo, ctx: ContextoSimulacao, quem: Entidade, centro: Celula): Celula[] {
  const livres: Celula[] = [];
  for (let r = 1; r <= 2; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = centro.x + dx;
        const y = centro.y + dy;
        if (passavel(ctx.fase, x, y) && celulaLivrePara(quem, x, y, estado.entidades, ctx.balance.colisao)) livres.push({ x, y });
      }
    }
  }
  return livres;
}

export function invocar(estado: EstadoJogo, ctx: ContextoSimulacao, dono: Entidade, ef: EfeitoCanonico, saida: EventoSimulacao[]): void {
  const preset = ef.ref ? ctx.conteudo.presets.get(ef.ref) : undefined;
  if (!preset) return;
  for (let i = 0; i < Math.max(1, ef.valor); i++) {
    const e = criarInimigo(preset, `v${estado.proximoId++}`, dono.x, dono.y, ctx.balance);
    const p = preset.invocacao;
    if (p?.avatar) e.tipo = 'avatar';
    const lugar = vizinhasLivres(estado, ctx, e, celulaOcupada(dono))[0];
    if (!lugar) return;
    tornarInvocacao(e, dono, estado.tick, estado.tick + ticksDe(ef.duracaoMs), 0, p?.avatar ? 'avatar' : 'invocacao');
    if (e.invocacao && p) {
      e.invocacao.comportamento = p.comportamento;
      e.invocacao.avatar = p.avatar;
      // Avatar (§2.9): golpesRestantes = rolar('1d4') (ou a fórmula do preset), pelo PRNG do estado.
      if (p.golpes) e.invocacao.golpesRestantes = Math.max(1, rolar(estado.rng, p.golpes).total);
    }
    if (e.invocacao && ef.tipo === 'invocar_temporario') e.invocacao.extra = true;
    posicionar(e, lugar.x, lugar.y);
    e.origemX = lugar.x;
    e.origemY = lugar.y;
    estado.entidades.push(e);
    saida.push({ t: 'invocou', tick: estado.tick, donoId: dono.id, id: e.id });
  }
}

/**
 * Invocação herda a equipe do dono (§2.9) e não dá XP nem drops a quem a derrota. `nivelDominacao`
 * 0 é invocação; ≥ 1, dominado. O comportamento padrão é `agressivo` (lacaios e dominados).
 */
function tornarInvocacao(e: Entidade, dono: Entidade, tick: number, expiraTick: number, nivelDominacao: number, tipo: 'invocacao' | 'avatar' = 'invocacao'): void {
  e.tipo = tipo;
  e.equipe = dono.equipe;
  e.xpBase = 0;
  e.invocacao = {
    donoId: dono.id,
    expiraTick,
    dominado: nivelDominacao > 0,
    comportamento: 'agressivo',
    avatar: false,
    golpesRestantes: 0,
    abates: 0,
    criadoTick: tick,
    nivelDominacao,
  };
}

/**
 * Dominação (§2.9): quem morre com `dominar_ao_matar` ativo volta na equipe de quem aplicou, com
 * parte do HP e por um tempo. A cascata é limitada por `balance.invocacoes.cascataDominacao`: com 1,
 * dominados não dominam. Devolve se dominou.
 */
export function tentarDominar(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, saida: EventoSimulacao[]): boolean {
  if (e.controlador !== 'ia' || e.invocacao?.dominado) return false;
  const marca = e.efeitos.find((f) => REGISTRO_EFEITOS[f.tipo].domina && f.ateTick > estado.tick);
  const dono = marca ? buscarEntidade(estado, marca.origemId) : undefined;
  const nivelDono = dono?.invocacao?.nivelDominacao ?? 0;
  if (!dono || !vivo(dono) || nivelDono >= ctx.balance.invocacoes.cascataDominacao) return false;
  const regras = ctx.balance.efeitos;
  tornarInvocacao(e, dono, estado.tick, estado.tick + ticksDe(regras.dominacaoMs), nivelDono + 1);
  e.hp = Math.max(1, Math.round((e.hpMax * regras.dominacaoHpPct) / 100));
  e.efeitos = [];
  e.participacao = [];
  e.acao = null;
  e.alvoSelecionado = null;
  e.alvoTravado = false;
  // A IA recomeça do zero, agora do outro lado.
  e.ia = null;
  saida.push({ t: 'dominou', tick: estado.tick, donoId: dono.id, id: e.id });
  return true;
}

/** Etapa 4: atrasados que vencem; invocações vencidas ou sem dono morrem; rastros e armadilhas expiram. */
export function processarFluxo(estado: EstadoJogo, aplicar: AplicarDireto): void {
  const tick = estado.tick;
  if (estado.atrasados.length > 0) {
    const vencidos = estado.atrasados.filter((a) => a.disparaTick <= tick);
    estado.atrasados = estado.atrasados.filter((a) => a.disparaTick > tick);
    for (const a of vencidos) {
      const alvo = buscarEntidade(estado, a.alvoId);
      if (alvo && vivo(alvo)) aplicar(alvo, a.efeito, { id: a.origemId, x: a.origemX, y: a.origemY }, { x: alvo.x, y: alvo.y });
    }
  }
  for (const e of estado.entidades) {
    const inv = e.invocacao;
    if (!inv || !vivo(e)) continue;
    const dono = buscarEntidade(estado, inv.donoId);
    const semDono = !inv.dominado && (!dono || !vivo(dono));
    if (tick >= inv.expiraTick || semDono) e.hp = 0;
  }
  if (estado.rastros.length > 0) estado.rastros = estado.rastros.filter((r) => r.ateTick > tick);
  if (estado.armadilhas.length > 0) estado.armadilhas = estado.armadilhas.filter((a) => a.permanente || a.ateTick > tick);
}

/**
 * Etapa 7 (gatilhos por célula): quem tem rastro ativo marca a célula onde está; quem é hostil ao
 * dono e entra numa célula de rastro é atingido uma vez por célula; armadilhas disparam no primeiro
 * hostil, na ordem rotativa do tick (sem prioridade fixa, §3.6).
 */
export function processarGatilhos(estado: EstadoJogo, ctx: ContextoSimulacao, aplicar: AplicarDireto, saida: EventoSimulacao[]): void {
  const tick = estado.tick;
  const duracao = ticksDe(ctx.balance.efeitos.rastroCelulaMs);
  for (const e of estado.entidades) {
    if (!vivo(e)) continue;
    for (const f of e.efeitos) {
      const tipoRastro = REGISTRO_EFEITOS[f.tipo].rastro;
      if (!tipoRastro || f.ateTick <= tick) continue;
      const tipo = tipoRastro === 'dano' ? 'rastro_dano' : 'rastro_efeito';
      const existente = estado.rastros.find((r) => r.x === e.x && r.y === e.y && r.donoId === e.id && r.tipo === tipo);
      if (existente) existente.ateTick = tick + duracao;
      else {
        estado.rastros.push({ x: e.x, y: e.y, donoId: e.id, equipeDono: e.equipe, tipo, valor: f.valor, interno: f.interno, ateTick: tick + duracao, atingidos: [] });
      }
    }
  }
  if (estado.rastros.length === 0 && estado.armadilhas.length === 0) return;
  const ordem = ordemRotativa(estado.entidades, tick);
  for (const r of estado.rastros) {
    const dono = { id: r.donoId, equipe: r.equipeDono };
    for (const e of ordem) {
      // Ajuste de 24/10/2026 (D-091): o falcão do Aventureiro voa por cima de rastros e armadilhas.
      if (!vivo(e) || e.invocacao?.companheiro || e.x !== r.x || e.y !== r.y || r.atingidos.includes(e.id) || !podeFerir(dono, e, ctx.modo)) continue;
      r.atingidos.push(e.id);
      const efeito = r.tipo === 'rastro_dano' ? null : r.interno;
      const origem = { id: r.donoId, x: r.x, y: r.y };
      if (efeito) aplicar(e, efeito, origem, null);
      else causarDano(estado, ctx, e, r.valor, r.donoId, 'rastro_dano', saida);
    }
  }
  const disparadas = new Set<number>();
  for (const a of estado.armadilhas) {
    // Marco 9A-2: com rearme, a armadilha fica inerte depois de disparar.
    if (a.inerteAteTick > tick) continue;
    const dono = { id: a.donoId, equipe: a.equipeDono };
    const alvo = ordem.find((e) => vivo(e) && !e.invocacao?.companheiro && e.x === a.x && e.y === a.y && podeFerir(dono, e, ctx.modo));
    if (!alvo) continue;
    if (dispararArmadilha(estado, ctx, a, alvo, aplicar, saida)) disparadas.add(a.id);
  }
  if (disparadas.size > 0) estado.armadilhas = estado.armadilhas.filter((a) => !disparadas.has(a.id));
}

/**
 * Dispara a armadilha em `alvo` (dano, efeito interno e evento). Com rearme fica inerte; sem, devolve true para quem
 * chamou tirá-la. Marco 18: também usado na falha do desarme (world/armadilhas-ocultas.ts).
 */
export function dispararArmadilha(estado: EstadoJogo, ctx: ContextoSimulacao, a: Armadilha, alvo: Entidade, aplicar: AplicarDireto, saida: EventoSimulacao[]): boolean {
  const tick = estado.tick;
  const some = a.rearmeTicks <= 0;
  if (!some) a.inerteAteTick = tick + a.rearmeTicks;
  causarDano(estado, ctx, alvo, a.valor, a.donoId, 'armadilha', saida);
  if (a.interno) aplicar(alvo, a.interno, { id: a.donoId, x: a.x, y: a.y }, null);
  saida.push({ t: 'armadilhaDisparou', tick, donoId: a.donoId, armadilhaId: a.id, alvoId: alvo.id, x: a.x, y: a.y });
  // Marco 25 (25/10/2026, D-100): quem viu disparar pode aprender a contornar as armadilhas desse dono.
  aprenderArmadilha(estado, ctx, a);
  return some;
}

/** Dano fixo de rastro ou armadilha: respeita `imune_dano` e conta participação para o XP. */
export function causarDano(
  estado: EstadoJogo,
  ctx: ContextoSimulacao,
  alvo: Entidade,
  valor: number,
  origemId: EntidadeId,
  tipo: 'rastro_dano' | 'armadilha',
  saida: EventoSimulacao[],
): void {
  const imune = alvo.efeitos.some((f) => f.ateTick > estado.tick && REGISTRO_EFEITOS[f.tipo].imuneDano);
  const quem = buscarEntidade(estado, origemId);
  const fator = (quem ? extraGuerreiro(ctx, quem, alvo) : 1) * protecaoInicial(estado, ctx, alvo, quem);
  const dano = imune ? 0 : Math.min(alvo.hp, Math.max(0, Math.round(valor * fator)));
  alvo.hp -= dano;
  if (quem) pulsarAura(estado, ctx, quem, alvo, dano, saida);
  if (dano > 0) registrarParticipacao(alvo, origemId, estado.tick, ctx);
  saida.push({ t: 'efeitoResultado', tick: estado.tick, alvoId: alvo.id, origemId, tipo, dano, cura: 0, mana: 0 });
}
