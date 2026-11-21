// Marco 49 (21/11/2026, D-194): a rota de um projétil como função paramétrica. `pontoEm(rota, t)` dá a posição em
// células (x, y) e a altura acima do voo comum (z), para t de 0 (a saída) a 1 (o destino). O núcleo anda por ela em
// sub-passos (a colisão segue a curva) e a tela desenha o mesmo ponto: o que se vê é o que acerta. Determinística
// pela semente da rota (nenhum RNG do estado é consumido aqui). Puro.

export type TipoRota = 'reta' | 'parabola' | 'espiral' | 'convergente' | 'caotica' | 'orbita' | 'queda' | 'coluna';

export interface Rota {
  tipo: TipoRota;
  /** A saída e o destino, em células. */
  ox: number;
  oy: number;
  dx: number;
  dy: number;
  /** A semente das dobras (caótica) e do desvio dos grãos. */
  semente: number;
  /** O lado do par convergente (1 ou −1); o giro da espiral e da órbita. */
  lado: 1 | -1;
  /** A altura da parábola e da queda; a largura da curva (convergente, caótica); o raio da espiral e da órbita. */
  altura: number;
  largura: number;
  /** As voltas da espiral; as dobras da caótica. */
  voltas: number;
  /** A fração da rota que a órbita gasta girando em volta de quem lançou. */
  giro: number;
  /** Um desvio lateral fixo (os grãos saem espalhados), em células, que some no destino. */
  desvio: number;
  /** O comprimento da rota, calculado uma vez na criação (o projétil anda nele). */
  comp: number;
}

export interface PontoNoAr {
  x: number;
  y: number;
  z: number;
}

/** Um número de 0 a 1, fixo para (semente, i): as dobras da caótica e o espalhamento dos grãos. */
export function hash01(semente: number, i: number): number {
  let h = (Math.imul(semente | 0, 0x9e3779b1) ^ Math.imul(i + 1, 0x85ebca77)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0;
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39) >>> 0;
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}

/** O deslocamento lateral da caótica: k dobras sorteadas, suaves e zeradas nas pontas. */
function dobras(r: Rota, t: number): number {
  const k = Math.max(2, Math.round(r.voltas));
  const passo = 1 / (k + 1);
  const i = Math.min(k, Math.floor(t / passo));
  const valor = (j: number) => (j <= 0 || j > k ? 0 : (hash01(r.semente, j) * 2 - 1) * r.largura);
  const a = valor(i);
  const b = valor(i + 1);
  const u = (t - i * passo) / passo;
  const s = (1 - Math.cos(Math.PI * u)) / 2;
  return a + (b - a) * s;
}

/** O ponto da rota em t ∈ [0, 1]. */
export function pontoEm(r: Rota, tBruto: number): PontoNoAr {
  const t = Math.max(0, Math.min(1, tBruto));
  const vx = r.dx - r.ox;
  const vy = r.dy - r.oy;
  const d = Math.hypot(vx, vy);
  const ux = d > 1e-9 ? vx / d : 1;
  const uy = d > 1e-9 ? vy / d : 0;
  // A perpendicular (para a esquerda de quem lança).
  const px = -uy;
  const py = ux;
  const lateralFixo = r.desvio * Math.sin(Math.PI * t);
  switch (r.tipo) {
    case 'queda':
      // Cai do céu no destino; a altura some até o chão.
      return { x: r.dx, y: r.dy, z: r.altura * (1 - t) * (1 - t) };
    case 'coluna':
      // Sobe do círculo sob o alvo: abaixo do chão até a altura do corpo.
      return { x: r.dx, y: r.dy, z: -1 + t };
    case 'orbita': {
      if (t < r.giro && r.giro > 0) {
        // Uma volta em volta de quem lançou, terminando de frente para o destino.
        const ang = Math.atan2(uy, ux) - r.lado * 2 * Math.PI * (1 - t / r.giro);
        return { x: r.ox + Math.cos(ang) * r.altura, y: r.oy + Math.sin(ang) * r.altura, z: 0 };
      }
      const u = r.giro >= 1 ? 1 : (t - r.giro) / (1 - r.giro);
      const sx = r.ox + ux * r.altura;
      const sy = r.oy + uy * r.altura;
      return { x: sx + (r.dx - sx) * u, y: sy + (r.dy - sy) * u, z: 0 };
    }
    default: {
      let lateral = lateralFixo;
      let z = 0;
      if (r.tipo === 'parabola') z = 4 * r.altura * t * (1 - t);
      else if (r.tipo === 'convergente') lateral += r.lado * r.largura * Math.sin(Math.PI * t);
      else if (r.tipo === 'caotica') lateral += dobras(r, t);
      else if (r.tipo === 'espiral') {
        // Gira em volta do eixo; o envelope abre no meio e fecha nas pontas (sai da mão e chega no alvo).
        const env = Math.sin(Math.PI * t);
        const ang = r.lado * 2 * Math.PI * r.voltas * t;
        lateral += r.altura * env * Math.sin(ang);
        z = r.altura * env * (1 - Math.cos(ang)) * 0.5;
      }
      return { x: r.ox + vx * t + px * lateral, y: r.oy + vy * t + py * lateral, z };
    }
  }
}

/** O comprimento da rota (no plano), por 24 segmentos: o projétil anda nele na velocidade dele. */
export function comprimento(r: Rota): number {
  if (r.tipo === 'queda' || r.tipo === 'coluna') return 1;
  let total = 0;
  let a = pontoEm(r, 0);
  for (let i = 1; i <= 24; i++) {
    const b = pontoEm(r, i / 24);
    total += Math.hypot(b.x - a.x, b.y - a.y);
    a = b;
  }
  return Math.max(0.25, total);
}

/** A direção do voo em t (para a orientação na tela e para quem ricocheteia), normalizada. */
export function direcaoEm(r: Rota, t: number): { x: number; y: number } {
  const a = pontoEm(r, Math.max(0, t - 0.01));
  const b = pontoEm(r, Math.min(1, t + 0.01));
  const n = Math.hypot(b.x - a.x, b.y - a.y);
  if (n < 1e-9) {
    const d = Math.hypot(r.dx - r.ox, r.dy - r.oy);
    return d > 1e-9 ? { x: (r.dx - r.ox) / d, y: (r.dy - r.oy) / d } : { x: 1, y: 0 };
  }
  return { x: (b.x - a.x) / n, y: (b.y - a.y) / n };
}
