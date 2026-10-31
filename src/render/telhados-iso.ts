// Os telhados das casas fechadas (marco 31, 31/10/2026, D-130). Um telhado de duas águas sobre o retângulo da casa,
// na altura das paredes (`visual.paredeIso.altura`), com a cumeeira de oeste a leste e o oitão na face leste. De cima,
// o mesmo telhado chato (as duas águas em tons diferentes e a cumeeira). Na camada das entidades, logo à frente da
// diagonal da última célula da casa: cobre quem está dentro e fica atrás de quem passa ao sul.
// - `perto`: o telhado some (quase todo) quando o jogador chega a `telhadoPerto` células da casa;
// - `dentro`: some só quando ele entra; enquanto isso, quem está dentro fica escondido (`oculto`).
// Só visual: as regras e a área de interesse não mudam.

import { Graphics, type Container } from 'pixi.js';
import type { Fase, Telhado } from '../world/fase';
import { CELULA_PX } from './camera-calculo';
import { clarear, escurecer } from './modelos/svg';
import { profundidade, type Projecao } from './projecao';

const CORES: Readonly<Record<Telhado['estilo'], number>> = { telha: 0x6b3a2a, palha: 0x4d4434 };
/** Quanto o beiral passa da parede, em células. */
const BEIRAL = 0.2;
/** A altura da cumeeira acima das paredes, por célula de profundidade da casa. */
const CUMEEIRA = 0.32;
/** Fiadas de telha por água. */
const FIADAS = 4;
/** O alfa do telhado `perto` aberto (um resto, para lembrar que é uma casa). */
const ALFA_ABERTO = 0.12;
const VELOCIDADE_FADE = 8;

/** Dentro da casa: entre as paredes (posição em células, a mesma das entidades). */
export function dentroDoTelhado(t: Telhado, x: number, y: number): boolean {
  return x >= t.x + 0.5 && x <= t.x + t.largura - 1.5 && y >= t.y + 0.5 && y <= t.y + t.altura - 1.5;
}

/** O alfa alvo do telhado para o jogador em (x, y) (null: sem jogador, fechado). Puro. */
export function alfaDoTelhado(t: Telhado, jogador: { x: number; y: number } | null, perto: number): number {
  if (!jogador) return 1;
  if (t.revela === 'dentro') return dentroDoTelhado(t, jogador.x, jogador.y) ? 0 : 1;
  const dx = Math.max(t.x - jogador.x, 0, jogador.x - (t.x + t.largura - 1));
  const dy = Math.max(t.y - jogador.y, 0, jogador.y - (t.y + t.altura - 1));
  return Math.max(dx, dy) <= perto ? ALFA_ABERTO : 1;
}

export interface Telhados {
  /** O fade de cada telhado pelo jogador local (em células). */
  atualizar: (jogador: { x: number; y: number } | null, dtMs: number) => void;
  /** Quem está em (x, y) fica escondido (dentro de uma casa `dentro` fechada)? */
  oculto: (x: number, y: number) => boolean;
  destruir: () => void;
}

export interface OpcoesTelhados {
  /** Altura das paredes, em células (o isométrico; de cima, o telhado é chato). */
  altura: number;
  perto: number;
}

export function criarTelhados(camada: Container, fase: Fase, p: Projecao, o: OpcoesTelhados): Telhados {
  const iso = p.visao === 'iso';
  const itens = (fase.telhados ?? []).map((t) => {
    const g = new Graphics();
    desenhar(g, t, p, iso ? o.altura * CELULA_PX : 0, iso);
    g.zIndex = profundidade(p, t.x + t.largura - 1, t.y + t.altura - 1) + 0.005;
    g.label = `telhado-${t.x}-${t.y}`;
    camada.addChild(g);
    return { t, g, fechado: true };
  });
  return {
    atualizar: (jogador, dtMs) => {
      const passo = Math.min(1, (VELOCIDADE_FADE * dtMs) / 1000);
      for (const i of itens) {
        const alvo = alfaDoTelhado(i.t, jogador, o.perto);
        i.fechado = alvo === 1;
        if (i.g.alpha !== alvo) i.g.alpha = Math.abs(alvo - i.g.alpha) < 0.01 ? alvo : i.g.alpha + (alvo - i.g.alpha) * passo;
      }
    },
    oculto: (x, y) => itens.some((i) => i.fechado && i.t.revela === 'dentro' && dentroDoTelhado(i.t, x, y)),
    destruir: () => {
      for (const i of itens) i.g.destroy();
      itens.length = 0;
    },
  };
}

/** As duas águas (norte e sul), as fiadas de telha e, no isométrico, o oitão leste. */
function desenhar(g: Graphics, t: Telhado, p: Projecao, h: number, iso: boolean): void {
  const cor = CORES[t.estilo];
  const x0 = t.x - BEIRAL;
  const x1 = t.x + t.largura + BEIRAL;
  const y0 = t.y - BEIRAL;
  const y1 = t.y + t.altura + BEIRAL;
  const ym = t.y + t.altura / 2;
  const subida = iso ? t.altura * CUMEEIRA * CELULA_PX : 0;
  // Um ponto do telhado: (x, y) em células, a `z` px acima do chão.
  const pt = (x: number, y: number, z: number) => {
    const q = p.projetar(x * CELULA_PX, y * CELULA_PX);
    return { x: q.x, y: q.y - z };
  };
  const agua = (yBeiral: number, tom: number) => {
    const a = pt(x0, yBeiral, h);
    const b = pt(x1, yBeiral, h);
    const c = pt(x1, ym, h + subida);
    const d = pt(x0, ym, h + subida);
    g.poly([a.x, a.y, b.x, b.y, c.x, c.y, d.x, d.y]).fill(tom);
    // As fiadas: linhas paralelas à cumeeira.
    for (let k = 1; k < FIADAS; k++) {
      const f = k / FIADAS;
      const e = pt(x0, yBeiral + (ym - yBeiral) * f, h + subida * f);
      const s = pt(x1, yBeiral + (ym - yBeiral) * f, h + subida * f);
      g.moveTo(e.x, e.y).lineTo(s.x, s.y).stroke({ width: 1.2, color: escurecer(tom, 0.35), alpha: 0.6 });
    }
  };
  if (iso) {
    // O oitão leste: o triângulo de parede sob a cumeeira (antes das águas: o beiral passa por cima).
    const a = pt(t.x + t.largura, t.y, h);
    const b = pt(t.x + t.largura, t.y + t.altura, h);
    const c = pt(t.x + t.largura, ym, h + subida);
    g.poly([a.x, a.y, b.x, b.y, c.x, c.y]).fill(escurecer(0x6f665c, 0.4));
  }
  agua(y0, escurecer(cor, 0.25));
  agua(y1, cor);
  const e = pt(x0, ym, h + subida);
  const s = pt(x1, ym, h + subida);
  g.moveTo(e.x, e.y).lineTo(s.x, s.y).stroke({ width: 2, color: clarear(cor, 0.15), alpha: 0.8 });
}
