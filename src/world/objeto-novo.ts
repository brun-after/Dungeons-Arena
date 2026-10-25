// Construtor de objeto do mundo (25/10/2026): separado de objetos.ts, só com imports de tipo, para os testes de ponta
// a ponta (Node, sem o Vite) montarem um save sem carregar o núcleo inteiro, que importa JSON sem atributo.

import type { ObjetoNoMundo, TipoObjeto } from '../core/estado';

/** Objeto com os campos de todos os tipos em valor neutro; `campos` preenche os do tipo. */
export function novoObjeto(objetoId: string, tipo: TipoObjeto, x: number, y: number, campos: Partial<ObjetoNoMundo> = {}): ObjetoNoMundo {
  return {
    objetoId,
    tipo,
    x,
    y,
    valor: 1,
    modo: 'abs',
    geracao: 0,
    itemId: null,
    efeito: null,
    itens: [],
    ouro: 0,
    chave: null,
    abertoTick: 0,
    abridorId: null,
    ref: null,
    ...campos,
  };
}
