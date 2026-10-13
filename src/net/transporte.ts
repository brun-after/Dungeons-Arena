// Interface única de transporte (§3.1, §3.6): a rede local simulada (marco 4) e o WebSocket seguro
// (marco 5) implementam a mesma coisa. Mensagens são texto (JSON).

export interface Transporte {
  enviar(texto: string): void;
  aoReceber(ouvinte: (texto: string) => void): void;
  fechar(): void;
}
