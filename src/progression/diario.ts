// Diário de descobertas (marco 18, 17/10/2026, D-070). Cada reação, combo, ressonância, marco de nível, fusão, variação
// de item, conjunto, regra de buff, missão, origem rara e evento de fase é uma entrada. O que ainda não foi visto
// aparece como silhueta na interface; a primeira vez que acontece, a entrada entra em `bolsa.diario` e sai o evento
// `descoberta` (a interface avisa e, com conta, registra a primeira descoberta do servidor).

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import type { Entidade } from '../entities/entidade';
import { bonusAtivos } from './conjuntos';
import { variacoesDeItem } from './gerar-item-base';

// Marco 26 (26/10/2026, D-111): as sinergias passivas (data/sinergias.json) também entram.
export const TIPOS_DE_ENTRADA = ['reacao', 'combo', 'sinergia', 'ressonancia', 'marco', 'fusao', 'item', 'conjunto', 'buff', 'missao', 'origem', 'evento'] as const;
export type TipoDeEntrada = (typeof TIPOS_DE_ENTRADA)[number];

export interface EntradaDoDiario {
  /** `tipo:resto` — o id gravado na ficha. */
  id: string;
  tipo: TipoDeEntrada;
}

/** Os ids de evento de fase (gerador). */
export const EVENTOS_DE_FASE = ['lua_sangrenta', 'mercador_errante', 'sala_secreta'] as const;

/** Todas as entradas possíveis com o conteúdo carregado (as silhuetas da interface e a contagem "x/y"). */
export function entradasDoDiario(ctx: Pick<ContextoSimulacao, 'conteudo'>): EntradaDoDiario[] {
  const c = ctx.conteudo;
  const e = (tipo: TipoDeEntrada, resto: string): EntradaDoDiario => ({ id: `${tipo}:${resto}`, tipo });
  const saida: EntradaDoDiario[] = [];
  for (const s of c.interacoes.sinergias) saida.push(e('reacao', s.id));
  for (const id of c.combos.keys()) saida.push(e('combo', id));
  for (const s of c.sinergias) saida.push(e('sinergia', s.id));
  for (const id of c.ressonancias.keys()) saida.push(e('ressonancia', id));
  for (const d of c.definicoes.values()) {
    for (const n of Object.keys(d.marcos)) saida.push(e('marco', `${d.base.id}:${n}`));
    if (d.fusao) saida.push(e('fusao', d.base.id));
  }
  for (const v of variacoesDeItem(c.itensComFormas)) saida.push(e('item', `${v.base}:${v.forma}:${v.elemento ?? 'n'}`));
  for (const cj of c.conjuntos.values()) for (const n of Object.keys(cj.bonus)) saida.push(e('conjunto', `${cj.id}:${n}`));
  for (const id of c.regrasDeBuff.keys()) saida.push(e('buff', id));
  for (const id of c.missoes.keys()) saida.push(e('missao', id));
  for (const id of c.origens.keys()) saida.push(e('origem', id));
  for (const id of EVENTOS_DE_FASE) saida.push(e('evento', id));
  return saida;
}

function anotar(estado: EstadoJogo, e: Entidade, entrada: string, saida: EventoSimulacao[]): void {
  const bolsa = e.bolsa;
  if (!bolsa || bolsa.diario.includes(entrada)) return;
  bolsa.diario.push(entrada);
  saida.push({ t: 'descoberta', tick: estado.tick, id: e.id, entrada });
}

/** A cada tantos ticks o diário confere a mochila e os conjuntos (o resto vem dos eventos do tick). */
const INTERVALO_INVENTARIO = 30;

/** Etapa do tick: os eventos deste tick (e, de tempos em tempos, a mochila) viram entradas do diário. */
export function registrarDescobertas(estado: EstadoJogo, ctx: ContextoSimulacao, eventos: readonly EventoSimulacao[], saida: EventoSimulacao[]): void {
  const porId = (id: string) => estado.entidades.find((x) => x.id === id && x.bolsa);
  for (const ev of eventos) {
    switch (ev.t) {
      case 'impacto': {
        const quem = porId(ev.fonteId);
        if (quem && !ev.falha) for (const s of ev.sinergias) anotar(estado, quem, `reacao:${s}`, saida);
        break;
      }
      case 'comboFeito': {
        const quem = porId(ev.id);
        if (quem) anotar(estado, quem, `combo:${ev.combo}`, saida);
        break;
      }
      case 'sinergiaPassiva': {
        const quem = porId(ev.id);
        if (quem) anotar(estado, quem, `sinergia:${ev.sinergia}`, saida);
        break;
      }
      case 'ressonanciaAtiva': {
        const quem = porId(ev.id);
        if (quem) anotar(estado, quem, `ressonancia:${ev.ressonancia}`, saida);
        break;
      }
      case 'habilidadeMudou': {
        const quem = porId(ev.id);
        const def = ctx.conteudo.definicoes.get(ev.habilidadeId);
        if (quem && def?.marcos[ev.rank]) anotar(estado, quem, `marco:${ev.habilidadeId}:${ev.rank}`, saida);
        if (quem && def?.fusao) anotar(estado, quem, `fusao:${ev.habilidadeId}`, saida);
        break;
      }
      case 'buffInteragiu': {
        const quem = porId(ev.id);
        if (quem) anotar(estado, quem, `buff:${ev.regra}`, saida);
        break;
      }
      case 'missaoConcluida': {
        const quem = porId(ev.id);
        if (quem) anotar(estado, quem, `missao:${ev.missao}`, saida);
        break;
      }
      case 'origemRara': {
        const quem = porId(ev.id);
        if (quem) anotar(estado, quem, `origem:${ev.origem}`, saida);
        break;
      }
      default:
        break;
    }
  }
  if (estado.tick % INTERVALO_INVENTARIO !== 0) return;
  for (const e of estado.entidades) {
    const bolsa = e.bolsa;
    if (!bolsa) continue;
    for (const ev of ctx.fase.eventos) anotar(estado, e, `evento:${ev}`, saida);
    for (const entrada of [...bolsa.mochila, ...Object.values(bolsa.equipamento)]) {
      const item = entrada ? ctx.conteudo.itens.get(entrada.itemId) : undefined;
      if (item?.base && item.forma) anotar(estado, e, `item:${item.base}:${item.forma}:${item.elemento ?? 'n'}`, saida);
    }
    for (const a of bonusAtivos(ctx.conteudo.conjuntos, bolsa, ctx.conteudo.itens)) {
      for (const n of Object.keys(a.conjunto.bonus)) if (Number(n) <= a.pecas) anotar(estado, e, `conjunto:${a.conjunto.id}:${n}`, saida);
    }
  }
}
