// As peças vestidas (marco 46, 16/11/2026, D-189): os efeitos das peças de armadura de quem tem ficha e a ponte com
// os ganchos (a resistência passiva do elmo). Separado do motor (combat/efeitos-de-peca.ts) para os ganchos lerem sem
// puxar o combate inteiro. Puro.

import type { ContextoSimulacao } from '../core/contexto';
import type { Entidade } from '../entities/entidade';
import type { Elemento } from '../combat/elementos';
import type { Gancho } from './ganchos';
import type { EfeitoDaPeca } from './pecas';

/** Os efeitos de todas as peças vestidas (sem ficha: nenhum). */
export function efeitosDasPecas(ctx: Pick<ContextoSimulacao, 'conteudo'>, e: Pick<Entidade, 'bolsa'>): EfeitoDaPeca[] {
  const eq = e.bolsa?.equipamento;
  if (!eq) return [];
  const saida: EfeitoDaPeca[] = [];
  for (const entrada of Object.values(eq)) {
    const peca = entrada ? ctx.conteudo.itens.get(entrada.itemId)?.peca : undefined;
    if (peca) saida.push(...peca.efeitos);
  }
  return saida;
}

/** Ponte com os ganchos: a resistência passiva do elmo vira um gancho passivo (o combate já soma as resistências). */
export function ganchosDasPecas(ctx: Pick<ContextoSimulacao, 'conteudo'>, e: Pick<Entidade, 'bolsa'>): Gancho[] {
  const efeitos = efeitosDasPecas(ctx, e).filter((x) => x.gatilho === 'passivo' && x.efeito.tipo === 'resistencia');
  if (efeitos.length === 0) return [];
  const teto = ctx.conteudo.pecas.tetos.resistenciaPct;
  const porElemento = new Map<Elemento | 'fisico', number>();
  for (const x of efeitos) {
    const el = x.se.elemento;
    if (el !== null && x.efeito.tipo === 'resistencia') porElemento.set(el, Math.min(teto, (porElemento.get(el) ?? 0) + x.efeito.pct));
  }
  const livre = { tag: null, habilidade: null, elemento: null, tipoAtaque: null, estadoDoAlvo: null, chancePct: 100 };
  // O Físico não é elemento: a resistência física fica de fora dos ganchos e entra pela condição do golpe (abaixo).
  return [...porElemento].flatMap(([el, pct]) => (el === 'fisico' ? [] : [{ quando: 'passivo' as const, se: livre, efeito: { tipo: 'passivo' as const, passivo: { resistencias: [{ elemento: el, pct }] } } }]));
}
