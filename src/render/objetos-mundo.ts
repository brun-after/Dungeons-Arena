// O desenho dos objetos do Mundo (marco 29, 30/10/2026, D-128): os NPCs da vila (a cor da roupa pelo papel), os nós
// de coleta (rocha com veio para minério e cristal, planta para ervas e flores; o nó colhido fica apagado), o túmulo,
// as pedras de save e de portal (com brilho que pulsa) e o arco da porta das estruturas. Desenha em volta de (cx, cy),
// com a base no chão: serve de cima (o chão) e em pé (o isométrico), como os outros objetos. As lojas dos NPCs são
// objetos `loja` e ganham o vendedor por cima (`desenharVendedor`).

import type { Graphics } from 'pixi.js';
import type { ObjetoNoMundo } from '../core/estado';

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

function pedra(g: Graphics, cx: number, cy: number, brilho: number, pulso: number): void {
  g.ellipse(cx, cy, 14, 6).fill({ color: brilho, alpha: 0.18 + pulso * 0.03 });
  g.poly([cx - 8, cy, cx - 6, cy - 26, cx, cy - 32, cx + 6, cy - 26, cx + 8, cy]).fill(0x4d4a57).stroke({ width: 1.4, color: 0x1f1d24 });
  g.poly([cx - 3, cy - 10, cx, cy - 22, cx + 3, cy - 10]).fill({ color: brilho, alpha: 0.85 });
  g.circle(cx, cy - 26, 5 + pulso / 2).fill({ color: brilho, alpha: 0.25 });
}

function porta(g: Graphics, cx: number, cy: number): void {
  g.roundRect(cx - 9, cy - 22, 18, 22, 9).fill(0x1a120c).stroke({ width: 2, color: 0x6d5a40 });
  g.rect(cx - 9, cy - 2, 18, 2).fill(0x6d5a40);
}

/** Desenha o objeto do Mundo com a base em (cx, cy); devolve false se o tipo não é do Mundo. */
export function desenharObjetoDoMundo(g: Graphics, o: ObjetoNoMundo, cx: number, cy: number, pulso: number): boolean {
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
      pedra(g, cx, cy, 0x6fd3ff, pulso);
      return true;
    case 'pedra_portal':
      pedra(g, cx, cy, 0xc77dff, pulso);
      return true;
    case 'porta_estrutura':
      // Marco 30 (D-129): a porta escondida não aparece (quem chega perto acha pelo prompt e pela descoberta).
      if (!o.escondido) porta(g, cx, cy);
      return true;
    default:
      return false;
  }
}
