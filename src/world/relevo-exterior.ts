// O relevo do exterior do Mundo (marco 42, 15/11/2026, D-176): a altura de cada célula. Marco 43 (15/11/2026, D-177):
// a altura de partida vem da geografia (world/geografia.ts: o chão, as serras, os platôs e os vales); aqui ela se
// acomoda ao que foi construído por cima. A vila, o
// abrigo, as casas, as estruturas e as passagens ficam planos; as estradas viram rampas que sobem um nível por vez;
// as cavernas e as minas se abrem no penhasco de um morro.
// Por fim, tudo o que se alcançava a pé continua alcançável: onde o muro isolaria um pedaço, abre-se uma rampa. Puro.

import type { Celula } from '../core/comandos';

const ALTURA_MAX = 18;

export interface EntradaDoRelevo {
  n: number;
  /** A altura de partida (world/geografia.ts). */
  base: Uint8Array;
  /** O caractere da célula ('#' rocha, '~' água, '=' estrada, 'F' fachada; o resto é chão). */
  em: (x: number, y: number) => string;
  /** As áreas que ficam planas (a vila, o abrigo, as chegadas): na altura do centro delas, ou em `nivel`. */
  planas: readonly { x: number; y: number; raio: number; nivel?: number }[];
  /** Os retângulos que ficam planos na altura do chão debaixo deles (as casas, as estruturas). */
  retangulos: readonly { x: number; y: number; largura: number; altura: number }[];
  /** As cavernas e as minas: a fachada fica cortada numa encosta (o morro atrás e dos lados, a boca no nível de baixo). */
  encostas: readonly { x: number; y: number; largura: number; altura: number }[];
  /** Quanto o morro da caverna sobe acima da boca (um muro alto: de frente, ninguém sobe a pé nem saltando). */
  alturaDoMorro: number;
  /** As células de passagem (planas, altura 0, iguais dos dois lados). */
  passagem: (c: Celula) => boolean;
  /** De onde se anda (as chegadas): tudo o que se alcançava daqui continua alcançável. */
  origens: readonly Celula[];
  encostaMax: number;
}

const ANDA = new Set([',', '.', '=']);
const anda = (ch: string) => ANDA.has(ch) || ch === '~';
const VIZ: readonly (readonly [number, number])[] = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/** A largura da saia de encosta em volta das áreas planas (marco 43, D-177). */
const SAIA = 10;

export function gerarRelevo(e: EntradaDoRelevo): Uint8Array {
  const { n } = e;
  const h = Uint8Array.from(e.base);
  // A água fica no fundo do vale em volta.
  const vizinhos = (x: number, y: number, f: (a: number) => void) => {
    for (const [dx, dy] of VIZ) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < n && ny < n) f(h[ny * n + nx] ?? 0);
    }
  };
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const ch = e.em(x, y);
      if (ch === '~') {
        let m = h[y * n + x] ?? 0;
        vizinhos(x, y, (a) => { m = Math.min(m, a); });
        h[y * n + x] = m;
      }
    }
  }
  // As áreas planas (vila, abrigo, passagens) e os retângulos (casas e estruturas) na altura de baixo deles.
  // Marco 43 (15/11/2026, D-177): em volta da área plana, uma saia de encosta (um nível por célula) que casa o platô
  // com o terreno, em vez de um degrau seco: a vila se assenta no chão, não num pedestal.
  for (const p of e.planas) {
    const nivel = p.nivel ?? (e.base[Math.round(p.y) * n + Math.round(p.x)] ?? 0);
    const fora = p.raio + SAIA;
    for (let y = Math.max(0, Math.floor(p.y - fora)); y <= Math.min(n - 1, Math.ceil(p.y + fora)); y++) {
      for (let x = Math.max(0, Math.floor(p.x - fora)); x <= Math.min(n - 1, Math.ceil(p.x + fora)); x++) {
        const d = Math.hypot(x - p.x, y - p.y);
        if (d > fora) continue;
        const k = y * n + x;
        const lim = Math.max(0, Math.ceil(d - p.raio));
        h[k] = nivel + Math.max(-lim, Math.min(lim, (h[k] ?? 0) - nivel));
      }
    }
  }
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (e.passagem({ x, y })) h[y * n + x] = 0;
  for (const r of e.retangulos) {
    const cx = Math.min(n - 1, Math.max(0, Math.floor(r.x + r.largura / 2)));
    const cy = Math.min(n - 1, Math.max(0, Math.floor(r.y + r.altura / 2)));
    const alvo = h[cy * n + cx] ?? 0;
    for (let y = Math.max(0, r.y - 2); y < Math.min(n, r.y + r.altura + 2); y++) for (let x = Math.max(0, r.x - 2); x < Math.min(n, r.x + r.largura + 2); x++) h[y * n + x] = alvo;
  }
  rampasNasEstradas(e, h);
  // Depois das rampas (a frente da porta já tem a altura da estrada que chega nela).
  for (const c of e.encostas) morroDaCaverna(e, h, c);
  abrirRampas(e, h);
  return h;
}

/**
 * Marco 42 (15/11/2026, D-176): o morro da caverna. A fachada sobe `alturaDoMorro` acima da boca e o morro desce um
 * nível por célula para trás e para os lados (encosta que se sobe pelos fundos); na frente (da linha da porta para o
 * sul) o chão fica no nível da boca, e a borda do morro vira o penhasco onde a caverna se abre.
 */
function morroDaCaverna(e: EntradaDoRelevo, h: Uint8Array, c: EntradaDoRelevo['encostas'][number]): void {
  const { n } = e;
  const fundo = c.y + c.altura;
  const bx = Math.min(n - 1, Math.max(0, c.x + Math.floor(c.largura / 2)));
  const by = Math.min(n - 1, Math.max(0, fundo));
  const boca = h[by * n + bx] ?? 0;
  const alcance = e.alturaDoMorro;
  for (let y = Math.max(0, c.y - alcance); y < Math.min(n, fundo); y++) {
    for (let x = Math.max(0, c.x - alcance); x < Math.min(n, c.x + c.largura + alcance); x++) {
      const dx = x < c.x ? c.x - x : x >= c.x + c.largura ? x - (c.x + c.largura - 1) : 0;
      const dy = y < c.y ? c.y - y : 0;
      const alvo = boca + e.alturaDoMorro - Math.max(dx, dy);
      if (alvo > (h[y * n + x] ?? 0)) h[y * n + x] = Math.min(ALTURA_MAX, alvo);
    }
  }
  // A porta (a última linha da fachada) fica no nível da boca: entra-se andando.
  if (by > 0) h[(by - 1) * n + bx] = boca;
}

/** As estradas sobem no máximo um nível por célula: percorre a estrada desde as origens e acomoda cada trecho. */
function rampasNasEstradas(e: EntradaDoRelevo, h: Uint8Array): void {
  const { n } = e;
  const visto = new Uint8Array(n * n);
  const fila: number[] = [];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      // Marco 43 (D-177): a estrada nas áreas planas (a vila, o abrigo, as chegadas, as passagens) começa a busca.
      const plana = e.passagem({ x, y }) || e.planas.some((p) => Math.hypot(x - p.x, y - p.y) <= p.raio);
      if (e.em(x, y) === '=' && plana) {
        visto[y * n + x] = 1;
        fila.push(y * n + x);
      }
    }
  }
  for (let i = 0; i < fila.length; i++) {
    const k = fila[i] as number;
    const x = k % n;
    const y = (k - x) / n;
    const hk = h[k] ?? 0;
    for (const [dx, dy] of VIZ) {
      const nx = x + dx;
      const ny = y + dy;
      const nk = ny * n + nx;
      if (nx < 0 || ny < 0 || nx >= n || ny >= n || visto[nk] || e.em(nx, ny) !== '=') continue;
      visto[nk] = 1;
      h[nk] = Math.max(hk - 1, Math.min(hk + 1, h[nk] ?? 0));
      fila.push(nk);
    }
  }
}

/**
 * O que se alcançava a pé continua alcançável: busca desde as origens pelo desnível que se anda; quando a busca acaba
 * e ainda há chão andável encostado no alcançado (atrás de um muro), a primeira célula desse muro vira rampa (fica a
 * `encostaMax` de quem a alcança) e a busca segue dali. A ordem é fixa (determinística).
 */
function abrirRampas(e: EntradaDoRelevo, h: Uint8Array): void {
  const { n } = e;
  const visto = new Uint8Array(n * n);
  const fila: number[] = [];
  const pendentes: [number, number][] = [];
  for (const o of e.origens) {
    const k = o.y * n + o.x;
    if (!visto[k] && anda(e.em(o.x, o.y))) {
      visto[k] = 1;
      fila.push(k);
    }
  }
  let i = 0;
  let p = 0;
  for (;;) {
    for (; i < fila.length; i++) {
      const k = fila[i] as number;
      const x = k % n;
      const y = (k - x) / n;
      const hk = h[k] ?? 0;
      for (const [dx, dy] of VIZ) {
        const nx = x + dx;
        const ny = y + dy;
        const nk = ny * n + nx;
        if (nx < 0 || ny < 0 || nx >= n || ny >= n || visto[nk] || !anda(e.em(nx, ny))) continue;
        if (Math.abs((h[nk] ?? 0) - hk) <= e.encostaMax) {
          visto[nk] = 1;
          fila.push(nk);
        } else pendentes.push([nk, k]);
      }
    }
    // A busca acabou: abre a rampa no primeiro muro pendente ainda não alcançado.
    let aberta = false;
    for (; p < pendentes.length && !aberta; p++) {
      const [nk, de] = pendentes[p] as [number, number];
      if (visto[nk]) continue;
      const hd = h[de] ?? 0;
      h[nk] = Math.max(hd - e.encostaMax, Math.min(hd + e.encostaMax, h[nk] ?? 0));
      visto[nk] = 1;
      fila.push(nk);
      aberta = true;
    }
    if (!aberta) return;
  }
}
