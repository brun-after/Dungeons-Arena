// Forja (marco 18, 17/10/2026, D-070): na loja, materiais raros viram itens (5 fragmentos de eco = Anel do eco) e uma
// peça Lendária sobe para a Última forma (com fragmentos e ouro). É a única porta da Última fora das missões e das
// origens raras. Receitas em data/forja.json; o comando `forjar` só vale com a loja aberta.

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { Leitor } from '../core/validar';
import type { Entidade } from '../entities/entidade';
import { idItemBase, lerIdItemBase } from './gerar-item-base';
import { guardarItem, recusarItem } from './inventario';

export interface ReceitaDeForja {
  id: string;
  nome: string;
  texto: string;
  entrada: { item: string; qtd: number }[];
  ouro: number;
  /** `item`: dá este item; `ascender`: a peça Lendária escolhida vira Última (mesma base, elemento, nível e semente). */
  saida: { tipo: 'item'; item: string } | { tipo: 'ascender' };
}

export function lerForja(json: unknown): { receitas: Map<string, ReceitaDeForja>; erros: string[] } {
  const l = new Leitor('forja.json');
  const receitas = new Map<string, ReceitaDeForja>();
  for (const bruto of l.lista(l.objeto(json, 'raiz'), 'receitas')) {
    const o = l.objeto(bruto, 'receita');
    const id = l.texto(o, 'id');
    const s = l.objeto(o.saida, `${id}.saida`);
    const tipo = l.opcao(s, 'tipo', ['item', 'ascender'] as const);
    receitas.set(id, {
      id,
      nome: l.texto(o, 'nome'),
      texto: l.texto(o, 'texto'),
      entrada: l.lista(o, 'entrada').map((x) => {
        const e = l.objeto(x, 'entrada[]');
        return { item: l.texto(e, 'item'), qtd: l.numero(e, 'qtd', { min: 1, max: 99, inteiro: true }) };
      }),
      ouro: o.ouro === undefined ? 0 : l.numero(o, 'ouro', { min: 0, max: 100_000, inteiro: true }),
      saida: tipo === 'item' ? { tipo, item: l.texto(s, 'item') } : { tipo },
    });
  }
  return { receitas, erros: l.erros };
}

/** Quanto do item a mochila tem (somando as pilhas). */
function quantidade(e: Entidade, itemId: string): number {
  return (e.bolsa?.mochila ?? []).filter((i) => i.itemId === itemId).reduce((s, i) => s + i.qtd, 0);
}

function gastar(e: Entidade, itemId: string, qtd: number): void {
  const bolsa = e.bolsa;
  if (!bolsa) return;
  let resta = qtd;
  for (const entrada of bolsa.mochila) {
    if (entrada.itemId !== itemId || resta === 0) continue;
    const tira = Math.min(resta, entrada.qtd);
    entrada.qtd -= tira;
    resta -= tira;
  }
  bolsa.mochila = bolsa.mochila.filter((i) => i.qtd > 0);
}

/** Pode forjar? (null = pode; senão o motivo, o mesmo que a recusa mostra). */
export function motivoParaNaoForjar(ctx: ContextoSimulacao, e: Entidade, r: ReceitaDeForja, invId: string | null): 'loja_fechada' | 'sem_ouro' | 'sem_material' | 'nao_encontrado' | null {
  if (e.interacao?.tipo !== 'loja' || !e.bolsa) return 'loja_fechada';
  if (e.bolsa.ouro < r.ouro) return 'sem_ouro';
  if (r.entrada.some((x) => quantidade(e, x.item) < x.qtd)) return 'sem_material';
  if (r.saida.tipo === 'ascender') {
    const entrada = invId ? e.bolsa.mochila.find((i) => i.invId === invId) : undefined;
    const p = entrada ? lerIdItemBase(entrada.itemId) : null;
    if (p?.forma !== 'lendaria') return 'nao_encontrado';
    if (!ctx.conteudo.itens.get(idItemBase(p.base, 'ultima', p.elemento, p.nivel, p.semente))) return 'nao_encontrado';
  }
  return null;
}

/** Comando `forjar`. */
export function forjar(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, receitaId: string, invId: string | null, saida: EventoSimulacao[]): void {
  const r = ctx.conteudo.forja.get(receitaId);
  const bolsa = e.bolsa;
  if (!r || !bolsa) {
    recusarItem(e, 'nao_encontrado', estado.tick, saida);
    return;
  }
  const motivo = motivoParaNaoForjar(ctx, e, r, invId);
  if (motivo) {
    recusarItem(e, motivo === 'sem_material' ? 'sem_material' : motivo, estado.tick, saida);
    return;
  }
  let itemId: string;
  if (r.saida.tipo === 'ascender') {
    const entrada = bolsa.mochila.find((i) => i.invId === invId);
    const p = entrada ? lerIdItemBase(entrada.itemId) : null;
    if (!entrada || !p) return;
    itemId = idItemBase(p.base, 'ultima', p.elemento, p.nivel, p.semente);
    entrada.itemId = itemId;
  } else {
    itemId = r.saida.item;
    const item = ctx.conteudo.itens.get(itemId);
    if (!item || !guardarItem(bolsa, item, 1, ctx.balance.inventario)) {
      recusarItem(e, 'mochila_cheia', estado.tick, saida);
      return;
    }
  }
  for (const x of r.entrada) gastar(e, x.item, x.qtd);
  bolsa.ouro -= r.ouro;
  saida.push({ t: 'forjou', tick: estado.tick, id: e.id, receita: r.id, itemId });
}
