// O que o marco 38 (08/11/2026, D-142) põe no exterior de uma região do Mundo, à parte do gerador principal:
// - o corredor da região estreita (o deserto da travessia): só fica livre a faixa que liga as passagens ao centro;
// - o abrigo da pedra de save no centro das regiões sem vila (uma clareira que os monstros não ocupam);
// - o nível de cada monstro pelas faixas mistas (a travessia tem os do reino de onde se sai e os do destino);
// - os andarilhos que dão missão, perto das estradas;
// - as rotas dos mercadores errantes, de uma passagem até o centro.
// Cada sorteio tem o próprio RNG, para não mexer no resto da região. Puro.

import type { Celula } from '../core/comandos';
import { aleatorio, criarRng, escolher, inteiro, type EstadoRng } from '../core/rng';
import { LADOS, vizinha, type Reino, type RegiaoDoMundo } from '../mundo/reino';
import type { PontoDoExterior } from './gerador-exterior';

export interface GradeDoExterior {
  readonly n: number;
  em(x: number, y: number): string;
  por(x: number, y: number, ch: string): void;
  interna(x: number, y: number): boolean;
}

const ANDA = new Set([',', '.', '=']);
const SEMENTE_ANDARILHOS = 50_021;
/** O raio da clareira da pedra de save (Chebyshev). */
export const RAIO_ABRIGO = 3;

/** Onde cada passagem chega por dentro (a mesma conta de `abrirPassagens`). */
export function entradasDosLados(reino: Reino, regiao: RegiaoDoMundo, n: number): Celula[] {
  const c = Math.floor(n / 2);
  return LADOS.filter((lado) => vizinha(reino, regiao, lado)).map((lado) =>
    lado === 'norte' ? { x: c, y: 2 } : lado === 'sul' ? { x: c, y: n - 3 } : lado === 'oeste' ? { x: 2, y: c } : { x: n - 3, y: c },
  );
}

/** Distância do ponto ao segmento a–b. */
function aoSegmento(px: number, py: number, a: Celula, b: Celula): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const t = dx === 0 && dy === 0 ? 0 : Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (a.x + dx * t), py - (a.y + dy * t));
}

/**
 * O corredor: fora da faixa que vai de cada entrada ao centro (com a largura ondulando), um paredão de duas células e,
 * atrás dele, o platô de rocha. Dentro, o terreno sorteado fica (as dunas e as pedras do caminho).
 */
export function escavarCorredor(g: GradeDoExterior, entradas: readonly Celula[], chao: string, semente: number): void {
  const n = g.n;
  const centro = { x: Math.floor(n / 2), y: Math.floor(n / 2) };
  const largura = n * 0.11;
  for (let y = 1; y < n - 1; y++) {
    for (let x = 1; x < n - 1; x++) {
      const d = entradas.reduce((m, e) => Math.min(m, aoSegmento(x, y, e, centro)), Infinity);
      const onda = largura * (1 + 0.25 * Math.sin((x + y) * 0.07 + semente) + 0.15 * Math.cos((x - y) * 0.11 + semente * 0.5));
      // O paredão (duas células) e, atrás dele, o platô de rocha sem acesso (no tema do deserto, a variação de rocha).
      if (d > onda + 2) g.por(x, y, ',');
      else if (d > onda) g.por(x, y, '#');
      else if (d > onda - 2 && g.em(x, y) === '~') g.por(x, y, chao);
    }
  }
  // A praça do meio sempre aberta (o centro do caminho e a pedra de save).
  for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) if (g.interna(centro.x + dx, centro.y + dy) && Math.hypot(dx, dy) <= 6) g.por(centro.x + dx, centro.y + dy, chao);
}

/** A clareira da pedra de save no centro da região sem vila (piso, protegida das estradas e dos sorteios). */
export function abrigoDoCentro(g: GradeDoExterior, centro: Celula, protegidas: Set<number>): { x: number; y: number; raio: number } {
  for (let dy = -RAIO_ABRIGO; dy <= RAIO_ABRIGO; dy++) {
    for (let dx = -RAIO_ABRIGO; dx <= RAIO_ABRIGO; dx++) {
      const x = centro.x + dx;
      const y = centro.y + dy;
      if (!g.interna(x, y)) continue;
      g.por(x, y, '.');
      protegidas.add(y * g.n + x);
    }
  }
  return { x: centro.x, y: centro.y, raio: RAIO_ABRIGO };
}

/** O nível do monstro: com faixas, sorteia uma delas e o nível dentro dela; sem, a faixa da região (como antes). */
export function nivelDoMonstro(rng: EstadoRng, regiao: RegiaoDoMundo): number {
  const faixa = regiao.faixas?.length ? escolher(rng, regiao.faixas) : regiao.nivel;
  return inteiro(rng, faixa[0], faixa[1]);
}

const chebyshev = (a: Celula, b: Celula): number => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

/** Os andarilhos da região, cada um numa célula de chão ao lado de uma estrada. */
export function andarilhosDaRegiao(g: GradeDoExterior, regiao: RegiaoDoMundo, ok: (c: Celula) => boolean, ocupadas: Celula[]): PontoDoExterior[] {
  const lista = regiao.andarilhos ?? [];
  if (lista.length === 0) return [];
  const rng = criarRng(regiao.semente + SEMENTE_ANDARILHOS);
  const estradas: Celula[] = [];
  for (let y = 2; y < g.n - 2; y++) for (let x = 2; x < g.n - 2; x++) if (g.em(x, y) === '=') estradas.push({ x, y });
  const pontos: PontoDoExterior[] = [];
  for (const a of lista) {
    for (let t = 0; t < 120 && estradas.length > 0; t++) {
      const e = escolher(rng, estradas);
      const lado = escolher(rng, [[2, 0], [-2, 0], [0, 2], [0, -2]] as const);
      const c = { x: e.x + lado[0], y: e.y + lado[1] };
      if (!ANDA.has(g.em(c.x, c.y)) || g.em(c.x, c.y) === '=' || !ok(c) || ocupadas.some((o) => chebyshev(o, c) < 4)) continue;
      // Um pouco de sorte a mais para espalhar: metade das tentativas exige distância do centro.
      if (t < 60 && aleatorio(rng) < 0.3 && chebyshev(c, { x: g.n / 2, y: g.n / 2 }) < g.n / 6) continue;
      ocupadas.push(c);
      pontos.push({ tipo: 'andarilho', id: a.id, aparencia: a.aparencia, x: c.x, y: c.y });
      break;
    }
  }
  return pontos;
}

/** O caminho mais curto (4 vizinhos, só por células andáveis) de `de` até `para`; vazio se não houver. */
function caminho(g: GradeDoExterior, de: Celula, para: Celula): Celula[] {
  const n = g.n;
  const veio = new Int32Array(n * n).fill(-1);
  const ini = de.y * n + de.x;
  const fim = para.y * n + para.x;
  if (!ANDA.has(g.em(de.x, de.y)) || !ANDA.has(g.em(para.x, para.y))) return [];
  veio[ini] = ini;
  const fila = [ini];
  for (let i = 0; i < fila.length && veio[fim] === -1; i++) {
    const k = fila[i] as number;
    const x = k % n;
    const y = Math.floor(k / n);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = x + dx;
      const ny = y + dy;
      const nk = ny * n + nx;
      if (nx < 1 || ny < 1 || nx >= n - 1 || ny >= n - 1 || veio[nk] !== -1 || !ANDA.has(g.em(nx, ny))) continue;
      veio[nk] = k;
      fila.push(nk);
    }
  }
  if (veio[fim] === -1) return [];
  const rota: Celula[] = [];
  for (let k = fim; k !== ini; k = veio[k] as number) rota.push({ x: k % n, y: Math.floor(k / n) });
  rota.push(de);
  return rota.reverse();
}

/** As rotas dos mercadores errantes: de uma passagem (cada um numa) até perto do centro, pelo caminho andável. */
export function rotasDosErrantes(g: GradeDoExterior, regiao: RegiaoDoMundo, centro: Celula, entradas: readonly Celula[]): Celula[][] {
  const quantos = regiao.mercadoresErrantes ?? 0;
  if (quantos === 0 || entradas.length === 0) return [];
  const destino = { x: centro.x + 2, y: centro.y + (regiao.vila ? regiao.vila.raio + 2 : 2) };
  const rotas: Celula[][] = [];
  for (let i = 0; i < quantos; i++) {
    const de = entradas[i % entradas.length] as Celula;
    const r = caminho(g, de, ANDA.has(g.em(destino.x, destino.y)) ? destino : centro);
    if (r.length > 4) rotas.push(r);
  }
  return rotas;
}
