// Fila de comandos (§3.3). `simular()` nunca lê entrada diretamente: consome comandos
// produzidos por entrada local, IA, rede ou bot de teste.

import type { Atributos } from '../entities/entidade';
import type { Slot } from '../modos/modo';

export type EntidadeId = string;

export interface Celula {
  x: number;
  y: number;
}

export type Dir8 = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SO' | 'O' | 'NO';

export type Comando =
  | { t: 'mover'; dir: Dir8 | 'parado' }
  | { t: 'irPara'; x: number; y: number }
  | { t: 'usarHabilidade'; id: string; alvo?: EntidadeId | Celula }
  | { t: 'ataqueBasico'; alvo?: EntidadeId }
  | { t: 'selecionarAlvo'; alvo: EntidadeId | null }
  | { t: 'usarItem'; invId: string }
  | { t: 'equipar'; invId: string; slot: Slot }
  | { t: 'desequipar'; slot: Slot }
  | { t: 'distribuirPonto'; atributo: keyof Atributos }
  | { t: 'interagir' }
  /** Marco 9A (14/10/2026): loja (com a janela aberta) e ordenação manual da mochila. */
  | { t: 'comprar'; itemId: string }
  | { t: 'vender'; invId: string }
  | { t: 'fecharLoja' }
  | { t: 'moverItem'; invId: string; posicao: number }
  /** Marco 10A-2: descanso (§2.12, só onde o modo permite). */
  | { t: 'descansar'; tipo: 'curto' | 'longo' }
  /** Marco 10A-3: dispensa as próprias invocações (§2.9). */
  | { t: 'dispensar' };

/** Envelope de rede. O servidor deriva o jogador da sessão e atribui o tick de aplicação. */
export interface ComandoEmpacotado {
  sessaoId: string;
  epocaSala: number;
  seq: number;
  tickCliente: number;
  cmd: Comando;
}

/** Comando já atribuído a uma entidade e a um tick, pronto para a simulação. */
export interface ComandoDoTick {
  tick: number;
  entidadeId: EntidadeId;
  cmd: Comando;
}

export interface FilaDeComandos {
  readonly limite: number;
  pendentes: ComandoDoTick[];
}

export function criarFila(limite = 256): FilaDeComandos {
  return { limite, pendentes: [] };
}

/** Enfileira um comando. Retorna `false` se a fila estiver cheia (fila limitada, §3.6). */
export function enfileirar(fila: FilaDeComandos, comando: ComandoDoTick): boolean {
  if (fila.pendentes.length >= fila.limite) return false;
  fila.pendentes.push(comando);
  return true;
}

/** Remove e devolve, na ordem de chegada, os comandos com tick <= `tick`. */
export function retirarAte(fila: FilaDeComandos, tick: number): ComandoDoTick[] {
  const prontos: ComandoDoTick[] = [];
  const restantes: ComandoDoTick[] = [];
  for (const c of fila.pendentes) {
    (c.tick <= tick ? prontos : restantes).push(c);
  }
  fila.pendentes = restantes;
  return prontos;
}
