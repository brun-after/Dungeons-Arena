// Camada dos efeitos de fluxo próprio (§2.8, §2.11). Marco 8A-2 (14/10/2026). Só lê o estado:
// células de rastro na cor do efeito, armadilhas só do jogador local (invisíveis para os outros)
// e um anel de contagem sobre quem tem efeito atrasado a caminho.

import { Graphics, type Container } from 'pixi.js';
import { REGISTRO_EFEITOS } from '../combat/registro-efeitos';
import type { EstadoJogo } from '../core/estado';
import { CELULA_PX } from './camera-calculo';

const cor = (hex: string) => Number.parseInt(hex.slice(1), 16);

export class CamadaFluxo {
  private readonly g = new Graphics();

  constructor(camada: Container) {
    camada.addChild(this.g);
  }

  desenhar(estado: EstadoJogo, idLocal: string): void {
    const g = this.g.clear();
    for (const r of estado.rastros) {
      g.rect(r.x * CELULA_PX + 4, r.y * CELULA_PX + 4, CELULA_PX - 8, CELULA_PX - 8).fill({ color: cor(REGISTRO_EFEITOS[r.tipo].cor), alpha: 0.28 });
    }
    // Armadilha: cantos marcados, só para quem armou.
    const p = CELULA_PX;
    const c = 10;
    for (const a of estado.armadilhas) {
      if (a.donoId !== idLocal) continue;
      const x = a.x * p + 3;
      const y = a.y * p + 3;
      const l = p - 6;
      g.moveTo(x, y + c).lineTo(x, y).lineTo(x + c, y);
      g.moveTo(x + l - c, y).lineTo(x + l, y).lineTo(x + l, y + c);
      g.moveTo(x + l, y + l - c).lineTo(x + l, y + l).lineTo(x + l - c, y + l);
      g.moveTo(x + c, y + l).lineTo(x, y + l).lineTo(x, y + l - c);
      g.stroke({ width: 3, color: cor(REGISTRO_EFEITOS.armadilha.cor), alpha: 0.9 });
    }
    for (const a of estado.atrasados) {
      const alvo = estado.entidades.find((e) => e.id === a.alvoId);
      if (!alvo) continue;
      const fracao = Math.max(0, Math.min(1, (a.disparaTick - estado.tick) / 90));
      const cx = (alvo.x + 0.5) * p;
      const cy = (alvo.y + 0.5) * p;
      g.circle(cx, cy, p * 0.45).stroke({ width: 2, color: cor(REGISTRO_EFEITOS.efeito_atrasado.cor), alpha: 0.4 });
      g.arc(cx, cy, p * 0.45, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * fracao).stroke({ width: 4, color: cor(REGISTRO_EFEITOS.efeito_atrasado.cor) });
    }
  }

  destruir(): void {
    this.g.destroy();
  }
}
