// Deslocamentos visíveis (marco 26, 29/10/2026, D-124). A simulação move o corpo de uma vez (puxão, empurrão,
// arremesso, avanço, troca) e o interpolador pula saltos grandes. Com o evento `deslocado`, o desenho desliza o corpo
// de onde estava até onde foi, em ~220 ms (o puxão espera a corrente chegar: `atrasoMs`). Só apresentação: a posição
// da simulação não muda.

import type { PontoVisual } from '../../entities/entidade';
import type { CausaDeslocamento } from '../../core/eventos-simulacao';

const DURACAO_MS: Record<CausaDeslocamento, number> = {
  puxao: 240,
  empurrao: 200,
  arremesso: 260,
  avanco: 140,
  troca: 180,
  teleporte: 0,
};

interface Deslize {
  de: PontoVisual;
  para: PontoVisual;
  inicio: number;
  ms: number;
  causa: CausaDeslocamento;
}

/** O puxão acelera no fim (a corrente recolhe com força); o empurrão sai rápido e freia. */
function andamento(causa: CausaDeslocamento, t: number): number {
  if (causa === 'puxao') return t * t;
  return 1 - (1 - t) * (1 - t);
}

export class Deslizes {
  private readonly ativos = new Map<string, Deslize>();

  anotar(id: string, de: PontoVisual, para: PontoVisual, causa: CausaDeslocamento, agoraMs: number, atrasoMs = 0): void {
    const ms = DURACAO_MS[causa];
    if (ms <= 0) return;
    this.ativos.set(id, { de, para, inicio: agoraMs + atrasoMs, ms, causa });
  }

  /** O ponto visual da entidade agora, no meio do deslize (ou o da base, sem deslize ou depois dele). */
  ponto(id: string, base: PontoVisual, agoraMs: number): PontoVisual {
    const d = this.ativos.get(id);
    if (!d) return base;
    const t = (agoraMs - d.inicio) / d.ms;
    if (t >= 1) {
      this.ativos.delete(id);
      return base;
    }
    if (t <= 0) return d.de;
    const f = andamento(d.causa, t);
    // O arremesso sobe num arco (a altura em células, na tela vira o pulo).
    const arco = d.causa === 'arremesso' ? Math.sin(t * Math.PI) * 0.45 : 0;
    return { x: d.de.x + (d.para.x - d.de.x) * f, y: d.de.y + (d.para.y - d.de.y) * f - arco };
  }

  /** Quem está deslizando agora (o rastro do avanço). */
  deslizando(id: string, agoraMs: number): boolean {
    const d = this.ativos.get(id);
    return !!d && agoraMs >= d.inicio && agoraMs < d.inicio + d.ms;
  }

  limpar(): void {
    this.ativos.clear();
  }
}
