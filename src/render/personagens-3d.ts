// Personagens pré-renderizados de modelos 3D CC0 (marco 32, 31/10/2026, D-131). Cada modelo é um atlas
// (tools/sprites/: Quaternius e KayKit, licenças em src/assets/personagens/LICENCAS.md) com 8 direções na grade (as
// linhas: 0 = +x, girando 45° para +y) e os quadros de cada estado (as colunas). O atlas só carrega quando um modelo
// aparece na cena; até lá (ou se falhar), quem pede recebe null e o token desenhado de antes continua.

import { Assets, Rectangle, Texture } from 'pixi.js';
import CATALOGO from '../assets/personagens/catalogo.json';
import { CELULA_PX } from './camera-calculo';

const URLS = import.meta.glob<string>('../assets/personagens/*.webp', { query: '?url', import: 'default' });

export type EstadoPersonagem = 'parado' | 'andar' | 'golpe' | 'conjurar' | 'morte';
type Entrada = (typeof CATALOGO)[keyof typeof CATALOGO];

const DIRECOES = 8;
/** Quanto dura cada quadro dos ciclos (ms). */
const MS_QUADRO: Readonly<Record<EstadoPersonagem, number>> = { parado: 220, andar: 95, golpe: 0, conjurar: 110, morte: 110 };

function entrada(nome: string): Entrada | null {
  return Object.hasOwn(CATALOGO, nome) ? CATALOGO[nome as keyof typeof CATALOGO] : null;
}

/** A direção do atlas para o rumo na grade (rad, de +x para +y). */
export function direcaoDoAngulo(angulo: number): number {
  const d = Math.round(angulo / (Math.PI / 4));
  return ((d % DIRECOES) + DIRECOES) % DIRECOES;
}

/**
 * O quadro do estado: os ciclos (parado, andar, conjurar) pelo relógio; o golpe pela fração (0 a 1) dele; a morte
 * pelo tempo desde a queda, parando no último.
 */
export function quadroDoEstado(estado: EstadoPersonagem, n: number, tMs: number, fracao: number | null): number {
  if (estado === 'golpe') return Math.min(n - 1, Math.max(0, Math.floor((fracao ?? 0) * n)));
  if (estado === 'morte') return Math.min(n - 1, Math.floor(tMs / MS_QUADRO.morte));
  return Math.floor(tMs / MS_QUADRO[estado]) % n;
}

export class AtlasDePersonagens {
  private readonly bases = new Map<string, Texture | 'carregando' | 'falhou'>();
  private readonly quadros = new Map<string, Texture>();
  private destruido = false;

  /** Há atlas para o modelo (pronto ou não)? */
  existe(nome: string): boolean {
    return entrada(nome) !== null;
  }

  private base(nome: string): Texture | null {
    const b = this.bases.get(nome);
    if (b instanceof Texture) return b;
    if (b) return null;
    const url = Object.entries(URLS).find(([caminho]) => caminho.endsWith(`/${nome}.webp`))?.[1];
    if (!url) {
      this.bases.set(nome, 'falhou');
      return null;
    }
    this.bases.set(nome, 'carregando');
    void url()
      .then((u) => Assets.load<Texture>(u))
      .then((t) => {
        if (!this.destruido) this.bases.set(nome, t);
      })
      .catch(() => {
        this.bases.set(nome, 'falhou');
      });
    return null;
  }

  /** A textura do quadro (null enquanto o atlas carrega). */
  quadro(nome: string, estado: EstadoPersonagem, direcao: number, indice: number): Texture | null {
    const e = entrada(nome);
    const base = e ? this.base(nome) : null;
    if (!e || !base) return null;
    const faixa = e.estados[estado];
    const coluna = faixa.inicio + Math.min(faixa.n - 1, indice);
    const chave = `${nome}:${direcao}:${coluna}`;
    let t = this.quadros.get(chave);
    if (!t) {
      t = new Texture({ source: base.source, frame: new Rectangle(coluna * e.quadroL, direcao * e.quadroA, e.quadroL, e.quadroA) });
      this.quadros.set(chave, t);
    }
    return t;
  }

  /** Quantos quadros o estado tem. */
  quadrosDe(nome: string, estado: EstadoPersonagem): number {
    return entrada(nome)?.estados[estado].n ?? 1;
  }

  /** A âncora (fração do quadro), a escala para o jogo e a altura do topo acima dos pés (px de mundo). */
  medidas(nome: string): { ancoraX: number; ancoraY: number; escala: number; topo: number } | null {
    const e = entrada(nome);
    if (!e) return null;
    return { ancoraX: e.ancoraX / e.quadroL, ancoraY: e.ancoraY / e.quadroA, escala: CELULA_PX / e.pxCelula, topo: e.altura * CELULA_PX };
  }

  destruir(): void {
    this.destruido = true;
    for (const t of this.quadros.values()) t.destroy(false);
    this.quadros.clear();
    this.bases.clear();
  }
}
