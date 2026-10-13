// Modo de jogo como dado (§2.13). Marco 3 só usa a política de relação e o fogo amigo;
// o descritor completo da arena entra no marco 4. Regras de modo nunca viram `if (modo === 'x')`:
// são consultadas por funções pequenas como `relacao()`.

import { Leitor } from '../core/validar';

export type PoliticaRelacao = 'todos_hostis' | 'todos_aliados' | 'por_equipe';

export interface ModoDeJogo {
  id: string;
  nome: string;
  politicaRelacao: PoliticaRelacao;
  fogoAmigo: boolean;
}

export function lerModo(json: unknown, arquivo: string): { modo: ModoDeJogo; erros: string[] } {
  const l = new Leitor(arquivo);
  const o = l.objeto(json, 'modo');
  const modo: ModoDeJogo = {
    id: l.texto(o, 'id'),
    nome: l.texto(o, 'nome'),
    politicaRelacao: l.opcao(o, 'politicaRelacao', ['todos_hostis', 'todos_aliados', 'por_equipe'] as const),
    fogoAmigo: l.booleano(o, 'fogoAmigo'),
  };
  return { modo, erros: l.erros };
}
