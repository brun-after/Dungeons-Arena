// As estradas do exterior pelo terreno (marco 43, 15/11/2026, D-177). Antes eram um L reto de 2 células que cortava
// rocha e água; agora a estrada busca o caminho mais barato pela geografia (world/geografia.ts): o plano custa pouco,
// a subida custa pelo desnível, a mata e os rochedos custam a clareira, a água custa a ponte e a montanha quase
// proíbe (só passa onde não há outro jeito). A estrada já aberta sai barata (as estradas se juntam em vez de correrem
// lado a lado). Puro e determinístico (sem sorteio).

import type { Celula } from '../core/comandos';
import { OBSTACULO } from './geografia';

export interface TerrenoDaEstrada {
  n: number;
  em: (x: number, y: number) => string;
  por: (x: number, y: number, ch: string) => void;
  alturas: Uint8Array;
  obstaculos: Uint8Array;
  protegidas: ReadonlySet<number>;
}

const VIZ: readonly (readonly [number, number])[] = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/** O custo de pisar na célula vindo de `de` (Infinity: não passa). */
function custo(t: TerrenoDaEstrada, de: number, k: number, x: number, y: number): number {
  if (x < 1 || y < 1 || x >= t.n - 2 || y >= t.n - 2) return Infinity;
  const ch = t.em(x, y);
  if (ch === '=') return 0.6;
  // A célula protegida: o chão dela (a praça, o abrigo) se anda; o muro, a casa e a fachada, não.
  if (t.protegidas.has(k)) return ch === '.' || ch === ',' ? 1 : Infinity;
  const dh = Math.abs((t.alturas[k] ?? 0) - (t.alturas[de] ?? 0));
  let c = 1 + dh * dh * 1.5;
  if (ch === '~') c += 8;
  const o = t.obstaculos[k] ?? 0;
  if (o === OBSTACULO.arvore) c += 2.5;
  else if (o === OBSTACULO.rochedo) c += 5;
  else if (o === OBSTACULO.montanha) c += 40;
  else if (ch === '#') c += 30;
  return c;
}

/** O caminho mais barato de `de` a `para` (A* com heap binário); vazio se não houver. */
export function caminhoDaEstrada(t: TerrenoDaEstrada, de: Celula, para: Celula): Celula[] {
  const n = t.n;
  const total = n * n;
  const g = new Float64Array(total).fill(Infinity);
  const veio = new Int32Array(total).fill(-1);
  const fechado = new Uint8Array(total);
  const heap: number[] = [];
  const f = new Float64Array(total);
  const subir = (i: number) => {
    while (i > 0) {
      const pai = (i - 1) >> 1;
      if ((f[heap[pai] as number] ?? 0) <= (f[heap[i] as number] ?? 0)) break;
      [heap[pai], heap[i]] = [heap[i] as number, heap[pai] as number];
      i = pai;
    }
  };
  const descer = (i: number) => {
    for (;;) {
      const a = i * 2 + 1;
      const b = a + 1;
      let m = i;
      if (a < heap.length && (f[heap[a] as number] ?? 0) < (f[heap[m] as number] ?? 0)) m = a;
      if (b < heap.length && (f[heap[b] as number] ?? 0) < (f[heap[m] as number] ?? 0)) m = b;
      if (m === i) break;
      [heap[m], heap[i]] = [heap[i] as number, heap[m] as number];
      i = m;
    }
  };
  const h = (k: number) => {
    const x = k % n;
    const y = (k - x) / n;
    return (Math.abs(x - para.x) + Math.abs(y - para.y)) * 0.6;
  };
  const inicio = de.y * n + de.x;
  const fim = para.y * n + para.x;
  g[inicio] = 0;
  f[inicio] = h(inicio);
  heap.push(inicio);
  while (heap.length > 0) {
    const k = heap[0] as number;
    const ultimo = heap.pop() as number;
    if (heap.length > 0) {
      heap[0] = ultimo;
      descer(0);
    }
    if (fechado[k]) continue;
    fechado[k] = 1;
    if (k === fim) break;
    const x = k % n;
    const y = (k - x) / n;
    for (const [dx, dy] of VIZ) {
      const nx = x + dx;
      const ny = y + dy;
      const nk = ny * n + nx;
      if (nx < 0 || ny < 0 || nx >= n || ny >= n || fechado[nk]) continue;
      const c = nk === fim ? 1 : custo(t, k, nk, nx, ny);
      if (!Number.isFinite(c)) continue;
      const novo = (g[k] ?? 0) + c;
      if (novo >= (g[nk] ?? Infinity)) continue;
      g[nk] = novo;
      veio[nk] = k;
      f[nk] = novo + h(nk);
      heap.push(nk);
      subir(heap.length - 1);
    }
  }
  if (veio[fim] === -1 && fim !== inicio) return [];
  const caminho: Celula[] = [];
  for (let k = fim; k !== -1; k = veio[k] ?? -1) {
    const x = k % n;
    caminho.push({ x, y: (k - x) / n });
    if (k === inicio) break;
  }
  return caminho.reverse();
}

/**
 * Abre a estrada de 2 células de largura pelo caminho do terreno; devolve se achou caminho. Com `trilha` (o chão a
 * pôr), abre só a picada de 1 célula até o lugar escondido, sem estrada (quem procura acha; o mapa não mostra).
 */
export function abrirEstrada(t: TerrenoDaEstrada, de: Celula, para: Celula, trilha: string | null = null): boolean {
  const caminho = caminhoDaEstrada(t, de, para);
  if (caminho.length === 0) return false;
  const pincel: readonly (readonly [number, number])[] = trilha ? [[0, 0]] : [[0, 0], [1, 0], [0, 1], [1, 1]];
  for (const c of caminho) {
    if (trilha) {
      if (!t.protegidas.has(c.y * t.n + c.x) && t.em(c.x, c.y) !== '=' && t.em(c.x, c.y) !== '~') t.por(c.x, c.y, trilha);
      continue;
    }
    for (const [dx, dy] of pincel) {
      const x = c.x + dx;
      const y = c.y + dy;
      const k = y * t.n + x;
      if (x < 1 || y < 1 || x >= t.n - 1 || y >= t.n - 1 || t.protegidas.has(k)) continue;
      t.por(x, y, '=');
    }
  }
  return true;
}
