// Marco 55 (26/11/2026, D-208): as mensagens entre a página e o trabalhador que gera as regiões.

import type { ExteriorGerado } from '../world/gerador-exterior';

export interface PedidoDeRegiao {
  pedido: number;
  regiaoId: string;
}

export interface RespostaDeRegiao {
  pedido: number;
  regiaoId: string;
  /** A região gerada em coordenadas da área dela no atlas; null se não deu. */
  ex: ExteriorGerado | null;
}
