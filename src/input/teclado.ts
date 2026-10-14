// Teclado (§2.3): teclas mantidas viram estado direcional. Emite só início, mudança e parada;
// a repetição automática do sistema operacional não gera comandos.

import type { Dir8 } from '../core/comandos';
import { dirDeVetor, remapearParaGrade } from './direcao';

const EIXOS: Readonly<Record<string, readonly [number, number]>> = {
  KeyW: [0, -1],
  ArrowUp: [0, -1],
  KeyS: [0, 1],
  ArrowDown: [0, 1],
  KeyA: [-1, 0],
  ArrowLeft: [-1, 0],
  KeyD: [1, 0],
  ArrowRight: [1, 0],
};

export interface OpcoesTeclado {
  aoMudarDirecao: (dir: Dir8 | 'parado') => void;
  aoAtacar: () => void;
  /** Teclas 1–9 e 0 (§2.10): índice 0 a 9. */
  aoAtalho: (indice: number) => void;
  /** `Esc` é contextual (§2.15): cancela a mira antes de pausar. */
  aoCancelar: () => void;
  isometrico: () => boolean;
  /** Tecla `I`: abre a mochila (marco 6). */
  aoMochila?: () => void;
  /** Tecla `E`: interage com baú ou loja (marco 9A). */
  aoInteragir?: () => void;
  /** Com um modal aberto, as teclas não chegam ao jogo (marco 6). */
  bloqueado?: () => boolean;
}

export interface Teclado {
  desligar: () => void;
  /** Solta as teclas mantidas (ao abrir um modal, por exemplo). */
  soltarTudo: () => void;
}

const ATALHOS = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0'];

/** Liga o teclado. */
export function ligarTeclado(opcoes: OpcoesTeclado): Teclado {
  const pressionadas = new Set<string>();
  let atual: Dir8 | 'parado' = 'parado';

  const recalcular = () => {
    let dx = 0;
    let dy = 0;
    for (const codigo of pressionadas) {
      const eixo = EIXOS[codigo];
      if (eixo) {
        dx += eixo[0];
        dy += eixo[1];
      }
    }
    const dir = remapearParaGrade(dirDeVetor(dx, dy), opcoes.isometrico());
    if (dir !== atual) {
      atual = dir;
      opcoes.aoMudarDirecao(dir);
    }
  };

  const aoBaixar = (ev: KeyboardEvent) => {
    if (ev.target instanceof HTMLInputElement || ev.target instanceof HTMLTextAreaElement) return;
    if (opcoes.bloqueado?.()) return;
    if (ev.code === 'KeyI' && !ev.repeat && opcoes.aoMochila) {
      opcoes.aoMochila();
    } else if (ev.code === 'KeyE' && !ev.repeat && opcoes.aoInteragir) {
      opcoes.aoInteragir();
    } else if (ev.code in EIXOS) {
      ev.preventDefault();
      if (!ev.repeat) {
        pressionadas.add(ev.code);
        recalcular();
      }
    } else if (ev.code === 'Space' && !ev.repeat) {
      ev.preventDefault();
      opcoes.aoAtacar();
    } else if (ATALHOS.includes(ev.code) && !ev.repeat) {
      opcoes.aoAtalho(ATALHOS.indexOf(ev.code));
    } else if (ev.code === 'Escape') {
      opcoes.aoCancelar();
    }
  };
  const aoSoltar = (ev: KeyboardEvent) => {
    if (pressionadas.delete(ev.code)) recalcular();
  };
  // Perder o foco solta tudo (§3.6: parar em perda de foco e suspensão).
  const soltarTudo = () => {
    pressionadas.clear();
    recalcular();
  };

  window.addEventListener('keydown', aoBaixar);
  window.addEventListener('keyup', aoSoltar);
  window.addEventListener('blur', soltarTudo);
  document.addEventListener('visibilitychange', soltarTudo);
  return {
    desligar: () => {
      window.removeEventListener('keydown', aoBaixar);
      window.removeEventListener('keyup', aoSoltar);
      window.removeEventListener('blur', soltarTudo);
      document.removeEventListener('visibilitychange', soltarTudo);
    },
    soltarTudo,
  };
}
