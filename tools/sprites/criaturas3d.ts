// Criaturas sem modelo CC0 nos pacotes baixados (marco 32, 31/10/2026, D-131): montadas de geometria simples e
// animadas por deformação (sem esqueleto). `animar(estado, f)` põe a pose da fração `f` (0 a 1) do estado.

import { FERAS_VIVAS } from '../../src/render/vivos/feras-vivas';
import { CRIATURAS_FILO } from '../../src/render/vivos/filo';
import * as THREE from 'three';
import type { EstadoBase as Estado } from './receitas';
import { falcao, lobo } from './feras3d';
import { cartola, cartolaMagica, pombo } from './magico3d';

export interface Criatura {
  grupo: THREE.Group;
  animar(estado: Estado, f: number): void;
}

// Marco 40 (13/11/2026, D-165): o lobo e o urso do Aventureiro saem das mesmas peças do 3D em tempo real.
// Marco 45 (16/11/2026, D-182): as criaturas de Filo de geometria (src/render/vivos/filo); o slime e a aranha antigos saíram.
const CRIATURAS: Readonly<Record<string, () => Criatura>> = { lobo, falcao, cartola, cartola_magica: cartolaMagica, pombo, ...FERAS_VIVAS, ...CRIATURAS_FILO };

export function criatura(tipo: string): Criatura | null {
  return CRIATURAS[tipo]?.() ?? null;
}
