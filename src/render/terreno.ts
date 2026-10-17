// Terreno em blocos de 16×16 células (§2.16): cada bloco é desenhado uma vez por fase e
// escondido quando sai da viewport. Até o tileset (marco 11A), as células são cores lisas (D-009).
// Marco 10A-2 (14/10/2026): o matiz da fase (`matizGraus`) gira a paleta uma vez, ao criar o terreno.
// Marco 11A (16/10/2026, D-066): com o tileset do jogador, cada bloco vira um Container de sprites (peça do
// autotiling ou a escolhida à mão, NEAREST); sem tileset, as cores lisas de sempre. O matiz não tinge o tileset.

import { Container, Graphics, Sprite } from 'pixi.js';
import { tipoEm, type Fase, type TipoCelula } from '../world/fase';
import { pecaDaCelula } from '../world/tileset';
import { CELULA_PX } from './camera-calculo';
import type { TexturasTileset } from './tileset-textura';

export const BLOCO_CELULAS = 16;

const COR_PAREDE = 0x15131b;
const COR_PAREDE_TOPO = 0x4a4357;
const COR_JUNTA = 0x2a2633;
const CORES_PISO = [0x3a3546, 0x3f3a4d, 0x36313f] as const;
const COR_SAIDA = 0xc98a1a;
const COR_SAIDA_MIOLO = 0xf3b442;

export interface Paleta {
  parede: number;
  paredeTopo: number;
  junta: number;
  piso: readonly [number, number, number];
}

/** Gira o matiz de uma cor (rotação no espaço RGB, matriz de matiz padrão); 0° devolve a mesma cor. */
export function girarMatiz(cor: number, graus: number): number {
  if (graus % 360 === 0) return cor;
  const r = (cor >> 16) & 0xff;
  const g = (cor >> 8) & 0xff;
  const b = cor & 0xff;
  const rad = (graus * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const canal = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const nr = r * (0.213 + c * 0.787 - s * 0.213) + g * (0.715 - c * 0.715 - s * 0.715) + b * (0.072 - c * 0.072 + s * 0.928);
  const ng = r * (0.213 - c * 0.213 + s * 0.143) + g * (0.715 + c * 0.285 + s * 0.14) + b * (0.072 - c * 0.072 - s * 0.283);
  const nb = r * (0.213 - c * 0.213 - s * 0.787) + g * (0.715 - c * 0.715 + s * 0.715) + b * (0.072 + c * 0.928 + s * 0.072);
  return (canal(nr) << 16) | (canal(ng) << 8) | canal(nb);
}

export function paletaDe(matiz: number): Paleta {
  const gira = (cor: number) => girarMatiz(cor, matiz);
  return {
    parede: gira(COR_PAREDE),
    paredeTopo: gira(COR_PAREDE_TOPO),
    junta: gira(COR_JUNTA),
    piso: [gira(CORES_PISO[0]), gira(CORES_PISO[1]), gira(CORES_PISO[2])],
  };
}

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

function desenharCelula(g: Graphics, fase: Fase, paleta: Paleta, x: number, y: number, tipo: TipoCelula): void {
  const px = x * CELULA_PX;
  const py = y * CELULA_PX;
  switch (tipo) {
    case 'piso': {
      const v = variacaoPiso(x, y);
      const cor = v < 0.15 ? paleta.piso[1] : v < 0.225 ? paleta.piso[2] : paleta.piso[0];
      g.rect(px, py, CELULA_PX, CELULA_PX).fill(paleta.junta);
      g.rect(px + 1, py + 1, CELULA_PX - 2, CELULA_PX - 2).fill(cor);
      break;
    }
    case 'parede': {
      g.rect(px, py, CELULA_PX, CELULA_PX).fill(paleta.parede);
      // Face superior mais clara quando há piso abaixo: dá leitura de altura à parede.
      const sobrePiso = tipoEm(fase, x, y + 1) === 'piso' || tipoEm(fase, x, y + 1) === 'saida';
      if (sobrePiso) g.rect(px, py + CELULA_PX - 8, CELULA_PX, 8).fill(paleta.paredeTopo);
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
  /** Container do bloco: as cores lisas (Graphics) e, com tileset, os sprites por cima. */
  c: Container;
  g: Graphics;
  bx: number;
  by: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export function criarTerreno(camada: Container, fase: Fase, tileset: TexturasTileset | null = null): Terreno {
  const blocos: Bloco[] = [];
  const paleta = paletaDe(fase.matizGraus);
  const desenharBloco = (b: Bloco) => {
    b.g.clear();
    for (const filho of b.c.removeChildren(1)) filho.destroy();
    const fimX = Math.min(fase.largura, b.bx + BLOCO_CELULAS);
    const fimY = Math.min(fase.altura, b.by + BLOCO_CELULAS);
    for (let y = b.by; y < fimY; y++) {
      for (let x = b.bx; x < fimX; x++) {
        const tipo = tipoEm(fase, x, y);
        const peca = tileset ? pecaDaCelula(fase, x, y, 0) : null;
        const textura = peca && tileset ? tileset.textura(peca) : null;
        if (!textura) {
          // Sem tileset (ou sem a peça no atlas): a cor lisa; parede funda com tileset fica no escuro.
          if (!tileset || tipo === 'piso' || tipo === 'saida') desenharCelula(b.g, fase, paleta, x, y, tipo);
          continue;
        }
        const s = new Sprite(textura);
        s.position.set(x * CELULA_PX, y * CELULA_PX);
        s.width = CELULA_PX;
        s.height = CELULA_PX;
        b.c.addChild(s);
      }
    }
  };
  const porLinha = Math.ceil(fase.largura / BLOCO_CELULAS);
  for (let by = 0; by < fase.altura; by += BLOCO_CELULAS) {
    for (let bx = 0; bx < fase.largura; bx += BLOCO_CELULAS) {
      const fimX = Math.min(fase.largura, bx + BLOCO_CELULAS);
      const fimY = Math.min(fase.altura, by + BLOCO_CELULAS);
      const c = new Container();
      const g = new Graphics();
      c.addChild(g);
      const b: Bloco = { c, g, bx, by, x0: bx * CELULA_PX, y0: by * CELULA_PX, x1: fimX * CELULA_PX, y1: fimY * CELULA_PX };
      desenharBloco(b);
      camada.addChild(c);
      blocos.push(b);
    }
  }
  const blocoDe = (x: number, y: number) =>
    x < 0 || y < 0 || x >= fase.largura || y >= fase.altura
      ? undefined
      : blocos[Math.floor(y / BLOCO_CELULAS) * porLinha + Math.floor(x / BLOCO_CELULAS)];
  return {
    redesenharCelula: (x, y) => {
      // O autotiling olha os 8 vizinhos: redesenha os blocos da vizinhança 3×3 (sem repetir).
      const tocados = new Set<Bloco>();
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const b = blocoDe(x + dx, y + dy);
        if (b) tocados.add(b);
      }
      for (const b of tocados) desenharBloco(b);
    },
    // Retângulo visível em px de mundo.
    atualizarVisibilidade: (x0, y0, x1, y1) => {
      for (const b of blocos) b.c.visible = b.x1 > x0 && b.x0 < x1 && b.y1 > y0 && b.y0 < y1;
    },
    destruir: () => {
      for (const b of blocos) b.c.destroy({ children: true });
      blocos.length = 0;
    },
  };
}
