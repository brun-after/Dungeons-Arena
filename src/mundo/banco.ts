// O baú do banco do Mundo (marco 30, 30/10/2026, D-129): um por personagem, aberto no banqueiro de qualquer vila e
// guardado na ficha, fora da mochila (a morte fora de dungeon leva a mochila e o equipado, nunca o banco). Os itens
// empilham como na mochila; o banco tem `mundo.banco.slots` pilhas. Puro.

import type { Balance } from '../core/contexto';
import type { Bolsa, ItemNaMochila } from '../entities/entidade';
import { empilha, guardarItem } from '../progression/inventario';
import type { Item } from '../progression/itens';
import type { MotivoDoMundo } from './avisos';
import type { FichaDoMundo } from './ficha-mundo';

type Banco = FichaDoMundo['banco'];

function proximoId(banco: Banco): string {
  let n = 0;
  for (const i of banco.itens) {
    const k = Number(i.invId.slice(1));
    if (Number.isInteger(k) && k > n) n = k;
  }
  return `b${String(n + 1)}`;
}

/** Quantas pilhas novas o item ocupa no banco (o que cabe nas pilhas que já existem não conta). */
function pilhasNovas(banco: Banco, item: Item, ref: string | null, qtd: number, pilhaMax: number): number {
  if (!empilha(item)) return qtd;
  const sobra = banco.itens.filter((i) => i.itemId === item.id && i.ref === ref).reduce((s, i) => s + (pilhaMax - i.qtd), 0);
  return Math.ceil(Math.max(0, qtd - sobra) / pilhaMax);
}

/** Guarda `qtd` da pilha `invId` da mochila no banco. */
export function guardarNoBanco(banco: Banco, bolsa: Bolsa, item: Item, invId: string, qtd: number, slots: number, pilhaMax: number): MotivoDoMundo | null {
  const i = bolsa.mochila.findIndex((m) => m.invId === invId);
  const origem = bolsa.mochila[i];
  if (!origem || origem.itemId !== item.id || origem.qtd < qtd) return 'sem_item';
  if (banco.itens.length + pilhasNovas(banco, item, origem.ref, qtd, pilhaMax) > slots) return 'banco_cheio';
  let resta = qtd;
  if (empilha(item)) {
    for (const b of banco.itens) {
      if (b.itemId !== item.id || b.ref !== origem.ref || resta === 0) continue;
      const cabe = Math.min(resta, pilhaMax - b.qtd);
      b.qtd += cabe;
      resta -= cabe;
    }
  }
  while (resta > 0) {
    const n = empilha(item) ? Math.min(resta, pilhaMax) : 1;
    banco.itens.push({ invId: proximoId(banco), itemId: item.id, qtd: n, ref: origem.ref });
    resta -= n;
  }
  origem.qtd -= qtd;
  if (origem.qtd <= 0) bolsa.mochila.splice(i, 1);
  return null;
}

/** Tira `qtd` da pilha `invId` do banco para a mochila (que segue as regras dela). */
export function tirarDoBanco(banco: Banco, bolsa: Bolsa, item: Item, invId: string, qtd: number, regras: Balance['inventario']): MotivoDoMundo | null {
  const i = banco.itens.findIndex((b) => b.invId === invId);
  const origem: ItemNaMochila | undefined = banco.itens[i];
  if (!origem || origem.itemId !== item.id || origem.qtd < qtd) return 'sem_item';
  if (!guardarItem(bolsa, item, qtd, regras, origem.ref)) return 'mochila_cheia';
  origem.qtd -= qtd;
  if (origem.qtd <= 0) banco.itens.splice(i, 1);
  return null;
}

export function moverOuro(banco: Banco, bolsa: Bolsa, op: 'guardar' | 'tirar', valor: number): MotivoDoMundo | null {
  if (op === 'guardar') {
    if (bolsa.ouro < valor) return 'sem_ouro';
    bolsa.ouro -= valor;
    banco.ouro += valor;
  } else {
    if (banco.ouro < valor) return 'sem_ouro';
    banco.ouro -= valor;
    bolsa.ouro += valor;
  }
  return null;
}

/**
 * Deposita direto no banco o que chegou para quem saiu do jogo (o mercado). Não confere o limite de pilhas: passar do
 * limite é melhor que perder o item (quem abrir o banco cheio só consegue tirar).
 */
export function depositarNoBanco(banco: Banco, itens: readonly ItemNaMochila[], ouro: number): void {
  banco.ouro += ouro;
  for (const m of itens) banco.itens.push({ ...m, invId: proximoId(banco) });
}
