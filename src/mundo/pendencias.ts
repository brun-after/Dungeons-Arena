// O que a sala do Mundo pede ao servidor (marco 29, 30/10/2026, D-128), recolhido a cada 200 ms:
// - gravar a ficha (save na vila, checkpoint, saída) e trocar a sessão de sala (com o bilhete);
// - marco 30 (D-129): o social que passa entre salas (grupo, chat do grupo, denúncia) e o mercado do reino, cujos
//   anúncios ficam no servidor. No mercado, a sala já reservou o que o pedido precisa (o item anunciado e a taxa, ou
//   o ouro da compra): o servidor devolve ou entrega pela sala onde a pessoa estiver (ou no banco, se saiu). Puro.

import type { Celula } from '../core/comandos';
import type { ItemNaMochila } from '../entities/entidade';
import type { AcaoDoMundo } from './acoes';
import type { FichaDoMundo } from './ficha-mundo';

export type AcaoSocial = Extract<AcaoDoMundo, { a: 'grupo' } | { a: 'denunciar' }> | { a: 'chat'; canal: 'grupo'; texto: string };

export type PendenciaDoMundo =
  | { tipo: 'gravar'; identidade: string; ficha: FichaDoMundo }
  | { tipo: 'trocar'; identidade: string; sessaoId: string; ficha: FichaDoMundo; destino: string; chegada: Celula | null; instancia: string | null }
  | { tipo: 'social'; identidade: string; nome: string; lugar: string; acao: AcaoSocial }
  | {
      tipo: 'mercado';
      identidade: string;
      nome: string;
      acao: Extract<AcaoDoMundo, { a: 'mercado' }>;
      /** O que a sala já tirou do personagem para o pedido (devolvido se o pedido falhar). */
      reserva: { item: ItemNaMochila | null; ouro: number };
    };

/** O que o servidor manda a sala aplicar depois de um pedido do mercado. */
export interface ResultadoDoMercado {
  /** Devolve a reserva (o pedido falhou) ou entrega o que veio (a compra, o "receber"). */
  itens: ItemNaMochila[];
  ouro: number;
  /** Ouro que vai direto para o banco (as vendas recebidas). */
  ouroNoBanco: number;
}
