// Fila de comandos (§3.3). `simular()` nunca lê entrada diretamente: consome comandos
// produzidos por entrada local, IA, rede ou bot de teste.

import type { Dificuldade } from '../modos/dificuldade';
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
  // Ajuste de 15/10/2026 (D-065): `travar` (padrão true com alvo): a escolha manual trava; false destrava.
  | { t: 'selecionarAlvo'; alvo: EntidadeId | null; travar?: boolean }
  | { t: 'usarItem'; invId: string }
  | { t: 'soltarItem'; invId: string; qtd: number }
  | { t: 'equipar'; invId: string; slot: Slot }
  | { t: 'desequipar'; slot: Slot }
  | { t: 'distribuirPonto'; atributo: keyof Atributos }
  | { t: 'interagir' }
  /** Ajuste de 16/10/2026 (D-067): abriu a mochila (gasta a carga de refúgio, se houver). */
  | { t: 'abrirMenu' }
  /** Marco 9A (14/10/2026): loja (com a janela aberta) e ordenação manual da mochila. */
  | { t: 'comprar'; itemId: string }
  | { t: 'vender'; invId: string }
  | { t: 'fecharLoja' }
  | { t: 'moverItem'; invId: string; posicao: number }
  /** Marco 10A-3: dispensa as próprias invocações (§2.9). */
  | { t: 'dispensar' }
  /** Marco 14: sobe o rank (ou aprende, do 0 para o 1); nos ranks de evolução, com o caminho escolhido. */
  | { t: 'subirRank'; id: string; caminho?: string; invId?: string; rankEsperado?: number }
  /** Legado D-068: recusado com orientação para usar Aceleração da mente (D-075). */
  | { t: 'acelerarEstudo' }
  /** Marco 18 (D-070): forja na loja aberta (`invId` é a peça Lendária quando a receita ascende). */
  | { t: 'forjar'; receita: string; invId?: string }
  /** Marco 14: põe uma habilidade conhecida numa das 4 teclas (null limpa a tecla). */
  | { t: 'equiparHabilidade'; id: string | null; slot: number }
  /** Marco 15: troca a dificuldade do mundo (o personagem não muda). */
  | { t: 'definirDificuldade'; nivel: Dificuldade };

/** Marco 15: os tipos de comando, para os modos listarem quais aceitam pela rede (`comandosDeRede`). */
export const TIPOS_DE_COMANDO: readonly Comando['t'][] = [
  'mover',
  'irPara',
  'usarHabilidade',
  'ataqueBasico',
  'selecionarAlvo',
  'usarItem',
  'soltarItem',
  'equipar',
  'desequipar',
  'distribuirPonto',
  'interagir',
  'abrirMenu',
  'comprar',
  'vender',
  'fecharLoja',
  'moverItem',
  'dispensar',
  'subirRank',
  'acelerarEstudo',
  'forjar',
  'equiparHabilidade',
  'definirDificuldade',
];

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
