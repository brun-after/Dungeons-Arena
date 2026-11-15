// O relevo do exterior do Mundo (marco 42, 15/11/2026, D-176): a altura de cada célula, com RNG próprio (o resto da
// região sai do mesmo sorteio de antes). Por bioma: um campo suave que sobe aos poucos (as encostas) e platôs que
// saltam de uma vez (os muros baixos e altos); os rochedos ficam no alto (a montanha, que ninguém passa). A vila, o
// abrigo, as casas, as estruturas e as passagens ficam planos; as estradas viram rampas que sobem um nível por vez;
// as cavernas e as minas se abrem no penhasco de um morro.
// Por fim, tudo o que se alcançava a pé continua alcançável: onde o muro isolaria um pedaço, abre-se uma rampa. Puro.

import type { Celula } from '../core/comandos';
import { aleatorio, criarRng, type EstadoRng } from '../core/rng';
import type { Bioma } from '../mundo/reino';

const SEMENTE_RELEVO = 42_211;
const ALTURA_MAX = 12;

/** O que cada bioma faz com o chão: a amplitude do campo suave e a altura e a frequência dos platôs. */
interface PerfilDeRelevo {
  /** Até quantos níveis o campo suave sobe. */
  suave: number;
  /** Quanto o platô salta (3 = muro baixo, 4 a 6 = muro alto). */
  plato: number;
  /** Acima deste valor do ruído (0 a 1), platô. */
  limiarPlato: number;
}

const PERFIS: Readonly<Record<Bioma, PerfilDeRelevo>> = {
  campo: { suave: 3, plato: 3, limiarPlato: 0.74 },
  floresta: { suave: 3, plato: 3, limiarPlato: 0.7 },
  pantano: { suave: 1, plato: 3, limiarPlato: 0.86 },
  colinas: { suave: 4, plato: 4, limiarPlato: 0.62 },
  ruinas: { suave: 2, plato: 4, limiarPlato: 0.68 },
  neve: { suave: 4, plato: 5, limiarPlato: 0.64 },
  deserto: { suave: 3, plato: 3, limiarPlato: 0.8 },
};

function ruido(rng: EstadoRng, tamanho: number, passo: number): (x: number, y: number) => number {
  const n = Math.ceil(tamanho / passo) + 2;
  const grade = Array.from({ length: n * n }, () => aleatorio(rng));
  const v = (gx: number, gy: number) => grade[Math.min(n - 1, gy) * n + Math.min(n - 1, gx)] ?? 0;
  const suave = (t: number) => t * t * (3 - 2 * t);
  return (x, y) => {
    const gx = Math.floor(x / passo);
    const gy = Math.floor(y / passo);
    const tx = suave((x % passo) / passo);
    const ty = suave((y % passo) / passo);
    const a = v(gx, gy) + (v(gx + 1, gy) - v(gx, gy)) * tx;
    const b = v(gx, gy + 1) + (v(gx + 1, gy + 1) - v(gx, gy + 1)) * tx;
    return a + (b - a) * ty;
  };
}

export interface EntradaDoRelevo {
  n: number;
  semente: number;
  bioma: Bioma;
  /** O caractere da célula ('#' rocha, '~' água, '=' estrada, 'F' fachada; o resto é chão). */
  em: (x: number, y: number) => string;
  /** As áreas que ficam planas na altura 0 (a vila, o abrigo, as passagens). */
  planas: readonly { x: number; y: number; raio: number }[];
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

export function gerarRelevo(e: EntradaDoRelevo): Uint8Array {
  const { n } = e;
  const perfil = PERFIS[e.bioma];
  const rng = criarRng(e.semente + SEMENTE_RELEVO);
  const campo = ruido(rng, n, 16);
  const platos = ruido(rng, n, 12);
  const h = new Uint8Array(n * n);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const base = Math.floor(campo(x, y) * (perfil.suave + 0.999));
      const plato = platos(x, y) > perfil.limiarPlato ? perfil.plato : 0;
      h[y * n + x] = Math.min(ALTURA_MAX - 5, base + plato);
    }
  }
  // A água fica no fundo do vale em volta; o rochedo, acima de tudo em volta (a montanha).
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
  for (const p of e.planas) {
    for (let y = Math.max(0, Math.floor(p.y - p.raio)); y <= Math.min(n - 1, Math.ceil(p.y + p.raio)); y++) {
      for (let x = Math.max(0, Math.floor(p.x - p.raio)); x <= Math.min(n - 1, Math.ceil(p.x + p.raio)); x++) {
        if (Math.hypot(x - p.x, y - p.y) <= p.raio) h[y * n + x] = 0;
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
  // Os rochedos por último: acima do chão em volta (a montanha; não se anda nem se voa por cima).
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (e.em(x, y) !== '#') continue;
      let m = 0;
      vizinhos(x, y, (a) => { m = Math.max(m, a); });
      h[y * n + x] = Math.min(ALTURA_MAX, m + 3);
    }
  }
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
      if (alvo > (h[y * n + x] ?? 0)) h[y * n + x] = Math.min(ALTURA_MAX - 3, alvo);
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
      // As pontas da estrada que tocam o plano (a vila, as passagens) começam a busca.
      if (e.em(x, y) === '=' && (h[y * n + x] ?? 0) === 0) {
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
