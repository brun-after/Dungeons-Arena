// Marco 54 (26/11/2026, D-207): as zonas do Mundo contínuo. As regiões viram zonas de um mapa só: o perigo, o PvP, os
// eventos, o chat da região e as missões leem a zona pela posição, não a sala. O limite entre duas zonas vizinhas
// segue a costura, mas ondula (world/costura.ts, `desvioDaZona`), para não parecer uma linha reta. Puro.

import { desvioDaZona } from '../world/costura';
import type { Atlas } from './atlas';
import type { Reino } from './reino';

export interface MapaDeZonas {
  largura: number;
  altura: number;
  /** As ids das regiões; a célula guarda o índice + 1 (0 = fora de toda zona). */
  ids: readonly string[];
  celulas: Uint8Array;
}

export function mapaDeZonas(reino: Reino, atlas: Atlas): MapaDeZonas {
  const ids = reino.regioes.map((r) => r.id);
  const celulas = new Uint8Array(atlas.largura * atlas.altura);
  ids.forEach((id, i) => {
    const a = atlas.areas.get(id);
    if (!a) return;
    for (let y = a.y; y < a.y + a.altura; y++) celulas.fill(i + 1, y * atlas.largura + a.x, y * atlas.largura + a.x + a.largura);
  });
  for (const c of atlas.costuras) {
    const ia = ids.indexOf(c.a) + 1;
    const ib = ids.indexOf(c.b) + 1;
    for (let t = c.inicio; t < c.fim; t++) {
      const s = desvioDaZona(c.par, t);
      // A linha é a primeira célula de `b`; o desvio empurra o limite para dentro de um dos dois.
      for (let d = Math.min(0, s); d < Math.max(0, s); d++) {
        const p = c.linha + d;
        const k = c.vertical ? t * atlas.largura + p : p * atlas.largura + t;
        celulas[k] = s > 0 ? ia : ib;
      }
    }
  }
  return { largura: atlas.largura, altura: atlas.altura, ids, celulas };
}

/** A região da zona na célula (arredondada), ou null fora de toda zona. */
export function zonaEm(m: MapaDeZonas, x: number, y: number): string | null {
  const cx = Math.round(x);
  const cy = Math.round(y);
  if (cx < 0 || cy < 0 || cx >= m.largura || cy >= m.altura) return null;
  return m.ids[(m.celulas[cy * m.largura + cx] ?? 0) - 1] ?? null;
}
