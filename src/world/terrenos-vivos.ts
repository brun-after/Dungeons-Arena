// Terrenos vivos (08/11/2026, D-138). As áreas da fase (world/ambientes.ts) eram fixas; agora reagem aos elementos e o
// Mundo acende focos que surgem e expiram. Um terreno vivo é uma área com prazo, guardada no estado:
// - a reação: um golpe com elemento que acerta alguém dentro de uma área a transforma por um tempo (a água congela com o
//   gelo, vira vapor com o fogo, vira lama com a terra e conduz o raio; o gelo derrete com o fogo…). Sobre uma área fixa,
//   o vivo a cobre (`cobre`, o índice dela) até o prazo; sobre um vivo, troca o tipo dele. As regras ficam em
//   `balance.terrenos.reacoes`, consultadas por uma função pequena;
// - a condução: o raio na água fere também quem está na mesma água (uma fração do golpe) e o eletriza;
// - o foco do Mundo (mundo/focos.ts) põe vivos com o id do foco, que somem juntos.
// O prazo é em ticks. Puro.

import { aplicarEfeito } from '../combat/efeitos';
import type { Elemento } from '../combat/elementos';
import { resolverHabilidade } from '../combat/compilar-habilidade';
import { construirEfeito } from '../combat/registro-efeitos';
import type { ContextoSimulacao } from '../core/contexto';
import { buscarEntidade, type EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import { vivo } from '../entities/entidade';
import { podeFerir } from '../modos/relacao';
import { dentroDaArea, type AreaAmbiente, type TerrenoVivo, type TipoTerrenoVivo } from './ambiente-tipos';

/** Uma área valendo agora: a fixa (pelo índice) que nenhum vivo cobre, ou o vivo. */
export interface AreaEfetiva {
  tipo: TipoTerrenoVivo;
  x: number;
  y: number;
  raio: number;
  fixa: number | null;
  viva: TerrenoVivo | null;
}

/** As áreas que valem agora (o vivo `seco` só esconde a fixa, sem efeito). */
export function areasEfetivas(estado: Pick<EstadoJogo, 'terrenos' | 'tick'>, fixas: readonly AreaAmbiente[]): AreaEfetiva[] {
  const vivos = (estado.terrenos ?? []).filter((t) => t.ateTick > estado.tick);
  const cobertas = new Set(vivos.flatMap((t) => (t.cobre === undefined ? [] : [t.cobre])));
  const saida: AreaEfetiva[] = [];
  fixas.forEach((a, i) => {
    if (!cobertas.has(i)) saida.push({ tipo: a.tipo, x: a.x, y: a.y, raio: a.raio, fixa: i, viva: null });
  });
  for (const t of vivos) if (t.tipo !== 'seco') saida.push({ tipo: t.tipo, x: t.x, y: t.y, raio: t.raio, fixa: null, viva: t });
  return saida;
}

/** O que a área vira com o elemento (null: não reage; `seco`: some por um tempo). */
export function reacaoDoTerreno(ctx: Pick<ContextoSimulacao, 'balance'>, tipo: TipoTerrenoVivo, elemento: Elemento): { vira: TipoTerrenoVivo; conduz: boolean } | null {
  const r = ctx.balance.terrenos.reacoes.find((x) => x.sobre === tipo && x.elemento === elemento);
  return r ? { vira: r.vira, conduz: r.conduz === true } : null;
}

/** Transforma a área: cobre a fixa com um vivo, ou troca o tipo do vivo (voltando ao da fixa, o vivo some). */
function transformar(estado: EstadoJogo, ctx: ContextoSimulacao, a: AreaEfetiva, vira: TipoTerrenoVivo): void {
  const r = ctx.balance.terrenos;
  const dura = ticksDe(vira === 'vapor' ? r.vaporMs : r.duracaoMs);
  const vivos = (estado.terrenos ??= []);
  if (a.viva) {
    const base = a.viva.cobre === undefined ? undefined : ctx.fase.ambientes?.[a.viva.cobre];
    if (base && base.tipo === vira) {
      estado.terrenos = vivos.filter((t) => t !== a.viva);
      return;
    }
    a.viva.tipo = vira;
    // O foco segue com o prazo dele; a reação ganha o tempo da reação.
    a.viva.ateTick = Math.max(a.viva.ateTick, estado.tick + dura);
    return;
  }
  if (vivos.length >= r.maxVivos) return;
  vivos.push({ id: estado.proximoId++, tipo: vira, x: a.x, y: a.y, raio: a.raio, ateTick: estado.tick + dura, ...(a.fixa !== null && { cobre: a.fixa }) });
}

/** O raio na água: quem mais está nela leva uma fração do golpe e fica eletrizado. */
function conduzir(estado: EstadoJogo, ctx: ContextoSimulacao, a: AreaEfetiva, fonteId: string, alvoId: string, dano: number, saida: EventoSimulacao[]): void {
  const fonte = buscarEntidade(estado, fonteId);
  if (!fonte) return;
  const parte = Math.max(1, Math.round((dano * ctx.balance.terrenos.conducaoPct) / 100));
  for (const e of estado.entidades) {
    if (e.id === alvoId || !vivo(e) || !dentroDaArea(a, e.x, e.y) || !podeFerir(fonte, e, ctx.modo)) continue;
    const origem = { id: fonte.id, x: a.x, y: a.y };
    aplicarEfeito(estado, ctx, e, construirEfeito('dano_direto', { valor: parte }), origem, null, saida);
    aplicarEfeito(estado, ctx, e, construirEfeito('eletrizado', { duracaoMs: ctx.balance.ambiente.duracaoMs }), origem, null, saida, false);
  }
}

/**
 * Etapa dos terrenos vivos: os vencidos somem e cada golpe com elemento deste tick, com dano, reage com as áreas onde o
 * alvo está (uma reação por área por tick).
 */
export function processarTerrenosVivos(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[], inicio = 0): void {
  if (estado.terrenos) {
    const restantes = estado.terrenos.filter((t) => t.ateTick > estado.tick);
    if (restantes.length !== estado.terrenos.length) {
      if (restantes.length > 0) estado.terrenos = restantes;
      else delete estado.terrenos;
    }
  }
  const fixas = ctx.fase.ambientes ?? [];
  if (fixas.length === 0 && !estado.terrenos) return;
  const reagidas = new Set<AreaEfetiva['viva'] | number>();
  const fim = saida.length;
  for (let i = inicio; i < fim; i++) {
    const ev = saida[i];
    if (ev?.t !== 'impacto' || ev.dano <= 0 || ev.falha) continue;
    const elemento = resolverHabilidade(ctx, ev.chave)?.elemento;
    const alvo = buscarEntidade(estado, ev.alvoId);
    if (!elemento || !alvo) continue;
    for (const a of areasEfetivas(estado, fixas)) {
      const chave = a.viva ?? a.fixa ?? -1;
      if (reagidas.has(chave) || !dentroDaArea(a, alvo.x, alvo.y)) continue;
      const r = reacaoDoTerreno(ctx, a.tipo, elemento);
      if (!r) continue;
      reagidas.add(chave);
      if (r.conduz) conduzir(estado, ctx, a, ev.fonteId, ev.alvoId, ev.danoEfetivo ?? ev.dano, saida);
      saida.push({ t: 'terrenoReagiu', tick: estado.tick, x: a.x, y: a.y, raio: a.raio, de: a.tipo, para: r.vira });
      transformar(estado, ctx, a, r.vira);
    }
  }
}
