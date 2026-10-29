// Atlas rico de efeitos (marco 26, 29/10/2026, D-124). As texturas do atlas antigo são carimbos planos de Graphics;
// estas são pintadas uma vez num canvas 2D, com gradiente, sombreado e ruído, em células de 64 px (vistas como 32 px
// de mundo, a mesma escala das antigas). Tudo em tons de cinza: a cor vem do tingimento da partícula ou da peça.
// Ninguém aqui é forma plana (D-066): a chama tem 8 quadros que tremulam, o elo tem reflexo metálico, o gelo é
// translúcido e as marcas do chão têm borda irregular.

import { desenharTextura, LADO_RICO } from './pintura';

export { LADO_RICO };
const COLUNAS = 8;

export const TEXTURAS_RICAS = [
  // Fogo: a labareda em 8 quadros, a brasa, a fumaça macia em 3 variações e a cinza.
  'chama0', 'chama1', 'chama2', 'chama3', 'chama4', 'chama5', 'chama6', 'chama7',
  'brasa', 'fumaca1', 'fumaca2', 'fumaca3', 'cinza',
  // Corrente: o elo de frente e de lado, o gancho, a bola de ferro e a algema.
  'elo', 'elo_lado', 'gancho', 'bola_ferro', 'algema',
  // Matérias.
  'osso', 'cranio', 'alma', 'pena', 'gelo', 'gota_viva', 'rocha', 'folha', 'lamina', 'garra', 'espinho', 'mao_ossea',
  // Impacto e luz.
  'choque', 'clarao', 'feixe', 'estilhaco', 'cintilar', 'arco_golpe',
  // Símbolos.
  'runa0', 'runa1', 'runa2', 'runa3', 'hexagono', 'circulo_runico', 'olho', 'mira_alvo', 'onda_som',
  // Marcas no chão.
  'queimado', 'geada', 'rachadura', 'poca_sangue', 'poca_veneno', 'asa',
  // As runas das classes (D-116), para o círculo da ultimate.
  'runa_guerreiro', 'runa_mago', 'runa_arqueiro', 'runa_necromante', 'runa_aventureiro',
] as const;
export type TexturaRica = (typeof TEXTURAS_RICAS)[number];

/** Os quadros da labareda, na ordem (o flipbook da chama). */
export const QUADROS_CHAMA: readonly TexturaRica[] = ['chama0', 'chama1', 'chama2', 'chama3', 'chama4', 'chama5', 'chama6', 'chama7'];
export const QUADROS_FUMACA: readonly TexturaRica[] = ['fumaca1', 'fumaca2', 'fumaca3'];

export function ehTexturaRica(nome: string): nome is TexturaRica {
  return (TEXTURAS_RICAS as readonly string[]).includes(nome);
}

/** Onde a textura fica no atlas (px do canvas). */
export function celulaDaTextura(nome: TexturaRica): { x: number; y: number } {
  const i = TEXTURAS_RICAS.indexOf(nome);
  return { x: (i % COLUNAS) * LADO_RICO, y: Math.floor(i / COLUNAS) * LADO_RICO };
}

export function tamanhoDoAtlas(): { largura: number; altura: number } {
  return { largura: COLUNAS * LADO_RICO, altura: Math.ceil(TEXTURAS_RICAS.length / COLUNAS) * LADO_RICO };
}

/** Pinta o atlas inteiro num canvas (uma vez por cena). Sem DOM (testes), devolve null. */
export function pintarAtlasRico(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const { largura, altura } = tamanhoDoAtlas();
  const canvas = document.createElement('canvas');
  canvas.width = largura;
  canvas.height = altura;
  const g = canvas.getContext('2d');
  if (!g) return null;
  for (const nome of TEXTURAS_RICAS) {
    const { x, y } = celulaDaTextura(nome);
    g.save();
    g.beginPath();
    g.rect(x, y, LADO_RICO, LADO_RICO);
    g.clip();
    g.translate(x, y);
    desenharTextura(g, nome);
    g.restore();
  }
  return canvas;
}
