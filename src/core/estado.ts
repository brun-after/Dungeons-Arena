// Estado raiz da simulação (§3.3). Um único objeto tipado, só com dados: sem classes,
// sem funções e sem referências cíclicas, para clonar, comparar (digest) e gravar em checkpoint.
// O terreno da fase é conteúdo imutável e fica no contexto (D-007); aqui só o `faseId`.

import type { EfeitoCanonico } from '../combat/registro-efeitos';
import type { EntidadeId } from './comandos';
import { clonarEntidade, type Entidade } from '../entities/entidade';
import { clonarRng, criarRng, type EstadoRng } from './rng';

export { criarEntidade, clonarEntidade, type Entidade } from '../entities/entidade';

/** Projétil em voo (§2.7, etapa 4). Continua mesmo se o lançador morrer ou for atordoado. */
export interface Projetil {
  id: number;
  acaoId: number;
  donoId: EntidadeId;
  equipeDono: string;
  habilidadeId: string;
  /** Marco 14: a chave compilada; o projétil se resolve por ela mesmo se o conjurador morrer. */
  chave: string;
  /** Posição contínua em células (centro da célula = coordenada inteira). */
  x: number;
  y: number;
  dirX: number;
  dirY: number;
  /** Distância que ainda pode percorrer, em células. */
  restante: number;
  /** Células por segundo. */
  velocidade: number;
  /** Bônus de atributo e Carisma do lançador congelados no lançamento. */
  bonusAtributo: number;
  carisma: number;
  /** Marco 8A: multiplicador de dano e perfuração (`atravessar`) congelados no lançamento. */
  multDano: number;
  /** Marco 14: multiplicador de cura (rank, caminhos e perfil) congelado no lançamento. */
  multCura: number;
  atravessa: boolean;
  /** Quem já foi atingido (o projétil que atravessa não acerta o mesmo alvo duas vezes). */
  atingidos: EntidadeId[];
}

/**
 * Marco 9A (14/10/2026): `bau`, `loja` (interagíveis) e `ouro` (coletado ao pisar). Marco 10A-1:
 * `saida`, a porta temporária que surge onde o boss morre (§2.1).
 */
export type TipoObjeto = 'orbe_hp' | 'orbe_recurso' | 'orbe_efeito' | 'item' | 'ouro' | 'bau' | 'loja' | 'saida';

/**
 * Objeto coletável no mundo (§2.1). `objetoId` é estável; a coleta é uma transação dentro do
 * tick (§3.6): verifica, consome e transfere sem pausa entre os passos.
 */
export interface ObjetoNoMundo {
  objetoId: string;
  tipo: TipoObjeto;
  x: number;
  y: number;
  valor: number;
  modo: 'abs' | 'pct';
  geracao: number;
  /** Só para `tipo: 'item'` (marco 6); null nos orbes. */
  itemId: string | null;
  /** Só para `tipo: 'orbe_efeito'` (marco 8A); null nos demais. */
  efeito: EfeitoCanonico | null;
  /**
   * Marco 9A: conteúdo do baú ou estoque da loja (ids de item); vazio nos demais. No `item`, a
   * quantidade é o `valor`; no `ouro`, o `valor` é a quantia.
   */
  itens: string[];
  /** Ouro dentro do baú; 0 nos demais. */
  ouro: number;
  /** Item exigido (e consumido) para abrir o baú; null quando não está trancado. */
  chave: string | null;
  /** Tick em que o baú foi aberto (some depois de `bauSomeMs`); 0 enquanto fechado. */
  abertoTick: number;
  /** Quem está abrindo o baú agora: um abridor por vez (§3.6); null quando livre. */
  abridorId: EntidadeId | null;
}

/** Célula de rastro (§2.8): aplica dano ou efeito a quem é hostil ao dono e entra nela. */
export interface Rastro {
  x: number;
  y: number;
  donoId: EntidadeId;
  equipeDono: string;
  tipo: 'rastro_dano' | 'rastro_efeito';
  valor: number;
  interno: EfeitoCanonico | null;
  ateTick: number;
  /** Quem já foi atingido por esta célula (uma vez por célula). */
  atingidos: EntidadeId[];
}

/** Dono e equipe das armadilhas de fase e do spawner (marco 9A-2): o disparo segue `relacao()`. */
export const DONO_FASE = 'fase';

/**
 * Armadilha (§2.11): de habilidade (disparo único no primeiro hostil que pisar), de fase (conteúdo,
 * permanente, única ou com rearme) ou do spawner (única, expira). Marco 9A-2 (14/10/2026).
 */
export interface Armadilha {
  id: number;
  donoId: EntidadeId;
  equipeDono: string;
  x: number;
  y: number;
  valor: number;
  interno: EfeitoCanonico | null;
  ateTick: number;
  /** De onde veio: só as de habilidade contam no limite do jogador; o spawner conta as dele. */
  origem: 'habilidade' | 'fase' | 'spawner';
  /** Não expira por tempo (as da fase). */
  permanente: boolean;
  /** 0 = disparo único; senão, depois de disparar fica inerte por estes ticks e volta. */
  rearmeTicks: number;
  inerteAteTick: number;
}

/** Efeito agendado para disparar numa entidade (§2.8, `efeito_atrasado`). */
export interface Atrasado {
  alvoId: EntidadeId;
  origemId: EntidadeId;
  origemX: number;
  origemY: number;
  disparaTick: number;
  efeito: EfeitoCanonico;
}

/** Respawn agendado de um inimigo (§2.5): o id continua estável e a geração incrementa. */
export interface RespawnPendente {
  id: EntidadeId;
  preset: string;
  x: number;
  y: number;
  nivel: number;
  geracao: number;
  abates: number;
  noTick: number;
}

export interface EstadoJogo {
  versao: 1;
  faseId: string;
  tick: number;
  rng: EstadoRng;
  entidades: Entidade[];
  /** Expiração de recarga em tick, por `entidadeId_habilidadeId` (§2.7). */
  recargas: Record<string, number>;
  projeteis: Projetil[];
  objetos: ObjetoNoMundo[];
  respawns: RespawnPendente[];
  /** Marco 8A-2: rastros, armadilhas e efeitos atrasados. */
  rastros: Rastro[];
  armadilhas: Armadilha[];
  atrasados: Atrasado[];
  /** Marco 10A-1: a porta de saída trancada já foi aberta (boss morto ou chave usada) e fica aberta. */
  saidaAberta: boolean;
  /** Gerador de IDs de ação e de projétil, para não duplicar VFX/som (§3.6). */
  proximoId: number;
}

export interface OpcoesEstado {
  semente: number;
  faseId: string;
}

export function criarEstado(opcoes: OpcoesEstado): EstadoJogo {
  return {
    versao: 1,
    faseId: opcoes.faseId,
    tick: 0,
    rng: criarRng(opcoes.semente),
    entidades: [],
    recargas: {},
    projeteis: [],
    objetos: [],
    respawns: [],
    rastros: [],
    armadilhas: [],
    atrasados: [],
    saidaAberta: false,
    proximoId: 1,
  };
}

export function buscarEntidade(estado: EstadoJogo, id: EntidadeId): Entidade | undefined {
  return estado.entidades.find((e) => e.id === id);
}

export function novoId(estado: EstadoJogo): number {
  return estado.proximoId++;
}

const copiaEfeito = (e: EfeitoCanonico | null): EfeitoCanonico | null => (e ? { ...e, interno: e.interno ? { ...e.interno } : null } : null);

// Clone explícito, campo a campo (§5.3 regra 4): nada de ida e volta por JSON em estado vivo.
export function clonarEstado(estado: EstadoJogo): EstadoJogo {
  return {
    versao: estado.versao,
    faseId: estado.faseId,
    tick: estado.tick,
    rng: clonarRng(estado.rng),
    entidades: estado.entidades.map(clonarEntidade),
    recargas: { ...estado.recargas },
    projeteis: estado.projeteis.map((p) => ({ ...p, atingidos: [...p.atingidos] })),
    objetos: estado.objetos.map((o) => ({ ...o, efeito: copiaEfeito(o.efeito), itens: [...o.itens] })),
    respawns: estado.respawns.map((r) => ({ ...r })),
    rastros: estado.rastros.map((r) => ({ ...r, interno: copiaEfeito(r.interno), atingidos: [...r.atingidos] })),
    armadilhas: estado.armadilhas.map((a) => ({ ...a, interno: copiaEfeito(a.interno) })),
    atrasados: estado.atrasados.map((a) => ({ ...a, efeito: { ...a.efeito, interno: copiaEfeito(a.efeito.interno) } })),
    saidaAberta: estado.saidaAberta,
    proximoId: estado.proximoId,
  };
}
