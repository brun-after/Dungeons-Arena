// As invocações que viajam com o dono entre as salas do Mundo (09/11/2026, D-144). Antes, os mortos do Necromante (e
// as criaturas de pergaminho) ficavam na sala antiga quando o dono trocava de região, entrava numa dungeon ou usava a
// pedra de retorno. A sala guarda de cada uma só o que ela é (preset, vida, atributos, aparência e os dados da
// invocação, com o prazo como o tempo que falta); a sala de chegada a cria de novo ao lado do dono, com id próprio.
// O falcão do Aventureiro (companheiro) e os avatares não entram: o falcão nasce com o dono em toda sala. Puro.

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { celulaDeEntrada } from '../coop/sala-campanha';
import type { EntidadeId } from '../core/comandos';
import { posicionar, vivo, type AparenciaEquipada, type Atributos, type DadosInvocacao, type Entidade } from '../entities/entidade';
import { criarInimigo } from '../entities/fabrica';

export interface InvocacaoQueViaja {
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
}

/** As invocações de `donoId` que viajam com ele. */
function daComitiva(e: Entidade, donoId: EntidadeId): boolean {
  const inv = e.invocacao;
  return vivo(e) && !!inv && inv.donoId === donoId && !inv.companheiro && !inv.avatar && !inv.exercitoBoss;
}

/** O retrato das invocações do dono, na hora em que ele sai da sala. */
export function recolherComitiva(estado: EstadoJogo, donoId: EntidadeId): InvocacaoQueViaja[] {
  return estado.entidades.filter((e) => daComitiva(e, donoId)).map((e) => {
    const inv = e.invocacao as DadosInvocacao;
    const semPrazo = inv.expiraTick >= Number.MAX_SAFE_INTEGER;
    return {
      preset: e.preset,
      nome: e.nome,
      nivel: e.nivel,
      atributos: { ...e.atributos },
      hp: e.hp,
      hpMax: e.hpMax,
      aparencia: e.aparencia ? { ...e.aparencia } : null,
      invocacao: { ...inv },
      restanteTicks: semPrazo ? null : Math.max(1, inv.expiraTick - estado.tick),
    };
  });
}

/** O dono saiu da sala: as invocações dele saem junto (já seguiram no retrato). */
export function retirarComitiva(estado: EstadoJogo, donoId: EntidadeId): void {
  estado.entidades = estado.entidades.filter((e) => !daComitiva(e, donoId));
}

/** Na sala de chegada: cria de novo cada invocação ao lado do dono. */
export function soltarComitiva(estado: EstadoJogo, ctx: ContextoSimulacao, dono: Entidade, comitiva: readonly InvocacaoQueViaja[], saida: EventoSimulacao[]): void {
  for (const v of comitiva) {
    const preset = ctx.conteudo.presets.get(v.preset);
    if (!preset) continue;
    const e = criarInimigo(preset, `v${estado.proximoId++}`, dono.x, dono.y, ctx.balance);
    e.tipo = 'invocacao';
    e.equipe = dono.equipe;
    e.xpBase = 0;
    e.nome = v.nome;
    e.nivel = v.nivel;
    e.atributos = { ...v.atributos };
    e.hpMax = v.hpMax;
    e.hp = Math.min(v.hp, v.hpMax);
    e.aparencia = v.aparencia ? { ...v.aparencia } : null;
    e.invocacao = {
      ...v.invocacao,
      donoId: dono.id,
      criadoTick: estado.tick,
      expiraTick: v.restanteTicks === null ? Number.MAX_SAFE_INTEGER : estado.tick + v.restanteTicks,
    };
    const lugar = celulaDeEntrada(estado, ctx, e, { x: dono.x, y: dono.y });
    posicionar(e, lugar.x, lugar.y);
    e.origemX = lugar.x;
    e.origemY = lugar.y;
    estado.entidades.push(e);
    saida.push({ t: 'invocou', tick: estado.tick, donoId: dono.id, id: e.id });
  }
}
