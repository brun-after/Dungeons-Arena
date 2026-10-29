// Runas das classes (marco 26, 28/10/2026, D-116). Um símbolo por classe, desenhado em traços num quadro de 100 × 100
// (o desenho do usuário em runas_das_classes.svg), com a cor da classe. A mesma fonte desenha no DOM (ui/runa-dom.ts:
// seleção de classe, livros e skills de classe) e no Pixi (sobre a cabeça dos jogadores, render/sprites.ts).
// `coresDasRunas` dá cores diferentes aos jogadores da mesma classe, iguais em todos os clientes.

import type { Graphics } from 'pixi.js';
import type { Entidade } from '../entities/entidade';

/** Um traço da runa: linha por pontos (fechada ou não), curva quadrática ou círculo. */
export type Traco =
  | { t: 'linha'; p: readonly number[]; fechar?: boolean }
  | { t: 'curva'; de: readonly [number, number]; controle: readonly [number, number]; ate: readonly [number, number] }
  | { t: 'circulo'; x: number; y: number; r: number; cheio?: boolean };

/** A espessura do traço no quadro de 100. */
export const TRACO_RUNA = 5;

export interface Runa {
  cor: number;
  tracos: readonly Traco[];
}

export const RUNAS: Readonly<Record<string, Runa>> = {
  // Lâmina e aura de fúria.
  guerreiro: {
    cor: 0xc0392b,
    tracos: [
      { t: 'linha', p: [50, 14, 50, 86] },
      { t: 'linha', p: [30, 38, 70, 38] },
      { t: 'linha', p: [30, 38, 22, 20] },
      { t: 'linha', p: [70, 38, 78, 20] },
      { t: 'linha', p: [34, 62, 50, 78, 66, 62] },
    ],
  },
  // Círculo, três elementos, núcleo.
  mago: {
    cor: 0x4a7fd6,
    tracos: [
      { t: 'circulo', x: 50, y: 52, r: 30 },
      { t: 'linha', p: [50, 22, 24, 67, 76, 67], fechar: true },
      { t: 'linha', p: [50, 22, 50, 10] },
      { t: 'linha', p: [24, 67, 15, 72] },
      { t: 'linha', p: [76, 67, 85, 72] },
      { t: 'circulo', x: 50, y: 52, r: 3, cheio: true },
    ],
  },
  // Flecha e mira firme.
  arqueiro: {
    cor: 0xd4ac0d,
    tracos: [
      { t: 'linha', p: [50, 14, 50, 90] },
      { t: 'linha', p: [38, 28, 50, 14, 62, 28] },
      { t: 'circulo', x: 50, y: 56, r: 16 },
      { t: 'linha', p: [20, 56, 30, 56] },
      { t: 'linha', p: [70, 56, 80, 56] },
      { t: 'linha', p: [40, 90, 50, 80, 60, 90] },
    ],
  },
  // Mortos que se erguem.
  necromante: {
    cor: 0x8b68d9,
    tracos: [
      { t: 'curva', de: [22, 54], controle: [50, 92], ate: [78, 54] },
      { t: 'linha', p: [34, 64, 34, 34] },
      { t: 'linha', p: [50, 73, 50, 24] },
      { t: 'linha', p: [66, 64, 66, 34] },
      { t: 'circulo', x: 34, y: 28, r: 4 },
      { t: 'circulo', x: 50, y: 17, r: 4 },
      { t: 'circulo', x: 66, y: 28, r: 4 },
    ],
  },
  // Falcão preso ao punho.
  aventureiro: {
    cor: 0x3f9d8f,
    tracos: [
      { t: 'circulo', x: 50, y: 22, r: 7 },
      { t: 'linha', p: [50, 29, 50, 76] },
      { t: 'curva', de: [14, 34], controle: [34, 30], ate: [50, 76] },
      { t: 'curva', de: [86, 34], controle: [66, 30], ate: [50, 76] },
    ],
  },
};

export const runaDe = (classeId: string | null | undefined): Runa | null => (classeId ? (RUNAS[classeId] ?? null) : null);

/** Gira a matiz de uma cor (em graus), mantendo saturação e luminosidade. */
export function girarMatiz(cor: number, graus: number): number {
  const r = ((cor >> 16) & 0xff) / 255;
  const g = ((cor >> 8) & 0xff) / 255;
  const b = (cor & 0xff) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d !== 0) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (((h * 60 + graus) % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r1, g1, b1] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  const canal = (v: number) => Math.round((v + m) * 255);
  return (canal(r1) << 16) | (canal(g1) << 8) | canal(b1);
}

/** Os giros de matiz do 2º, 3º… jogador da mesma classe (bem separados entre si e da cor da classe). */
const GIROS = [180, 90, 270, 45, 225, 135, 315] as const;

/**
 * A cor da runa de cada jogador (pura e determinística): os jogadores de cada classe, em ordem de id; o primeiro fica
 * com a cor da classe, os seguintes com a matiz girada.
 */
export function coresDasRunas(entidades: readonly Entidade[]): Map<string, number> {
  const porClasse = new Map<string, string[]>();
  for (const e of entidades) {
    if (e.controlador === 'ia' || e.invocacao || !runaDe(e.classeId)) continue;
    const classe = e.classeId ?? '';
    const lista = porClasse.get(classe) ?? [];
    lista.push(e.id);
    porClasse.set(classe, lista);
  }
  const cores = new Map<string, number>();
  for (const [classe, ids] of porClasse) {
    const base = RUNAS[classe]?.cor ?? 0xffffff;
    [...ids].sort().forEach((id, i) => cores.set(id, i === 0 ? base : girarMatiz(base, GIROS[(i - 1) % GIROS.length] ?? 180)));
  }
  return cores;
}

function caminho(g: Graphics, runa: Runa, escala: number, ox: number, oy: number): void {
  const px = (v: number) => ox + v * escala;
  for (const tr of runa.tracos) {
    if (tr.t === 'circulo') {
      g.circle(px(tr.x), oy + tr.y * escala, tr.r * escala);
      continue;
    }
    if (tr.t === 'curva') {
      g.moveTo(px(tr.de[0]), oy + tr.de[1] * escala).quadraticCurveTo(px(tr.controle[0]), oy + tr.controle[1] * escala, px(tr.ate[0]), oy + tr.ate[1] * escala);
      continue;
    }
    g.moveTo(px(tr.p[0] ?? 0), oy + (tr.p[1] ?? 0) * escala);
    for (let i = 2; i + 1 < tr.p.length; i += 2) g.lineTo(px(tr.p[i] ?? 0), oy + (tr.p[i + 1] ?? 0) * escala);
    if (tr.fechar) g.closePath();
  }
}

/**
 * Desenha a runa centrada em (0, 0) com `tamanho` px de lado: um contorno escuro por baixo (legível sobre qualquer
 * chão) e o traço na cor. Os círculos cheios ganham preenchimento.
 */
export function desenharRuna(g: Graphics, classeId: string, cor: number, tamanho: number): void {
  const runa = runaDe(classeId);
  if (!runa) return;
  const escala = tamanho / 100;
  const o = -tamanho / 2;
  const largura = TRACO_RUNA * escala;
  caminho(g, runa, escala, o, o);
  g.stroke({ width: largura + 3, color: 0x0b0a10, alpha: 0.85, cap: 'round', join: 'round' });
  caminho(g, runa, escala, o, o);
  g.stroke({ width: largura, color: cor, cap: 'round', join: 'round' });
  for (const tr of runa.tracos) if (tr.t === 'circulo' && tr.cheio) g.circle(o + tr.x * escala, o + tr.y * escala, tr.r * escala).fill(cor);
}
