// A tocha que o personagem leva (marco 43, 15/11/2026, D-177): não é mais só o brilho em volta dele, é uma tocha de
// verdade (o cabo de madeira, a cabeça de pano com piche e a chama viva) que flutua à esquerda do personagem, um pouco
// acima da altura dos ombros, e acompanha para onde ele olha. A esquerda é a do personagem: olhando para a câmera,
// fica à direita da tela; olhando para o fundo, à esquerda; de lado, fica atrás do corpo (desenhada antes dele).

import { Graphics, type Container } from 'pixi.js';
import { chama } from './objetos-mundo';

/** Quanto a tocha se afasta do eixo do corpo (px) e a altura relativa ao topo do desenho (0,78: um pouco acima dos ombros). */
const AFASTAMENTO = 17;
const ALTURA_NO_CORPO = 0.78;

const ROTULO = 'tocha-portada';

function desenharTocha(g: Graphics, tMs: number, reduzido: boolean): void {
  const bob = reduzido ? 0 : Math.sin(tMs / 420) * 1.6;
  const inclina = reduzido ? 0 : Math.sin(tMs / 900) * 0.06;
  g.clear();
  g.rotation = inclina;
  // O cabo: madeira afinando para baixo, o lado da luz mais claro.
  g.poly([-2.2, bob - 2, 2.2, bob - 2, 1.3, bob + 15, -1.3, bob + 15]).fill(0x5a3a22).stroke({ width: 0.8, color: 0x1c120a });
  g.poly([0.4, bob - 2, 2.2, bob - 2, 1.3, bob + 15, 0.3, bob + 15]).fill({ color: 0x8a6040, alpha: 0.7 });
  // A cabeça: o pano enrolado (duas voltas escuras) e o piche em brasa por cima.
  g.roundRect(-3.2, bob - 7, 6.4, 6, 1.5).fill(0x3a2a1c).stroke({ width: 0.8, color: 0x140d08 });
  g.moveTo(-3.2, bob - 4.5).lineTo(3.2, bob - 3.5).stroke({ width: 0.8, color: 0x1c140c, alpha: 0.8 });
  g.ellipse(0, bob - 7, 3.2, 1.4).fill(0xff7a2a);
  chama(g, 0, bob - 7, 11, reduzido ? 0 : tMs);
}

/**
 * Mostra (ou esconde) a tocha na raiz do personagem. `direcao` é o olhar na tela (normalizado) e `topo` a altura do
 * desenho acima dos pés (negativo).
 */
export function atualizarTochaPortada(raiz: Container, acesa: boolean, direcao: { x: number; y: number }, topo: number, tMs: number, reduzido: boolean): void {
  let g = raiz.getChildByLabel(ROTULO) as Graphics | null;
  if (!acesa) {
    if (g) g.visible = false;
    return;
  }
  if (!g) {
    g = new Graphics({ label: ROTULO });
    raiz.addChild(g);
  }
  g.visible = true;
  // A esquerda do personagem na tela: o olhar girado de 90° (y para baixo); a profundidade vale metade no isométrico.
  // De lado, a esquerda apontaria só para o fundo (a tocha sumiria atrás da cabeça): um pouco para trás na tela também.
  const lx = direcao.y - direcao.x * 0.6;
  const ex = (lx < 0 ? -1 : 1) * Math.min(1, Math.max(0.6, Math.abs(lx)));
  const ey = -direcao.x * 0.5;
  g.position.set(ex * AFASTAMENTO, topo * ALTURA_NO_CORPO + ey * AFASTAMENTO);
  // Atrás do corpo quando a esquerda aponta para o fundo da tela.
  const atras = ey < -0.05;
  const indice = raiz.getChildIndex(g);
  const alvo = atras ? 0 : raiz.children.length - 1;
  if (indice !== alvo) raiz.setChildIndex(g, alvo);
  desenharTocha(g, tMs, reduzido);
}
