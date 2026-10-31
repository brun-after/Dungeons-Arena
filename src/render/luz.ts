// Luz (§2.16). Marco 12 (14/10/2026), D-056. Textura radial de 256 px gerada uma vez, mistura aditiva,
// cintilação `0,55 + sin(t/190)×0,07 + sin(t/47)×0,03` e raio de 3,2 células. Ilumina o jogador, as
// portas, a loja, os baús e as fontes de fogo. Só nas qualidades médio e alto (§4.10).

import { CanvasSource, Container, Sprite, Texture } from 'pixi.js';
import { CELULA_PX } from './camera-calculo';

export interface PontoDeLuz {
  x: number;
  y: number;
  cor: number;
  /** Desloca a fase da cintilação, para as luzes não piscarem juntas. */
  semente: number;
  /** Multiplica o brilho (1 = normal). A do jogador é 0,5 desde o ajuste de 14/10/2026. */
  intensidade?: number;
  /** Marco 31 (31/10/2026, D-130): o raio no mapa de luz (render/escuridao.ts), em células. */
  raio?: number;
  /** A luz que um jogador leva (sobe até o peito; a vinheta segue a do jogador local). */
  jogador?: boolean;
}

const RAIO_CELULAS = 3.2;
const LADO_TEXTURA = 256;

function texturaRadial(): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = LADO_TEXTURA;
  const g = canvas.getContext('2d');
  if (g) {
    const meio = LADO_TEXTURA / 2;
    const grad = g.createRadialGradient(meio, meio, 0, meio, meio, meio);
    grad.addColorStop(0, 'rgba(255,255,255,0.55)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.18)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, LADO_TEXTURA, LADO_TEXTURA);
  }
  // Marco 16: fonte explícita, fora do cache global do Pixi (`Texture.from` guardava uma por cena montada).
  return new Texture({ source: new CanvasSource({ resource: canvas }) });
}

export function cintilacao(tMs: number, semente: number): number {
  const t = tMs + semente * 997;
  return 0.55 + Math.sin(t / 190) * 0.07 + Math.sin(t / 47) * 0.03;
}

export class CamadaLuz {
  private readonly camada = new Container({ label: 'luz' });
  private readonly textura = texturaRadial();
  private readonly sprites: Sprite[] = [];

  constructor(pai: Container) {
    pai.addChild(this.camada);
  }

  desenhar(pontos: readonly PontoDeLuz[], agoraMs: number, ligada: boolean, movimentoReduzido: boolean): void {
    this.camada.visible = ligada;
    if (!ligada) return;
    const escala = (RAIO_CELULAS * 2 * CELULA_PX) / LADO_TEXTURA;
    pontos.forEach((p, i) => {
      let s = this.sprites[i];
      if (!s) {
        s = new Sprite(this.textura);
        s.anchor.set(0.5);
        s.blendMode = 'add';
        this.sprites.push(s);
        this.camada.addChild(s);
      }
      s.visible = true;
      s.tint = p.cor;
      s.position.set((p.x + 0.5) * CELULA_PX, (p.y + 0.5) * CELULA_PX);
      s.scale.set(escala);
      s.alpha = (movimentoReduzido ? 0.55 : cintilacao(agoraMs, p.semente)) * (p.intensidade ?? 1);
    });
    for (let i = pontos.length; i < this.sprites.length; i++) {
      const s = this.sprites[i];
      if (s) s.visible = false;
    }
  }

  destruir(): void {
    this.camada.destroy({ children: true });
    this.textura.destroy(true);
  }
}
