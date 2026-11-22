// A interação em curso de uma entidade (marco 9A; separada de entidade.ts em 22/11/2026, marco 53, pelo limite de linhas).

/**
 * Interação em curso com baú ou loja (§2.10, marco 9A): enquanto existir, a entidade está
 * congelada (não anda nem age). Termina na etapa 5 do tick em `ateTick`, ao fechar ou ao morrer.
 */
export interface Interacao {
  /** Marco 18: `desarme` de armadilha revelada (o `objetoId` é o id da armadilha em texto). */
  tipo: 'bau' | 'loja' | 'desarme' | 'coleta';
  objetoId: string;
  ateTick: number;
  /**
   * Marco 53 (22/11/2026, D-203): as vendas desta janela da loja, que o jogador ainda pode desfazer (devolve o ouro e
   * recebe o item de volta). O negócio só se fecha quando a loja fecha (a janela some e a lista com ela).
   */
  vendas?: VendaDesfazivel[];
}

/** Marco 53 (D-203): uma venda feita nesta janela da loja: o item, quantas, o `ref` (o livro raro) e o ouro recebido. */
export interface VendaDesfazivel {
  itemId: string;
  qtd: number;
  ref: string | null;
  preco: number;
}
