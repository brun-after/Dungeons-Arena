// Tileset por imagem (§2.16, §3.10). Marco 11A (16/10/2026), D-066. Puro: o layout canônico do atlas (4×4 ou 5×5),
// a codificação D4 das peças (`chave@t`), o autotiling pela vizinhança, a variação determinística do piso, o
// fatiamento da imagem (cada borda arredondada à parte) e a herança de tileset entre as fases de uma aventura.
// Decodificar a imagem e criar texturas é do render (render/tileset-textura.ts); guardar, da plataforma.

import type { Celula } from '../core/comandos';
import { tipoEm, type Fase, type TipoCelula } from './fase';

export type GradeAtlas = 4 | 5;

/** Funções do layout canônico (§2.16), com a célula de cada uma no atlas. As de coluna/linha 4 só no 5×5. */
export const LAYOUT_CANONICO = {
  canto_NO: [0, 0],
  parede_N: [1, 0],
  canto_NE: [2, 0],
  piso_1: [3, 0],
  canto_int_NO: [4, 0],
  parede_O: [0, 1],
  piso_2: [1, 1],
  parede_L: [2, 1],
  objeto_1: [3, 1],
  canto_int_NE: [4, 1],
  canto_SO: [0, 2],
  parede_S: [1, 2],
  canto_SE: [2, 2],
  bau: [3, 2],
  canto_int_SO: [4, 2],
  porta: [0, 3],
  piso_3: [1, 3],
  parede_int: [2, 3],
  porta_fase: [3, 3],
  canto_int_SE: [4, 3],
  piso_4: [0, 4],
  piso_5: [1, 4],
  objeto_2: [2, 4],
  objeto_3: [3, 4],
} as const satisfies Record<string, readonly [number, number]>;

export type FuncaoPeca = keyof typeof LAYOUT_CANONICO;
export const FUNCOES = Object.keys(LAYOUT_CANONICO) as FuncaoPeca[];

/** Grupos do seletor de vínculo (§3.10). */
export const GRUPOS_DE_FUNCAO: Readonly<Record<'funcoes' | 'pisos' | 'paredes', readonly FuncaoPeca[]>> = {
  funcoes: ['bau', 'porta', 'porta_fase', 'objeto_1', 'objeto_2', 'objeto_3'],
  pisos: ['piso_1', 'piso_2', 'piso_3', 'piso_4', 'piso_5'],
  paredes: ['parede_N', 'parede_S', 'parede_O', 'parede_L', 'parede_int', 'canto_NO', 'canto_NE', 'canto_SO', 'canto_SE', 'canto_int_NO', 'canto_int_NE', 'canto_int_SO', 'canto_int_SE'],
};

/** `"coluna,linha"` no atlas. */
export type CelulaAtlas = `${number},${number}`;

/** Vínculos chave → célula do atlas: as funções do layout e chaves livres do jogador. */
export type Vinculos = Record<string, CelulaAtlas>;

export function vinculosCanonicos(grade: GradeAtlas): Vinculos {
  const v: Vinculos = {};
  for (const f of FUNCOES) {
    const [c, l] = LAYOUT_CANONICO[f];
    if (c < grade && l < grade) v[f] = `${c},${l}`;
  }
  return v;
}

export const RE_CHAVE_PECA = /^[a-z0-9_]{1,24}$/i;
const RE_PECA = /^([a-z0-9_]{1,24})(?:@([1-7]))?$/i;

/** Peça com transform D4: `parede_N@2`. `t` 0 = identidade; 1–3 giram 90/180/270° (horário); 4–7 espelham e giram. */
export interface Peca {
  chave: string;
  t: number;
}

export function lerPeca(texto: string): Peca | null {
  const m = RE_PECA.exec(texto);
  if (!m?.[1]) return null;
  return { chave: m[1], t: m[2] ? Number(m[2]) : 0 };
}

export function textoDaPeca(p: Peca): string {
  return p.t === 0 ? p.chave : `${p.chave}@${p.t}`;
}

/** Matriz 2×2 da transformação (para o render): `[a, b, c, d]` em `x' = a·x + c·y`, `y' = b·x + d·y`. */
export function matrizD4(t: number): readonly [number, number, number, number] {
  const rot = t % 4;
  const espelho = t >= 4 ? -1 : 1;
  const cos = [1, 0, -1, 0][rot] ?? 1;
  const sen = [0, 1, 0, -1][rot] ?? 0;
  // Espelho horizontal primeiro (x → −x), depois a rotação horária (no espaço de tela, y para baixo).
  return [cos * espelho, sen * espelho, -sen, cos];
}

/** Compõe duas transformações D4 (aplica `a`, depois `b`), pela multiplicação das matrizes. */
export function comporD4(a: number, b: number): number {
  const [a1, b1, c1, d1] = matrizD4(a);
  const [a2, b2, c2, d2] = matrizD4(b);
  // M = Mb · Ma (colunas [a b] e [c d]).
  const m = [a2 * a1 + c2 * b1, b2 * a1 + d2 * b1, a2 * c1 + c2 * d1, b2 * c1 + d2 * d1];
  for (let t = 0; t < 8; t++) {
    const x = matrizD4(t);
    if (x.every((v, i) => v === m[i])) return t;
  }
  return 0;
}

const FALLBACK: Readonly<Partial<Record<FuncaoPeca, string>>> = {
  parede_L: 'parede_N@1',
  parede_S: 'parede_N@2',
  parede_O: 'parede_N@3',
  canto_NE: 'canto_NO@1',
  canto_SE: 'canto_NO@2',
  canto_SO: 'canto_NO@3',
  canto_int_NE: 'canto_int_NO@1',
  canto_int_SE: 'canto_int_NO@2',
  canto_int_SO: 'canto_int_NO@3',
  piso_2: 'piso_1',
  piso_3: 'piso_1',
  objeto_1: 'piso_1',
  porta_fase: 'piso_1',
  parede_int: 'parede_N',
};

/** A peça que existe no atlas para uma função (com a rotação de reserva quando falta a própria). */
export function resolverPeca(p: Peca, vinculos: Vinculos): Peca | null {
  if (vinculos[p.chave]) return p;
  const reserva = FALLBACK[p.chave as FuncaoPeca];
  const r = reserva ? lerPeca(reserva) : null;
  if (!r) return null;
  const final = resolverPeca(r, vinculos);
  return final ? { chave: final.chave, t: comporD4(final.t, p.t) } : null;
}

/** Hash por posição com avalanche (sem padrão diagonal), em [0, 1). */
export function ruidoDaCelula(x: number, y: number, semente: number): number {
  let h = Math.imul(x, 0x27d4eb2d) ^ Math.imul(y, 0x165667b1) ^ Math.imul(semente | 0, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Variação do piso (§2.16): `objeto_1` < 0,03; `piso_2` < 0,15; `piso_3` < 0,225; senão `piso_1`. */
export function variacaoPiso(x: number, y: number, semente: number): FuncaoPeca {
  const r = ruidoDaCelula(x, y, semente);
  if (r < 0.03) return 'objeto_1';
  if (r < 0.15) return 'piso_2';
  if (r < 0.225) return 'piso_3';
  return 'piso_1';
}

const andavel = (t: TipoCelula) => t === 'piso' || t === 'saida';

/**
 * Autotiling (§2.16) de uma célula: piso varia por posição; saída usa `porta_fase`; parede olha a vizinhança —
 * corredor, face simples, canto interno (dois cardinais de piso), canto externo (só a diagonal) e pilar. Parede
 * sem piso em volta e vazio não têm peça (o fundo escuro aparece).
 */
export function autotile(fase: Fase, x: number, y: number, semente: number): Peca | null {
  const tipo = tipoEm(fase, x, y);
  if (tipo === 'vazio') return null;
  if (tipo === 'saida') return { chave: 'porta_fase', t: 0 };
  if (tipo === 'piso') return { chave: variacaoPiso(x, y, semente), t: 0 };
  const p = (dx: number, dy: number) => andavel(tipoEm(fase, x + dx, y + dy));
  const n = p(0, -1);
  const s = p(0, 1);
  const l = p(1, 0);
  const o = p(-1, 0);
  const cardinais = [n, s, l, o].filter(Boolean).length;
  if (cardinais >= 3) return { chave: 'parede_int', t: 0 };
  if (n && s) return { chave: 'parede_N', t: 0 };
  if (l && o) return { chave: 'parede_O', t: 0 };
  if (cardinais === 2) {
    if (s && l) return { chave: 'canto_int_NO', t: 0 };
    if (s && o) return { chave: 'canto_int_NE', t: 0 };
    if (n && l) return { chave: 'canto_int_SO', t: 0 };
    return { chave: 'canto_int_SE', t: 0 };
  }
  if (s) return { chave: 'parede_N', t: 0 };
  if (n) return { chave: 'parede_S', t: 0 };
  if (l) return { chave: 'parede_O', t: 0 };
  if (o) return { chave: 'parede_L', t: 0 };
  if (p(1, 1)) return { chave: 'canto_NO', t: 0 };
  if (p(-1, 1)) return { chave: 'canto_NE', t: 0 };
  if (p(1, -1)) return { chave: 'canto_SO', t: 0 };
  if (p(-1, -1)) return { chave: 'canto_SE', t: 0 };
  return null;
}

/** A peça de uma célula: a sobrescrita do jogador (`pecas`), senão o autotiling. */
export function pecaDaCelula(fase: Fase, x: number, y: number, semente: number): Peca | null {
  const propria = fase.pecas[y * fase.largura + x];
  if (propria) return lerPeca(propria);
  return autotile(fase, x, y, semente);
}

export interface RecorteAtlas {
  coluna: number;
  linha: number;
  x: number;
  y: number;
  largura: number;
  altura: number;
}

/**
 * Fatiamento (§2.16): cada borda é arredondada à parte (`(img − sep·(n+1)) / n` por célula), para a deriva de
 * ponto flutuante não acumular. Devolve null se a separação não deixa espaço para as células.
 */
export function fatiar(larguraImg: number, alturaImg: number, grade: GradeAtlas, separacao: number): RecorteAtlas[] | null {
  const lc = (larguraImg - separacao * (grade + 1)) / grade;
  const ac = (alturaImg - separacao * (grade + 1)) / grade;
  if (!(lc >= 1 && ac >= 1)) return null;
  const borda = (i: number, tam: number) => Math.round(separacao * (i + 1) + i * tam);
  const recortes: RecorteAtlas[] = [];
  for (let linha = 0; linha < grade; linha++) {
    for (let coluna = 0; coluna < grade; coluna++) {
      const x = borda(coluna, lc);
      const y = borda(linha, ac);
      recortes.push({ coluna, linha, x, y, largura: Math.round(separacao * (coluna + 1) + (coluna + 1) * lc) - x, altura: Math.round(separacao * (linha + 1) + (linha + 1) * ac) - y });
    }
  }
  return recortes;
}

/**
 * Herança (§2.16): a fase sem tileset usa o da fase anterior mais próxima que tenha um; sem nenhuma antes, o da
 * primeira que tiver (mantém o padrão visual contínuo dentro de uma aventura).
 */
export function tilesetHerdado(tilesets: readonly (string | null)[], indice: number): string | null {
  for (let i = Math.min(indice, tilesets.length - 1); i >= 0; i--) {
    const t = tilesets[i];
    if (t) return t;
  }
  return tilesets.find((t): t is string => !!t) ?? null;
}

/** Peças referenciadas pela fase que o atlas não tem (nem por reserva): o editor avisa na célula. */
export function pecasAusentes(fase: Fase, vinculos: Vinculos): Celula[] {
  const ausentes: Celula[] = [];
  for (const [indice, texto] of Object.entries(fase.pecas)) {
    const p = lerPeca(texto);
    if (p && resolverPeca(p, vinculos)) continue;
    const i = Number(indice);
    ausentes.push({ x: i % fase.largura, y: Math.floor(i / fase.largura) });
  }
  return ausentes;
}

const MAX_PECAS = 20_000;
const RE_ATLAS = /^[a-z0-9-]{1,64}$/i;

/**
 * Lê `tileset` e `pecas` de uma fase (validação, §3.10): o id do atlas, e cada peça num índice de célula do mapa com
 * a forma `chave@t`. Que a peça exista no atlas só dá para saber com o atlas (o editor avisa, `pecasAusentes`).
 */
export function lerCamposDeTileset(
  tileset: unknown,
  pecas: unknown,
  celulas: number,
  erros: { mensagem: string }[],
): { tileset?: { atlasId: string } | null; pecas?: Record<string, string> } {
  const r: { tileset?: { atlasId: string } | null; pecas?: Record<string, string> } = {};
  if (tileset === null) r.tileset = null;
  else if (tileset !== undefined) {
    const id = typeof tileset === 'object' && !Array.isArray(tileset) ? (tileset as { atlasId?: unknown }).atlasId : undefined;
    if (typeof id === 'string' && RE_ATLAS.test(id)) r.tileset = { atlasId: id };
    else erros.push({ mensagem: 'tileset precisa ser null ou { atlasId } com até 64 letras, números e hífens' });
  }
  if (pecas === undefined) return r;
  if (typeof pecas !== 'object' || pecas === null || Array.isArray(pecas)) {
    erros.push({ mensagem: 'pecas precisa ser um objeto índice → peça' });
    return r;
  }
  const entradas = Object.entries(pecas);
  if (entradas.length > MAX_PECAS) {
    erros.push({ mensagem: `pecas aceita até ${MAX_PECAS} células` });
    return r;
  }
  const lidas: Record<string, string> = {};
  for (const [k, v] of entradas) {
    const i = Number(k);
    if (!Number.isInteger(i) || i < 0 || i >= celulas || typeof v !== 'string' || !lerPeca(v)) {
      erros.push({ mensagem: `peça inválida na célula ${k}` });
      return r;
    }
    lidas[String(i)] = v;
  }
  r.pecas = lidas;
  return r;
}

