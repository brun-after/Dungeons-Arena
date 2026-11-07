// O visual das armadilhas (06/11/2026, D-135). Exposta (sua, da sua equipe, revelada pela Sabedoria ou a runa de pé
// do armadilheiro), a armadilha é um círculo de conjuração desenhado sobre a célula: dois anéis com runas girando e,
// no meio, o sinal do elemento (ou a estrela de brasa da explosão), com um brilho aditivo que pulsa. Rearmando, fica
// cinza e apagado. A runa do armadilheiro ainda tem uma pedra de pé com o sinal aceso (no isométrico, na camada das
// entidades, ordenada pela profundidade). Só lê o estado.

import { Graphics, type Container } from 'pixi.js';
import elementosJson from '../data/elementos.json';
import type { Elemento } from '../combat/elementos';
import type { Armadilha, EstadoJogo } from '../core/estado';
import type { Entidade } from '../entities/entidade';
import { CELULA_PX } from './camera-calculo';
import type { OpcoesEmPe } from './objetos';
import { centroDaCelula } from './projecao';

const P = CELULA_PX;
/** A brasa da armadilha de explosão. */
const COR_EXPLOSAO = 0xff6a2c;
/** As suas (e da sua equipe) têm o anel de fora verde-água, como antes. */
const COR_PROPRIA = 0x50e3c2;
const COR_INERTE = 0x7c858c;
const COR_DESARME = 0xf1c40f;
const COR_PEDRA = 0x3b3840;
const COR_ARESTA = 0x6d6873;

const CORES: Readonly<Record<string, number>> = Object.fromEntries(
  elementosJson.elementos.map((e) => [e.id, Number.parseInt(e.cor.slice(1), 16)]),
);

export function corDaArmadilha(a: Pick<Armadilha, 'elemento'>): number {
  return a.elemento ? (CORES[a.elemento] ?? COR_EXPLOSAO) : COR_EXPLOSAO;
}

/** Quem vê esta armadilha: a dele, a da equipe, a revelada a ele e a runa de pé (à vista de todos). */
export function armadilhaExposta(a: Armadilha, idLocal: string, local: Entidade | undefined): 'propria' | 'hostil' | null {
  if (a.donoId === idLocal || (local !== undefined && a.equipeDono === local.equipe)) return 'propria';
  return a.runa || a.reveladaPara.includes(idLocal) ? 'hostil' : null;
}

/** O sinal do elemento no meio do círculo (raio `r`), girado de `giro`. */
function sinal(g: Graphics, cx: number, cy: number, r: number, el: Elemento | undefined, giro: number, cor: number, alpha: number): void {
  const pt = (a: number, d: number): [number, number] => [cx + Math.cos(a + giro) * d, cy + Math.sin(a + giro) * d];
  const traco = { width: 1.6, color: cor, alpha };
  switch (el) {
    case 'fogo': {
      g.poly([...pt(-Math.PI / 2, r), ...pt(Math.PI / 6, r), ...pt((5 * Math.PI) / 6, r)]).stroke(traco);
      g.poly([...pt(Math.PI / 2, r * 0.55), ...pt(-Math.PI / 6, r * 0.55), ...pt((-5 * Math.PI) / 6, r * 0.55)]).stroke(traco);
      return;
    }
    case 'gelo':
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI) / 3;
        g.moveTo(...pt(a, r)).lineTo(...pt(a + Math.PI, r)).stroke(traco);
        g.moveTo(...pt(a, r * 0.55)).lineTo(...pt(a + 0.5, r * 0.75)).stroke(traco);
      }
      return;
    case 'raio':
      g.poly([...pt(-1.9, r), ...pt(-0.4, r * 0.15), ...pt(-2.3, r * 0.1), ...pt(1.25, r), ...pt(2.7, r * 0.15), ...pt(0.8, r * 0.1)], false).stroke(traco);
      return;
    case 'veneno':
      g.circle(cx, cy, r * 0.45).stroke(traco);
      for (let i = 0; i < 3; i++) g.circle(...pt((i * 2 * Math.PI) / 3, r * 0.72), r * 0.2).stroke(traco);
      return;
    case 'psiquico':
      g.ellipse(cx, cy, r, r * 0.45).stroke(traco);
      g.circle(cx, cy, r * 0.22).fill({ color: cor, alpha });
      return;
    case 'terra': {
      const q = [0, 1, 2, 3].flatMap((i) => pt(Math.PI / 4 + (i * Math.PI) / 2, r));
      g.poly(q).stroke(traco);
      g.moveTo(...pt(Math.PI / 4, r)).lineTo(...pt((5 * Math.PI) / 4, r)).stroke(traco);
      return;
    }
    case 'trevas':
      // 07/11/2026: o moveTo antes do arco (sem ele, o Pixi liga o ponto anterior ao arco com uma linha).
      g.moveTo(...pt(0.6, r)).arc(cx, cy, r, giro + 0.6, giro + Math.PI * 2 - 0.6).stroke(traco);
      g.circle(...pt(0, r * 0.35), r * 0.55).stroke(traco);
      return;
    case 'sagrado':
      g.circle(cx, cy, r * 0.4).stroke(traco);
      for (let i = 0; i < 8; i++) g.moveTo(...pt((i * Math.PI) / 4, r * 0.55)).lineTo(...pt((i * Math.PI) / 4, r)).stroke(traco);
      return;
    default: {
      // Explosão: a estrela de oito pontas.
      const pts: number[] = [];
      for (let i = 0; i < 16; i++) pts.push(...pt((i * Math.PI) / 8, i % 2 === 0 ? r : r * 0.45));
      g.poly(pts).stroke(traco);
    }
  }
}

/** O círculo de conjuração no chão (coordenadas do plano). */
export function circuloDeConjuracao(g: Graphics, brilho: Graphics, a: Pick<Armadilha, 'x' | 'y' | 'id' | 'elemento'>, tMs: number, propria: boolean, inerte: boolean, escala = 1): void {
  const cx = (a.x + 0.5) * CELULA_PX;
  const cy = (a.y + 0.5) * CELULA_PX;
  const R = CELULA_PX * escala;
  const cor = inerte ? COR_INERTE : corDaArmadilha(a);
  const pulso = inerte ? 0 : 0.5 + 0.5 * Math.sin(tMs / 320 + a.id);
  const giro = tMs / 2600;
  const forca = inerte ? 0.35 : 0.85;
  if (!inerte) brilho.circle(cx, cy, R * 0.5).fill({ color: cor, alpha: 0.1 + 0.12 * pulso });
  g.circle(cx, cy, R * 0.46).stroke({ width: 2, color: propria ? COR_PROPRIA : cor, alpha: forca });
  g.circle(cx, cy, R * 0.36).stroke({ width: 1.2, color: cor, alpha: forca * 0.8 });
  // As runas entre os anéis, girando devagar.
  for (let i = 0; i < 8; i++) {
    const ang = giro + (i * Math.PI) / 4;
    const x = cx + Math.cos(ang) * R * 0.41;
    const y = cy + Math.sin(ang) * R * 0.41;
    const t = ang + Math.PI / 2;
    const dx = Math.cos(t) * 3;
    const dy = Math.sin(t) * 3;
    g.moveTo(x - dx, y - dy).lineTo(x + dx, y + dy).stroke({ width: 1.4, color: cor, alpha: forca });
    if (i % 2 === 0) g.circle(x + Math.cos(ang) * 0.1, y, 1.1).fill({ color: cor, alpha: forca });
  }
  sinal(g, cx, cy, R * 0.25, a.elemento, -giro * 1.6, cor, forca);
  if (!inerte) sinal(brilho, cx, cy, R * 0.25, a.elemento, -giro * 1.6, cor, 0.25 + 0.35 * pulso);
}

/** O anel do desarme em curso (o progresso da Sabedoria). */
export function anelDoDesarme(g: Graphics, a: Armadilha, fracao: number): void {
  const cx = (a.x + 0.5) * P;
  const cy = (a.y + 0.5) * P;
  const inicio = -Math.PI / 2;
  g.moveTo(cx + Math.cos(inicio) * P * 0.52, cy + Math.sin(inicio) * P * 0.52);
  g.arc(cx, cy, P * 0.52, inicio, inicio + Math.PI * 2 * fracao).stroke({ width: 3, color: COR_DESARME, alpha: 0.95 });
}

/**
 * As runas de pé do armadilheiro, no isométrico: uma pedra por runa, na camada das entidades (a profundidade pela
 * linha na tela). De cima, a runa fica só no círculo do chão.
 */
export class RunasDePe {
  private readonly pedras = new Map<number, Graphics>();

  constructor(private readonly emPe: OpcoesEmPe | null) {}

  desenhar(estado: EstadoJogo, tMs: number): void {
    const proj = this.emPe?.projecao() ?? null;
    const vistas = new Set<number>();
    if (this.emPe && proj?.visao === 'iso') {
      for (const a of estado.armadilhas) {
        if (!a.runa) continue;
        vistas.add(a.id);
        let g = this.pedras.get(a.id);
        if (!g) {
          g = new Graphics();
          this.emPe.camada.addChild(g);
          this.pedras.set(a.id, g);
        }
        const c = centroDaCelula(a.x, a.y);
        const pt = proj.projetar(c.x, c.y);
        g.position.set(pt.x, pt.y);
        g.zIndex = pt.y;
        pedra(g.clear(), corDaArmadilha(a), a.inerteAteTick > estado.tick, 0.5 + 0.5 * Math.sin(tMs / 300 + a.id));
      }
    }
    for (const [id, g] of this.pedras) {
      if (vistas.has(id)) continue;
      g.destroy();
      this.pedras.delete(id);
    }
  }

  destruir(): void {
    for (const g of this.pedras.values()) g.destroy();
    this.pedras.clear();
  }
}

/** A pedra lascada, de pé, com o sinal entalhado aceso na cor do elemento. */
function pedra(g: Graphics, cor: number, inerte: boolean, pulso: number): void {
  g.ellipse(0, 0, 10, 4).fill({ color: 0x000000, alpha: 0.35 });
  const corpo = [-6, 0, -7, -14, -4, -24, 2, -27, 6, -20, 7, -2];
  g.poly(corpo).fill({ color: COR_PEDRA }).stroke({ width: 1, color: COR_ARESTA, alpha: 0.9 });
  g.poly([2, -27, 6, -20, 7, -2, 3, -1]).fill({ color: 0x000000, alpha: 0.25 });
  const luz = inerte ? COR_INERTE : cor;
  const alpha = inerte ? 0.4 : 0.6 + 0.4 * pulso;
  if (!inerte) g.circle(0, -13, 8).fill({ color: cor, alpha: 0.12 + 0.12 * pulso });
  g.moveTo(0, -22).lineTo(0, -6).stroke({ width: 1.6, color: luz, alpha });
  g.moveTo(-3, -18).lineTo(3, -13).lineTo(-3, -9).stroke({ width: 1.4, color: luz, alpha });
}

/** Cria o par de gráficos do chão (o normal e o de brilho, aditivo) na camada dada. */
export function graficosDoChao(camada: Container): { g: Graphics; brilho: Graphics } {
  const g = new Graphics();
  const brilho = new Graphics();
  brilho.blendMode = 'add';
  camada.addChild(g, brilho);
  return { g, brilho };
}
