// O desenho dos objetos do Mundo (marco 29, 30/10/2026, D-128): os NPCs da vila (a cor da roupa pelo papel), os nós
// de coleta (rocha com veio para minério e cristal, planta para ervas e flores; o nó colhido fica apagado), o túmulo,
// as pedras de save e de portal (com brilho que pulsa) e o arco da porta das estruturas. Desenha em volta de (cx, cy),
// com a base no chão: serve de cima (o chão) e em pé (o isométrico), como os outros objetos. As lojas dos NPCs são
// objetos `loja` e ganham o vendedor por cima (`desenharVendedor`).

import type { Graphics } from 'pixi.js';
import type { ObjetoNoMundo } from '../core/estado';
import { portalEmPe } from './molduras-portal';

const ROUPA_DO_PAPEL: Readonly<Record<string, number>> = {
  mercador: 0xc9a227,
  ferreiro: 0x8a4b2a,
  alquimista: 0x4f9a5a,
  missoes: 0x3d6fb3,
  // Marco 30 (D-129): o banqueiro e o mercador do reino.
  banco: 0x2e4a62,
  mercado: 0x9a3d6a,
};
const PELE = 0xe0b48a;
const PEDRA = 0x6f6a64;
const PEDRA_CLARA = 0x8d877f;

/** Uma pessoa simples de pé: corpo em trapézio, cabeça e um chapéu na cor do papel. */
function pessoa(g: Graphics, cx: number, cy: number, roupa: number): void {
  g.ellipse(cx, cy, 11, 5).fill({ color: 0x000000, alpha: 0.28 });
  g.poly([cx - 8, cy, cx + 8, cy, cx + 5, cy - 18, cx - 5, cy - 18]).fill(roupa).stroke({ width: 1.2, color: 0x1b1712, alpha: 0.7 });
  g.circle(cx, cy - 23, 5.5).fill(PELE).stroke({ width: 1, color: 0x1b1712, alpha: 0.6 });
  g.poly([cx - 7, cy - 26, cx + 7, cy - 26, cx, cy - 34]).fill(roupa);
}

/** O vendedor atrás do balcão da loja (mercador, ferreiro ou alquimista). */
/**
 * Ajuste de 31/10/2026 (D-130): o vendedor da loja em tamanho de gente (~1,1 célula), com os pés em (0, 0): avental,
 * braços e capuz na cor do papel (o mercador da campanha, sem papel, usa o dourado). Provisório até o marco 32.
 */
export function desenharVendedorDeLoja(g: Graphics, papel: string): void {
  const roupa = ROUPA_DO_PAPEL[papel] ?? ROUPA_DO_PAPEL.mercador ?? 0xc9a227;
  const escura = 0x2a221b;
  g.poly([-9, 0, -3, 0, -3, -22, -9, -22]).fill(escura);
  g.poly([3, 0, 9, 0, 9, -22, 3, -22]).fill(escura);
  g.poly([-13, -20, 13, -20, 10, -44, -10, -44]).fill(roupa).stroke({ width: 1.2, color: 0x1b1712, alpha: 0.7 });
  g.poly([-8, -22, 8, -22, 6, -40, -6, -40]).fill(0xb9ac8f);
  g.poly([-13, -42, -18, -26, -14, -24, -9, -38]).fill(roupa);
  g.poly([13, -42, 18, -26, 14, -24, 9, -38]).fill(roupa);
  g.circle(-16, -24, 3).fill(PELE);
  g.circle(16, -24, 3).fill(PELE);
  g.circle(0, -50, 7).fill(PELE).stroke({ width: 1, color: 0x1b1712, alpha: 0.6 });
  g.poly([-9, -50, -7, -58, 0, -61, 7, -58, 9, -50, 6, -55, -6, -55]).fill(roupa);
  g.rect(-4, -49, 8, 2).fill({ color: 0x3a2a1e, alpha: 0.8 });
}

export function desenharVendedor(g: Graphics, o: ObjetoNoMundo, cx: number, cy: number): void {
  const roupa = ROUPA_DO_PAPEL[o.ref ?? ''];
  if (roupa === undefined) return;
  pessoa(g, cx + 10, cy - 6, roupa);
}

function minerio(g: Graphics, cx: number, cy: number, veio: number): void {
  g.ellipse(cx, cy, 14, 6).fill({ color: 0x000000, alpha: 0.25 });
  g.poly([cx - 13, cy, cx - 9, cy - 13, cx + 2, cy - 17, cx + 12, cy - 9, cx + 13, cy]).fill(PEDRA).stroke({ width: 1.2, color: 0x2d2a27 });
  g.poly([cx - 6, cy - 10, cx + 3, cy - 14, cx + 8, cy - 7]).fill(PEDRA_CLARA);
  for (const [dx, dy] of [[-5, -6], [3, -10], [7, -4]] as const) g.poly([cx + dx, cy + dy, cx + dx + 3, cy + dy - 4, cx + dx + 5, cy + dy]).fill(veio);
}

function planta(g: Graphics, cx: number, cy: number, flor: number): void {
  g.ellipse(cx, cy, 10, 4).fill({ color: 0x000000, alpha: 0.22 });
  for (const ang of [-0.9, -0.3, 0.3, 0.9]) {
    const fx = cx + Math.sin(ang) * 11;
    const fy = cy - Math.cos(ang) * 13;
    g.moveTo(cx, cy).quadraticCurveTo(cx + Math.sin(ang) * 4, cy - 8, fx, fy);
  }
  g.stroke({ width: 2.2, color: 0x3f7a35 });
  for (const [dx, dy] of [[-6, -12], [6, -13], [0, -16]] as const) g.circle(cx + dx, cy + dy, 3).fill(flor);
}

const COR_DO_MATERIAL: Readonly<Record<string, number>> = {
  minerio_ferro: 0xb87333,
  minerio_prata: 0xdfe6ee,
  cristal_arcano: 0x9b6bff,
  erva_curativa: 0xe9f5a0,
  erva_lunar: 0xbcd7ff,
  flor_de_fogo: 0xff7a2f,
};

function noDeColeta(g: Graphics, o: ObjetoNoMundo, cx: number, cy: number): void {
  const id = o.itemId ?? '';
  const cor = COR_DO_MATERIAL[id] ?? 0xd8c8a0;
  const colhido = o.abertoTick > 0;
  const rocha = id.startsWith('minerio') || id.startsWith('cristal');
  if (rocha) minerio(g, cx, cy, colhido ? PEDRA_CLARA : cor);
  else planta(g, cx, cy, colhido ? 0x5c6b4a : cor);
  if (colhido) g.ellipse(cx, cy - 6, 15, 12).fill({ color: 0x10151c, alpha: 0.35 });
}

function tumulo(g: Graphics, cx: number, cy: number): void {
  g.ellipse(cx, cy, 14, 5).fill({ color: 0x3b2f22, alpha: 0.6 });
  g.roundRect(cx - 8, cy - 22, 16, 22, 7).fill(PEDRA).stroke({ width: 1.4, color: 0x2d2a27 });
  g.rect(cx - 1.2, cy - 18, 2.4, 11).fill(0x2d2a27);
  g.rect(cx - 5, cy - 15, 10, 2.4).fill(0x2d2a27);
}

/**
 * Marco 38 (08/11/2026, D-142): a pedra de save é um obelisco de três blocos num degrau redondo, com runas acesas
 * nas faces e um cristal que flutua e gira acima da ponta. O anel do degrau pulsa na cor da pedra.
 */
function pedraDeSave(g: Graphics, cx: number, cy: number, brilho: number, pulso: number, tMs: number): void {
  g.ellipse(cx, cy, 20, 8).fill({ color: 0x000000, alpha: 0.32 });
  g.ellipse(cx, cy - 1, 18, 7).fill(0x3a3741).stroke({ width: 1.2, color: 0x1f1d24 });
  g.ellipse(cx, cy - 3, 14, 5.4).fill(0x4d4a57).stroke({ width: 1, color: brilho, alpha: 0.35 + pulso * 0.08 });
  // Os três blocos do obelisco, cada um um pouco mais estreito.
  const blocos: readonly (readonly [number, number, number])[] = [[7.5, 0, 12], [6.2, 12, 11], [5, 23, 10]];
  for (const [w, de, alto] of blocos) {
    const y0 = cy - 3 - de;
    g.poly([cx - w, y0, cx - w + 0.8, y0 - alto, cx + w - 0.8, y0 - alto, cx + w, y0]).fill(0x57535f).stroke({ width: 1.1, color: 0x1f1d24 });
    g.poly([cx, y0, cx, y0 - alto, cx + w - 0.8, y0 - alto, cx + w, y0]).fill({ color: 0x000000, alpha: 0.18 });
  }
  g.poly([cx - 4.2, cy - 36, cx, cy - 42, cx + 4.2, cy - 36]).fill(0x6a6573).stroke({ width: 1, color: 0x1f1d24 });
  // As runas nas faces.
  for (const y of [cy - 9, cy - 20, cy - 30]) {
    g.moveTo(cx - 2.5, y + 2).lineTo(cx, y - 2).lineTo(cx + 2.5, y + 2).stroke({ width: 1.4, color: brilho, alpha: 0.75 + pulso * 0.05 });
  }
  // O cristal que flutua acima da ponta (um losango que gira, o brilho em volta).
  const sobe = Math.sin(tMs / 520) * 2;
  const larg = 3.6 * Math.abs(Math.cos(tMs / 700)) + 1.2;
  const yc = cy - 50 + sobe;
  g.circle(cx, yc, 8 + pulso).fill({ color: brilho, alpha: 0.18 });
  g.poly([cx, yc - 6, cx + larg, yc, cx, yc + 6, cx - larg, yc]).fill({ color: brilho, alpha: 0.95 }).stroke({ width: 1, color: 0xffffff, alpha: 0.7 });
}

/**
 * Marco 38 (D-142): o portal entre reinos é um arco de pedra com runas em órbita (a moldura dos portais das fases,
 * render/molduras-portal.ts) num tablado de duas pedras, com o vórtice girando na cor do portal.
 */
function portalDoReino(g: Graphics, cx: number, cy: number, cor: number, tMs: number): void {
  g.ellipse(cx, cy + 1, 26, 9).fill({ color: 0x000000, alpha: 0.32 });
  g.ellipse(cx, cy, 24, 8).fill(0x3a3741).stroke({ width: 1.2, color: 0x1f1d24 });
  g.ellipse(cx, cy - 2, 20, 6.5).fill(0x4d4a57).stroke({ width: 1, color: cor, alpha: 0.5 });
  portalEmPe(g, cx, cy - 3, { estilo: 'psiquico', cor, tMs, aceso: true });
}

function porta(g: Graphics, cx: number, cy: number): void {
  g.roundRect(cx - 9, cy - 22, 18, 22, 9).fill(0x1a120c).stroke({ width: 2, color: 0x6d5a40 });
  g.rect(cx - 9, cy - 2, 18, 2).fill(0x6d5a40);
}

/** Desenha o objeto do Mundo com a base em (cx, cy); devolve false se o tipo não é do Mundo. `tMs` 0: parado. */
export function desenharObjetoDoMundo(g: Graphics, o: ObjetoNoMundo, cx: number, cy: number, pulso: number, tMs = 0): boolean {
  switch (o.tipo) {
    case 'npc':
      pessoa(g, cx, cy, ROUPA_DO_PAPEL[o.ref ?? ''] ?? 0x777777);
      return true;
    case 'coleta':
      noDeColeta(g, o, cx, cy);
      return true;
    case 'tumulo':
      tumulo(g, cx, cy);
      return true;
    case 'pedra_save':
      pedraDeSave(g, cx, cy, 0x6fd3ff, pulso, tMs);
      return true;
    case 'pedra_portal':
      portalDoReino(g, cx, cy, 0xc77dff, tMs);
      return true;
    case 'porta_estrutura':
      // Marco 30 (D-129): a porta escondida não aparece (quem chega perto acha pelo prompt e pela descoberta).
      if (!o.escondido) porta(g, cx, cy);
      return true;
    default:
      return false;
  }
}
