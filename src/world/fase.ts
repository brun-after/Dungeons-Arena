// Fase e grid (§2.1). A fase é conteúdo imutável: fica fora do estado da simulação e chega
// a `simular()` pelo contexto. Marco 2: só terreno e spawns; objetos e inimigos posicionados
// entram nos marcos seguintes.

import type { EfeitoCanonico } from '../combat/registro-efeitos';
import type { AreaAmbiente } from './ambiente-tipos';
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
const CARACTERE_POR_TIPO: Readonly<Record<TipoCelula, string>> = { parede: '#', piso: '.', saida: 'S', vazio: ' ' };

/** Código numérico de `Fase.celulas` (o editor escreve direto nele, marco 6C). */
export function codigoDeTipo(tipo: TipoCelula): number {
  return CODIGO[tipo];
}

/** Caractere do mapa em texto (exportação do editor). */
export function caractereDeTipo(tipo: TipoCelula): string {
  return CARACTERE_POR_TIPO[tipo];
}

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
  /** Marco 14: habilidades a mais da instância (as geradas por semente nas fases geradas). */
  habilidades?: string[];
}

/**
 * Objeto autorado (§2.1): coordenadas normalizadas 0–1, convertidas para célula por
 * `coluna = min(largura − 1, floor(x × largura))`, e equivalente para a linha.
 */
export type TipoOrbeDeFase = 'orbe_hp' | 'orbe_recurso' | 'orbe_efeito';
/** Marco 9A (14/10/2026): baú, loja e loot posicionados; 9A-2: armadilha de fase; 12: fonte sonora. */
export type TipoObjetoDeFase = TipoOrbeDeFase | 'bau' | 'loja' | 'loot' | 'armadilha' | 'fonte_som' | 'santuario';

/** Sons ambientes das fontes sonoras (§2.1, §2.14), sintetizados pelo jogo (D-056). */
export const SONS_DE_FONTE = ['fogo', 'agua', 'vento', 'goteira'] as const;
export type SomDeFonte = (typeof SONS_DE_FONTE)[number];

export type ObjetoPosicionadoJson =
  | { tipo: 'santuario'; x: number; y: number }
  | {
      tipo: TipoOrbeDeFase;
      x: number;
      y: number;
      valor: number;
      modo: 'abs' | 'pct';
      /** Só no `orbe_efeito` (marco 8A): o efeito, já normalizado pela validação. */
      efeito?: EfeitoCanonico;
    }
  /** `chave`: o item exigido (e consumido) para abrir; sem ela, o baú está destrancado. */
  | { tipo: 'bau'; x: number; y: number; loot: string[]; ouro: number; chave?: string }
  | { tipo: 'loja'; x: number; y: number; estoque: string[] }
  | { tipo: 'loot'; x: number; y: number; itemId: string; quantidade: number }
  /** Invisível; dano fixo (`valor`) e efeito opcional. `rearmeMs` só com `modo: 'rearme'`. */
  | { tipo: 'armadilha'; x: number; y: number; valor: number; efeito?: EfeitoCanonico; modo: 'unica' | 'rearme'; rearmeMs?: number }
  /** Marco 12: fonte sonora em laço; só a apresentação a lê (não entra no estado da simulação). */
  | { tipo: 'fonte_som'; x: number; y: number; sfxId: SomDeFonte; raio: number; volume: number };

/** Forma uniforme, já em células; os campos que o tipo não usa ficam neutros. */
export interface ObjetoPosicionado {
  tipo: TipoObjetoDeFase;
  x: number;
  y: number;
  valor: number;
  modo: 'abs' | 'pct';
  efeito: EfeitoCanonico | null;
  /** Conteúdo do baú ou estoque da loja. */
  itens: string[];
  ouro: number;
  chave: string | null;
  /** Item do loot (a quantidade vai em `valor`). */
  itemId: string | null;
  /** Armadilha de fase: 0 = disparo único. */
  rearmeMs: number;
  /** Fonte sonora: o som (o volume vai em `valor` e o alcance em células em `raio`). */
  som: SomDeFonte | null;
  raio: number;
}

function objetoCarregado(o: ObjetoPosicionadoJson, largura: number, altura: number): ObjetoPosicionado {
  const base: ObjetoPosicionado = {
    tipo: o.tipo,
    x: celulaNormalizada(o.x, largura),
    y: celulaNormalizada(o.y, altura),
    valor: 1,
    modo: 'abs',
    efeito: null,
    itens: [],
    ouro: 0,
    chave: null,
    itemId: null,
    rearmeMs: 0,
    som: null,
    raio: 0,
  };
  switch (o.tipo) {
    case 'santuario': return base;
    case 'bau':
      return { ...base, itens: [...o.loot], ouro: o.ouro, chave: o.chave ?? null };
    case 'loja':
      return { ...base, itens: [...o.estoque] };
    case 'loot':
      return { ...base, valor: o.quantidade, itemId: o.itemId };
    case 'armadilha':
      return { ...base, valor: o.valor, efeito: o.efeito ? { ...o.efeito } : null, rearmeMs: o.modo === 'rearme' ? (o.rearmeMs ?? 0) : 0 };
    case 'fonte_som':
      return { ...base, valor: o.volume, som: o.sfxId, raio: o.raio };
    default:
      return { ...base, valor: o.valor, modo: o.modo, efeito: o.efeito ? { ...o.efeito } : null };
  }
}

/**
 * Porta de saída (§2.1, marco 10A-1): numa célula `S`. Tranca `chave` exige (e consome) o item;
 * `boss` abre quando o inimigo de índice `bossIndice` morre. Sem porta de saída, toda `S` é livre.
 */
export interface PortaSaida {
  x: number;
  y: number;
  tranca: 'livre' | 'chave' | 'boss';
  chave?: string;
  bossIndice?: number;
}

/** Par de portas internas de teleporte na mesma fase (§2.1). */
export interface PortaInterna {
  numero: number;
  nome: string;
  a: Celula;
  b: Celula;
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
  objetos?: ObjetoPosicionadoJson[];
  portaSaida?: PortaSaida;
  portasInternas?: PortaInterna[];
  /** Marco 10A-2: matiz do terreno em graus (fases geradas giram 28° a cada fase, §2.1). */
  matizGraus?: number;
  /** Marco 11A (D-066): o atlas do jogador (store `tilesets`); null ou ausente herda (§2.16). */
  tileset?: { atlasId: string } | null;
  /** Marco 11A: peças escolhidas à mão, por índice de célula (`y·largura + x`) -> `chave@t` (§2.16). */
  pecas?: Record<string, string>;
  /** Marco 18 (D-070): eventos da fase gerada (lua sangrenta, mercador errante, sala secreta). */
  eventos?: string[];
  ambientes?: AreaAmbiente[];
}

export function celulaNormalizada(v: number, tamanho: number): number {
  return Math.min(tamanho - 1, Math.floor(v * tamanho));
}

export interface Fase {
  readonly id: string;
  readonly nome: string;
  readonly ordem: number;
  readonly largura: number;
  readonly altura: number;
  /** Tipo de cada célula, linha a linha (`y * largura + x`). */
  readonly celulas: Uint8Array;
  readonly tipo: FaseJson['tipo'];
  readonly spawns: readonly Celula[];
  readonly inimigos: readonly InimigoPosicionado[];
  /** Objetos já convertidos para células. */
  readonly objetos: readonly ObjetoPosicionado[];
  /** Marco 10A-1: porta de saída (null = toda célula `S` é saída livre) e portas internas. */
  readonly portaRetorno?: Celula;
  readonly portaSaida: PortaSaida | null;
  readonly portasInternas: readonly PortaInterna[];
  readonly matizGraus: number;
  /** Marco 11A: o atlas da fase (já com a herança resolvida por quem carrega) e as peças à mão. */
  readonly tilesetId: string | null;
  readonly pecas: Readonly<Record<number, string>>;
  /** Marco 18 (D-070): os eventos da fase (o diário anota; a interface mostra). */
  readonly eventos: readonly string[];
  readonly ambientes?: readonly AreaAmbiente[];
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
    tipo: json.tipo,
    spawns: json.spawns.map((s) => ({ x: s.x, y: s.y })),
    inimigos: (json.inimigos ?? []).map((i) => ({ ...i, ...(i.habilidades && { habilidades: [...i.habilidades] }) })),
    objetos: (json.objetos ?? []).map((o) => objetoCarregado(o, largura, altura)),
    portaSaida: json.portaSaida ? { ...json.portaSaida } : null,
    portasInternas: (json.portasInternas ?? []).map((p) => ({ ...p, a: { ...p.a }, b: { ...p.b } })),
    matizGraus: json.matizGraus ?? 0,
    tilesetId: json.tileset?.atlasId ?? null,
    pecas: { ...json.pecas },
    eventos: [...(json.eventos ?? [])],
    ambientes: (json.ambientes ?? []).map((a) => ({ ...a })),
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
