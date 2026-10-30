// O chão do exterior do Mundo (marco 29, 30/10/2026, D-128): o mato do campo, a estrada de terra, a água e a base
// das fachadas. Cores lisas com marcas esparsas por posição, como o piso das fases (variação sem padrão diagonal);
// as estruturas altas saem em render/estruturas-iso.ts, por cima da base escura.

import type { Graphics } from 'pixi.js';
import { tipoEm, type Fase, type TipoCelula } from '../world/fase';
import { CELULA_PX } from './camera-calculo';

const MATO = [0x3d5a2e, 0x42632f, 0x385329] as const;
const MATO_FOLHA = 0x5d8a3c;
const ESTRADA = 0x7a6448;
const ESTRADA_PEDRA = 0x8f7a5c;
const AGUA = 0x2b5f86;
const AGUA_FUNDA = 0x1f4a6b;
const AGUA_BRILHO = 0x9fd3f2;
const BASE_FACHADA = 0x2a2420;

/** Variação estável por célula (o mesmo valor em toda montagem). */
function ruido(x: number, y: number): number {
  let h = Math.imul(x, 0x45d9f3b) ^ Math.imul(y, 0x27d4eb2d);
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

export function ehCelulaExterior(tipo: TipoCelula): boolean {
  return tipo === 'mato' || tipo === 'estrada' || tipo === 'agua' || tipo === 'fachada';
}

export function desenharCelulaExterior(g: Graphics, fase: Fase, x: number, y: number, tipo: TipoCelula): void {
  const p = CELULA_PX;
  const px = x * p;
  const py = y * p;
  const v = ruido(x, y);
  switch (tipo) {
    case 'mato': {
      g.rect(px, py, p, p).fill(MATO[Math.floor(v * MATO.length)] ?? MATO[0]);
      // Tufos esparsos: três folhinhas em leque.
      if (v < 0.3) {
        const cx = px + p * (0.2 + ruido(x + 3, y) * 0.6);
        const cy = py + p * (0.3 + ruido(x, y + 5) * 0.5);
        for (const dx of [-4, 0, 4]) g.moveTo(cx, cy).lineTo(cx + dx, cy - 7);
        g.stroke({ width: 1.4, color: MATO_FOLHA, alpha: 0.8 });
      }
      break;
    }
    case 'estrada': {
      g.rect(px, py, p, p).fill(ESTRADA);
      if (v < 0.4) g.ellipse(px + p * ruido(x + 7, y), py + p * ruido(x, y + 9), 3, 2).fill({ color: ESTRADA_PEDRA, alpha: 0.7 });
      // A borda com o mato fica macia (a estrada não é um quadrado).
      if (tipoEm(fase, x, y - 1) === 'mato') g.rect(px, py, p, 4).fill({ color: MATO[0], alpha: 0.5 });
      if (tipoEm(fase, x - 1, y) === 'mato') g.rect(px, py, 4, p).fill({ color: MATO[0], alpha: 0.5 });
      break;
    }
    case 'agua': {
      const funda = tipoEm(fase, x, y - 1) === 'agua' && tipoEm(fase, x, y + 1) === 'agua' && tipoEm(fase, x - 1, y) === 'agua' && tipoEm(fase, x + 1, y) === 'agua';
      g.rect(px, py, p, p).fill(funda ? AGUA_FUNDA : AGUA);
      if (v < 0.35) {
        const cx = px + p * (0.2 + ruido(x + 11, y) * 0.6);
        const cy = py + p * (0.3 + ruido(x, y + 13) * 0.4);
        g.moveTo(cx - 6, cy).quadraticCurveTo(cx, cy - 3, cx + 6, cy);
        g.stroke({ width: 1.2, color: AGUA_BRILHO, alpha: 0.45 });
      }
      break;
    }
    case 'fachada':
      g.rect(px, py, p, p).fill(BASE_FACHADA);
      break;
    default:
      break;
  }
}
