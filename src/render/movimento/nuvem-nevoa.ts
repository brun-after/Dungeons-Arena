// 16/11/2026 (D-181): a nuvem da Forma de névoa, refeita. Antes eram blocos redondos em volta de cada membro, com fiapos
// girando em anel (que pareciam o anel de duração dos servos). Agora é uma massa só, sem forma: um contorno que ondula
// devagar, desfocado (o BlurFilter apaga as bordas e funde tudo), crescendo com a quantidade de mortos dentro dela. O
// rastro é a própria nuvem se desfazendo: pedaços que ficam para trás, encolhem e viram cinzas na cor da mistura das
// afinidades do Necromante (cada uma pesa pelo quanto participa). Só apresentação.

import { BlurFilter, Graphics, type Container } from 'pixi.js';
import { PONTAS_ELEMENTAIS, type PontaElemental } from '../../progression/vinculo';

type Ponto = { x: number; y: number };

/** Uma nuvem neste quadro: os pontos na tela (o Necromante primeiro) e a cor das cinzas. */
export interface NuvemNoQuadro {
  id: string;
  membros: Ponto[];
  cor: number;
}

/** Um pedaço que ficou para trás (na tela). */
interface Pedaco {
  x: number;
  y: number;
  r: number;
  ms: number;
  semente: number;
  cor: number;
  cinzas: number;
}

const TREVA = 0x050407;
/** Quanto o pedaço leva para virar cinza e sumir (ms). */
const DESFAZ_MS = 1300;
/** A nuvem flutua um pouco acima do chão (px). */
const ALTURA = 18;
const LIMITE_PEDACOS = 90;

/**
 * A cor da mistura das afinidades: a média das cores das pontas, cada uma pesando pela participação (o vínculo). Sem
 * nenhuma afinidade, null.
 */
export function corPelaParticipacao(pesos: Partial<Record<PontaElemental, number>>, corDe: (p: PontaElemental) => number): number | null {
  let total = 0, r = 0, g = 0, b = 0;
  for (const p of PONTAS_ELEMENTAIS) {
    const w = pesos[p] ?? 0;
    if (!(w > 0)) continue;
    const c = corDe(p);
    total += w;
    r += ((c >> 16) & 0xff) * w;
    g += ((c >> 8) & 0xff) * w;
    b += (c & 0xff) * w;
  }
  if (total <= 0) return null;
  return (Math.round(r / total) << 16) | (Math.round(g / total) << 8) | Math.round(b / total);
}

/** O tamanho da nuvem (raio horizontal, px): cresce com os mortos dentro dela e cobre o mais afastado. */
export function raioDaNuvem(membros: number, maisLonge: number): number {
  return Math.max(22 + 9 * Math.sqrt(Math.max(0, membros - 1)), maisLonge + 16);
}

function escurecer(c: number, f: number): number {
  const k = 1 - f;
  return (Math.round(((c >> 16) & 0xff) * k) << 16) | (Math.round(((c >> 8) & 0xff) * k) << 8) | Math.round((c & 0xff) * k);
}

export class NuvemDaNevoa {
  /** A massa desfocada (a nuvem e os pedaços que se desfazem). */
  private readonly massa = new Graphics();
  /** O que fica nítido: as cinzas e os olhos. */
  private readonly nitido = new Graphics();
  private pedacos: Pedaco[] = [];
  private readonly ultimo = new Map<string, { x: number; y: number; ms: number }>();

  constructor(camadaAr: Container) {
    this.massa.filters = [new BlurFilter({ strength: 9, quality: 3 })];
    camadaAr.addChild(this.massa, this.nitido);
  }

  quadro(nuvens: readonly NuvemNoQuadro[], agoraMs: number, reduzido: boolean): void {
    const massa = this.massa.clear();
    const nitido = this.nitido.clear();
    const t = reduzido ? 0 : agoraMs / 1000;
    for (const n of nuvens) this.nuvem(massa, nitido, n, agoraMs, t);
    this.pedacos = this.pedacos.filter((p) => agoraMs - p.ms < DESFAZ_MS);
    for (const p of this.pedacos) this.desfazer(massa, nitido, p, (agoraMs - p.ms) / DESFAZ_MS, reduzido);
    massa.visible = nuvens.length > 0 || this.pedacos.length > 0;
  }

  private nuvem(massa: Graphics, nitido: Graphics, n: NuvemNoQuadro, agoraMs: number, t: number): void {
    const [dono] = n.membros;
    if (!dono) return;
    // O centro pende para o Necromante (ele conta em dobro); o raio cobre quem está mais longe.
    let sx = dono.x * 2, sy = dono.y * 2;
    for (const m of n.membros.slice(1)) {
      sx += m.x;
      sy += m.y;
    }
    const peso = n.membros.length + 1;
    const c = { x: sx / peso, y: sy / peso - ALTURA };
    const maisLonge = Math.max(0, ...n.membros.map((m) => Math.hypot(m.x - c.x, (m.y - ALTURA - c.y) / 0.7)));
    const rx = raioDaNuvem(n.membros.length, maisLonge);
    const ry = rx * 0.7;
    massa.ellipse(c.x, c.y + ALTURA + 1, rx * 0.95, ry * 0.4).fill({ color: 0x000000, alpha: 0.28 });
    // O contorno sem forma: ondas lentas de frequências diferentes, em três camadas (a de fora rala, a de dentro densa).
    const fase = (n.id.length * 1.37) % 6.28;
    for (const [f, cor, alfa, desvio] of [[1.12, 0x100c16, 0.4, 0], [0.88, TREVA, 0.55, 0.9], [0.55, 0x020203, 0.6, 2.1]] as const) {
      const pts: number[] = [];
      const ox = Math.sin(t * 0.6 + desvio) * rx * 0.08, oy = Math.cos(t * 0.5 + desvio) * ry * 0.08;
      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * Math.PI * 2;
        const onda = 1 + 0.13 * Math.sin(2 * a + t * 0.55 + fase + desvio) + 0.08 * Math.sin(3 * a - t * 0.8 + desvio) + 0.05 * Math.sin(5 * a + t * 1.3);
        pts.push(c.x + ox + Math.cos(a) * rx * f * onda, c.y + oy + Math.sin(a) * ry * f * onda);
      }
      massa.poly(pts).fill({ color: cor, alpha: alfa });
    }
    // Cada morto engrossa a nuvem onde está (o desfoque funde tudo numa massa só).
    for (const m of n.membros) massa.circle(m.x, m.y - ALTURA, 15).fill({ color: TREVA, alpha: 0.35 });
    // O rastro: deixa um pedaço para trás quando anda (parada, a nuvem só respira).
    const u = this.ultimo.get(n.id);
    const andou = u ? Math.hypot(dono.x - u.x, dono.y - u.y) : 0;
    if (!u || (andou > 5 && agoraMs - u.ms > 45)) {
      this.ultimo.set(n.id, { x: dono.x, y: dono.y, ms: agoraMs });
      if (u) {
        this.pedacos.push({ x: c.x, y: c.y, r: rx * 0.6, ms: agoraMs, semente: (agoraMs * 0.618) % 1, cor: n.cor, cinzas: Math.min(12, 4 + Math.round(Math.sqrt(n.membros.length) * 2.5)) });
        if (this.pedacos.length > LIMITE_PEDACOS) this.pedacos.splice(0, this.pedacos.length - LIMITE_PEDACOS);
      }
    }
    const pisca = Math.sin(t * 0.7) > 0.97 ? 0.15 : 1;
    for (const lado of [-1, 1]) nitido.ellipse(dono.x + lado * 3.6, dono.y - ALTURA - 6, 1.7, 1.1 * pisca).fill({ color: 0xd7e0cf, alpha: 0.75 });
  }

  /** O pedaço que ficou: a treva encolhe e se apaga enquanto as cinzas sobem e se espalham. */
  private desfazer(massa: Graphics, nitido: Graphics, p: Pedaco, u: number, reduzido: boolean): void {
    const resta = 1 - u;
    massa.circle(p.x, p.y - u * 6, p.r * Math.pow(resta, 0.7)).fill({ color: TREVA, alpha: 0.45 * resta * resta });
    // As cinzas só surgem quando o pedaço já ficou para trás (não salpicam a massa da nuvem).
    const surge = Math.min(1, Math.max(0, (u - 0.12) / 0.2));
    for (let k = 0; k < p.cinzas; k++) {
      const a = p.semente * 6.28 + k * 2.39996;
      const dist = p.r * (0.25 + 0.75 * (((k * 0.37 + p.semente) % 1)));
      const sobe = u * (12 + (k % 3) * 7);
      const vento = reduzido ? 0 : Math.sin(u * 3 + k) * 5;
      const x = p.x + Math.cos(a) * dist * (1 + u * 0.5) + vento;
      const y = p.y + Math.sin(a) * dist * 0.7 - sobe;
      const lado = (1.8 + (k % 4) * 0.5) * (1 - u * 0.4);
      const giro = a + u * 4;
      const cx = Math.cos(giro) * lado, cy = Math.sin(giro) * lado * 0.6;
      nitido.poly([x + cx, y + cy, x - cy, y + cx, x - cx, y - cy, x + cy, y - cx]).fill({ color: escurecer(p.cor, (k % 3) * 0.18), alpha: 0.9 * surge * Math.sqrt(resta) });
    }
  }

  limpar(): void {
    this.pedacos = [];
    this.ultimo.clear();
  }

  destruir(): void {
    this.massa.destroy();
    this.nitido.destroy();
  }
}
