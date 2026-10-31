// As armas de arremesso em voo (marco 32, 31/10/2026, D-131). O projétil do básico de uma arma de arremesso (golpe
// `arremesso`: chakram, shuriken, machadinha, bumerangue…) é desenhado com o modelo da própria arma, no grau dela,
// girando no ar; a adaga e o arpeu voam de ponta. Antes, todas iam ao alvo com o mesmo brilho. Só apresentação.

import { Container, Sprite } from 'pixi.js';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { msDe } from '../core/tempo';
import type { Arma3d } from './adornos';
import { CELULA_PX } from './camera-calculo';
import { golpeDaAcao } from './golpe-visual';
import { ALTURA_NO_AR } from './particulas';
import type { AtlasDePersonagens } from './personagens-3d';
import { centroDaCelula, type Projecao } from './projecao';

/** As que voam de ponta (sem girar). */
const DE_PONTA: ReadonlySet<string> = new Set(['adaga', 'arpeu']);
/** Voltas por segundo das que giram. */
const VOLTAS_POR_S = 3;
/** Os atlas das armas são de 72 px por célula; o jogo desenha a 48. */
const ESCALA = CELULA_PX / 72;

/** O que o desenho sabe do dono de um projétil: o modelo (a arma de classe) e a arma 3D na mão. */
export interface DonoDoProjetil {
  modelo: string;
  arma: Arma3d | null;
}

export class ArmasEmVoo {
  private readonly sprites = new Map<number, Sprite>();

  constructor(private readonly camada: Container) {}

  desenhar(
    estado: EstadoJogo,
    ctx: ContextoSimulacao,
    alpha: number,
    agoraMs: number,
    proj: Projecao,
    atlas: AtlasDePersonagens | null,
    donoDe: (id: string) => DonoDoProjetil | null,
  ): void {
    const vistos = new Set<number>();
    for (const p of estado.projeteis) {
      const dono = estado.entidades.find((e) => e.id === p.donoId);
      const d = donoDe(p.donoId);
      if (!atlas || !dono || !d?.arma || golpeDaAcao(ctx, dono, p.chave, d.modelo) !== 'arremesso') continue;
      const t = atlas.arma(d.arma.modelo, d.arma.grau);
      if (!t) continue;
      vistos.add(p.id);
      let s = this.sprites.get(p.id);
      if (!s) {
        s = new Sprite();
        this.sprites.set(p.id, s);
        this.camada.addChild(s);
      }
      // A posição do tick, adiantada pelo quanto do próximo tick já passou.
      const avanco = (p.velocidade * msDe(alpha)) / 1000;
      const x = p.x + p.dirX * avanco;
      const y = p.y + p.dirY * avanco;
      const c = centroDaCelula(x, y);
      const pt = proj.projetar(c.x, c.y);
      const altura = proj.visao === 'iso' ? ALTURA_NO_AR * CELULA_PX : 0;
      s.texture = t.textura;
      s.anchor.set(0.5);
      s.position.set(pt.x, pt.y - altura);
      s.zIndex = pt.y + 1;
      s.scale.set(ESCALA);
      if (DE_PONTA.has(d.arma.modelo)) {
        const c2 = centroDaCelula(x + p.dirX, y + p.dirY);
        const frente = proj.projetar(c2.x, c2.y);
        s.rotation = Math.atan2(frente.x - pt.x, -(frente.y - pt.y));
      } else s.rotation = ((agoraMs / 1000) * VOLTAS_POR_S * 2 * Math.PI) % (2 * Math.PI);
    }
    for (const [id, s] of this.sprites) {
      if (vistos.has(id)) continue;
      s.destroy();
      this.sprites.delete(id);
    }
  }

  destruir(): void {
    for (const s of this.sprites.values()) s.destroy();
    this.sprites.clear();
  }
}
