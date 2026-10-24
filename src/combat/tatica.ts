// Marco 19 (17/10/2026): campos persistentes, obstáculos, aparo e cura efetiva no mesmo núcleo dos modos.
import type { Celula } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import { buscarEntidade, novoId, type EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { aleatorio } from '../core/rng';
import { ticksDe } from '../core/tempo';
import { vivo, type Entidade } from '../entities/entidade';
import { podeAjudar, podeFerir } from '../modos/relacao';
import { reservaCelula } from '../world/colisao';
import { passavel, tipoEm } from '../world/fase';
import { aplicarEfeito, type OrigemDoEfeito } from './efeitos';
import { avancar } from './efeitos-instantaneos';
import { novaMemoria, type CampoTatico } from './estado-tatico';
import { chebyshev } from './geometria';
import { passivasDaBolsa } from './perfil';
import { construirEfeito, REGISTRO_EFEITOS, type EfeitoCanonico } from './registro-efeitos';
import { agendarFase } from './fases';

export function muralhaEm(estado: EstadoJogo, x: number, y: number): CampoTatico | undefined {
  return estado.camposTaticos?.find((c) => c.tipo === 'muralha' && c.x === x && c.y === y && c.ateTick > estado.tick);
}
export function fato(ator: Entidade, nome: string, alvoId?: string, acaoId?: number): void {
  const etapa = acaoId === undefined ? undefined : ator.tatica?.etapas.find((e) => e.acaoId === acaoId);
  if (!etapa) return;
  const valor = alvoId ? `${nome}:${alvoId}` : nome;
  if (!etapa.fatos.includes(valor)) etapa.fatos.push(valor);
}

function alcancaveis(estado: EstadoJogo, ctx: ContextoSimulacao, origem: Celula, extras: Celula[]): Set<string> {
  const vistos = new Set<string>();
  const fila = [origem];
  for (let i = 0; i < fila.length; i++) {
    const p = fila[i];
    if (!p) continue;
    const k = `${p.x},${p.y}`;
    if (vistos.has(k) || !passavel(ctx.fase, p.x, p.y) || muralhaEm(estado, p.x, p.y) || extras.some((c) => c.x === p.x && c.y === p.y)) continue;
    vistos.add(k);
    fila.push({ x: p.x + 1, y: p.y }, { x: p.x - 1, y: p.y }, { x: p.x, y: p.y + 1 }, { x: p.x, y: p.y - 1 });
  }
  return vistos;
}
function criarCampo(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, tipo: CampoTatico['tipo'], p: Celula, ef: EfeitoCanonico): boolean {
  const campos = estado.camposTaticos ??= [];
  const meus = campos.filter((c) => c.donoId === ator.id && c.tipo === tipo && c.ateTick > estado.tick);
  if (meus.length >= ctx.balance.tatica.tetoCampos) return false;
  campos.push({ id: novoId(estado), tipo, donoId: ator.id, equipe: ator.equipe, x: p.x, y: p.y, raio: tipo === 'muralha' ? 0 : 1,
    ateTick: estado.tick + ticksDe(Math.min(ef.duracaoMs, tipo === 'muralha' ? ctx.balance.tatica.muralhaMaxMs : ctx.balance.tatica.campoMaxMs)), proximoPulso: estado.tick, intervaloTicks: ticksDe(1000),
    efeito: tipo === 'muralha' ? null : construirEfeito(tipo === 'cura' ? 'cura' : 'envenenado', { valor: ef.valor, duracaoMs: tipo === 'cura' ? 0 : 2000, pct: tipo === 'cura' ? 0 : 30 }) });
  return true;
}

export function executarTatica(estado: EstadoJogo, ctx: ContextoSimulacao, alvo: Entidade, ef: EfeitoCanonico, origem: OrigemDoEfeito, mira: Celula | null): void {
  const ator = buscarEntidade(estado, origem.id);
  if (!ator || !vivo(ator)) return;
  if (ef.tipo === 'purificar') {
    const negativo = alvo.efeitos.find((f) => f.ateTick > estado.tick && ctx.balance.tatica.removiveis.includes(f.tipo));
    if (negativo) { alvo.efeitos = alvo.efeitos.filter((f) => f !== negativo); fato(ator, 'purificou', alvo.id, origem.acaoId); }
  } else if (ef.tipo === 'passo_sombrio') {
    if (mira && avancar(estado, ctx, ator, mira, ef.valor)) fato(ator, 'deslocou', undefined, origem.acaoId);
  } else if (ef.tipo === 'muralha_pedra' && mira) {
    const horizontal = Math.abs(mira.x - ator.x) < Math.abs(mira.y - ator.y);
    const candidatos = [-1, 0, 1].map((d) => ({ x: mira.x + (horizontal ? d : 0), y: mira.y + (horizontal ? 0 : d) }));
    const livres = candidatos.filter((p) => passavel(ctx.fase, p.x, p.y) && !muralhaEm(estado, p.x, p.y)
      && !estado.entidades.some((e) => vivo(e) && reservaCelula(e, p.x, p.y))
      && !estado.objetos.some((o) => o.x === p.x && o.y === p.y)
      && !ctx.fase.portasInternas.some((porta) => [porta.a, porta.b].some((c) => c.x === p.x && c.y === p.y))
      && !ctx.fase.spawns.some((c) => c.x === p.x && c.y === p.y)
      && tipoEm(ctx.fase, p.x, p.y) === 'piso');
    if (!livres.length) return;
    const antes = alcancaveis(estado, ctx, ator, []);
    const depois = alcancaveis(estado, ctx, ator, livres);
    if ([...antes].some((k) => !livres.some((p) => `${p.x},${p.y}` === k) && !depois.has(k))) return;
    for (const p of livres) criarCampo(estado, ctx, ator, 'muralha', p, ef);
    fato(ator, 'muralha', undefined, origem.acaoId);
  } else if ((ef.tipo === 'campo_cura' || ef.tipo === 'campo_veneno') && mira && passavel(ctx.fase, mira.x, mira.y) && !muralhaEm(estado, mira.x, mira.y)) {
    if (criarCampo(estado, ctx, ator, ef.tipo === 'campo_cura' ? 'cura' : 'veneno', mira, ef)) fato(ator, ef.tipo === 'campo_cura' ? 'circulo' : 'nevoa', undefined, origem.acaoId);
  }
}

export function processarCampos(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  if (!estado.camposTaticos) return;
  estado.camposTaticos = estado.camposTaticos.filter((c) => c.ateTick > estado.tick);
  for (const c of estado.camposTaticos) {
    if (!c.efeito || c.proximoPulso > estado.tick) continue;
    c.proximoPulso = estado.tick + c.intervaloTicks;
    const dono = buscarEntidade(estado, c.donoId);
    if (!dono || !vivo(dono)) continue;
    for (const e of estado.entidades) {
      if (!vivo(e) || chebyshev(e, c) > c.raio || !(c.tipo === 'cura' ? podeAjudar(dono, e, ctx.modo) : podeFerir(dono, e, ctx.modo))) continue;
      aplicarEfeito(estado, ctx, e, c.efeito, dono, e, saida);
    }
  }
}

export function fluxoRestaurador(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, alvo: Entidade, cura: number, saida: EventoSimulacao[]): void {
  if (!ator.bolsa || cura <= 0) return;
  const pct = passivasDaBolsa(ctx, ator.bolsa).reduce((s, p) => s + (p.fluxoEscudoPct ?? 0), 0);
  if (pct <= 0) return;
  const mem = ator.tatica ??= novaMemoria();
  if (mem.fluxoAte > estado.tick) return;
  mem.fluxoAte = estado.tick + ticksDe(ctx.balance.tatica.fluxoIntervaloMs);
  aplicarEfeito(estado, ctx, alvo, construirEfeito('escudo', { valor: Math.min(ctx.balance.tatica.fluxoTeto, Math.max(1, Math.round(cura * pct / 100))), duracaoMs: ctx.balance.tatica.fluxoDuracaoMs }), ator, alvo, saida);
}

/** Marco 24 (D-097): a chance de esquivar golpes diretos — os estados de esquiva e as passivas (sem o teto). */
export function esquivaPct(ctx: ContextoSimulacao, e: Entidade, tick: number): number {
  let soma = 0;
  for (const f of e.efeitos) if (f.ateTick > tick && REGISTRO_EFEITOS[f.tipo].esquiva) soma += f.pct;
  if (e.bolsa) {
    const invisivel = e.invisivelAteTick > tick;
    for (const p of passivasDaBolsa(ctx, e.bolsa)) soma += (p.esquivaPct ?? 0) + (invisivel ? (p.esquivaInvisivelPct ?? 0) : 0);
  }
  return soma;
}

/**
 * Só golpes diretos chegam aqui; nenhum dano periódico. O véu e o aparo valem contra os físicos. Marco 24 (24/10/2026,
 * D-097): a esquiva somada (estado e passivas) e o Presságio valem contra qualquer golpe direto; o Contragolpe apara
 * qualquer golpe, anula o dano, atordoa quem bateu, enche a fúria e responde na hora com a habilidade do efeito.
 */
export function defenderGolpe(estado: EstadoJogo, ctx: ContextoSimulacao, alvo: Entidade, atacante: Entidade, fisico: boolean, saida: EventoSimulacao[] = []): { esquivou: boolean; fator: number } {
  if (alvo === atacante) return { esquivou: false, fator: 1 };
  const tick = estado.tick;
  const presagio = alvo.efeitos.find((f) => f.tipo === 'presagio' && f.ateTick > tick);
  if (presagio) {
    alvo.efeitos = alvo.efeitos.filter((f) => f !== presagio);
    aplicarEfeito(estado, ctx, alvo, construirEfeito('critico_garantido', {}), alvo, alvo, saida);
    return { esquivou: true, fator: 1 };
  }
  const contra = alvo.efeitos.find((f) => f.tipo === 'contragolpe' && f.ateTick > tick);
  if (contra) {
    alvo.efeitos = alvo.efeitos.filter((f) => f !== contra);
    const r = ctx.balance.estados;
    aplicarEfeito(estado, ctx, atacante, construirEfeito('atordoar', { duracaoMs: r.contragolpeAtordoarMs }), alvo, atacante, saida);
    aplicarEfeito(estado, ctx, alvo, construirEfeito('furia', { valor: r.contragolpeFuria }), alvo, alvo, saida);
    if (contra.ref) agendarFase(estado, alvo, contra.ref, atacante, 0);
    return { esquivou: false, fator: 0 };
  }
  const esquiva = Math.min(ctx.balance.estados.esquivaMaxPct, esquivaPct(ctx, alvo, tick));
  if (esquiva > 0 && aleatorio(estado.rng) * 100 < esquiva) return { esquivou: true, fator: 1 };
  if (!fisico) return { esquivou: false, fator: 1 };
  const veu = alvo.efeitos.find((f) => f.tipo === 'veu_noturno' && f.ateTick > estado.tick);
  if (veu && aleatorio(estado.rng) * 100 < Math.min(50, veu.pct)) {
    const mem = alvo.tatica ??= novaMemoria(); mem.esquivou = estado.tick;
    return { esquivou: true, fator: 1 };
  }
  const aparo = alvo.efeitos.find((f) => f.tipo === 'aparando' && f.ateTick > estado.tick);
  if (aparo) {
    alvo.efeitos = alvo.efeitos.filter((f) => f !== aparo);
    const mem = alvo.tatica ??= novaMemoria(); mem.aparou = { tick: estado.tick, atacante: atacante.id }; mem.respostaConsumida = false;
    aplicarEfeito(estado, ctx, alvo, construirEfeito('resposta_aparo', { duracaoMs: ctx.balance.tatica.respostaMs, pct: ctx.balance.tatica.respostaPct }), alvo, alvo, saida);
    return { esquivou: false, fator: Math.max(0.2, 1 - aparo.pct / 100) };
  }
  return { esquivou: false, fator: 1 };
}
