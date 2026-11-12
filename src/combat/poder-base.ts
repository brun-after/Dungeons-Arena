// Poder base (marco 39, 12/11/2026, D-148). No modelo novo, o dano do personagem não vem mais dos atributos: vem do
// nível (esta curva), da arma (o dado e a cadência do básico de cada arma), dos itens (o % de dano pelo nível e pela
// raridade) e do domínio (o atributo de classe nas skills de classe). Os atributos enchem o pentagrama de estilos, e
// os estilos multiplicam (dano, área, cadência, invocações, vida, recuperação, reforço aos aliados).
// Os inimigos, as invocações e os mortos continuam na fórmula de atributos de antes (o equilíbrio deles está medido).
// Puro.

import type { Balance, ContextoSimulacao } from '../core/contexto';
import type { Entidade } from '../entities/entidade';
import { efeitosDeEstiloDe, type EfeitosDeEstilo } from '../progression/estilos';
import type { Habilidade } from './habilidades';

export interface RegrasPoderBase {
  /**
   * O bônus fixo do golpe pelo nível: pontos `[nível, bônus]`, ligados em linha reta (cresce rápido no começo, como a
   * build focada de antes, e devagar depois do 30, onde entram os itens e o domínio).
   */
  curvaBonus: readonly (readonly [number, number])[];
  /** O multiplicador da rolagem cresce tanto % por nível útil acima do 1. */
  rolagemPorNivelPct: number;
  /** A potência dos efeitos (duração e valor de estados, escudos, curas periódicas) por nível útil, com teto. */
  potenciaPorNivelPct: number;
  potenciaMax: number;
  /** Até `nivelPleno` cada nível vale inteiro; acima, `acimaPct`% (a curva longa até o 100). */
  nivelPleno: number;
  acimaPct: number;
  /** Quanto do reforço aos aliados (suporte) vira potência dos efeitos de quem o tem. */
  suporteNaPotenciaPct: number;
}

/** O nível que conta para o poder: inteiro até `nivelPleno`, com rendimento menor acima. */
export function nivelUtil(nivel: number, r: RegrasPoderBase): number {
  return nivel <= r.nivelPleno ? nivel : r.nivelPleno + ((nivel - r.nivelPleno) * r.acimaPct) / 100;
}

export interface PoderDoGolpe {
  bonus: number;
  multRolagem: number;
  potencia: number;
}

/** A curva em linha reta entre os pontos (antes do primeiro e depois do último, o valor da ponta). */
export function naCurva(curva: readonly (readonly [number, number])[], x: number): number {
  const primeiro = curva[0];
  if (!primeiro) return 0;
  if (x <= primeiro[0]) return primeiro[1];
  for (let i = 1; i < curva.length; i++) {
    const a = curva[i - 1];
    const b = curva[i];
    if (a && b && x <= b[0]) return a[1] + ((b[1] - a[1]) * (x - a[0])) / Math.max(1e-9, b[0] - a[0]);
  }
  return curva[curva.length - 1]?.[1] ?? 0;
}

/** O poder base de quem tem ficha, pelo nível (e o `poderPct` da classe no bônus fixo). */
export function poderBase(nivel: number, b: Balance, poderPct = 100): PoderDoGolpe {
  const r = b.poderBase;
  const n = Math.max(0, nivelUtil(nivel, r) - 1);
  return {
    bonus: Math.floor((naCurva(r.curvaBonus, nivel) * poderPct) / 100),
    multRolagem: 1 + (r.rolagemPorNivelPct * n) / 100,
    potencia: Math.min(r.potenciaMax, 1 + (r.potenciaPorNivelPct * n) / 100),
  };
}

/** A habilidade conta como de área para o estilo (dano em área)? */
export function ehDeArea(hab: Pick<Habilidade, 'politicaImpacto' | 'raioArea'>): boolean {
  return hab.politicaImpacto === 'area' || hab.raioArea > 0;
}

/** O multiplicador de dano que os estilos dão a este golpe (dano sempre; área, se a habilidade é de área). */
export function multiplicadorDosEstilos(efeitos: EfeitosDeEstilo, hab: Pick<Habilidade, 'politicaImpacto' | 'raioArea'>): number {
  return (1 + efeitos.dano) * (ehDeArea(hab) ? 1 + efeitos.area : 1);
}

/** O que os estilos dão à fonte de quem tem ficha (sem ficha: neutro). */
export function estilosNaFonte(ctx: Pick<ContextoSimulacao, 'conteudo' | 'balance'>, e: Entidade, hab: Pick<Habilidade, 'politicaImpacto' | 'raioArea'>): { multDano: number; multCura: number; potencia: number } {
  if (!e.bolsa) {
    const inv = e.invocacao?.estiloPct ?? 0;
    return { multDano: 1 + inv / 100, multCura: 1, potencia: 1 };
  }
  const t = efeitosDeEstiloDe(ctx, e);
  return {
    multDano: multiplicadorDosEstilos(t, hab),
    multCura: 1 + t.suporte,
    potencia: 1 + (t.suporte * ctx.balance.poderBase.suporteNaPotenciaPct) / 100,
  };
}
