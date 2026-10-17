// D-075 (17/10/2026): consumíveis permanentes de progressão; família da definição original, nunca do caminho.
import { definicaoDe } from '../combat/compilar-habilidade';
import type { ContextoSimulacao } from '../core/contexto';
import type { Entidade } from '../entities/entidade';
import type { Item } from './itens';
import { precoDeCompra } from './efeitos-atributo';

export function familiaDaHabilidade(ctx: ContextoSimulacao, id: string): string {
  const d = definicaoDe(ctx, id);
  if (!d) return '';
  return d.familiaEvolucao ?? (d.fusao ? 'fusao' : d.base.elemento ?? (d.base.passiva || !d.base.formulaDano ? 'suporte' : d.base.tipoAtaque === 'fisico' ? 'tecnica' : 'arcana'));
}

export function aplicarItemDeProgressao(e: Entidade, ctx: ContextoSimulacao, item: Item): boolean {
  const b = e.bolsa;
  const p = item.progressao;
  if (!b || !p) return false;
  if (p.tipo === 'aceleracao') {
    if (!b.estudo) return false;
    b.estudo.velocidade12 = (b.estudo.velocidade12 ?? 12) + p.unidades12;
    return true;
  }
  if (p.tipo === 'ponto') {
    b.pontosHabilidade++;
    b.pontosPorItens = (b.pontosPorItens ?? 0) + 1;
    return true;
  }
  // Essências exigem seleção e passam pelo mesmo subirRank dos pontos.
  return false;
}

export function precoDoItem(item: Item, e: Entidade, ctx: ContextoSimulacao): number {
  const r = ctx.balance.progressaoItens;
  const base = item.progressao?.tipo === 'ponto' ? r.tomoPrecoBase : item.valorBase;
  return precoDeCompra(base, e.atributos, ctx.balance);
}
