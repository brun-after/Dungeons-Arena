// O relevo no isométrico (marco 42, 15/11/2026, D-176). O chão continua num plano só (a projeção, o clique e a ordem
// de profundidade não mudam); o relevo aparece de dois jeitos: o sombreado das encostas assado no chão
// (render/solo/mascaras.ts) e, aqui, a face de penhasco onde o terreno cai mais que a encosta (os muros e a montanha).
// A face fica na aresta entre a célula alta e a baixa, de frente para quem olha (sul e leste), com a altura pelo
// desnível; as de costas viram só um friso escuro no chão. Desenhadas por diagonal, na camada das entidades, como as
// paredes (quem passa atrás do penhasco fica atrás dele).

import { Graphics, type Container } from 'pixi.js';
import { tipoEm, type Fase } from '../world/fase';
import { alturaEm } from '../world/relevo';
import { CELULA_PX } from './camera-calculo';
import { clarear, escurecer } from './modelos/svg';
import { profundidade, type Projecao } from './projecao';

/** Quanto a face sobe por nível de desnível (em células) e o teto dela. */
const ALTURA_POR_NIVEL = 0.2;
const ALTURA_MAX = 1.4;

export interface PenhascosIso {
  destruir: () => void;
}

export function criarPenhascosIso(camada: Container, fase: Fase, p: Projecao, encostaMax: number, cor = 0x6e604c): PenhascosIso | null {
  if (!fase.alturas) return null;
  const sul = escurecer(cor, 0.05);
  const leste = escurecer(cor, 0.35);
  const borda = clarear(cor, 0.25);
  const canto = (x: number, y: number) => p.projetar(x * CELULA_PX, y * CELULA_PX);
  const graficos: Graphics[] = [];
  // Só onde se anda ou nada dos dois lados (o rochedo já é parede).
  const chao = (x: number, y: number) => tipoEm(fase, x, y) !== 'parede' && tipoEm(fase, x, y) !== 'vazio';
  for (let d = 0; d <= fase.largura + fase.altura - 2; d++) {
    let g: Graphics | null = null;
    for (let x = Math.max(0, d - fase.altura + 1); x <= Math.min(d, fase.largura - 1); x++) {
      const y = d - x;
      if (!chao(x, y)) continue;
      const h = alturaEm(fase, x, y);
      // A face sul: a célula de baixo (y + 1) é mais baixa que a encosta deixa.
      const ds = h - alturaEm(fase, x, y + 1);
      const dl = h - alturaEm(fase, x + 1, y);
      if ((ds <= encostaMax || !chao(x, y + 1)) && (dl <= encostaMax || !chao(x + 1, y))) continue;
      g ??= new Graphics();
      // A aresta da célula: de (x − 0,5, y + 0,5) a (x + 0,5, y + 0,5) no sul; de (x + 0,5, y − 0,5) a (x + 0,5, y + 0,5) no leste.
      if (ds > encostaMax && chao(x, y + 1)) {
        const alt = Math.min(ALTURA_MAX, ds * ALTURA_POR_NIVEL) * CELULA_PX;
        const a = canto(x - 0.5 + 0.5, y + 0.5 + 0.5);
        const b = canto(x + 0.5 + 0.5, y + 0.5 + 0.5);
        g.poly([a.x, a.y, b.x, b.y, b.x, b.y - alt, a.x, a.y - alt]).fill(sul);
        g.moveTo(a.x, a.y - alt).lineTo(b.x, b.y - alt).stroke({ width: 1.2, color: borda, alpha: 0.5 });
      }
      if (dl > encostaMax && chao(x + 1, y)) {
        const alt = Math.min(ALTURA_MAX, dl * ALTURA_POR_NIVEL) * CELULA_PX;
        const a = canto(x + 0.5 + 0.5, y - 0.5 + 0.5);
        const b = canto(x + 0.5 + 0.5, y + 0.5 + 0.5);
        g.poly([a.x, a.y, b.x, b.y, b.x, b.y - alt, a.x, a.y - alt]).fill(leste);
        g.moveTo(a.x, a.y - alt).lineTo(b.x, b.y - alt).stroke({ width: 1.2, color: borda, alpha: 0.5 });
      }
    }
    if (!g) continue;
    g.zIndex = profundidade(p, d, 0) - 0.02;
    g.label = `penhascos-${d}`;
    camada.addChild(g);
    graficos.push(g);
  }
  return { destruir: () => { for (const g of graficos) g.destroy(); } };
}
