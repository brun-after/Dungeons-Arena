// Os avisos do Mundo (marco 29, 30/10/2026, D-128): o que a sala do Mundo manda só para uma sessão, fora do estado
// do jogo. Vão na mensagem `{ t: 'mundo', aviso }` do protocolo. Puro.
// Marco 30 (30/10/2026, D-129): o banco, o quadro de missões de verdade, o chat, o grupo, a troca e o mercado.

import type { CanalDoChat } from './acoes';
import type { EventoDaRegiao } from './eventos-mundo';
import type { ItemNaMochila } from '../entities/entidade';
import type { MissaoAtiva } from './ficha-mundo';
import type { Perigo } from './reino';

export interface DestinoDePortal {
  regiao: string;
  nome: string;
  /** Ouro da viagem (0 com o pergaminho de retorno na mochila não muda: quem tem o pergaminho escolhe gastá-lo). */
  custo: number;
}

export type MotivoDoMundo =
  | 'sem_ouro'
  | 'portal_em_recarga'
  | 'nao_descoberto'
  | 'destino_invalido'
  | 'masmorra_em_recarga'
  | 'mesmo_lugar'
  // Marco 30.
  | 'longe'
  | 'sem_item'
  | 'banco_cheio'
  | 'mochila_cheia'
  | 'missao_invalida'
  | 'missoes_cheias'
  | 'missao_incompleta'
  | 'missao_feita_hoje'
  | 'chat_rapido'
  | 'chat_vazio'
  | 'sem_grupo'
  | 'grupo_cheio'
  | 'ja_em_grupo'
  | 'nao_lider'
  | 'nao_encontrado'
  | 'convite_expirado'
  | 'troca_invalida'
  | 'troca_ocupado'
  | 'mercado_cheio'
  | 'preco_invalido'
  | 'anuncio_indisponivel'
  | 'mercado_indisponivel'
  | 'denuncia_registrada';

/** Uma pilha vista por quem não é o dono (a troca e o mercado): o item e a quantidade. */
export interface PilhaVista {
  itemId: string;
  qtd: number;
}

export interface OfertaVista {
  itens: PilhaVista[];
  ouro: number;
}

export interface MembroVisto {
  nome: string;
  classeId: string;
  nivel: number;
  /** O lugar onde está (`regiao:id`…), ou null se saiu do jogo. */
  lugar: string | null;
  lider: boolean;
}

export interface AnuncioVisto {
  id: string;
  itemId: string;
  qtd: number;
  preco: number;
  vendedor: string;
  /** Hora (ms) em que o anúncio vence e volta ao vendedor. */
  expiraEm: number;
  /** Só nos "meus": já vendido (o ouro espera em "receber"). */
  vendido?: boolean;
}

export type AvisoDoMundo =
  /** Onde a sessão está: o nome, o perigo, se há PvP e o canal (a mesma região pode ter mais de uma sala). */
  | { tipo: 'lugar'; lugar: string; nome: string; perigo: Perigo | 'dungeon'; pvp: boolean; canal: number; vilaSalva: string; descobertas: string[] }
  | { tipo: 'salvo'; vila: string }
  | { tipo: 'portais'; destinos: DestinoDePortal[]; livreEm: number; temPergaminho: boolean }
  | { tipo: 'descoberta'; lugar: string; nome: string }
  /** A sessão vai para outra sala: o cliente entra no `lugar` com o bilhete (que o servidor confere). */
  | { tipo: 'trocarSala'; lugar: string; bilhete: string; instancia: string | null }
  | { tipo: 'recompensa'; nome: string; itens: string[]; ouro?: number; xp?: number }
  /** Marco 30: o quadro da vila: as ofertas do dia, as aceitas (com o progresso) e as já entregues hoje. */
  | { tipo: 'quadro'; ofertas: string[]; ativas: MissaoAtiva[]; feitasHoje: string[] }
  /** Marco 30: uma missão aceita andou (o cliente atualiza o painel e avisa quando completa). */
  | { tipo: 'missao'; id: string; progresso: number; meta: number }
  | { tipo: 'banco'; itens: ItemNaMochila[]; ouro: number; slots: number }
  | { tipo: 'chat'; canal: CanalDoChat | 'sistema'; de: string; texto: string }
  | { tipo: 'grupo'; id: string | null; membros: MembroVisto[] }
  | { tipo: 'convite'; grupo: string; de: string }
  /**
   * A troca direta: `convite` (alguém propôs: aceitar com o `comId`), `aberta` (as duas ofertas e quem confirmou),
   * `feita` e `cancelada`.
   */
  | { tipo: 'troca'; estado: 'convite' | 'aberta' | 'feita' | 'cancelada'; com: string; comId: string; minha: OfertaVista; dele: OfertaVista; confirmei: boolean; confirmou: boolean }
  | { tipo: 'mercado'; anuncios: AnuncioVisto[]; pagina: number; total: number; meus: AnuncioVisto[]; aReceber: number }
  /** Marco 30: o evento da região começou (até `fim`, em ms) ou acabou (null). */
  | { tipo: 'evento'; evento: EventoDaRegiao | null; fim: number }
  | { tipo: 'recusa'; motivo: MotivoDoMundo };
