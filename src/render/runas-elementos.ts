// Runas dos elementos (marco 32, 31/10/2026, D-131): o símbolo que acende na página do tomo enquanto o mago conjura,
// na cor do elemento da magia (o arcano quando ela não tem elemento). Os traços seguem o quadro de 100 × 100 das runas
// das classes (runas.ts).

import type { Graphics } from 'pixi.js';
import type { Elemento } from '../combat/elementos';
import { desenharTracos, type Runa } from './runas';

/** A cor do arcano (a magia sem elemento). */
const COR_ARCANA = 0xa98bff;

const TRACOS: Readonly<Record<Elemento | 'arcano', Runa['tracos']>> = {
  // Chama: o triângulo com a língua de fogo dentro.
  fogo: [
    { t: 'linha', p: [50, 12, 84, 82, 16, 82], fechar: true },
    { t: 'curva', de: [50, 72], controle: [30, 50], ate: [50, 36] },
    { t: 'curva', de: [50, 72], controle: [70, 54], ate: [50, 36] },
  ],
  // Floco: três eixos com as pontas em V.
  gelo: [
    { t: 'linha', p: [50, 12, 50, 88] },
    { t: 'linha', p: [17, 31, 83, 69] },
    { t: 'linha', p: [17, 69, 83, 31] },
    { t: 'linha', p: [40, 20, 50, 28, 60, 20] },
    { t: 'linha', p: [40, 80, 50, 72, 60, 80] },
  ],
  // Raio partido.
  raio: [{ t: 'linha', p: [60, 10, 30, 52, 54, 52, 40, 90, 72, 42, 48, 42, 60, 10], fechar: true }],
  // Gota com a caveira de um ponto.
  veneno: [
    { t: 'curva', de: [50, 12], controle: [16, 62], ate: [50, 86] },
    { t: 'curva', de: [50, 12], controle: [84, 62], ate: [50, 86] },
    { t: 'circulo', x: 50, y: 62, r: 8 },
  ],
  // Olho aberto.
  psiquico: [
    { t: 'curva', de: [12, 50], controle: [50, 14], ate: [88, 50] },
    { t: 'curva', de: [12, 50], controle: [50, 86], ate: [88, 50] },
    { t: 'circulo', x: 50, y: 50, r: 12 },
    { t: 'circulo', x: 50, y: 50, r: 4, cheio: true },
  ],
  // Montanha sobre a base.
  terra: [
    { t: 'linha', p: [12, 78, 38, 30, 52, 52, 64, 36, 88, 78] },
    { t: 'linha', p: [12, 88, 88, 88] },
  ],
  // Lua minguante com o olho fechado.
  trevas: [
    { t: 'curva', de: [58, 12], controle: [8, 50], ate: [58, 88] },
    { t: 'curva', de: [58, 12], controle: [32, 50], ate: [58, 88] },
    { t: 'linha', p: [62, 50, 86, 50] },
  ],
  // Sol: o círculo com os raios em cruz.
  sagrado: [
    { t: 'circulo', x: 50, y: 50, r: 16 },
    { t: 'linha', p: [50, 10, 50, 26] },
    { t: 'linha', p: [50, 74, 50, 90] },
    { t: 'linha', p: [10, 50, 26, 50] },
    { t: 'linha', p: [74, 50, 90, 50] },
  ],
  // Losango com o núcleo (a magia pura).
  arcano: [
    { t: 'linha', p: [50, 10, 86, 50, 50, 90, 14, 50], fechar: true },
    { t: 'circulo', x: 50, y: 50, r: 6, cheio: true },
  ],
};

const feitas = new Map<string, Runa>();

/** A runa do elemento (null: arcano), a mesma para o mesmo elemento e cor. */
export function runaDoElemento(elemento: Elemento | null, cor: number | null): Runa {
  const chave = `${elemento}|${cor}`;
  let r = feitas.get(chave);
  if (!r) {
    r = { cor: cor ?? COR_ARCANA, tracos: TRACOS[elemento ?? 'arcano'] };
    feitas.set(chave, r);
  }
  return r;
}

/** Desenha a runa do elemento centrada em (0, 0), com `tamanho` px de lado. */
export function desenharRunaDoElemento(g: Graphics, runa: Runa, tamanho: number): void {
  desenharTracos(g, runa, runa.cor, tamanho);
}
