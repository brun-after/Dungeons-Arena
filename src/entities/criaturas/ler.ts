// Marco 45 (16/11/2026, D-181): a leitura dos campos das criaturas nos presets (dimensão, faixa de nível, traços,
// reações às fendas e a mecânica do chefe). Os números de cada traço vêm do JSON; o que falta é erro.

import { ehObjeto, type Leitor, type Objeto } from '../../core/validar';
import { normalizarEfeitos } from '../../combat/normalizar-efeito';
import type { EfeitoCanonico } from '../../combat/registro-efeitos';
import { TIPOS_TERRENO_VIVO, type TipoTerrenoVivo } from '../../world/ambiente-tipos';
import type { MecanicaDeChefe, NaFenda, ReacaoNaFenda, Traco, TipoTraco } from './tipos';

/** Os números de cada tipo de traço (todos obrigatórios), na ordem em que o tipo os declara. */
const CAMPOS: Readonly<Record<TipoTraco, readonly string[]>> = {
  aura: ['raio', 'aCadaMs'],
  bando: ['raio', 'porAliadoPct', 'maxPct'],
  fugaFerida: ['hpPct', 'imuneMs'],
  dividir: ['hpPct', 'partes', 'vidaPct'],
  aoMorrer: ['raio', 'dano'],
  placas: ['qtd', 'reducaoPct', 'golpeMinPct'],
  furtivo: ['distancia'],
  elo: ['raio', 'dano', 'aCadaMs'],
  paraRaios: ['raio', 'devolverACada'],
  bebe: ['curaPct'],
  nuvem: ['alvoUnicoPct', 'areaPct', 'paradoPct'],
  ladraoDeLuz: ['roubaMs'],
  remontar: ['ms', 'vidaPct'],
  faminto: ['raio', 'porMortePct', 'max'],
  sono: ['semDanoMs', 'raio', 'cura', 'aCadaMs'],
  anel: ['runas', 'raio', 'prendeMs'],
  espelho: ['pct'],
  fios: ['raio', 'max', 'bonusPct'],
  enrolar: ['fechadoMs', 'abertoMs', 'reducaoPct'],
  costas: ['multPct'],
  regenParado: ['pctPorS'],
  pedras: ['ms'],
  estase: ['raio', 'lentidaoPct', 'reducaoAliadosPct'],
  penitencia: ['porPct'],
  frontal: ['coneGraus', 'giroGrausPorS'],
  flutuar: ['noArMs', 'chaoMs'],
  denuncia: ['raio'],
  correntes: ['comprimento', 'ms', 'aCadaMs'],
  soNaLuz: ['foraPct'],
};
const TIPOS = Object.keys(CAMPOS) as TipoTraco[];

function efeitos(l: Leitor, o: Objeto, campo: string): EfeitoCanonico[] {
  if (o[campo] === undefined) return [];
  return normalizarEfeitos(l.lista(o, campo), l);
}

export function lerTracos(l: Leitor, v: unknown): Traco[] {
  if (v === undefined) return [];
  return l.lista({ tracos: v }, 'tracos').flatMap((item) => {
    const o = l.objeto(item, 'tracos');
    const tipo = l.opcao(o, 'tipo', TIPOS);
    const numeros = Object.fromEntries(CAMPOS[tipo].map((c) => [c, l.numero(o, c, { min: 0 })]));
    const base = { ...numeros, tipo };
    // Os campos de efeito e de texto de cada tipo (o resto já é número).
    if (tipo === 'aura') return [{ ...base, em: l.opcao(o, 'em', ['aliados', 'hostis'] as const), efeitos: efeitos(l, o, 'efeitos') } as Traco];
    if (tipo === 'aoMorrer' || tipo === 'elo') return [{ ...base, efeitos: efeitos(l, o, 'efeitos') } as Traco];
    if (tipo === 'placas') return [{ ...base, furia: efeitos(l, o, 'furia') } as Traco];
    return [base as Traco];
  });
}

function lerReacao(l: Leitor, o: Objeto): ReacaoNaFenda {
  const n = (c: string) => (o[c] === undefined ? 0 : l.numero(o, c, { min: -100, max: 500 }));
  return {
    vidaPct: n('vidaPct'),
    danoPct: n('danoPct'),
    velocidadePct: n('velocidadePct'),
    curaPctPorS: n('curaPctPorS'),
    golpe: efeitos(l, o, 'golpe'),
    marcas: o.marcas === undefined ? [] : l.listaDeTextos(o, 'marcas'),
  };
}

export function lerNaFenda(l: Leitor, v: unknown): NaFenda {
  if (v === undefined) return {};
  const o = l.objeto(v, 'naFenda');
  const saida: Partial<Record<TipoTerrenoVivo, ReacaoNaFenda>> = {};
  for (const chave of Object.keys(o)) {
    if (!(TIPOS_TERRENO_VIVO as readonly string[]).includes(chave)) {
      l.erro(`naFenda: terreno desconhecido "${chave}"`);
      continue;
    }
    saida[chave as TipoTerrenoVivo] = lerReacao(l, l.objeto(o[chave], `naFenda.${chave}`));
  }
  return saida;
}

export function lerChefe(l: Leitor, v: unknown): MecanicaDeChefe | null {
  if (v === undefined) return null;
  const o = l.objeto(v, 'chefe');
  const numeros: Record<string, number> = {};
  const brutos = o.numeros === undefined ? {} : l.objeto(o.numeros, 'chefe.numeros');
  for (const chave of Object.keys(brutos)) numeros[chave] = l.numero(brutos, chave);
  return { mecanica: l.texto(o, 'mecanica'), numeros, ref: o.ref === undefined ? null : l.texto(o, 'ref') };
}

/** A faixa de nível: entra a partir de `nivelMin` e, com pico, some acima de `nivelPico` (null = sem pico). */
export function lerFaixa(l: Leitor, o: Objeto): { nivelMin: number; nivelPico: number | null } {
  const nivelMin = o.nivelMin === undefined ? 1 : l.numero(o, 'nivelMin', { min: 1, max: 100, inteiro: true });
  const nivelPico = o.nivelPico === undefined || o.nivelPico === null ? null : l.numero(o, 'nivelPico', { min: 1, max: 100, inteiro: true });
  if (nivelPico !== null && nivelPico < nivelMin) l.erro('nivelPico abaixo de nivelMin');
  return { nivelMin, nivelPico };
}

export const temCampo = (o: unknown, campo: string): boolean => ehObjeto(o) && o[campo] !== undefined;
