// Os marcos do Arcano, o atributo de classe do Mago (marco 28, 30/10/2026, D-127). Todos partem da encarnação:
// - 25, Rastro elemental: encarnado, o Mago deixa no chão, por onde anda, uma trilha do elemento que fere e aplica o
//   estado dele;
// - 50, Ressonância: trocar de encarnação solta em volta uma explosão com o elemento novo e o estado do anterior;
// - 75, Orbes: um orbe do elemento encarnado gira em volta e fere quem chega perto (100: dois orbes);
// - 100, Arquimago: a encarnação dupla dura o dobro.
// Os números ficam em `balance.dominio` (classes.mago.marcos e efeitos). Puro.

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import { vivo, type Entidade } from '../entities/entidade';
import { podeFerir } from '../modos/relacao';
import { marcoDe } from '../progression/dominio';
import type { FonteDeDano } from './dano';
import { aplicarEfeito } from './efeitos';
import { ehElemento } from './elementos';
import { celulaOcupada, chebyshev } from './geometria';
import { aplicarImpacto } from './golpe';
import type { Habilidade } from './habilidades';
import { construirEfeito } from './registro-efeitos';

/** O multiplicador da duração da dupla (o Arquimago dobra). */
export function duracaoDaDuplaDoArcano(ctx: ContextoSimulacao, mago: Entidade): number {
  return Math.max(1, marcoDe(ctx, mago, 'arquimagoDuracaoMult'));
}

/** Por tick, para o Mago encarnado: a trilha elemental e os orbes. */
export function marcosDoMago(estado: EstadoJogo, ctx: ContextoSimulacao, mago: Entidade, elemento: string, saida: EventoSimulacao[]): void {
  const ef = ctx.balance.dominio.efeitos;
  const def = ehElemento(elemento) ? ctx.conteudo.elementos.get(elemento) : undefined;
  const tick = estado.tick;
  const rastroMs = marcoDe(ctx, mago, 'rastroMs');
  if (rastroMs > 0 && def && tick % Math.max(1, ticksDe(ef.rastroIntervaloMs)) === 0) {
    const c = celulaOcupada(mago);
    if (!estado.rastros.some((r) => r.x === c.x && r.y === c.y && r.donoId === mago.id && r.ateTick > tick)) {
      const valor = Math.max(1, Math.round((mago.nivel * ef.rastroPct) / 100));
      estado.rastros.push({ x: c.x, y: c.y, donoId: mago.id, equipeDono: mago.equipe, tipo: 'rastro_dano', valor, interno: def.estado, ateTick: tick + ticksDe(rastroMs), atingidos: [] });
    }
  }
  const orbes = marcoDe(ctx, mago, 'orbes');
  if (orbes > 0 && tick % Math.max(1, ticksDe(ef.orbeIntervaloMs)) === 0) {
    const centro = celulaOcupada(mago);
    const valor = Math.max(1, Math.round((mago.nivel * ef.orbePct) / 100)) * orbes;
    const feridos = estado.entidades.filter((e) => vivo(e) && e !== mago && podeFerir(mago, e, ctx.modo) && chebyshev(centro, celulaOcupada(e)) <= ef.orbeRaio);
    for (const e of feridos) {
      aplicarEfeito(estado, ctx, e, construirEfeito('dano_direto', { valor }), { id: mago.id, x: mago.x, y: mago.y }, null, saida);
      if (def) aplicarEfeito(estado, ctx, e, def.estado, { id: mago.id, x: mago.x, y: mago.y }, null, saida);
    }
    if (feridos.length > 0) saida.push({ t: 'marcoDeClasse', tick, id: mago.id, marco: 'orbes', celulas: feridos.map((e) => celulaOcupada(e)) });
  }
}

/** Ressonância: a troca de `anterior` para a encarnação atual explode em volta do Mago. */
export function ressonanciaArcana(estado: EstadoJogo, ctx: ContextoSimulacao, mago: Entidade, anterior: string, hab: Habilidade, fonte: FonteDeDano, acaoId: number, saida: EventoSimulacao[]): void {
  const pct = marcoDe(ctx, mago, 'ressonanciaPct');
  if (pct <= 0 || !hab.formulaDano) return;
  const raio = ctx.balance.dominio.efeitos.ressonanciaRaio;
  const centro = celulaOcupada(mago);
  const estadoAnterior = ehElemento(anterior) ? ctx.conteudo.elementos.get(anterior)?.estado : undefined;
  const alvos = estado.entidades.filter((e) => vivo(e) && e !== mago && podeFerir(mago, e, ctx.modo) && chebyshev(centro, celulaOcupada(e)) <= raio);
  const celulas = [];
  for (let dy = -raio; dy <= raio; dy++) for (let dx = -raio; dx <= raio; dx++) celulas.push({ x: centro.x + dx, y: centro.y + dy });
  saida.push({ t: 'marcoDeClasse', tick: estado.tick, id: mago.id, marco: 'ressonancia', celulas });
  const f = { ...fonte, multDano: (fonte.multDano * pct) / 100 };
  alvos.forEach((e, indice) => {
    aplicarImpacto(estado, ctx, e, { acaoId, fonte: f, hab, indice, secundario: true }, saida);
    if (estadoAnterior && vivo(e)) aplicarEfeito(estado, ctx, e, estadoAnterior, { id: mago.id, x: mago.x, y: mago.y }, null, saida);
  });
}
