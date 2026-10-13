// Entidade (§2.5). Só dados, para clonar, comparar no digest e gravar em checkpoint.
// Marco 2: identidade, equipe, controlador, movimento e HP. Recursos, efeitos e recargas
// entram com o combate (marco 3).

import type { Celula, Dir8, EntidadeId } from '../core/comandos';

export type TipoEntidade = 'jogador' | 'inimigo' | 'invocacao' | 'avatar';
export type EquipeId = string;
export type TipoControlador = 'local' | 'remoto' | 'ia';

export interface Entidade {
  id: EntidadeId;
  nome: string;
  /** O que é. Nunca decide hostilidade (§2.5): isso é papel de `relacao()`. */
  tipo: TipoEntidade;
  /** De que lado está. */
  equipe: EquipeId;
  controlador: TipoControlador;
  /** Jogador que controla, quando `controlador` não é IA. Vazio para IA. */
  jogadorId: string;

  /** Posição lógica em células (§2.2): a origem do passo em curso. */
  x: number;
  y: number;
  /** Célula de destino do passo em curso; igual a (x, y) quando parado. Fica reservada. */
  destinoX: number;
  destinoY: number;
  /** Fração do passo em curso, em [0, 1). */
  progressoPasso: number;
  /** Direção mantida pela entrada (§2.3). */
  direcao: Dir8 | 'parado';
  /** Alternância X/Y da diagonal: true = próximo passo diagonal vai em X. */
  proximoEixoX: boolean;
  /** Fila curta de células a seguir (no máximo `filaMaxWaypoints`). */
  waypoints: Celula[];
  /** Resto do caminho de um `irPara`, que reabastece a fila. */
  caminho: Celula[];
  /** Avança por distância percorrida, não por tempo de parede (§2.3). */
  relogioAndar: number;

  destreza: number;
  hp: number;
  hpMax: number;
}

export interface NovaEntidade {
  id: EntidadeId;
  tipo: TipoEntidade;
  x: number;
  y: number;
  nome?: string;
  equipe?: EquipeId;
  controlador?: TipoControlador;
  jogadorId?: string;
  destreza?: number;
  hpMax?: number;
}

export function criarEntidade(n: NovaEntidade): Entidade {
  const hpMax = n.hpMax ?? 100;
  return {
    id: n.id,
    nome: n.nome ?? n.id,
    tipo: n.tipo,
    equipe: n.equipe ?? (n.tipo === 'jogador' ? 'jogadores' : 'inimigos'),
    controlador: n.controlador ?? (n.tipo === 'jogador' ? 'local' : 'ia'),
    jogadorId: n.jogadorId ?? '',
    x: n.x,
    y: n.y,
    destinoX: n.x,
    destinoY: n.y,
    progressoPasso: 0,
    direcao: 'parado',
    proximoEixoX: true,
    waypoints: [],
    caminho: [],
    relogioAndar: 0,
    destreza: n.destreza ?? 10,
    hp: hpMax,
    hpMax,
  };
}

export function emPasso(e: Entidade): boolean {
  return e.destinoX !== e.x || e.destinoY !== e.y;
}

const copiarCelulas = (lista: readonly Celula[]): Celula[] => lista.map((c) => ({ x: c.x, y: c.y }));

// Clone explícito, campo a campo (§5.3 regra 4).
export function clonarEntidade(e: Entidade): Entidade {
  return {
    id: e.id,
    nome: e.nome,
    tipo: e.tipo,
    equipe: e.equipe,
    controlador: e.controlador,
    jogadorId: e.jogadorId,
    x: e.x,
    y: e.y,
    destinoX: e.destinoX,
    destinoY: e.destinoY,
    progressoPasso: e.progressoPasso,
    direcao: e.direcao,
    proximoEixoX: e.proximoEixoX,
    waypoints: copiarCelulas(e.waypoints),
    caminho: copiarCelulas(e.caminho),
    relogioAndar: e.relogioAndar,
    destreza: e.destreza,
    hp: e.hp,
    hpMax: e.hpMax,
  };
}
