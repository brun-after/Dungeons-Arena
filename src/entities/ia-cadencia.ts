// Cadência da IA dos inimigos (08/11/2026, D-139). O inimigo de nível alto ataca mais vezes e troca mais básicos por
// skills: o intervalo do preset encurta com o nível e a fração dos ataques que vira skill sobe com ele. As regras ficam
// em `balance.ia.cadencia`; os chefes recebem só `chefeMult` dos dois bônus. Funções puras, sem estado novo: a vez da
// skill sai da contagem de ataques já feitos (`ataquesFeitos`), então o save e o patch não mudam.

import type { RegrasIa } from '../core/contexto';
import type { Entidade } from './entidade';

type Cadencia = RegrasIa['cadencia'];

function multChefe(e: Entidade, c: Cadencia): number {
  return e.arquetipo === 'boss' ? c.chefeMult : 1;
}

/** Quanto mais rápido (em %) o inimigo ataca pelo nível: `porNivelPct` por nível acima do 1, até `maxPct`. */
export function bonusCadenciaPct(e: Entidade, c: Cadencia): number {
  return Math.min(c.maxPct, Math.max(0, e.nivel - 1) * c.porNivelPct) * multChefe(e, c);
}

/** O intervalo entre ataques: o do preset dividido pelo bônus do nível, sem descer de `intervaloMinMs`. */
export function intervaloDeAtaqueMs(e: Entidade, intervaloPresetMs: number, c: Cadencia): number {
  const piso = Math.min(c.intervaloMinMs, intervaloPresetMs);
  return Math.max(piso, (intervaloPresetMs * 100) / (100 + bonusCadenciaPct(e, c)));
}

/** A fração (em %) dos ataques que tentam uma skill: `habilidadeBasePct` mais `habilidadePorNivelPct` por nível. */
export function fracaoHabilidadePct(e: Entidade, c: Cadencia): number {
  const extra = Math.max(0, e.nivel - 1) * c.habilidadePorNivelPct * multChefe(e, c);
  return Math.min(c.habilidadeMaxPct, c.habilidadeBasePct + extra);
}

/**
 * Se o ataque de número `n` (0, 1, 2…) é a vez de uma skill e qual delas no rodízio. Distribui a fração por igual:
 * com 50%, os ímpares (o revezamento antigo do marco 8A-2); com 75%, três em cada quatro.
 */
export function vezDaHabilidade(n: number, pct: number): { habilidade: boolean; indice: number } {
  const antes = Math.floor((n * pct) / 100);
  const depois = Math.floor(((n + 1) * pct) / 100);
  return { habilidade: depois > antes, indice: antes };
}
