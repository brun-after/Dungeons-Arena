// As invocações que viajam com o dono entre as salas do Mundo (09/11/2026, D-144). Antes, os mortos do Necromante (e
// as criaturas de pergaminho) ficavam na sala antiga quando o dono trocava de região, entrava numa dungeon ou usava a
// pedra de retorno. A sala guarda de cada uma só o que ela é (preset, vida, atributos, aparência e os dados da
// invocação, com o prazo como o tempo que falta); a sala de chegada a cria de novo ao lado do dono, com id próprio.
// O falcão do Aventureiro (companheiro) não entra: nasce com o dono em toda sala, com a vida dele (que agora viaja).
// Marco 41 (14/11/2026, D-169): a isca (avatar) também viaja, com os golpes que ainda aguenta; os prazos de dentro
// da invocação (a névoa, a descarga) e os efeitos nela seguem contando, com a viagem descontada; o servo do Posto dos
// Mortos deixa o posto (que fica para trás) e segue o dono como servo comum, que é a regra dele quando o posto acaba.
// Puro.

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { celulaDeEntrada } from '../coop/sala-campanha';
import type { EntidadeId } from '../core/comandos';
import { posicionar, vivo, type AparenciaEquipada, type Atributos, type DadosInvocacao, type EfeitoAtivo, type Entidade } from '../entities/entidade';
import { ORIGEM_DE_FORA } from './bagagem';
import { criarInimigo } from '../entities/fabrica';

export interface InvocacaoQueViaja {
  /** O id na sala de antes (os efeitos que ela pôs no dono seguem apontando para ela). */
  idAntes?: EntidadeId;
  tipo?: Entidade['tipo'];
  preset: string;
  nome: string;
  nivel: number;
  atributos: Atributos;
  hp: number;
  hpMax: number;
  aparencia: AparenciaEquipada | null;
  /** Os dados da invocação; `expiraTick` e `criadoTick` são refeitos na chegada. */
  invocacao: DadosInvocacao;
  /** Ticks que faltavam até expirar (null: sem prazo, como o servo da passiva). */
  restanteTicks: number | null;
  /** Os efeitos nela, com os ticks relativos à saída (mundo/bagagem.ts). */
  efeitos?: EfeitoAtivo[];
}

/** As invocações de `donoId` que viajam com ele. */
function daComitiva(e: Entidade, donoId: EntidadeId): boolean {
  const inv = e.invocacao;
  return vivo(e) && !!inv && inv.donoId === donoId && !inv.companheiro && !inv.exercitoBoss;
}

/** Os prazos de dentro da invocação, deslocados (`ida`: para relativos à saída; senão, de volta a absolutos). */
function prazosDaInvocacao(inv: DadosInvocacao, base: number, ida: boolean): DadosInvocacao {
  const t = (x: number) => (ida ? x - base : x + base);
  const resto: DadosInvocacao = { ...inv };
  delete resto.posto;
  return {
    ...resto,
    ...(inv.nevoaAteTick !== undefined && { nevoaAteTick: t(inv.nevoaAteTick) }),
    ...(inv.descarga && { descarga: { ...inv.descarga, ateTick: t(inv.descarga.ateTick) } }),
  };
}

/** O retrato das invocações do dono, na hora em que ele sai da sala. */
export function recolherComitiva(estado: EstadoJogo, donoId: EntidadeId): InvocacaoQueViaja[] {
  const ids = new Set(estado.entidades.filter((e) => daComitiva(e, donoId)).map((e) => e.id));
  const origem = (id: EntidadeId) => (id === donoId || ids.has(id) ? id : ORIGEM_DE_FORA);
  return estado.entidades.filter((e) => daComitiva(e, donoId)).map((e) => {
    const inv = e.invocacao as DadosInvocacao;
    const semPrazo = inv.expiraTick >= Number.MAX_SAFE_INTEGER;
    return {
      idAntes: e.id,
      tipo: e.tipo,
      preset: e.preset,
      nome: e.nome,
      nivel: e.nivel,
      atributos: { ...e.atributos },
      hp: e.hp,
      hpMax: e.hpMax,
      aparencia: e.aparencia ? { ...e.aparencia } : null,
      invocacao: prazosDaInvocacao(inv, estado.tick, true),
      restanteTicks: semPrazo ? null : Math.max(1, inv.expiraTick - estado.tick),
      efeitos: e.efeitos.filter((f) => f.ateTick > estado.tick && f.tipo !== 'tregua').map((f) => ({
        ...f,
        ...(f.interno && { interno: { ...f.interno } }),
        ateTick: f.ateTick - estado.tick,
        proximoTick: f.proximoTick > 0 ? Math.max(1, f.proximoTick - estado.tick) : 0,
        inicioTick: f.inicioTick - estado.tick,
        origemId: origem(f.origemId),
      })),
    };
  });
}

/** O dono saiu da sala: as invocações dele saem junto (já seguiram no retrato). */
export function retirarComitiva(estado: EstadoJogo, donoId: EntidadeId): void {
  estado.entidades = estado.entidades.filter((e) => !daComitiva(e, donoId));
}

/**
 * Na sala de chegada: cria de novo cada invocação ao lado do dono. `decorridoTicks` é o tempo da viagem (os prazos
 * seguem correndo; a que venceu no caminho não chega). Devolve o id novo de cada uma pelo id de antes.
 */
export function soltarComitiva(estado: EstadoJogo, ctx: ContextoSimulacao, dono: Entidade, comitiva: readonly InvocacaoQueViaja[], saida: EventoSimulacao[], decorridoTicks = 0): Map<EntidadeId, EntidadeId> {
  const novos = new Map<EntidadeId, EntidadeId>();
  const base = estado.tick - Math.max(0, Math.floor(decorridoTicks));
  const vivas: { v: InvocacaoQueViaja; e: Entidade }[] = [];
  for (const v of comitiva) {
    const preset = ctx.conteudo.presets.get(v.preset);
    if (!preset) continue;
    if (v.restanteTicks !== null && base + v.restanteTicks <= estado.tick) continue;
    const e = criarInimigo(preset, `v${estado.proximoId++}`, dono.x, dono.y, ctx.balance);
    e.tipo = v.tipo ?? 'invocacao';
    e.equipe = dono.equipe;
    e.xpBase = 0;
    e.nome = v.nome;
    e.nivel = v.nivel;
    e.atributos = { ...v.atributos };
    e.hpMax = v.hpMax;
    e.hp = Math.min(v.hp, v.hpMax);
    e.aparencia = v.aparencia ? { ...v.aparencia } : null;
    e.invocacao = {
      ...prazosDaInvocacao(v.invocacao, base, false),
      donoId: dono.id,
      criadoTick: estado.tick,
      expiraTick: v.restanteTicks === null ? Number.MAX_SAFE_INTEGER : base + v.restanteTicks,
    };
    const lugar = celulaDeEntrada(estado, ctx, e, { x: dono.x, y: dono.y });
    posicionar(e, lugar.x, lugar.y);
    e.origemX = lugar.x;
    e.origemY = lugar.y;
    estado.entidades.push(e);
    if (v.idAntes) novos.set(v.idAntes, e.id);
    vivas.push({ v, e });
    saida.push({ t: 'invocou', tick: estado.tick, donoId: dono.id, id: e.id });
  }
  // Os efeitos depois de todas nascerem: a origem de um pode ser outra da comitiva.
  const traduzir = (id: EntidadeId) => (id === ORIGEM_DE_FORA ? id : (novos.get(id) ?? dono.id));
  for (const { v, e } of vivas) {
    e.efeitos = (v.efeitos ?? []).map((f) => ({
      ...f,
      ...(f.interno && { interno: { ...f.interno } }),
      ateTick: f.ateTick + base,
      proximoTick: f.proximoTick > 0 ? f.proximoTick + base : 0,
      inicioTick: f.inicioTick + base,
      origemId: traduzir(f.origemId),
    })).filter((f) => f.ateTick > estado.tick);
  }
  return novos;
}
