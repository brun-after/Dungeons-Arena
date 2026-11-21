// Marco 48 (20/11/2026, D-193): os números do que os elementos ferem (balance.json, bloco elementosFerem), lidos por
// combat/elementos-ferem.ts e combat/estado-do-golpe.ts. Fora do contexto.ts para ele caber nas 800 linhas.

export interface RegrasElementosFerem {
  /** % do golpe que cada tique do estado fere (o consagrado: % do golpe que cura quem acerta). */
  estadoPctDoGolpe: Readonly<Partial<Record<string, number>>>;
  /** Quantas camadas o estado soma (o veneno). */
  camadasMax: Readonly<Partial<Record<string, number>>>;
  /** Cada ponto do `dano_direto` de uma reação vale este % do golpe (piso: o valor com a potência). */
  reacaoDanoDiretoPorPontoPct: number;
  /** O raio: o eletrizado descarrega em cadeia no golpe seguinte. */
  descarga: { pct: number; alvos: number; raio: number };
  /** O gelo: o golpe de outro elemento no congelado estilhaça em volta. */
  estilhaco: { pct: number; raio: number };
  /** A terra: o golpe no enraizado esmaga; se ele já estava lento, atordoa. */
  esmagar: { pct: number; atordoaMs: number };
  /** As trevas: o golpe no marcado cura quem marcou neste % do dano. */
  drenoDoMarcadoPct: number;
  /** O psíquico: o golpe no exposto ecoa neste %. */
  ecoDoExpostoPct: number;
  /** O Físico: o crítico sem elemento abre um sangramento. */
  sangramentoNoCritico: { duracaoMs: number };
  /** O fogo: quem morre queimando passa a queimadura aos vizinhos (com parte da duração). */
  espalharQueimando: { raio: number; duracaoPct: number };
  /** O mesmo efeito de elemento só volta no mesmo alvo depois disto. */
  intervaloMs: number;
  /** Entre dois personagens, o estado guarda só este % do golpe (o PvP segue no ritmo de `metas.pvpLivre`). */
  entrePersonagensPct: number;
  /** Entre dois personagens, a reação soma só este % do bônus dela. */
  entrePersonagensReacaoPct: number;
}
