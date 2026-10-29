// Marcas no chão (marco 26, 29/10/2026, D-124): a cratera queimada da bola de fogo, a geada da nova, a rachadura do
// abalo, a poça de sangue e a de veneno. Ficam numa camada do chão (abaixo das entidades), duram de 2 a 4 s e somem
// devagar. Têm teto: a mais antiga sai primeiro. No isométrico, achatadas como o chão.

import type { Container, Texture } from 'pixi.js';
import { Animacoes, Pincel, type NomeTextura } from './pincel';

const TETO_MARCAS = 24;

export class Marcas {
  private readonly pincel: Pincel;
  private readonly anim: Animacoes;

  constructor(
    chao: Container,
    textura: (nome: NomeTextura) => Texture | null,
    /** O centro da célula no chão, em px de tela. */
    private readonly noChao: (x: number, y: number) => { x: number; y: number },
    private readonly iso: () => boolean,
  ) {
    this.pincel = new Pincel(chao, textura);
    this.pincel.limite = TETO_MARCAS * 2;
    this.anim = new Animacoes(this.pincel);
    this.anim.limite = TETO_MARCAS;
  }

  /** Deixa uma marca na célula (x, y). `escala` em células de diâmetro (1 = uma célula). */
  deixar(nome: NomeTextura, x: number, y: number, cor: number, escala: number, ms: number, agoraMs: number, aditivo = false): void {
    const giro = Math.random() * Math.PI * 2;
    const achatar = this.iso() ? 0.5 : 1;
    this.anim.tocar(
      {
        ms,
        desenhar: (t, _ms, p) => {
          const c = this.noChao(x, y);
          // Aparece em 8% do tempo (cresce um pouco) e some nos últimos 45%.
          const entrada = Math.min(1, t / 0.08);
          const alpha = t < 0.55 ? 1 : 1 - (t - 0.55) / 0.45;
          // A escala é em células (a textura tem 32 px; a célula, 48).
          const s = escala * 1.5 * (0.85 + 0.15 * entrada);
          p.desenhar(nome, c.x, c.y, { rot: achatar < 1 ? 0 : giro, sx: s, sy: s * achatar, alpha: alpha * entrada * (aditivo ? 0.8 : 0.55), cor, aditivo });
        },
      },
      agoraMs,
    );
  }

  quadro(agoraMs: number): void {
    this.anim.quadro(agoraMs);
  }

  limpar(): void {
    this.anim.limpar();
  }

  destruir(): void {
    this.pincel.destruir();
  }
}
