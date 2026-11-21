// A escalada e o pulo curto (20/11/2026, D-191). Antes, o desnível além da encosta parava quem anda (o muro baixo e o
// alto só se passavam saltando ou voando), e o corpo travava de frente para o degrau. Agora:
// - subir: o que fica até `alturaCorpoNiveis × fatorAltura` níveis acima (a altura do personagem e mais metade dela)
//   se escala; o corpo para de andar e sobe devagar até a borda de cima, num tempo que a Vontade e a Destreza encurtam;
// - descer: o desnível além da encosta (até `quedaMaxNiveis`) vira um pulo curto, mais lento que o passo (10% a 20%
//   pela altura), e o impacto da queda segura o mesmo tanto por um instante depois do pouso;
// - acima disso (a montanha, o penhasco alto) segue barrando como antes.
// O relevo continua sendo obstáculo (quem foge sente o tempo perdido no muro), mas ninguém trava nele. Só o relevo
// entra: árvore, rocha, cerca e o resto do cenário seguem barrando pela célula. Puro, em ticks.

import type { Atributos } from '../entities/entidade';
import type { RegrasRelevo } from './relevo';

/** Os números da escalada (`balance.relevo.escalada`). */
export interface RegrasEscalada {
  /** A altura do corpo do personagem, em níveis de relevo. */
  alturaCorpoNiveis: number;
  /** Até quantas alturas do corpo se escala (1,5: o corpo e mais metade dele). */
  fatorAltura: number;
  subirMsBase: number;
  subirMsPorNivel: number;
  /** Quanto cada ponto de Vontade e de Destreza acima de 10 encurta a subida (%). */
  atributoPctPorPonto: number;
  /** Os limites do multiplicador do tempo de subida pelos atributos. */
  multMin: number;
  multMax: number;
  /** A maior queda que se desce a pé (pulo curto); acima, barra. */
  quedaMaxNiveis: number;
  quedaLentidaoMinPct: number;
  quedaLentidaoMaxPct: number;
  /** Quanto o impacto da queda segura depois do pouso. */
  impactoMs: number;
  /** Quanto o centro do corpo entra na célula de chegada (em células, a partir da borda). */
  entradaNaCelula: number;
}

/** A travessia em curso: de onde, para onde e entre quais ticks (o integrador interpola). */
export interface Escalada {
  tipo: 'subir' | 'descer';
  deX: number;
  deY: number;
  paraX: number;
  paraY: number;
  desdeTick: number;
  ateTick: number;
  /** Quantos níveis sobe ou desce. */
  niveis: number;
}

export type Travessia = 'andar' | 'subir' | 'descer';

/** Até quantos níveis acima se escala (a altura do corpo e mais metade dela). */
export function alturaEscalavel(r: RegrasRelevo): number {
  return Math.floor(r.escalada.alturaCorpoNiveis * r.escalada.fatorAltura);
}

/** Como se passa a pé de uma altura para outra (desnível positivo sobe); null: não se passa. */
export function travessiaAPe(r: RegrasRelevo, d: number): Travessia | null {
  if (Math.abs(d) <= r.encostaMax) return 'andar';
  if (d > 0) return d <= alturaEscalavel(r) ? 'subir' : null;
  return -d <= r.escalada.quedaMaxNiveis ? 'descer' : null;
}

/** O multiplicador do tempo de subida pela Vontade e pela Destreza (10 em cada: 1). */
export function multDaEscalada(r: RegrasEscalada, a: Pick<Atributos, 'vontade' | 'destreza'>): number {
  const pontos = a.vontade - 10 + (a.destreza - 10);
  return Math.min(r.multMax, Math.max(r.multMin, 1 - (pontos * r.atributoPctPorPonto) / 100));
}

/** Quanto dura a subida de `niveis` (ms). */
export function duracaoDaSubidaMs(r: RegrasEscalada, niveis: number, a: Pick<Atributos, 'vontade' | 'destreza'>): number {
  return (r.subirMsBase + r.subirMsPorNivel * niveis) * multDaEscalada(r, a);
}

/** A lentidão do pulo e do impacto pela altura da queda (%): da mínima, logo além da encosta, à máxima. */
export function lentidaoDaQuedaPct(r: RegrasRelevo, niveis: number): number {
  const e = r.escalada;
  const faixa = Math.max(1, e.quedaMaxNiveis - r.encostaMax - 1);
  const t = Math.min(1, Math.max(0, (niveis - r.encostaMax - 1) / faixa));
  return e.quedaLentidaoMinPct + (e.quedaLentidaoMaxPct - e.quedaLentidaoMinPct) * t;
}

/** O progresso da travessia no tick (0 a 1). */
export function progressoDaEscalada(s: Escalada, tick: number): number {
  const total = s.ateTick - s.desdeTick;
  return total <= 0 ? 1 : Math.min(1, Math.max(0, (tick - s.desdeTick) / total));
}
