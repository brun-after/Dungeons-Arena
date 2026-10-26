// Enfeites altos e pilares em pé no isométrico (marco 26, 25/10/2026, D-109). No chão do terreno eles achatavam com a
// matriz do piso e pareciam pintados; aqui ficam de pé, na camada das entidades, com a profundidade da diagonal
// (um Graphics por x + y, como as paredes de paredes-iso.ts): quem passa atrás de uma árvore fica atrás dela.
// - enfeite em pé: o mesmo desenho de render/decoracao.ts, sem a matriz, com a base no centro da célula;
// - enfeite de parede (tocha, estandarte, estante…): a base na aresta norte, encostado na parede de cima;
// - pilar: a coluna do tema esticada até cerca de 1 célula de altura, sobre uma sombra no losango da célula.
// Os enfeites de chão (pedras, tapete, poça…) seguem no terreno; de cima, nada muda.

import { Graphics, type Container } from 'pixi.js';
import { decoracoesDaFase, ehDecoracaoDeParede, ehDecoracaoEmPe, ehPilar, hashCelula, type Decoracao, type TipoPilar } from '../world/decoracao';
import type { Fase } from '../world/fase';
import type { PaletaTema, Tema } from '../world/temas';
import { CELULA_PX } from './camera-calculo';
import { desenharDecoracao, desenharPilar } from './decoracao';
import { profundidade, type Projecao } from './projecao';
import { paletaDe } from './terreno';

const P = CELULA_PX;
/** O pilar fica 1,5 vez mais alto que o desenho de cima (a base em 0,85 da célula: cerca de 1 célula de altura). */
export const ESTICA_PILAR = 1.5;
/** Onde o desenho do enfeite toca o chão, em px da célula (de cima para baixo). */
const BASE_ENFEITE = P * 0.75;
/** O enfeite de parede: a altura do desenho que fica acima da aresta. */
const BASE_DE_PAREDE = 30;

export interface DecoracaoIso {
  destruir: () => void;
}

type Item = { tipo: 'enfeite'; d: Decoracao } | { tipo: 'pilar'; x: number; y: number };

/** O que fica em pé na fase, agrupado pela diagonal x + y (pura). */
export function itensEmPe(fase: Fase, tema: Tema | null, pular: ReadonlySet<string> = new Set()): Map<number, Item[]> {
  const porDiagonal = new Map<number, Item[]>();
  const por = (d: number, item: Item) => {
    const lista = porDiagonal.get(d) ?? [];
    lista.push(item);
    porDiagonal.set(d, lista);
  };
  for (let y = 0; y < fase.altura; y++) for (let x = 0; x < fase.largura; x++) if (ehPilar(fase, x, y)) por(x + y, { tipo: 'pilar', x, y });
  // Marco 26 (D-113): os quebráveis ficam em pé pelo estado (render/objetos.ts).
  for (const d of decoracoesDaFase(fase, tema)) if (ehDecoracaoEmPe(d.tipo) && !pular.has(d.tipo)) por(d.x + d.y, { tipo: 'enfeite', d });
  return porDiagonal;
}

function desenharItem(g: Graphics, item: Item, p: Projecao, paleta: PaletaTema, pilar: TipoPilar): void {
  if (item.tipo === 'pilar') {
    const { x, y } = item;
    const c = p.projetar((x + 0.5) * P, (y + 0.5) * P);
    // A sombra no losango da célula.
    const canto = (cx: number, cy: number) => p.projetar(cx * P, cy * P);
    const n = canto(x + 0.15, y + 0.15);
    const l = canto(x + 0.85, y + 0.15);
    const s = canto(x + 0.85, y + 0.85);
    const o = canto(x + 0.15, y + 0.85);
    g.poly([n.x, n.y, l.x, l.y, s.x, s.y, o.x, o.y]).fill({ color: 0x000000, alpha: 0.3 });
    // A base do desenho (y + P − 6) cai no centro da célula; esticado para cima.
    g.save().translateTransform(c.x, c.y).scaleTransform(1, ESTICA_PILAR).translateTransform(-(x + 0.5) * P, -((y + 1) * P - 6));
    desenharPilar(g, pilar, x, y, paleta, hashCelula(x, y, 4), false);
    g.restore();
    return;
  }
  const d = item.d;
  const deParede = ehDecoracaoDeParede(d.tipo);
  // Enfeite de parede: na aresta norte (encostado na placa); os outros, no centro da célula.
  const chao = p.projetar((d.x + 0.5) * P, (d.y + (deParede ? 0.08 : 0.5)) * P);
  const base = d.y * P + (deParede ? BASE_DE_PAREDE : BASE_ENFEITE);
  if (!deParede) g.ellipse(chao.x, chao.y, P * 0.3, P * 0.12).fill({ color: 0x000000, alpha: 0.22 });
  g.save().translateTransform(chao.x - (d.x + 0.5) * P, chao.y - base);
  desenharDecoracao(g, d, paleta);
  g.restore();
}

export function criarDecoracaoIso(camada: Container, fase: Fase, tema: Tema | null, p: Projecao, pular: ReadonlySet<string> = new Set()): DecoracaoIso {
  const paleta = tema?.paleta ?? paletaDe(fase.matizGraus);
  const pilar: TipoPilar = tema?.pilar ?? 'coluna';
  const graficos: Graphics[] = [];
  for (const [d, itens] of itensEmPe(fase, tema, pular)) {
    const g = new Graphics();
    // Os enfeites de trás da diagonal primeiro (o x maior fica mais à direita, na mesma altura).
    for (const item of itens) desenharItem(g, item, p, paleta, pilar);
    g.zIndex = profundidade(p, d, 0) - 0.005;
    g.label = `enfeites-${d}`;
    g.cullable = true;
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
