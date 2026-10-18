import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import type { Entidade } from '../entities/entidade';
import { largarItem, largarPerto } from '../world/objetos';
import { recusarItem } from './inventario';

/** Transação autoritativa: só retira da mochila depois de encontrar chão livre. */
export function soltarItem(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, invId: string, qtd: number, saida: EventoSimulacao[]): void {
  const bolsa = e.bolsa;
  if (!bolsa || !ctx.modo.objetosDeFase) { recusarItem(e, 'sem_mochila', estado.tick, saida); return; }
  if (e.interacao) { recusarItem(e, 'congelado', estado.tick, saida); return; }
  const indice = bolsa.mochila.findIndex((i) => i.invId === invId);
  const entrada = bolsa.mochila[indice];
  if (!entrada || !ctx.conteudo.itens.has(entrada.itemId) || !Number.isSafeInteger(qtd) || qtd <= 0 || qtd > entrada.qtd) {
    recusarItem(e, 'nao_encontrado', estado.tick, saida); return;
  }
  const origem = { x: e.x, y: e.y };
  const soltou = largarPerto(ctx, origem.x, origem.y, (x, y) => {
    if (estado.objetos.some((o) => o.x === x && o.y === y)) return false;
    const objetoId = `d:${estado.proximoId++}`;
    if (!largarItem(estado, entrada.itemId, x, y, saida, qtd, objetoId, entrada.ref)) return false;
    const objeto = estado.objetos.at(-1);
    if (objeto && x === origem.x && y === origem.y) objeto.aguardaSaidaDe = e.id;
    return true;
  });
  if (!soltou) { recusarItem(e, 'sem_espaco_no_chao', estado.tick, saida); return; }
  entrada.qtd -= qtd;
  if (entrada.qtd === 0) bolsa.mochila.splice(indice, 1);
}
