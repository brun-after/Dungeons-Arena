// Marco 50 (21/11/2026, D-196): os números da alquimia (balance.json, bloco `alquimia`). O par divide 112% em duas
// funções e o trio 130% em três; a ressonância só vale com todos os pares harmônicos, e cada par instável encarece.
// A compreensão é o uso que a skill precisa antes de entrar numa fórmula. Puro.

export interface RegraDaMistura {
  /** O poder total (%) dividido pelas funções. */
  orcamentoPct: number;
  /** Multiplicadores do maior custo e da maior recarga entre as partes. */
  custo: number;
  recarga: number;
  /** Quantas runas elementais cabem (encaixes). */
  runas: number;
}

export interface RegrasAlquimia {
  par: RegraDaMistura;
  trio: RegraDaMistura;
  ressonanciaPct: number;
  instavel: { custoParPct: number; custoTrioPct: number; recargaPct: number };
  /** A runa de um elemento já presente amplifica; a de um elemento novo põe a camada dele. */
  runa: { amplificaPct: number; camadaPct: number };
  compreensao: {
    /** O ganho por acerto (%), na skill comum e na fusão. */
    comumPct: number;
    fusaoPct: number;
    /** Só conta o inimigo de nível igual ou maior que o do personagem menos esta faixa. */
    faixaNivel: number;
    /** A essência da família da skill acelera (uma vez por skill). */
    essenciaPct: number;
  };
  /** A runa elemental que cai da criatura do elemento (%), na comum e no chefe. */
  dropRuna: { chancePct: number; chefePct: number };
  /**
   * Marco 52 (21/11/2026, D-198): os níveis de raridade da fusão. O 3º é o comum (o resto da chance); o 2º e o 1º têm
   * a chance base, que sobe com a Inteligência acima de 10 até o teto, e o bônus no dano, na cura e nos estados.
   */
  raridade: { segundo: NivelDeRaridade; primeiro: NivelDeRaridade };
}

export interface NivelDeRaridade {
  bonusPct: number;
  chancePct: number;
  porIntPct: number;
  maxPct: number;
}

/** O bônus (%) do nível de raridade no dano, na cura e na força dos estados. */
export function bonusDaRaridade(r: Pick<RegrasAlquimia, 'raridade'>, raridade: 1 | 2 | 3): number {
  return raridade === 1 ? r.raridade.primeiro.bonusPct : raridade === 2 ? r.raridade.segundo.bonusPct : 0;
}
