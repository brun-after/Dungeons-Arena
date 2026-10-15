// Paredes em bloco no isométrico (§2.16). Marco 13 (14/10/2026), D-058.
// Cada parede que encosta num lugar de andar vira um prisma de 0,6 célula: as faces da frente no tom do topo da
// fase (com o matiz), a de cima escura, para não se confundir com o piso. A massa de rocha longe do piso fica
// plana e escura, como na visão de cima. Desenhadas por diagonal (um Graphics por x + y), na mesma camada das
// entidades e com o `zIndex` da diagonal: quem passa atrás de uma parede fica atrás dela. Uma fase 60×40 dá
// ~100 objetos, não um por célula. De cima, as paredes continuam no terreno, como antes.

import { Graphics, type Container } from 'pixi.js';
import { tipoEm, type Fase } from '../world/fase';
import { CELULA_PX } from './camera-calculo';
import { escurecer } from './modelos/svg';
import { profundidade, type Projecao } from './projecao';
import { paletaDe } from './terreno';

export const ALTURA_PAREDE_PX = CELULA_PX * 0.6;

const ehParede = (fase: Fase, x: number, y: number) => tipoEm(fase, x, y) === 'parede';
const deAndar = (fase: Fase, x: number, y: number) => {
  const tipo = tipoEm(fase, x, y);
  return tipo === 'piso' || tipo === 'saida';
};

/** Parede que encosta (inclusive na diagonal) num piso ou numa saída: a borda visível da sala. */
export function paredeDeBorda(fase: Fase, x: number, y: number): boolean {
  if (!ehParede(fase, x, y)) return false;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) if ((dx !== 0 || dy !== 0) && deAndar(fase, x + dx, y + dy)) return true;
  }
  return false;
}

export interface ParedesIso {
  destruir: () => void;
}

export function criarParedesIso(camada: Container, fase: Fase, p: Projecao): ParedesIso {
  const paleta = paletaDe(fase.matizGraus);
  const topo = escurecer(paleta.paredeTopo, 0.45);
  const esquerda = paleta.paredeTopo;
  const direita = escurecer(paleta.paredeTopo, 0.25);
  const contorno = { width: 1, color: escurecer(paleta.paredeTopo, 0.7), alpha: 0.8 };
  const h = ALTURA_PAREDE_PX;
  const canto = (x: number, y: number) => p.projetar(x * CELULA_PX, y * CELULA_PX);
  const graficos: Graphics[] = [];
  for (let d = 0; d <= fase.largura + fase.altura - 2; d++) {
    let g: Graphics | null = null;
    for (let x = Math.max(0, d - fase.altura + 1); x <= Math.min(d, fase.largura - 1); x++) {
      const y = d - x;
      if (!paredeDeBorda(fase, x, y)) continue;
      g ??= new Graphics();
      const n = canto(x, y);
      const l = canto(x + 1, y);
      const s = canto(x + 1, y + 1);
      const o = canto(x, y + 1);
      // Faces da frente só onde não há outro prisma encostado (a de trás nunca aparece).
      if (!paredeDeBorda(fase, x, y + 1)) g.poly([o.x, o.y, s.x, s.y, s.x, s.y - h, o.x, o.y - h]).fill(esquerda).stroke(contorno);
      if (!paredeDeBorda(fase, x + 1, y)) g.poly([s.x, s.y, l.x, l.y, l.x, l.y - h, s.x, s.y - h]).fill(direita).stroke(contorno);
      g.poly([n.x, n.y - h, l.x, l.y - h, s.x, s.y - h, o.x, o.y - h]).fill(topo).stroke(contorno);
    }
    if (!g) continue;
    // Um pouco antes da diagonal: quem está na mesma diagonal é desenhado por cima.
    g.zIndex = profundidade(p, d, 0) - 0.01;
    g.label = `paredes-${d}`;
    camada.addChild(g);
    graficos.push(g);
  }
  return {
    destruir: () => {
      for (const g of graficos) g.destroy();
      graficos.length = 0;
    },
  };
}
