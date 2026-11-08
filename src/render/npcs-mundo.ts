// As figuras dos NPCs do Mundo (marco 38, 08/11/2026, D-142), com os personagens pré-renderizados (render/
// personagens-3d.ts) no lugar dos bonecos desenhados:
// - a balconista da taverna e o banqueiro ficam atrás de um balcão de madeira (o balcão cobre as pernas);
// - o andarilho tem a cara do preset que o reino pede (o slime que só quer conversar) e um balão com "!" em cima;
// - o mercador errante anda pelas estradas com uma mochila enorme nas costas (panelas, um rolo de cobertor e a
//   lanterna), deslizando entre as células em vez de pular.
// Só desenho; o que muda no jogo fica em mundo/.

import type { Graphics } from 'pixi.js';
import type { ObjetoNoMundo } from '../core/estado';
import { PREFIXO_ANDARILHO, REF_ERRANTE } from '../mundo/objetos-mundo';

export interface FiguraDeNpc {
  /** O atlas (render/personagens-3d.ts). */
  atlas: string;
  balcao: boolean;
  mochila: boolean;
  aviso: boolean;
}

/** Quem atende atrás de um balcão (os outros papéis da vila já têm a loja ou a pedra). */
const COM_BALCAO: ReadonlySet<string> = new Set(['missoes', 'banco']);

/** A figura do objeto, ou null (o objeto se desenha como antes). */
export function figuraDoNpc(o: ObjetoNoMundo): FiguraDeNpc | null {
  if (o.tipo === 'loja' && o.ref === REF_ERRANTE) return { atlas: 'vendedor', balcao: false, mochila: true, aviso: false };
  if (o.tipo !== 'npc' || !o.ref) return null;
  if (COM_BALCAO.has(o.ref)) return { atlas: 'vendedor', balcao: true, mochila: false, aviso: false };
  if (o.ref.startsWith(PREFIXO_ANDARILHO)) {
    const aparencia = o.itemId ?? 'gente';
    return { atlas: aparencia === 'gente' ? 'vendedor' : aparencia, balcao: false, mochila: false, aviso: true };
  }
  return null;
}

/** O balcão na frente de quem atende, com os pés em (0, 0): o tampo, a frente em tábuas e a caneca (ou o livro). */
export function desenharBalcao(g: Graphics, papel: string): void {
  g.ellipse(0, 10, 26, 8).fill({ color: 0x000000, alpha: 0.3 });
  g.poly([-24, 2, 24, 2, 24, 16, -24, 16]).fill(0x4a2f1b).stroke({ width: 1.2, color: 0x241509 });
  for (const x of [-12, 0, 12]) g.moveTo(x, 4).lineTo(x, 16).stroke({ width: 1, color: 0x2e1c0e, alpha: 0.7 });
  g.poly([-27, -2, 27, -2, 24, 3, -24, 3]).fill(0x7a5233).stroke({ width: 1, color: 0x3a2615 });
  if (papel === 'banco') {
    // O guichê: as grades de ferro e a balança de moedas.
    for (const x of [-18, -10, 10, 18]) g.moveTo(x, -2).lineTo(x, -30).stroke({ width: 1.4, color: 0x8b949e });
    g.moveTo(-20, -30).lineTo(20, -30).stroke({ width: 2, color: 0x8b949e });
    g.ellipse(14, -4, 4, 1.6).fill(0xe3b23c);
    g.ellipse(14, -6, 4, 1.6).fill(0xf1c84f);
  } else {
    g.roundRect(12, -10, 6, 8, 1.5).fill(0xd9a441).stroke({ width: 1, color: 0x4a2f1b });
    g.rect(12, -11, 6, 2).fill(0xf6efe0);
    g.roundRect(-20, -6, 10, 4, 1).fill(0x6b4a8a);
  }
}

/** A mochila enorme do errante, nas costas, com o topo bem acima da cabeça (`altura`: px do pé ao topo da figura). */
export function desenharMochila(g: Graphics, altura: number): void {
  const base = -altura * 0.35;
  const topo = -altura * 1.25;
  g.roundRect(-15, topo, 30, base - topo, 7).fill(0x6b4b2c).stroke({ width: 1.4, color: 0x2e1f10 });
  g.roundRect(-12, topo + 6, 24, 9, 3).fill(0x7d5a37);
  // O rolo de cobertor em cima e a panela pendurada de lado.
  g.roundRect(-17, topo - 8, 34, 10, 5).fill(0x8a3b2f).stroke({ width: 1, color: 0x3d1812 });
  g.moveTo(-10, topo - 8).lineTo(-10, topo + 2).moveTo(10, topo - 8).lineTo(10, topo + 2).stroke({ width: 1.2, color: 0x2e1f10 });
  g.circle(17, (topo + base) / 2, 6).fill(0x5c6168).stroke({ width: 1, color: 0x2a2d31 });
  g.moveTo(17, (topo + base) / 2 - 6).lineTo(17, (topo + base) / 2 - 10).stroke({ width: 1, color: 0x2a2d31 });
  // A lanterna acesa.
  g.circle(-18, base - 6, 7).fill({ color: 0xffc66b, alpha: 0.22 });
  g.roundRect(-21, base - 10, 6, 8, 1.5).fill(0xffd27a).stroke({ width: 1, color: 0x3a2615 });
}

/** O balão com "!" sobre a cabeça do andarilho (`topo`: px acima dos pés). */
export function desenharAviso(g: Graphics, topo: number, pulso: number): void {
  const y = -topo - 14 - pulso;
  g.roundRect(-8, y - 10, 16, 16, 5).fill(0xfff4d6).stroke({ width: 1.4, color: 0x7a5a1a });
  g.poly([-3, y + 6, 3, y + 6, 0, y + 11]).fill(0xfff4d6);
  g.rect(-1.3, y - 7, 2.6, 7).fill(0xc8901a);
  g.circle(0, y + 3, 1.6).fill(0xc8901a);
}

/** A direção do atlas (0 = +x, girando 45° para +y) do passo (dx, dy) na grade; parado, de frente para a câmera. */
export function direcaoDoPasso(dx: number, dy: number): number {
  if (Math.abs(dx) < 1e-3 && Math.abs(dy) < 1e-3) return 1;
  return ((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) % 8) + 8) % 8;
}
