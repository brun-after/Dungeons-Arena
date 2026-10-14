// Objetos coletáveis (§2.1): orbes de HP, de recurso e de efeito (marco 8A), posicionados pela fase
// ou largados por inimigos, e itens (marco 6) largados por inimigos. A coleta acontece na etapa 7 do tick (gatilhos por célula alcançada) como uma
// transação: o primeiro coletor válido, na ordem rotativa do tick, consome o objeto, que sai do
// mundo no mesmo tick. Dez jogadores na mesma célula no mesmo tick resultam em uma coleta (§3.6).
// Marco 9A (14/10/2026): ouro (vai para a bolsa), loot com quantidade e os interagíveis (baú e loja),
// que não são coletados ao pisar: abrem pelo comando `interagir` (world/interacao.ts).

import { aplicarEfeito } from '../combat/efeitos';
import type { EfeitoCanonico } from '../combat/registro-efeitos';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo, ObjetoNoMundo, TipoObjeto } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { vivo, type Entidade } from '../entities/entidade';
import { guardarItem } from '../progression/inventario';
import { ordemRotativa } from './colisao';
import { passavel } from './fase';

/** Quanto o orbe daria a esta entidade agora (0 = não serve, não coleta). */
export function ganhoDoObjeto(o: ObjetoNoMundo, e: Entidade): number {
  const [atual, maximo] = o.tipo === 'orbe_hp' ? [e.hp, e.hpMax] : [e.mana, e.manaMax];
  const bruto = o.modo === 'pct' ? Math.round((maximo * o.valor) / 100) : o.valor;
  return Math.max(0, Math.min(maximo - atual, bruto));
}

/** Objeto com os campos de todos os tipos em valor neutro; `campos` preenche os do tipo. */
export function novoObjeto(objetoId: string, tipo: TipoObjeto, x: number, y: number, campos: Partial<ObjetoNoMundo> = {}): ObjetoNoMundo {
  return {
    objetoId,
    tipo,
    x,
    y,
    valor: 1,
    modo: 'abs',
    geracao: 0,
    itemId: null,
    efeito: null,
    itens: [],
    ouro: 0,
    chave: null,
    abertoTick: 0,
    abridorId: null,
    ...campos,
  };
}

/** Baú e loja abrem por `interagir`; o resto é coletado ao pisar. */
export function interagivel(o: ObjetoNoMundo): boolean {
  return o.tipo === 'bau' || o.tipo === 'loja';
}

/** Ninguém coleta: interagíveis e a porta temporária do boss (marco 10A-1, world/portas.ts). */
function coletavel(o: ObjetoNoMundo): boolean {
  return !interagivel(o) && o.tipo !== 'saida';
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
    const o = estado.objetos.find((x) => x.x === e.x && x.y === e.y && !consumidos.has(x.objetoId) && coletavel(x));
    if (!o) continue;
    // Transação: verificar → consumir → transferir → registrar, tudo neste tick.
    if (o.tipo === 'item') {
      // Item: só quem tem mochila com espaço para a quantidade toda; senão fica no chão (§2.10).
      const item = o.itemId ? ctx.conteudo.itens.get(o.itemId) : undefined;
      if (!item || !e.bolsa || !guardarItem(e.bolsa, item, o.valor, ctx.balance.inventario)) continue;
      consumidos.add(o.objetoId);
      saida.push({ t: 'coletou', tick: estado.tick, id: e.id, objetoId: o.objetoId, tipo: o.tipo, ganho: o.valor, itemId: item.id });
      continue;
    }
    if (o.tipo === 'ouro') {
      // Ouro (marco 9A): só quem tem bolsa (a ficha de sessão da arena não tem economia).
      if (!e.bolsa) continue;
      consumidos.add(o.objetoId);
      e.bolsa.ouro += o.valor;
      saida.push({ t: 'coletou', tick: estado.tick, id: e.id, objetoId: o.objetoId, tipo: o.tipo, ganho: o.valor, itemId: null });
      continue;
    }
    if (o.tipo === 'orbe_efeito') {
      // Orbe de efeito: sempre serve; o efeito passa pelo dispatcher único (§2.8).
      if (!o.efeito) continue;
      consumidos.add(o.objetoId);
      aplicarEfeito(estado, ctx, e, o.efeito, { id: e.id, x: e.x, y: e.y }, null, saida);
      saida.push({ t: 'coletou', tick: estado.tick, id: e.id, objetoId: o.objetoId, tipo: o.tipo, ganho: 1, itemId: null });
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

const VIZINHANCA: readonly (readonly [number, number])[] = [
  [0, 0],
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
  [1, -1],
  [1, 1],
  [-1, 1],
  [-1, -1],
];

/** A célula pode já ter um objeto: tenta ela e as vizinhas passáveis, numa ordem fixa. */
export function largarPerto(ctx: ContextoSimulacao, x0: number, y0: number, largar: (x: number, y: number) => boolean): boolean {
  for (const [dx, dy] of VIZINHANCA) {
    const x = x0 + dx;
    const y = y0 + dy;
    if (passavel(ctx.fase, x, y) && largar(x, y)) return true;
  }
  return false;
}

/** Coloca um orbe no mundo, se a célula estiver livre de outro objeto. */
export function largarObjeto(
  estado: EstadoJogo,
  tipo: 'orbe_hp' | 'orbe_recurso',
  x: number,
  y: number,
  valor: number,
  modo: 'abs' | 'pct',
  saida: EventoSimulacao[],
  objetoId = `d:${estado.proximoId++}`,
): boolean {
  if (estado.objetos.some((o) => o.x === x && o.y === y)) return false;
  estado.objetos.push(novoObjeto(objetoId, tipo, x, y, { valor, modo }));
  saida.push({ t: 'objetoSurgiu', tick: estado.tick, objetoId, tipo, x, y });
  return true;
}

/** Coloca um item (`qtd` unidades) no mundo, se a célula estiver livre de outro objeto. */
export function largarItem(
  estado: EstadoJogo,
  itemId: string,
  x: number,
  y: number,
  saida: EventoSimulacao[],
  qtd = 1,
  objetoId = `d:${estado.proximoId++}`,
): boolean {
  if (estado.objetos.some((o) => o.x === x && o.y === y)) return false;
  estado.objetos.push(novoObjeto(objetoId, 'item', x, y, { valor: qtd, itemId }));
  saida.push({ t: 'objetoSurgiu', tick: estado.tick, objetoId, tipo: 'item', x, y });
  return true;
}

/** Coloca ouro no mundo (marco 9A), se a célula estiver livre de outro objeto. */
export function largarOuro(estado: EstadoJogo, quantia: number, x: number, y: number, saida: EventoSimulacao[]): boolean {
  if (quantia <= 0 || estado.objetos.some((o) => o.x === x && o.y === y)) return false;
  const objetoId = `d:${estado.proximoId++}`;
  estado.objetos.push(novoObjeto(objetoId, 'ouro', x, y, { valor: quantia }));
  saida.push({ t: 'objetoSurgiu', tick: estado.tick, objetoId, tipo: 'ouro', x, y });
  return true;
}

/** Coloca um orbe de efeito no mundo (marco 8A), se a célula estiver livre de outro objeto. */
export function largarOrbeEfeito(
  estado: EstadoJogo,
  efeito: EfeitoCanonico,
  x: number,
  y: number,
  saida: EventoSimulacao[],
  objetoId = `d:${estado.proximoId++}`,
): boolean {
  if (estado.objetos.some((o) => o.x === x && o.y === y)) return false;
  estado.objetos.push(novoObjeto(objetoId, 'orbe_efeito', x, y, { efeito: { ...efeito } }));
  saida.push({ t: 'objetoSurgiu', tick: estado.tick, objetoId, tipo: 'orbe_efeito', x, y });
  return true;
}
