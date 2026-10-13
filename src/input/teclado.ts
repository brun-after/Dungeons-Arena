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
  isometrico: () => boolean;
}

/** Liga o teclado. Retorna a função que desliga. */
export function ligarTeclado(opcoes: OpcoesTeclado): () => void {
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
    if (ev.code in EIXOS) {
      ev.preventDefault();
      if (!ev.repeat) {
        pressionadas.add(ev.code);
        recalcular();
      }
    } else if (ev.code === 'Space' && !ev.repeat) {
      ev.preventDefault();
      opcoes.aoAtacar();
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
  return () => {
    window.removeEventListener('keydown', aoBaixar);
    window.removeEventListener('keyup', aoSoltar);
    window.removeEventListener('blur', soltarTudo);
    document.removeEventListener('visibilitychange', soltarTudo);
  };
}
