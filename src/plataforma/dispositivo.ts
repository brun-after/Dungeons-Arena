// Detecção de toque (§4.2): uma função só, combinando sinais. "UA móvel ou tela pequena" exclui
// laptops com touchscreen. Nada depende de navigator.platform nem de window.orientation.

export interface SinaisDispositivo {
  temToque: boolean;
  ponteiroGrosso: boolean;
  semHover: boolean;
  uaMobile: boolean;
  telaPequena: boolean;
}

export function detectarToque(s: SinaisDispositivo): boolean {
  return s.temToque && (s.uaMobile || s.ponteiroGrosso || s.semHover || s.telaPequena);
}

export function sinaisDoNavegador(): SinaisDispositivo {
  return {
    temToque: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    ponteiroGrosso: matchMedia('(pointer: coarse)').matches,
    semHover: matchMedia('(hover: none)').matches,
    uaMobile: /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent),
    telaPequena: innerWidth <= 900,
  };
}

/** Vibração com falha silenciosa (§4.8). */
export function vibrar(padrao: number | number[]): void {
  try {
    navigator.vibrate(padrao);
  } catch {
    // Sem suporte (iOS, desktop): ignorar.
  }
}
