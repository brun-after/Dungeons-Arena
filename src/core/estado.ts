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
  atravessa: boolean;
  /** Quem já foi atingido (o projétil que atravessa não acerta o mesmo alvo duas vezes). */
  atingidos: EntidadeId[];
}

export type TipoObjeto = 'orbe_hp' | 'orbe_recurso' | 'orbe_efeito' | 'item';

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
    proximoId: 1,
  };
}

export function buscarEntidade(estado: EstadoJogo, id: EntidadeId): Entidade | undefined {
  return estado.entidades.find((e) => e.id === id);
}

export function novoId(estado: EstadoJogo): number {
  return estado.proximoId++;
}

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
    objetos: estado.objetos.map((o) => ({ ...o, efeito: o.efeito ? { ...o.efeito } : null })),
    respawns: estado.respawns.map((r) => ({ ...r })),
    proximoId: estado.proximoId,
  };
}
