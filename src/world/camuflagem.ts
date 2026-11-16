// A zona de fácil camuflagem (marco 44, 15/11/2026, D-178). A mata fechada não é mais "sempre noite": cada árvore faz
// uma sombra no chão, e quem está nela (o monstro ou o jogador) é visto só de perto, como no escuro. Onde as árvores
// se juntam (a mata fechada), a sombra de cada uma tem `areaNaMata` vezes a área, e as sombras se emendam: é ali que os
// monstros se escondem. A estrada e a clareira, longe das árvores, ficam ao sol. Mapas calculados uma vez por fase. Puro.

import { OBSTACULO } from './geografia';

export interface RegrasDaCamuflagem {
  /** O raio (células) da sombra de uma árvore solta. */
  raioSombra: number;
  /** Na mata fechada, a área da sombra cresce esta vez (o raio, pela raiz). */
  areaNaMata: number;
  /** A partir desta copa (0 a 1, `copaEm`) o lugar é mata fechada. */
  desdeCopa: number;
}

interface FaseComArvores {
  readonly largura: number;
  readonly altura: number;
  readonly obstaculos?: Uint8Array;
}

/** O raio (células) em que se contam as árvores em volta, e quantas fecham a copa (de `COPA_ABRE` a `COPA_FECHA`). */
const RAIO_COPA = 2;
const COPA_ABRE = 3;
const COPA_FECHA = 6;
const COPAS = new WeakMap<Uint8Array, Uint8Array>();

function mapaDeCopas(o: Uint8Array, largura: number, altura: number): Uint8Array {
  const pronto = COPAS.get(o);
  if (pronto) return pronto;
  const m = new Uint8Array(largura * altura);
  for (let y = 0; y < altura; y++) {
    for (let x = 0; x < largura; x++) {
      let n = 0;
      for (let j = Math.max(0, y - RAIO_COPA); j <= Math.min(altura - 1, y + RAIO_COPA); j++) {
        for (let i = Math.max(0, x - RAIO_COPA); i <= Math.min(largura - 1, x + RAIO_COPA); i++) if (o[j * largura + i] === OBSTACULO.arvore) n++;
      }
      m[y * largura + x] = Math.round(255 * Math.max(0, Math.min(1, (n - COPA_ABRE) / (COPA_FECHA - COPA_ABRE))));
    }
  }
  COPAS.set(o, m);
  return m;
}

/** O quanto a copa fecha no ponto (0 a 1), pelas árvores em volta: 0 na estrada e na clareira. */
export function copaEm(fase: FaseComArvores, x: number, y: number): number {
  const o = fase.obstaculos;
  if (!o) return 0;
  const cx = Math.round(x);
  const cy = Math.round(y);
  if (cx < 0 || cy < 0 || cx >= fase.largura || cy >= fase.altura) return 0;
  return (mapaDeCopas(o, fase.largura, fase.altura)[cy * fase.largura + cx] ?? 0) / 255;
}

/** O ponto é de mata fechada (a zona de fácil camuflagem)? */
export function naMataFechada(fase: FaseComArvores, x: number, y: number, r: RegrasDaCamuflagem): boolean {
  return copaEm(fase, x, y) >= r.desdeCopa;
}

/** O raio da sombra da árvore da célula (tx, ty): maior na mata fechada. */
export function raioDaSombra(fase: FaseComArvores, tx: number, ty: number, r: RegrasDaCamuflagem): number {
  return naMataFechada(fase, tx, ty, r) ? r.raioSombra * Math.sqrt(Math.max(1, r.areaNaMata)) : r.raioSombra;
}

/** O ponto (contínuo, em células) está na sombra de alguma árvore? */
export function naSombra(fase: FaseComArvores, x: number, y: number, r: RegrasDaCamuflagem): boolean {
  const o = fase.obstaculos;
  if (!o) return false;
  const alcance = Math.ceil(r.raioSombra * Math.sqrt(Math.max(1, r.areaNaMata)));
  const cx = Math.round(x);
  const cy = Math.round(y);
  for (let j = Math.max(0, cy - alcance); j <= Math.min(fase.altura - 1, cy + alcance); j++) {
    for (let i = Math.max(0, cx - alcance); i <= Math.min(fase.largura - 1, cx + alcance); i++) {
      if (o[j * fase.largura + i] !== OBSTACULO.arvore) continue;
      const raio = raioDaSombra(fase, i, j, r);
      if ((x - i) * (x - i) + (y - j) * (y - j) <= raio * raio) return true;
    }
  }
  return false;
}
