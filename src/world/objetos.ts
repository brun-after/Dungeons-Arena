// Objetos coletáveis (§2.1): orbes de HP e de recurso, posicionados pela fase ou largados por
// inimigos, e itens (marco 6) largados por inimigos. A coleta acontece na etapa 7 do tick (gatilhos por célula alcançada) como uma
// transação: o primeiro coletor válido, na ordem rotativa do tick, consome o objeto, que sai do
// mundo no mesmo tick. Dez jogadores na mesma célula no mesmo tick resultam em uma coleta (§3.6).

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo, ObjetoNoMundo, TipoObjeto } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { vivo, type Entidade } from '../entities/entidade';
import { guardarItem } from '../progression/inventario';
import { ordemRotativa } from './colisao';

/** Quanto o orbe daria a esta entidade agora (0 = não serve, não coleta). */
export function ganhoDoObjeto(o: ObjetoNoMundo, e: Entidade): number {
  const [atual, maximo] = o.tipo === 'orbe_hp' ? [e.hp, e.hpMax] : [e.mana, e.manaMax];
  const bruto = o.modo === 'pct' ? Math.round((maximo * o.valor) / 100) : o.valor;
  return Math.max(0, Math.min(maximo - atual, bruto));
}

/** Quem coleta: entidades controladas por jogadores (local ou remoto), nunca a IA. */
function coletor(e: Entidade): boolean {
  return e.controlador !== 'ia' && vivo(e);
}

export function coletarObjetos(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  if (estado.objetos.length === 0 || !ctx.modo.objetosDeFase) return;
  const consumidos = new Set<string>();
  for (const e of ordemRotativa(estado.entidades, estado.tick)) {
    if (!coletor(e)) continue;
    const o = estado.objetos.find((x) => x.x === e.x && x.y === e.y && !consumidos.has(x.objetoId));
    if (!o) continue;
    // Transação: verificar → consumir → transferir → registrar, tudo neste tick.
    if (o.tipo === 'item') {
      // Item: só quem tem mochila com espaço; senão fica no chão (§2.10).
      const item = o.itemId ? ctx.conteudo.itens.get(o.itemId) : undefined;
      if (!item || !e.bolsa || !guardarItem(e.bolsa, item, 1, ctx.balance.inventario)) continue;
      consumidos.add(o.objetoId);
      saida.push({ t: 'coletou', tick: estado.tick, id: e.id, objetoId: o.objetoId, tipo: o.tipo, ganho: 1, itemId: item.id });
      continue;
    }
    const ganho = ganhoDoObjeto(o, e);
    if (ganho <= 0) continue;
    consumidos.add(o.objetoId);
    if (o.tipo === 'orbe_hp') e.hp += ganho;
    else e.mana += ganho;
    saida.push({ t: 'coletou', tick: estado.tick, id: e.id, objetoId: o.objetoId, tipo: o.tipo, ganho, itemId: null });
  }
  if (consumidos.size > 0) estado.objetos = estado.objetos.filter((o) => !consumidos.has(o.objetoId));
}

/** Coloca um orbe no mundo, se a célula estiver livre de outro objeto. */
export function largarObjeto(
  estado: EstadoJogo,
  tipo: Exclude<TipoObjeto, 'item'>,
  x: number,
  y: number,
  valor: number,
  modo: 'abs' | 'pct',
  saida: EventoSimulacao[],
  objetoId = `d:${estado.proximoId++}`,
): boolean {
  if (estado.objetos.some((o) => o.x === x && o.y === y)) return false;
  estado.objetos.push({ objetoId, tipo, x, y, valor, modo, geracao: 0, itemId: null });
  saida.push({ t: 'objetoSurgiu', tick: estado.tick, objetoId, tipo, x, y });
  return true;
}

/** Coloca um item no mundo, se a célula estiver livre de outro objeto. */
export function largarItem(estado: EstadoJogo, itemId: string, x: number, y: number, saida: EventoSimulacao[]): boolean {
  if (estado.objetos.some((o) => o.x === x && o.y === y)) return false;
  const objetoId = `d:${estado.proximoId++}`;
  estado.objetos.push({ objetoId, tipo: 'item', x, y, valor: 1, modo: 'abs', geracao: 0, itemId });
  saida.push({ t: 'objetoSurgiu', tick: estado.tick, objetoId, tipo: 'item', x, y });
  return true;
}
