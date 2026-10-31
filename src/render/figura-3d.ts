// A figura pré-renderizada de uma entidade (marco 32, 31/10/2026, D-131): o quadro do corpo, as camadas de armadura
// por cima dele (já recortadas pelo corpo) e as armas presas nas mãos medidas em cada quadro. A arma vai na frente ou
// atrás do corpo conforme a mão (nunca some atrás da perna), gira com o pulso e encurta quando aponta para a câmera.
// O brilho da arma (somado por cima dela): o elemento, o branco da mira cheia do Arqueiro (D-103) ou, do lendário em
// diante, a cor da raridade. Na conjuração (e no golpe) com tomo, a runa do elemento acende na página.

import { Container, Graphics, Sprite } from 'pixi.js';
import type { Equipamento3d } from './adornos';
import { SEM_GIRO, TOMOS } from './equipamento-3d';
import { maoNoQuadro, type AtlasDePersonagens } from './personagens-3d';
import type { EstadoPersonagem } from './quadros-personagem';
import type { Runa } from './runas';
import { desenharRunaDoElemento } from './runas-elementos';

/** Os estados em que a runa do tomo acende. */
const LENDO: ReadonlySet<EstadoPersonagem> = new Set(['golpe', 'conjurar', 'andarGolpe', 'andarConjurar']);
/** O lado da runa na página (px do atlas). */
const TAMANHO_RUNA = 18;

/** A cor de destaque dos graus altos (lendário e última: objetos.ts COR_RARIDADE). */
const BRILHO_DO_GRAU: Readonly<Record<number, number>> = { 4: 0xf39c12, 5: 0xff4d6d };

export interface QuadroDaFigura {
  modelo: string;
  estado: EstadoPersonagem;
  direcao: number;
  indice: number;
  /** A escala no mundo (a do atlas × a da entidade) e a altura acima do chão (px). */
  escala: number;
  alturaPx: number;
  tinta: number;
  equipamento: Equipamento3d | null;
  /** O brilho da arma: o branco da mira cheia (força 0 a 1) e o pulso (0 a 1). */
  branca: number;
  pulso: number;
  morto: boolean;
  /** A runa da magia em curso (o elemento dela), acesa no tomo enquanto lê; null sem magia. */
  runa: Runa | null;
}

export class Figura3d {
  readonly raiz = new Container();
  private readonly atras = new Container();
  private readonly corpo = new Sprite();
  private readonly frente = new Container();
  private readonly camadas: Sprite[] = [];
  private readonly maos = { d: new Sprite(), e: new Sprite() };
  private readonly brilho = new Sprite();
  private readonly runa = new Graphics();
  private runaDesenhada: Runa | null = null;

  constructor() {
    this.raiz.addChild(this.atras, this.corpo, this.frente);
    this.brilho.blendMode = 'add';
    this.runa.blendMode = 'add';
  }

  /** Monta o quadro; false enquanto o atlas do corpo carrega (quem chama mostra o token desenhado). */
  atualizar(atlas: AtlasDePersonagens, q: QuadroDaFigura): boolean {
    const textura = atlas.quadro(q.modelo, q.estado, q.direcao, q.indice);
    const medidas = atlas.medidas(q.modelo);
    if (!textura || !medidas) return false;
    this.raiz.scale.set(q.escala);
    this.raiz.position.y = -q.alturaPx;
    this.corpo.texture = textura;
    this.corpo.anchor.set(medidas.ancoraX, medidas.ancoraY);
    this.corpo.tint = q.tinta;
    const eq = q.equipamento;
    this.vestir(atlas, q, eq);
    const coluna = atlas.coluna(q.modelo, q.estado, q.indice);
    const origem = { x: medidas.ancoraPxX, y: medidas.ancoraPxY };
    const principal = this.empunhar(atlas, q, 'd', eq?.arma ?? null, coluna, origem);
    const secundaria = this.empunhar(atlas, q, 'e', eq?.secundaria ?? null, coluna, origem);
    this.brilhar(principal, q, eq);
    const tomo = eq && TOMOS.has(eq.secundaria?.modelo ?? '') ? secundaria : eq && TOMOS.has(eq.arma.modelo) ? principal : null;
    this.ler(tomo, q);
    return true;
  }

  /** A runa no meio da página do tomo, pulsando, por cima do livro. */
  private ler(tomo: Sprite | null, q: QuadroDaFigura): void {
    const g = this.runa;
    if (!tomo || !q.runa || q.morto || !LENDO.has(q.estado)) {
      g.visible = false;
      return;
    }
    if (this.runaDesenhada !== q.runa) {
      g.clear();
      desenharRunaDoElemento(g, q.runa, TAMANHO_RUNA);
      this.runaDesenhada = q.runa;
    }
    const pai = tomo.parent;
    if (!pai) return;
    // Por cima do livro (e do brilho, quando ele está no mesmo lado).
    if (g.parent !== pai) pai.addChild(g);
    else pai.setChildIndex(g, pai.children.length - 1);
    const t = tomo.texture;
    g.position.set(tomo.x + (0.5 - tomo.anchor.x) * t.width, tomo.y + (0.5 - tomo.anchor.y) * t.height);
    g.alpha = 0.7 + 0.3 * q.pulso;
    g.visible = true;
  }

  private vestir(atlas: AtlasDePersonagens, q: QuadroDaFigura, eq: Equipamento3d | null): void {
    const camadas = eq?.camadas ?? [];
    for (const [i, c] of camadas.entries()) {
      let s = this.camadas[i];
      if (!s) {
        s = new Sprite();
        this.camadas.push(s);
        this.corpo.addChild(s);
      }
      const t = atlas.quadro(c.nome, q.estado, q.direcao, q.indice);
      s.visible = t !== null;
      if (!t) continue;
      s.texture = t;
      s.anchor.copyFrom(this.corpo.anchor);
    }
    for (let i = camadas.length; i < this.camadas.length; i++) {
      const s = this.camadas[i];
      if (s) s.visible = false;
    }
  }

  /** A arma na mão do quadro (null: mão vazia, sem medida ou carregando). */
  private empunhar(
    atlas: AtlasDePersonagens,
    q: QuadroDaFigura,
    lado: 'd' | 'e',
    arma: Equipamento3d['arma'] | null,
    coluna: number,
    origem: { x: number; y: number },
  ): Sprite | null {
    const s = this.maos[lado];
    const mao = arma ? maoNoQuadro(q.modelo, lado, q.direcao, coluna) : null;
    const t = arma && mao ? atlas.arma(arma.modelo, arma.grau) : null;
    if (!arma || !mao || !t) {
      s.visible = false;
      return null;
    }
    const pai = mao.frente ? this.frente : this.atras;
    if (s.parent !== pai) pai.addChild(s);
    s.texture = t.textura;
    s.anchor.set(t.pegaX, t.pegaY);
    s.position.set(mao.x - origem.x, mao.y - origem.y);
    const reta = SEM_GIRO.has(arma.modelo);
    s.rotation = reta ? 0 : mao.angulo;
    s.scale.set(1, reta ? 1 : mao.encurta);
    s.visible = true;
    return s;
  }

  private brilhar(arma: Sprite | null, q: QuadroDaFigura, eq: Equipamento3d | null): void {
    const b = this.brilho;
    const grau = eq?.arma.grau ?? 0;
    const cor = q.branca > 0 ? 0xffffff : (eq?.corElemento ?? BRILHO_DO_GRAU[grau] ?? null);
    if (!arma || cor === null || q.morto) {
      b.visible = false;
      return;
    }
    if (b.parent !== arma.parent) arma.parent?.addChild(b);
    b.texture = arma.texture;
    b.anchor.copyFrom(arma.anchor);
    b.position.copyFrom(arma.position);
    b.rotation = arma.rotation;
    b.scale.copyFrom(arma.scale);
    b.tint = cor;
    b.alpha = q.branca > 0 ? q.branca : eq?.corElemento != null ? 0.25 + 0.25 * q.pulso : 0.15 + 0.2 * q.pulso;
    b.visible = true;
  }

  destruir(): void {
    this.raiz.destroy({ children: true });
  }
}
