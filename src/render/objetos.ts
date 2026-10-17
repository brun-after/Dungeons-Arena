// Objetos coletáveis no chão (§2.16, camada "objetos"): orbes de HP (verde) e de recurso (azul),
// com um pulso leve, orbes de efeito na cor do registro (marco 8A) e itens (marco 6) como losango
// na cor da raridade (§2.10). Só lê o estado.
// Marco 9A (14/10/2026): ouro (moedas), baú (cadeado se trancado, anel de progresso enquanto abre,
// tampa aberta até sumir) e loja (barraca com toldo).
// Marco 13 (14/10/2026), D-058: no isométrico, baú e loja ficam em pé (na camada das entidades, com
// profundidade); o resto continua no chão, sob a matriz do plano.
// Ajuste de 16/10/2026 (D-067): sem anel de progresso (o `arc` sem `moveTo` puxava uma linha de outro objeto até o
// baú). No lugar, um halo suave pulsando no baú ou na loja em uso, como um brilho de CSS; no baú, ele fica mais
// forte conforme abre. O anel do descanso saiu com o descanso.

import { CanvasSource, Graphics, Sprite, Texture, type Container } from 'pixi.js';
import { REGISTRO_EFEITOS } from '../combat/registro-efeitos';
import type { EstadoJogo, ObjetoNoMundo } from '../core/estado';
import type { Raridade } from '../modos/modo';
import { CELULA_PX } from './camera-calculo';
import { centroDaCelula, type Projecao } from './projecao';

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
  ultima: 0xff4d6d,
};

/** Onde desenhar os objetos altos no isométrico. */
export interface OpcoesEmPe {
  camada: Container;
  projecao: () => Projecao;
}

export class CamadaObjetos {
  private readonly g = new Graphics();
  /** Baús e lojas em pé, um Graphics por objeto (só no isométrico). */
  private readonly altos = new Map<string, Graphics>();
  /** Halo do objeto em uso (baú abrindo, loja aberta), um sprite por objeto. */
  private readonly halos = new Map<string, Sprite>();
  private readonly camadaHalo: Container;
  private texturaHalo: Texture | null = null;

  /**
   * `raridadeDe` traduz o item do chão para a cor; item desconhecido aparece como comum.
   * `ticksBau`: quanto dura a abertura do baú, para a força do halo.
   */
  constructor(
    camada: Container,
    private readonly raridadeDe: (itemId: string) => Raridade | undefined = () => undefined,
    private readonly ticksBau = 1,
    private readonly emPe: OpcoesEmPe | null = null,
  ) {
    this.camadaHalo = camada;
    camada.addChild(this.g);
  }

  /** Gradiente radial (como um box-shadow de CSS), gerado uma vez. */
  private halo(): Texture {
    if (this.texturaHalo) return this.texturaHalo;
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 64);
      grad.addColorStop(0, 'rgba(255, 236, 190, 0.95)');
      grad.addColorStop(0.35, 'rgba(255, 200, 110, 0.55)');
      grad.addColorStop(1, 'rgba(255, 170, 60, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
    }
    this.texturaHalo = new Texture({ source: new CanvasSource({ resource: c }) });
    return this.texturaHalo;
  }

  /** Halos dos objetos em uso; os que pararam de ser usados somem. */
  private halos_(estado: EstadoJogo, agoraMs: number, reduzido: boolean): void {
    const ativos = new Set<string>();
    for (const e of estado.entidades) {
      const i = e.interacao;
      if (!i) continue;
      const o = estado.objetos.find((x) => x.objetoId === i.objetoId);
      if (!o) continue;
      ativos.add(o.objetoId);
      let s = this.halos.get(o.objetoId);
      if (!s) {
        s = new Sprite(this.halo());
        s.anchor.set(0.5);
        s.blendMode = 'add';
        this.camadaHalo.addChildAt(s, 0);
        this.halos.set(o.objetoId, s);
      }
      const progresso = o.tipo === 'bau' ? Math.min(1, Math.max(0, 1 - (i.ateTick - estado.tick) / this.ticksBau)) : 1;
      const pulso = reduzido ? 0 : Math.sin(agoraMs / 220) * 0.08;
      s.position.set((o.x + 0.5) * CELULA_PX, (o.y + 0.5) * CELULA_PX);
      s.scale.set((CELULA_PX * 2.2) / 128 * (1 + pulso));
      s.alpha = 0.35 + 0.55 * progresso;
    }
    for (const [id, s] of this.halos) {
      if (ativos.has(id)) continue;
      s.destroy();
      this.halos.delete(id);
    }
  }

  private bau(g: Graphics, estado: EstadoJogo, o: ObjetoNoMundo, cx: number, cy: number): void {
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
  }

  private loja(g: Graphics, cx: number, cy: number): void {
    g.rect(cx - 14, cy - 4, 28, 16).fill(0x6e4b2a).stroke({ width: 2, color: 0x3b2410 });
    // Toldo listrado.
    for (let i = 0; i < 4; i++) g.rect(cx - 16 + i * 8, cy - 14, 8, 10).fill(i % 2 === 0 ? 0xc0392b : 0xecf0f1);
    g.rect(cx - 16, cy - 14, 32, 10).stroke({ width: 2, color: 0x3b2410 });
    g.circle(cx, cy + 4, 4).fill(0xf1c40f).stroke({ width: 1.5, color: 0x9a7d0a });
  }

  desenhar(estado: EstadoJogo, agoraMs: number, movimentoReduzido: boolean): void {
    const g = this.g.clear();
    const pulso = movimentoReduzido ? 0 : Math.sin(agoraMs / 260) * 2;
    const proj = this.emPe?.projecao();
    const iso = proj?.visao === 'iso';
    const vistos = new Set<string>();
    for (const o of estado.objetos) {
      const cx = (o.x + 0.5) * CELULA_PX;
      const cy = (o.y + 0.5) * CELULA_PX;
      if (iso && this.emPe && (o.tipo === 'bau' || o.tipo === 'loja')) {
        vistos.add(o.objetoId);
        this.desenharEmPe(o, estado, proj, this.emPe.camada);
        continue;
      }
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
        this.bau(g, estado, o, cx, cy);
        continue;
      }
      if (o.tipo === 'loja') {
        this.loja(g, cx, cy);
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
      if (o.tipo === 'orbe_refugio') {
        // D-067: o refúgio, prateado, com um losango no miolo (a carga de imunidade).
        g.circle(cx, cy, 16 + pulso).fill({ color: 0xd6eaf8, alpha: 0.22 });
        g.circle(cx, cy, 9).fill(0x85c1e9).stroke({ width: 2, color: 0xffffff, alpha: 0.95 });
        g.poly([cx, cy - 5, cx + 4, cy, cx, cy + 5, cx - 4, cy]).fill(0xffffff);
        continue;
      }
      g.circle(cx, cy, 14 + pulso).fill({ color: COR_ORBE[o.tipo], alpha: 0.18 });
      g.circle(cx, cy, 8).fill(COR_ORBE[o.tipo]).stroke({ width: 2, color: 0xffffff, alpha: 0.8 });
    }
    this.halos_(estado, agoraMs, movimentoReduzido);
    for (const [id, alto] of this.altos) {
      if (vistos.has(id)) continue;
      alto.destroy();
      this.altos.delete(id);
    }
  }

  private desenharEmPe(o: ObjetoNoMundo, estado: EstadoJogo, proj: Projecao, camada: Container): void {
    let alto = this.altos.get(o.objetoId);
    if (!alto) {
      alto = new Graphics();
      camada.addChild(alto);
      this.altos.set(o.objetoId, alto);
    }
    const c = centroDaCelula(o.x, o.y);
    const p = proj.projetar(c.x, c.y);
    alto.position.set(p.x, p.y);
    alto.zIndex = p.y;
    alto.clear().ellipse(0, 0, 18, 8).fill({ color: 0x000000, alpha: 0.3 });
    // Desenhado acima da origem (os pés do objeto ficam no centro da célula).
    if (o.tipo === 'bau') this.bau(alto, estado, o, 0, -10);
    else this.loja(alto, 0, -12);
  }

  /** Troca de visão: os objetos em pé voltam para o chão (ou o contrário) no próximo quadro. */
  reiniciarVisual(): void {
    for (const alto of this.altos.values()) alto.destroy();
    this.altos.clear();
  }

  destruir(): void {
    this.reiniciarVisual();
    for (const s of this.halos.values()) s.destroy();
    this.halos.clear();
    this.texturaHalo?.destroy(true);
    this.g.destroy();
  }
}
