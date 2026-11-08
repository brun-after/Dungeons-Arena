// Forja (marco 18, 17/10/2026, D-070): na loja, materiais raros viram itens (5 fragmentos de eco = Anel do eco) e uma
// peça Lendária sobe para a Última forma (com fragmentos e ouro). É a única porta da Última fora das missões e das
// origens raras. Receitas em data/forja.json; o comando `forjar` só vale com a loja aberta.
// Marco 30 (30/10/2026, D-129): a receita pode ter `oficio` (ferreiro, alquimista): só vale na loja daquele papel no
// Mundo (o `ref` da loja). A sem ofício é a da campanha, nas lojas sem papel.
// Marco 38 (08/11/2026, D-142): o grau da receita (I a V, quanto mais alto, mais raros os materiais) e a saída
// `fundir`: o troféu elemental de um chefe entra numa peça equipável escolhida da mochila (progression/fusao-elemental.ts).

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo, ObjetoNoMundo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { Leitor } from '../core/validar';
import type { Entidade } from '../entities/entidade';
import { idItemBase, lerIdItemBase } from './gerar-item-base';
import { ehElemento, type Elemento } from '../combat/elementos';
import { fundivel, idFundido } from './fusao-elemental';
import { guardarItem, recusarItem } from './inventario';
import { lojaAberta } from './loja';

export const OFICIOS = ['ferreiro', 'alquimista'] as const;
export type Oficio = (typeof OFICIOS)[number];

export interface ReceitaDeForja {
  id: string;
  nome: string;
  texto: string;
  entrada: { item: string; qtd: number }[];
  ouro: number;
  /** A loja que faz a receita (o papel do NPC no Mundo); null = a forja da campanha. */
  oficio: Oficio | null;
  /** `item`: dá este item; `ascender`: a peça Lendária escolhida vira Última (mesma base, elemento, nível e semente). */
  saida: { tipo: 'item'; item: string } | { tipo: 'ascender' } | { tipo: 'fundir'; elemento: Elemento; grau: number };
  /** Marco 38: o grau da receita (1 a 5). */
  grau: number;
}

export function lerForja(json: unknown): { receitas: Map<string, ReceitaDeForja>; erros: string[] } {
  const l = new Leitor('forja.json');
  const receitas = new Map<string, ReceitaDeForja>();
  for (const bruto of l.lista(l.objeto(json, 'raiz'), 'receitas')) {
    const o = l.objeto(bruto, 'receita');
    const id = l.texto(o, 'id');
    const s = l.objeto(o.saida, `${id}.saida`);
    const tipo = l.opcao(s, 'tipo', ['item', 'ascender', 'fundir'] as const);
    const elemento = s.elemento;
    if (tipo === 'fundir' && !ehElemento(elemento)) l.erro(`${id}: elemento desconhecido`);
    receitas.set(id, {
      id,
      nome: l.texto(o, 'nome'),
      texto: l.texto(o, 'texto'),
      entrada: l.lista(o, 'entrada').map((x) => {
        const e = l.objeto(x, 'entrada[]');
        return { item: l.texto(e, 'item'), qtd: l.numero(e, 'qtd', { min: 1, max: 99, inteiro: true }) };
      }),
      ouro: o.ouro === undefined ? 0 : l.numero(o, 'ouro', { min: 0, max: 100_000, inteiro: true }),
      oficio: o.oficio === undefined ? null : l.opcao(o, 'oficio', OFICIOS),
      saida:
        tipo === 'item'
          ? { tipo, item: l.texto(s, 'item') }
          : tipo === 'fundir'
            ? { tipo, elemento: ehElemento(elemento) ? elemento : 'fogo', grau: l.numero(s, 'grau', { min: 1, max: 3, inteiro: true }) }
            : { tipo },
      grau: o.grau === undefined ? 1 : l.numero(o, 'grau', { min: 1, max: 5, inteiro: true }),
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

/** A receita é feita nesta loja? (o ofício da receita é o papel da loja; as sem ofício, nas lojas sem papel). */
export const receitaDaLoja = (r: ReceitaDeForja, loja: ObjetoNoMundo): boolean => r.oficio === loja.ref;

/** Pode forjar? (null = pode; senão o motivo, o mesmo que a recusa mostra). */
export function motivoParaNaoForjar(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, r: ReceitaDeForja, invId: string | null): 'loja_fechada' | 'sem_ouro' | 'sem_material' | 'nao_encontrado' | null {
  const loja = lojaAberta(estado, e);
  if (!loja || !e.bolsa) return 'loja_fechada';
  if (!receitaDaLoja(r, loja)) return 'nao_encontrado';
  if (e.bolsa.ouro < r.ouro) return 'sem_ouro';
  if (r.entrada.some((x) => quantidade(e, x.item) < x.qtd)) return 'sem_material';
  if (r.saida.tipo === 'ascender') {
    const entrada = invId ? e.bolsa.mochila.find((i) => i.invId === invId) : undefined;
    const p = entrada ? lerIdItemBase(entrada.itemId) : null;
    if (p?.forma !== 'lendaria') return 'nao_encontrado';
    if (!ctx.conteudo.itens.get(idItemBase(p.base, 'ultima', p.elemento, p.nivel, p.semente))) return 'nao_encontrado';
  }
  if (r.saida.tipo === 'fundir') {
    const entrada = invId ? e.bolsa.mochila.find((i) => i.invId === invId) : undefined;
    if (!entrada || !fundivel(ctx.conteudo.itens.get(entrada.itemId))) return 'nao_encontrado';
    if (!ctx.conteudo.itens.get(idFundido(r.saida.elemento, r.saida.grau, entrada.itemId))) return 'nao_encontrado';
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
  const motivo = motivoParaNaoForjar(estado, ctx, e, r, invId);
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
  } else if (r.saida.tipo === 'fundir') {
    // Marco 38 (D-142): a peça escolhida vira a fundida (o mesmo lugar na mochila).
    const entrada = bolsa.mochila.find((i) => i.invId === invId);
    if (!entrada) return;
    itemId = idFundido(r.saida.elemento, r.saida.grau, entrada.itemId);
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
