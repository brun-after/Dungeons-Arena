// Pinta o chão texturizado de um bloco num canvas (marco 31, 31/10/2026, D-130). Com as máscaras de
// render/solo/mascaras.ts: a textura de base, cada camada por cima recortada pelo seu peso (bordas macias), as
// manchas de variação, a mesma base em outra escala e girada (esconde a repetição), a sombra de escala grande, a
// oclusão junto às paredes e, por fim, a tinta do tema em `multiply`. O padrão da textura é alinhado ao mundo, então
// o desenho continua de um bloco para o outro.

import type { SoloTema, TexturaSolo } from '../../world/solo';
import type { CamadaSolo, PesosDoBloco } from './mascaras';
import type { TexturasDoSolo } from './texturas';
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

  constructor(
    private readonly texturas: TexturasDoSolo,
    private readonly solo: SoloTema,
    /** Pixels do canvas por pixel de mundo (a qualidade). */
    private readonly escala: number,
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
    for (const { camada, pesos: p } of outras) if (camada !== 'vazio') this.recortada(g, camada, p, origemX, origemY, pesos, 1);
    this.sombra(g, pesos.macro, pesos);
    this.sombra(g, pesos.ao, pesos);
    g.globalCompositeOperation = 'multiply';
    g.fillStyle = hexCss(this.solo.tinta);
    g.fillRect(0, 0, l, a);
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
