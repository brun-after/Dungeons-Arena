// O relevo na tela (marco 43, 15/11/2026, D-177). A altura de cada célula (`Fase.alturas`) vira geometria: o chão sobe
// em px, e quem está nele sobe junto (a projeção soma a altura; render/projecao.ts). Aqui sai o campo contínuo:
// - a altura de desenho da célula: a do chão onde se anda e a da água; a rocha e as paredes ficam na altura do chão em
//   volta (o rochedo nasce do chão, não flutua);
// - os quatro cantos de cada célula: a média das células em volta que estão na mesma encosta (até `encostaMax` de
//   desnível); entre os dois lados de um muro não há média, e o vão vira a face do penhasco (render/relevo-iso.ts);
// - um alisamento leve antes dos cantos, para a encosta descer em curva e não em degraus.
// Puro (sem Pixi): o cliente e os testes usam igual.

import { CELULA_PX } from './camera-calculo';
import { tipoEm, type Fase } from '../world/fase';
import { BALANCE_PADRAO } from '../core/contexto';

export interface RelevoDaTela {
  largura: number;
  altura: number;
  /** Px de tela por nível de altura. */
  pxPorNivel: number;
  /** A altura de desenho de cada célula, em níveis. */
  celulas: Float32Array;
  /** Os cantos de cada célula em níveis, 4 por célula: noroeste, nordeste, sudeste, sudoeste. */
  cantos: Float32Array;
  /** A altura do chão em px de tela num ponto em px de plano (interpolada nos cantos da célula). */
  alturaPx: (xPlano: number, yPlano: number) => number;
}

const SOLIDO = new Set(['parede', 'vazio', 'fachada']);

export function criarRelevoDaTela(fase: Fase, encostaMax: number, pxPorNivel: number): RelevoDaTela | null {
  const alturas = fase.alturas;
  if (!alturas) return null;
  const w = fase.largura;
  const h = fase.altura;
  const solido = new Uint8Array(w * h);
  // O obstáculo natural (a montanha, o rochedo, a árvore) fica na altura dele; a parede construída, na do chão.
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) solido[y * w + x] = SOLIDO.has(tipoEm(fase, x, y)) && !(fase.obstaculos?.[y * w + x] ?? 0) ? 1 : 0;
  // A altura de desenho: o sólido toma a menor altura do chão em volta (até 2 células); sem chão perto, a dele.
  const base = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const k = y * w + x;
      if (!solido[k]) {
        base[k] = alturas[k] ?? 0;
        continue;
      }
      let m = Infinity;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h || solido[ny * w + nx]) continue;
          m = Math.min(m, alturas[ny * w + nx] ?? 0);
        }
      }
      base[k] = Number.isFinite(m) ? m : (alturas[k] ?? 0);
    }
  }
  // O alisamento: a média 3×3 só entre vizinhas da mesma encosta (o muro fica nítido).
  const celulas = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const hc = base[y * w + x] ?? 0;
      let soma = 0;
      let peso = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const hv = base[ny * w + nx] ?? 0;
          if (Math.abs(hv - hc) > encostaMax) continue;
          const p = dx === 0 && dy === 0 ? 4 : dx === 0 || dy === 0 ? 2 : 1;
          soma += hv * p;
          peso += p;
        }
      }
      celulas[y * w + x] = peso > 0 ? soma / peso : hc;
    }
  }
  // Os cantos: a média das (até) quatro células do canto que estão na mesma encosta da célula.
  const cantos = new Float32Array(w * h * 4);
  const OFFS = [[-1, -1, 0, 0], [0, -1, 1, 0], [0, 0, 1, 1], [-1, 0, 0, 1]] as const;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const k = y * w + x;
      const hb = base[k] ?? 0;
      for (let c = 0; c < 4; c++) {
        const [ox0, oy0, ox1, oy1] = OFFS[c] as readonly [number, number, number, number];
        let soma = 0;
        let n = 0;
        for (let yy = y + oy0; yy <= y + oy1; yy++) {
          for (let xx = x + ox0; xx <= x + ox1; xx++) {
            if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
            const j = yy * w + xx;
            if (Math.abs((base[j] ?? 0) - hb) > encostaMax) continue;
            soma += celulas[j] ?? 0;
            n++;
          }
        }
        cantos[k * 4 + c] = n > 0 ? soma / n : (celulas[k] ?? 0);
      }
    }
  }
  const alturaPx = (xPlano: number, yPlano: number): number => {
    const fx = xPlano / CELULA_PX;
    const fy = yPlano / CELULA_PX;
    const cx = Math.floor(fx);
    const cy = Math.floor(fy);
    if (cx < 0 || cy < 0 || cx >= w || cy >= h) return 0;
    const u = fx - cx;
    const v = fy - cy;
    const i = (cy * w + cx) * 4;
    const no = cantos[i] ?? 0;
    const ne = cantos[i + 1] ?? 0;
    const se = cantos[i + 2] ?? 0;
    const so = cantos[i + 3] ?? 0;
    return ((no * (1 - u) + ne * u) * (1 - v) + (so * (1 - u) + se * u) * v) * pxPorNivel;
  };
  return { largura: w, altura: h, pxPorNivel, celulas, cantos, alturaPx };
}

const GUARDADOS = new WeakMap<Fase, RelevoDaTela | null>();

/** O relevo de desenho da fase (calculado uma vez por fase; null sem `alturas`). */
export function relevoDaFase(fase: Fase): RelevoDaTela | null {
  if (GUARDADOS.has(fase)) return GUARDADOS.get(fase) ?? null;
  const r = criarRelevoDaTela(fase, BALANCE_PADRAO.relevo.encostaMax, BALANCE_PADRAO.relevo.pxPorNivel);
  GUARDADOS.set(fase, r);
  return r;
}
