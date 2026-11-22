// O nome de uma entrada da mochila (marco 53, 22/11/2026, D-203). O livro raro carrega a habilidade gerada no `ref`:
// o nome dela vai junto do nome do livro em todo lugar (a mochila, a venda, o baú do banco, o caixote), também quando
// o jogador já a conhece (antes, a loja e o banco só diziam "Livro raro").

import { resolverHabilidade } from '../combat/compilar-habilidade';
import type { ContextoSimulacao } from '../core/contexto';

type ContextoDoNome = Pick<ContextoSimulacao, 'conteudo' | 'balance'>;

export function nomeDaEntrada(ctx: ContextoDoNome, entrada: { itemId: string; ref?: string | null }): string {
  const item = ctx.conteudo.itens.get(entrada.itemId);
  const nome = item?.nome ?? entrada.itemId;
  if (item?.tipo !== 'livro') return nome;
  const ensinada = entrada.ref ? resolverHabilidade(ctx, entrada.ref) : item.ensina ? resolverHabilidade(ctx, item.ensina) : undefined;
  if (!ensinada || nome.includes(ensinada.nome)) return nome;
  return `${nome}: ${ensinada.nome}`;
}
