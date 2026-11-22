// As skins com modelo em tempo real (06/11/2026; 22/11/2026: saíram de palco-vivo.ts, que chegou às 800 linhas). O
// catálogo e o código de cada uma ficam em entities/skins.ts. Cada skin vira uma "classe" do palco com a chave
// `skin:<id>`: o rig da classe dela, a veste fixa e a arma própria, sem o equipamento.

import type * as THREE from 'three';
import type { PecaSombria } from './armaduras-sombrias';
import { vesteDoCeifador } from './skin-ceifador';
import { ALTURA_DO_CEIFADOR } from './skin-ceifador-medidas';
import { vesteDaSombraRubra } from './skin-mago';
import { vesteDoMagico } from './skin-magico';
import { vesteDaMuseElf } from './skin-muse-elf';

export interface SkinViva {
  /** A classe dona (o rig e os clipes dela). */
  classe: string;
  /** A altura (células) e a largura (fator nos lados). */
  altura: number;
  largura?: number;
  /** O corpo acima do chão (anda no ar) e o ciclo do andar mais longo (cada passo cobre `passada` vezes o chão). */
  elevacao?: number;
  passada?: number;
  /**
   * 22/11/2026: voa em vez de andar. No andar e na corrida as pernas ficam na pose parada (sem passo), e o corpo se
   * inclina para a frente conforme ganha velocidade (palco-vivo.ts).
   */
  voo?: boolean;
  veste: (ossos: { get(nome: string): THREE.Bone | undefined }) => PecaSombria;
  arma: { modelo: string; grau: number } | null;
}

export const SKINS_VIVAS: Readonly<Record<string, SkinViva>> = {
  'necromante-ceifador': { classe: 'necromante', altura: ALTURA_DO_CEIFADOR, largura: 0.9, veste: vesteDoCeifador, arma: { modelo: 'gadanha_ceifador', grau: 4 } }, // alto e esguio (06/11/2026)
  // o mago adolescente: 20% mais baixo e 15% mais magro, flutuando com a cabeça na altura de antes; o passo divino cobre 3x o chão
  'mago-sombra-rubra': { classe: 'mago', altura: 1.12 * 0.8, largura: 0.85, elevacao: 1.12 * 0.2, passada: 3, veste: vesteDaSombraRubra, arma: { modelo: 'cajado_retorcido', grau: 4 } },
  'aventureiro-magico': { classe: 'aventureiro', altura: 1.12, veste: vesteDoMagico, arma: null }, // de mãos livres: a magia é a cartola
  // 22/11/2026: a elfa miúda (15% mais baixa que o arqueiro e mais estreita) que voa nas asas de gelo
  'arqueiro-muse-elf': { classe: 'arqueiro', altura: 1.08 * 0.85, largura: 0.86, elevacao: 0.2, voo: true, veste: vesteDaMuseElf, arma: { modelo: 'arco_glacial', grau: 4 } },
};
