// O que a cena oferece ao Mundo na troca de região (marco 41, 14/11/2026, D-169): onde o jogador está na vista e as
// teclas mantidas (a cena nova começa igual), se o chão à vista já foi assado (só então ela aparece) e o pedaço da
// região vizinha além da borda (render/vizinha.ts).

import type { Balance } from '../core/contexto';
import type { Camera } from '../render/camera';
import type { ObjetosPreRenderizados } from '../render/objetos-3d';
import type { PintorDeDesenhos } from '../render/pintura';
import type { Palco } from '../render/stage';
import type { Terreno } from '../render/terreno';
import { criarVizinha, type CamadaVizinha } from '../render/vizinha';
import type { RecorteVizinho } from '../world/recorte-vizinha';
import type { Tema } from '../world/temas';

type Ponto = { x: number; y: number };

export interface CenaDoMundo {
  desvio: () => Ponto | null;
  teclas: () => string[];
  /** O chão à vista já está assado (a cena nova só aparece depois). */
  chaoPronto: () => boolean;
  /** Põe o jogador no ponto `d` da vista (onde estava na cena de antes, na hora em que esta aparece). */
  recentrar: (d: Ponto) => void;
  /** Desenha (ou tira, com null) a região vizinha além da borda. */
  vizinha: (r: RecorteVizinho | null, tema: Tema | null) => void;
  desenhar: CamadaVizinha['desenhar'];
  destruir: () => void;
}

export interface MeiosDaCenaDoMundo {
  palco: Palco;
  camera: Camera;
  terreno: Terreno;
  balance: Balance;
  escalaSolo: () => number;
  pintor: PintorDeDesenhos | null;
  modelos3d: ObjetosPreRenderizados | null;
  jogador: () => Ponto | undefined;
  teclas: () => string[];
}

export function criarCenaDoMundo(m: MeiosDaCenaDoMundo): CenaDoMundo {
  let vizinha: CamadaVizinha | null = null;
  const pos = () => {
    const j = m.jogador();
    return j ? { x: j.x, y: j.y } : null;
  };
  return {
    desvio: () => {
      const j = pos();
      return j ? m.camera.desvio(j) : null;
    },
    teclas: m.teclas,
    chaoPronto: () => m.terreno.pronto(),
    recentrar: (d) => {
      const j = pos();
      if (j) m.camera.centralizarComDesvio(j, d);
    },
    vizinha: (r, tema) => {
      vizinha?.destruir();
      vizinha = r && criarVizinha({ palco: m.palco, projecao: m.camera.projecaoAtual, balance: m.balance, escalaSolo: m.escalaSolo(), pintor: m.pintor, modelos3d: m.modelos3d }, r, tema);
    },
    desenhar: (...args) => {
      vizinha?.desenhar(...args);
    },
    destruir: () => {
      vizinha?.destruir();
      vizinha = null;
    },
  };
}
