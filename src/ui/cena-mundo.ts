// O que a cena oferece ao Mundo na troca de sala (marco 41, 14/11/2026, D-169): onde o jogador está na vista e as
// teclas mantidas (a cena nova começa igual) e se o chão à vista já foi assado (só então ela aparece).
// Marco 55 (26/11/2026, D-208): no Mundo contínuo, as regiões desenhadas no lugar delas do atlas (ui/atlas-na-cena.ts);
// a vizinha além da borda (render/vizinha.ts) saiu com as trocas de região.

import type { Balance } from '../core/contexto';
import type { Camera } from '../render/camera';
import type { ObjetosPreRenderizados } from '../render/objetos-3d';
import type { PintorDeDesenhos } from '../render/pintura';
import type { Palco } from '../render/stage';
import type { Terreno } from '../render/terreno';
import type { RegrasDaCamuflagem } from '../world/camuflagem';
import type { AtlasNaCena, DesenhoDoAtlas } from './atlas-na-cena';

export type { DesenhoDoAtlas };

type Ponto = { x: number; y: number };

export interface CenaDoMundo {
  desvio: () => Ponto | null;
  teclas: () => string[];
  /** O chão à vista já está assado (a cena nova só aparece depois). */
  chaoPronto: () => boolean;
  /** Põe o jogador no ponto `d` da vista (onde estava na cena de antes, na hora em que esta aparece). */
  recentrar: (d: Ponto) => void;
  desenhar: AtlasNaCena['desenhar'];
  /** Marco 55 (D-208): quem está em (x, y) fica escondido sob o telhado fechado de uma região do atlas. */
  oculto: (x: number, y: number) => boolean;
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
  /** Marco 55 (D-208): o Mundo contínuo (as regiões desenhadas no lugar delas do atlas), ou null. */
  atlas: DesenhoDoAtlas | null;
  quebraveis: ReadonlySet<string>;
  camuflagem?: RegrasDaCamuflagem;
}

export function criarCenaDoMundo(m: MeiosDaCenaDoMundo): CenaDoMundo {
  const noAtlas = m.atlas?.montar({ palco: m.palco, projecao: () => m.camera.projecaoAtual, balance: m.balance, escalaSolo: m.escalaSolo, pintor: m.pintor, modelos3d: m.modelos3d, quebraveis: m.quebraveis, ...(m.camuflagem && { camuflagem: m.camuflagem }) }) ?? null;
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
    chaoPronto: () => (noAtlas ? noAtlas.pronto(pos()) : m.terreno.pronto()),
    recentrar: (d) => {
      const j = pos();
      if (j) m.camera.centralizarComDesvio(j, d);
    },
    desenhar: (...args) => {
      noAtlas?.desenhar(...args);
    },
    oculto: (x, y) => noAtlas?.oculto(x, y) ?? false,
    destruir: () => {
      noAtlas?.destruir();
    },
  };
}
