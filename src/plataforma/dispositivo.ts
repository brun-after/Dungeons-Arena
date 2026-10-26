// Detecção de toque (§4.2): uma função só, combinando sinais. "UA móvel ou tela pequena" exclui
// laptops com touchscreen. Nada depende de navigator.platform nem de window.orientation.

import { ehAppNativo, vibrarNativo } from './nativo';

export interface SinaisDispositivo {
  temToque: boolean;
  ponteiroGrosso: boolean;
  semHover: boolean;
  uaMobile: boolean;
  telaPequena: boolean;
  /** Marco 26 (D-107): há mouse (algum ponteiro fino com hover), mesmo que a tela também seja de toque. */
  temMouse: boolean;
}

export function detectarToque(s: SinaisDispositivo): boolean {
  return s.temToque && (s.uaMobile || s.ponteiroGrosso || s.semHover || s.telaPequena);
}

/**
 * Marco 26 (25/10/2026, D-107): o joystick ou o D-pad na tela. No computador (com mouse), mesmo de tela de toque ou
 * janela pequena, não: lá se anda pelo teclado e pelo clique. Os botões de ação da faixa continuam.
 */
export function mostrarDirecional(s: SinaisDispositivo): boolean {
  return detectarToque(s) && !s.temMouse;
}

export function sinaisDoNavegador(): SinaisDispositivo {
  return {
    temToque: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    ponteiroGrosso: matchMedia('(pointer: coarse)').matches,
    semHover: matchMedia('(hover: none)').matches,
    uaMobile: /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent),
    telaPequena: innerWidth <= 900,
    temMouse: matchMedia('(any-hover: hover) and (any-pointer: fine)').matches,
  };
}

/** Vibração com falha silenciosa (§4.8). Marco 20: no app Android, pelo motor do aparelho. */
export function vibrar(padrao: number | number[]): void {
  if (ehAppNativo()) {
    vibrarNativo(padrao);
    return;
  }
  try {
    navigator.vibrate(padrao);
  } catch {
    // Sem suporte (iOS, desktop): ignorar.
  }
}
