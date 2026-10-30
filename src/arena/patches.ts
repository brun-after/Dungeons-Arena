import type { CampoTatico } from '../combat/estado-tatico';
// Patches de estado (§3.6): depois do snapshot completo (entrada, reconexão, ressincronização), a
// sala manda só o que mudou desde a última transmissão — entidades novas, removidas e, das que
// continuam, **só os campos alterados**; as listas pequenas (objetos, projéteis, respawns,
// recargas) quando mudam. Cada patch diz de qual tick parte (`base`); o cliente que não estiver
// nesse tick pede o estado completo (D-035). Marco 8A-2: rastros e efeitos atrasados também.

import type { Solo } from '../combat/solos';
import type { Entidade } from '../entities/entidade';
import type { Atrasado, EstadoJogo, FaseAgendada, ObjetoNoMundo, Projetil, Rastro, RespawnPendente } from '../core/estado';

export interface EntidadeAlterada {
  id: string;
  campos: Partial<Entidade>;
}

export interface PatchDeEstado {
  camposTaticos?: CampoTatico[] | null;
  /** Marco 27 (29/10/2026, D-126): o solo amaldiçoado e a runa; ausente = sem mudança, null = nenhum. */
  solos?: Solo[] | null;
  /** Marco 25 (25/10/2026, D-102): as fases agendadas (o golpe do falcão em voo); ausente = sem mudança, null = nenhuma. */
  fases?: FaseAgendada[] | null;
  /** Tick do estado de onde o patch parte. */
  base: number;
  tick: number;
  proximoId: number;
  /** Marco 15: campos pequenos do estado, sempre junto (a dificuldade e a saída aberta mudam o que se vê). */
  dificuldade: EstadoJogo['dificuldade'];
  saidaAberta: boolean;
  entidades: { novas: Entidade[]; alteradas: EntidadeAlterada[]; removidas: string[] };
  objetos: ObjetoNoMundo[] | null;
  projeteis: Projetil[] | null;
  respawns: RespawnPendente[] | null;
  rastros: Rastro[] | null;
  atrasados: Atrasado[] | null;
  recargas: { alteradas: Record<string, number>; removidas: string[] } | null;
}

type Campos = Map<string, string>;

/**
 * Marco 29 (30/10/2026, D-128): o trabalho comum de uma transmissão. Com a área de interesse, cada sessão gera o seu
 * patch sobre as mesmas entidades; sem o cache, cada uma serializava e comparava tudo de novo. Os campos de cada
 * entidade saem uma vez, e a diferença também, pelo mapa anterior (as sessões que viram a mesma versão o dividem).
 */
export interface CacheDeCampos {
  campos: WeakMap<Entidade, ReadonlyMap<string, string>>;
  diferencas: WeakMap<ReadonlyMap<string, string>, Record<string, unknown> | null>;
}

export const novoCacheDeCampos = (): CacheDeCampos => ({ campos: new WeakMap(), diferencas: new WeakMap() });

function camposDe(e: Entidade): Campos {
  const campos: Campos = new Map();
  for (const [k, v] of Object.entries(e)) campos.set(k, JSON.stringify(v));
  return campos;
}

/** Os campos que mudaram (null se nenhum). */
function diferenca(e: Entidade, campos: ReadonlyMap<string, string>, anteriores: ReadonlyMap<string, string>): Record<string, unknown> | null {
  let mudados: Record<string, unknown> | null = null;
  for (const [k, texto] of campos) {
    if (anteriores.get(k) !== texto) {
      mudados ??= {};
      mudados[k] = (e as unknown as Record<string, unknown>)[k];
    }
  }
  return mudados;
}

/** Gera patches sucessivos a partir dos estados públicos transmitidos. */
export class GeradorDePatches {
  private entidades = new Map<string, ReadonlyMap<string, string>>();
  private objetos = '';
  private projeteis = '';
  private respawns = '';
  private rastros = '';
  private atrasados = '';
  private camposTaticos = '';
  private solos = '';
  private fases = '';
  private recargas: Record<string, number> = {};
  private tickAnterior = -1;

  /** Patch do estado anterior para `publico`; a primeira chamada parte do "vazio". */
  gerar(publico: EstadoJogo, cache?: CacheDeCampos): PatchDeEstado {
    const atuais = new Map<string, ReadonlyMap<string, string>>();
    const novas: Entidade[] = [];
    const alteradas: EntidadeAlterada[] = [];
    for (const e of publico.entidades) {
      let campos = cache?.campos.get(e);
      if (!campos) {
        campos = camposDe(e);
        cache?.campos.set(e, campos);
      }
      atuais.set(e.id, campos);
      const anteriores = this.entidades.get(e.id);
      if (!anteriores) {
        novas.push(e);
        continue;
      }
      let mudados = cache?.diferencas.get(anteriores);
      if (mudados === undefined) {
        mudados = diferenca(e, campos, anteriores);
        cache?.diferencas.set(anteriores, mudados);
      }
      if (mudados) alteradas.push({ id: e.id, campos: mudados });
    }
    const removidas = [...this.entidades.keys()].filter((id) => !atuais.has(id));

    const lista = <T>(valor: T[], anterior: string): [T[] | null, string] => {
      const texto = JSON.stringify(valor);
      return [texto === anterior ? null : valor, texto];
    };
    const textoCampos = JSON.stringify(publico.camposTaticos ?? null);
    const camposTaticos = textoCampos === this.camposTaticos ? undefined : publico.camposTaticos ?? null;
    const textoSolos = JSON.stringify(publico.solos ?? null);
    const solos = textoSolos === this.solos ? undefined : publico.solos ?? null;
    const textoFases = JSON.stringify(publico.fases ?? null);
    const fases = textoFases === this.fases ? undefined : publico.fases ?? null;
    const [objetos, textoObjetos] = lista(publico.objetos, this.objetos);
    const [projeteis, textoProjeteis] = lista(publico.projeteis, this.projeteis);
    const [respawns, textoRespawns] = lista(publico.respawns, this.respawns);
    const [rastros, textoRastros] = lista(publico.rastros, this.rastros);
    const [atrasados, textoAtrasados] = lista(publico.atrasados, this.atrasados);

    const recargasAlteradas: Record<string, number> = {};
    for (const [k, v] of Object.entries(publico.recargas)) if (this.recargas[k] !== v) recargasAlteradas[k] = v;
    const recargasRemovidas = Object.keys(this.recargas).filter((k) => !(k in publico.recargas));
    const recargas =
      Object.keys(recargasAlteradas).length > 0 || recargasRemovidas.length > 0 ? { alteradas: recargasAlteradas, removidas: recargasRemovidas } : null;

    const patch: PatchDeEstado = {
      ...(camposTaticos !== undefined ? { camposTaticos } : {}),
      ...(solos !== undefined ? { solos } : {}),
      ...(fases !== undefined ? { fases } : {}),
      base: this.tickAnterior,
      tick: publico.tick,
      proximoId: publico.proximoId,
      dificuldade: publico.dificuldade,
      saidaAberta: publico.saidaAberta,
      entidades: { novas, alteradas, removidas },
      objetos,
      projeteis,
      respawns,
      rastros,
      atrasados,
      recargas,
    };
    this.camposTaticos = textoCampos;
    this.solos = textoSolos;
    this.fases = textoFases;
    this.entidades = atuais;
    this.rastros = textoRastros;
    this.atrasados = textoAtrasados;
    this.objetos = textoObjetos;
    this.projeteis = textoProjeteis;
    this.respawns = textoRespawns;
    this.recargas = { ...publico.recargas };
    this.tickAnterior = publico.tick;
    return patch;
  }
}

/** Aplica o patch sobre a base (que precisa estar no tick `patch.base`) e devolve o novo estado. */
export function aplicarPatch(base: EstadoJogo, patch: PatchDeEstado): EstadoJogo {
  if (base.tick !== patch.base) throw new Error(`patch parte do tick ${patch.base}, base está no ${base.tick}`);
  const removidas = new Set(patch.entidades.removidas);
  const alteradas = new Map(patch.entidades.alteradas.map((a) => [a.id, a.campos]));
  const entidades = base.entidades
    .filter((e) => !removidas.has(e.id))
    .map((e) => {
      const campos = alteradas.get(e.id);
      return campos ? { ...e, ...campos } : e;
    });
  entidades.push(...patch.entidades.novas);

  let recargas = base.recargas;
  if (patch.recargas) {
    const removidas = new Set(patch.recargas.removidas);
    recargas = Object.fromEntries(Object.entries(base.recargas).filter(([k]) => !removidas.has(k)));
    Object.assign(recargas, patch.recargas.alteradas);
  }
  const resultado: EstadoJogo = {
    ...base,
    ...(patch.camposTaticos ? { camposTaticos: patch.camposTaticos } : {}),
    ...(patch.solos ? { solos: patch.solos } : {}),
    ...(patch.fases ? { fases: patch.fases } : {}),
    tick: patch.tick,
    proximoId: patch.proximoId,
    dificuldade: patch.dificuldade,
    saidaAberta: patch.saidaAberta,
    entidades,
    objetos: patch.objetos ?? base.objetos,
    projeteis: patch.projeteis ?? base.projeteis,
    respawns: patch.respawns ?? base.respawns,
    rastros: patch.rastros ?? base.rastros,
    atrasados: patch.atrasados ?? base.atrasados,
    recargas,
  };
  if (patch.camposTaticos === null) delete resultado.camposTaticos;
  if (patch.solos === null) delete resultado.solos;
  if (patch.fases === null) delete resultado.fases;
  return resultado;
}
