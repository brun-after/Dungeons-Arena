// Marco 26 (25/10/2026, D-108): qual quadro do atlas o token mostra. Nos modelos de braços e pernas, a passada (pela
// fase do passo), o golpe (o braço da arma estendido) ou o parado; nos demais (o falcão), a sequência própria.
// Puro: visual, nunca entra na simulação.

import { balancoDaPassada, type EstiloCaminhada } from './caminhada';
import { QUADRO_GOLPE, quadroDoBalanco } from './modelos/membros';

/** Troca de quadro dos modelos de sequência própria enquanto andam. */
const QUADRO_MS = 190;

export interface ModeloDoQuadro {
  quadros: number;
  membros: boolean;
  estilo: EstiloCaminhada;
}

export interface MomentoDoQuadro {
  tMs: number;
  /** A fase da criatura (iguais não andam em uníssono). */
  fase: number;
  andando: boolean;
  /** O golpe acabou de sair (do lançamento até o fim da animação do golpe). */
  golpeando: boolean;
  /** Movimento reduzido (ou morto): o quadro parado. */
  reduzido: boolean;
  /** Um quadro pedido de fora (o falcão pousado), ou null. */
  fixo: number | null;
}

export function quadroDoToken(m: ModeloDoQuadro, q: MomentoDoQuadro): number {
  if (q.fixo !== null) return Math.min(m.quadros - 1, q.fixo);
  if (q.reduzido) return 0;
  if (m.membros) {
    if (q.golpeando) return QUADRO_GOLPE;
    return q.andando ? quadroDoBalanco(balancoDaPassada(m.estilo, q.tMs, q.fase)) : 0;
  }
  return m.quadros > 1 && q.andando ? Math.floor(q.tMs / QUADRO_MS) % m.quadros : 0;
}
