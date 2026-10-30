// As fachadas das estruturas do Mundo no isométrico (marco 29, 30/10/2026, D-128). Por fora, a estrutura é um bloco
// alto que não deixa ver dentro: cada grupo de células `fachada` vira um prisma do tamanho do retângulo, com a face
// sul e a leste em pedra, o topo mais escuro com a borda de ameias e o arco escuro da porta na face sul (a célula de
// estrada dentro da fachada). A altura cresce com o tamanho (o castelo do dragão é mais alto que a toca dos goblins).
// O tom da pedra varia por posição. Desenhado na camada das entidades, com a profundidade do canto da frente: quem
// passa atrás some atrás da fachada. De cima, a base escura do terreno basta (render/terreno-exterior.ts).

import { Graphics, type Container } from 'pixi.js';
import { tipoEm, type Fase } from '../world/fase';
import { CELULA_PX } from './camera-calculo';
import { escurecer } from './modelos/svg';
import { profundidade, type Projecao } from './projecao';

const PEDRAS = [0x8a8178, 0x7d7468, 0x6f7480, 0x857766] as const;

export interface Retangulo {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  /** A célula da porta (a de estrada na última linha), se houver. */
  porta: { x: number; y: number } | null;
}

/** Os retângulos das fachadas: cada grupo ligado de células `fachada`, pela caixa que o contém. */
export function retangulosDeFachada(fase: Fase): Retangulo[] {
  const visto = new Uint8Array(fase.largura * fase.altura);
  const lista: Retangulo[] = [];
  for (let y = 0; y < fase.altura; y++) {
    for (let x = 0; x < fase.largura; x++) {
      if (visto[y * fase.largura + x] || tipoEm(fase, x, y) !== 'fachada') continue;
      const r = { x0: x, y0: y, x1: x, y1: y };
      const fila = [[x, y] as const];
      visto[y * fase.largura + x] = 1;
      for (let i = 0; i < fila.length; i++) {
        const [cx, cy] = fila[i] ?? [0, 0];
        r.x0 = Math.min(r.x0, cx);
        r.y0 = Math.min(r.y0, cy);
        r.x1 = Math.max(r.x1, cx);
        r.y1 = Math.max(r.y1, cy);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= fase.largura || ny >= fase.altura || visto[ny * fase.largura + nx] || tipoEm(fase, nx, ny) !== 'fachada') continue;
          visto[ny * fase.largura + nx] = 1;
          fila.push([nx, ny]);
        }
      }
      let porta: Retangulo['porta'] = null;
      for (let px = r.x0; px <= r.x1; px++) if (tipoEm(fase, px, r.y1) === 'estrada') porta = { x: px, y: r.y1 };
      lista.push({ ...r, porta });
    }
  }
  return lista;
}

export interface EstruturasIso {
  destruir: () => void;
}

export function criarEstruturasIso(camada: Container, fase: Fase, p: Projecao): EstruturasIso {
  const canto = (x: number, y: number) => p.projetar(x * CELULA_PX, y * CELULA_PX);
  const graficos: Graphics[] = [];
  for (const r of retangulosDeFachada(fase)) {
    const largura = r.x1 - r.x0 + 1;
    const fundo = r.y1 - r.y0 + 1;
    const h = CELULA_PX * Math.min(4.5, 1.2 + Math.min(largura, fundo) * 0.45);
    const pedra = PEDRAS[(r.x0 * 7 + r.y0 * 13) % PEDRAS.length] ?? PEDRAS[0];
    const sul = pedra;
    const leste = escurecer(pedra, 0.22);
    const topo = escurecer(pedra, 0.45);
    const contorno = { width: 1.2, color: escurecer(pedra, 0.7), alpha: 0.9 };
    const n = canto(r.x0, r.y0);
    const l = canto(r.x1 + 1, r.y0);
    const s = canto(r.x1 + 1, r.y1 + 1);
    const o = canto(r.x0, r.y1 + 1);
    const g = new Graphics();
    g.poly([o.x, o.y, s.x, s.y, s.x, s.y - h, o.x, o.y - h]).fill(sul).stroke(contorno);
    g.poly([s.x, s.y, l.x, l.y, l.x, l.y - h, s.x, s.y - h]).fill(leste).stroke(contorno);
    g.poly([n.x, n.y - h, l.x, l.y - h, s.x, s.y - h, o.x, o.y - h]).fill(topo).stroke(contorno);
    // Fiadas de pedra na face sul.
    for (let k = 1; k < 4; k++) {
      const f = (h * k) / 4;
      g.moveTo(o.x, o.y - f).lineTo(s.x, s.y - f);
    }
    g.stroke({ width: 1, color: escurecer(pedra, 0.35), alpha: 0.6 });
    // Ameias na borda da frente do topo.
    const ameias = Math.max(2, largura * 2);
    for (let k = 0; k < ameias; k += 2) {
      const a = { x: o.x + ((s.x - o.x) * k) / ameias, y: o.y + ((s.y - o.y) * k) / ameias - h };
      const b = { x: o.x + ((s.x - o.x) * (k + 1)) / ameias, y: o.y + ((s.y - o.y) * (k + 1)) / ameias - h };
      g.poly([a.x, a.y, b.x, b.y, b.x, b.y - 6, a.x, a.y - 6]).fill(sul).stroke(contorno);
    }
    if (r.porta) {
      const e = canto(r.porta.x, r.y1 + 1);
      const d = canto(r.porta.x + 1, r.y1 + 1);
      const alto = Math.min(h * 0.7, CELULA_PX * 1.1);
      g.poly([e.x + 3, e.y, d.x - 3, d.y, d.x - 3, d.y - alto, (e.x + d.x) / 2, (e.y + d.y) / 2 - alto - 8, e.x + 3, e.y - alto]).fill(0x140d08).stroke({ width: 2, color: 0x6d5a40 });
    }
    g.zIndex = profundidade(p, r.x1, r.y1) + 0.01;
    g.label = `estrutura-${String(r.x0)}-${String(r.y0)}`;
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
