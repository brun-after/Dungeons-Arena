// Terreno em blocos de 16×16 células (§2.16): cada bloco é desenhado uma vez por fase e
// escondido quando sai da viewport. Até o tileset (marco 11A), as células são cores lisas (D-009).

import { Container, Graphics } from 'pixi.js';
import { tipoEm, type Fase, type TipoCelula } from '../world/fase';
import { CELULA_PX } from './camera-calculo';

export const BLOCO_CELULAS = 16;

const COR_PAREDE = 0x15131b;
const COR_PAREDE_TOPO = 0x4a4357;
const COR_JUNTA = 0x2a2633;
const CORES_PISO = [0x3a3546, 0x3f3a4d, 0x36313f] as const;
const COR_SAIDA = 0xc98a1a;
const COR_SAIDA_MIOLO = 0xf3b442;

/** Variação de piso por posição, com avalanche para não formar padrão diagonal (§2.16). */
export function variacaoPiso(x: number, y: number): number {
  let h = Math.imul(x, 0x27d4eb2d) ^ Math.imul(y, 0x165667b1);
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  h = Math.imul(h, 0x297a2d39);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

function desenharCelula(g: Graphics, fase: Fase, x: number, y: number, tipo: TipoCelula): void {
  const px = x * CELULA_PX;
  const py = y * CELULA_PX;
  switch (tipo) {
    case 'piso': {
      const v = variacaoPiso(x, y);
      const cor = v < 0.15 ? CORES_PISO[1] : v < 0.225 ? CORES_PISO[2] : CORES_PISO[0];
      g.rect(px, py, CELULA_PX, CELULA_PX).fill(COR_JUNTA);
      g.rect(px + 1, py + 1, CELULA_PX - 2, CELULA_PX - 2).fill(cor);
      break;
    }
    case 'parede': {
      g.rect(px, py, CELULA_PX, CELULA_PX).fill(COR_PAREDE);
      // Face superior mais clara quando há piso abaixo: dá leitura de altura à parede.
      const sobrePiso = tipoEm(fase, x, y + 1) === 'piso' || tipoEm(fase, x, y + 1) === 'saida';
      if (sobrePiso) g.rect(px, py + CELULA_PX - 8, CELULA_PX, 8).fill(COR_PAREDE_TOPO);
      break;
    }
    case 'saida':
      g.rect(px, py, CELULA_PX, CELULA_PX).fill(COR_SAIDA);
      g.rect(px + 10, py + 10, CELULA_PX - 20, CELULA_PX - 20).fill(COR_SAIDA_MIOLO);
      break;
    case 'vazio':
      break;
  }
}

export interface Terreno {
  atualizarVisibilidade: (x0: number, y0: number, x1: number, y1: number) => void;
  /** Editor (marco 6C): redesenha o bloco da célula e o de cima (a parede depende de quem está abaixo). */
  redesenharCelula: (x: number, y: number) => void;
  destruir: () => void;
}

interface Bloco {
  g: Graphics;
  bx: number;
  by: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export function criarTerreno(camada: Container, fase: Fase): Terreno {
  const blocos: Bloco[] = [];
  const desenharBloco = (b: Bloco) => {
    b.g.clear();
    const fimX = Math.min(fase.largura, b.bx + BLOCO_CELULAS);
    const fimY = Math.min(fase.altura, b.by + BLOCO_CELULAS);
    for (let y = b.by; y < fimY; y++) {
      for (let x = b.bx; x < fimX; x++) desenharCelula(b.g, fase, x, y, tipoEm(fase, x, y));
    }
  };
  const porLinha = Math.ceil(fase.largura / BLOCO_CELULAS);
  for (let by = 0; by < fase.altura; by += BLOCO_CELULAS) {
    for (let bx = 0; bx < fase.largura; bx += BLOCO_CELULAS) {
      const fimX = Math.min(fase.largura, bx + BLOCO_CELULAS);
      const fimY = Math.min(fase.altura, by + BLOCO_CELULAS);
      const b: Bloco = { g: new Graphics(), bx, by, x0: bx * CELULA_PX, y0: by * CELULA_PX, x1: fimX * CELULA_PX, y1: fimY * CELULA_PX };
      desenharBloco(b);
      camada.addChild(b.g);
      blocos.push(b);
    }
  }
  const blocoDe = (x: number, y: number) =>
    x < 0 || y < 0 || x >= fase.largura || y >= fase.altura
      ? undefined
      : blocos[Math.floor(y / BLOCO_CELULAS) * porLinha + Math.floor(x / BLOCO_CELULAS)];
  return {
    redesenharCelula: (x, y) => {
      const proprio = blocoDe(x, y);
      const acima = blocoDe(x, y - 1);
      if (proprio) desenharBloco(proprio);
      if (acima && acima !== proprio) desenharBloco(acima);
    },
    // Retângulo visível em px de mundo.
    atualizarVisibilidade: (x0, y0, x1, y1) => {
      for (const b of blocos) b.g.visible = b.x1 > x0 && b.x0 < x1 && b.y1 > y0 && b.y0 < y1;
    },
    destruir: () => {
      for (const b of blocos) b.g.destroy();
      blocos.length = 0;
    },
  };
}
