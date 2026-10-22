// Modo de desempenho (marco 20, 21/10/2026, D-087): teto de quadros por segundo e escala da resolução do palco.
// Puro, testável sem navegador. Vale no navegador e no app Android; a simulação continua no passo fixo (ticks), só o
// desenho (e o laço que o agenda) fica mais espaçado.

import type { EscolhaFps, EscolhaResolucao, NivelQualidade } from '../plataforma/preferencias';

/** Fator sobre o DPR: alta = 1, média = 0,75, baixa = 0,5; automática = média no toque, alta no desktop. */
export function escalaDaResolucao(escolha: EscolhaResolucao, toque: boolean): number {
  switch (escolha) {
    case 'alta':
      return 1;
    case 'media':
      return 0.75;
    case 'baixa':
      return 0.5;
    case 'auto':
      return toque ? 0.75 : 1;
  }
}

/** Resolução do renderizador: o DPR com teto, vezes a escala (nunca abaixo de 0,5). */
export function resolucaoDoPalco(dpr: number, teto: number, escala: number): number {
  return Math.max(0.5, Math.min(dpr || 1, teto) * escala);
}

/** Quadros por segundo desejados: automático = 60, e 30 quando a qualidade automática já chegou ao mínimo. */
export function fpsAlvo(escolha: EscolhaFps, nivel: NivelQualidade): 30 | 60 {
  if (escolha === '30') return 30;
  if (escolha === '60') return 60;
  return nivel === 'minimo' ? 30 : 60;
}

/** Folga para o vsync: um quadro de 60 Hz que chega 2 ms antes ainda conta para 30 fps. */
const FOLGA_MS = 2;

/** Decide, a cada quadro do navegador, se este quadro desenha (com teto de fps). */
export class PuladorDeQuadros {
  private proximoMs: number | null = null;

  deveDesenhar(agoraMs: number, alvo: number): boolean {
    if (alvo >= 60) {
      this.proximoMs = null;
      return true;
    }
    const intervalo = 1000 / alvo;
    if (this.proximoMs !== null && agoraMs < this.proximoMs - FOLGA_MS) return false;
    // Atrasou demais (aba escondida, travada): recomeça a contagem em vez de desenhar vários seguidos.
    this.proximoMs = this.proximoMs === null || agoraMs - this.proximoMs > intervalo ? agoraMs + intervalo : this.proximoMs + intervalo;
    return true;
  }
}
