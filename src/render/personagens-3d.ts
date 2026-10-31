// Personagens pré-renderizados de modelos 3D CC0 (marco 32, 31/10/2026, D-131). Cada modelo é um atlas
// (tools/sprites/: Quaternius e KayKit, licenças em src/assets/personagens/LICENCAS.md) com 8 direções na grade (as
// linhas: 0 = +x, girando 45° para +y) e os quadros de cada estado (as colunas). O atlas só carrega quando um modelo
// aparece na cena; até lá (ou se falhar), quem pede recebe null e o token desenhado de antes continua.
// As classes trazem também as mãos de cada quadro (onde a arma é presa) e as armas têm um atlas por desenho, com os
// 6 graus de raridade lado a lado (equipamento-3d.ts).

import { Assets, Rectangle, Texture } from 'pixi.js';
import CATALOGO from '../assets/personagens/catalogo.json';
import CATALOGO_ARMAS from '../assets/personagens/armas/catalogo.json';
import { CELULA_PX } from './camera-calculo';
import { SEM_PASSO, type EstadoPersonagem } from './quadros-personagem';

const URLS = import.meta.glob<string>('../assets/personagens/*.webp', { query: '?url', import: 'default' });
const URLS_ARMAS = import.meta.glob<string>('../assets/personagens/armas/*.webp', { query: '?url', import: 'default' });

/** Uma mão no quadro: o punho (px do quadro), o ângulo da arma (rad, 0 = para cima), o encurtamento e se está na frente. */
export interface Mao {
  x: number;
  y: number;
  angulo: number;
  encurta: number;
  frente: boolean;
}

interface Entrada {
  quadroL: number;
  quadroA: number;
  ancoraX: number;
  ancoraY: number;
  pxCelula: number;
  colunas: number;
  /** Colunas por faixa (cada faixa com as 8 direções); sem ela, uma faixa só. */
  faixa?: number;
  altura: number;
  estados: Partial<Record<EstadoPersonagem, { inicio: number; n: number }>>;
  maos?: { d: number[]; e: number[] };
}

interface EntradaArma {
  celL: number;
  celA: number;
  pegaX: number;
  pegaY: number;
}

const CAT = CATALOGO as Readonly<Record<string, Entrada>>;
const CAT_ARMAS = CATALOGO_ARMAS as Readonly<Record<string, EntradaArma>>;

function entrada(nome: string): Entrada | null {
  return Object.hasOwn(CAT, nome) ? (CAT[nome] ?? null) : null;
}

/** As colunas do estado no atlas (o atlas sem o estado andando cai no estado sem passo). */
function colunasDoEstado(e: Entrada, estado: EstadoPersonagem): { inicio: number; n: number } | null {
  return e.estados[estado] ?? e.estados[SEM_PASSO[estado]] ?? null;
}

function urlEm(urls: Record<string, () => Promise<string>>, nome: string): Promise<string> | null {
  const carregar = Object.entries(urls).find(([caminho]) => caminho.endsWith(`/${nome}.webp`))?.[1];
  return carregar ? carregar() : null;
}

/** O endereço do atlas (carregado sob demanda), ou null se o modelo não tiver um. */
export function urlDoAtlas(nome: string): Promise<string> | null {
  return urlEm(URLS, nome);
}

/** O endereço do atlas da arma e as medidas dela (null se o desenho não tiver modelo). */
export function armaDe(modelo: string): { url: Promise<string>; medidas: EntradaArma } | null {
  const medidas = Object.hasOwn(CAT_ARMAS, modelo) ? CAT_ARMAS[modelo] : undefined;
  const url = medidas ? urlEm(URLS_ARMAS, modelo) : null;
  return medidas && url ? { url, medidas } : null;
}

/** Há modelo 3D para a arma? */
export const existeArma3d = (modelo: string): boolean => Object.hasOwn(CAT_ARMAS, modelo);

/** As medidas do atlas em px (o quadro, a âncora dos pés e a primeira coluna de cada estado). */
export function atlasDe(nome: string): Entrada | null {
  return entrada(nome);
}

/** A mão (`d` direita, `e` esquerda) no quadro da direção e da coluna, se a classe tiver as medidas. */
export function maoNoQuadro(nome: string, lado: 'd' | 'e', direcao: number, coluna: number): Mao | null {
  const e = entrada(nome);
  const v = e?.maos?.[lado];
  if (!e || !v) return null;
  const i = (direcao * e.colunas + coluna) * 5;
  const x = v[i];
  if (x === undefined) return null;
  return { x, y: v[i + 1] ?? 0, angulo: v[i + 2] ?? 0, encurta: v[i + 3] ?? 1, frente: v[i + 4] === 1 };
}

export class AtlasDePersonagens {
  private readonly bases = new Map<string, Texture | 'carregando' | 'falhou'>();
  private readonly quadros = new Map<string, Texture>();
  private destruido = false;

  /** Há atlas para o modelo (pronto ou não)? */
  existe(nome: string): boolean {
    return entrada(nome) !== null;
  }

  private carregar(chave: string, url: Promise<string> | null): Texture | null {
    const b = this.bases.get(chave);
    if (b instanceof Texture) return b;
    if (b) return null;
    if (!url) {
      this.bases.set(chave, 'falhou');
      return null;
    }
    this.bases.set(chave, 'carregando');
    void url
      .then((u) => Assets.load<Texture>(u))
      .then((t) => {
        if (!this.destruido) this.bases.set(chave, t);
      })
      .catch(() => {
        this.bases.set(chave, 'falhou');
      });
    return null;
  }

  private base(nome: string): Texture | null {
    const b = this.bases.get(nome);
    return b instanceof Texture ? b : b ? null : this.carregar(nome, urlDoAtlas(nome));
  }

  private recorte(chave: string, base: Texture, x: number, y: number, l: number, a: number): Texture {
    let t = this.quadros.get(chave);
    if (!t) {
      t = new Texture({ source: base.source, frame: new Rectangle(x, y, l, a) });
      this.quadros.set(chave, t);
    }
    return t;
  }

  /** A coluna do quadro do estado no atlas. */
  coluna(nome: string, estado: EstadoPersonagem, indice: number): number {
    const e = entrada(nome);
    const faixa = e ? colunasDoEstado(e, estado) : null;
    return faixa ? faixa.inicio + Math.min(faixa.n - 1, indice) : 0;
  }

  /** A textura do quadro (null enquanto o atlas carrega). */
  quadro(nome: string, estado: EstadoPersonagem, direcao: number, indice: number): Texture | null {
    const e = entrada(nome);
    const base = e ? this.base(nome) : null;
    if (!e || !base) return null;
    const coluna = this.coluna(nome, estado, indice);
    // Marco 32 (D-131): o atlas em faixas (a largura fica abaixo de 4096 px com os estados andando).
    const porFaixa = e.faixa ?? e.colunas;
    const x = (coluna % porFaixa) * e.quadroL;
    const y = (Math.floor(coluna / porFaixa) * 8 + direcao) * e.quadroA;
    return this.recorte(`${nome}:${direcao}:${coluna}`, base, x, y, e.quadroL, e.quadroA);
  }

  /** A arma do grau (0 a 5) e o punho (fração do recorte), ou null enquanto carrega. */
  arma(modelo: string, grau: number): { textura: Texture; pegaX: number; pegaY: number } | null {
    const a = armaDe(modelo);
    const chave = `arma:${modelo}`;
    const b = this.bases.get(chave);
    const base = b instanceof Texture ? b : b ? null : this.carregar(chave, a?.url ?? null);
    if (!a || !base) return null;
    const m = a.medidas;
    const g = Math.max(0, Math.min(5, grau));
    return { textura: this.recorte(`${chave}:${g}`, base, g * m.celL, 0, m.celL, m.celA), pegaX: m.pegaX / m.celL, pegaY: m.pegaY / m.celA };
  }

  /** Quantos quadros o estado tem. */
  quadrosDe(nome: string, estado: EstadoPersonagem): number {
    const e = entrada(nome);
    return (e ? colunasDoEstado(e, estado)?.n : undefined) ?? 1;
  }

  /** A âncora (fração do quadro e px), a escala para o jogo e a altura do topo acima dos pés (px de mundo). */
  medidas(nome: string): { ancoraX: number; ancoraY: number; ancoraPxX: number; ancoraPxY: number; escala: number; topo: number } | null {
    const e = entrada(nome);
    if (!e) return null;
    return { ancoraX: e.ancoraX / e.quadroL, ancoraY: e.ancoraY / e.quadroA, ancoraPxX: e.ancoraX, ancoraPxY: e.ancoraY, escala: CELULA_PX / e.pxCelula, topo: e.altura * CELULA_PX };
  }

  destruir(): void {
    this.destruido = true;
    for (const t of this.quadros.values()) t.destroy(false);
    this.quadros.clear();
    this.bases.clear();
  }
}
