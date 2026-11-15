// O relevo no isométrico (marco 42, D-176; refeito no marco 43, 15/11/2026, D-177). O chão sobe de verdade (a malha de
// render/solo/malha-relevo.ts e a projeção com altura); onde duas células vizinhas ficam além da encosta, o chão de
// cima e o de baixo não se encontram, e o vão vira a face do penhasco, desenhada aqui:
// - a face fica na aresta, de frente para quem olha (sul e leste), da borda de cima até o chão de baixo;
// - rocha natural do bioma: mais clara em cima, escura no pé, com as camadas (estratos) a cada nível, rachaduras e o
//   capim ou a neve pendendo da borda; o leste mais escuro que o sul (a luz vem do noroeste, como nas paredes);
// - na camada das entidades, por diagonal, como as paredes: quem passa atrás do penhasco fica atrás dele.

import { Graphics, type Container } from 'pixi.js';
import type { Fase } from '../world/fase';
import type { Bioma } from '../mundo/reino';
import { CELULA_PX } from './camera-calculo';
import { clarear, escurecer } from './modelos/svg';
import type { Projecao } from './projecao';
import { relevoDaFase } from './relevo-tela';

/** A rocha e a borda de cada bioma. */
const ROCHA: Readonly<Record<Bioma, { rocha: number; borda: number }>> = {
  // Marco 43 (D-177): no tom dos rochedos pré-renderizados (a mesma luz baixa), não mais claro que eles.
  campo: { rocha: 0x4e4a44, borda: 0x3f5428 },
  floresta: { rocha: 0x45433c, borda: 0x324a28 },
  pantano: { rocha: 0x3e3c32, borda: 0x3c4428 },
  colinas: { rocha: 0x544c42, borda: 0x56602f },
  ruinas: { rocha: 0x4c4944, borda: 0x4a4a34 },
  neve: { rocha: 0x5a5e6a, borda: 0xd8e0ea },
  deserto: { rocha: 0x8a6a46, borda: 0xb8986a },
};

/** Abaixo disto (px), o vão é costura da malha, não penhasco. */
const VAO_MINIMO = 1.5;

export interface PenhascosIso {
  destruir: () => void;
}

/** Hash estável da aresta (as rachaduras e os estratos tortos saem iguais toda vez). */
function hash(x: number, y: number, s: number): number {
  let h = (x * 374_761_393 + y * 668_265_263 + s * 2_147_483_647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1_274_126_177);
  return ((h ^ (h >>> 16)) >>> 0) / 4_294_967_296;
}

interface Face {
  /** Os dois cantos de cima (na tela) e os dois de baixo, na mesma ordem. */
  a: { x: number; y: number };
  b: { x: number; y: number };
  aBaixo: { x: number; y: number };
  bBaixo: { x: number; y: number };
}

function desenharFace(g: Graphics, f: Face, cor: number, borda: number, pxPorNivel: number, semente: number, neve: boolean): void {
  const alt = Math.max(f.aBaixo.y - f.a.y, f.bBaixo.y - f.b.y);
  const meio = (p: { x: number; y: number }, q: { x: number; y: number }, t: number) => ({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t });
  // Marco 43 (D-177): o corpo em facetas low-poly (o estilo das rochas e das árvores pré-renderizadas): uma grade
  // torta de blocos, um nível por linha, cada bloco em dois triângulos (o de cima mais claro, a luz vem do alto);
  // mais escuro para o pé. As bordas laterais não entortam (a face vizinha casa sem fresta).
  const linhas = Math.max(1, Math.round(alt / pxPorNivel));
  const colunas = 3;
  const ponto = (i: number, j: number) => {
    const t = j / linhas;
    const u = i / colunas;
    const topo = meio(f.a, f.b, u);
    const pe = meio(f.aBaixo, f.bBaixo, u);
    const q = meio(topo, pe, t);
    const borda = i === 0 || i === colunas;
    const dx = borda ? 0 : (hash(semente, i * 31 + j, 9) - 0.5) * 6;
    const dy = j === 0 || j === linhas ? 0 : (hash(semente, i * 17 + j, 10) - 0.5) * pxPorNivel * 0.6;
    return { x: q.x + dx, y: q.y + dy };
  };
  for (let j = 0; j < linhas; j++) {
    const sombra = 0.3 * (j / linhas);
    for (let i = 0; i < colunas; i++) {
      const p00 = ponto(i, j);
      const p10 = ponto(i + 1, j);
      const p01 = ponto(i, j + 1);
      const p11 = ponto(i + 1, j + 1);
      const v = (hash(semente, i * 7 + j, 11) - 0.5) * 0.3;
      const tom = v >= 0 ? clarear(cor, v) : escurecer(cor, -v);
      const diagonal = hash(semente, i + j * 3, 12) < 0.5;
      const [t1, t2] = diagonal ? [[p00, p10, p01], [p10, p11, p01]] : [[p00, p10, p11], [p00, p11, p01]];
      g.poly(t1.flatMap((q) => [q.x, q.y])).fill(clarear(escurecer(tom, sombra), 0.08));
      g.poly(t2.flatMap((q) => [q.x, q.y])).fill(escurecer(tom, sombra + 0.1));
      // A quina de cima do bloco pega luz.
      g.moveTo(p00.x, p00.y + 0.5).lineTo(p10.x, p10.y + 0.5).stroke({ width: 1, color: clarear(cor, 0.22), alpha: 0.35 });
    }
  }
  // O pé escuro (a sombra onde a rocha encontra o chão).
  const ap = meio(f.a, f.aBaixo, 0.82);
  const bp = meio(f.b, f.bBaixo, 0.82);
  g.poly([ap.x, ap.y, bp.x, bp.y, f.bBaixo.x, f.bBaixo.y, f.aBaixo.x, f.aBaixo.y]).fill({ color: 0x000000, alpha: 0.28 });
  // As rachaduras: zero a duas, de cima para baixo, quebradas.
  const rachas = Math.floor(hash(semente, 7, 3) * 3);
  for (let r = 0; r < rachas; r++) {
    const u = 0.2 + hash(semente, r, 4) * 0.6;
    const topo = meio(f.a, f.b, u);
    const pe = meio(f.aBaixo, f.bBaixo, u + (hash(semente, r, 5) - 0.5) * 0.2);
    const m1 = meio(topo, pe, 0.4);
    g.moveTo(topo.x, topo.y + 2).lineTo(m1.x + (hash(semente, r, 6) - 0.5) * 5, m1.y).lineTo(pe.x, pe.y - 2).stroke({ width: 1.2, color: escurecer(cor, 0.5), alpha: 0.6 });
  }
  // A borda de cima: o capim (ou a neve) que pende da quina, em dentes.
  const dentes = 5;
  const pontos: number[] = [f.a.x, f.a.y - 1, f.b.x, f.b.y - 1];
  for (let i = dentes; i >= 0; i--) {
    const t = i / dentes;
    const p = meio(f.a, f.b, t);
    const queda = (neve ? 4 : 3) + hash(semente, i, 8) * (neve ? 5 : 4);
    pontos.push(p.x, p.y + (i % 2 === 0 ? queda : queda * 0.4));
  }
  g.poly(pontos).fill(borda);
  g.moveTo(f.a.x, f.a.y).lineTo(f.b.x, f.b.y).stroke({ width: 1.2, color: clarear(borda, 0.3), alpha: 0.7 });
}

export function criarPenhascosIso(camada: Container, fase: Fase, p: Projecao): PenhascosIso | null {
  const relevo = relevoDaFase(fase);
  if (!relevo) return null;
  const { largura: w, altura: h, cantos, pxPorNivel } = relevo;
  const estilo = (fase.bioma && fase.bioma in ROCHA ? ROCHA[fase.bioma as Bioma] : null) ?? ROCHA.campo;
  const neve = fase.bioma === 'neve';
  const sul = escurecer(estilo.rocha, 0.2);
  const leste = escurecer(estilo.rocha, 0.42);
  // O ponto da tela de um canto (em células) numa altura (níveis): o plano projetado e erguido.
  const tela = (cx: number, cy: number, nivel: number) => {
    const q = p.projetar(cx * CELULA_PX, cy * CELULA_PX);
    // `projetar` já ergue pela altura interpolada; aqui vale a altura deste lado do muro, não a média.
    return { x: q.x, y: q.z - nivel * pxPorNivel };
  };
  const graficos: Graphics[] = [];
  for (let d = 0; d <= w + h - 2; d++) {
    let g: Graphics | null = null;
    for (let x = Math.max(0, d - h + 1); x <= Math.min(d, w - 1); x++) {
      const y = d - x;
      const k = (y * w + x) * 4;
      // Sul: os cantos sudoeste e sudeste daqui contra o noroeste e o nordeste da de baixo.
      if (y + 1 < h) {
        const kb = ((y + 1) * w + x) * 4;
        const so = cantos[k + 3] ?? 0;
        const se = cantos[k + 2] ?? 0;
        const no = cantos[kb] ?? 0;
        const ne = cantos[kb + 1] ?? 0;
        if ((so - no) * pxPorNivel > VAO_MINIMO || (se - ne) * pxPorNivel > VAO_MINIMO) {
          g ??= new Graphics();
          desenharFace(g, { a: tela(x, y + 1, so), b: tela(x + 1, y + 1, se), aBaixo: tela(x, y + 1, Math.min(so, no)), bBaixo: tela(x + 1, y + 1, Math.min(se, ne)) }, sul, estilo.borda, pxPorNivel, x * 7 + y * 13, neve);
        }
      }
      // Leste: os cantos nordeste e sudeste daqui contra o noroeste e o sudoeste da do lado.
      if (x + 1 < w) {
        const kl = (y * w + x + 1) * 4;
        const ne = cantos[k + 1] ?? 0;
        const se = cantos[k + 2] ?? 0;
        const no = cantos[kl] ?? 0;
        const so = cantos[kl + 3] ?? 0;
        if ((ne - no) * pxPorNivel > VAO_MINIMO || (se - so) * pxPorNivel > VAO_MINIMO) {
          g ??= new Graphics();
          desenharFace(g, { a: tela(x + 1, y, ne), b: tela(x + 1, y + 1, se), aBaixo: tela(x + 1, y, Math.min(ne, no)), bBaixo: tela(x + 1, y + 1, Math.min(se, so)) }, leste, estilo.borda, pxPorNivel, x * 11 + y * 5 + 3, neve);
        }
      }
    }
    if (!g) continue;
    // A face fica no fim da diagonal das células de cima (quem está na de baixo, na frente, a cobre).
    g.zIndex = p.projetar((d / 2 + 0.5) * CELULA_PX, (d / 2 + 0.5) * CELULA_PX).z + 0.02;
    g.label = `penhascos-${d}`;
    camada.addChild(g);
    graficos.push(g);
  }
  return { destruir: () => { for (const g of graficos) g.destroy(); } };
}
