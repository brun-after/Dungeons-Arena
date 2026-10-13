// Entidade (§2.5). Só dados, para clonar, comparar no digest e gravar em checkpoint.
// Marco 3: atributos, recursos, efeitos, ação em curso e dados de morte e respawn.

import type { Celula, Dir8, EntidadeId } from '../core/comandos';
import { clonarRng, type EstadoRng } from '../core/rng';
import type { TipoEfeito } from '../combat/efeitos';

export type TipoEntidade = 'jogador' | 'inimigo' | 'invocacao' | 'avatar';
export type EquipeId = string;
export type TipoControlador = 'local' | 'remoto' | 'ia';
export type ClasseCombate = 'corpo_a_corpo' | 'conjurador';
export type Arquetipo = 'jogador' | 'perseguidor' | 'atirador' | 'controlador' | 'boss' | 'boneco';

export interface Atributos {
  forca: number;
  destreza: number;
  constituicao: number;
  inteligencia: number;
  sabedoria: number;
  carisma: number;
}

export interface EfeitoAtivo {
  tipo: TipoEfeito;
  /** Tick em que o efeito expira (§2.7: tempo em ticks, nunca relógio de parede). */
  ateTick: number;
  origemId: EntidadeId;
}

/** Ação em conjuração (§2.7, etapa 3). Ticks publicados para a telegrafia (§3.6). */
export interface AcaoEmCurso {
  acaoId: number;
  habilidadeId: string;
  alvoId: EntidadeId | null;
  /** Célula mirada (área) ou célula do alvo no início. */
  alvoX: number;
  alvoY: number;
  inicioTick: number;
  lancamentoTick: number;
  impactoPrevistoTick: number;
}

export type ModoIa = 'patrulha' | 'hesitando' | 'perseguindo';

/** Estado da IA (§2.6). Só dados, com PRNG próprio: reproduzível no harness. */
export interface EstadoIa {
  modo: ModoIa;
  /** Tick em que o modo atual começou (para o "!" e o "?" da apresentação). */
  modoDesdeTick: number;
  alvoId: EntidadeId | null;
  hesitacaoAteTick: number;
  /** Alvos que já entraram no raio de detecção: a hesitação só é sorteada na primeira vez. */
  detectados: EntidadeId[];
  proximaAvaliacaoTick: number;
  proximoPassoTick: number;
  direcaoPatrulha: Dir8 | null;
  /** Últimas 3 células visitadas na patrulha (antitravamento, §2.3). */
  recentes: Celula[];
  proximaChecagemDesistenciaTick: number;
  falhasCaminho: number;
  /** Célula do alvo quando o caminho foi calculado (cache do perseguidor, §2.3). */
  alvoCacheX: number;
  alvoCacheY: number;
  proximoAtaqueTick: number;
  ataquesFeitos: number;
  rng: EstadoRng;
}

/** Quem causou dano e quando, para dividir XP entre participantes (§2.7, morte). */
export interface Participacao {
  id: EntidadeId;
  tick: number;
}

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
  direcao: Dir8 | 'parado';
  proximoEixoX: boolean;
  waypoints: Celula[];
  caminho: Celula[];
  relogioAndar: number;

  atributos: Atributos;
  classe: ClasseCombate;
  defesa: number;
  hp: number;
  hpMax: number;
  mana: number;
  manaMax: number;
  ataqueBasico: string;
  habilidades: string[];
  efeitos: EfeitoAtivo[];
  acao: AcaoEmCurso | null;
  alvoSelecionado: EntidadeId | null;
  autoAtaque: boolean;
  invisivelAteTick: number;
  morto: boolean;
  /** Tick em que o jogador revive; 0 quando não há revivescência pendente. */
  reviverEmTick: number;

  preset: string;
  arquetipo: Arquetipo;
  nivel: number;
  /** Incrementa a cada respawn; o id continua estável (§3.6). */
  geracao: number;
  origemX: number;
  origemY: number;
  xp: number;
  /** XP concedido ao morrer, antes do antifarm. */
  xpBase: number;
  /** Quantas vezes esta instância já morreu (antifarm, §2.12). */
  abates: number;
  participacao: Participacao[];
  /** Criado no primeiro tick para entidades de IA; null para jogadores e bonecos. */
  ia: EstadoIa | null;
}

export const ATRIBUTOS_NEUTROS: Readonly<Atributos> = {
  forca: 10,
  destreza: 10,
  constituicao: 10,
  inteligencia: 10,
  sabedoria: 10,
  carisma: 10,
};

export interface NovaEntidade {
  id: EntidadeId;
  tipo: TipoEntidade;
  x: number;
  y: number;
  nome?: string;
  equipe?: EquipeId;
  controlador?: TipoControlador;
  jogadorId?: string;
  atributos?: Partial<Atributos>;
  classe?: ClasseCombate;
  defesa?: number;
  hpMax?: number;
  manaMax?: number;
  ataqueBasico?: string;
  habilidades?: string[];
  autoAtaque?: boolean;
  preset?: string;
  arquetipo?: Arquetipo;
  nivel?: number;
  xpBase?: number;
}

export function criarEntidade(n: NovaEntidade): Entidade {
  const hpMax = n.hpMax ?? 100;
  const manaMax = n.manaMax ?? 10;
  const jogador = n.tipo === 'jogador';
  return {
    id: n.id,
    nome: n.nome ?? n.id,
    tipo: n.tipo,
    equipe: n.equipe ?? (jogador ? 'jogadores' : 'inimigos'),
    controlador: n.controlador ?? (jogador ? 'local' : 'ia'),
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
    atributos: { ...ATRIBUTOS_NEUTROS, ...n.atributos },
    classe: n.classe ?? 'corpo_a_corpo',
    defesa: n.defesa ?? 0,
    hp: hpMax,
    hpMax,
    mana: manaMax,
    manaMax,
    ataqueBasico: n.ataqueBasico ?? 'ataque_basico',
    habilidades: [...(n.habilidades ?? [])],
    efeitos: [],
    acao: null,
    alvoSelecionado: null,
    autoAtaque: n.autoAtaque ?? jogador,
    invisivelAteTick: 0,
    morto: false,
    reviverEmTick: 0,
    preset: n.preset ?? '',
    arquetipo: n.arquetipo ?? (jogador ? 'jogador' : 'perseguidor'),
    nivel: n.nivel ?? 1,
    geracao: 0,
    origemX: n.x,
    origemY: n.y,
    xp: 0,
    xpBase: n.xpBase ?? 0,
    abates: 0,
    participacao: [],
    ia: null,
  };
}

export function emPasso(e: Entidade): boolean {
  return e.destinoX !== e.x || e.destinoY !== e.y;
}

export function vivo(e: Entidade): boolean {
  return !e.morto && e.hp > 0;
}

const copiarCelulas = (lista: readonly Celula[]): Celula[] => lista.map((c) => ({ x: c.x, y: c.y }));

// Clone explícito, campo a campo (§5.3 regra 4).
export function clonarEntidade(e: Entidade): Entidade {
  return {
    ...e,
    waypoints: copiarCelulas(e.waypoints),
    caminho: copiarCelulas(e.caminho),
    atributos: { ...e.atributos },
    habilidades: [...e.habilidades],
    efeitos: e.efeitos.map((f) => ({ ...f })),
    acao: e.acao ? { ...e.acao } : null,
    participacao: e.participacao.map((p) => ({ ...p })),
    ia: e.ia
      ? {
          ...e.ia,
          detectados: [...e.ia.detectados],
          recentes: copiarCelulas(e.ia.recentes),
          rng: clonarRng(e.ia.rng),
        }
      : null,
  };
}
