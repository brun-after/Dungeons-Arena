// Fase e grid (§2.1). A fase é conteúdo imutável: fica fora do estado da simulação e chega
// a `simular()` pelo contexto. Marco 2: só terreno e spawns; objetos e inimigos posicionados
// entram nos marcos seguintes.

import type { Celula } from '../core/comandos';

export type TipoCelula = 'parede' | 'piso' | 'saida' | 'vazio';

/** Caracteres do mapa autorado em texto (uma string por linha). */
export const CARACTERE_CELULA: Readonly<Record<string, TipoCelula>> = {
  '#': 'parede',
  '.': 'piso',
  S: 'saida',
  ' ': 'vazio',
};

const CODIGO: Readonly<Record<TipoCelula, number>> = { parede: 0, piso: 1, saida: 2, vazio: 3 };
const TIPO_POR_CODIGO: readonly TipoCelula[] = ['parede', 'piso', 'saida', 'vazio'];

export interface SpawnJson {
  x: number;
  y: number;
  equipe?: string;
}

/** Inimigo posicionado pela autoria (§2.1). */
export interface InimigoPosicionado {
  preset: string;
  x: number;
  y: number;
  nivel?: number;
  /** Override de HP base da instância (§2.5). */
  hpBase?: number;
}

/** Formato da fase no JSON oficial e no editor (validado por `validarFase`). */
export interface FaseJson {
  id: string;
  nome: string;
  ordem: number;
  tipo: 'campanha' | 'arena' | 'ambas';
  mapa: string[];
  spawns: SpawnJson[];
  inimigos?: InimigoPosicionado[];
}

export interface Fase {
  readonly id: string;
  readonly nome: string;
  readonly ordem: number;
  readonly largura: number;
  readonly altura: number;
  /** Tipo de cada célula, linha a linha (`y * largura + x`). */
  readonly celulas: Uint8Array;
  readonly spawns: readonly Celula[];
  readonly inimigos: readonly InimigoPosicionado[];
}

/** Converte uma fase já validada para a forma usada pela simulação. */
export function carregarFase(json: FaseJson): Fase {
  const altura = json.mapa.length;
  const largura = json.mapa[0]?.length ?? 0;
  const celulas = new Uint8Array(largura * altura);
  for (let y = 0; y < altura; y++) {
    const linha = json.mapa[y] ?? '';
    for (let x = 0; x < largura; x++) {
      const tipo = CARACTERE_CELULA[linha[x] ?? ' '] ?? 'vazio';
      celulas[y * largura + x] = CODIGO[tipo];
    }
  }
  return {
    id: json.id,
    nome: json.nome,
    ordem: json.ordem,
    largura,
    altura,
    celulas,
    spawns: json.spawns.map((s) => ({ x: s.x, y: s.y })),
    inimigos: (json.inimigos ?? []).map((i) => ({ ...i })),
  };
}

export function dentroDoMapa(fase: Fase, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < fase.largura && y < fase.altura;
}

/** Tipo da célula; fora do mapa conta como vazio (sólido). */
export function tipoEm(fase: Fase, x: number, y: number): TipoCelula {
  if (!dentroDoMapa(fase, x, y)) return 'vazio';
  return TIPO_POR_CODIGO[fase.celulas[y * fase.largura + x] ?? CODIGO.vazio] ?? 'vazio';
}

/** Passável: piso e saída (§2.1). Portas e baús entram com os objetos de fase. */
export function passavel(fase: Fase, x: number, y: number): boolean {
  const tipo = tipoEm(fase, x, y);
  return tipo === 'piso' || tipo === 'saida';
}
