// Pinta o chão texturizado de um bloco num canvas (marco 31, 31/10/2026, D-130). Com as máscaras de
// render/solo/mascaras.ts: a textura de base, cada camada por cima recortada pelo seu peso (bordas macias), as
// manchas de variação, a mesma base em outra escala e girada (esconde a repetição), a sombra de escala grande, a
// oclusão junto às paredes e, por fim, a tinta do tema em `multiply`. O padrão da textura é alinhado ao mundo, então
// o desenho continua de um bloco para o outro.

import type { SoloTema, TexturaSolo } from '../../world/solo';
import type { CamadaSolo, PesosDoBloco } from './mascaras';
import type { TexturasDoSolo } from './texturas';
import { areaNoRetangulo, centroDaArea, contornoDaArea, ESTILOS_AMBIENTE, veiosDaArea } from './ambientes-solo';
import type { AreaAmbiente } from '../../world/ambiente-tipos';
import { CELULA_PX } from '../camera-calculo';

const COR_AGUA = '#15303d';
const COR_ESCURO = '#07060a';
/** Quanto a pedra da parede escurece (vista de cima: o topo das paredes, mais fundo que o chão). */
const ESCURECER_PAREDE = 0.78;
/** A segunda passada da base: escala, giro (rad) e força (`soft-light`). */
const MACRO_ESCALA = 2.7;
const MACRO_GIRO = 0.3;
const MACRO_ALFA = 0.28;

type Contexto2D = CanvasRenderingContext2D;

const hexCss = (cor: number) => `#${cor.toString(16).padStart(6, '0')}`;

/** Os canvases de trabalho (reaproveitados de bloco em bloco). */
export class AssadorDeSolo {
  private readonly rascunho = document.createElement('canvas');
  private readonly mascara = document.createElement('canvas');
  /** Marco 31 (D-130): o contorno desfocado de uma área elemental (o recorte em `destination-in`). */
  private readonly recorte = document.createElement('canvas');

  constructor(
    private readonly texturas: TexturasDoSolo,
    private readonly solo: SoloTema,
    /** Pixels do canvas por pixel de mundo (a qualidade). */
    private readonly escala: number,
    /** Marco 31 (D-130): as áreas elementais da fase e a semente do desenho delas. */
    private readonly areas: readonly AreaAmbiente[] = [],
    private readonly semente = 0,
  ) {}

  /** Lado do canvas para `celulas` células. */
  lado(celulas: number): number {
    return Math.max(1, Math.round(celulas * CELULA_PX * this.escala));
  }

  /** Pinta o bloco cujo canto (em px de mundo) é `origemX`, `origemY`. */
  assar(destino: HTMLCanvasElement, pesos: PesosDoBloco, origemX: number, origemY: number): void {
    const g = destino.getContext('2d');
    if (!g) return;
    const l = destino.width;
    const a = destino.height;
    this.rascunho.width = l;
    this.rascunho.height = a;
    this.mascara.width = pesos.largura;
    this.mascara.height = pesos.altura;
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
    const [primeira, ...outras] = pesos.camadas;
    if (primeira) {
      g.fillStyle = this.preenchimento(g, primeira.camada, origemX, origemY, 1, 0);
      g.fillRect(0, 0, l, a);
    }
    // A segunda passada da base, maior e girada: quebra a repetição.
    const base = primeira?.camada;
    if (base && this.texturas.has(base as TexturaSolo)) {
      g.globalCompositeOperation = 'soft-light';
      g.globalAlpha = MACRO_ALFA;
      g.fillStyle = this.preenchimento(g, base, origemX, origemY, MACRO_ESCALA, MACRO_GIRO);
      g.fillRect(0, 0, l, a);
      g.globalCompositeOperation = 'source-over';
      g.globalAlpha = 1;
    }
    this.recortada(g, this.solo.variacao, pesos.variacao, origemX, origemY, pesos, 1.3);
    // Marco 31 (D-130): as áreas elementais sobre o chão e sob as paredes (a água, a parede e o escuro cobrem a borda).
    const solida = (c: CamadaSolo) => c === 'agua' || c === this.solo.parede || c === 'escuro' || c === 'vazio';
    for (const { camada, pesos: p } of outras) if (!solida(camada)) this.recortada(g, camada, p, origemX, origemY, pesos, 1);
    this.ambientes(g, origemX, origemY, l, a);
    for (const { camada, pesos: p } of outras) if (solida(camada) && camada !== 'vazio') this.recortada(g, camada, p, origemX, origemY, pesos, 1);
    this.sombra(g, pesos.macro, pesos);
    this.sombra(g, pesos.ao, pesos);
    g.globalCompositeOperation = 'multiply';
    g.fillStyle = hexCss(this.solo.tinta);
    g.fillRect(0, 0, l, a);
    // As rachaduras acesas depois da tinta (o brilho não escurece com o tema).
    this.veiosDasAreas(g, origemX, origemY, l, a);
    // O vazio por último: apaga (transparente), com a borda macia da máscara.
    const vazio = outras.find((c) => c.camada === 'vazio');
    if (vazio) {
      this.pintarMascara(vazio.pesos, pesos);
      g.globalCompositeOperation = 'destination-out';
      g.imageSmoothingEnabled = true;
      g.drawImage(this.mascara, 0, 0, l, a);
    }
    g.globalCompositeOperation = 'source-over';
  }

  /** O padrão da textura alinhado ao mundo (ou a cor da água e do escuro). */
  private preenchimento(g: Contexto2D, camada: CamadaSolo, origemX: number, origemY: number, escalaExtra: number, giro: number): string | CanvasPattern {
    if (camada === 'agua') return COR_AGUA;
    if (camada === 'escuro' || camada === 'vazio') return COR_ESCURO;
    const img = this.texturas.get(camada);
    const padrao = img ? g.createPattern(img, 'repeat') : null;
    if (!img || !padrao) return COR_ESCURO;
    // Uma repetição cobre `escala` células: px de mundo por pixel da textura.
    const k = (this.solo.escala * CELULA_PX * escalaExtra) / img.width;
    padrao.setTransform(new DOMMatrix().scaleSelf(this.escala).translateSelf(-origemX, -origemY).rotateSelf((giro * 180) / Math.PI).scaleSelf(k));
    return padrao;
  }

  /** Uma camada por cima, recortada pela máscara dos seus pesos. */
  private recortada(g: Contexto2D, camada: CamadaSolo, pesos: Float32Array, origemX: number, origemY: number, dim: PesosDoBloco, escalaExtra: number): void {
    if (!pesos.some((p) => p > 0.002)) return;
    const r = this.rascunho.getContext('2d');
    if (!r) return;
    r.globalCompositeOperation = 'source-over';
    r.clearRect(0, 0, this.rascunho.width, this.rascunho.height);
    r.fillStyle = this.preenchimento(r, camada, origemX, origemY, escalaExtra, 0);
    r.fillRect(0, 0, this.rascunho.width, this.rascunho.height);
    if (camada === this.solo.parede) {
      r.fillStyle = `rgba(0,0,0,${ESCURECER_PAREDE})`;
      r.fillRect(0, 0, this.rascunho.width, this.rascunho.height);
    }
    this.pintarMascara(pesos, dim);
    r.globalCompositeOperation = 'destination-in';
    r.imageSmoothingEnabled = true;
    r.drawImage(this.mascara, 0, 0, this.rascunho.width, this.rascunho.height);
    g.drawImage(this.rascunho, 0, 0);
  }

  /**
   * Marco 31 (D-130): as áreas elementais que tocam o bloco: a textura e a cor do elemento recortadas pelo contorno
   * orgânico (borda desfocada pela sombra do canvas), na resolução cheia do bloco.
   * Ajuste de 31/10/2026: o contorno é pintado num canvas à parte e só depois recorta (desenhado direto em
   * `destination-in`, o próprio contorno fora da tela apagava o preenchimento e sobravam só as rachaduras); o
   * núcleo ganha o brilho do elemento, como na pintura por manchas de antes.
   */
  private ambientes(g: Contexto2D, origemX: number, origemY: number, l: number, a: number): void {
    const r = this.rascunho.getContext('2d');
    if (!r) return;
    const k = this.escala;
    const x0 = origemX / CELULA_PX;
    const y0 = origemY / CELULA_PX;
    for (const area of this.areas) {
      if (!areaNoRetangulo(area, x0, y0, x0 + l / k / CELULA_PX, y0 + a / k / CELULA_PX)) continue;
      const e = ESTILOS_AMBIENTE[area.tipo];
      r.save();
      r.globalCompositeOperation = 'source-over';
      r.globalAlpha = 1;
      r.clearRect(0, 0, l, a);
      if (e.textura && this.texturas.has(e.textura)) {
        r.fillStyle = this.preenchimento(r, e.textura, origemX, origemY, 0.8, 0.6);
        r.fillRect(0, 0, l, a);
        r.globalCompositeOperation = 'multiply';
      }
      r.globalAlpha = e.textura ? 1 : e.forca;
      r.fillStyle = e.cor;
      r.fillRect(0, 0, l, a);
      // O núcleo: a cor do veio se espalha do centro, mais forte no meio (a mancha pintada).
      const c = centroDaArea(area);
      const cx = (c.x * CELULA_PX - origemX) * k;
      const cy = (c.y * CELULA_PX - origemY) * k;
      const raio = (area.raio + 0.5) * CELULA_PX * k;
      const nucleo = r.createRadialGradient(cx, cy, 0, cx, cy, raio);
      nucleo.addColorStop(0, e.veio);
      nucleo.addColorStop(1, 'rgba(0,0,0,0)');
      r.globalCompositeOperation = e.brilha ? 'lighter' : 'source-over';
      r.globalAlpha = e.brilha ? 0.35 : 0.2;
      r.fillStyle = nucleo;
      r.fillRect(0, 0, l, a);
      r.restore();
      if (!this.recortar(r, area, origemX, origemY, l, a)) continue;
      g.globalAlpha = e.textura ? e.forca : 1;
      g.drawImage(this.rascunho, 0, 0);
      g.globalAlpha = 1;
    }
  }

  /** Recorta o rascunho pelo contorno desfocado da área (pintado à parte, trazido pela sombra do canvas). */
  private recortar(r: Contexto2D, area: AreaAmbiente, origemX: number, origemY: number, l: number, a: number): boolean {
    if (this.recorte.width !== l || this.recorte.height !== a) {
      this.recorte.width = l;
      this.recorte.height = a;
    }
    const m = this.recorte.getContext('2d');
    if (!m) return false;
    const k = this.escala;
    m.save();
    m.clearRect(0, 0, l, a);
    const longe = l + a + 1000;
    m.shadowColor = '#000';
    m.shadowBlur = CELULA_PX * 0.3 * k;
    m.shadowOffsetX = longe;
    m.fillStyle = '#000';
    m.beginPath();
    contornoDaArea(area, this.semente).forEach((p, n) => {
      const x = (p.x * CELULA_PX - origemX) * k - longe;
      const y = (p.y * CELULA_PX - origemY) * k;
      if (n === 0) m.moveTo(x, y);
      else m.lineTo(x, y);
    });
    m.closePath();
    m.fill();
    m.restore();
    r.save();
    r.globalCompositeOperation = 'destination-in';
    r.globalAlpha = 1;
    r.drawImage(this.recorte, 0, 0);
    r.restore();
    return true;
  }

  /** As rachaduras das áreas (brasa, raio, geada…): linhas com brilho, somadas em `lighter` nas que brilham. */
  private veiosDasAreas(g: Contexto2D, origemX: number, origemY: number, l: number, a: number): void {
    const k = this.escala;
    const x0 = origemX / CELULA_PX;
    const y0 = origemY / CELULA_PX;
    for (const area of this.areas) {
      const e = ESTILOS_AMBIENTE[area.tipo];
      if (e.forcaVeio <= 0 || !areaNoRetangulo(area, x0, y0, x0 + l / k / CELULA_PX, y0 + a / k / CELULA_PX)) continue;
      g.save();
      g.globalCompositeOperation = e.brilha ? 'lighter' : 'source-over';
      g.globalAlpha = e.forcaVeio;
      g.strokeStyle = e.veio;
      g.lineCap = 'round';
      g.lineJoin = 'round';
      g.shadowColor = e.veio;
      g.shadowBlur = e.brilha ? 6 * k : 0;
      for (const linha of veiosDaArea(area, this.semente)) {
        g.lineWidth = Math.max(1, 2.2 * k);
        g.beginPath();
        linha.forEach((p, n) => {
          const x = (p.x * CELULA_PX - origemX) * k;
          const y = (p.y * CELULA_PX - origemY) * k;
          if (n === 0) g.moveTo(x, y);
          else g.lineTo(x, y);
        });
        g.stroke();
      }
      g.restore();
    }
  }

  /** Escurece pelo peso (a oclusão e a sombra grande). */
  private sombra(g: Contexto2D, pesos: Float32Array, dim: PesosDoBloco): void {
    if (!pesos.some((p) => p > 0.002)) return;
    const r = this.rascunho.getContext('2d');
    if (!r) return;
    r.globalCompositeOperation = 'source-over';
    r.clearRect(0, 0, this.rascunho.width, this.rascunho.height);
    r.fillStyle = '#000';
    r.fillRect(0, 0, this.rascunho.width, this.rascunho.height);
    this.pintarMascara(pesos, dim);
    r.globalCompositeOperation = 'destination-in';
    r.imageSmoothingEnabled = true;
    r.drawImage(this.mascara, 0, 0, this.rascunho.width, this.rascunho.height);
    g.drawImage(this.rascunho, 0, 0);
  }

  /** A máscara pequena (uma amostra por pixel), esticada com suavização na hora de recortar. */
  private pintarMascara(pesos: Float32Array, dim: PesosDoBloco): void {
    const m = this.mascara.getContext('2d');
    if (!m) return;
    const img = m.createImageData(dim.largura, dim.altura);
    for (let i = 0; i < pesos.length; i++) {
      const o = i * 4;
      img.data[o] = 255;
      img.data[o + 1] = 255;
      img.data[o + 2] = 255;
      img.data[o + 3] = Math.round(Math.max(0, Math.min(1, pesos[i] ?? 0)) * 255);
    }
    m.putImageData(img, 0, 0);
  }
}
