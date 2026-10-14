// Câmera (§2.4): adaptador que guarda o estado da câmera e aplica as funções puras de
// camera-calculo.ts ao container do mundo. Dois modos: janela morta (padrão) e centralizada.
// Marco 12 (14/10/2026): "enquadrar dois" (foco no ponto médio entre o jogador e o alvo, respeitando
// 4 s depois de pinça, roda ou arrasto, §2.4) e o deslocamento dos presets de impacto no desenho.

import type { Container } from 'pixi.js';
import type { Celula } from '../core/comandos';
import type { ModoCamera } from '../plataforma/preferencias';
import {
  aproximar,
  CELULA_PX,
  janelaMortaEixo,
  limitarEixo,
  MARGEM_DESKTOP,
  MARGEM_TOQUE,
  telaParaCelula,
  velocidadeMaximaCamera,
  zoomAncorado,
  LIMITES_JOGO,
  type LimitesZoom,
  type Vista,
} from './camera-calculo';

/** Depois de mexer na câmera à mão, o "enquadrar dois" espera 4 s (§2.4). */
export const JANELA_MANUAL_MS = 4000;

export class Camera {
  x = 0;
  y = 0;
  zoom = 1;
  private alvoX = 0;
  private alvoY = 0;
  private vista: Vista = { largura: 1, altura: 1 };
  private ultimaCelula: Celula | null = null;
  /** Ponto (em células) a enquadrar no lugar do jogador; null = segue o jogador. */
  private foco: { x: number; y: number } | null = null;
  private ultimaManualMs = -Infinity;

  constructor(
    private readonly larguraMundo: number,
    private readonly alturaMundo: number,
    public modo: ModoCamera,
    private readonly toque: boolean,
    private readonly limites: LimitesZoom = LIMITES_JOGO,
  ) {}

  definirVista(vista: Vista): void {
    this.vista = { largura: Math.max(1, vista.largura), altura: Math.max(1, vista.altura) };
    this.x = this.limitarX(this.x);
    this.y = this.limitarY(this.y);
    this.alvoX = this.limitarX(this.alvoX);
    this.alvoY = this.limitarY(this.alvoY);
  }

  get vistaAtual(): Vista {
    return this.vista;
  }

  private get larguraVistaMundo(): number {
    return this.vista.largura / this.zoom;
  }

  private get alturaVistaMundo(): number {
    return this.vista.altura / this.zoom;
  }

  private limitarX(x: number): number {
    return limitarEixo(x, this.larguraMundo, this.larguraVistaMundo);
  }

  private limitarY(y: number): number {
    return limitarEixo(y, this.alturaMundo, this.alturaVistaMundo);
  }

  /** Centraliza imediatamente numa célula (entrada na fase). */
  centralizar(c: Celula): void {
    this.x = this.alvoX = this.limitarX((c.x + 0.5) * CELULA_PX - this.larguraVistaMundo / 2);
    this.y = this.alvoY = this.limitarY((c.y + 0.5) * CELULA_PX - this.alturaVistaMundo / 2);
    this.ultimaCelula = { x: c.x, y: c.y };
  }

  /** Janela morta: disparada pela mudança de célula lógica, recalculando só o eixo que mudou. */
  seguirCelula(c: Celula): void {
    const anterior = this.ultimaCelula;
    this.ultimaCelula = { x: c.x, y: c.y };
    if (this.modo !== 'janela' || !anterior) return;
    const margem = this.toque ? MARGEM_TOQUE : MARGEM_DESKTOP;
    if (anterior.x !== c.x) {
      this.alvoX = this.limitarX(janelaMortaEixo(this.alvoX, (c.x + 0.5) * CELULA_PX, this.larguraVistaMundo, margem));
    }
    if (anterior.y !== c.y) {
      this.alvoY = this.limitarY(janelaMortaEixo(this.alvoY, (c.y + 0.5) * CELULA_PX, this.alturaVistaMundo, margem));
    }
  }

  /**
   * Enquadrar dois (§2.4): pede o ponto médio entre o jogador e o alvo. Ignorado por 4 s depois de
   * uma mexida manual na câmera. `null` volta a seguir só o jogador.
   */
  enquadrar(ponto: { x: number; y: number } | null, agoraMs: number): void {
    this.foco = ponto && agoraMs - this.ultimaManualMs >= JANELA_MANUAL_MS ? ponto : null;
  }

  /** Avança a suavização. `posicaoJogador` em células (posição de render). */
  atualizar(dtS: number, posicaoJogador: { x: number; y: number }, velocidadeJogador: number): void {
    if (this.foco) {
      this.alvoX = this.limitarX((this.foco.x + 0.5) * CELULA_PX - this.larguraVistaMundo / 2);
      this.alvoY = this.limitarY((this.foco.y + 0.5) * CELULA_PX - this.alturaVistaMundo / 2);
      const vMax = velocidadeMaximaCamera(velocidadeJogador);
      this.x = aproximar(this.x, this.alvoX, vMax, dtS);
      this.y = aproximar(this.y, this.alvoY, vMax, dtS);
      return;
    }
    if (this.modo === 'centralizada') {
      this.x = this.alvoX = this.limitarX((posicaoJogador.x + 0.5) * CELULA_PX - this.larguraVistaMundo / 2);
      this.y = this.alvoY = this.limitarY((posicaoJogador.y + 0.5) * CELULA_PX - this.alturaVistaMundo / 2);
      return;
    }
    const vMax = velocidadeMaximaCamera(velocidadeJogador);
    this.x = aproximar(this.x, this.alvoX, vMax, dtS);
    this.y = aproximar(this.y, this.alvoY, vMax, dtS);
  }

  /** Arrasto manual em px de tela. */
  arrastar(dxTela: number, dyTela: number): void {
    this.ultimaManualMs = performance.now();
    this.foco = null;
    this.x = this.alvoX = this.limitarX(this.x - dxTela / this.zoom);
    this.y = this.alvoY = this.limitarY(this.y - dyTela / this.zoom);
  }

  /** Zoom ancorado num ponto da vista (px de tela). */
  zoomEm(novoZoom: number, ancoraX: number, ancoraY: number): void {
    this.ultimaManualMs = performance.now();
    this.foco = null;
    const r = zoomAncorado({ x: this.x, y: this.y }, this.zoom, novoZoom, ancoraX, ancoraY, this.limites);
    const dx = r.x - this.x;
    const dy = r.y - this.y;
    this.zoom = r.zoom;
    this.x = this.limitarX(r.x);
    this.y = this.limitarY(r.y);
    this.alvoX = this.limitarX(this.alvoX + dx);
    this.alvoY = this.limitarY(this.alvoY + dy);
  }

  celulaSob(sx: number, sy: number): Celula {
    return telaParaCelula({ x: this.x, y: this.y }, this.zoom, sx, sy);
  }

  /** Centro de uma posição (em células) em px de tela. */
  paraTela(cx: number, cy: number): { x: number; y: number } {
    return {
      x: ((cx + 0.5) * CELULA_PX - this.x) * this.zoom,
      y: ((cy + 0.5) * CELULA_PX - this.y) * this.zoom,
    };
  }

  /** Retângulo visível em px de mundo (para o descarte de blocos do terreno). */
  retanguloVisivel(alturaTotalTela: number): [number, number, number, number] {
    return [this.x, this.y, this.x + this.larguraVistaMundo, this.y + alturaTotalTela / this.zoom];
  }

  /** `impacto`: deslocamento (px de tela) e zoom extra dos presets de impacto; não muda o estado da câmera. */
  aplicar(mundo: Container, impacto: { dx: number; dy: number; zoomExtra: number } = { dx: 0, dy: 0, zoomExtra: 0 }): void {
    const zoom = this.zoom * (1 + impacto.zoomExtra);
    // O soco de zoom é ancorado no centro da vista.
    const cx = this.x + this.larguraVistaMundo / 2;
    const cy = this.y + this.alturaVistaMundo / 2;
    const x = cx - this.vista.largura / 2 / zoom;
    const y = cy - this.vista.altura / 2 / zoom;
    mundo.scale.set(zoom);
    // Guarda em float; arredonda só no desenho (§2.4).
    mundo.position.set(Math.round(-x * zoom + impacto.dx), Math.round(-y * zoom + impacto.dy));
  }
}
