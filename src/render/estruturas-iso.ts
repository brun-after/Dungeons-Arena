// As fachadas das estruturas do Mundo no isométrico (marco 29, 30/10/2026, D-128). Por fora, a estrutura é um bloco
// alto que não deixa ver dentro: cada grupo de células `fachada` vira um prisma do tamanho do retângulo, com a face
// sul e a leste em pedra, o topo mais escuro com a borda de ameias e o arco escuro da porta na face sul (a célula de
// estrada dentro da fachada). A altura cresce com o tamanho (o castelo do dragão é mais alto que a toca dos goblins).
// O tom da pedra varia por posição. Desenhado na camada das entidades, com a profundidade do canto da frente: quem
// passa atrás some atrás da fachada. De cima, a base escura do terreno basta (render/terreno-exterior.ts).
// Marco 30 (30/10/2026, D-129): a fachada pelo tipo da estrutura (`fase.estruturas`): o castelo com ameias, a torre
// alta de telhado pontudo, a caverna e a mina como rochedo de topo irregular (a mina com a boca escorada em madeira)
// e a cripta em pedra fria com frontão.
// Marco 31 (31/10/2026, D-130): as faces na textura de pedra do tema (a mesma das paredes), com o contorno quase
// apagado (o traço escuro em volta dava o ar de desenho infantil).

import { Graphics, type Container, type FillPattern, type Texture } from 'pixi.js';
import { tipoEm, type Fase } from '../world/fase';
import { CELULA_PX } from './camera-calculo';
import { escurecer } from './modelos/svg';
import { pedraDaFace } from './paredes-iso';
import { profundidade, type Projecao } from './projecao';

const PEDRAS = [0x8a8178, 0x7d7468, 0x6f7480, 0x857766] as const;
/** O telhado de ardósia da torre. */
const TELHADO = 0x4a3f5c;

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

interface Pt {
  x: number;
  y: number;
}

/** O alto da fachada pelo estilo: as ameias, o telhado pontudo da torre, os picos do rochedo ou o frontão. */
function desenharTopo(g: Graphics, estilo: Estilo, c: { n: Pt; l: Pt; s: Pt; o: Pt }, h: number, largura: number, face: number, telhado: number, contorno: { width: number; color: number; alpha: number }): void {
  const { n, l, s, o } = c;
  const meio = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t - h });
  if (estilo.topo === 'ameias') {
    const ameias = Math.max(2, largura * 2);
    for (let k = 0; k < ameias; k += 2) {
      const a = meio(o, s, k / ameias);
      const b = meio(o, s, (k + 1) / ameias);
      g.poly([a.x, a.y, b.x, b.y, b.x, b.y - 6, a.x, a.y - 6]).fill(face).stroke(contorno);
    }
  } else if (estilo.topo === 'pontudo') {
    // Uma pirâmide sobre o topo: o bico acima do centro.
    const cx = (n.x + l.x + s.x + o.x) / 4;
    const cy = (n.y + l.y + s.y + o.y) / 4 - h - CELULA_PX * 3.4;
    g.poly([o.x, o.y - h, s.x, s.y - h, cx, cy]).fill(TELHADO).stroke(contorno);
    g.poly([s.x, s.y - h, l.x, l.y - h, cx, cy]).fill(escurecer(TELHADO, 0.3)).stroke(contorno);
  } else if (estilo.topo === 'rochedo') {
    // Picos irregulares na borda da frente.
    const picos = Math.max(3, largura + 1);
    const pontos: number[] = [o.x, o.y - h];
    for (let k = 1; k < picos; k++) {
      const a = meio(o, s, k / picos);
      pontos.push(a.x, a.y - (k % 2 === 1 ? 10 + ((k * 7) % 9) : 2));
    }
    pontos.push(s.x, s.y - h);
    g.poly(pontos).fill(face).stroke(contorno);
  } else {
    // O frontão da cripta: um triângulo no meio da frente, com a cruz de pedra no alto.
    const a = meio(o, s, 0.25);
    const b = meio(o, s, 0.75);
    const topo = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - CELULA_PX * 0.8 };
    g.poly([a.x, a.y, b.x, b.y, topo.x, topo.y]).fill(face).stroke(contorno);
    g.moveTo(topo.x, topo.y).lineTo(topo.x, topo.y - 12).moveTo(topo.x - 5, topo.y - 8).lineTo(topo.x + 5, topo.y - 8).stroke({ width: 2.5, color: telhado });
  }
}

export interface EstruturasIso {
  destruir: () => void;
}

interface Estilo {
  /** Altura relativa (1 = a do castelo pelo tamanho). */
  alto: number;
  pedras: readonly number[];
  topo: 'ameias' | 'pontudo' | 'rochedo' | 'frontao';
  /** A moldura da porta: pedra (o arco) ou madeira (as escoras da mina). */
  porta: 'arco' | 'escoras';
}

const CASTELO: Estilo = { alto: 1, pedras: PEDRAS, topo: 'ameias', porta: 'arco' };

const ESTILOS: Readonly<Record<string, Estilo>> = {
  castelo: CASTELO,
  torre: { alto: 1.6, pedras: [0x6d6a7a, 0x5f5b6e, 0x77708a], topo: 'pontudo', porta: 'arco' },
  caverna: { alto: 0.75, pedras: [0x5f5a52, 0x6b6359, 0x575049], topo: 'rochedo', porta: 'arco' },
  mina: { alto: 0.8, pedras: [0x6a5f52, 0x5e5448, 0x726555], topo: 'rochedo', porta: 'escoras' },
  cripta: { alto: 0.85, pedras: [0x7c8590, 0x6f7883, 0x858d96], topo: 'frontao', porta: 'arco' },
};

export function criarEstruturasIso(camada: Container, fase: Fase, p: Projecao, textura: Texture | null = null): EstruturasIso {
  const pedraSul = textura ? pedraDaFace(textura, p, true) : null;
  const pedraLeste = textura ? pedraDaFace(textura, p, false) : null;
  const face = (pedra: FillPattern | null, cor: number) => (pedra ? { fill: pedra, color: cor } : { color: cor });
  const canto = (x: number, y: number) => p.projetar(x * CELULA_PX, y * CELULA_PX);
  const graficos: Graphics[] = [];
  for (const r of retangulosDeFachada(fase)) {
    const largura = r.x1 - r.x0 + 1;
    const fundo = r.y1 - r.y0 + 1;
    const estilo = ESTILOS[fase.estruturas?.find((e) => e.x === r.x0 && e.y === r.y0)?.tipo ?? 'castelo'] ?? CASTELO;
    const h = CELULA_PX * Math.min(5.5, (1.2 + Math.min(largura, fundo) * 0.45) * estilo.alto);
    const pedra = estilo.pedras[(r.x0 * 7 + r.y0 * 13) % estilo.pedras.length] ?? PEDRAS[0];
    const sul = pedra;
    const leste = escurecer(pedra, 0.22);
    const topo = escurecer(pedra, 0.45);
    const contorno = { width: 1, color: escurecer(pedra, 0.7), alpha: 0.3 };
    const n = canto(r.x0, r.y0);
    const l = canto(r.x1 + 1, r.y0);
    const s = canto(r.x1 + 1, r.y1 + 1);
    const o = canto(r.x0, r.y1 + 1);
    const g = new Graphics();
    g.poly([o.x, o.y, s.x, s.y, s.x, s.y - h, o.x, o.y - h]).fill(face(pedraSul, sul)).stroke(contorno);
    g.poly([s.x, s.y, l.x, l.y, l.x, l.y - h, s.x, s.y - h]).fill(face(pedraLeste, leste)).stroke(contorno);
    g.poly([n.x, n.y - h, l.x, l.y - h, s.x, s.y - h, o.x, o.y - h]).fill(topo).stroke(contorno);
    // Fiadas de pedra na face sul (o rochedo não tem: é pedra bruta, com veios tortos); com a textura, só no rochedo.
    for (let k = 1; k < 4 && (!textura || estilo.topo === 'rochedo'); k++) {
      const f = (h * k) / 4;
      const torto = estilo.topo === 'rochedo' ? (k % 2 === 0 ? 5 : -4) : 0;
      g.moveTo(o.x, o.y - f).lineTo((o.x + s.x) / 2, (o.y + s.y) / 2 - f + torto).lineTo(s.x, s.y - f);
    }
    g.stroke({ width: 1, color: escurecer(pedra, 0.35), alpha: 0.6 });
    desenharTopo(g, estilo, { n, l, s, o }, h, largura, sul, escurecer(pedra, 0.3), contorno);
    if (r.porta) {
      const e = canto(r.porta.x, r.y1 + 1);
      const d = canto(r.porta.x + 1, r.y1 + 1);
      const alto = Math.min(h * 0.7, CELULA_PX * 1.1);
      const moldura = estilo.porta === 'escoras' ? { width: 4, color: 0x7a5230 } : { width: 2, color: 0x6d5a40 };
      g.poly([e.x + 3, e.y, d.x - 3, d.y, d.x - 3, d.y - alto, (e.x + d.x) / 2, (e.y + d.y) / 2 - alto - 8, e.x + 3, e.y - alto]).fill(0x140d08).stroke(moldura);
      // A mina: a viga atravessada no alto da boca.
      if (estilo.porta === 'escoras') g.moveTo(e.x, e.y - alto).lineTo(d.x, d.y - alto).stroke({ width: 5, color: 0x6a4527 });
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
