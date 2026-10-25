// Montagem de um token fatiado (§2.16). Marco 13 (14/10/2026), D-058.
// Um container com o quadro inteiro (atalho de qualidade) e as 18 tiras, cada uma com as duas colunas das
// pernas; aplica a pose de render/caminhada.ts. A origem (0, 0) é a âncora da fonte: os pés na vista em pé,
// o centro na vista de cima.

import { Container, Sprite, type Texture } from 'pixi.js';
import { TIRAS, type Pose } from './caminhada';
import type { FonteToken } from './texturas-criaturas';

export interface AplicarRig {
  pose: Pose;
  /** Altura do quadro na tela, em px de mundo. */
  alturaPx: number;
  /** 1 olha para a direita; −1 espelha. */
  sentido: number;
  /** Rotação extra (vista de cima: o ângulo do olhar). */
  rotacao: number;
  /** Direção do olhar na tela (unitária), para o empurrão do ataque. */
  direcao: { x: number; y: number };
  usarTiras: boolean;
  /** Marco 24 (D-098): de cima o giro do Redemoinho roda o corpo; em pé, o corpo vira de lado (escala) e volta. */
  vistaDeCima?: boolean;
}

export class RigToken {
  readonly raiz = new Container({ label: 'token' });
  private readonly corpo = new Container();
  private readonly inteiro = new Sprite();
  /** D-067: o equipamento (capa atrás; armadura, elmo e armas na frente), no tamanho do quadro. */
  private readonly adornoAtras = new Sprite();
  private readonly adornoFrente = new Sprite();
  /** Marco 24 (25/10/2026, D-098): a arma principal, girando em torno da mão no golpe. */
  private readonly arma = new Sprite();
  private pivo = { x: 0, y: 0 };
  private readonly tiras: Sprite[] = [];
  private readonly colunas: [Sprite, Sprite][] = [];
  private fonte: FonteToken;

  constructor(fonte: FonteToken) {
    this.fonte = fonte;
    this.corpo.addChild(this.adornoAtras, this.inteiro);
    for (let i = 0; i < TIRAS; i++) {
      const s = new Sprite();
      const e = new Sprite();
      const d = new Sprite();
      this.tiras.push(s);
      this.colunas.push([e, d]);
      this.corpo.addChild(s, e, d);
    }
    this.corpo.addChild(this.adornoFrente, this.arma);
    this.adornoAtras.visible = this.adornoFrente.visible = this.arma.visible = false;
    this.raiz.addChild(this.corpo);
    this.trocarFonte(fonte);
  }

  get fonteAtual(): FonteToken {
    return this.fonte;
  }

  trocarFonte(f: FonteToken): void {
    this.fonte = f;
    const ox = -f.ancoraX * f.largura;
    const oy = -f.ancoraY * f.altura;
    this.inteiro.texture = f.inteiro;
    this.inteiro.position.set(ox, oy);
    this.adornoAtras.position.set(ox, oy);
    this.adornoFrente.position.set(ox, oy);
    for (let i = 0; i < TIRAS; i++) {
      const y = oy + (f.bordas[i] ?? 0);
      const s = this.tiras[i];
      const par = this.colunas[i];
      const textura = f.tiras[i];
      const colunas = f.colunas[i];
      if (!s || !par || !textura || !colunas) continue;
      s.texture = textura;
      s.position.set(ox, y);
      par[0].texture = colunas[0];
      par[0].position.set(ox, y);
      par[1].texture = colunas[1];
      par[1].position.set(ox + f.meio, y);
    }
  }

  aplicar(o: AplicarRig): void {
    const f = this.fonte;
    const escala = o.alturaPx / f.altura;
    const p = o.pose;
    const empurrao = p.empurrao * f.largura * escala;
    this.corpo.position.set(o.direcao.x * empurrao, o.direcao.y * empurrao + p.dy * f.altura * escala);
    const giro = p.giro ?? 0;
    // Em pé, o giro vira o corpo de lado e de volta (a escala passa pelo cosseno, sem sumir no meio).
    const vira = giro !== 0 && !o.vistaDeCima ? Math.sign(Math.cos(giro) || 1) * Math.max(0.22, Math.abs(Math.cos(giro))) : 1;
    this.corpo.scale.set(escala * p.escalaX * o.sentido * vira, escala * p.escalaY);
    this.corpo.rotation = o.rotacao + p.rotacao * o.sentido + (o.vistaDeCima ? giro : 0);
    const ox0 = -f.ancoraX * f.largura;
    const oy0 = -f.ancoraY * f.altura;
    const a = p.arma;
    this.arma.pivot.set(this.pivo.x, this.pivo.y);
    this.arma.position.set(ox0 + this.pivo.x + (a?.dx ?? 0) * f.largura, oy0 + this.pivo.y + (a?.dy ?? 0) * f.altura);
    this.arma.rotation = a?.rotacao ?? 0;
    const tiras = o.usarTiras && p.tiras.length === TIRAS;
    this.inteiro.visible = !tiras;
    const ox = -f.ancoraX * f.largura;
    for (let i = 0; i < TIRAS; i++) {
      const s = this.tiras[i];
      const par = this.colunas[i];
      if (!s || !par) continue;
      const t = tiras ? p.tiras[i] : undefined;
      const colunas = t?.colunas ?? null;
      s.visible = !!t && !colunas;
      par[0].visible = par[1].visible = !!colunas;
      if (!t) continue;
      const y = -f.ancoraY * f.altura + (f.bordas[i] ?? 0);
      if (colunas) {
        par[0].position.set(ox + colunas.esquerda.dx * f.largura, y + colunas.esquerda.dy * f.altura);
        par[1].position.set(ox + f.meio + colunas.direita.dx * f.largura, y + colunas.direita.dy * f.altura);
      } else {
        s.position.set(ox + t.dx * f.largura, y + t.dy * f.altura);
      }
    }
  }

  /** D-067: as texturas do equipamento (null esconde a camada). Marco 24: a arma à parte, com o pivô na mão. */
  adornar(atras: Texture | null, frente: Texture | null, arma: Texture | null = null, pivo?: { x: number; y: number }): void {
    this.arma.visible = !!arma;
    if (arma && this.arma.texture !== arma) this.arma.texture = arma;
    if (pivo) this.pivo = pivo;
    this.adornoAtras.visible = !!atras;
    if (atras && this.adornoAtras.texture !== atras) this.adornoAtras.texture = atras;
    this.adornoFrente.visible = !!frente;
    if (frente && this.adornoFrente.texture !== frente) this.adornoFrente.texture = frente;
  }

  destruir(): void {
    this.raiz.destroy({ children: true });
  }
}
