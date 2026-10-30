// Os eventos de mundo por região (marco 30, 30/10/2026, D-129): a lua sangrenta (mais loot dos monstros) e o
// mercador errante (uma loja que aparece na região por um tempo). O sorteio é por janela de tempo, pela semente da
// região e da janela: igual em todos os canais e em todo processo, sem estado guardado. Dentro da janela, o evento
// começa num deslocamento sorteado (as regiões não viram todas juntas) e dura `duracaoMin`. Puro.

import { hashTexto } from '../core/rng';
import type { Perigo } from './reino';

export type EventoDaRegiao = 'lua_sangrenta' | 'mercador_errante';

export interface RegrasDeEventos {
  janelaMin: number;
  duracaoMin: number;
  chancePct: number;
  /** O loot dos monstros na lua sangrenta (% do normal). */
  luaLootPct: number;
  /** Os perigos onde a lua sangrenta pode cair (a vila segura não tem). */
  perigosComLua: readonly string[];
}

export interface EventoAtivo {
  evento: EventoDaRegiao;
  /** Hora (ms) em que o evento acaba. */
  fim: number;
}

/** O evento da região agora, ou null. */
export function eventoDaRegiao(regiaoId: string, perigo: Perigo, agoraMs: number, r: RegrasDeEventos): EventoAtivo | null {
  const janelaMs = r.janelaMin * 60_000;
  const duracaoMs = Math.min(r.duracaoMin * 60_000, janelaMs);
  if (janelaMs <= 0 || duracaoMs <= 0) return null;
  const janela = Math.floor(agoraMs / janelaMs);
  const semente = hashTexto(`${regiaoId}/${String(janela)}`);
  if (semente % 100 >= r.chancePct) return null;
  const folga = janelaMs - duracaoMs;
  const inicio = janela * janelaMs + (folga > 0 ? hashTexto(`${regiaoId}/${String(janela)}/inicio`) % folga : 0);
  if (agoraMs < inicio || agoraMs >= inicio + duracaoMs) return null;
  const possiveis: EventoDaRegiao[] = r.perigosComLua.includes(perigo) ? ['lua_sangrenta', 'mercador_errante'] : ['mercador_errante'];
  const evento = possiveis[Math.floor(semente / 100) % possiveis.length] ?? 'mercador_errante';
  return { evento, fim: inicio + duracaoMs };
}
