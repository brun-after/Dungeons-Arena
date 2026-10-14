// Núcleo do editor de fases (§3.10). Marco 6C (13/10/2026). Puro e testado: a fase editável é a
// mesma `Fase` do jogo (as células vivem num Uint8Array compartilhado com o renderizador), mais o
// spawn e os inimigos. Cada ferramenta devolve as alterações feitas, para o histórico desfazer.

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
}

export type Ferramenta =
  | { t: 'terreno'; tipo: TipoCelula }
  | { t: 'spawn' }
  | { t: 'inimigo'; preset: string }
  | { t: 'remover' };

/** Tudo o que existe numa célula: terreno, spawn e inimigo. */
export interface ConteudoCelula {
  tipo: TipoCelula;
  spawn: boolean;
  inimigo: string | null;
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
  return { id, nome, largura: l, altura: a, celulas, spawn: { x: 1, y: 1 }, inimigos: [] };
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
  };
}

/** Escreve o conteúdo de uma célula (usado também para desfazer e refazer). */
export function escreverCelula(f: FaseEditavel, x: number, y: number, c: ConteudoCelula): void {
  f.celulas[y * f.largura + x] = codigoDeTipo(c.tipo);
  if (c.spawn) f.spawn = { x, y };
  else if (f.spawn?.x === x && f.spawn.y === y) f.spawn = null;
  f.inimigos = f.inimigos.filter((i) => i.x !== x || i.y !== y);
  if (c.inimigo) f.inimigos.push({ preset: c.inimigo, x, y });
}

const iguais = (a: ConteudoCelula, b: ConteudoCelula) => a.tipo === b.tipo && a.spawn === b.spawn && a.inimigo === b.inimigo;

/**
 * Aplica a ferramenta numa célula. Regras: terreno sólido (parede, vazio) tira spawn e inimigo de
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
      mudar(x, y, solido ? { tipo: ferramenta.tipo, spawn: false, inimigo: null } : { ...atual, tipo: ferramenta.tipo });
      break;
    }
    case 'spawn': {
      const anterior = f.spawn;
      if (anterior && (anterior.x !== x || anterior.y !== y)) mudar(anterior.x, anterior.y, { ...lerCelula(f, anterior.x, anterior.y), spawn: false });
      mudar(x, y, { tipo: piso(atual), spawn: true, inimigo: null });
      break;
    }
    case 'inimigo':
      mudar(x, y, { tipo: piso(atual), spawn: false, inimigo: ferramenta.preset });
      break;
    case 'remover':
      mudar(x, y, { ...atual, spawn: false, inimigo: null });
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
