// A geografia do exterior do Mundo (marco 43, 15/11/2026, D-177). Antes, a água e os obstáculos saíam de dois ruídos
// soltos e o relevo vinha depois, por cima; agora a altura vem primeiro e o resto sai dela, como numa paisagem de
// verdade:
// - o chão ondula pelo ruído fractal do bioma (colinas e neve sobem mais; o pântano quase não sobe);
// - as serras: cristas de ruído e uma faixa de montanha nas bordas da região (as passagens a cortam depois); o que
//   passa do limite vira montanha (rocha que ninguém atravessa, desenhada como encosta de pedra);
// - os platôs: em manchas, a altura anda em degraus de 3 ou 4 níveis, e a borda vira penhasco;
// - a água fica no fundo dos vales (lagos e brejos na altura do vale);
// - a mata: mais densa nas manchas de floresta, nas matas fechadas e na meia encosta; nunca na água nem na montanha;
// - os rochedos: soltos, mais perto do pé da montanha e nas encostas.
// RNG próprio (o resto da região sorteia igual). Puro.

import { aleatorio, criarRng, type EstadoRng } from '../core/rng';
import type { Bioma } from '../mundo/reino';
import { passavel, type Fase } from './fase';
import { aoLongoDoLado, costuraPerto, distanciaAoLado, FAIXA_DA_COSTURA, type LadoAberto, type LadoDoRecorte, type Recorte } from './costura';

const LADOS_DO_RECORTE: readonly LadoDoRecorte[] = ['norte', 'sul', 'leste', 'oeste'];

/** O código do obstáculo natural de cada célula (0 = nenhum; as paredes construídas também ficam 0). */
// 16/11/2026: o arbusto (5) é a árvore baixa da borda da mata: desenhado, mas sem tronco (world/cenario-baixo.ts).
export const OBSTACULO = { nenhum: 0, montanha: 1, rochedo: 2, arvore: 3, objeto: 4, arbusto: 5 } as const;
export type CodigoObstaculo = (typeof OBSTACULO)[keyof typeof OBSTACULO];

/**
 * Marco 53 (22/11/2026, D-203): a célula passável e sem nada de pé em cima (árvore, rochedo, arbusto, peça do
 * cenário): onde um item pode cair e uma armadilha pode ser posta sem sumir embaixo do desenho.
 */
export function chaoAVista(fase: Fase, x: number, y: number): boolean {
  if (!passavel(fase, x, y)) return false;
  const o = fase.obstaculos;
  return !o || o[y * fase.largura + x] === OBSTACULO.nenhum;
}

const SEMENTE_GEOGRAFIA = 51_437;
/** A altura máxima da montanha (níveis). */
export const ALTURA_MONTANHA_MAX = 18;

interface PerfilGeografico {
  /** Até quantos níveis o chão ondula. */
  suave: number;
  /** A força das serras no meio da região (0 a 1). */
  serra: number;
  /** A fração do chão em platôs de degrau. */
  plato: number;
  /** O degrau do platô (3 = muro baixo; 4 = muro alto). */
  degrau: number;
  /** A fração mais baixa do ruído que vira água. */
  agua: number;
  /** A densidade da mata (0 a 1) e a dos rochedos soltos. */
  mata: number;
  rochedos: number;
}

const PERFIS: Readonly<Record<Bioma, PerfilGeografico>> = {
  campo: { suave: 4, serra: 0.15, plato: 0.2, degrau: 3, agua: 0.12, mata: 0.16, rochedos: 0.005 },
  floresta: { suave: 4, serra: 0.2, plato: 0.15, degrau: 3, agua: 0.08, mata: 0.5, rochedos: 0.012 },
  pantano: { suave: 1.5, serra: 0.05, plato: 0.05, degrau: 3, agua: 0.34, mata: 0.22, rochedos: 0.004 },
  colinas: { suave: 6, serra: 0.35, plato: 0.4, degrau: 4, agua: 0.05, mata: 0.1, rochedos: 0.03 },
  ruinas: { suave: 3, serra: 0.2, plato: 0.3, degrau: 3, agua: 0.04, mata: 0.08, rochedos: 0.025 },
  neve: { suave: 6, serra: 0.5, plato: 0.35, degrau: 4, agua: 0.06, mata: 0.22, rochedos: 0.03 },
  deserto: { suave: 4, serra: 0.25, plato: 0.45, degrau: 4, agua: 0.012, mata: 0.015, rochedos: 0.02 },
};

const VIZ8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]] as const;

/** Ruído de valor suave (0 a 1) numa grade de `passo` células. */
function ruido(rng: EstadoRng, n: number, passo: number): (x: number, y: number) => number {
  const lado = Math.ceil(n / passo) + 2;
  const grade = Float64Array.from({ length: lado * lado }, () => aleatorio(rng));
  const ultimo = lado - 1;
  // Marco 43 (D-177): sem closures por amostra (a geografia chama isto ~15 vezes por célula).
  return (x, y) => {
    const gx = Math.floor(x / passo);
    const gy = Math.floor(y / passo);
    let tx = (x % passo) / passo;
    let ty = (y % passo) / passo;
    tx = tx * tx * (3 - 2 * tx);
    ty = ty * ty * (3 - 2 * ty);
    const x0 = Math.min(ultimo, gx);
    const x1 = Math.min(ultimo, gx + 1);
    const y0 = Math.min(ultimo, gy) * lado;
    const y1 = Math.min(ultimo, gy + 1) * lado;
    const v00 = grade[y0 + x0] ?? 0;
    const v10 = grade[y0 + x1] ?? 0;
    const v01 = grade[y1 + x0] ?? 0;
    const v11 = grade[y1 + x1] ?? 0;
    const a = v00 + (v10 - v00) * tx;
    const b = v01 + (v11 - v01) * tx;
    return a + (b - a) * ty;
  };
}

/** Fractal de três oitavas (0 a 1). */
function fractal(rng: EstadoRng, n: number, passo: number): (x: number, y: number) => number {
  const a = ruido(rng, n, passo);
  const b = ruido(rng, n, Math.max(2, passo / 2));
  const c = ruido(rng, n, Math.max(2, passo / 4));
  return (x, y) => (a(x, y) * 0.6 + b(x, y) * 0.28 + c(x, y) * 0.12);
}

const suaviza = (a: number, b: number, t: number) => {
  const u = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return u * u * (3 - 2 * u);
};

/** Hash estável da célula (0 a 1), para a mata e os rochedos não dependerem da ordem do sorteio. */
function hashCelula(x: number, y: number, s: number): number {
  let h = (Math.imul(x, 374_761_393) + Math.imul(y, 668_265_263) + Math.imul(s, 1_013_904_223)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1_274_126_177);
  return ((h ^ (h >>> 16)) >>> 0) / 4_294_967_296;
}

export interface EntradaGeografia {
  n: number;
  semente: number;
  bioma: Bioma;
  /** As matas fechadas (a mata dobra). */
  matas: readonly { x: number; y: number; raio: number }[];
  /**
   * Marco 54 (26/11/2026, D-207): no Mundo contínuo, o retângulo da região dentro do quadrado (o resto é cortado) e os
   * lados dele que são costura aberta. A faixa de montanha só fica nos lados fechados; nos abertos, o chão é puxado
   * para o perfil da costura (world/costura.ts), o mesmo que a vizinha usa.
   */
  recorte?: Recorte;
  abertos?: readonly LadoAberto[];
}

export interface Geografia {
  /** A altura de cada célula (níveis inteiros). */
  alturas: Uint8Array;
  /** O obstáculo natural de cada célula (OBSTACULO). */
  obstaculos: Uint8Array;
  /** A água (lago, brejo). */
  agua: Uint8Array;
}

export function gerarGeografia(e: EntradaGeografia): Geografia {
  const { n } = e;
  const p = PERFIS[e.bioma];
  const rng = criarRng(e.semente + SEMENTE_GEOGRAFIA);
  const chao = fractal(rng, n, 40);
  const crista = ruido(rng, n, 36);
  const macro = ruido(rng, n, 64);
  const zonaPlato = ruido(rng, n, 28);
  const mancha = fractal(rng, n, 24);
  const aspereza = fractal(rng, n, 7);
  const borda = 14;
  const total = n * n;
  const { recorte, abertos = [] } = e;
  const fechados = recorte ? LADOS_DO_RECORTE.filter((l) => !abertos.some((a) => a.lado === l)) : [];
  /** A distância à borda que tem montanha (no recorte, só os lados fechados). */
  const aBorda = (x: number, y: number) => (recorte ? Math.min(Infinity, ...fechados.map((l) => Math.max(0, distanciaAoLado(recorte, l, x, y)))) : Math.min(x, y, n - 1 - x, n - 1 - y));
  // Marco 54 (D-207): o peso (0 a 1) e a altura do perfil da costura em cada célula da faixa.
  const pesoCostura = abertos.length ? new Float32Array(total) : null;
  const alvoCostura = abertos.length ? new Uint8Array(total) : null;
  // 1ª passada: o chão (normalizado de 0 a 1 na região) e a força da montanha.
  const base = new Float32Array(total);
  const montanha = new Float32Array(total);
  let bMin = Infinity;
  let bMax = -Infinity;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const k = y * n + x;
      const b = chao(x, y);
      base[k] = b;
      bMin = Math.min(bMin, b);
      bMax = Math.max(bMax, b);
      // A crista: o ruído dobrado (alto perto de 0,5) e a macro decidindo onde a serra existe.
      const dobra = 1 - Math.abs(crista(x, y) * 2 - 1);
      const serra = p.serra * suaviza(0.5, 0.8, macro(x, y)) * suaviza(0.55, 0.95, dobra);
      const naBorda = 1 - suaviza(0, borda, aBorda(x, y));
      montanha[k] = Math.max(serra * 1.8, naBorda * (0.8 + 0.4 * crista(x * 2.5, y * 2.5)));
      const c = recorte && pesoCostura && alvoCostura ? costuraPerto(recorte, abertos, x, y) : null;
      if (c && pesoCostura && alvoCostura) {
        const w = 1 - suaviza(0, FAIXA_DA_COSTURA, c.d);
        const ponto = c.lado.em(aoLongoDoLado(c.lado.lado, x, y));
        pesoCostura[k] = w;
        alvoCostura[k] = ponto.altura;
        // A serra da costura passa de um lado ao outro; fora dela, a serra de dentro some perto da borda.
        montanha[k] = ponto.serra ? Math.max(montanha[k] ?? 0, w * (0.8 + 0.4 * crista(x * 2.5, y * 2.5))) : (montanha[k] ?? 0) * (1 - w);
      }
    }
  }
  const faixa = Math.max(1e-6, bMax - bMin);
  for (let k = 0; k < total; k++) base[k] = ((base[k] ?? 0) - bMin) / faixa;
  // O limiar da água: a fração mais baixa do chão fora da montanha.
  const baixos = Float32Array.from(base.filter((_, k) => (montanha[k] ?? 0) < 0.08)).sort();
  const limiarAgua = baixos[Math.floor(baixos.length * p.agua)] ?? 0;
  const manchas = new Float32Array(total);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) manchas[y * n + x] = mancha(x, y);
  const ordenadas = Float32Array.from(manchas).sort();
  // A mancha de floresta cobre a fração do bioma (a mais alta do ruído).
  const limiarMata = ordenadas[Math.floor(ordenadas.length * (1 - Math.min(0.9, p.mata * 1.4)))] ?? 1;
  const alturas = new Uint8Array(total);
  const obstaculos = new Uint8Array(total);
  const agua = new Uint8Array(total);
  const nivelAgua = Math.max(0, Math.round(limiarAgua * p.suave));
  const limiteMontanha = Math.ceil(p.suave) + 5;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const k = y * n + x;
      const b0 = base[k] ?? 0;
      const m = montanha[k] ?? 0;
      // Marco 43 (D-177): a serra é áspera (a altura oscila célula a célula, penhascos de alturas variadas), não uma
      // escada de degraus iguais; o platô em degraus fica no chão de fora da serra.
      let h = b0 * p.suave + m * ALTURA_MONTANHA_MAX + m * (aspereza(x, y) - 0.5) * 7;
      const w = pesoCostura?.[k] ?? 0;
      if (m < 0.15 && w < 0.3 && zonaPlato(x, y) > 1 - p.plato) h = Math.round(h / p.degrau) * p.degrau;
      // Marco 54 (D-207): na faixa da costura, a altura vai até a do perfil (na borda, a mesma dos dois lados).
      if (w > 0 && m < 0.25) h = h * (1 - w) + w * (alvoCostura?.[k] ?? 0);
      const hi = Math.max(0, Math.min(ALTURA_MONTANHA_MAX, Math.floor(h)));
      alturas[k] = hi;
      if (hi >= limiteMontanha && m > 0.25) {
        obstaculos[k] = OBSTACULO.montanha;
        continue;
      }
      if (b0 <= limiarAgua && m < 0.08 && w < 0.4) {
        agua[k] = 1;
        alturas[k] = nivelAgua;
        continue;
      }
      // A mata: a mancha de floresta, a mata fechada e a meia encosta; fora da mancha, árvores soltas.
      const naMata = e.matas.some((q) => Math.hypot(x - q.x, y - q.y) <= q.raio);
      const dentro = suaviza(limiarMata - 0.04, limiarMata + 0.06, manchas[k] ?? 0);
      const densidade = Math.min(0.8, 0.02 + dentro * 0.55 + (naMata ? 0.35 : 0)) * (m > 0.15 ? 0.4 : 1);
      if (hashCelula(x, y, e.semente) < densidade) {
        obstaculos[k] = OBSTACULO.arvore;
        continue;
      }
    }
  }
  // Marco 44 (15/11/2026, D-178): as árvores nunca encostam uma na outra (sempre uma célula livre entre elas): a mata
  // fica atravessável, e o tronco é o único obstáculo (world/troncos.ts).
  for (let y = 1; y < n - 1; y++) {
    for (let x = 1; x < n - 1; x++) {
      const k = y * n + x;
      if (obstaculos[k] !== OBSTACULO.arvore) continue;
      const antes = [k - 1, k - n - 1, k - n, k - n + 1];
      if (antes.some((j) => obstaculos[j] === OBSTACULO.arvore)) obstaculos[k] = OBSTACULO.nenhum;
    }
  }
  // Os rochedos têm motivo: a pedra que cai do penhasco junta no pé dele (o lado de baixo do desnível), a da serra junta
  // no sopé, e a encosta íngreme solta umas poucas; no plano aberto, quase nenhuma (a pedra errática, rara).
  for (let y = 1; y < n - 1; y++) {
    for (let x = 1; x < n - 1; x++) {
      const k = y * n + x;
      if (obstaculos[k] || agua[k]) continue;
      const h = alturas[k] ?? 0;
      let queda = 0;
      let sope = false;
      for (const [dx, dy] of VIZ8) {
        const j = (y + dy) * n + x + dx;
        queda = Math.max(queda, (alturas[j] ?? 0) - h);
        if (obstaculos[j] === OBSTACULO.montanha) sope = true;
      }
      const chance = sope ? p.rochedos * 18 : queda >= 3 ? p.rochedos * 14 : queda >= 1 ? p.rochedos * 1.5 : p.rochedos * 0.15;
      if (hashCelula(x, y, e.semente + 7) < chance) obstaculos[k] = OBSTACULO.rochedo;
    }
  }
  return { alturas, obstaculos, agua };
}
