// Ressonâncias de atributo (marco 18, 17/10/2026, D-068, camada 1 do grimório): atributo alto (16+) ou um par em 14+
// destrava um comportamento — empurrar no crítico, ricochete, escudos mais longos, a lâmina que herda o elemento da
// última magia… Cada uma é uma lista de ganchos (data/ressonancias.json), avaliada sobre os atributos efetivos.

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { Leitor } from '../core/validar';
import type { Atributos, Entidade } from '../entities/entidade';
import { lerGanchos, type Gancho } from './ganchos';
import { NOMES_ATRIBUTOS, type NomeAtributo } from './itens';

export interface Ressonancia {
  id: string;
  nome: string;
  /** O mínimo de cada atributo pedido. */
  exige: Partial<Record<NomeAtributo, number>>;
  texto: string;
  ganchos: Gancho[];
}

export function lerRessonancias(json: unknown): { ressonancias: Map<string, Ressonancia>; erros: string[] } {
  const l = new Leitor('ressonancias.json');
  const lista = l.lista(l.objeto(json, 'raiz'), 'ressonancias');
  const ressonancias = new Map<string, Ressonancia>();
  for (const bruto of lista) {
    const o = l.objeto(bruto, 'ressonancia');
    const id = l.texto(o, 'id');
    const eo = l.objeto(o.exige, `${id}.exige`);
    const exige: Partial<Record<NomeAtributo, number>> = {};
    for (const k of Object.keys(eo)) {
      if (!(NOMES_ATRIBUTOS as string[]).includes(k)) l.erro(`${id}: atributo desconhecido "${k}"`);
      else exige[k as NomeAtributo] = l.numero(eo, k, { min: 1, max: 100, inteiro: true });
    }
    if (Object.keys(exige).length === 0) l.erro(`${id}: exige ao menos um atributo`);
    if (ressonancias.has(id)) l.erro(`ressonância "${id}" repetida`);
    ressonancias.set(id, { id, nome: l.texto(o, 'nome'), exige, texto: l.texto(o, 'texto'), ganchos: lerGanchos(l, o.ganchos) });
  }
  return { ressonancias, erros: l.erros };
}

/** As ressonâncias que os atributos alcançam. */
export function ressonanciasDe(todas: ReadonlyMap<string, Ressonancia>, atributos: Atributos): Ressonancia[] {
  return [...todas.values()].filter((r) => Object.entries(r.exige).every(([a, min]) => atributos[a as NomeAtributo] >= min));
}

/** Os ganchos das ressonâncias ativas da entidade (só de quem tem ficha). */
export function ganchosDasRessonancias(ctx: Pick<ContextoSimulacao, 'conteudo'>, e: Entidade): Gancho[] {
  if (!e.bolsa) return [];
  return ressonanciasDe(ctx.conteudo.ressonancias, e.atributos).flatMap((r) => r.ganchos);
}

/** Etapa do tick: a lista pública de ressonâncias segue os atributos; as novas viram evento (o diário anota). */
export function atualizarRessonancias(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  for (const e of estado.entidades) {
    if (!e.bolsa) continue;
    const ids = ressonanciasDe(ctx.conteudo.ressonancias, e.atributos).map((r) => r.id);
    if (ids.length === e.ressonancias.length && ids.every((id, i) => e.ressonancias[i] === id)) continue;
    for (const id of ids) if (!e.ressonancias.includes(id)) saida.push({ t: 'ressonanciaAtiva', tick: estado.tick, id: e.id, ressonancia: id });
    e.ressonancias = ids;
  }
}
