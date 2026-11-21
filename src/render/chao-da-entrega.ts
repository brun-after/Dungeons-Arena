// Marco 49 (21/11/2026, D-194): o chão que a entrega deixa (a marca e a erupção), desenhado como a matéria do
// elemento, não como o acerto da skill repetido. O gelo congela o chão e levanta cristais que crescem do centro para
// fora; a terra levanta lascas de pedra; o fogo racha o chão em brasa e solta chamas baixas; o veneno borbulha. Os
// outros elementos tingem o chão com um anel. A erupção acende as runas e, a cada pulso, sobe um jorro curto.
// Tudo é sorteado pela semente do solo (o mesmo desenho a cada quadro) e lido do estado.

import type { Graphics } from 'pixi.js';
import { hash01 } from '../combat/entrega/rota';
import type { Elemento } from '../combat/elementos';
import type { Solo } from '../combat/solos';
import { CELULA_PX } from './camera-calculo';
import type { SistemaParticulas } from './particulas';
import { centroDaCelula } from './projecao';

type Ponto = { x: number; y: number };

/** Quanto tempo o cristal leva para crescer, e quanto o crescimento atrasa por célula de distância do centro. */
const CRESCER_MS = 380;
const ATRASO_POR_CELULA_MS = 140;
/** Quanto dura o jorro da erupção depois de cada pulso. */
const JORRO_MS = 420;

const clarear = (c: number, k: number): number => {
  const f = (v: number) => Math.round(v + (255 - v) * k);
  return (f((c >> 16) & 0xff) << 16) | (f((c >> 8) & 0xff) << 8) | f(c & 0xff);
};
const escurecer = (c: number, k: number): number => {
  const f = (v: number) => Math.round(v * (1 - k));
  return (f((c >> 16) & 0xff) << 16) | (f((c >> 8) & 0xff) << 8) | f(c & 0xff);
};
const limitar = (v: number) => Math.max(0, Math.min(1, v));
const suave = (t: number) => 1 - (1 - t) * (1 - t);

interface Pecas {
  chao: Graphics;
  ar: Graphics;
  particulas: SistemaParticulas;
}

export class ChaoDaEntrega {
  private readonly nasceu = new Map<number, number>();
  private readonly pulso = new Map<number, { n: number; em: number }>();

  constructor(private readonly o: Pecas) {}

  /** Esquece os solos que já acabaram. */
  limpar(vivos: ReadonlySet<number>): void {
    for (const id of this.nasceu.keys()) if (!vivos.has(id)) this.nasceu.delete(id);
    for (const id of this.pulso.keys()) if (!vivos.has(id)) this.pulso.delete(id);
  }

  desenhar(s: Solo, elemento: Elemento | 'fisico' | null, cor: number, agoraMs: number): void {
    const nasceu = this.nasceu.get(s.id) ?? agoraMs;
    this.nasceu.set(s.id, nasceu);
    const idade = agoraMs - nasceu;
    const raio = 0.45 + s.raio;
    if (s.entrega === 'erupcao') {
      this.erupcao(s, raio, cor, agoraMs);
      return;
    }
    switch (elemento) {
      case 'gelo':
        this.geada(s, raio, cor);
        this.cristais(s, raio, cor, idade, agoraMs, false);
        return;
      case 'terra':
        this.manchar(s, raio, escurecer(cor, 0.4), 0.2);
        this.cristais(s, raio, cor, idade, agoraMs, true);
        return;
      case 'fogo':
        this.brasa(s, raio, cor, agoraMs);
        return;
      case 'veneno':
        this.borbulhar(s, raio, cor, agoraMs);
        return;
      default:
        this.manchar(s, raio, cor, 0.12);
        this.anel(s, raio, cor, agoraMs);
    }
  }

  /** Um ponto do solo no plano (a camada do chão tem a projeção) a `d` células do centro, no ângulo `a`. */
  private noPlano(s: Solo, a: number, d: number): Ponto {
    const c = centroDaCelula(s.x, s.y);
    return { x: c.x + Math.cos(a) * d * CELULA_PX, y: c.y + Math.sin(a) * d * CELULA_PX };
  }

  /** O mesmo ponto já projetado na tela (onde o que se ergue do chão nasce). */
  private naTela(s: Solo, a: number, d: number): Ponto {
    return this.o.particulas.noChao(s.x + Math.cos(a) * d, s.y + Math.sin(a) * d);
  }

  private manchar(s: Solo, raio: number, cor: number, alfa: number): void {
    const c = centroDaCelula(s.x, s.y);
    this.o.chao.circle(c.x, c.y, raio * CELULA_PX).fill({ color: cor, alpha: alfa });
    this.o.chao.circle(c.x, c.y, raio * CELULA_PX * 0.6).fill({ color: cor, alpha: alfa * 0.6 });
  }

  /** Rachaduras que saem do centro, quebradas em dois joelhos sorteados. */
  private rachaduras(s: Solo, raio: number, cor: number, alfa: number, largura: number, n: number): void {
    const g = this.o.chao;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + hash01(s.id, 40 + i) * 0.6;
      const p0 = this.noPlano(s, a, raio * 0.15);
      const p1 = this.noPlano(s, a + (hash01(s.id, 60 + i) - 0.5) * 0.5, raio * 0.5);
      const p2 = this.noPlano(s, a + (hash01(s.id, 80 + i) - 0.5) * 0.6, raio * (0.75 + 0.2 * hash01(s.id, 100 + i)));
      g.moveTo(p0.x, p0.y).lineTo(p1.x, p1.y).lineTo(p2.x, p2.y).stroke({ width: largura, color: cor, alpha: alfa });
    }
  }

  /** O chão congelado: a camada branca de geada e as rachaduras do gelo. */
  private geada(s: Solo, raio: number, cor: number): void {
    this.manchar(s, raio, clarear(cor, 0.7), 0.1);
    this.rachaduras(s, raio, 0xffffff, 0.22, 1, 8);
  }

  /**
   * Os cristais que brotam do chão, em tufos de 1 a 3, crescendo do centro para fora e inclinados para longe dele.
   * `pedra` faz lascas mais largas, baixas e foscas (a terra).
   */
  private cristais(s: Solo, raio: number, cor: number, idade: number, agoraMs: number, pedra: boolean): void {
    const tufos = 6 + s.raio * 4;
    const pecas: { base: Ponto; alt: number; larg: number; inc: number; i: number }[] = [];
    for (let i = 0; i < tufos; i++) {
      const a = hash01(s.id, i) * Math.PI * 2;
      const d = Math.sqrt(hash01(s.id, 200 + i)) * raio * 0.85;
      const cresce = suave(limitar((idade - d * ATRASO_POR_CELULA_MS) / CRESCER_MS));
      if (cresce <= 0) continue;
      const n = 1 + Math.floor(hash01(s.id, 300 + i) * 3);
      for (let j = 0; j < n; j++) {
        const da = (j - (n - 1) / 2) * 0.12;
        const base = this.naTela(s, a + da, d + (hash01(s.id, 400 + i * 3 + j) - 0.5) * 0.15);
        const alt = CELULA_PX * (pedra ? 0.14 + 0.16 * hash01(s.id, 500 + i * 3 + j) : 0.2 + 0.32 * hash01(s.id, 500 + i * 3 + j)) * cresce * (j === Math.floor(n / 2) ? 1 : 0.7);
        const larg = CELULA_PX * (pedra ? 0.09 : 0.05) * (0.8 + 0.4 * hash01(s.id, 600 + i));
        // Inclina para longe do centro do solo na tela, mais nos tufos de fora.
        const fora = Math.cos(a) - Math.sin(a);
        const inc = (j - (n - 1) / 2) * 0.35 + fora * 0.25 * (d / raio);
        pecas.push({ base, alt, larg, inc, i: i * 3 + j });
      }
    }
    pecas.sort((p, q) => p.base.y - q.base.y);
    const g = this.o.ar;
    const corpo = pedra ? escurecer(cor, 0.15) : clarear(cor, 0.35);
    const sombra = pedra ? escurecer(cor, 0.5) : cor;
    for (const p of pecas) {
      const ux = Math.sin(p.inc);
      const uy = -Math.cos(p.inc);
      const px = Math.cos(p.inc);
      const py = Math.sin(p.inc);
      const b = p.base;
      const esq = { x: b.x - px * p.larg, y: b.y - py * p.larg };
      const dir = { x: b.x + px * p.larg, y: b.y + py * p.larg };
      const ombro = pedra ? 0.55 : 0.72;
      const oe = { x: b.x + ux * p.alt * ombro - px * p.larg * 0.9, y: b.y + uy * p.alt * ombro - py * p.larg * 0.9 };
      const od = { x: b.x + ux * p.alt * ombro + px * p.larg * 0.9, y: b.y + uy * p.alt * ombro + py * p.larg * 0.9 };
      const ponta = { x: b.x + ux * p.alt, y: b.y + uy * p.alt };
      g.poly([esq.x, esq.y, oe.x, oe.y, ponta.x, ponta.y, od.x, od.y, dir.x, dir.y]).fill({ color: corpo, alpha: pedra ? 0.95 : 0.78 });
      // A face da sombra (metade esquerda) e o fio de luz da aresta.
      g.poly([esq.x, esq.y, oe.x, oe.y, ponta.x, ponta.y, b.x, b.y]).fill({ color: sombra, alpha: pedra ? 0.6 : 0.45 });
      if (!pedra) {
        g.moveTo(b.x, b.y).lineTo(ponta.x, ponta.y).stroke({ width: 1, color: 0xffffff, alpha: 0.55 });
        // O brilho que corre de cristal em cristal.
        const brilho = Math.sin(agoraMs / 320 + p.i * 1.7);
        if (brilho > 0.92) {
          const r = 3 * (brilho - 0.92) / 0.08 + 1;
          g.moveTo(ponta.x - r, ponta.y).lineTo(ponta.x + r, ponta.y).moveTo(ponta.x, ponta.y - r).lineTo(ponta.x, ponta.y + r).stroke({ width: 1, color: 0xffffff, alpha: 0.9 });
        }
      }
    }
  }

  /** O chão em brasa: queimado, rachado em vermelho vivo que respira, e chamas baixas que tremulam. */
  private brasa(s: Solo, raio: number, cor: number, agoraMs: number): void {
    this.manchar(s, raio, 0x140804, 0.35);
    const respira = 0.5 + 0.5 * Math.sin(agoraMs / 300);
    this.rachaduras(s, raio, 0xff6a20, 0.25 + 0.2 * respira, 1.5, 7);
    const g = this.o.ar;
    const n = 4 + s.raio * 2;
    for (let i = 0; i < n; i++) {
      const b = this.naTela(s, hash01(s.id, i) * Math.PI * 2, Math.sqrt(hash01(s.id, 200 + i)) * raio * 0.8);
      const h = CELULA_PX * (0.16 + 0.1 * Math.sin(agoraMs / 90 + i * 2.3));
      const w = CELULA_PX * 0.07;
      g.poly([b.x - w, b.y, b.x - w * 0.5, b.y - h * 0.6, b.x, b.y - h, b.x + w * 0.5, b.y - h * 0.6, b.x + w, b.y]).fill({ color: cor, alpha: 0.5 });
      g.poly([b.x - w * 0.5, b.y, b.x, b.y - h * 0.6, b.x + w * 0.5, b.y]).fill({ color: 0xffd27a, alpha: 0.65 });
    }
  }

  /** O chão envenenado: a poça e as bolhas que sobem, crescem e estouram. */
  private borbulhar(s: Solo, raio: number, cor: number, agoraMs: number): void {
    this.manchar(s, raio, cor, 0.15);
    const g = this.o.ar;
    const n = 6 + s.raio * 3;
    for (let i = 0; i < n; i++) {
      const fase = (agoraMs / 1100 + hash01(s.id, 700 + i)) % 1;
      const b = this.naTela(s, hash01(s.id, i) * Math.PI * 2, Math.sqrt(hash01(s.id, 200 + i)) * raio * 0.8);
      if (fase < 0.85) {
        const r = 1.5 + 4.5 * (fase / 0.85);
        g.circle(b.x, b.y - r - fase * 3, r).stroke({ width: 1, color: clarear(cor, 0.5), alpha: 0.75 }).fill({ color: cor, alpha: 0.25 });
      } else {
        const k = (fase - 0.85) / 0.15;
        g.circle(b.x, b.y - 8, 6 + 4 * k).stroke({ width: 1, color: clarear(cor, 0.6), alpha: 0.6 * (1 - k) });
      }
    }
  }

  /** O anel do elemento na borda do chão tomado (os elementos sem matéria própria). */
  private anel(s: Solo, raio: number, cor: number, agoraMs: number): void {
    const c = centroDaCelula(s.x, s.y);
    const respira = 0.75 + 0.25 * Math.sin(agoraMs / 260);
    this.o.chao.circle(c.x, c.y, raio * CELULA_PX).stroke({ width: 2, color: clarear(cor, 0.3), alpha: 0.35 * respira });
  }

  /** A erupção: as runas acesas no chão e, a cada pulso do solo, um jorro curto que sobe e um anel que abre. */
  private erupcao(s: Solo, raio: number, cor: number, agoraMs: number): void {
    const c = centroDaCelula(s.x, s.y);
    const r = raio * CELULA_PX;
    const giro = (agoraMs / 900) % (Math.PI * 2);
    const g = this.o.chao;
    g.circle(c.x, c.y, r).stroke({ width: 2, color: clarear(cor, 0.4), alpha: 0.7 });
    g.circle(c.x, c.y, r * 0.72).stroke({ width: 1, color: cor, alpha: 0.5 });
    for (let i = 0; i < 6; i++) {
      const a = giro + (i * Math.PI) / 3;
      const px = c.x + Math.cos(a) * r * 0.86;
      const py = c.y + Math.sin(a) * r * 0.86;
      g.moveTo(px - Math.sin(a) * 4, py + Math.cos(a) * 4).lineTo(px + Math.sin(a) * 4, py - Math.cos(a) * 4).stroke({ width: 2, color: clarear(cor, 0.6), alpha: 0.8 });
    }
    const p = this.pulso.get(s.id);
    if (!p || p.n !== s.pulsados) this.pulso.set(s.id, { n: s.pulsados, em: p ? agoraMs : -JORRO_MS });
    const desde = agoraMs - (this.pulso.get(s.id)?.em ?? -JORRO_MS);
    if (desde < 0 || desde > JORRO_MS) return;
    const k = desde / JORRO_MS;
    g.circle(c.x, c.y, r * (0.3 + 0.9 * k)).stroke({ width: 3 * (1 - k) + 0.5, color: clarear(cor, 0.5), alpha: 0.7 * (1 - k) });
    const base = this.o.particulas.noChao(s.x, s.y);
    const alto = CELULA_PX * 1.1 * suave(Math.min(1, k * 2.5));
    this.o.ar.moveTo(base.x, base.y).lineTo(base.x, base.y - alto).stroke({ width: 9 * (1 - k), color: cor, alpha: 0.3 * (1 - k) });
    this.o.ar.moveTo(base.x, base.y).lineTo(base.x, base.y - alto).stroke({ width: 2.5 * (1 - k) + 0.5, color: clarear(cor, 0.7), alpha: 0.8 * (1 - k) });
  }
}
