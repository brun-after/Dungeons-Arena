// Portas no chão (§2.1, §2.16). Marco 10A-1 (14/10/2026). Só lê a fase e o estado:
// - porta de saída com cadeado enquanto trancada e brilho quando abre;
// - portas internas como anéis violeta com o número do par;
// - porta temporária do boss, dourada, pulsando durante a janela de 30 s.

import { Graphics, Text, type Container } from 'pixi.js';
import type { EstadoJogo } from '../core/estado';
import type { Fase } from '../world/fase';
import { CELULA_PX } from './camera-calculo';

const P = CELULA_PX;

export class CamadaPortas {
  private readonly g = new Graphics();
  private readonly numeros: Text[] = [];

  constructor(
    camada: Container,
    private readonly fase: Fase,
    private readonly ticksJanela: number,
  ) {
    camada.addChild(this.g);
    for (const porta of fase.portasInternas) {
      for (const c of [porta.a, porta.b]) {
        const n = new Text({ text: String(porta.numero), style: { fill: 0xe8daef, fontSize: 14, fontWeight: '700' } });
        n.anchor.set(0.5);
        n.position.set((c.x + 0.5) * P, (c.y + 0.5) * P);
        camada.addChild(n);
        this.numeros.push(n);
      }
    }
  }

  private porta(cx: number, cy: number, cor: number, trancada: boolean, brilho: number): void {
    const g = this.g;
    if (brilho > 0) g.circle(cx, cy, 22 + brilho * 4).fill({ color: cor, alpha: 0.25 });
    g.roundRect(cx - 12, cy - 18, 24, 34, 10).fill(0x3b2410).stroke({ width: 3, color: cor });
    g.rect(cx - 8, cy - 12, 16, 26).fill(trancada ? 0x5d4037 : 0x111111);
    if (trancada) {
      g.roundRect(cx - 6, cy - 2, 12, 10, 2).fill(0x2c3e50).stroke({ width: 1.5, color: 0xd4ac0d });
      g.circle(cx, cy + 3, 1.8).fill(0xd4ac0d);
    }
  }

  desenhar(estado: EstadoJogo, agoraMs: number, movimentoReduzido: boolean): void {
    const g = this.g.clear();
    const pulso = movimentoReduzido ? 1 : (Math.sin(agoraMs / 220) + 1) / 2;
    for (const porta of this.fase.portasInternas) {
      for (const c of [porta.a, porta.b]) {
        const cx = (c.x + 0.5) * P;
        const cy = (c.y + 0.5) * P;
        g.circle(cx, cy, 17).fill({ color: 0x8e44ad, alpha: 0.25 }).stroke({ width: 3, color: 0xbb8fce, alpha: 0.6 + 0.4 * pulso });
      }
    }
    const volta = this.fase.portaRetorno;
    if (volta) {
      const cx = (volta.x + 0.5) * P;
      const cy = (volta.y + 0.5) * P;
      this.porta(cx, cy, 0x65d7ee, false, pulso * 0.5);
      g.moveTo(cx + 5, cy - 5).lineTo(cx - 4, cy).lineTo(cx + 5, cy + 5).stroke({ width: 3, color: 0xc8f6ff });
    }
    const s = this.fase.portaSaida;
    if (s) {
      const trancada = s.tranca !== 'livre' && !estado.saidaAberta;
      this.porta((s.x + 0.5) * P, (s.y + 0.5) * P, trancada ? 0x95a5a6 : 0x2ecc71, trancada, trancada ? 0 : pulso);
    }
    for (const o of estado.objetos) {
      if (o.tipo !== 'saida') continue;
      const naJanela = estado.tick < o.abertoTick + this.ticksJanela;
      this.porta((o.x + 0.5) * P, (o.y + 0.5) * P, 0xf1c40f, false, naJanela ? pulso : 0);
    }
  }

  destruir(): void {
    this.g.destroy();
    for (const n of this.numeros) n.destroy();
  }
}
