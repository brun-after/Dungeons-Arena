// Save da campanha (§3.5). Marco 6B (13/10/2026). Puro: sem IndexedDB, sem DOM (tsconfig.nucleo).
// Um registro por slot guarda o `EstadoJogo` inteiro da campanha (D-041): ficha, mochila, fase,
// posição, inimigos e respawns, PRNG e recargas. Gravar e ler é tarefa de `plataforma/saves.ts`.

import type { EstadoJogo } from '../core/estado';
import { ehObjeto, type Objeto } from '../core/validar';
import type { Entidade } from '../entities/entidade';
import { lerCertificado, type Certificado } from '../integridade/certificado';
import type { Dificuldade } from '../modos/dificuldade';
import { MAX_REGRAS, RE_REGRA_ESTILO } from '../world/estilo';
import type { ParametrosGeracao } from '../world/gerador';

export const VERSAO_SCHEMA = 12;
export const SLOTS = [1, 2, 3] as const;
export const FORMATO_EXPORTACAO = 'dungeons-arena/save';

/**
 * De onde vem a fase: conteúdo oficial, aventura criada no editor (6C) ou fase gerada (10A-2), que
 * guarda só os parâmetros e é gerada de novo ao abrir (D-053).
 */
export type RefFase =
  | { tipo: 'oficial'; id: string }
  /** Marco 11A (D-066): `indice` é a fase da aventura (ausente = a primeira, como antes do 11A). */
  | { tipo: 'aventura'; id: string; indice?: number }
  | { tipo: 'gerada'; id: string; numero: number; params: ParametrosGeracao };

export interface Estatisticas {
  inimigosDerrotados: number;
  mortes: number;
}

export interface RegistroProgresso {
  versaoSchema: number;
  slot: number;
  criadoEm: number;
  atualizadoEm: number;
  faseRef: RefFase;
  nomeFase: string;
  estado: EstadoJogo;
  estatisticas: Estatisticas;
  /**
   * Marco 10A-1: estado das outras fases já visitadas (inimigos, objetos consumidos, respawns),
   * sem o jogador, pela chave de `chaveDaFase` (§3.5). A fase atual fica em `estado`.
   */
  fasesVisitadas: Record<string, EstadoJogo>;
  /** Marco 17 (D-063): o último certificado do servidor para o personagem deste slot (pode estar desatualizado). */
  certificado: Certificado | null;
}

/** Chave estável de uma fase no save (`oficial:fase-01`, `aventura:<id>`). */
export function chaveDaFase(ref: RefFase): string {
  // A primeira fase da aventura mantém a chave de antes do 11A (`aventura:<id>`).
  return ref.tipo === 'aventura' && ref.indice ? `aventura:${ref.id}#${ref.indice}` : `${ref.tipo}:${ref.id}`;
}

export interface ResumoSlot {
  slot: number;
  nivel: number;
  nomeFase: string;
  atualizadoEm: number;
  /** Marco 15: a dificuldade em que o slot foi jogado por último. */
  dificuldade: Dificuldade;
}

/** O jogador do save: a entidade com bolsa (a campanha tem um só). */
export function jogadorDoSave(estado: EstadoJogo): Entidade | undefined {
  return estado.entidades.find((e) => e.bolsa !== null);
}

export function resumoDoRegistro(r: RegistroProgresso): ResumoSlot {
  return { slot: r.slot, nivel: jogadorDoSave(r.estado)?.nivel ?? 1, nomeFase: r.nomeFase, atualizadoEm: r.atualizadoEm, dificuldade: r.estado.dificuldade };
}

export type ErroSave = 'formato' | 'versao_futura' | 'slot' | 'fase' | 'estado' | 'nao_finito';

export type LeituraSave = { ok: true; registro: RegistroProgresso } | { ok: false; erro: ErroSave };

/** Cada função leva um registro da versão `i` para a `i + 1`. Vazio enquanto só existe a v1. */
export type Migracao = (r: Objeto) => Objeto;

const lista = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const comCampos = (v: unknown, campos: Objeto): unknown => (ehObjeto(v) ? { ...campos, ...v } : v);

/**
 * v1 → v2 (marco 8A, 14/10/2026): efeitos ganharam magnitude e relógio de periódico; projéteis,
 * multiplicador de dano e perfuração; objetos, o efeito do orbe. Campos novos com valor neutro.
 */
function v1ParaV2(r: Objeto): Objeto {
  const e = r.estado;
  if (!ehObjeto(e)) return r;
  const entidades = lista(e.entidades).map((x) =>
    ehObjeto(x) ? { ...x, efeitos: lista(x.efeitos).map((f) => comCampos(f, { valor: 0, pct: 0, proximoTick: 0 })) } : x,
  );
  const projeteis = lista(e.projeteis).map((p) => comCampos(p, { multDano: 1, atravessa: false, atingidos: [] }));
  const objetos = lista(e.objetos).map((o) => comCampos(o, { efeito: null }));
  return { ...r, estado: { ...e, entidades, projeteis, objetos } };
}

/**
 * v2 → v3 (marco 8A-2, 14/10/2026): efeitos carregam `interno` e `ref`; entidades, `invocacao`;
 * o estado ganha rastros, armadilhas e efeitos atrasados.
 */
function v2ParaV3(r: Objeto): Objeto {
  const e = r.estado;
  if (!ehObjeto(e)) return r;
  const entidades = lista(e.entidades).map((x) =>
    ehObjeto(x)
      ? { invocacao: null, ...x, efeitos: lista(x.efeitos).map((f) => comCampos(f, { interno: null, ref: null })) }
      : x,
  );
  const objetos = lista(e.objetos).map((o) =>
    ehObjeto(o) && ehObjeto(o.efeito) ? { ...o, efeito: comCampos(o.efeito, { interno: null, ref: null }) } : o,
  );
  return { ...r, estado: { rastros: [], armadilhas: [], atrasados: [], ...e, entidades, objetos } };
}

/**
 * v3 → v4 (marco 9A, 14/10/2026): a bolsa ganha ouro; a entidade, a interação com baú ou loja; os
 * objetos, os campos de baú e loja. Campos novos com valor neutro.
 */
function v3ParaV4(r: Objeto): Objeto {
  const e = r.estado;
  if (!ehObjeto(e)) return r;
  const entidades = lista(e.entidades).map((x) =>
    ehObjeto(x) ? { interacao: null, ...x, bolsa: ehObjeto(x.bolsa) ? { ouro: 0, ...x.bolsa } : x.bolsa } : x,
  );
  const objetos = lista(e.objetos).map((o) => comCampos(o, { itens: [], ouro: 0, chave: null, abertoTick: 0, abridorId: null }));
  return { ...r, estado: { ...e, entidades, objetos } };
}

/**
 * v4 → v5 (marco 9A-2, 14/10/2026): armadilhas ganham origem, permanência e rearme (as gravadas
 * antes só podiam ser de habilidade). Campos novos com valor neutro.
 */
function v4ParaV5(r: Objeto): Objeto {
  const e = r.estado;
  if (!ehObjeto(e)) return r;
  const armadilhas = lista(e.armadilhas).map((a) => comCampos(a, { origem: 'habilidade', permanente: false, rearmeTicks: 0, inerteAteTick: 0 }));
  return { ...r, estado: { ...e, armadilhas } };
}

/**
 * v5 → v6 (marco 10A-1, 14/10/2026): o estado ganha `saidaAberta`; o registro, as fases visitadas.
 */
function v5ParaV6(r: Objeto): Objeto {
  const e = r.estado;
  return { fasesVisitadas: {}, ...r, estado: ehObjeto(e) ? { saidaAberta: false, ...e } : e };
}

/**
 * v6 → v7 (marco 10A-2, 14/10/2026): a referência de fase ganhou a forma `gerada` e a interação, o
 * descanso. Nada a converter: registros antigos já são válidos na forma nova.
 */
const v6ParaV7: Migracao = (r) => r;

/**
 * v7 → v8 (marco 10A-3, 14/10/2026): a invocação ganhou comportamento, avatar, golpes, rampa e nível
 * de dominação. Campos novos com valor neutro (dominados ficam no nível 1).
 */
function v7ParaV8(r: Objeto): Objeto {
  const e = r.estado;
  if (!ehObjeto(e)) return r;
  const completar = (x: unknown): unknown => {
    if (!ehObjeto(x) || !ehObjeto(x.invocacao)) return x;
    const neutros = { comportamento: 'agressivo', avatar: false, golpesRestantes: 0, abates: 0, criadoTick: 0, nivelDominacao: x.invocacao.dominado === true ? 1 : 0 };
    return { ...x, invocacao: { ...neutros, ...x.invocacao } };
  };
  const visitadas = ehObjeto(r.fasesVisitadas)
    ? Object.fromEntries(
        Object.entries(r.fasesVisitadas).map(([k, v]) => [k, ehObjeto(v) ? { ...v, entidades: lista(v.entidades).map(completar) } : v]),
      )
    : r.fasesVisitadas;
  return { ...r, fasesVisitadas: visitadas, estado: { ...e, entidades: lista(e.entidades).map(completar) } };
}

/**
 * v8 → v9 (marco 14, 14/10/2026), D-059: o personagem ganha classe, habilidades conhecidas (as atuais, no rank 1),
 * a barra (as 4 primeiras) e os pontos de habilidade dos níveis já ganhos; a ação e o projétil, a chave
 * compilada; os efeitos, início e acúmulos; mochila, equipamento e objetos, o `ref` do livro raro; os
 * respawns, as habilidades extras. Vale para a fase atual e para as visitadas.
 */
function v8ParaV9(r: Objeto): Objeto {
  const entidade = (x: unknown): unknown => {
    if (!ehObjeto(x)) return x;
    const efeitos = lista(x.efeitos).map((f) => comCampos(f, { inicioTick: 0, acumulos: 1 }));
    const acao = ehObjeto(x.acao) ? { chave: x.acao.habilidadeId, ...x.acao } : x.acao;
    const b = x.bolsa;
    if (!ehObjeto(b)) return { ...x, efeitos, acao };
    const habilidades = lista(x.habilidades).filter((h): h is string => typeof h === 'string');
    const nivel = typeof x.nivel === 'number' && Number.isInteger(x.nivel) ? x.nivel : 1;
    const comRef = (i: unknown) => comCampos(i, { ref: null });
    const equipamento = ehObjeto(b.equipamento) ? Object.fromEntries(Object.entries(b.equipamento).map(([k, v]) => [k, v === null ? null : comRef(v)])) : b.equipamento;
    const bolsa = {
      classeId: 'aventureiro',
      conhecidas: habilidades.map((id) => ({ id, rank: 1, caminhos: [] })),
      barra: Array.from({ length: 4 }, (_, i) => habilidades[i] ?? null),
      pontosHabilidade: Math.max(0, nivel - 1),
      ...b,
      mochila: lista(b.mochila).map(comRef),
      equipamento,
    };
    return { ...x, efeitos, acao, bolsa };
  };
  const estado = (e: unknown): unknown => {
    if (!ehObjeto(e)) return e;
    return {
      ...e,
      entidades: lista(e.entidades).map(entidade),
      projeteis: lista(e.projeteis).map((p) => (ehObjeto(p) ? { chave: p.habilidadeId, multCura: 1, ...p } : p)),
      objetos: lista(e.objetos).map((o) => comCampos(o, { ref: null })),
      respawns: lista(e.respawns).map((x) => comCampos(x, { habilidades: [] })),
    };
  };
  const visitadas = ehObjeto(r.fasesVisitadas) ? Object.fromEntries(Object.entries(r.fasesVisitadas).map(([k, v]) => [k, estado(v)])) : r.fasesVisitadas;
  return { ...r, fasesVisitadas: visitadas, estado: estado(r.estado) };
}

/**
 * v9 → v10 (ajuste de 15/10/2026, D-060): a IA ganha `foraDaZonaTicks` (o tempo fora da zona durante o "?"), na
 * fase atual e nas visitadas. Valor neutro: 0.
 */
function v9ParaV10(r: Objeto): Objeto {
  const estado = (e: unknown): unknown =>
    ehObjeto(e)
      ? { ...e, entidades: lista(e.entidades).map((x) => (ehObjeto(x) && ehObjeto(x.ia) ? { ...x, ia: { foraDaZonaTicks: 0, ...x.ia } } : x)) }
      : e;
  const visitadas = ehObjeto(r.fasesVisitadas) ? Object.fromEntries(Object.entries(r.fasesVisitadas).map(([k, v]) => [k, estado(v)])) : r.fasesVisitadas;
  return { ...r, fasesVisitadas: visitadas, estado: estado(r.estado) };
}

/** v10 → v11 (marco 15, 15/10/2026, D-061): a dificuldade do mundo, Normal, na fase atual e nas visitadas. */
function v10ParaV11(r: Objeto): Objeto {
  const estado = (e: unknown): unknown => (ehObjeto(e) ? { dificuldade: 'normal', ...e } : e);
  const visitadas = ehObjeto(r.fasesVisitadas) ? Object.fromEntries(Object.entries(r.fasesVisitadas).map(([k, v]) => [k, estado(v)])) : r.fasesVisitadas;
  return { ...r, fasesVisitadas: visitadas, estado: estado(r.estado) };
}

/**
 * v11 → v12 (marco 17, 15/10/2026, D-063): a bolsa ganha `personagemId` (vazio; o jogo dá um ao abrir) e o registro,
 * o certificado do servidor (nulo até a primeira certificação).
 */
function v11ParaV12(r: Objeto): Objeto {
  const estado = (e: unknown): unknown =>
    ehObjeto(e)
      ? { ...e, entidades: lista(e.entidades).map((x) => (ehObjeto(x) && ehObjeto(x.bolsa) ? { ...x, bolsa: { personagemId: '', ...x.bolsa } } : x)) }
      : e;
  return { certificado: null, ...r, estado: estado(r.estado) };
}

/** `MIGRACOES[v]` leva um registro da versão `v` para a `v + 1`. Não existiu versão 0. */
export const MIGRACOES: Readonly<Record<number, Migracao>> = {
  1: v1ParaV2,
  2: v2ParaV3,
  3: v3ParaV4,
  4: v4ParaV5,
  5: v5ParaV6,
  6: v6ParaV7,
  7: v7ParaV8,
  8: v8ParaV9,
  9: v9ParaV10,
  10: v10ParaV11,
  11: v11ParaV12,
};

function temNaoFinito(v: unknown): boolean {
  if (typeof v === 'number') return !Number.isFinite(v);
  if (Array.isArray(v)) return v.some(temNaoFinito);
  if (ehObjeto(v)) return Object.values(v).some(temNaoFinito);
  return false;
}

function lerParametros(v: unknown): ParametrosGeracao | null {
  if (!ehObjeto(v)) return null;
  const inteiro = (x: unknown, min: number, max: number): x is number => typeof x === 'number' && Number.isInteger(x) && x >= min && x <= max;
  if (typeof v.id !== 'string' || typeof v.nome !== 'string') return null;
  if (!inteiro(v.semente, 0, 2 ** 32) || !inteiro(v.salas, 1, 50) || !inteiro(v.nivelInimigos, 1, 20) || !inteiro(v.matizGraus, 0, 359)) return null;
  const p: ParametrosGeracao = { id: v.id, nome: v.nome, semente: v.semente, salas: v.salas, nivelInimigos: v.nivelInimigos, matizGraus: v.matizGraus };
  if (v.largura !== undefined || v.altura !== undefined) {
    if (!inteiro(v.largura, 8, 120) || !inteiro(v.altura, 8, 120)) return null;
    p.largura = v.largura;
    p.altura = v.altura;
  }
  // Marco 11A (D-066): as regras de estilo que geraram a fase (até 64, na forma compacta).
  if (v.estilo !== undefined) {
    if (!Array.isArray(v.estilo) || v.estilo.length > MAX_REGRAS || !v.estilo.every((r): r is string => typeof r === 'string' && RE_REGRA_ESTILO.test(r))) return null;
    p.estilo = [...v.estilo];
  }
  return p;
}

/** Marco 15: exportada para a sala cooperativa ler a fase pedida pelo anfitrião (não confiável). */
export function lerRefFase(v: unknown): RefFase | null {
  if (!ehObjeto(v) || typeof v.id !== 'string' || v.id === '') return null;
  if (v.tipo === 'oficial') return { tipo: v.tipo, id: v.id };
  if (v.tipo === 'aventura') {
    if (v.indice === undefined || v.indice === 0) return { tipo: 'aventura', id: v.id };
    return typeof v.indice === 'number' && Number.isInteger(v.indice) && v.indice > 0 && v.indice < 12 ? { tipo: 'aventura', id: v.id, indice: v.indice } : null;
  }
  if (v.tipo === 'gerada' && typeof v.numero === 'number' && Number.isInteger(v.numero) && v.numero >= 1) {
    const params = lerParametros(v.params);
    return params ? { tipo: 'gerada', id: v.id, numero: v.numero, params } : null;
  }
  return null;
}

/**
 * Lê um registro vindo do banco ou de um arquivo importado: migra até a versão atual e confere a
 * forma antes de qualquer gravação (§3.5). `alvo` e `migracoes` são parâmetros para o teste.
 */
export function lerRegistro(bruto: unknown, migracoes: Readonly<Record<number, Migracao>> = MIGRACOES, alvo = VERSAO_SCHEMA): LeituraSave {
  if (!ehObjeto(bruto) || typeof bruto.versaoSchema !== 'number' || !Number.isInteger(bruto.versaoSchema)) {
    return { ok: false, erro: 'formato' };
  }
  if (bruto.versaoSchema > alvo) return { ok: false, erro: 'versao_futura' };
  let r: Objeto = bruto;
  for (let v = bruto.versaoSchema; v < alvo; v++) {
    const migrar = migracoes[v];
    if (!migrar) return { ok: false, erro: 'formato' };
    r = { ...migrar(r), versaoSchema: v + 1 };
  }
  if (typeof r.slot !== 'number' || !(SLOTS as readonly number[]).includes(r.slot)) return { ok: false, erro: 'slot' };
  const faseRef = lerRefFase(r.faseRef);
  if (!faseRef) return { ok: false, erro: 'fase' };
  const e = r.estado;
  const forma = (x: unknown): x is Objeto =>
    ehObjeto(x) &&
    x.versao === 1 &&
    typeof x.faseId === 'string' &&
    typeof x.tick === 'number' &&
    ehObjeto(x.rng) &&
    Array.isArray(x.entidades) &&
    ehObjeto(x.recargas) &&
    Array.isArray(x.projeteis) &&
    Array.isArray(x.objetos) &&
    Array.isArray(x.respawns) &&
    typeof x.proximoId === 'number';
  const visitadas = ehObjeto(r.fasesVisitadas) ? r.fasesVisitadas : null;
  if (!visitadas || !Object.values(visitadas).every(forma)) return { ok: false, erro: 'estado' };
  const estadoOk = forma(e) && (e.entidades as unknown[]).some((x) => ehObjeto(x) && ehObjeto(x.bolsa));
  if (!estadoOk) return { ok: false, erro: 'estado' };
  if (temNaoFinito(r)) return { ok: false, erro: 'nao_finito' };
  const est = ehObjeto(r.estatisticas) ? r.estatisticas : {};
  return {
    ok: true,
    registro: {
      versaoSchema: alvo,
      slot: r.slot,
      criadoEm: typeof r.criadoEm === 'number' ? r.criadoEm : 0,
      atualizadoEm: typeof r.atualizadoEm === 'number' ? r.atualizadoEm : 0,
      faseRef,
      nomeFase: typeof r.nomeFase === 'string' ? r.nomeFase : faseRef.id,
      // A forma foi conferida acima; o conteúdo do estado é dado do próprio jogo (§3.5).
      estado: e as unknown as EstadoJogo,
      estatisticas: {
        inimigosDerrotados: typeof est.inimigosDerrotados === 'number' ? est.inimigosDerrotados : 0,
        mortes: typeof est.mortes === 'number' ? est.mortes : 0,
      },
      // A forma de cada estado foi conferida acima (`forma`).
      fasesVisitadas: visitadas as unknown as Record<string, EstadoJogo>,
      certificado: lerCertificado(r.certificado),
    },
  };
}

/** Arquivo `.json` para exportar (§3.5): formato identificado e versionado. */
export function exportarRegistro(r: RegistroProgresso): string {
  return JSON.stringify({ formato: FORMATO_EXPORTACAO, registro: r });
}

/** Lê um arquivo exportado; o slot de destino é escolhido por quem importa. */
export function importarRegistro(texto: string, slot: number): LeituraSave {
  let bruto: unknown;
  try {
    bruto = JSON.parse(texto);
  } catch {
    return { ok: false, erro: 'formato' };
  }
  if (!ehObjeto(bruto) || bruto.formato !== FORMATO_EXPORTACAO || !ehObjeto(bruto.registro)) return { ok: false, erro: 'formato' };
  return lerRegistro({ ...bruto.registro, slot });
}
