// Marco 45 (16/11/2026, D-181): as criaturas das nove dimensões que invadem Filo. Cada preset de monstro pode trazer
// `dimensao`, a faixa de nível (`nivelMin` e `nivelPico`), os traços (o jeito próprio de lutar, em dados), as reações
// aos terrenos elementais (`naFenda`) e, nos chefes, a mecânica de arena (`chefe`). Só tipos e o clone do estado.

import type { Celula } from '../../core/comandos';
import type { EfeitoCanonico } from '../../combat/registro-efeitos';
import type { TipoTerrenoVivo } from '../../world/ambiente-tipos';

/** O que cada traço faz fica em entities/criaturas/tracos.ts, golpes.ts e morte.ts (uma função pequena por tipo). */
export type Traco =
  | { tipo: 'aura'; raio: number; em: 'aliados' | 'hostis'; efeitos: EfeitoCanonico[]; aCadaMs: number }
  | { tipo: 'bando'; raio: number; porAliadoPct: number; maxPct: number }
  | { tipo: 'fugaFerida'; hpPct: number; imuneMs: number }
  | { tipo: 'dividir'; hpPct: number; partes: number; vidaPct: number }
  | { tipo: 'aoMorrer'; raio: number; dano: number; efeitos: EfeitoCanonico[] }
  | { tipo: 'placas'; qtd: number; reducaoPct: number; golpeMinPct: number; furia: EfeitoCanonico[] }
  | { tipo: 'furtivo'; distancia: number }
  | { tipo: 'elo'; raio: number; dano: number; aCadaMs: number; efeitos: EfeitoCanonico[] }
  | { tipo: 'paraRaios'; raio: number; devolverACada: number }
  | { tipo: 'bebe'; curaPct: number }
  | { tipo: 'nuvem'; alvoUnicoPct: number; areaPct: number; paradoPct: number }
  | { tipo: 'ladraoDeLuz'; roubaMs: number }
  | { tipo: 'remontar'; ms: number; vidaPct: number }
  | { tipo: 'faminto'; raio: number; porMortePct: number; max: number }
  | { tipo: 'sono'; semDanoMs: number; raio: number; cura: number; aCadaMs: number }
  | { tipo: 'anel'; runas: number; raio: number; prendeMs: number }
  | { tipo: 'espelho'; pct: number }
  | { tipo: 'fios'; raio: number; max: number; bonusPct: number }
  | { tipo: 'enrolar'; fechadoMs: number; abertoMs: number; reducaoPct: number }
  | { tipo: 'costas'; multPct: number }
  | { tipo: 'regenParado'; pctPorS: number }
  | { tipo: 'pedras'; ms: number }
  | { tipo: 'estase'; raio: number; lentidaoPct: number; reducaoAliadosPct: number }
  | { tipo: 'penitencia'; porPct: number }
  | { tipo: 'frontal'; coneGraus: number; giroGrausPorS: number }
  | { tipo: 'flutuar'; noArMs: number; chaoMs: number }
  | { tipo: 'denuncia'; raio: number }
  | { tipo: 'correntes'; comprimento: number; ms: number; aCadaMs: number }
  /** A sombra roubada: só leva dano na luz (tocha ou luz sagrada). */
  | { tipo: 'soNaLuz'; foraPct: number };

export type TipoTraco = Traco['tipo'];

/**
 * O que a criatura ganha dentro de um terreno elemental (a "fenda" carregada). As `marcas` são lidas pelos traços e
 * comportamentos (cada uma por uma função): `semEstilhaco`, `visivel`, `apagado`, `recompoe`, `semRemontar`, `encolhe`,
 * `naoPousa`, `juntar`, `invisivel`, `dobra`, `semCampo`, `enterra`, `ponte`, `tromba`, `duplaCopia`, `saltoDuplo`,
 * `maisSaltos`, `teiasDobro`, `fiosInvisiveis`, `pregaDobro`, `giroLento`, `herdaElemento`, `sonhaTerreno`, `levaTerreno`,
 * `cogumeloRapido`, `linhaGrossa`, `poca`.
 */
export interface ReacaoNaFenda {
  vidaPct: number;
  danoPct: number;
  velocidadePct: number;
  curaPctPorS: number;
  golpe: EfeitoCanonico[];
  marcas: readonly string[];
}

export type NaFenda = Readonly<Partial<Record<TipoTerrenoVivo, ReacaoNaFenda>>>;

/** A mecânica de arena do chefe (entities/criaturas/chefes.ts): o id e os números dela (com padrão no código). */
export interface MecanicaDeChefe {
  mecanica: string;
  numeros: Readonly<Record<string, number>>;
  /** O preset que a mecânica põe na arena (torre, pilar, casulo, braseiro, refém…). */
  ref: string | null;
}

/** O estado da criatura na entidade (só dados; clonado por `clonarCriatura`). */
export interface EstadoCriatura {
  placas?: number;
  furia?: boolean;
  fugiu?: boolean;
  dividiu?: boolean;
  remontou?: boolean;
  /** Desmontada (o Arqueiro de Osso): volta neste tick. */
  remontaTick?: number;
  comidos?: number;
  dormindo?: boolean;
  enroladoAteTick?: number;
  abertoAteTick?: number;
  fios?: string[];
  /** O olhar lento do escudo frontal, em graus (0 = +x). */
  olharGraus?: number;
  noArAteTick?: number;
  chaoAteTick?: number;
  plantada?: boolean;
  absorvidos?: number;
  /** A última skill do jogador que o Espelhante levou. */
  copia?: string;
  /** O ciclo do fole: inspira até, sopra até. */
  inspiraAteTick?: number;
  proximoFoleTick?: number;
  rolouCelulas?: number;
  /** Desde quando a matilha corre em roda (o Galgo do Vendaval). */
  rolandoDesde?: number;
  rolando?: boolean;
  proximoTracoTick?: Record<string, number>;
  faixas?: { x: number; y: number; dx: number; dy: number; n: number; ateTick: number }[];
  /** Chefes: a fase atual, os objetos da arena, a regra da vez e os relógios. */
  fase?: number;
  objetos?: string[];
  regra?: string;
  regraAteTick?: number;
  proximoCicloTick?: number;
  expostoAteTick?: number;
  arena?: Celula;
  marcados?: string[];
  /** O último golpe que a criatura levou: em área ou sagrado (o Arqueiro de Osso não se remonta deles). */
  golpeFinal?: { area: boolean; sagrado: boolean };
  /** As marcas no chão do chefe (silêncio, bombardeio, colunas, mergulho), com o que fazem no fim. */
  zonas?: { tipo: string; x: number; y: number; raio: number; ateTick: number }[];
  /** O chefe dono do objeto de arena (a torre, o pilar, o casulo, o braseiro, a estátua do aliado). */
  donoId?: string;
  nascidoTick?: number;
  /** O objeto que se desfaz sozinho (a pedra do Fundeiro) neste tick. */
  someTick?: number;
  /** Quantos raios o Para-raios já engoliu (devolve a cada N). */
  raios?: number;
  /** Os fios do Marionetista na névoa: não aparecem na tela. */
  fiosOcultos?: boolean;
}

export function clonarCriatura(c: EstadoCriatura): EstadoCriatura {
  return {
    ...c,
    ...(c.fios ? { fios: [...c.fios] } : {}),
    ...(c.proximoTracoTick ? { proximoTracoTick: { ...c.proximoTracoTick } } : {}),
    ...(c.faixas ? { faixas: c.faixas.map((f) => ({ ...f })) } : {}),
    ...(c.objetos ? { objetos: [...c.objetos] } : {}),
    ...(c.arena ? { arena: { ...c.arena } } : {}),
    ...(c.marcados ? { marcados: [...c.marcados] } : {}),
    ...(c.golpeFinal ? { golpeFinal: { ...c.golpeFinal } } : {}),
    ...(c.zonas ? { zonas: c.zonas.map((z) => ({ ...z })) } : {}),
  };
}

export const REACAO_NEUTRA: ReacaoNaFenda = { vidaPct: 0, danoPct: 0, velocidadePct: 0, curaPctPorS: 0, golpe: [], marcas: [] };

/** As mecânicas de chefe que existem (uma função por id em chefes-mecanicas.ts; o conteúdo confere o preset). */
export const MECANICAS_DE_CHEFE = [
  'bandoArmadura', 'fornalhaFases', 'zonasSilencio', 'estatuasDeAliados', 'torresDeRecarga', 'refens', 'nevoaCrescente', 'casulos',
  'roubarSombra', 'braseiros', 'sonho', 'mascaras', 'colunas', 'geodo', 'pecados', 'bombardeio', 'voo',
] as const;
export type IdMecanica = (typeof MECANICAS_DE_CHEFE)[number];
