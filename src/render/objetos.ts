// Objetos coletáveis no chão (§2.16, camada "objetos"): orbes de HP (verde) e de recurso (azul),
// com um pulso leve, orbes de efeito na cor do registro (marco 8A) e itens com o desenho da mochila,
// quantidade e halo na cor da raridade (§2.10). Só lê o estado.
// Marco 9A (14/10/2026): ouro (moedas), baú (cadeado se trancado, anel de progresso enquanto abre,
// tampa aberta até sumir) e loja (barraca com toldo).
// Marco 13 (14/10/2026), D-058: no isométrico, baú e loja ficam em pé (na camada das entidades, com
// profundidade); o resto continua no chão, sob a matriz do plano.
// Ajuste de 16/10/2026 (D-067): sem anel de progresso (o `arc` sem `moveTo` puxava uma linha de outro objeto até o
// baú). No lugar, um halo suave pulsando no baú ou na loja em uso, como um brilho de CSS; no baú, ele fica mais
// forte conforme abre. O anel do descanso saiu com o descanso.
// Marco 26 (25/10/2026, D-109): no isométrico, ouro, orbes e santuário também ficam em pé (as moedas de pé, o orbe
// flutuando sobre a sombra, o cristal sobre a base), com profundidade; só os halos seguem no chão.

import { CanvasSource, Container, Graphics, Sprite, Text, Texture } from 'pixi.js';
import { REGISTRO_EFEITOS } from '../combat/registro-efeitos';
import type { EstadoJogo, ObjetoNoMundo, TipoObjeto } from '../core/estado';
import type { Raridade } from '../modos/modo';
import { CELULA_PX } from './camera-calculo';
import { centroDaCelula, type Projecao } from './projecao';
import { hashCelula, ehTipoDecoracao } from '../world/decoracao';
import type { PaletaTema } from '../world/temas';
import { desenharDecoracao } from './decoracao';
import { paletaDe } from './terreno';
import { texturaDoIcone } from './icones-textura';

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

/** Os que ficam em pé no isométrico (D-058: baú e loja; D-109: ouro, orbes e santuário). */
const EM_PE: ReadonlySet<TipoObjeto> = new Set<TipoObjeto>(['bau', 'loja', 'ouro', 'santuario', 'orbe_hp', 'orbe_recurso', 'orbe_efeito', 'orbe_refugio']);

/** Onde desenhar os objetos altos no isométrico. */
export interface OpcoesEmPe {
  camada: Container;
  projecao: () => Projecao;
}

export class CamadaObjetos {
  private readonly g = new Graphics();
  /** Os objetos em pé, um Graphics por objeto (só no isométrico). */
  private readonly altos = new Map<string, Graphics>();
  /** Halo do objeto em uso (baú abrindo, loja aberta), um sprite por objeto. */
  private readonly halos = new Map<string, Sprite>();
  private readonly camadaHalo: Container;
  private texturaHalo: Texture | null = null;
  private readonly itens = new Map<string, { visual: Container; quantidade: Text }>();
  /** Marco 26 (D-113): os quebráveis, um Graphics por objeto, desenhado uma vez (o enfeite não anima). */
  private readonly quebras = new Map<string, Graphics>();

  /**
   * `raridadeDe` traduz o item do chão para a cor; item desconhecido aparece como comum.
   * `ticksBau`: quanto dura a abertura do baú, para a força do halo.
   */
  constructor(
    camada: Container,
    private readonly raridadeDe: (itemId: string) => Raridade | undefined = () => undefined,
    private readonly ticksBau = 1,
    private readonly emPe: OpcoesEmPe | null = null,
    private readonly iconeDe: (itemId: string) => string | undefined = () => undefined,
    private readonly paleta: PaletaTema | null = null,
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

  /** O santuário: a base e o cristal (aceso enquanto não usado). */
  private santuario(g: Graphics, o: ObjetoNoMundo, cx: number, cy: number): void {
    const aceso = o.abertoTick === 0;
    const cor = aceso ? 0x50e3c2 : 0x586464;
    g.ellipse(cx, cy + 9, 19, 9).fill({ color: cor, alpha: 0.15 });
    g.roundRect(cx - 12, cy + 4, 24, 12, 3).fill(0x3b4d50).stroke({ width: 2, color: cor });
    g.poly([cx, cy - 19, cx + 9, cy - 5, cx, cy + 6, cx - 9, cy - 5]).fill(cor).stroke({ width: 2, color: 0xc6eee3 });
  }

  /** Os orbes (vida, recurso, efeito e refúgio), com o brilho em volta. */
  private orbe(g: Graphics, o: ObjetoNoMundo, cx: number, cy: number, pulso: number): void {
    if (o.tipo === 'orbe_efeito') {
      const cor = o.efeito ? Number.parseInt(REGISTRO_EFEITOS[o.efeito.tipo].cor.slice(1), 16) : 0xffffff;
      g.circle(cx, cy, 15 + pulso).fill({ color: cor, alpha: 0.22 });
      g.circle(cx, cy, 9).fill(cor).stroke({ width: 3, color: 0xffffff, alpha: 0.95 });
      g.circle(cx, cy, 3).fill(0xffffff);
      return;
    }
    if (o.tipo === 'orbe_refugio') {
      // D-067: o refúgio, prateado, com um losango no miolo (a carga de imunidade).
      g.circle(cx, cy, 16 + pulso).fill({ color: 0xd6eaf8, alpha: 0.22 });
      g.circle(cx, cy, 9).fill(0x85c1e9).stroke({ width: 2, color: 0xffffff, alpha: 0.95 });
      g.poly([cx, cy - 5, cx + 4, cy, cx, cy + 5, cx - 4, cy]).fill(0xffffff);
      return;
    }
    if (o.tipo !== 'orbe_hp' && o.tipo !== 'orbe_recurso') return;
    g.circle(cx, cy, 14 + pulso).fill({ color: COR_ORBE[o.tipo], alpha: 0.18 });
    g.circle(cx, cy, 8).fill(COR_ORBE[o.tipo]).stroke({ width: 2, color: 0xffffff, alpha: 0.8 });
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
      if (o.tipo === 'quebravel') {
        vistos.add(o.objetoId);
        this.quebravel(o, iso ? proj : null);
        continue;
      }
      if (iso && this.emPe && EM_PE.has(o.tipo)) {
        vistos.add(o.objetoId);
        this.desenharEmPe(o, estado, proj, this.emPe.camada, movimentoReduzido ? 0 : agoraMs, pulso);
        continue;
      }
      if (o.tipo === 'item') {
        const cor = COR_RARIDADE[(o.itemId && this.raridadeDe(o.itemId)) || 'comum'];
        g.circle(cx, cy, 16 + pulso).fill({ color: cor, alpha: 0.2 });
        vistos.add(o.objetoId);
        this.desenharItem(o, cx, cy, iso ? proj : undefined);
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
      if (o.tipo === 'santuario') {
        this.santuario(g, o, cx, cy);
        continue;
      }
      if (o.tipo === 'saida') continue;
      this.orbe(g, o, cx, cy, pulso);
    }
    this.halos_(estado, agoraMs, movimentoReduzido);
    for (const [id, alto] of this.altos) {
      if (vistos.has(id)) continue;
      alto.destroy();
      this.altos.delete(id);
    }
    for (const [id, item] of this.itens) {
      if (vistos.has(id)) continue;
      item.visual.destroy({ children: true });
      this.itens.delete(id);
    }
    for (const [id, q] of this.quebras) {
      if (vistos.has(id)) continue;
      q.destroy();
      this.quebras.delete(id);
    }
  }

  /**
   * O enfeite que quebra, com o mesmo desenho do terreno (render/decoracao.ts): no chão, de cima; no isométrico, em pé
   * na camada das entidades, com a base no centro da célula (como render/decoracao-iso.ts).
   */
  private quebravel(o: ObjetoNoMundo, proj: Projecao | null): void {
    const camada = proj && this.emPe ? this.emPe.camada : this.camadaHalo;
    let g = this.quebras.get(o.objetoId);
    if (!g) {
      g = new Graphics();
      const tipo = o.ref ?? '';
      if (ehTipoDecoracao(tipo)) {
        if (proj) g.ellipse(CELULA_PX / 2, CELULA_PX * 0.75, CELULA_PX * 0.3, CELULA_PX * 0.12).fill({ color: 0x000000, alpha: 0.22 });
        desenharDecoracao(g, { tipo, x: 0, y: 0, variante: hashCelula(o.x, o.y, 3) }, this.paleta ?? paletaDe(0));
      }
      this.quebras.set(o.objetoId, g);
    }
    if (g.parent !== camada) camada.addChild(g);
    if (!proj) {
      g.position.set(o.x * CELULA_PX, o.y * CELULA_PX);
      return;
    }
    const c = centroDaCelula(o.x, o.y);
    const p = proj.projetar(c.x, c.y);
    // A base do desenho (0,75 da célula) cai no centro projetado.
    g.position.set(p.x - CELULA_PX / 2, p.y - CELULA_PX * 0.75);
    g.zIndex = p.y - 0.01;
  }

  /** Usa o mesmo desenho da mochila; no isométrico ele fica legível, sem achatar com o piso. */
  private desenharItem(o: ObjetoNoMundo, cx: number, cy: number, proj?: Projecao): void {
    const textura = texturaDoIcone((o.itemId && this.iconeDe(o.itemId)) || 'pergaminho');
    if (!textura) return;
    let item = this.itens.get(o.objetoId);
    if (!item) {
      const visual = new Container();
      const sombra = new Sprite(textura);
      sombra.anchor.set(0.5);
      sombra.width = sombra.height = 30;
      sombra.tint = 0x10151c;
      sombra.position.set(1.5, 1.5);
      const desenho = new Sprite(textura);
      desenho.anchor.set(0.5);
      desenho.width = desenho.height = 28;
      desenho.tint = 0xffedca;
      const quantidade = new Text({ text: '', style: { fontSize: 12, fontWeight: 'bold', fill: 0xffffff, stroke: { color: 0x10151c, width: 3 } } });
      quantidade.position.set(8, 5);
      visual.addChild(sombra, desenho, quantidade);
      item = { visual, quantidade };
      this.itens.set(o.objetoId, item);
    }
    const camada = proj && this.emPe ? this.emPe.camada : this.camadaHalo;
    if (item.visual.parent !== camada) camada.addChild(item.visual);
    const p = proj ? proj.projetar(cx, cy) : { x: cx, y: cy };
    item.visual.position.set(p.x, p.y - (proj ? 9 : 0));
    item.visual.zIndex = p.y;
    item.quantidade.text = o.valor > 1 ? `×${o.valor}` : '';
  }

  /** `tMs` 0 com movimento reduzido (sem flutuar). */
  private desenharEmPe(o: ObjetoNoMundo, estado: EstadoJogo, proj: Projecao, camada: Container, tMs: number, pulso: number): void {
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
    // Desenhado acima da origem (os pés do objeto ficam no centro da célula).
    const flutua = Math.sin(tMs / 380 + o.x * 1.7 + o.y) * 2.5;
    if (o.tipo === 'bau' || o.tipo === 'loja') {
      alto.clear().ellipse(0, 0, 18, 8).fill({ color: 0x000000, alpha: 0.3 });
      if (o.tipo === 'bau') this.bau(alto, estado, o, 0, -10);
      else this.loja(alto, 0, -12);
    } else if (o.tipo === 'ouro') {
      // D-109: duas moedas de pé (de perfil, elipses altas) e uma deitada atrás.
      alto.clear().ellipse(0, 0, 13, 5.5).fill({ color: 0x000000, alpha: 0.3 });
      alto.ellipse(2, -2, 8, 3.2).fill(0xd4ac0d).stroke({ width: 1.2, color: 0x9a7d0a });
      alto.ellipse(-5, -8, 5, 7.5).fill(0xd4ac0d).stroke({ width: 1.5, color: 0x9a7d0a });
      alto.ellipse(5, -10 + flutua * 0.3, 5.5, 8 + pulso / 3).fill(0xf1c40f).stroke({ width: 1.5, color: 0x9a7d0a });
      alto.rect(4.2, -15 + flutua * 0.3, 1.6, 9).fill({ color: 0xfff3b0, alpha: 0.8 });
    } else if (o.tipo === 'santuario') {
      alto.clear().ellipse(0, 0, 18, 8).fill({ color: 0x000000, alpha: 0.3 });
      this.santuario(alto, o, 0, -14);
    } else {
      // O orbe flutua sobre a sombra (a sombra encolhe quando ele sobe).
      const altura = 20 + flutua;
      alto.clear().ellipse(0, 0, 9 - flutua * 0.4, 4 - flutua * 0.15).fill({ color: 0x000000, alpha: 0.32 });
      this.orbe(alto, o, 0, -altura, pulso);
    }
  }

  /** Troca de visão: os objetos em pé voltam para o chão (ou o contrário) no próximo quadro. */
  reiniciarVisual(): void {
    for (const alto of this.altos.values()) alto.destroy();
    this.altos.clear();
    for (const item of this.itens.values()) item.visual.destroy({ children: true });
    this.itens.clear();
    for (const q of this.quebras.values()) q.destroy();
    this.quebras.clear();
  }

  destruir(): void {
    this.reiniciarVisual();
    for (const s of this.halos.values()) s.destroy();
    this.halos.clear();
    this.texturaHalo?.destroy(true);
    this.g.destroy();
  }
}
