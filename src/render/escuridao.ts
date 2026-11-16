// Escuridão e luz (marco 31, 31/10/2026, D-130). O mundo fica escuro fora da luz, como no Diablo: o jogador leva a
// sua luz, e as tochas, a lava, os portais, os objetos e os projéteis iluminam em volta.
// - `mapa` (qualidade média e alta): uma RenderTexture do tamanho da tela (em `resolucaoMapa`), limpa na cor do
//   escuro do tema e com as luzes somadas (sprites radiais aditivos nas posições da tela); um sprite de tela inteira
//   aplica o mapa sobre o mundo em `multiply`. Funciona igual de cima e no isométrico (as posições já vêm na tela).
// - `vinheta` (baixa e mínima, o padrão do celular): um escuro pré-pintado em volta do jogador, sem render texture.
//   Ajuste de 31/10/2026: a textura da vinheta é um quadrado; fora dele, quatro faixas do mesmo escuro cobrem o resto
//   da tela (antes aparecia um quadrado escuro seguindo o jogador, com a fase clara em volta).
// O container fica dentro do `mundo` (acima das entidades, abaixo das marcas, dos rótulos, dos projéteis e dos
// efeitos) e é reposicionado a cada quadro para cobrir a tela: desfaz o zoom e o deslocamento da câmera.

import { CanvasSource, Container, Graphics, RenderTexture, Sprite, Texture, type Renderer } from 'pixi.js';

export interface LuzNaTela {
  /** Posição em px de tela (CSS). */
  x: number;
  y: number;
  /** Raio em px de tela. */
  raio: number;
  cor: number;
  /** 0 a 1. */
  intensidade: number;
}

export interface ParametrosEscuridao {
  modo: 'mapa' | 'vinheta';
  /** A cor do escuro do tema. */
  ambiente: number;
  /** 0 = sem escuro; 1 = preto fora da luz. */
  nivel: number;
  /** O mínimo de luz em qualquer ponto (as silhuetas continuam visíveis). */
  realceMinimo: number;
  /** A resolução do mapa (fração da tela). */
  resolucao: number;
}

const LADO_RADIAL = 256;
/** O achatamento da luz no isométrico (o chão é achatado pela projeção; o corpo, não). */
export const ACHATAMENTO_ISO = 0.72;

/** A cor do escuro: do branco (sem escuro) até a cor do ambiente, com o mínimo de luz. */
export function corDoEscuro(ambiente: number, nivel: number, realceMinimo: number): number {
  const canal = (c: number) => {
    const v = 255 + (c - 255) * Math.max(0, Math.min(1, nivel));
    return Math.max(Math.round(realceMinimo * 255), Math.round(v));
  };
  return (canal((ambiente >> 16) & 0xff) << 16) | (canal((ambiente >> 8) & 0xff) << 8) | canal(ambiente & 0xff);
}

function texturaCanvas(desenhar: (g: CanvasRenderingContext2D, lado: number) => void): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = LADO_RADIAL;
  const g = canvas.getContext('2d');
  if (g) desenhar(g, LADO_RADIAL);
  return new Texture({ source: new CanvasSource({ resource: canvas }) });
}

/** A luz: branco no centro, apagando até a borda (a curva dá um núcleo forte e uma borda longa). */
function texturaLuz(): Texture {
  return texturaCanvas((g, lado) => {
    const m = lado / 2;
    const grad = g.createRadialGradient(m, m, 0, m, m, m);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.35, 'rgba(255,255,255,0.75)');
    grad.addColorStop(0.7, 'rgba(255,255,255,0.25)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, lado, lado);
  });
}

/** A vinheta: transparente no centro, opaca na borda (a cor vem do tint). */
function texturaVinheta(): Texture {
  return texturaCanvas((g, lado) => {
    const m = lado / 2;
    const grad = g.createRadialGradient(m, m, 0, m, m, m);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.18, 'rgba(255,255,255,0)');
    grad.addColorStop(0.42, 'rgba(255,255,255,0.75)');
    grad.addColorStop(0.62, 'rgba(255,255,255,1)');
    grad.addColorStop(1, 'rgba(255,255,255,1)');
    g.fillStyle = grad;
    g.fillRect(0, 0, lado, lado);
  });
}

export class CamadaEscuridao {
  readonly camada = new Container({ label: 'escuridao' });
  private readonly texLuz = texturaLuz();
  private readonly texVinheta = texturaVinheta();
  private readonly luzes = new Container({ label: 'luzes' });
  private readonly sprites: Sprite[] = [];
  private readonly vinheta = new Sprite(this.texVinheta);
  /** O escuro fora do quadrado da vinheta. */
  private readonly fora = new Graphics();
  private readonly cobre = new Sprite(Texture.EMPTY);
  private rt: RenderTexture | null = null;

  constructor(
    pai: Container,
    private readonly renderer: Renderer,
  ) {
    pai.addChild(this.camada);
    this.vinheta.anchor.set(0.5);
    this.cobre.blendMode = 'multiply';
    this.camada.addChild(this.cobre, this.vinheta, this.fora);
  }

  /**
   * Um quadro. `mundo`: o container com a câmera (para cobrir a tela); `largura`/`altura`: a tela em px CSS;
   * `centro`: o jogador na tela (a vinheta segue ele); `luzes`: as luzes na tela.
   */
  desenhar(mundo: Container, largura: number, altura: number, p: ParametrosEscuridao | null, centro: { x: number; y: number } | null, luzes: readonly LuzNaTela[]): void {
    const ligada = p !== null && p.nivel > 0;
    this.camada.visible = ligada;
    if (!ligada) return;
    // Desfaz a câmera: o container passa a medir em px de tela.
    const zoom = mundo.scale.x || 1;
    this.camada.scale.set(1 / zoom);
    this.camada.position.set((mundo.pivot.x * zoom - mundo.position.x) / zoom, (mundo.pivot.y * zoom - mundo.position.y) / zoom);
    const escuro = corDoEscuro(p.ambiente, p.nivel, p.realceMinimo);
    if (p.modo === 'vinheta') {
      this.cobre.visible = false;
      this.vinheta.visible = true;
      const c = centro ?? { x: largura / 2, y: altura / 2 };
      this.vinheta.position.set(c.x, c.y);
      // A borda opaca começa a ~0,62 do raio: cobre a tela com folga.
      this.vinheta.scale.set((Math.hypot(largura, altura) * 1.25) / LADO_RADIAL);
      this.vinheta.tint = p.ambiente;
      this.vinheta.alpha = Math.min(1, p.nivel * (1 - p.realceMinimo));
      const m = (this.vinheta.scale.x * LADO_RADIAL) / 2;
      const [x0, y0, x1, y1] = [c.x - m, c.y - m, c.x + m, c.y + m];
      const folga = 4;
      const [l, a] = [largura + folga, altura + folga];
      this.fora.clear();
      if (y0 > -folga) this.fora.rect(-folga, -folga, l + folga, y0 + folga);
      if (y1 < a) this.fora.rect(-folga, y1, l + folga, a - y1);
      if (x0 > -folga) this.fora.rect(-folga, y0, x0 + folga, y1 - y0);
      if (x1 < l) this.fora.rect(x1, y0, l - x1, y1 - y0);
      this.fora.fill({ color: p.ambiente, alpha: this.vinheta.alpha });
      this.fora.visible = true;
      return;
    }
    this.vinheta.visible = false;
    this.fora.visible = false;
    this.cobre.visible = true;
    const r = Math.max(0.1, Math.min(1, p.resolucao));
    const l = Math.max(1, Math.ceil(largura * r));
    const a = Math.max(1, Math.ceil(altura * r));
    if (!this.rt || this.rt.width !== l || this.rt.height !== a) {
      this.rt?.destroy(true);
      this.rt = RenderTexture.create({ width: l, height: a });
      this.cobre.texture = this.rt;
    }
    luzes.forEach((luz, i) => {
      let s = this.sprites[i];
      if (!s) {
        s = new Sprite(this.texLuz);
        s.anchor.set(0.5);
        s.blendMode = 'add';
        this.sprites.push(s);
        this.luzes.addChild(s);
      }
      s.visible = true;
      s.position.set(luz.x * r, luz.y * r);
      const k = (luz.raio * 2 * r) / LADO_RADIAL;
      s.scale.set(k, k * this.achatamento);
      s.tint = luz.cor;
      s.alpha = Math.max(0, Math.min(1, luz.intensidade));
    });
    for (let i = luzes.length; i < this.sprites.length; i++) {
      const s = this.sprites[i];
      if (s) s.visible = false;
    }
    this.renderer.render({ container: this.luzes, target: this.rt, clear: true, clearColor: escuro });
    this.cobre.position.set(0, 0);
    this.cobre.width = largura;
    this.cobre.height = altura;
  }

  /** O achatamento vertical das luzes: 1 de cima, `ACHATAMENTO_ISO` no isométrico. */
  achatamento = 1;

  destruir(): void {
    this.rt?.destroy(true);
    this.camada.destroy({ children: true });
    this.luzes.destroy({ children: true });
    this.texLuz.destroy(true);
    this.texVinheta.destroy(true);
  }
}
