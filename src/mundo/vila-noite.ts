// A vila pela hora (marco 44, 15/11/2026, D-178). À noite, as lojas da vila que dependem do dia (o ferreiro, o
// alquimista, o mercado) fecham, e na praça aparece o vendedor da noite, com o que serve para andar no escuro (tochas,
// lenha, pó revelador). A taverna fica mais cheia: o quadro ganha as missões da noite (mundo/missoes-mundo.ts). O
// relógio vem da sala (`modo.noite`, a noite da hora, sem o escuro das matas). Puro.

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo, ObjetoNoMundo } from '../core/estado';
import { passavel } from '../world/fase';
import { novoObjeto } from '../world/objeto-novo';
import type { RegiaoDoMundo } from './reino';

/** O `ref` da loja do vendedor da noite. */
export const REF_NOTURNO = 'noturno';
const ID_NOTURNO = 'vendedor_noturno';

const ehNoite = (ctx: ContextoSimulacao): boolean => (ctx.modo.noite ?? 0) >= ctx.balance.mundo.vilaNoite.fechaDesde;

/** A loja fechada pela noite (`noite`: a do cliente, pelo relógio dele; no servidor, a do modo). */
export function lojaFechadaANoite(ctx: ContextoSimulacao, o: Pick<ObjetoNoMundo, 'tipo' | 'ref'>, noite = ctx.modo.noite ?? 0): boolean {
  return o.tipo === 'loja' && noite >= ctx.balance.mundo.vilaNoite.fechaDesde && ctx.balance.mundo.vilaNoite.fecham.includes(o.ref ?? '');
}

/**
 * Marco 53 (22/11/2026, D-203): à noite, o vendedor da noite e o comerciante andarilho cobram mais que a loja comum
 * (são o que está aberto). `noite` como em `lojaFechadaANoite`. Devolve o fator (1 = preço de sempre).
 */
export function fatorDaNoite(ctx: ContextoSimulacao, loja: Pick<ObjetoNoMundo, 'tipo' | 'ref'> | null, noite = ctx.modo.noite ?? 0): number {
  const r = ctx.balance.mundo.vilaNoite;
  if (!loja || loja.tipo !== 'loja' || noite < r.fechaDesde || !r.sobretaxa.lojas.includes(loja.ref ?? '')) return 1;
  return 1 + r.sobretaxa.pct / 100;
}

/** A cada segundo, pela sala: o vendedor da noite chega à praça ao escurecer e vai embora ao clarear. */
export function conferirVilaANoite(estado: EstadoJogo, ctx: ContextoSimulacao, regiao: RegiaoDoMundo): void {
  const vila = regiao.vila;
  if (!vila) return;
  const aqui = estado.objetos.some((o) => o.objetoId === ID_NOTURNO);
  if (!ehNoite(ctx)) {
    if (aqui) estado.objetos = estado.objetos.filter((o) => o.objetoId !== ID_NOTURNO);
    return;
  }
  if (aqui) return;
  for (let d = 2; d <= 8; d++) {
    for (const [dx, dy] of [[d, 1], [-d, 1], [1, d], [1, -d], [d, -d], [-d, d]] as const) {
      const x = vila.x + dx;
      const y = vila.y + dy;
      if (!passavel(ctx.fase, x, y) || estado.objetos.some((o) => o.x === x && o.y === y)) continue;
      estado.objetos.push(novoObjeto(ID_NOTURNO, 'loja', x, y, { ref: REF_NOTURNO, itens: [...ctx.balance.mundo.vilaNoite.estoque] }));
      return;
    }
  }
}
