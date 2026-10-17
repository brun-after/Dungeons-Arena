// Buffs com regra própria (ajuste de 16/10/2026, D-067). Puro:
// - **buff ofensivo armado**: o orbe de efeito ofensivo não começa na hora — fica armado por `prazoArmadoMs`; se o
//   jogador entrar em combate dentro do prazo, o efeito começa e a duração conta dali; senão, some;
// - **refúgio**: o orbe de refúgio vira uma carga (uma só); ao abrir a mochila ou a loja, a carga é gasta e o jogador
//   fica imune por `refugioMs`;
// - **aparência**: o que está equipado (base da arma, mão secundária e a raridade do elmo, da armadura e da capa), num
//   campo público que a arena mostra para todos (a bolsa é privada).

import { dispararGanchosDe, passivosDe } from './ganchos-do-portador';
import { construirEfeito, type EfeitoCanonico, type TipoEfeito } from '../combat/registro-efeitos';
import { aplicarEfeito } from '../combat/efeitos';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import { vivo, type AparenciaEquipada, type Entidade } from '../entities/entidade';
import { perseguido } from './recursos';

/** Os efeitos de orbe que reforçam o ataque: chegam armados. */
export const EFEITOS_OFENSIVOS: ReadonlySet<TipoEfeito> = new Set<TipoEfeito>(['bonus_dano', 'ab_dano', 'ab_recarga', 'ab_alcance', 'ab_multi_alvo', 'atravessar', 'rastro_dano']);

/** Janela (ticks) em que golpear ou ser golpeado conta como "em combate". */
const JANELA_COMBATE_MS = 3000;

/** Em combate: um hostil persegue, ou houve golpe recente dado ou levado. */
export function emCombate(estado: EstadoJogo, e: Entidade): boolean {
  if (perseguido(estado, e)) return true;
  const janela = ticksDe(JANELA_COMBATE_MS);
  const recente = (tick: number) => estado.tick - tick <= janela;
  if (e.participacao.some((p) => recente(p.tick))) return true;
  return estado.entidades.some((o) => o !== e && vivo(o) && o.participacao.some((p) => p.id === e.id && recente(p.tick)));
}

/** Pegou um orbe ofensivo: o efeito fica armado (o mais novo do mesmo tipo substitui o anterior). */
export function armarBuff(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, efeito: EfeitoCanonico, saida: EventoSimulacao[]): void {
  // Marco 18 (D-069): o Amuleto da fúria contida alonga o prazo.
  const prazo = ctx.balance.efeitos.prazoArmadoMs * (1 + passivosDe(ctx, e).buffArmadoPrazoPct / 100);
  const ateTick = estado.tick + ticksDe(prazo);
  e.buffsArmados = [...e.buffsArmados.filter((b) => b.efeito.tipo !== efeito.tipo), { efeito: { ...efeito }, ateTick }];
  saida.push({ t: 'buffArmado', tick: estado.tick, id: e.id, tipo: efeito.tipo, ateTick });
}

/** Etapa do tick: os armados começam em combate ou somem no fim do prazo. */
export function processarBuffsArmados(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  for (const e of estado.entidades) {
    if (e.buffsArmados.length === 0) continue;
    if (!vivo(e)) {
      e.buffsArmados = [];
      continue;
    }
    if (emCombate(estado, e)) {
      const armados = e.buffsArmados;
      e.buffsArmados = [];
      const duracao = 1 + passivosDe(ctx, e).buffArmadoDuracaoPct / 100;
      for (const b of armados) {
        const efeito = { ...b.efeito, duracaoMs: Math.round(b.efeito.duracaoMs * duracao) };
        aplicarEfeito(estado, ctx, e, efeito, { id: e.id, x: e.x, y: e.y }, null, saida);
        saida.push({ t: 'buffAtivado', tick: estado.tick, id: e.id, tipo: b.efeito.tipo });
      }
      continue;
    }
    const vencidos = e.buffsArmados.filter((b) => estado.tick >= b.ateTick);
    if (vencidos.length === 0) continue;
    e.buffsArmados = e.buffsArmados.filter((b) => estado.tick < b.ateTick);
    for (const b of vencidos) saida.push({ t: 'buffExpirou', tick: estado.tick, id: e.id, tipo: b.efeito.tipo });
  }
}

/** Abriu a mochila ou a loja: com carga de refúgio, gasta e fica imune por `refugioMs`. */
export function usarRefugio(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, saida: EventoSimulacao[]): void {
  if (!e.refugio || !vivo(e)) return;
  e.refugio = false;
  const ms = ctx.balance.efeitos.refugioMs;
  aplicarEfeito(estado, ctx, e, construirEfeito('imune_dano', { duracaoMs: ms }), { id: e.id, x: e.x, y: e.y }, null, saida);
  saida.push({ t: 'refugioUsado', tick: estado.tick, id: e.id, ateTick: estado.tick + ticksDe(ms) });
  // Marco 18 (D-069): o Manto do refúgio cura ao gastar a carga.
  dispararGanchosDe(estado, ctx, e, 'aoGastarRefugio', {}, saida);
}

const BASES_DE_ARMA = new Set(['espada', 'machado', 'adaga', 'cajado', 'arco', 'clava', 'lanca']);

/**
 * O visual de um item equipado: a base da arma pelo ícone; nas peças, a raridade. Marco 18: os itens com forma dizem o
 * desenho da arma (`arma` da base; a maça usa o da clava) e as peças de mão sem arma (tomo, aljava) não desenham nada.
 */
function baseDaArma(ctx: ContextoSimulacao, itemId: string | undefined): string | null {
  const item = itemId ? ctx.conteudo.itens.get(itemId) : undefined;
  if (!item) return null;
  if (item.base) {
    const base = ctx.conteudo.itensComFormas.bases.get(item.base);
    return base?.arma ?? (item.base === 'escudo' ? 'escudo' : null);
  }
  return BASES_DE_ARMA.has(item.icone) ? item.icone : item.icone === 'escudo' ? 'escudo' : 'espada';
}

const ORDEM_FORMAS = ['comum', 'epica', 'lendaria', 'ultima'];

export function aparenciaDe(ctx: ContextoSimulacao, e: Entidade): AparenciaEquipada | null {
  const eq = e.bolsa?.equipamento;
  if (!eq) return e.aparencia;
  const raridade = (itemId: string | undefined) => (itemId ? (ctx.conteudo.itens.get(itemId)?.raridade ?? null) : null);
  const arma = eq.arma_principal ? ctx.conteudo.itens.get(eq.arma_principal.itemId) : undefined;
  let formaMaxima: string | null = null;
  for (const entrada of Object.values(eq)) {
    const forma = entrada ? ctx.conteudo.itens.get(entrada.itemId)?.forma : null;
    if (forma && (formaMaxima === null || ORDEM_FORMAS.indexOf(forma) > ORDEM_FORMAS.indexOf(formaMaxima))) formaMaxima = forma;
  }
  return {
    arma: baseDaArma(ctx, eq.arma_principal?.itemId),
    secundaria: baseDaArma(ctx, eq.arma_secundaria?.itemId),
    cabeca: raridade(eq.cabeca?.itemId),
    corpo: raridade(eq.corpo?.itemId),
    capa: raridade(eq.capa?.itemId),
    formaArma: arma?.forma ?? null,
    elementoArma: arma?.elemento ?? null,
    formaMaxima,
  };
}

const iguais = (a: AparenciaEquipada | null, b: AparenciaEquipada | null) =>
  a === b ||
  (!!a && !!b && a.arma === b.arma && a.secundaria === b.secundaria && a.cabeca === b.cabeca && a.corpo === b.corpo && a.capa === b.capa &&
    a.formaArma === b.formaArma && a.elementoArma === b.elementoArma && a.formaMaxima === b.formaMaxima);

/** Etapa do tick: a aparência pública segue o equipamento de quem tem bolsa. */
export function atualizarAparencias(estado: EstadoJogo, ctx: ContextoSimulacao): void {
  for (const e of estado.entidades) {
    if (!e.bolsa) continue;
    const nova = aparenciaDe(ctx, e);
    if (!iguais(nova, e.aparencia)) e.aparencia = nova;
  }
}
