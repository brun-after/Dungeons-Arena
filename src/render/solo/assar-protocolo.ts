// As mensagens entre a página e o trabalhador que pinta o chão (22/11/2026, D-202).

import type { AreaAmbiente } from '../../world/ambiente-tipos';
import type { SoloTema, TexturaSolo } from '../../world/solo';
import type { PesosDoBloco } from './mascaras';

export type MensagemAoTrabalhador =
  | {
      tipo: 'assador';
      id: number;
      texturas: [TexturaSolo, ImageBitmap][];
      tema: SoloTema;
      escala: number;
      areas: readonly AreaAmbiente[];
      semente: number;
    }
  | { tipo: 'soltar'; id: number }
  | { tipo: 'assar'; id: number; pedido: number; pesos: PesosDoBloco; origemX: number; origemY: number; largura: number; altura: number };

export interface RespostaDoTrabalhador {
  pedido: number;
  imagem: ImageBitmap | null;
}
