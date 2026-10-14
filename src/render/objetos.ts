// Objetos coletáveis no chão (§2.16, camada "objetos"): orbes de HP (verde) e de recurso (azul),
// com um pulso leve, orbes de efeito na cor do registro (marco 8A) e itens (marco 6) como losango
// na cor da raridade (§2.10). Só lê o estado.
// Marco 9A (14/10/2026): ouro (moedas), baú (cadeado se trancado, anel de progresso enquanto abre,
// tampa aberta até sumir) e loja (barraca com toldo).

import { Graphics, type Container } from 'pixi.js';
import { REGISTRO_EFEITOS } from '../combat/registro-efeitos';
import type { EstadoJogo, ObjetoNoMundo } from '../core/estado';
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

  /**
   * `raridadeDe` traduz o item do chão para a cor; item desconhecido aparece como comum.
   * `ticksBau`: quanto dura a abertura do baú, para o anel de progresso.
   */
  constructor(
    camada: Container,
    private readonly raridadeDe: (itemId: string) => Raridade | undefined = () => undefined,
    private readonly ticksBau = 1,
  ) {
    camada.addChild(this.g);
  }

  private bau(estado: EstadoJogo, o: ObjetoNoMundo, cx: number, cy: number): void {
    const g = this.g;
    const aberto = o.abertoTick > 0;
    const alpha = aberto ? 0.55 : 1;
    g.roundRect(cx - 15, cy - 8, 30, 20, 3).fill({ color: 0x8b5a2b, alpha }).stroke({ width: 2, color: 0x3b2410, alpha });
    if (aberto) {
      // Tampa levantada e o interior vazio.
      g.rect(cx - 13, cy - 6, 26, 6).fill({ color: 0x1b1208, alpha });
      g.roundRect(cx - 15, cy - 20, 30, 8, 3).fill({ color: 0xa0522d, alpha }).stroke({ width: 2, color: 0x3b2410, alpha });
      return;
    }
    g.roundRect(cx - 15, cy - 14, 30, 9, 4).fill(0xa0522d).stroke({ width: 2, color: 0x3b2410 });
    g.rect(cx - 15, cy - 6, 30, 3).fill(0xd4ac0d);
    if (o.chave) {
      g.roundRect(cx - 5, cy - 2, 10, 9, 2).fill(0x2c3e50).stroke({ width: 1.5, color: 0xd4ac0d });
      g.circle(cx, cy + 2, 1.6).fill(0xd4ac0d);
    } else {
      g.rect(cx - 2, cy - 4, 4, 5).fill(0xd4ac0d);
    }
    // Anel de progresso enquanto alguém abre (3 s, §2.10).
    const abridor = o.abridorId ? estado.entidades.find((e) => e.id === o.abridorId) : undefined;
    const ateTick = abridor?.interacao?.objetoId === o.objetoId ? abridor.interacao.ateTick : 0;
    if (ateTick > 0) {
      const progresso = Math.min(1, Math.max(0, 1 - (ateTick - estado.tick) / this.ticksBau));
      g.circle(cx, cy - 2, 24).stroke({ width: 4, color: 0x000000, alpha: 0.35 });
      if (progresso > 0) g.arc(cx, cy - 2, 24, -Math.PI / 2, -Math.PI / 2 + progresso * Math.PI * 2).stroke({ width: 4, color: 0xf1c40f });
    }
  }

  private loja(cx: number, cy: number): void {
    const g = this.g;
    g.rect(cx - 14, cy - 4, 28, 16).fill(0x6e4b2a).stroke({ width: 2, color: 0x3b2410 });
    // Toldo listrado.
    for (let i = 0; i < 4; i++) g.rect(cx - 16 + i * 8, cy - 14, 8, 10).fill(i % 2 === 0 ? 0xc0392b : 0xecf0f1);
    g.rect(cx - 16, cy - 14, 32, 10).stroke({ width: 2, color: 0x3b2410 });
    g.circle(cx, cy + 4, 4).fill(0xf1c40f).stroke({ width: 1.5, color: 0x9a7d0a });
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
      if (o.tipo === 'ouro') {
        g.circle(cx - 4, cy + 3, 7).fill(0xd4ac0d).stroke({ width: 1.5, color: 0x9a7d0a });
        g.circle(cx + 4, cy - 2, 7 + pulso / 2).fill(0xf1c40f).stroke({ width: 1.5, color: 0x9a7d0a });
        continue;
      }
      if (o.tipo === 'bau') {
        this.bau(estado, o, cx, cy);
        continue;
      }
      if (o.tipo === 'loja') {
        this.loja(cx, cy);
        continue;
      }
      // A porta temporária do boss é desenhada com as outras portas (render/portas.ts).
      if (o.tipo === 'saida') continue;
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
