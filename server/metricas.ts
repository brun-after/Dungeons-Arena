// Métricas do servidor (§3.6, "Operação"): tick p95/p99, atraso do agendador e banda, em janelas
// circulares. Registradas em log estruturado (JSON por linha) para a VM e para o benchmark.

import { monitorEventLoopDelay } from 'node:perf_hooks';

export class Janela {
  private readonly valores: Float64Array;
  private indice = 0;
  private cheios = 0;

  constructor(tamanho = 600) {
    this.valores = new Float64Array(tamanho);
  }

  registrar(v: number): void {
    this.valores[this.indice] = v;
    this.indice = (this.indice + 1) % this.valores.length;
    this.cheios = Math.min(this.valores.length, this.cheios + 1);
  }

  percentil(p: number): number {
    if (this.cheios === 0) return 0;
    const ordenados = Array.from(this.valores.subarray(0, this.cheios)).sort((a, b) => a - b);
    return ordenados[Math.min(ordenados.length - 1, Math.floor(ordenados.length * p))] ?? 0;
  }

  get quantidade(): number {
    return this.cheios;
  }
}

/**
 * Marco 16 (15/10/2026, D-062): atraso do laço de eventos do processo (o "agendador": quanto um timer atrasa).
 * Um monitor só por processo, criado na partida do servidor.
 */
export interface AtrasoDoAgendador {
  p95Ms: () => number;
  p99Ms: () => number;
}

export function monitorarAgendador(): AtrasoDoAgendador {
  const h = monitorEventLoopDelay({ resolution: 10 });
  h.enable();
  const ms = (p: number) => Math.round((h.percentile(p) / 1e6) * 100) / 100;
  // Janela deslizante grosseira: zera a cada minuto, para o número refletir o agora.
  setInterval(() => {
    h.reset();
  }, 60_000).unref();
  return { p95Ms: () => ms(95), p99Ms: () => ms(99) };
}

export function registrarLog(evento: string, dados: Record<string, unknown>): void {
  console.log(JSON.stringify({ quando: new Date().toISOString(), evento, ...dados }));
}
