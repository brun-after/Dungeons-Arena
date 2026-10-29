// O contrato das assinaturas visuais (marco 26, 29/10/2026, D-124). Cada skill tem uma assinatura: o desenho próprio
// que a identifica sem texto (a corrente que estica e recolhe, a bola de fogo, o relâmpago ramificado). A assinatura
// junta partículas (conjuração, rastro, impacto) e uma silhueta (as animações do pincel e as marcas no chão), em fases:
// conjurar, viajar, acertar e a área. Só desenho: nada aqui muda a simulação.

import type { PontoVisual } from '../../entities/entidade';
import type { Emissao } from '../presets-particula';
import type { SistemaParticulas } from '../particulas';
import type { Animacao } from './pincel';
import type { TexturaRica } from './texturas';

export type P = { x: number; y: number };

export const FAMILIAS_VFX = ['fogo', 'corrente', 'raio', 'gelo', 'terra', 'trevas', 'arcano', 'luz', 'fisico', 'arqueiro', 'veneno', 'falcao', 'vento'] as const;
export type FamiliaVfx = (typeof FAMILIAS_VFX)[number];

/** O que as silhuetas podem usar. Posições em células (como a simulação); `tela` e `chao` projetam. */
export interface CenaVfx {
  particulas: SistemaParticulas;
  agora: number;
  reduzido: boolean;
  iso: boolean;
  tocar: (a: Animacao) => void;
  marca: (nome: TexturaRica, x: number, y: number, cor: number, escala: number, ms: number, aditivo?: boolean) => void;
  /** A posição viva de uma entidade (em células, com o deslize), para quem segue o corpo. */
  ondeEsta: (id: string) => PontoVisual | null;
  tela: (p: P) => P;
  chao: (p: P) => P;
  tremor: (forca: 'leve' | 'forte') => void;
}

/** O acerto num alvo: de quem (fonte) para quem (alvo). */
export interface Acerto {
  chave: string;
  fonteId: string;
  alvoId: string;
  de: P | null;
  ate: P;
  cor: number;
  /** 1 no normal; o rank alto e as ultimates crescem. */
  escala: number;
  critico: boolean;
  /** O índice do alvo na área (0 = o primeiro). */
  indice: number;
  /** Etapa da ultimate de vários elementos: a cor do elemento desta etapa (D-124). */
  corEtapa?: number;
}

/** A área no lançamento (antes de saber quem foi atingido). */
export interface AreaVfx {
  chave: string;
  atorId: string;
  origem: P;
  mira: P;
  centro: P;
  celulas: readonly P[];
  cor: number;
  escala: number;
  tipoArea: string;
  raio: number;
}

/** A skill em si mesmo (buff, postura, invocação), no lançamento. */
export interface EmSi {
  chave: string;
  id: string;
  pos: P;
  cor: number;
  escala: number;
}

export interface DefAssinatura {
  familia: FamiliaVfx;
  /** Na mão de quem conjura, a cada 120 ms. */
  conjuracao?: readonly Emissao[];
  /** O corpo do projétil em voo (a cada quadro) e o rastro (a cada 30 ms). */
  corpo?: readonly Emissao[];
  rastro?: readonly Emissao[];
  /** No alvo atingido. */
  impacto?: readonly Emissao[];
  /** A silhueta do acerto (fonte › alvo). */
  aoAcertar?: (c: CenaVfx, a: Acerto) => void;
  /** A silhueta pela área, no lançamento. */
  naArea?: (c: CenaVfx, a: AreaVfx) => void;
  /** Em si mesmo, no lançamento. */
  emSi?: (c: CenaVfx, a: EmSi) => void;
  /** A marca no chão do acerto. */
  marca?: TexturaRica;
  camera?: 'leve' | 'forte';
  /** O puxão espera a silhueta chegar ao alvo (a corrente voa antes de recolher). */
  atrasoDeslize?: number;
}
