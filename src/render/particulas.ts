// Sistema de partículas (§2.16). Marco 12 (14/10/2026), D-056. Texturas geradas uma vez (ponto, brilho,
// fumaça, anel, estrela, faísca) e sprites reaproveitados num pool. Vivem em coordenadas de mundo, então
// acompanham câmera e zoom. O teto vem da qualidade (§4.10): no mínimo, nenhuma partícula. Usa um PRNG
// visual próprio (Math.random): nunca consome a sequência da simulação (§2.1).

import { Container, Graphics, Sprite, type Renderer, type Texture } from 'pixi.js';
import { CELULA_PX } from './camera-calculo';
import { PRESETS_PARTICULA, type Emissao, type NomePreset, type TexturaParticula } from './presets-particula';

interface Viva {
  sprite: Sprite;
  vx: number;
  vy: number;
  gravidade: number;
  idadeMs: number;
  vidaMs: number;
  escala: readonly [number, number];
  alpha: readonly [number, number];
}

const entre = (a: number, b: number) => a + Math.random() * (b - a);

function desenharTextura(g: Graphics, tipo: TexturaParticula): Graphics {
  switch (tipo) {
    case 'ponto':
      return g.circle(8, 8, 4).fill(0xffffff);
    case 'brilho':
      for (let r = 8; r >= 1; r--) g.circle(8, 8, r).fill({ color: 0xffffff, alpha: 0.12 });
      return g;
    case 'fumaca':
      for (let r = 8; r >= 2; r--) g.circle(8, 8, r).fill({ color: 0xffffff, alpha: 0.08 });
      return g;
    case 'anel':
      return g.circle(8, 8, 6.5).stroke({ width: 1.5, color: 0xffffff });
    case 'estrela': {
      const pontos: number[] = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 7 : 3;
        const a = (Math.PI / 5) * i - Math.PI / 2;
        pontos.push(8 + Math.cos(a) * r, 8 + Math.sin(a) * r);
      }
      return g.poly(pontos).fill(0xffffff);
    }
    case 'faisca':
      return g.rect(7, 2, 2, 12).fill(0xffffff);
  }
}

export class SistemaParticulas {
  private readonly camada = new Container({ label: 'particulas' });
  private readonly texturas = new Map<TexturaParticula, Texture>();
  private readonly vivas: Viva[] = [];
  private readonly livres: Sprite[] = [];
  /** Teto de partículas vivas, da qualidade atual. */
  limite = 300;

  constructor(pai: Container, renderer: Renderer) {
    pai.addChild(this.camada);
    for (const tipo of ['ponto', 'brilho', 'fumaca', 'anel', 'estrela', 'faisca'] as const) {
      const g = desenharTextura(new Graphics(), tipo);
      this.texturas.set(tipo, renderer.generateTexture({ target: g, resolution: 2 }));
      g.destroy();
    }
  }

  /** Quantas estão vivas (para o teto e para o diagnóstico/e2e). */
  get quantidade(): number {
    return this.vivas.length;
  }

  /** Emite um preset em (x, y) de célula; com `ate`, espalha ao longo do segmento (raio). */
  emitir(nome: NomePreset, x: number, y: number, cor: number, ate?: { x: number; y: number }): void {
    if (this.limite <= 0) return;
    for (const e of PRESETS_PARTICULA[nome]) this.emitirUma(e, x, y, cor, ate);
  }

  private emitirUma(e: Emissao, x: number, y: number, cor: number, ate?: { x: number; y: number }): void {
    const cx = (x + 0.5) * CELULA_PX;
    const cy = (y + 0.5) * CELULA_PX;
    for (let i = 0; i < e.quantidade && this.vivas.length < this.limite; i++) {
      const t = ate ? Math.random() : 0;
      const ox = ate ? cx + ((ate.x + 0.5) * CELULA_PX - cx) * t : cx;
      const oy = ate ? cy + ((ate.y + 0.5) * CELULA_PX - cy) * t : cy;
      const angulo = e.direcao === 'cima' ? -Math.PI / 2 + entre(-0.7, 0.7) : entre(0, Math.PI * 2);
      const v = entre(e.velocidade[0], e.velocidade[1]);
      const sprite = this.livres.pop() ?? new Sprite();
      sprite.texture = this.texturas.get(e.textura) ?? sprite.texture;
      sprite.anchor.set(0.5);
      sprite.tint = e.cor ?? cor;
      sprite.blendMode = e.aditivo ? 'add' : 'normal';
      sprite.position.set(ox + entre(-e.raio, e.raio), oy + entre(-e.raio, e.raio));
      sprite.rotation = e.textura === 'faisca' ? angulo + Math.PI / 2 : entre(0, Math.PI * 2);
      sprite.scale.set(e.escala[0]);
      sprite.alpha = e.alpha[0];
      sprite.visible = true;
      this.camada.addChild(sprite);
      this.vivas.push({ sprite, vx: Math.cos(angulo) * v, vy: Math.sin(angulo) * v, gravidade: e.gravidade, idadeMs: 0, vidaMs: entre(e.vidaMs[0], e.vidaMs[1]), escala: e.escala, alpha: e.alpha });
    }
  }

  atualizar(dtMs: number): void {
    const dt = dtMs / 1000;
    for (let i = this.vivas.length - 1; i >= 0; i--) {
      const p = this.vivas[i];
      if (!p) continue;
      p.idadeMs += dtMs;
      if (p.idadeMs >= p.vidaMs) {
        p.sprite.visible = false;
        this.camada.removeChild(p.sprite);
        this.livres.push(p.sprite);
        this.vivas.splice(i, 1);
        continue;
      }
      const f = p.idadeMs / p.vidaMs;
      p.vy += p.gravidade * dt;
      p.sprite.x += p.vx * dt;
      p.sprite.y += p.vy * dt;
      p.sprite.scale.set(p.escala[0] + (p.escala[1] - p.escala[0]) * f);
      p.sprite.alpha = p.alpha[0] + (p.alpha[1] - p.alpha[0]) * f;
    }
  }

  /** Some com todas as partículas (qualidade "mínimo" ou troca de fase). */
  limpar(): void {
    for (const p of this.vivas) {
      p.sprite.visible = false;
      this.camada.removeChild(p.sprite);
      this.livres.push(p.sprite);
    }
    this.vivas.length = 0;
  }

  destruir(): void {
    this.limpar();
    for (const s of this.livres) s.destroy();
    for (const t of this.texturas.values()) t.destroy(true);
    this.camada.destroy();
  }
}
