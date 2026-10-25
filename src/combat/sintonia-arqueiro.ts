// A sintonia do Arqueiro (marco 24, 24/10/2026, D-095): a família das gerais de tecla muda a Mira firme e o tiro cheio;
// as vertentes Caçador noturno, Atirador de elite e Sentinela somam as suas. Cada função é o ponto de entrada de um tipo
// do vocabulário (progression/sintonia-efeitos.ts); os números vêm de data/sintonia.json.

import type { ContextoSimulacao } from '../core/contexto';
import { buscarEntidade, novoId, type EstadoJogo, type Projetil } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import { vivo, type Entidade } from '../entities/entidade';
import { podeAjudar, podeFerir } from '../modos/relacao';
import { efeitoDeSintonia, efeitosDeSintonia, somaDeSintonia } from '../progression/sintonia';
import { definicaoDe } from './compilar-habilidade';
import { aplicarEfeito, REGISTRO_EFEITOS, type OrigemDoEfeito } from './efeitos';
import { celulaOcupada, chebyshev } from './geometria';
import type { Habilidade } from './habilidades';
import { fracaoMira, temMira, ticksParaCarregar } from './mira';
import { construirEfeito } from './registro-efeitos';

const origemDe = (e: Entidade): OrigemDoEfeito => ({ id: e.id, x: e.x, y: e.y });

/** Adianta a Mira em `pct`% da carga (sem passar de cheia). */
function adiantarMira(ctx: ContextoSimulacao, e: Entidade, pct: number, tick: number): void {
  if (!temMira(e) || pct <= 0) return;
  const total = ticksParaCarregar(ctx, e);
  const desde = e.mira?.desdeTick ?? 0;
  e.mira = { desdeTick: Math.max(tick - total, desde - Math.round(total * pct / 100)) };
}

/** Técnica: a geral da família que fere enche parte da Mira. */
export function miraDaGeral(ctx: ContextoSimulacao, e: Entidade, hab: Habilidade, tick: number): void {
  const familia = definicaoDe(ctx, hab.id)?.familiaGeral;
  if (!familia || !temMira(e)) return;
  adiantarMira(ctx, e, efeitosDeSintonia(ctx, e, 'miraPorGeral', tick).filter((ef) => ef.familia === familia).reduce((s, ef) => s + ef.pct, 0), tick);
}

/** Suporte: com escudo ativo, levar dano não zera a Mira. */
export function miraProtegida(ctx: ContextoSimulacao, e: Entidade, tick: number): boolean {
  if (!temMira(e) || !efeitoDeSintonia(ctx, e, 'miraEscudoProtege', tick)) return false;
  return e.efeitos.some((f) => f.ateTick > tick && f.valor > 0 && REGISTRO_EFEITOS[f.tipo].escudo);
}

/** No disparo do tiro cheio: o que a sintonia põe no projétil. */
export function prepararTiroCheio(ctx: ContextoSimulacao, ator: Entidade, p: Projetil, tick: number): void {
  p.carregado = true;
  if (efeitoDeSintonia(ctx, ator, 'tiroCheioMagico', tick)) p.magico = true;
  const ric = efeitosDeSintonia(ctx, ator, 'tiroCheioRicochete', tick);
  if (ric.length > 0) {
    p.ricochetes = Math.max(...ric.map((ef) => ef.n));
    p.ricochetePct = ric.reduce((s, ef) => s + ef.pct, 0);
  }
  if (ator.invisivelAteTick > tick) p.invisivel = true;
}

/** Cada acerto do tiro cheio: os estados da sintonia e, invisível (Caçador noturno), o estado do alvo dobra. */
export function aoAcertarTiroCheio(estado: EstadoJogo, ctx: ContextoSimulacao, p: Projetil, alvo: Entidade, saida: EventoSimulacao[]): void {
  const dono = buscarEntidade(estado, p.donoId);
  if (!dono || !vivo(alvo)) return;
  for (const ef of efeitosDeSintonia(ctx, dono, 'tiroCheioAplica', estado.tick)) if (ef.efeito) aplicarEfeito(estado, ctx, alvo, ef.efeito, origemDe(dono), { x: alvo.x, y: alvo.y }, saida);
  if (!p.invisivel) return;
  for (const ef of efeitosDeSintonia(ctx, dono, 'tiroCheioInvisivel', estado.tick)) {
    for (const f of alvo.efeitos) if (f.tipo === ef.estado && f.ateTick > estado.tick) f.valor = Math.round(f.valor * (1 + ef.pct / 100));
  }
}

/** A cada célula do caminho do tiro cheio: fogo no chão (fogo) e cura dos aliados atravessados (sagrado). */
export function noCaminhoDoTiroCheio(estado: EstadoJogo, ctx: ContextoSimulacao, p: Projetil, cx: number, cy: number, saida: EventoSimulacao[]): void {
  const dono = buscarEntidade(estado, p.donoId);
  if (!dono) return;
  const tick = estado.tick;
  for (const ef of efeitosDeSintonia(ctx, dono, 'tiroCheioRastro', tick)) {
    if (estado.rastros.some((r) => r.x === cx && r.y === cy && r.donoId === dono.id && r.tipo === 'rastro_dano')) continue;
    estado.rastros.push({ x: cx, y: cy, donoId: dono.id, equipeDono: dono.equipe, tipo: 'rastro_dano', valor: ef.valor, interno: null, ateTick: tick + ticksDe(ef.ms), atingidos: [] });
  }
  const cura = somaDeSintonia(ctx, dono, 'tiroCheioCuraAliados', 'valor', tick);
  if (cura <= 0) return;
  for (const e of estado.entidades) {
    if (e === dono || !vivo(e) || e.invocacao || p.curados?.includes(e.id) || !podeAjudar(dono, e, ctx.modo)) continue;
    const c = celulaOcupada(e);
    if (c.x !== cx || c.y !== cy) continue;
    (p.curados ??= []).push(e.id);
    aplicarEfeito(estado, ctx, e, construirEfeito('cura', { valor: cura }), origemDe(dono), null, saida);
  }
}

/** No fim do tiro cheio: o veneno do alvo se espalha (veneno), o último atingido sofre (terra) e o tiro ricocheteia. */
export function aoFimDoTiroCheio(estado: EstadoJogo, ctx: ContextoSimulacao, p: Projetil, saida: EventoSimulacao[]): void {
  const dono = buscarEntidade(estado, p.donoId);
  if (!dono || p.atingidos.length === 0) return;
  const tick = estado.tick;
  const atingidos = p.atingidos.map((id) => buscarEntidade(estado, id)).filter((e): e is Entidade => !!e && vivo(e));
  for (const ef of efeitosDeSintonia(ctx, dono, 'tiroCheioEspalhaEstado', tick)) {
    const fonte = atingidos.map((e) => e.efeitos.find((f) => f.tipo === ef.estado && f.ateTick > tick)).find((f) => !!f);
    if (!fonte) continue;
    const copia = construirEfeito(fonte.tipo, { valor: fonte.valor, pct: fonte.pct, duracaoMs: Math.round((fonte.ateTick - tick) * 1000 / ticksDe(1000)) });
    for (const e of atingidos) if (!e.efeitos.some((f) => f.tipo === fonte.tipo && f.ateTick > tick)) aplicarEfeito(estado, ctx, e, copia, origemDe(dono), null, saida);
  }
  const ultimo = atingidos.at(-1);
  if (ultimo) for (const ef of efeitosDeSintonia(ctx, dono, 'tiroCheioUltimo', tick)) if (ef.efeito) aplicarEfeito(estado, ctx, ultimo, ef.efeito, origemDe(dono), { x: ultimo.x, y: ultimo.y }, saida);
  ricochetear(estado, ctx, p, dono, ultimo, saida);
}

/** O tiro cheio salta do último atingido para o hostil mais perto ainda não atingido (até `ricochetes` vezes). */
function ricochetear(estado: EstadoJogo, ctx: ContextoSimulacao, p: Projetil, dono: Entidade, de: Entidade | undefined, saida: EventoSimulacao[]): void {
  if (!de || !p.ricochetes) return;
  const raio = Math.max(0, ...efeitosDeSintonia(ctx, dono, 'tiroCheioRicochete', estado.tick).map((ef) => ef.raio));
  const origem = celulaOcupada(de);
  const proximo = estado.entidades
    .filter((e) => vivo(e) && e.id !== dono.id && !p.atingidos.includes(e.id) && e.invisivelAteTick <= estado.tick && podeFerir(dono, e, ctx.modo) && chebyshev(origem, celulaOcupada(e)) <= raio)
    .sort((a, b) => chebyshev(origem, celulaOcupada(a)) - chebyshev(origem, celulaOcupada(b)) || (a.id < b.id ? -1 : 1))[0];
  if (!proximo) return;
  const destino = celulaOcupada(proximo);
  const dx = destino.x - origem.x;
  const dy = destino.y - origem.y;
  const d = Math.hypot(dx, dy);
  const novo: Projetil = { ...p, id: novoId(estado), x: origem.x, y: origem.y, dirX: dx / d, dirY: dy / d, restante: d + 0.5, atingidos: [...p.atingidos], ricochetes: p.ricochetes - 1 };
  delete novo.curados;
  estado.projeteis.push(novo);
  saida.push({ t: 'projetilLancado', tick: estado.tick, projetilId: novo.id, acaoId: p.acaoId, donoId: p.donoId, habilidadeId: p.habilidadeId, chave: p.chave });
  // Atirador de elite: cada ricochete enche parte da próxima Mira.
  adiantarMira(ctx, dono, p.ricochetePct ?? 0, estado.tick);
}

/** Por tick: invisível, a Mira enche mais rápido (sombra); parado com a Mira cheia, escudo em volta (Sentinela). */
export function processarMiras(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  const tick = estado.tick;
  for (const e of estado.entidades) {
    if (!vivo(e) || !temMira(e)) continue;
    const acelera = somaDeSintonia(ctx, e, 'miraAcelera', 'pct', tick);
    if (acelera > 0 && fracaoMira(ctx, e, tick) !== 1) e.mira = { desdeTick: (e.mira?.desdeTick ?? 0) - Math.round(acelera / 100) };
    const sentinela = efeitoDeSintonia(ctx, e, 'escudoParadoComMira', tick);
    if (!sentinela?.efeito || fracaoMira(ctx, e, tick) !== 1) continue;
    const vistos = e.sintoniaVistos ??= {};
    if (tick - (vistos.sentinela ?? -Infinity) < ticksDe(sentinela.ms)) continue;
    vistos.sentinela = tick;
    for (const a of estado.entidades) {
      if (!vivo(a) || (a !== e && !podeAjudar(e, a, ctx.modo)) || chebyshev(celulaOcupada(a), celulaOcupada(e)) > sentinela.raio) continue;
      aplicarEfeito(estado, ctx, a, sentinela.efeito, origemDe(e), null, saida);
    }
  }
}
