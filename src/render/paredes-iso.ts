// Paredes em bloco no isométrico (§2.16). Marco 13 (14/10/2026), D-058.
// Marco 26 (25/10/2026, D-106): placas finas e baixas em vez do prisma da célula inteira — 0,2 célula de espessura
// (80% mais fina) e 0,18 de altura (70% mais baixa que 0,6), ao longo de cada aresta entre parede e chão, dentro da
// célula de parede: a face fica na aresta, onde o corpo do personagem encosta. Nas quinas, um bloquinho 0,2 × 0,2
// fecha a placa. As faces da frente no tom do topo da fase (com o matiz), a de cima escura. O resto da célula de
// parede é a rocha plana e escura do terreno, como na visão de cima. Desenhadas por diagonal (um Graphics por x + y),
// na mesma camada das entidades e com o `zIndex` da diagonal: quem passa atrás de uma parede fica atrás dela.
// De cima, as paredes continuam no terreno, como antes.

import { Graphics, type Container } from 'pixi.js';
import { ehPilar } from '../world/decoracao';
import { chaoAberto, tipoEm, type Fase } from '../world/fase';
import { CELULA_PX } from './camera-calculo';
import { escurecer } from './modelos/svg';
import { profundidade, type Projecao } from './projecao';
import { paletaDe } from './terreno';

export const ALTURA_PAREDE_PX = CELULA_PX * 0.18;
/** Espessura da placa, em células. */
export const ESPESSURA_PAREDE = 0.2;

const ehParede = (fase: Fase, x: number, y: number) => tipoEm(fase, x, y) === 'parede';
const deAndar = (fase: Fase, x: number, y: number) => {
  const tipo = tipoEm(fase, x, y);
  // Marco 29 (D-128): o chão do exterior (mato e estrada) também levanta a borda das rochas e dos muros.
  return tipo === 'saida' || chaoAberto(tipo);
};

/** Parede que encosta (inclusive na diagonal) num piso ou numa saída: a borda visível da sala. */
export function paredeDeBorda(fase: Fase, x: number, y: number): boolean {
  if (!ehParede(fase, x, y)) return false;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) if ((dx !== 0 || dy !== 0) && deAndar(fase, x + dx, y + dy)) return true;
  }
  return false;
}

/** Uma placa dentro da célula de parede, em frações da célula, e quais faces da frente aparecem. */
export interface Placa {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  frenteSul: boolean;
  frenteLeste: boolean;
}

/**
 * Marco 26 (D-106): as placas de uma célula de parede, de trás para a frente: uma por aresta que encosta em chão e um
 * bloquinho em cada quina que só toca chão na diagonal. Uma face da frente some quando a célula vizinha daquele lado
 * é parede: ali a placa continua (ou vira a quina) e a face ficaria escondida.
 */
export function placasDaParede(fase: Fase, x: number, y: number): Placa[] {
  // Marco 26 (D-109): o pilar não ganha placas; fica de pé como coluna alta (render/decoracao-iso.ts).
  if (!ehParede(fase, x, y) || ehPilar(fase, x, y)) return [];
  const t = ESPESSURA_PAREDE;
  const chao = (dx: number, dy: number) => deAndar(fase, x + dx, y + dy);
  const abertoSul = !ehParede(fase, x, y + 1);
  const abertoLeste = !ehParede(fase, x + 1, y);
  const norte = chao(0, -1);
  const oeste = chao(-1, 0);
  const leste = chao(1, 0);
  const sul = chao(0, 1);
  const placas: Placa[] = [];
  const placa = (x0: number, y0: number, x1: number, y1: number, frenteSul: boolean, frenteLeste: boolean) => {
    placas.push({ x0, y0, x1, y1, frenteSul, frenteLeste });
  };
  if (norte) placa(0, 0, 1, t, true, abertoLeste);
  if (oeste) placa(0, 0, t, 1, abertoSul, true);
  if (!norte && !oeste && chao(-1, -1)) placa(0, 0, t, t, true, true);
  if (!norte && !leste && chao(1, -1)) placa(1 - t, 0, 1, t, true, abertoLeste);
  if (!sul && !oeste && chao(-1, 1)) placa(0, 1 - t, t, 1, abertoSul, true);
  if (leste) placa(1 - t, 0, 1, 1, abertoSul, true);
  if (sul) placa(0, 1 - t, 1, 1, true, abertoLeste);
  if (!sul && !leste && chao(1, 1)) placa(1 - t, 1 - t, 1, 1, true, true);
  return placas;
}

export interface ParedesIso {
  destruir: () => void;
}

/** Marco 11A: `corParede` (a cor média da parede do tileset do jogador) substitui a paleta da fase. */
export function criarParedesIso(camada: Container, fase: Fase, p: Projecao, corParede: number | null = null): ParedesIso {
  const base = corParede ?? paletaDe(fase.matizGraus).paredeTopo;
  const topo = escurecer(base, 0.45);
  const esquerda = base;
  const direita = escurecer(base, 0.25);
  const contorno = { width: 1, color: escurecer(base, 0.7), alpha: 0.8 };
  const h = ALTURA_PAREDE_PX;
  const canto = (x: number, y: number) => p.projetar(x * CELULA_PX, y * CELULA_PX);
  /** Caixa [x0, x1] × [y0, y1] (em células) com altura `h`; as faces da frente só se não houver placa encostada. */
  const caixa = (g: Graphics, x0: number, y0: number, x1: number, y1: number, frenteSul: boolean, frenteLeste: boolean) => {
    const n = canto(x0, y0);
    const l = canto(x1, y0);
    const s = canto(x1, y1);
    const o = canto(x0, y1);
    if (frenteSul) g.poly([o.x, o.y, s.x, s.y, s.x, s.y - h, o.x, o.y - h]).fill(esquerda).stroke(contorno);
    if (frenteLeste) g.poly([s.x, s.y, l.x, l.y, l.x, l.y - h, s.x, s.y - h]).fill(direita).stroke(contorno);
    g.poly([n.x, n.y - h, l.x, l.y - h, s.x, s.y - h, o.x, o.y - h]).fill(topo).stroke(contorno);
  };
  const graficos: Graphics[] = [];
  for (let d = 0; d <= fase.largura + fase.altura - 2; d++) {
    let g: Graphics | null = null;
    for (let x = Math.max(0, d - fase.altura + 1); x <= Math.min(d, fase.largura - 1); x++) {
      const y = d - x;
      const placas = placasDaParede(fase, x, y);
      if (placas.length === 0) continue;
      g ??= new Graphics();
      for (const pl of placas) caixa(g, x + pl.x0, y + pl.y0, x + pl.x1, y + pl.y1, pl.frenteSul, pl.frenteLeste);
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
