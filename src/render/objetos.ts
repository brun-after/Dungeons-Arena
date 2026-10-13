// Objetos coletáveis no chão (§2.16, camada "objetos"): orbes de HP (verde) e de recurso (azul),
// com um pulso leve. Só lê o estado.

import { Graphics, type Container } from 'pixi.js';
import type { EstadoJogo } from '../core/estado';
import { CELULA_PX } from './camera-calculo';

const COR: Readonly<Record<'orbe_hp' | 'orbe_recurso', number>> = {
  orbe_hp: 0x2ecc71,
  orbe_recurso: 0x5dade2,
};

export class CamadaObjetos {
  private readonly g = new Graphics();

  constructor(camada: Container) {
    camada.addChild(this.g);
  }

  desenhar(estado: EstadoJogo, agoraMs: number, movimentoReduzido: boolean): void {
    const g = this.g.clear();
    const pulso = movimentoReduzido ? 0 : Math.sin(agoraMs / 260) * 2;
    for (const o of estado.objetos) {
      const cx = (o.x + 0.5) * CELULA_PX;
      const cy = (o.y + 0.5) * CELULA_PX;
      g.circle(cx, cy, 14 + pulso).fill({ color: COR[o.tipo], alpha: 0.18 });
      g.circle(cx, cy, 8).fill(COR[o.tipo]).stroke({ width: 2, color: 0xffffff, alpha: 0.8 });
    }
  }

  destruir(): void {
    this.g.destroy();
  }
}
