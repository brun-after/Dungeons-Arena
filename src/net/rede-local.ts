// Rede local simulada para o loopback (§3.6, tools/rede-simulada). Como o WebSocket, é confiável e
// ordenada: uma mensagem nunca ultrapassa a anterior no mesmo sentido. Latência e jitter atrasam a
// entrega; "perda" vira retransmissão (TCP), atrasando a mensagem e bloqueando as seguintes.
// Tudo é semeado e determinístico; quem chama `bombear` decide o relógio.

import { aleatorio, criarRng, type EstadoRng } from '../core/rng';
import type { Transporte } from './transporte';

export interface CondicaoDeRede {
  /** Atraso de ida, em ms (RTT ≈ 2 × latência). */
  latenciaMs: number;
  /** Variação máxima, para mais ou para menos, em ms. */
  jitterMs: number;
  /** Chance de uma mensagem precisar de retransmissão. */
  perda: number;
  /** Atraso extra de uma retransmissão. */
  retransmissaoMs: number;
}

export const REDE_PERFEITA: CondicaoDeRede = { latenciaMs: 0, jitterMs: 0, perda: 0, retransmissaoMs: 200 };

interface Mensagem {
  entregaMs: number;
  texto: string;
}

class Sentido {
  fila: Mensagem[] = [];
  ultimaEntregaMs = -Infinity;
  ouvinte: ((texto: string) => void) | null = null;
  fechado = false;
}

export class RedeLocal {
  private readonly sentidos: Sentido[] = [];
  private readonly rng: EstadoRng;
  private agoraMs = 0;

  constructor(
    public condicao: CondicaoDeRede,
    semente = 1,
  ) {
    this.rng = criarRng(semente);
  }

  /** Cria uma conexão: devolve a ponta do cliente e a do servidor. */
  conectar(): { cliente: Transporte; servidor: Transporte } {
    const paraServidor = new Sentido();
    const paraCliente = new Sentido();
    this.sentidos.push(paraServidor, paraCliente);
    return { cliente: this.ponta(paraServidor, paraCliente), servidor: this.ponta(paraCliente, paraServidor) };
  }

  private ponta(saida: Sentido, entrada: Sentido): Transporte {
    return {
      enviar: (texto) => {
        if (saida.fechado) return;
        const c = this.condicao;
        let atraso = c.latenciaMs + (aleatorio(this.rng) * 2 - 1) * c.jitterMs;
        if (aleatorio(this.rng) < c.perda) atraso += c.retransmissaoMs;
        // Ordenada: nunca antes da anterior (bloqueio por retransmissão, como no TCP).
        const entregaMs = Math.max(saida.ultimaEntregaMs, this.agoraMs + Math.max(0, atraso));
        saida.ultimaEntregaMs = entregaMs;
        saida.fila.push({ entregaMs, texto });
      },
      aoReceber: (ouvinte) => {
        entrada.ouvinte = ouvinte;
      },
      fechar: () => {
        saida.fechado = true;
        entrada.fechado = true;
        saida.fila = [];
        entrada.fila = [];
      },
    };
  }

  /** Avança o relógio da rede e entrega tudo o que venceu, na ordem. */
  bombear(agoraMs: number): void {
    this.agoraMs = agoraMs;
    for (const s of this.sentidos) {
      while (s.fila.length > 0 && (s.fila[0]?.entregaMs ?? Infinity) <= agoraMs) {
        const m = s.fila.shift();
        if (m && s.ouvinte && !s.fechado) s.ouvinte(m.texto);
      }
    }
  }
}
