// O chão texturizado de uma fase (marco 31, D-130), montado do tema. Marco 41 (14/11/2026, D-169): saiu da cena para
// servir também ao pedaço da região vizinha visto além da borda (render/vizinha.ts), com o mesmo chão de lá.

import { hashTexto } from '../../core/rng';
import type { Balance } from '../../core/contexto';
import type { Fase } from '../../world/fase';
import { soloSemTema } from '../../world/solo';
import type { Tema } from '../../world/temas';
import type { PintorDeDesenhos } from '../pintura';
import type { SoloDoTerreno } from '../terreno';
import { texturasDosAmbientes } from './ambientes-solo';
import { carregarTexturasDoSolo } from './texturas';

export function soloDaFase(fase: Fase, tema: Tema | null, visual: Balance['visual'], escala: number, pintor: PintorDeDesenhos | null): SoloDoTerreno {
  // Marco 42 (15/11/2026, D-176): sem tema, a tinta do bioma da região.
  const solo = tema?.solo ?? soloSemTema(fase.bioma, visual.gradacao);
  return {
    tema: solo,
    cfg: visual.solo,
    escala,
    semente: hashTexto(fase.id),
    texturas: carregarTexturasDoSolo([solo.base, solo.variacao, solo.parede, solo.mato, 'estrada', ...(fase.obstaculos ? ['rocha' as const] : []), ...texturasDosAmbientes(fase.ambientes ?? [])]),
    pintor,
  };
}
