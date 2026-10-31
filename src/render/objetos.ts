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
// Marco 26 (29/10/2026, D-122): só desenha o que está na vista da câmera (com folga); os de fora ficam escondidos,
// sem redesenho por quadro. Com os drops que se acumulavam, o chão inteiro era redesenhado a cada quadro.
// Marco 31 (31/10/2026, D-130): com o pintor (render/pintura.ts), o baú, a loja, o ouro, o santuário e os objetos do
// Mundo viram sprites repintados (um por objeto, trocado quando o estado muda: aberto, trancado, aceso), nas duas
// visões; os orbes ganham volume (núcleo, reflexo e brilho) no lugar do traço branco.
// Ajuste de 31/10/2026 (D-130): no isométrico, o baú, a loja (em tamanho real, com o vendedor atrás do balcão), o
// ouro, o santuário e os quebráveis que têm modelo usam os sprites pré-renderizados de modelos 3D CC0
// (render/objetos-3d.ts); sem a imagem, o desenho repintado de antes.

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
import { desenharObjetoDoMundo, desenharVendedor, desenharVendedorDeLoja } from './objetos-mundo';
import type { ObjetosPreRenderizados } from './objetos-3d';
import { varianteEmPassos, type PintorDeDesenhos } from './pintura';

const COR_ORBE: Readonly<Record<'orbe_hp' | 'orbe_recurso', number>> = {
  orbe_hp: 0x2ecc71,
  orbe_recurso: 0x5dade2,
};

/** Marco 31 (D-130): o orbe com volume: a sombra na borda de baixo, o corpo, a luz de cima e o reflexo. */
function esfera(g: Graphics, cx: number, cy: number, r: number, cor: number): void {
  const escuro = (c: number, k: number) => (Math.round(((c >> 16) & 0xff) * k) << 16) | (Math.round(((c >> 8) & 0xff) * k) << 8) | Math.round((c & 0xff) * k);
  g.circle(cx, cy, r).fill(escuro(cor, 0.45));
  g.circle(cx - r * 0.12, cy - r * 0.14, r * 0.82).fill(escuro(cor, 0.8));
  g.circle(cx - r * 0.25, cy - r * 0.3, r * 0.5).fill(cor);
  g.circle(cx - r * 0.38, cy - r * 0.42, r * 0.2).fill({ color: 0xffffff, alpha: 0.75 });
}

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
// Marco 29 (D-128): os objetos do Mundo também ficam em pé no isométrico.
const EM_PE: ReadonlySet<TipoObjeto> = new Set<TipoObjeto>(['bau', 'loja', 'ouro', 'santuario', 'orbe_hp', 'orbe_recurso', 'orbe_efeito', 'orbe_refugio', 'npc', 'coleta', 'tumulo', 'pedra_save', 'pedra_portal', 'porta_estrutura']);

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
  /** Marco 31 (D-130): os objetos repintados, um sprite por objeto e a chave do desenho que ele mostra. */
  private readonly pinturas = new Map<string, { sprite: Sprite; chave: string }>();
  /** Os sprites dos modelos pré-renderizados, por objeto (o vendedor da loja leva o sufixo `#v`). */
  private readonly modelos3d = new Map<string, Sprite>();

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
    private readonly pintor: PintorDeDesenhos | null = null,
    private readonly modelos: ObjetosPreRenderizados | null = null,
    private readonly ouroMontes: readonly number[] = [],
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

  /**
   * Marco 31 (D-130): o objeto como sprite repintado, com a origem do desenho em (x, y) da `camada`. Devolve false sem
   * pintor (quem chama desenha como antes).
   */
  private pintado(o: ObjetoNoMundo, chave: string, desenhar: (g: Graphics) => void, x: number, y: number, camada: Container, z: number): boolean {
    if (!this.pintor) return false;
    const pintura = this.pintor.pintura(chave, desenhar);
    if (!pintura) return true;
    let p = this.pinturas.get(o.objetoId);
    if (!p) {
      p = { sprite: new Sprite(pintura.textura), chave };
      this.pinturas.set(o.objetoId, p);
    }
    if (p.chave !== chave) {
      p.sprite.texture = pintura.textura;
      p.chave = chave;
    }
    if (p.sprite.parent !== camada) camada.addChild(p.sprite);
    p.sprite.position.set(x + pintura.x, y + pintura.y);
    p.sprite.width = pintura.largura;
    p.sprite.height = pintura.altura;
    p.sprite.zIndex = z;
    p.sprite.visible = true;
    return true;
  }

  /** O modelo pré-renderizado do objeto (render/objetos-3d.ts), ou null. */
  private nomeModelo(o: ObjetoNoMundo): string | null {
    if (o.tipo === 'bau') return o.abertoTick > 0 ? 'bau_aberto' : o.chave ? 'bau_trancado' : 'bau_fechado';
    if (o.tipo === 'loja') return o.tipo;
    // O monte cresce com a quantia: o primeiro limite que a quantia não passa (acima de todos, o maior).
    if (o.tipo === 'ouro') {
      const i = this.ouroMontes.findIndex((limite) => o.valor <= limite);
      return `ouro_${(i < 0 ? this.ouroMontes.length : i) + 1}`;
    }
    if (o.tipo === 'santuario') return o.abertoTick === 0 ? 'santuario_aceso' : 'santuario_apagado';
    if (o.tipo === 'quebravel') return o.ref ?? null;
    return null;
  }

  /** Mostra o modelo com os pés em (x, y) da camada; false se ele não está pronto (quem chama desenha como antes). */
  private modelo(id: string, nome: string, x: number, y: number, camada: Container, z: number): boolean {
    if (!this.modelos?.tem(nome)) return false;
    let s = this.modelos3d.get(id);
    if (!s) {
      s = new Sprite();
      this.modelos3d.set(id, s);
    }
    this.modelos.aplicar(s, nome);
    if (s.parent !== camada) camada.addChild(s);
    s.position.set(x, y);
    s.zIndex = z;
    s.visible = true;
    return true;
  }

  /**
   * A loja em tamanho real: o vendedor fica atrás do balcão (o balcão cobre as pernas). A barraca está girada 22° no
   * render (tools/objetos/receitas.ts): atrás dela é o sentido contrário à frente, na grade.
   */
  private vendedorDaLoja(o: ObjetoNoMundo, proj: Projecao, camada: Container): void {
    const id = `${o.objetoId}#v`;
    const c = centroDaCelula(o.x, o.y);
    const atras = 0.32 * CELULA_PX;
    const p = proj.projetar(c.x - Math.sin(Math.PI / 8) * atras, c.y - Math.cos(Math.PI / 8) * atras);
    const ref = o.ref ?? 'mercador';
    const pintura = this.pintor?.pintura(`vendedor:${ref}`, (g) => {
      desenharVendedorDeLoja(g, ref);
    });
    if (!pintura) return;
    let s = this.modelos3d.get(id);
    if (!s) {
      s = new Sprite(pintura.textura);
      this.modelos3d.set(id, s);
    }
    if (s.parent !== camada) camada.addChild(s);
    s.anchor.set(0, 0);
    s.scale.set(1);
    s.position.set(p.x + pintura.x, p.y + pintura.y);
    s.width = pintura.largura;
    s.height = pintura.altura;
    s.zIndex = p.y;
    s.visible = true;
  }

  /** A chave do desenho repintado do objeto (o que muda o desenho entra nela), ou null para os que animam. */
  private chaveDe(o: ObjetoNoMundo): string | null {
    if (o.tipo === 'bau') return `bau:${o.abertoTick > 0 ? 'aberto' : o.chave ? 'trancado' : 'fechado'}`;
    if (o.tipo === 'loja') return `loja:${o.ref ?? ''}`;
    if (o.tipo === 'ouro') return 'ouro';
    if (o.tipo === 'santuario') return `santuario:${o.abertoTick === 0 ? 'aceso' : 'apagado'}`;
    if (o.tipo === 'npc' || o.tipo === 'coleta' || o.tipo === 'tumulo' || o.tipo === 'pedra_save' || o.tipo === 'pedra_portal' || o.tipo === 'porta_estrutura') {
      return `mundo:${o.tipo}:${o.ref ?? ''}:${o.escondido ? 1 : 0}`;
    }
    return null;
  }

  /** O desenho do objeto com a origem nos pés (o centro da célula), como os de pé do isométrico. */
  private desenhoDe(g: Graphics, o: ObjetoNoMundo, estado: EstadoJogo): void {
    if (o.tipo === 'bau') this.bau(g, estado, o, 0, -10);
    else if (o.tipo === 'loja') {
      this.loja(g, 0, -12);
      desenharVendedor(g, o, 0, -12);
    } else if (o.tipo === 'ouro') {
      g.ellipse(2, -2, 8, 3.2).fill(0xd4ac0d).stroke({ width: 1.2, color: 0x9a7d0a });
      g.ellipse(-5, -8, 5, 7.5).fill(0xd4ac0d).stroke({ width: 1.5, color: 0x9a7d0a });
      g.ellipse(5, -10, 5.5, 8).fill(0xf1c40f).stroke({ width: 1.5, color: 0x9a7d0a });
      g.rect(4.2, -15, 1.6, 9).fill({ color: 0xfff3b0, alpha: 0.8 });
    } else if (o.tipo === 'santuario') this.santuario(g, o, 0, -14);
    else desenharObjetoDoMundo(g, o, 0, 0, 0);
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
      esfera(g, cx, cy, 9, cor);
      return;
    }
    if (o.tipo === 'orbe_refugio') {
      // D-067: o refúgio, prateado, com um losango no miolo (a carga de imunidade).
      g.circle(cx, cy, 16 + pulso).fill({ color: 0xd6eaf8, alpha: 0.22 });
      esfera(g, cx, cy, 9, 0x85c1e9);
      g.poly([cx, cy - 5, cx + 4, cy, cx, cy + 5, cx - 4, cy]).fill({ color: 0xffffff, alpha: 0.85 });
      return;
    }
    if (o.tipo !== 'orbe_hp' && o.tipo !== 'orbe_recurso') return;
    g.circle(cx, cy, 14 + pulso).fill({ color: COR_ORBE[o.tipo], alpha: 0.18 });
    esfera(g, cx, cy, 8, COR_ORBE[o.tipo]);
  }

  /** `vista`: o retângulo visível em px de plano (`Camera.retanguloVisivel`); sem ele, desenha tudo. */
  desenhar(estado: EstadoJogo, agoraMs: number, movimentoReduzido: boolean, vista?: readonly [number, number, number, number]): void {
    const g = this.g.clear();
    const folga = CELULA_PX * 2;
    const naVista = (cx: number, cy: number) => !vista || (cx >= vista[0] - folga && cx <= vista[2] + folga && cy >= vista[1] - folga && cy <= vista[3] + folga);
    const pulso = movimentoReduzido ? 0 : Math.sin(agoraMs / 260) * 2;
    const proj = this.emPe?.projecao();
    const iso = proj?.visao === 'iso';
    const vistos = new Set<string>();
    for (const o of estado.objetos) {
      const cx = (o.x + 0.5) * CELULA_PX;
      const cy = (o.y + 0.5) * CELULA_PX;
      const visivel = naVista(cx, cy);
      this.mostrarProprios(o.objetoId, visivel);
      if (!visivel) {
        vistos.add(o.objetoId);
        continue;
      }
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
      // Marco 31 (D-130): de cima, os que têm desenho repintado, com os pés um pouco abaixo do centro da célula.
      const chave = this.chaveDe(o);
      const desenho = (gp: Graphics) => {
        this.desenhoDe(gp, o, estado);
      };
      if (chave && this.pintado(o, chave, desenho, cx, cy + CELULA_PX * 0.3, this.camadaHalo, 0)) {
        vistos.add(o.objetoId);
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
        desenharVendedor(g, o, cx, cy);
        continue;
      }
      if (desenharObjetoDoMundo(g, o, cx, cy + CELULA_PX * 0.3, pulso)) continue;
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
    for (const [id, p] of this.pinturas) {
      if (vistos.has(id)) continue;
      p.sprite.destroy();
      this.pinturas.delete(id);
    }
    for (const [id, s] of this.modelos3d) {
      if (vistos.has(id.endsWith('#v') ? id.slice(0, -2) : id)) continue;
      s.destroy();
      this.modelos3d.delete(id);
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
        // Marco 31 (D-130): com o pintor, o enfeite vai num sprite repintado (abaixo); aqui fica só a sombra.
        if (!this.pintor) desenharDecoracao(g, { tipo, x: 0, y: 0, variante: hashCelula(o.x, o.y, 3) }, this.paleta ?? paletaDe(0));
      }
      this.quebras.set(o.objetoId, g);
    }
    if (g.parent !== camada) camada.addChild(g);
    if (!proj) g.position.set(o.x * CELULA_PX, o.y * CELULA_PX);
    else {
      const c = centroDaCelula(o.x, o.y);
      const p = proj.projetar(c.x, c.y);
      // A base do desenho (0,75 da célula) cai no centro projetado.
      g.position.set(p.x - CELULA_PX / 2, p.y - CELULA_PX * 0.75);
      g.zIndex = p.y - 0.01;
    }
    const tipo = o.ref ?? '';
    if (proj && this.modelo(o.objetoId, tipo, g.x + CELULA_PX / 2, g.y + CELULA_PX * 0.75, camada, g.zIndex + 0.001)) return;
    if (!ehTipoDecoracao(tipo)) return;
    const variante = varianteEmPassos(hashCelula(o.x, o.y, 3));
    const desenho = (gp: Graphics) => {
      desenharDecoracao(gp, { tipo, x: 0, y: 0, variante }, this.paleta ?? paletaDe(0));
    };
    this.pintado(o, `quebravel:${tipo}:${variante}`, desenho, g.x, g.y, camada, g.zIndex + 0.001);
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
    const qtd = o.valor > 1 ? `×${o.valor}` : '';
    if (item.quantidade.text !== qtd) item.quantidade.text = qtd;
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
    // Ajuste de 31/10/2026 (D-130): o modelo pré-renderizado, com a sombra macia no Graphics.
    const nome = this.nomeModelo(o);
    const medidas = nome ? this.modelos?.medidas(nome) : null;
    if (nome && medidas && this.modelo(o.objetoId, nome, p.x, p.y, camada, p.y + 0.001)) {
      const r = Math.min(medidas.largura * 0.42, CELULA_PX * 1.3);
      alto.clear().ellipse(0, 0, r, r * 0.42).fill({ color: 0x000000, alpha: 0.32 });
      if (o.tipo === 'loja') this.vendedorDaLoja(o, proj, camada);
      return;
    }
    // Marco 31 (D-130): a sombra no Graphics e o desenho repintado num sprite logo à frente dela.
    const chave = this.chaveDe(o);
    if (chave && this.pintor) {
      alto.clear();
      const ouro = o.tipo === 'ouro';
      if (o.tipo !== 'npc' && o.tipo !== 'porta_estrutura') alto.ellipse(0, 0, ouro ? 13 : 18, ouro ? 5.5 : 8).fill({ color: 0x000000, alpha: 0.3 });
      const desenho = (gp: Graphics) => {
        this.desenhoDe(gp, o, estado);
      };
      this.pintado(o, chave, desenho, p.x, p.y, camada, p.y + 0.001);
      return;
    }
    if (o.tipo === 'bau' || o.tipo === 'loja') {
      alto.clear().ellipse(0, 0, 18, 8).fill({ color: 0x000000, alpha: 0.3 });
      if (o.tipo === 'bau') this.bau(alto, estado, o, 0, -10);
      else {
        this.loja(alto, 0, -12);
        desenharVendedor(alto, o, 0, -12);
      }
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
    } else if (desenharObjetoDoMundo(alto.clear(), o, 0, 0, pulso)) {
      // Marco 29 (D-128): NPC, coleta, túmulo, pedras e a porta da estrutura.
    } else {
      // O orbe flutua sobre a sombra (a sombra encolhe quando ele sobe).
      const altura = 20 + flutua;
      alto.clear().ellipse(0, 0, 9 - flutua * 0.4, 4 - flutua * 0.15).fill({ color: 0x000000, alpha: 0.32 });
      this.orbe(alto, o, 0, -altura, pulso);
    }
  }

  /** Esconde (fora da vista) ou volta a mostrar os desenhos próprios do objeto, sem destruí-los. */
  private mostrarProprios(id: string, visivel: boolean): void {
    const alto = this.altos.get(id);
    if (alto) alto.visible = visivel;
    const item = this.itens.get(id);
    if (item) item.visual.visible = visivel;
    const q = this.quebras.get(id);
    if (q) q.visible = visivel;
    const pintura = this.pinturas.get(id);
    if (pintura) pintura.sprite.visible = visivel;
    const m = this.modelos3d.get(id);
    if (m) m.visible = visivel;
  }

  /** Troca de visão: os objetos em pé voltam para o chão (ou o contrário) no próximo quadro. */
  reiniciarVisual(): void {
    for (const alto of this.altos.values()) alto.destroy();
    this.altos.clear();
    for (const item of this.itens.values()) item.visual.destroy({ children: true });
    this.itens.clear();
    for (const q of this.quebras.values()) q.destroy();
    this.quebras.clear();
    for (const p of this.pinturas.values()) p.sprite.destroy();
    this.pinturas.clear();
    for (const s of this.modelos3d.values()) s.destroy();
    this.modelos3d.clear();
  }

  destruir(): void {
    this.reiniciarVisual();
    for (const s of this.halos.values()) s.destroy();
    this.halos.clear();
    this.texturaHalo?.destroy(true);
    this.g.destroy();
  }
}
