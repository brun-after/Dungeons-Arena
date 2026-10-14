// Núcleo do editor de fases (§3.10). Marco 6C (13/10/2026). Puro e testado: a fase editável é a
// mesma `Fase` do jogo (as células vivem num Uint8Array compartilhado com o renderizador), mais o
// spawn e os inimigos. Cada ferramenta devolve as alterações feitas, para o histórico desfazer.
// Marco 8A (14/10/2026): orbes (vida, mana e de efeito), com a lista de efeitos tirada do registro.

import { construirEfeito, ehTipoEfeito, REGISTRO_EFEITOS, type EfeitoCanonico } from '../combat/registro-efeitos';
import type { Celula } from '../core/comandos';
import {
  carregarFase,
  caractereDeTipo,
  codigoDeTipo,
  tipoEm,
  type Fase,
  type FaseJson,
  type InimigoPosicionado,
  type TipoCelula,
  type TipoObjetoDeFase,
} from '../world/fase';
import { TAMANHO_MAX, TAMANHO_MIN } from '../world/validacao-fase';

export interface FaseEditavel {
  id: string;
  nome: string;
  largura: number;
  altura: number;
  celulas: Uint8Array;
  spawn: Celula | null;
  inimigos: InimigoPosicionado[];
  /** Orbes posicionados, em células. */
  objetos: ObjetoEditavel[];
}

export interface ObjetoEditavel {
  x: number;
  y: number;
  tipo: TipoObjetoDeFase;
  efeito: EfeitoCanonico | null;
}

/** Valores dos orbes de vida e mana colocados no editor (os mesmos das fases oficiais). */
const VALOR_ORBE: Readonly<Record<'orbe_hp' | 'orbe_recurso', number>> = { orbe_hp: 30, orbe_recurso: 50 };

/**
 * Chave de um orbe na interface e no histórico: `orbe_hp`, `orbe_recurso` ou `efeito:<tipo>`.
 * A lista de efeitos vem do registro (§2.8): um tipo novo elegível aparece no editor sozinho.
 */
export function chavesDeOrbe(): string[] {
  return ['orbe_hp', 'orbe_recurso', ...Object.values(REGISTRO_EFEITOS).filter((d) => d.elegivelParaOrbe).map((d) => `efeito:${d.id}`)];
}

export function chaveDoObjeto(o: { tipo: TipoObjetoDeFase; efeito: EfeitoCanonico | null }): string {
  return o.tipo === 'orbe_efeito' && o.efeito ? `efeito:${o.efeito.tipo}` : o.tipo;
}

function objetoDaChave(chave: string, x: number, y: number): ObjetoEditavel | null {
  if (chave === 'orbe_hp' || chave === 'orbe_recurso') return { x, y, tipo: chave, efeito: null };
  const tipo = chave.startsWith('efeito:') ? chave.slice('efeito:'.length) : '';
  return ehTipoEfeito(tipo) ? { x, y, tipo: 'orbe_efeito', efeito: construirEfeito(tipo) } : null;
}

export type Ferramenta =
  | { t: 'terreno'; tipo: TipoCelula }
  | { t: 'spawn' }
  | { t: 'inimigo'; preset: string }
  | { t: 'objeto'; chave: string }
  | { t: 'remover' };

/** Tudo o que existe numa célula: terreno, spawn, inimigo e orbe (pela chave). */
export interface ConteudoCelula {
  tipo: TipoCelula;
  spawn: boolean;
  inimigo: string | null;
  objeto: string | null;
}

export interface Alteracao {
  x: number;
  y: number;
  antes: ConteudoCelula;
  depois: ConteudoCelula;
}

export function novaFaseEditavel(id: string, nome: string, largura: number, altura: number): FaseEditavel {
  const l = Math.max(TAMANHO_MIN, Math.min(TAMANHO_MAX, Math.round(largura)));
  const a = Math.max(TAMANHO_MIN, Math.min(TAMANHO_MAX, Math.round(altura)));
  const celulas = new Uint8Array(l * a);
  for (let y = 0; y < a; y++) {
    for (let x = 0; x < l; x++) {
      const borda = x === 0 || y === 0 || x === l - 1 || y === a - 1;
      celulas[y * l + x] = codigoDeTipo(borda ? 'parede' : 'piso');
    }
  }
  return { id, nome, largura: l, altura: a, celulas, spawn: { x: 1, y: 1 }, inimigos: [], objetos: [] };
}

/** A mesma `Fase` do jogo, compartilhando as células (o renderizador vê cada pincelada). */
export function comoFase(f: FaseEditavel): Fase {
  return {
    id: f.id,
    nome: f.nome,
    ordem: 1,
    largura: f.largura,
    altura: f.altura,
    celulas: f.celulas,
    tipo: 'campanha',
    spawns: f.spawn ? [f.spawn] : [],
    inimigos: f.inimigos,
    objetos: [],
  };
}

export function paraFaseJson(f: FaseEditavel): FaseJson {
  const fase = comoFase(f);
  const mapa: string[] = [];
  for (let y = 0; y < f.altura; y++) {
    let linha = '';
    for (let x = 0; x < f.largura; x++) linha += caractereDeTipo(tipoEm(fase, x, y));
    mapa.push(linha);
  }
  return {
    id: f.id,
    nome: f.nome,
    ordem: 1,
    tipo: 'campanha',
    mapa,
    spawns: f.spawn ? [{ x: f.spawn.x, y: f.spawn.y }] : [],
    inimigos: f.inimigos.map((i) => ({ ...i })),
    // Coordenadas normalizadas no centro da célula: voltam exatamente para a mesma célula.
    objetos: f.objetos.map((o) => ({
      tipo: o.tipo,
      x: (o.x + 0.5) / f.largura,
      y: (o.y + 0.5) / f.altura,
      valor: o.tipo === 'orbe_efeito' ? 1 : VALOR_ORBE[o.tipo],
      modo: o.tipo === 'orbe_efeito' ? 'abs' : 'pct',
      ...(o.efeito && { efeito: { ...o.efeito } }),
    })),
  };
}

/** De uma fase já validada (importação, ou a gravada no banco). */
export function deFaseJson(json: FaseJson): FaseEditavel {
  const fase = carregarFase(json);
  return {
    id: json.id,
    nome: json.nome,
    largura: fase.largura,
    altura: fase.altura,
    celulas: new Uint8Array(fase.celulas),
    spawn: fase.spawns[0] ? { ...fase.spawns[0] } : null,
    inimigos: fase.inimigos.map((i) => ({ ...i })),
    objetos: fase.objetos.map((o) => ({ x: o.x, y: o.y, tipo: o.tipo, efeito: o.efeito ? { ...o.efeito } : null })),
  };
}

export function dentro(f: FaseEditavel, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < f.largura && y < f.altura;
}

export function lerCelula(f: FaseEditavel, x: number, y: number): ConteudoCelula {
  return {
    tipo: tipoEm(comoFase(f), x, y),
    spawn: f.spawn?.x === x && f.spawn.y === y,
    inimigo: f.inimigos.find((i) => i.x === x && i.y === y)?.preset ?? null,
    objeto: objetoNaCelula(f, x, y),
  };
}

function objetoNaCelula(f: FaseEditavel, x: number, y: number): string | null {
  const o = f.objetos.find((x2) => x2.x === x && x2.y === y);
  return o ? chaveDoObjeto(o) : null;
}

/** Escreve o conteúdo de uma célula (usado também para desfazer e refazer). */
export function escreverCelula(f: FaseEditavel, x: number, y: number, c: ConteudoCelula): void {
  f.celulas[y * f.largura + x] = codigoDeTipo(c.tipo);
  if (c.spawn) f.spawn = { x, y };
  else if (f.spawn?.x === x && f.spawn.y === y) f.spawn = null;
  f.inimigos = f.inimigos.filter((i) => i.x !== x || i.y !== y);
  if (c.inimigo) f.inimigos.push({ preset: c.inimigo, x, y });
  f.objetos = f.objetos.filter((o) => o.x !== x || o.y !== y);
  const objeto = c.objeto ? objetoDaChave(c.objeto, x, y) : null;
  if (objeto) f.objetos.push(objeto);
}

const iguais = (a: ConteudoCelula, b: ConteudoCelula) =>
  a.tipo === b.tipo && a.spawn === b.spawn && a.inimigo === b.inimigo && a.objeto === b.objeto;

/**
 * Aplica a ferramenta numa célula. Regras: terreno sólido (parede, vazio) tira spawn, inimigo e orbe de
 * cima; spawn e inimigo só ficam em célula passável (vira piso se preciso); o spawn é único, então
 * movê-lo altera duas células.
 */
export function aplicarFerramenta(f: FaseEditavel, ferramenta: Ferramenta, x: number, y: number): Alteracao[] {
  if (!dentro(f, x, y)) return [];
  const alteracoes: Alteracao[] = [];
  const mudar = (cx: number, cy: number, depois: ConteudoCelula) => {
    const antes = lerCelula(f, cx, cy);
    if (iguais(antes, depois)) return;
    escreverCelula(f, cx, cy, depois);
    alteracoes.push({ x: cx, y: cy, antes, depois });
  };
  const atual = lerCelula(f, x, y);
  const piso = (c: ConteudoCelula): TipoCelula => (c.tipo === 'piso' || c.tipo === 'saida' ? c.tipo : 'piso');
  switch (ferramenta.t) {
    case 'terreno': {
      const solido = ferramenta.tipo === 'parede' || ferramenta.tipo === 'vazio';
      mudar(x, y, solido ? { tipo: ferramenta.tipo, spawn: false, inimigo: null, objeto: null } : { ...atual, tipo: ferramenta.tipo });
      break;
    }
    case 'spawn': {
      const anterior = f.spawn;
      if (anterior && (anterior.x !== x || anterior.y !== y)) mudar(anterior.x, anterior.y, { ...lerCelula(f, anterior.x, anterior.y), spawn: false });
      mudar(x, y, { ...atual, tipo: piso(atual), spawn: true, inimigo: null });
      break;
    }
    case 'inimigo':
      mudar(x, y, { ...atual, tipo: piso(atual), spawn: false, inimigo: ferramenta.preset });
      break;
    case 'objeto':
      if (objetoDaChave(ferramenta.chave, x, y)) mudar(x, y, { ...atual, tipo: piso(atual), objeto: ferramenta.chave });
      break;
    case 'remover':
      mudar(x, y, { ...atual, spawn: false, inimigo: null, objeto: null });
      break;
  }
  return alteracoes;
}

/** Células de uma linha entre duas células (Bresenham), para o traço não pular células. */
export function linhaDeCelulas(a: Celula, b: Celula): Celula[] {
  const celulas: Celula[] = [];
  let { x, y } = a;
  const dx = Math.abs(b.x - x);
  const dy = -Math.abs(b.y - y);
  const sx = x < b.x ? 1 : -1;
  const sy = y < b.y ? 1 : -1;
  let erro = dx + dy;
  for (;;) {
    celulas.push({ x, y });
    if (x === b.x && y === b.y) break;
    const e2 = 2 * erro;
    if (e2 >= dy) {
      erro += dy;
      x += sx;
    }
    if (e2 <= dx) {
      erro += dx;
      y += sy;
    }
  }
  return celulas;
}
