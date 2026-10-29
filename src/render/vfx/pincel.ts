// Pincel e animações de efeito (marco 26, 29/10/2026, D-124). As partículas são poeira solta; a silhueta que
// identifica uma skill (a corrente que estica, o relâmpago, a bola de fogo crescendo, a onda de choque, o pilar)
// precisa de sprites grandes que seguem um roteiro no tempo. O pincel desenha em modo imediato: a cada quadro, cada
// animação viva pede os sprites de que precisa e o resto do pool fica escondido. Nada é forma plana (D-066): todo
// sprite é uma textura do atlas, tingida e com brilho aditivo quando é luz.

import { Container, Sprite, type Texture } from 'pixi.js';
import type { TexturaParticula } from '../presets-particula';
import type { TexturaRica } from './texturas';

export type NomeTextura = TexturaParticula | TexturaRica;

export interface Traco {
  rot?: number;
  sx?: number;
  sy?: number;
  alpha?: number;
  cor?: number;
  aditivo?: boolean;
  /** Âncora (0 a 1); o feixe esticado usa (0, 0,5) para crescer a partir da origem. */
  ax?: number;
  ay?: number;
}

export class Pincel {
  private readonly normal = new Container({ label: 'vfx-normal' });
  private readonly aditiva = new Container({ label: 'vfx-aditiva' });
  private readonly pool: Sprite[] = [];
  private usados = 0;
  /** Teto de sprites por quadro (a silhueta de várias skills ao mesmo tempo). */
  limite = 400;

  constructor(
    pai: Container,
    private readonly textura: (nome: NomeTextura) => Texture | null,
  ) {
    this.aditiva.blendMode = 'add';
    pai.addChild(this.normal, this.aditiva);
  }

  comecar(): void {
    this.usados = 0;
  }

  desenhar(nome: NomeTextura, x: number, y: number, t: Traco = {}): void {
    if (this.usados >= this.limite) return;
    const tex = this.textura(nome);
    if (!tex) return;
    let s = this.pool[this.usados];
    if (!s) {
      s = new Sprite(tex);
      this.pool.push(s);
    }
    this.usados++;
    const pai = t.aditivo ? this.aditiva : this.normal;
    if (s.parent !== pai) pai.addChild(s);
    s.texture = tex;
    s.visible = true;
    s.anchor.set(t.ax ?? 0.5, t.ay ?? 0.5);
    s.position.set(x, y);
    s.rotation = t.rot ?? 0;
    s.scale.set(t.sx ?? 1, t.sy ?? t.sx ?? 1);
    s.alpha = t.alpha ?? 1;
    s.tint = t.cor ?? 0xffffff;
  }

  /** Um sprite esticado de `a` até `b` (o feixe, o elo do relâmpago): a textura cresce ao longo do segmento. */
  esticar(nome: NomeTextura, a: { x: number; y: number }, b: { x: number; y: number }, largura: number, t: Traco = {}): void {
    const comp = Math.hypot(b.x - a.x, b.y - a.y);
    if (comp < 0.5) return;
    // As texturas têm 32 px de lado no mundo: a escala em x cobre o comprimento; em y, a largura pedida.
    this.desenhar(nome, a.x, a.y, { ...t, rot: Math.atan2(b.y - a.y, b.x - a.x), sx: comp / 32, sy: largura / 32, ax: 0, ay: 0.5 });
  }

  terminar(): void {
    for (let i = this.usados; i < this.pool.length; i++) {
      const s = this.pool[i];
      if (s?.visible) s.visible = false;
    }
  }

  get emUso(): number {
    return this.usados;
  }

  destruir(): void {
    this.normal.destroy({ children: true });
    this.aditiva.destroy({ children: true });
    this.pool.length = 0;
  }
}

/** Uma animação: um roteiro de `ms` milissegundos que desenha a si mesmo pela fração do tempo. */
export interface Animacao {
  ms: number;
  /** Começa depois deste atraso (o impacto da bola de fogo espera ela cair). */
  atrasoMs?: number;
  /** `t` de 0 a 1; `ms` desde o começo. Devolve false para acabar antes. */
  desenhar: (t: number, ms: number, p: Pincel) => boolean | undefined;
  /** Quando termina (subemissões: a corrente que recolhe chama o tranco). */
  aoFim?: () => void;
  /** As silhuetas essenciais ficam mesmo acima do teto; os enfeites saem primeiro. */
  enfeite?: boolean;
}

interface Viva {
  a: Animacao;
  inicio: number;
}

export class Animacoes {
  private readonly vivas: Viva[] = [];
  /** Teto de animações simultâneas (D-124: acima dele, os enfeites mais antigos saem). */
  limite = 48;

  constructor(private readonly pincel: Pincel) {}

  tocar(a: Animacao, agoraMs: number): void {
    if (this.vivas.length >= this.limite) {
      const i = this.vivas.findIndex((v) => v.a.enfeite);
      this.vivas.splice(i >= 0 ? i : 0, 1);
    }
    this.vivas.push({ a, inicio: agoraMs + (a.atrasoMs ?? 0) });
  }

  quadro(agoraMs: number): void {
    this.pincel.comecar();
    for (let i = 0; i < this.vivas.length; i++) {
      const v = this.vivas[i];
      if (!v) continue;
      const ms = agoraMs - v.inicio;
      if (ms < 0) continue;
      const t = Math.min(1, ms / v.a.ms);
      const segue = v.a.desenhar(t, ms, this.pincel) !== false && t < 1;
      if (!segue) {
        this.vivas.splice(i, 1);
        i--;
        v.a.aoFim?.();
      }
    }
    this.pincel.terminar();
  }

  get quantidade(): number {
    return this.vivas.length;
  }

  limpar(): void {
    this.vivas.length = 0;
    this.pincel.comecar();
    this.pincel.terminar();
  }
}

// --- Curvas pequenas, usadas pelas silhuetas.
export const suave = (t: number) => t * t * (3 - 2 * t);
export const sai = (t: number) => 1 - (1 - t) * (1 - t) * (1 - t);
export const entra = (t: number) => t * t;
/** Sobe rápido até `pico` e desce devagar até o fim (o brilho de um impacto). */
export const pico = (t: number, p = 0.15) => (t < p ? t / p : 1 - (t - p) / (1 - p));
/** O pulo de quem passa do ponto e volta (o escudo que se forma, o elo que prende). */
export const elastica = (t: number) => (t >= 1 ? 1 : 1 - Math.cos(t * Math.PI * 4.5) * Math.exp(-t * 6));
