// Câmera (§2.4): adaptador que guarda o estado da câmera e aplica as funções puras de
// camera-calculo.ts ao container do mundo. Dois modos: janela morta (padrão) e centralizada.
// Marco 12 (14/10/2026): "enquadrar dois" (foco no ponto médio entre o jogador e o alvo, respeitando
// 4 s depois de pinça, roda ou arrasto, §2.4) e o deslocamento dos presets de impacto no desenho.
// Marco 13 (14/10/2026), D-058: a câmera opera no mundo projetado (`Projecao`); de cima, a projeção é a
// identidade e tudo fica como antes. O toque vira célula por `desprojetar`, nas duas visões.

import type { Container } from 'pixi.js';
import type { Celula } from '../core/comandos';
import type { ModoCamera } from '../plataforma/preferencias';
import {
  acomodarNaBorda,
  CELULA_PX,
  aproximar,
  janelaMortaEixo,
  limitarEixo,
  MARGEM_DESKTOP,
  MARGEM_TOQUE,
  velocidadeMaximaCamera,
  zoomAncorado,
  LIMITES_JOGO,
  type LimitesZoom,
  type Vista,
} from './camera-calculo';
import { celulaSobProjetado, centroDaCelula, pontoSobProjetado, type Projecao } from './projecao';

/** Marco 53 (D-203): o olhar do mouse: a zona central sem efeito, o desvio máximo e a rapidez (por segundo). */
const OLHAR_ZONA_MORTA = 0.2;
const OLHAR_FRACAO = 0.22;
const OLHAR_SUAVIDADE = 3;

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
  /**
   * Marco 26 (28/10/2026, D-117): o jogador arrastou (ou deu zoom) e a câmera ficou onde ele deixou: andar não a
   * recentraliza; só o boneco que sai inteiro da vista a faz andar, até a borda. `recentralizar()` volta ao normal.
   */
  private solta = false;
  /** D-117: a borda que acompanha o boneco depois de reenquadrá-lo, por eixo (−1 início, 1 fim, 0 nenhuma). */
  private presaX: -1 | 0 | 1 = 0;
  private presaY: -1 | 0 | 1 = 0;
  /**
   * Marco 53 (22/11/2026, D-203): a câmera olha para onde o mouse aponta (também segurando o clique para andar). O
   * desvio (px do mundo) soma-se à origem só no desenho e nas conversões de tela; a janela morta não o vê.
   */
  private olharX = 0;
  private olharY = 0;
  private mira: { x: number; y: number } | null = null;

  constructor(
    private projecao: Projecao,
    public modo: ModoCamera,
    private readonly toque: boolean,
    private readonly limites: LimitesZoom = LIMITES_JOGO,
  ) {}

  get projecaoAtual(): Projecao {
    return this.projecao;
  }

  /** Troca a visão (de cima <-> isométrica) mantendo o mesmo ponto da fase no centro da vista. */
  definirProjecao(p: Projecao): void {
    const centro = this.projecao.desprojetar(this.x + this.larguraVistaMundo / 2, this.y + this.alturaVistaMundo / 2);
    this.projecao = p;
    const novo = p.projetar(centro.x, centro.y);
    this.x = this.alvoX = this.limitarX(novo.x - this.larguraVistaMundo / 2);
    this.y = this.alvoY = this.limitarY(novo.y - this.alturaVistaMundo / 2);
  }

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
    return limitarEixo(x, this.projecao.largura, this.larguraVistaMundo);
  }

  private limitarY(y: number): number {
    return limitarEixo(y, this.projecao.altura, this.alturaVistaMundo);
  }

  /** Centro de uma posição (em células) no mundo projetado. */
  private centro(cx: number, cy: number): { x: number; y: number } {
    const c = centroDaCelula(cx, cy);
    return this.projecao.projetar(c.x, c.y);
  }

  private origemPara(cx: number, cy: number): { x: number; y: number } {
    const c = this.centro(cx, cy);
    return { x: this.limitarX(c.x - this.larguraVistaMundo / 2), y: this.limitarY(c.y - this.alturaVistaMundo / 2) };
  }

  /** Centraliza imediatamente numa célula (entrada na fase). */
  /** Marco 41 (14/11/2026, D-169): onde a célula fica em relação ao centro da vista (px do mundo). */
  desvio(c: Celula): { x: number; y: number } {
    const k = this.centro(c.x, c.y);
    return { x: k.x - (this.x + this.larguraVistaMundo / 2), y: k.y - (this.y + this.alturaVistaMundo / 2) };
  }

  /**
   * D-169: começa com a célula `d` fora do centro (a vista igual à da cena de antes, na troca de região) e desliza
   * até centralizá-la: sem salto, e mostrando mais do caminho à frente que do que ficou para trás.
   */
  centralizarComDesvio(c: Celula, d: { x: number; y: number }): void {
    this.centralizar(c);
    const k = this.centro(c.x, c.y);
    this.x = this.limitarX(k.x - d.x - this.larguraVistaMundo / 2);
    this.y = this.limitarY(k.y - d.y - this.alturaVistaMundo / 2);
  }

  centralizar(c: Celula): void {
    const o = this.origemPara(c.x, c.y);
    this.x = this.alvoX = o.x;
    this.y = this.alvoY = o.y;
    this.ultimaCelula = { x: c.x, y: c.y };
  }

  /**
   * Janela morta: disparada pela mudança de célula lógica, recalculando só o eixo da tela que mudou
   * (de cima, o eixo da grade; no isométrico, um passo na grade mexe nos dois eixos da tela).
   */
  seguirCelula(c: Celula): void {
    const anterior = this.ultimaCelula;
    this.ultimaCelula = { x: c.x, y: c.y };
    if (this.modo !== 'janela' || !anterior) return;
    if (this.solta) {
      this.acomodar(c);
      return;
    }
    const margem = this.toque ? MARGEM_TOQUE : MARGEM_DESKTOP;
    const antes = this.centro(anterior.x, anterior.y);
    const agora = this.centro(c.x, c.y);
    if (antes.x !== agora.x) this.alvoX = this.limitarX(janelaMortaEixo(this.alvoX, agora.x, this.larguraVistaMundo, margem));
    if (antes.y !== agora.y) this.alvoY = this.limitarY(janelaMortaEixo(this.alvoY, agora.y, this.alturaVistaMundo, margem));
  }

  /** D-117: a caixa do boneco (o desenho sobe acima do centro da célula); fora da vista, vai à borda mais perto. */
  private acomodar(c: Celula): void {
    const centro = this.centro(c.x, c.y);
    const P = CELULA_PX;
    const meia = P / 2;
    const alturaDesenho = this.projecao.visao === 'iso' ? P * 1.3 : meia;
    const x = acomodarNaBorda(this.alvoX, centro.x - meia, centro.x + meia, this.larguraVistaMundo, P, this.presaX);
    const y = acomodarNaBorda(this.alvoY, centro.y - alturaDesenho, centro.y + meia, this.alturaVistaMundo, P, this.presaY);
    this.alvoX = this.limitarX(x.origem);
    this.alvoY = this.limitarY(y.origem);
    this.presaX = x.presa;
    this.presaY = y.presa;
  }

  get estaSolta(): boolean {
    return this.solta;
  }

  /** D-117: o botão de centralizar (toque duplo) e a tecla C: volta a seguir o jogador e vai até ele, suave. */
  recentralizar(): void {
    this.solta = false;
    this.presaX = this.presaY = 0;
    this.foco = null;
    const c = this.ultimaCelula;
    if (!c) return;
    const o = this.origemPara(c.x, c.y);
    this.alvoX = o.x;
    this.alvoY = o.y;
  }

  /**
   * Enquadrar dois (§2.4): pede o ponto médio entre o jogador e o alvo. Ignorado por 4 s depois de
   * uma mexida manual na câmera. `null` volta a seguir só o jogador.
   */
  enquadrar(ponto: { x: number; y: number } | null, agoraMs: number): void {
    this.foco = ponto && !this.solta && agoraMs - this.ultimaManualMs >= JANELA_MANUAL_MS ? ponto : null;
  }

  /**
   * Marco 53 (D-203): onde o mouse aponta, em fração da vista a partir do centro (−1 a 1 nos dois eixos); null para de
   * olhar (o desvio volta a zero, suave).
   */
  mirar(fracao: { x: number; y: number } | null): void {
    this.mira = fracao;
  }

  /** Marco 53 (D-203): o desvio para onde o mouse aponta, suavizado; fora da zona central, até 22% da vista. */
  private avancarOlhar(dtS: number): void {
    const eixo = (f: number) => {
      const a = Math.abs(f);
      return a <= OLHAR_ZONA_MORTA ? 0 : (Math.sign(f) * Math.min(1, (a - OLHAR_ZONA_MORTA) / (1 - OLHAR_ZONA_MORTA))) * OLHAR_FRACAO;
    };
    const m = this.mira && !this.solta && !this.foco ? this.mira : { x: 0, y: 0 };
    const alvoX = eixo(m.x) * this.larguraVistaMundo;
    const alvoY = eixo(m.y) * this.alturaVistaMundo;
    const k = Math.min(1, dtS * OLHAR_SUAVIDADE);
    this.olharX += (alvoX - this.olharX) * k;
    this.olharY += (alvoY - this.olharY) * k;
  }

  /** A origem vista (com o desvio do mouse), dentro do mapa. */
  private get vx(): number {
    return this.limitarX(this.x + this.olharX);
  }

  private get vy(): number {
    return this.limitarY(this.y + this.olharY);
  }

  /** Avança a suavização. `posicaoJogador` em células (posição de render). */
  atualizar(dtS: number, posicaoJogador: { x: number; y: number }, velocidadeJogador: number): void {
    this.avancarOlhar(dtS);
    if (this.foco) {
      const o = this.origemPara(this.foco.x, this.foco.y);
      this.alvoX = o.x;
      this.alvoY = o.y;
      const vMax = velocidadeMaximaCamera(velocidadeJogador);
      this.x = aproximar(this.x, this.alvoX, vMax, dtS);
      this.y = aproximar(this.y, this.alvoY, vMax, dtS);
      return;
    }
    if (this.modo === 'centralizada') {
      const o = this.origemPara(posicaoJogador.x, posicaoJogador.y);
      this.x = this.alvoX = o.x;
      this.y = this.alvoY = o.y;
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
    if (this.modo === 'janela') this.solta = true;
    this.presaX = this.presaY = 0;
    this.x = this.alvoX = this.limitarX(this.x - dxTela / this.zoom);
    this.y = this.alvoY = this.limitarY(this.y - dyTela / this.zoom);
  }

  /** Zoom ancorado num ponto da vista (px de tela). */
  zoomEm(novoZoom: number, ancoraX: number, ancoraY: number): void {
    this.ultimaManualMs = performance.now();
    this.foco = null;
    if (this.modo === 'janela') this.solta = true;
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
    return celulaSobProjetado(this.projecao, this.vx + sx / this.zoom, this.vy + sy / this.zoom);
  }

  /** Marco 26 (D-104): o ponto contínuo da fase sob o ponto da tela (o irPara vai ao ponto tocado). */
  pontoSob(sx: number, sy: number): Celula {
    return pontoSobProjetado(this.projecao, this.vx + sx / this.zoom, this.vy + sy / this.zoom);
  }

  /** Centro de uma posição (em células) em px de tela. */
  paraTela(cx: number, cy: number): { x: number; y: number } {
    const c = this.centro(cx, cy);
    return { x: (c.x - this.vx) * this.zoom, y: (c.y - this.vy) * this.zoom };
  }

  /**
   * Retângulo visível em px de plano (para o descarte de blocos do terreno). No isométrico, a caixa
   * que envolve os quatro cantos da vista desprojetados.
   */
  retanguloVisivel(alturaTotalTela: number): [number, number, number, number] {
    const x0 = this.vx;
    const y0 = this.vy;
    const x1 = x0 + this.larguraVistaMundo;
    const y1 = y0 + alturaTotalTela / this.zoom;
    const cantos = [
      this.projecao.desprojetar(x0, y0),
      this.projecao.desprojetar(x1, y0),
      this.projecao.desprojetar(x0, y1),
      this.projecao.desprojetar(x1, y1),
    ];
    const xs = cantos.map((c) => c.x);
    const ys = cantos.map((c) => c.y);
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  }

  /** `impacto`: deslocamento (px de tela) e zoom extra dos presets de impacto; não muda o estado da câmera. */
  aplicar(mundo: Container, impacto: { dx: number; dy: number; zoomExtra: number } = { dx: 0, dy: 0, zoomExtra: 0 }): void {
    const zoom = this.zoom * (1 + impacto.zoomExtra);
    // O soco de zoom é ancorado no centro da vista.
    const cx = this.vx + this.larguraVistaMundo / 2;
    const cy = this.vy + this.alturaVistaMundo / 2;
    const x = cx - this.vista.largura / 2 / zoom;
    const y = cy - this.vista.altura / 2 / zoom;
    mundo.scale.set(zoom);
    // Guarda em float; arredonda só no desenho (§2.4).
    mundo.position.set(Math.round(-x * zoom + impacto.dx), Math.round(-y * zoom + impacto.dy));
  }
}
