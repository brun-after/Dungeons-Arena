// O chão texturizado de uma fase (marco 31, D-130), montado do tema. Marco 41 (14/11/2026, D-169): saiu da cena para
// servir também ao pedaço da região vizinha visto além da borda (render/vizinha.ts), com o mesmo chão de lá.

import { hashTexto } from '../../core/rng';
import type { Balance } from '../../core/contexto';
import type { Fase } from '../../world/fase';
import { SOLO_PADRAO } from '../../world/solo';
import type { Tema } from '../../world/temas';
import type { PintorDeDesenhos } from '../pintura';
import type { SoloDoTerreno } from '../terreno';
import { texturasDosAmbientes } from './ambientes-solo';
import { carregarTexturasDoSolo } from './texturas';

export function soloDaFase(fase: Fase, tema: Tema | null, cfg: Balance['visual']['solo'], escala: number, pintor: PintorDeDesenhos | null): SoloDoTerreno {
  const solo = tema?.solo ?? SOLO_PADRAO;
  return {
    tema: solo,
    cfg,
    escala,
    semente: hashTexto(fase.id),
    texturas: carregarTexturasDoSolo([solo.base, solo.variacao, solo.parede, solo.mato, 'estrada', ...texturasDosAmbientes(fase.ambientes ?? [])]),
    pintor,
  };
}
