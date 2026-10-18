// Portas (§2.1). Marco 10A-1 (14/10/2026), D-052. Gatilhos por célula alcançada (etapa 7 do tick,
// §2.3): só quem chegou a uma célula neste tick (evento `moveu`) aciona porta — ficar parado em
// cima não teleporta de novo nem repete o aviso de tranca.
// Porta interna: leva ao outro extremo (ou a um vizinho livre), com recarga por entidade; NPCs
// cruzam com a chance do modo, sorteada pelo PRNG da própria IA.
// Porta de saída: só jogadores. Livre abre sempre; chave exige e consome o item; boss abre quando o
// boss indicado morre (`estado.saidaAberta`). Sem porta de saída, toda célula `S` é livre. Boss morto
// numa fase sem saída deixa uma porta temporária (objeto `saida`) onde caiu.

import type { Celula, EntidadeId } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { aleatorio } from '../core/rng';
import { ticksDe } from '../core/tempo';
import { vivo, type Entidade } from '../entities/entidade';
import { celulaLivrePara, ordemRotativa } from './colisao';
import { passavel, tipoEm, type PortaInterna } from './fase';
import { largarPerto, novoObjeto } from './objetos';
import { idDoInimigo } from './populacao';

const VIZINHOS: readonly (readonly [number, number])[] = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
  [1, -1],
  [1, 1],
  [-1, 1],
  [-1, -1],
];

export function chaveRecargaPorta(id: EntidadeId): string {
  return `porta:${id}`;
}

/** Quem completou um passo neste tick (o `moveu` já está na saída do tick). */
function chegaramNesteTick(saida: readonly EventoSimulacao[], tick: number): Set<EntidadeId> {
  const ids = new Set<EntidadeId>();
  for (const ev of saida) if (ev.t === 'moveu' && ev.tick === tick) ids.add(ev.id);
  return ids;
}

/** O outro extremo da porta interna em que a entidade está, se houver. */
export function destinoDaPorta(portas: readonly PortaInterna[], x: number, y: number): { porta: PortaInterna; destino: Celula } | null {
  for (const porta of portas) {
    if (porta.a.x === x && porta.a.y === y) return { porta, destino: porta.b };
    if (porta.b.x === x && porta.b.y === y) return { porta, destino: porta.a };
  }
  return null;
}

/** O destino, ou o primeiro vizinho passável e livre (desvio de destino ocupado, §2.1). */
function celulaDeChegada(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, alvo: Celula): Celula | null {
  const livre = (x: number, y: number) => passavel(ctx.fase, x, y) && celulaLivrePara(e, x, y, estado.entidades, ctx.balance.colisao);
  if (livre(alvo.x, alvo.y)) return alvo;
  for (const [dx, dy] of VIZINHOS) if (livre(alvo.x + dx, alvo.y + dy)) return { x: alvo.x + dx, y: alvo.y + dy };
  return null;
}

function teleportar(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, saida: EventoSimulacao[]): boolean {
  const achada = destinoDaPorta(ctx.fase.portasInternas, e.x, e.y);
  if (!achada) return false;
  const chave = chaveRecargaPorta(e.id);
  if ((estado.recargas[chave] ?? 0) > estado.tick) return false;
  // NPCs cruzam com a chance do modo; o sorteio é da IA, para não mexer no PRNG do mundo.
  if (e.controlador === 'ia' && (!e.ia || aleatorio(e.ia.rng) >= ctx.modo.portas.inimigosCruzamChance)) return false;
  const c = celulaDeChegada(estado, ctx, e, achada.destino);
  if (!c) return false;
  estado.recargas[chave] = estado.tick + ticksDe(ctx.balance.portas.recargaMs);
  Object.assign(e, { x: c.x, y: c.y, destinoX: c.x, destinoY: c.y, progressoPasso: 0, caminho: [], waypoints: [] });
  saida.push({ t: 'teleportou', tick: estado.tick, id: e.id, numero: achada.porta.numero, x: c.x, y: c.y });
  return true;
}

/** A célula é uma saída? A porta de saída da fase, toda `S` sem porta definida, ou a porta temporária. */
function ehSaida(estado: EstadoJogo, ctx: ContextoSimulacao, x: number, y: number): 'temporaria' | 'fase' | null {
  if (estado.objetos.some((o) => o.tipo === 'saida' && o.x === x && o.y === y)) return 'temporaria';
  const p = ctx.fase.portaSaida;
  if (p) return p.x === x && p.y === y ? 'fase' : null;
  return tipoEm(ctx.fase, x, y) === 'saida' ? 'fase' : null;
}

/** Marco 15: a entidade está numa saída que já deixa passar (sem tranca, ou destrancada)? */
export function naSaidaAberta(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade): boolean {
  const tipo = ehSaida(estado, ctx, e.x, e.y);
  if (!tipo) return false;
  const p = ctx.fase.portaSaida;
  return tipo === 'temporaria' || !p || p.tranca === 'livre' || estado.saidaAberta;
}

function tentarSair(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, saida: EventoSimulacao[]): void {
  const retorno = ctx.fase.portaRetorno;
  if (retorno && e.x === retorno.x && e.y === retorno.y) {
    saida.push({ t: 'saidaAlcancada', tick: estado.tick, id: e.id, retorno: true });
    return;
  }
  const tipo = ehSaida(estado, ctx, e.x, e.y);
  if (!tipo) return;
  const p = ctx.fase.portaSaida;
  const tick = estado.tick;
  if (tipo === 'fase' && p && p.tranca !== 'livre' && !estado.saidaAberta) {
    if (p.tranca === 'boss') {
      saida.push({ t: 'saidaTrancada', tick, id: e.id, motivo: 'boss' });
      return;
    }
    // Tranca de chave: a chave é consumida e a porta fica aberta (§2.1).
    const mochila = e.bolsa?.mochila ?? [];
    const indice = mochila.findIndex((i) => i.itemId === p.chave);
    const entrada = mochila[indice];
    if (!entrada) {
      saida.push({ t: 'saidaTrancada', tick, id: e.id, motivo: 'chave' });
      return;
    }
    entrada.qtd--;
    if (entrada.qtd <= 0) mochila.splice(indice, 1);
    estado.saidaAberta = true;
    saida.push({ t: 'saidaDestrancada', tick, motivo: 'chave', x: p.x, y: p.y });
  }
  saida.push({ t: 'saidaAlcancada', tick, id: e.id });
}

/** Etapa 7 (gatilhos por célula alcançada): porta interna e, para jogadores, porta de saída. */
export function processarPortas(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  const chegaram = chegaramNesteTick(saida, estado.tick);
  if (chegaram.size === 0) return;
  for (const e of ordemRotativa(estado.entidades, estado.tick)) {
    if (!chegaram.has(e.id) || !vivo(e)) continue;
    if (teleportar(estado, ctx, e, saida)) continue;
    if (e.controlador !== 'ia') tentarSair(estado, ctx, e, saida);
  }
}

/**
 * Boss morto abre a passagem (§2.1): destranca a porta de saída que depende dele ou, numa fase sem
 * saída nenhuma, deixa uma porta temporária na célula em que caiu.
 */
export function aoMorrerBoss(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, saida: EventoSimulacao[]): void {
  const p = ctx.fase.portaSaida;
  if (p?.tranca === 'boss') {
    if (p.bossIndice === undefined || e.id !== idDoInimigo(p.bossIndice) || estado.saidaAberta) return;
    estado.saidaAberta = true;
    saida.push({ t: 'saidaDestrancada', tick: estado.tick, motivo: 'boss', x: p.x, y: p.y });
    return;
  }
  if (p || e.arquetipo !== 'boss' || e.invocacao || temCelulaDeSaida(ctx)) return;
  if (estado.objetos.some((o) => o.tipo === 'saida')) return;
  largarPerto(ctx, e.x, e.y, (x, y) => {
    if (estado.objetos.some((o) => o.x === x && o.y === y)) return false;
    const objetoId = `d:${estado.proximoId++}`;
    estado.objetos.push(novoObjeto(objetoId, 'saida', x, y, { abertoTick: estado.tick }));
    saida.push({ t: 'objetoSurgiu', tick: estado.tick, objetoId, tipo: 'saida', x, y });
    saida.push({ t: 'saidaDestrancada', tick: estado.tick, motivo: 'boss', x, y });
    return true;
  });
}

function temCelulaDeSaida(ctx: ContextoSimulacao): boolean {
  const { fase } = ctx;
  for (let y = 0; y < fase.altura; y++) for (let x = 0; x < fase.largura; x++) if (tipoEm(fase, x, y) === 'saida') return true;
  return false;
}
