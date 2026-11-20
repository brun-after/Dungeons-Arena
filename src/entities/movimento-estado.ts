// Marco 40 (D-164): o estado do movimento da classe na entidade (o modo em curso, as cargas, os círculos) e, D-188
// (19/11/2026), o fôlego das feras do Aventureiro. Separado de entidade.ts (o limite de linhas por arquivo).

import type { PontaElemental } from '../progression/vinculo';

/** Marco 40 (D-164): o modo de movimento em curso (voo, montaria, névoa, marcha, tirolesa, camuflagem ou o preparo). */
export interface ModoDeMovimento {
  tipo: 'preparo' | 'voo' | 'montado' | 'nevoa' | 'marcha' | 'tirolesa' | 'camuflado' | 'salto';
  id: string;
  desdeTick: number;
  ateTick?: number;
  x?: number;
  y?: number;
  rumoX?: number;
  rumoY?: number;
  /** A tirolesa: as células que ainda faltam e a velocidade (células por segundo). */
  restante?: number;
  velocidade?: number;
  lentidaoPct?: number;
  pesada?: boolean;
  /** Atacou ou foi atingido: o bônus de viagem acabou (o modo segue até o fim). */
  semBuff?: boolean;
  /** Marco 40 (14/11/2026, D-168): a ponta do eneágono que o modo leva, a partir do marco elemental da mecânica. */
  ponta?: PontaElemental;
  /** D-188 (19/11/2026): a montaria do Aventureiro: o bônus de velocidade dela, a energia que gasta por tick e a Disparada do lobo. */
  viagemPct?: number;
  dreno?: number;
  disparada?: boolean;
  /** D-188: o salto do Arremesso do falcão (não atordoa, salvo no Implacável). */
  arremesso?: boolean;
}

/** D-188 (19/11/2026): o fôlego de uma fera do Aventureiro (0 a 100) e o descanso dela, quando cansou. */
export interface EstadoFera {
  energia: number;
  cansado: boolean;
  descansoAteTick: number;
}

export interface EstadoMovimento {
  ativo: string;
  /** Por mecânica, os ticks em que cada carga gasta volta. */
  cargas: Record<string, number[]>;
  modo?: ModoDeMovimento;
  /** A Âncora Rúnica do Mago: o totem no ponto de volta, até `ateTick`; `raio` é o alcance para voltar (D-168). */
  ancora?: { x: number; y: number; ateTick: number; raio: number };
  /** Marco 40 (14/11/2026, D-168): o círculo do Acelerar (o Mago), com a ponta quando é elemental. */
  circulo?: { x: number; y: number; raio: number; pct: number; desdeTick: number; ateTick: number; ponta?: PontaElemental };
  /** D-170: o tick do último Salto para Trás (a armadilha sob o Arqueiro não dispara se ele saltou a tempo). */
  recuoTick?: number;
  /** 15/11/2026: o tick em que a Arremetida (o dash) acaba; saltar logo depois dá o alcance máximo do salto. */
  avancoAteTick?: number;
  /** D-168: os tiros do Arqueiro levam a ponta até o tick (depois de sair da camuflagem). */
  tiroElemental?: { ponta: PontaElemental; ateTick: number };
  /** D-188: o Círculo de Contenção do urso (barra as magias de fora); `bloqueado`, a vida (em % do dono) que ele segurou. */
  contencao?: { x: number; y: number; raio: number; desdeTick: number; ateTick: number; bloqueado: number };
  /** D-188: o marco do Revezamento: a fera que chega monta sozinha (até o tick). */
  revezarAteTick?: number;
}
