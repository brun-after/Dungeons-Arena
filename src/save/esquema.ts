// Save da campanha (§3.5). Marco 6B (13/10/2026). Puro: sem IndexedDB, sem DOM (tsconfig.nucleo).
// Um registro por slot guarda o `EstadoJogo` inteiro da campanha (D-041): ficha, mochila, fase,
// posição, inimigos e respawns, PRNG e recargas. Gravar e ler é tarefa de `plataforma/saves.ts`.

import type { EstadoJogo } from '../core/estado';
import { ehObjeto, type Objeto } from '../core/validar';
import type { Entidade } from '../entities/entidade';

export const VERSAO_SCHEMA = 6;
export const SLOTS = [1, 2, 3] as const;
export const FORMATO_EXPORTACAO = 'dungeons-arena/save';

/** De onde vem a fase: conteúdo oficial ou aventura criada no editor (6C). */
export type RefFase = { tipo: 'oficial'; id: string } | { tipo: 'aventura'; id: string };

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
}

/** Chave estável de uma fase no save (`oficial:fase-01`, `aventura:<id>`). */
export function chaveDaFase(ref: RefFase): string {
  return `${ref.tipo}:${ref.id}`;
}

export interface ResumoSlot {
  slot: number;
  nivel: number;
  nomeFase: string;
  atualizadoEm: number;
}

/** O jogador do save: a entidade com bolsa (a campanha tem um só). */
export function jogadorDoSave(estado: EstadoJogo): Entidade | undefined {
  return estado.entidades.find((e) => e.bolsa !== null);
}

export function resumoDoRegistro(r: RegistroProgresso): ResumoSlot {
  return { slot: r.slot, nivel: jogadorDoSave(r.estado)?.nivel ?? 1, nomeFase: r.nomeFase, atualizadoEm: r.atualizadoEm };
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

/** `MIGRACOES[v]` leva um registro da versão `v` para a `v + 1`. Não existiu versão 0. */
export const MIGRACOES: Readonly<Record<number, Migracao>> = { 1: v1ParaV2, 2: v2ParaV3, 3: v3ParaV4, 4: v4ParaV5, 5: v5ParaV6 };

function temNaoFinito(v: unknown): boolean {
  if (typeof v === 'number') return !Number.isFinite(v);
  if (Array.isArray(v)) return v.some(temNaoFinito);
  if (ehObjeto(v)) return Object.values(v).some(temNaoFinito);
  return false;
}

function lerRefFase(v: unknown): RefFase | null {
  if (!ehObjeto(v) || typeof v.id !== 'string' || v.id === '') return null;
  if (v.tipo === 'oficial' || v.tipo === 'aventura') return { tipo: v.tipo, id: v.id };
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
