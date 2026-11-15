// D-174 (14/11/2026): o que o personagem tem de mais forte, para o visual das skills de classe e das ultimates: o eixo
// do estilo mais forte (com a faixa dele) e a afinidade dominante — a sintonia mais alta, quando ela se destaca das
// outras. Sem ficha (inimigos, quem está longe na arena), não há perfil. Só leitura.

import type { Eixo } from '../combat/eixos';
import type { ContextoSimulacao } from '../core/contexto';
import type { Entidade } from '../entities/entidade';
import { formasDosEstilos } from '../progression/estilos';
import { PONTAS_ELEMENTAIS, vinculoDe, type PontaElemental } from '../progression/vinculo';

export interface PerfilVisual {
  /** O eixo principal do estilo mais forte (null: nenhum estilo com forma). */
  eixo: Eixo | null;
  faixaEstilo: number;
  /** A afinidade que se sobressai (null: nenhuma). */
  dominante: { runa: PontaElemental; faixa: number } | null;
}

/** A dominante precisa de vínculo de verdade e de folga sobre a segunda (em fração de 0 a 1). */
const DOMINANTE_MIN = 0.3;
const DOMINANTE_FOLGA = 0.1;

export function perfilVisualDe(ctx: Pick<ContextoSimulacao, 'conteudo' | 'balance'>, e: Entidade | undefined, tick: number): PerfilVisual | null {
  if (!e?.bolsa) return null;
  const forte = [...formasDosEstilos(ctx, e)].sort((a, b) => b.faixa - a.faixa)[0];
  const v = vinculoDe(ctx, e, tick);
  const pontas = [...PONTAS_ELEMENTAIS].sort((a, b) => v[b] - v[a]);
  const [primeira, segunda] = pontas;
  const destaca = primeira !== undefined && v[primeira] >= DOMINANTE_MIN && v[primeira] - (segunda ? v[segunda] : 0) >= DOMINANTE_FOLGA;
  return {
    eixo: forte?.estilo.eixos[0] ?? null,
    faixaEstilo: forte?.faixa ?? 0,
    dominante: destaca ? { runa: primeira, faixa: Math.round(v[primeira] * 10) } : null,
  };
}
