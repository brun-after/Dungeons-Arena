// Barramento de eventos tipado (§3.3): desacopla HUD, áudio e efeitos da simulação.
// A simulação não chama o barramento: ela grava eventos numa lista de saída do tick,
// e o adaptador de apresentação publica essa lista aqui depois do tick.

type Ouvinte<P> = (payload: P) => void;

export class Barramento<Mapa extends object> {
  private readonly ouvintes = new Map<keyof Mapa, Set<Ouvinte<never>>>();

  /** Inscreve um ouvinte. Retorna a função que cancela a inscrição. */
  on<K extends keyof Mapa>(evento: K, ouvinte: Ouvinte<Mapa[K]>): () => void {
    let conjunto = this.ouvintes.get(evento);
    if (!conjunto) {
      conjunto = new Set();
      this.ouvintes.set(evento, conjunto);
    }
    conjunto.add(ouvinte);
    return () => conjunto.delete(ouvinte);
  }

  emitir<K extends keyof Mapa>(evento: K, payload: Mapa[K]): void {
    const conjunto = this.ouvintes.get(evento);
    if (!conjunto) return;
    for (const ouvinte of conjunto) (ouvinte as Ouvinte<Mapa[K]>)(payload);
  }

  limpar(): void {
    this.ouvintes.clear();
  }
}
