// Medidor de desempenho (marco 20, 21/10/2026, D-087): fps, p95 da duração dos quadros e pausas longas, num canto da
// tela, para medir no aparelho sem PC (o `?bench` não abre no app). Opcional nas Configurações; reescreve o texto
// duas vezes por segundo, não a cada quadro.
// Marco 26 (29/10/2026, D-122): uma segunda linha com o que pesa com o tempo: entidades vivas, objetos no chão, o
// máximo de ticks num quadro, o nível de qualidade e quanto durou o último salvamento.

import { t } from '../i18n';

const JANELA = 120;
const ATUALIZACAO_MS = 500;
/** Quadro acima disto conta como pausa longa (a meta de BENCHMARKS.md é nenhuma). */
const PAUSA_LONGA_MS = 100;

export interface ResumoDoMedidor {
  fps: number;
  p95Ms: number;
  pausas: number;
}

/** Resumo de uma janela de durações de quadro (puro). */
export function resumirQuadros(duracoes: readonly number[]): ResumoDoMedidor {
  if (duracoes.length === 0) return { fps: 0, p95Ms: 0, pausas: 0 };
  const soma = duracoes.reduce((s, d) => s + d, 0);
  const ordenadas = [...duracoes].sort((a, b) => a - b);
  return {
    fps: soma > 0 ? Math.round((1000 * duracoes.length) / soma) : 0,
    p95Ms: Math.round(ordenadas[Math.min(ordenadas.length - 1, Math.floor(ordenadas.length * 0.95))] ?? 0),
    pausas: duracoes.filter((d) => d > PAUSA_LONGA_MS).length,
  };
}

/** O que a cena conta ao medidor (lido só quando o texto é reescrito). */
export interface AmostraDoMedidor {
  vivos: number;
  objetos: number;
  qualidade: string;
}

export class Medidor {
  readonly elemento: HTMLElement;
  private readonly duracoes: number[] = [];
  private pausasTotais = 0;
  private ultimaMs = 0;
  private ultimoTick: number | null = null;
  private maxTicks = 0;
  private salvamentoMs: number | null = null;

  /** Quanto durou a última gravação do save (a cópia e a gravação, na thread principal). */
  anotarSalvamento(ms: number): void {
    this.salvamentoMs = ms;
  }

  constructor() {
    this.elemento = document.createElement('div');
    this.elemento.className = 'medidor-desempenho';
    this.elemento.setAttribute('aria-hidden', 'true');
    this.elemento.hidden = true;
  }

  mostrar(sim: boolean): void {
    this.elemento.hidden = !sim;
  }

  registrar(dtMs: number, agoraMs: number, tick?: number, amostra?: () => AmostraDoMedidor): void {
    if (this.elemento.hidden) return;
    if (tick !== undefined) {
      if (this.ultimoTick !== null) this.maxTicks = Math.max(this.maxTicks, tick - this.ultimoTick);
      this.ultimoTick = tick;
    }
    this.duracoes.push(dtMs);
    if (this.duracoes.length > JANELA) this.duracoes.shift();
    if (dtMs > PAUSA_LONGA_MS) this.pausasTotais++;
    if (agoraMs - this.ultimaMs < ATUALIZACAO_MS) return;
    this.ultimaMs = agoraMs;
    const r = resumirQuadros(this.duracoes);
    const base = t('medidor.texto', { fps: r.fps, p95: r.p95Ms, pausas: this.pausasTotais });
    const a = amostra?.();
    this.elemento.textContent = a
      ? `${base}
${t('medidor.detalhe', { vivos: a.vivos, objetos: a.objetos, ticks: this.maxTicks, qualidade: a.qualidade, salvar: this.salvamentoMs === null ? '-' : Math.round(this.salvamentoMs) })}`
      : base;
    this.maxTicks = 0;
  }
}
