// Marco 54 (26/11/2026, D-207): as regras que no Mundo contínuo mudam com a posição. Antes cada região era uma sala e o
// modo dela trazia o PvP e o loot do perigo; com o atlas numa sala só, o modo leva o mapa das zonas e as regras de
// cada uma, e funções pequenas leem a regra no ponto. Sem o mapa (os outros modos e o Mundo por região), vale o modo
// inteiro, como antes. Puro.

import type { ModoDeJogo } from './modo';

export interface RegrasPorZona {
  largura: number;
  altura: number;
  /** O índice da zona + 1 em cada célula (0 = fora de toda zona). */
  celulas: Uint8Array;
  /** Por índice de zona: o PvP (o fogo amigo entre jogadores) e o loot do perigo (com o evento, se houver). */
  pvp: readonly boolean[];
  lootPct: readonly number[];
}

/** O índice da zona no ponto (arredondado), ou -1 fora de toda zona. */
export function indiceDaZona(z: RegrasPorZona, x: number, y: number): number {
  const cx = Math.round(x);
  const cy = Math.round(y);
  if (cx < 0 || cy < 0 || cx >= z.largura || cy >= z.altura) return -1;
  return (z.celulas[cy * z.largura + cx] ?? 0) - 1;
}

/** Há PvP no ponto? Sem posição, só o modo inteiro decide (no Mundo contínuo, não). */
export function pvpEm(modo: Pick<ModoDeJogo, 'fogoAmigo' | 'zonas'>, p?: { x?: number; y?: number } | null): boolean {
  if (!modo.zonas) return modo.fogoAmigo;
  if (p?.x === undefined || p.y === undefined) return false;
  return modo.zonas.pvp[indiceDaZona(modo.zonas, p.x, p.y)] ?? false;
}

/** O loot do lugar no ponto (100 = o normal). */
export function lootPctEm(modo: Pick<ModoDeJogo, 'lootPct' | 'zonas'>, x: number, y: number): number {
  if (!modo.zonas) return modo.lootPct ?? 100;
  return modo.zonas.lootPct[indiceDaZona(modo.zonas, x, y)] ?? modo.lootPct ?? 100;
}
