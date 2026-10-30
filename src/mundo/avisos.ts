// Os avisos do Mundo (marco 29, 30/10/2026, D-128): o que a sala do Mundo manda só para uma sessão, fora do estado
// do jogo. Vão na mensagem `{ t: 'mundo', aviso }` do protocolo. Puro.

import type { Perigo } from './reino';

export interface DestinoDePortal {
  regiao: string;
  nome: string;
  /** Ouro da viagem (0 com o pergaminho de retorno na mochila não muda: quem tem o pergaminho escolhe gastá-lo). */
  custo: number;
}

export type MotivoDoMundo = 'sem_ouro' | 'portal_em_recarga' | 'nao_descoberto' | 'destino_invalido' | 'masmorra_em_recarga' | 'mesmo_lugar';

export type AvisoDoMundo =
  /** Onde a sessão está: o nome, o perigo, se há PvP e o canal (a mesma região pode ter mais de uma sala). */
  | { tipo: 'lugar'; lugar: string; nome: string; perigo: Perigo | 'dungeon'; pvp: boolean; canal: number; vilaSalva: string; descobertas: string[] }
  | { tipo: 'salvo'; vila: string }
  | { tipo: 'portais'; destinos: DestinoDePortal[]; livreEm: number; temPergaminho: boolean }
  | { tipo: 'descoberta'; lugar: string; nome: string }
  /** A sessão vai para outra sala: o cliente entra no `lugar` com o bilhete (que o servidor confere). */
  | { tipo: 'trocarSala'; lugar: string; bilhete: string; instancia: string | null }
  | { tipo: 'recompensa'; nome: string; itens: string[] }
  | { tipo: 'quadro'; missoes: string[] }
  | { tipo: 'recusa'; motivo: MotivoDoMundo };
