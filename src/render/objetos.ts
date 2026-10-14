// Objetos coletáveis no chão (§2.16, camada "objetos"): orbes de HP (verde) e de recurso (azul),
// com um pulso leve, orbes de efeito na cor do registro (marco 8A) e itens (marco 6) como losango
// na cor da raridade (§2.10). Só lê o estado.

import { Graphics, type Container } from 'pixi.js';
import { REGISTRO_EFEITOS } from '../combat/registro-efeitos';
import type { EstadoJogo } from '../core/estado';
import type { Raridade } from '../modos/modo';
import { CELULA_PX } from './camera-calculo';

const COR_ORBE: Readonly<Record<'orbe_hp' | 'orbe_recurso', number>> = {
  orbe_hp: 0x2ecc71,
  orbe_recurso: 0x5dade2,
};

/** Cores de raridade da §2.10. */
export const COR_RARIDADE: Readonly<Record<Raridade, number>> = {
  comum: 0x888888,
  incomum: 0x2ecc71,
  raro: 0x3498db,
  epico: 0x9b59b6,
  lendario: 0xf39c12,
};

export class CamadaObjetos {
  private readonly g = new Graphics();

  /** `raridadeDe` traduz o item do chão para a cor; item desconhecido aparece como comum. */
  constructor(
    camada: Container,
    private readonly raridadeDe: (itemId: string) => Raridade | undefined = () => undefined,
  ) {
    camada.addChild(this.g);
  }

  desenhar(estado: EstadoJogo, agoraMs: number, movimentoReduzido: boolean): void {
    const g = this.g.clear();
    const pulso = movimentoReduzido ? 0 : Math.sin(agoraMs / 260) * 2;
    for (const o of estado.objetos) {
      const cx = (o.x + 0.5) * CELULA_PX;
      const cy = (o.y + 0.5) * CELULA_PX;
      if (o.tipo === 'item') {
        const cor = COR_RARIDADE[(o.itemId && this.raridadeDe(o.itemId)) || 'comum'];
        const r = 11;
        g.circle(cx, cy, 16 + pulso).fill({ color: cor, alpha: 0.2 });
        g.poly([cx, cy - r, cx + r, cy, cx, cy + r, cx - r, cy]).fill(cor).stroke({ width: 2, color: 0xffffff, alpha: 0.9 });
        continue;
      }
      if (o.tipo === 'orbe_efeito') {
        const cor = o.efeito ? Number.parseInt(REGISTRO_EFEITOS[o.efeito.tipo].cor.slice(1), 16) : 0xffffff;
        g.circle(cx, cy, 15 + pulso).fill({ color: cor, alpha: 0.22 });
        g.circle(cx, cy, 9).fill(cor).stroke({ width: 3, color: 0xffffff, alpha: 0.95 });
        g.circle(cx, cy, 3).fill(0xffffff);
        continue;
      }
      g.circle(cx, cy, 14 + pulso).fill({ color: COR_ORBE[o.tipo], alpha: 0.18 });
      g.circle(cx, cy, 8).fill(COR_ORBE[o.tipo]).stroke({ width: 2, color: 0xffffff, alpha: 0.8 });
    }
  }

  destruir(): void {
    this.g.destroy();
  }
}
