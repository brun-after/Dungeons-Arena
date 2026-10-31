// Os quadros dos personagens pré-renderizados (marco 32, 31/10/2026, D-131): a direção pelo rumo e o quadro de cada
// estado pelo tempo. À parte de personagens-3d.ts (que carrega os atlas pelo Vite), para quem só desenha.

export type EstadoPersonagem = 'parado' | 'andar' | 'golpe' | 'conjurar' | 'morte';

const DIRECOES = 8;
/** Quanto dura cada quadro dos ciclos (ms). */
const MS_QUADRO: Readonly<Record<EstadoPersonagem, number>> = { parado: 220, andar: 95, golpe: 0, conjurar: 110, morte: 110 };

/** A direção do atlas para o rumo na grade (rad, de +x para +y). */
export function direcaoDoAngulo(angulo: number): number {
  const d = Math.round(angulo / (Math.PI / 4));
  return ((d % DIRECOES) + DIRECOES) % DIRECOES;
}

/**
 * O quadro do estado: os ciclos (parado, andar, conjurar) pelo relógio; o golpe pela fração (0 a 1) dele; a morte
 * pelo tempo desde a queda, parando no último.
 */
export function quadroDoEstado(estado: EstadoPersonagem, n: number, tMs: number, fracao: number | null): number {
  if (estado === 'golpe') return Math.min(n - 1, Math.max(0, Math.floor((fracao ?? 0) * n)));
  if (estado === 'morte') return Math.min(n - 1, Math.floor(tMs / MS_QUADRO.morte));
  return Math.floor(tMs / MS_QUADRO[estado]) % n;
}
