// Telegrafia no chão e projéteis (§1.3 pilar 2, §2.6): toda ação ofensiva mostra, durante a
// conjuração, onde vai cair — área com preenchimento que cresce até o impacto, linha de mira
// para golpe e projétil — e o projétil fica visível durante a viagem. Só lê o estado.

import { Graphics, type Container } from 'pixi.js';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { DT_MS } from '../core/loop';
import { relacao } from '../modos/relacao';
import { CELULA_PX } from './camera-calculo';

const COR_HOSTIL = 0xff5a3c;
const COR_PROPRIA = 0x5dade2;

export class CamadaTelegrafia {
  private readonly chao = new Graphics();
  private readonly voo = new Graphics();

  constructor(camadaChao: Container, camadaVoo: Container) {
    camadaChao.addChild(this.chao);
    camadaVoo.addChild(this.voo);
  }

  desenhar(estado: EstadoJogo, ctx: ContextoSimulacao, idLocal: string, alpha: number): void {
    const chao = this.chao.clear();
    const voo = this.voo.clear();
    const local = estado.entidades.find((e) => e.id === idLocal);
    const tickVisual = estado.tick + alpha;

    for (const e of estado.entidades) {
      const a = e.acao;
      if (!a) continue;
      const hab = ctx.conteudo.habilidades.get(a.habilidadeId);
      if (!hab || hab.politicaImpacto === 'proprio') continue;
      const cor = local && relacao(local, e, ctx.modo) === 'proprio' ? COR_PROPRIA : COR_HOSTIL;
      const fracao = Math.min(1, Math.max(0, (tickVisual - a.inicioTick) / Math.max(1, a.lancamentoTick - a.inicioTick)));

      if (hab.politicaImpacto === 'area') {
        const r = hab.raioArea;
        const x = (a.alvoX - r) * CELULA_PX;
        const y = (a.alvoY - r) * CELULA_PX;
        const lado = (2 * r + 1) * CELULA_PX;
        chao.rect(x, y, lado, lado).fill({ color: cor, alpha: 0.12 }).stroke({ width: 2, color: cor, alpha: 0.85 });
        // O miolo cresce do centro até cobrir a área no tick do impacto: a contagem visível.
        const miolo = lado * fracao;
        chao.rect(x + (lado - miolo) / 2, y + (lado - miolo) / 2, miolo, miolo).fill({ color: cor, alpha: 0.28 });
      } else {
        const ox = (e.x + 0.5) * CELULA_PX;
        const oy = (e.y + 0.5) * CELULA_PX;
        const alvo = a.alvoId ? estado.entidades.find((x) => x.id === a.alvoId) : undefined;
        const tx = ((alvo?.x ?? a.alvoX) + 0.5) * CELULA_PX;
        const ty = ((alvo?.y ?? a.alvoY) + 0.5) * CELULA_PX;
        chao.moveTo(ox, oy).lineTo(tx, ty).stroke({ width: 2 + 2 * fracao, color: cor, alpha: 0.35 + 0.4 * fracao });
      }
    }

    for (const p of estado.projeteis) {
      const avanco = (p.velocidade * alpha * DT_MS) / 1000;
      const x = (p.x + p.dirX * avanco + 0.5) * CELULA_PX;
      const y = (p.y + p.dirY * avanco + 0.5) * CELULA_PX;
      const dono = estado.entidades.find((e) => e.id === p.donoId);
      const cor = dono && local && relacao(local, dono, ctx.modo) === 'proprio' ? COR_PROPRIA : COR_HOSTIL;
      // Rastro curto atrás do projétil para mostrar a trajetória.
      voo
        .moveTo(x - p.dirX * CELULA_PX * 0.6, y - p.dirY * CELULA_PX * 0.6)
        .lineTo(x, y)
        .stroke({ width: 3, color: cor, alpha: 0.5 });
      voo.circle(x, y, 6).fill(cor).stroke({ width: 2, color: 0xffffff, alpha: 0.8 });
    }
  }

  destruir(): void {
    this.chao.destroy();
    this.voo.destroy();
  }
}
