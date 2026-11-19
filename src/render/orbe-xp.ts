// 16/11/2026 (D-184): o desenho da luz de XP (progression/orbe-xp.ts).
// 19/11/2026 (D-184, adendo): luz pura, sem superfície. Antes era uma esfera (disco cheio, reflexo branco e sombra no
// chão), igual aos orbes de vida e de buff. Agora é um núcleo minúsculo que emana raios de luz em todos os sentidos,
// tudo somado ao fundo (blend aditivo), sem borda, reflexo nem sombra. O XP (`brilho`, de 0,15 a 1) dá o número e o
// comprimento dos raios e a força do núcleo. Os raios cintilam e giram devagar. Com a sorte (3× ou 5×), raios extras
// mais longos e mais claros.

import { CanvasSource, Container, Sprite, Texture } from 'pixi.js';

export const COR_ORBE_XP = 0xffe27a;

/** Lado da textura do brilho do núcleo, em px. */
const LADO = 64;
/** Comprimento e espessura da textura do raio, em px. */
const RAIO_C = 128;
const RAIO_E = 16;
/** Os raios: de 5 (pouco XP) a 16 (muito); a sorte soma raios longos. */
const RAIOS_MIN = 5;
const RAIOS_MAX = 16;

interface Luz {
  raiz: Container;
  brilho: Sprite;
  nucleo: Sprite;
  raios: Sprite[];
}

/** Um número fixo em [0, 1) para o raio `i` da luz de semente `s` (o comprimento e a fase de cada um). */
function acaso(s: number, i: number): number {
  const x = Math.sin(s * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function canvas(largura: number, altura: number, desenhar: (ctx: CanvasRenderingContext2D) => void): Texture {
  const c = document.createElement('canvas');
  c.width = largura;
  c.height = altura;
  const ctx = c.getContext('2d');
  if (ctx) desenhar(ctx);
  return new Texture({ source: new CanvasSource({ resource: c }) });
}

/** As luzes de XP na tela, um conjunto de sprites por objeto (render/objetos.ts decide onde e quando). */
export class LuzesDeXp {
  private texturaBrilho: Texture | null = null;
  private texturaRaio: Texture | null = null;
  private readonly luzes = new Map<string, Luz>();

  /** O brilho redondo (núcleo e o clarão fraco em volta), com queda contínua: sem patamar, não vira disco. */
  private brilhoRedondo(): Texture {
    this.texturaBrilho ??= canvas(LADO, LADO, (ctx) => {
      const m = LADO / 2;
      const grad = ctx.createRadialGradient(m, m, 0, m, m, m);
      for (let i = 0; i <= 16; i++) {
        const t = i / 16;
        grad.addColorStop(t, `rgba(255, ${String(Math.round(248 - 40 * t))}, ${String(Math.round(210 - 120 * t))}, ${(Math.exp(-t * t * 6) * (1 - t)).toFixed(3)})`);
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, LADO, LADO);
    });
    return this.texturaBrilho;
  }

  /** O raio: começa no núcleo (x = 0) e se apaga até a ponta; fino, com a borda lateral macia. */
  private raio(): Texture {
    this.texturaRaio ??= canvas(RAIO_C, RAIO_E, (ctx) => {
      const img = ctx.createImageData(RAIO_C, RAIO_E);
      for (let y = 0; y < RAIO_E; y++) {
        const v = (y + 0.5 - RAIO_E / 2) / (RAIO_E / 2);
        for (let x = 0; x < RAIO_C; x++) {
          const u = x / RAIO_C;
          // Afina para a ponta e se apaga ao longo do comprimento.
          const largura = 1 - u * 0.75;
          const lado = Math.exp(-((v / Math.max(0.05, largura * 0.45)) ** 2));
          const a = lado * (1 - u) ** 1.6;
          const k = (y * RAIO_C + x) * 4;
          img.data[k] = 255;
          img.data[k + 1] = Math.round(244 - 40 * u);
          img.data[k + 2] = Math.round(200 - 110 * u);
          img.data[k + 3] = Math.round(a * 255);
        }
      }
      ctx.putImageData(img, 0, 0);
    });
    return this.texturaRaio;
  }

  private sprite(textura: Texture, ax: number, ay: number): Sprite {
    const s = new Sprite(textura);
    s.anchor.set(ax, ay);
    s.blendMode = 'add';
    return s;
  }

  /**
   * Mostra a luz `id` com o núcleo em (x, y) da `camada`. `tMs` 0 com movimento reduzido (sem cintilar nem girar).
   * `semente` dá a cada luz os seus raios (comprimentos e fases).
   */
  mostrar(id: string, camada: Container, x: number, y: number, z: number, brilho: number, sorte: number, tMs: number, semente: number): void {
    let luz = this.luzes.get(id);
    if (!luz) {
      const raiz = new Container();
      const fundo = this.sprite(this.brilhoRedondo(), 0.5, 0.5);
      const nucleo = this.sprite(this.brilhoRedondo(), 0.5, 0.5);
      raiz.addChild(fundo);
      luz = { raiz, brilho: fundo, nucleo, raios: [] };
      this.luzes.set(id, luz);
    }
    if (luz.raiz.parent !== camada) camada.addChild(luz.raiz);
    const b = Math.max(0.15, Math.min(1, brilho));
    luz.raiz.position.set(x, y);
    luz.raiz.zIndex = z;
    luz.raiz.visible = true;
    this.raios(luz, b, sorte, tMs, semente);
    // O clarão fraco em volta e, por cima de tudo, o núcleo minúsculo.
    luz.brilho.scale.set((10 + 18 * b) / LADO);
    luz.brilho.alpha = 0.25 + 0.3 * b;
    if (luz.nucleo.parent !== luz.raiz) luz.raiz.addChild(luz.nucleo);
    else luz.raiz.setChildIndex(luz.nucleo, luz.raiz.children.length - 1);
    luz.nucleo.scale.set((3 + 3 * b) / LADO);
    luz.nucleo.alpha = 1;
  }

  /** Os raios em volta do núcleo: mais e mais longos com o XP; cada um com o seu comprimento, cintilando. */
  private raios(luz: Luz, b: number, sorte: number, tMs: number, semente: number): void {
    const comuns = Math.round(RAIOS_MIN + (RAIOS_MAX - RAIOS_MIN) * b);
    const extras = sorte >= 5 ? 6 : sorte > 1 ? 4 : 0;
    const n = comuns + extras;
    while (luz.raios.length < n) {
      const r = this.sprite(this.raio(), 0, 0.5);
      luz.raiz.addChild(r);
      luz.raios.push(r);
    }
    while (luz.raios.length > n) luz.raios.pop()?.destroy();
    const giro = tMs / 9000;
    const comprimento = 10 + 34 * b;
    luz.raios.forEach((r, i) => {
      const extra = i >= comuns;
      const fase = acaso(semente, i);
      const cintila = tMs === 0 ? 1 : 0.7 + 0.3 * Math.sin(tMs / (260 + fase * 380) + fase * 6.28);
      // Os comuns espalhados por igual, com um desvio próprio; os da sorte entre eles, deslocados.
      const base = extra ? ((i - comuns + 0.5) / Math.max(1, extras)) * Math.PI * 2 : (i / comuns) * Math.PI * 2;
      r.rotation = base + (fase - 0.5) * 0.35 + giro * (i % 2 === 0 ? 1 : -1);
      const tamanho = comprimento * (extra ? 1.5 : 0.55 + 0.6 * fase) * (0.85 + 0.15 * cintila);
      r.scale.set(tamanho / RAIO_C, (extra ? 3 : 2) / RAIO_E + b * (1.2 / RAIO_E));
      r.alpha = (extra ? 0.95 : 0.55 + 0.35 * b) * cintila;
    });
  }

  /** Esconde ou mostra sem destruir (fora da vista da câmera). */
  visivel(id: string, v: boolean): void {
    const luz = this.luzes.get(id);
    if (luz) luz.raiz.visible = v;
  }

  /** Destrói as luzes que não estão mais no estado. */
  podar(vistos: ReadonlySet<string>): void {
    for (const [id, luz] of this.luzes) {
      if (vistos.has(id)) continue;
      luz.raiz.destroy({ children: true });
      this.luzes.delete(id);
    }
  }

  /** Troca de visão: todas saem e voltam no próximo quadro. */
  limpar(): void {
    for (const luz of this.luzes.values()) luz.raiz.destroy({ children: true });
    this.luzes.clear();
  }

  destruir(): void {
    this.limpar();
    this.texturaBrilho?.destroy(true);
    this.texturaRaio?.destroy(true);
    this.texturaBrilho = null;
    this.texturaRaio = null;
  }
}
