// O chão assado sobre o relevo (marco 43, 15/11/2026, D-177). O canvas do bloco continua o mesmo (pintado de cima,
// sem altura); em vez do sprite plano, vira uma malha de um quadrado por célula, com os quatro cantos erguidos pela
// altura de render/relevo-tela.ts. A camada do chão tem a matriz do isométrico, então erguer um ponto na tela é
// deslocá-lo no plano por (−d, −d), com d = altura / k (k = 1/√2): só o y da tela muda.
// Os quadrados não dividem os cantos: entre duas células de alturas diferentes além da encosta fica o vão, que a face
// do penhasco cobre (render/relevo-iso.ts).

import { MeshSimple, type Texture } from 'pixi.js';
import { CELULA_PX } from '../camera-calculo';
import type { RelevoDaTela } from '../relevo-tela';

const K = Math.SQRT1_2;

/** Quanto deslocar no plano (x e y) para subir `px` na tela. */
export function deslocamentoNoPlano(px: number): number {
  return px / K;
}

export interface RecorteDoBloco {
  bx: number;
  by: number;
  fimX: number;
  fimY: number;
}

export function malhaDoBloco(textura: Texture, relevo: RelevoDaTela, r: RecorteDoBloco): MeshSimple {
  const colunas = r.fimX - r.bx;
  const linhas = r.fimY - r.by;
  const total = colunas * linhas;
  const vertices = new Float32Array(total * 8);
  const uvs = new Float32Array(total * 8);
  const indices = new Uint32Array(total * 6);
  const x0 = r.bx * CELULA_PX;
  const y0 = r.by * CELULA_PX;
  const lx = colunas * CELULA_PX;
  const ly = linhas * CELULA_PX;
  let i = 0;
  for (let y = r.by; y < r.fimY; y++) {
    for (let x = r.bx; x < r.fimX; x++) {
      const k = (y * relevo.largura + x) * 4;
      // Noroeste, nordeste, sudeste, sudoeste.
      const cantos: readonly (readonly [number, number])[] = [[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]];
      for (let c = 0; c < 4; c++) {
        const [cx, cy] = cantos[c] as readonly [number, number];
        const d = deslocamentoNoPlano((relevo.cantos[k + c] ?? 0) * relevo.pxPorNivel);
        const px = cx * CELULA_PX;
        const py = cy * CELULA_PX;
        vertices[i * 8 + c * 2] = px - d;
        vertices[i * 8 + c * 2 + 1] = py - d;
        uvs[i * 8 + c * 2] = (px - x0) / lx;
        uvs[i * 8 + c * 2 + 1] = (py - y0) / ly;
      }
      const v = i * 4;
      indices.set([v, v + 1, v + 2, v, v + 2, v + 3], i * 6);
      i++;
    }
  }
  return new MeshSimple({ texture: textura, vertices, uvs, indices });
}

/** O deslocamento no plano do centro da célula (para o que se desenha por célula no chão: água, enfeites). */
export function deslocamentoDaCelula(relevo: RelevoDaTela | null, x: number, y: number): number {
  if (!relevo) return 0;
  return deslocamentoNoPlano(relevo.alturaPx((x + 0.5) * CELULA_PX, (y + 0.5) * CELULA_PX));
}
