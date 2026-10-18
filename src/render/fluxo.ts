// Camada dos efeitos de fluxo próprio (§2.8, §2.11). Marco 8A-2 (14/10/2026). Só lê o estado:
// células de rastro na cor do efeito, armadilhas só do jogador local (invisíveis para os outros)
// e um anel de contagem sobre quem tem efeito atrasado a caminho.

import { Graphics, type Container } from 'pixi.js';
import { REGISTRO_EFEITOS } from '../combat/registro-efeitos';
import type { EstadoJogo } from '../core/estado';
import { CELULA_PX } from './camera-calculo';

const cor = (hex: string) => Number.parseInt(hex.slice(1), 16);
/** Marco 18: armadilha alheia revelada pela Sabedoria, e o anel do desarme. */
const COR_REVELADA = 0xe74c3c;
const COR_DESARME = 0xf1c40f;

export class CamadaFluxo {
  private readonly g = new Graphics();
  private readonly disparos: { x: number; y: number; tick: number }[] = [];

  disparou(x: number, y: number, tick: number): void {
    if (this.disparos.length >= 24) this.disparos.shift();
    this.disparos.push({ x, y, tick });
  }

  /** Marco 11A (D-066): com partículas, os rastros são partícula (efeitos-habilidade.ts) e não quadrados. */
  constructor(
    camada: Container,
    private readonly comParticulas: () => boolean = () => false,
    /** Marco 18: duração do desarme em ticks (para o anel de progresso). */
    private readonly ticksDesarme: () => number = () => 90,
  ) {
    camada.addChild(this.g);
  }

  desenhar(estado: EstadoJogo, idLocal: string, reduzido = false): void {
    const g = this.g.clear();
    while (this.disparos[0] && estado.tick - this.disparos[0].tick > 54) this.disparos.shift();
    for (const d of this.disparos) {
      const idade = Math.max(0, estado.tick - d.tick) / 54;
      const cx = (d.x + 0.5) * CELULA_PX, cy = (d.y + 0.5) * CELULA_PX;
      const raio = CELULA_PX * (reduzido ? 0.56 : 0.32 + idade * 0.5);
      g.circle(cx, cy, raio).fill({ color: 0xff5c2c, alpha: (1 - idade) * 0.3 });
      g.circle(cx, cy, raio).stroke({ width: 4, color: 0xffc86b, alpha: 1 - idade });
      for (let i = 0; i < 6; i++) {
        const angulo = Math.PI * i / 3;
        const x = cx + Math.cos(angulo) * 12, y = cy + Math.sin(angulo) * 12;
        g.poly([x - 4, y + 5, x, y - 10, x + 4, y + 5]).fill({ color: 0xffe4b8, alpha: 1 - idade });
      }
    }
    for (const r of this.comParticulas() ? [] : estado.rastros) {
      g.rect(r.x * CELULA_PX + 4, r.y * CELULA_PX + 4, CELULA_PX - 8, CELULA_PX - 8).fill({ color: cor(REGISTRO_EFEITOS[r.tipo].cor), alpha: 0.28 });
    }
    // Armadilha: cantos marcados, só para quem armou — e, desde o marco 18 (D-068), para quem a revelou com a
    // Sabedoria (em vermelho, com o "x" no meio). O desarme em curso mostra o progresso num anel.
    const p = CELULA_PX;
    const c = 10;
    const local = estado.entidades.find((e) => e.id === idLocal);
    for (const a of estado.armadilhas) {
      const minha = a.donoId === idLocal || (local !== undefined && a.equipeDono === local.equipe);
      if (!minha && !a.reveladaPara.includes(idLocal)) continue;
      const inerte = a.inerteAteTick > estado.tick;
      const cx = (a.x + 0.5) * p, cy = (a.y + 0.5) * p;
      g.circle(cx, cy, p * 0.38).fill({ color: minha ? 0x50e3c2 : COR_REVELADA, alpha: inerte ? 0.05 : 0.16 });
      g.circle(cx, cy, p * 0.28).stroke({ width: 1.5, color: inerte ? 0x7c858c : minha ? 0x50e3c2 : 0xffa36c, alpha: 0.7 });
      const x = a.x * p + 3;
      const y = a.y * p + 3;
      const l = p - 6;
      g.moveTo(x, y + c).lineTo(x, y).lineTo(x + c, y);
      g.moveTo(x + l - c, y).lineTo(x + l, y).lineTo(x + l, y + c);
      g.moveTo(x + l, y + l - c).lineTo(x + l, y + l).lineTo(x + l - c, y + l);
      g.moveTo(x + c, y + l).lineTo(x, y + l).lineTo(x, y + l - c);
      g.stroke({ width: 3, color: minha ? 0x50e3c2 : COR_REVELADA, alpha: 0.9 });
      if (minha) continue;
      const m = p / 2;
      g.moveTo(x - 3 + m - 7, y - 3 + m - 7).lineTo(x - 3 + m + 7, y - 3 + m + 7);
      g.moveTo(x - 3 + m + 7, y - 3 + m - 7).lineTo(x - 3 + m - 7, y - 3 + m + 7);
      g.stroke({ width: 3, color: COR_REVELADA, alpha: 0.75 });
      const i = local?.interacao;
      if (i?.tipo === 'desarme' && i.objetoId === String(a.id)) {
        const total = Math.max(1, this.ticksDesarme());
        const fracao = Math.max(0, Math.min(1, 1 - (i.ateTick - estado.tick) / total));
        const cx = (a.x + 0.5) * p;
        const cy = (a.y + 0.5) * p;
        const inicio = -Math.PI / 2;
        g.moveTo(cx + Math.cos(inicio) * p * 0.48, cy + Math.sin(inicio) * p * 0.48);
        g.arc(cx, cy, p * 0.48, inicio, inicio + Math.PI * 2 * fracao).stroke({ width: 3, color: COR_DESARME, alpha: 0.95 });
      }
    }
    for (const a of estado.atrasados) {
      const alvo = estado.entidades.find((e) => e.id === a.alvoId);
      if (!alvo) continue;
      const fracao = Math.max(0, Math.min(1, (a.disparaTick - estado.tick) / 90));
      const cx = (alvo.x + 0.5) * p;
      const cy = (alvo.y + 0.5) * p;
      g.circle(cx, cy, p * 0.45).stroke({ width: 2, color: cor(REGISTRO_EFEITOS.efeito_atrasado.cor), alpha: 0.4 });
      // Ajuste de 16/10/2026: moveTo antes do arco (sem ele, o Pixi liga o ponto anterior ao arco com uma linha).
      const inicio = -Math.PI / 2;
      g.moveTo(cx + Math.cos(inicio) * p * 0.45, cy + Math.sin(inicio) * p * 0.45);
      g.arc(cx, cy, p * 0.45, inicio, inicio + Math.PI * 2 * fracao).stroke({ width: 4, color: cor(REGISTRO_EFEITOS.efeito_atrasado.cor) });
    }
  }

  destruir(): void {
    this.g.destroy();
  }
}
