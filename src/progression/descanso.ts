// Descanso (§2.12). Marco 10A-2 (14/10/2026), D-053. Só onde o modo permite (campanha) e sem hostil
// perseguindo. Congela como o baú (a interação `descanso`, terminada na etapa 5 do tick):
//   curto (3 s): devolve 50% da vida e 30% da mana;
//   longo (10 s): enche tudo e zera as recargas das habilidades do jogador.
// Se um hostil passar a persegui-lo durante o descanso, ele é interrompido sem recompensa.

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao, MotivoItem } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import type { Entidade } from '../entities/entidade';
import { podeDescansar } from '../modos/regras';
import { recusarItem } from './inventario';
import { perseguido } from './recursos';

export type TipoDescanso = 'curto' | 'longo';

function tentarDescansar(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, tipo: TipoDescanso, saida: EventoSimulacao[]): MotivoItem | null {
  if (!podeDescansar(ctx.modo)) return 'sem_descanso';
  if (e.interacao) return 'congelado';
  if (perseguido(estado, e)) return 'em_perigo';
  const d = ctx.balance.descanso;
  const ateTick = estado.tick + ticksDe(tipo === 'curto' ? d.curtoMs : d.longoMs);
  e.interacao = { tipo: 'descanso', objetoId: tipo, ateTick };
  e.direcao = 'parado';
  e.caminho = [];
  e.waypoints = [];
  saida.push({ t: 'interacaoIniciada', tick: estado.tick, id: e.id, objetoId: tipo, tipo: 'descanso', ateTick });
  return null;
}

/** Comando `descansar`. */
export function descansar(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, tipo: TipoDescanso, saida: EventoSimulacao[]): void {
  const motivo = tentarDescansar(estado, ctx, e, tipo, saida);
  if (motivo) recusarItem(e, motivo, estado.tick, saida);
}

/** Etapa 5: interrompe com hostil perseguindo; no fim do prazo, aplica o descanso. */
export function processarDescanso(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, saida: EventoSimulacao[]): void {
  const i = e.interacao;
  if (i?.tipo !== 'descanso') return;
  if (perseguido(estado, e)) {
    e.interacao = null;
    saida.push({ t: 'descansoInterrompido', tick: estado.tick, id: e.id });
    return;
  }
  if (estado.tick < i.ateTick) return;
  e.interacao = null;
  const [hpAntes, manaAntes] = [e.hp, e.mana];
  const tipo: TipoDescanso = i.objetoId === 'longo' ? 'longo' : 'curto';
  if (tipo === 'longo') {
    e.hp = e.hpMax;
    e.mana = e.manaMax;
    // Recargas do jogador vencem agora (o mapa continua monotônico: só o prazo é antecipado).
    const prefixo = `${e.id}_`;
    for (const chave of Object.keys(estado.recargas)) {
      if (chave.startsWith(prefixo) && (estado.recargas[chave] ?? 0) > estado.tick) estado.recargas[chave] = estado.tick;
    }
  } else {
    const d = ctx.balance.descanso;
    e.hp = Math.min(e.hpMax, e.hp + Math.round((e.hpMax * d.curtoHpPct) / 100));
    e.mana = Math.min(e.manaMax, e.mana + Math.round((e.manaMax * d.curtoManaPct) / 100));
  }
  saida.push({ t: 'descansou', tick: estado.tick, id: e.id, tipo, hp: e.hp - hpAntes, mana: e.mana - manaAntes });
}
