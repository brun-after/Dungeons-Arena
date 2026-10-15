// Atlas dos modelos de criatura, gerado no build (§2.16: "vetor → textura + JSON"). Marco 13 (14/10/2026),
// D-058. Função pura: monta um SVG único com todos os quadros numa grade e o JSON com a posição e a origem
// de cada um. O plugin do Vite (`virtual:atlas-criaturas`, em vite.config.ts) chama isto no Node e embute o
// resultado como data URL; o jogo só decodifica a imagem, sem rasterizar vetor em tempo de execução.
// Os imports desta pasta levam a extensão `.ts`: o vite.config.ts os carrega direto no Node.

import { MODELOS, type NomeModelo } from './index.ts';
import { LADO_QUADRO, MEIO, PES_Y, type Vista } from './svg.ts';

/** Lado de cada quadro no atlas, em px: 18 × 8, para as 18 tiras caírem em pixels inteiros. */
export const LADO_PX = 144;
const RESPIRO_PX = 4;
const COLUNAS = 8;
export const VISTAS: readonly Vista[] = ['cima', '34'];

export interface QuadroAtlas {
  x: number;
  y: number;
  l: number;
  a: number;
  /** Origem normalizada: o centro dos pés (3/4) ou o centro do corpo (de cima). */
  ancoraX: number;
  ancoraY: number;
}

export interface Atlas {
  svg: string;
  largura: number;
  altura: number;
  quadros: Record<string, QuadroAtlas>;
}

export function chaveQuadro(modelo: string, vista: Vista, quadro: number): string {
  return `${modelo}/${vista}/${quadro}`;
}

export function gerarAtlas(): Atlas {
  const entradas: { chave: string; conteudo: string; vista: Vista }[] = [];
  for (const nome of Object.keys(MODELOS) as NomeModelo[]) {
    const m = MODELOS[nome];
    for (const vista of VISTAS) {
      for (let q = 0; q < m.quadros; q++) entradas.push({ chave: chaveQuadro(nome, vista, q), conteudo: m.desenhar(vista, q), vista });
    }
  }
  const passo = LADO_PX + RESPIRO_PX;
  const linhas = Math.ceil(entradas.length / COLUNAS);
  const largura = COLUNAS * passo;
  const altura = linhas * passo;
  const escala = LADO_PX / LADO_QUADRO;
  const quadros: Record<string, QuadroAtlas> = {};
  const grupos = entradas.map((e, i) => {
    const x = (i % COLUNAS) * passo;
    const y = Math.floor(i / COLUNAS) * passo;
    quadros[e.chave] = { x, y, l: LADO_PX, a: LADO_PX, ancoraX: 0.5, ancoraY: e.vista === '34' ? PES_Y / LADO_QUADRO : MEIO / LADO_QUADRO };
    return `<g transform="translate(${x} ${y}) scale(${escala})">${e.conteudo}</g>`;
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="${altura}" viewBox="0 0 ${largura} ${altura}">${grupos.join('')}</svg>`;
  return { svg, largura, altura, quadros };
}

/** O módulo virtual entregue ao jogo: o SVG como data URL e o JSON dos quadros. */
export function moduloDoAtlas(): string {
  const a = gerarAtlas();
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(a.svg)}`;
  return `export default ${JSON.stringify({ url, largura: a.largura, altura: a.altura, quadros: a.quadros })};\n`;
}
