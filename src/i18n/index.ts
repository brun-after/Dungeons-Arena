import { ptBR, type ChaveTexto } from './pt-BR';

export type { ChaveTexto };

/** Texto do dicionário, com `{nome}` substituído pelos parâmetros. */
export function t(chave: ChaveTexto, parametros?: Readonly<Record<string, string | number>>): string {
  const texto: string = ptBR[chave];
  if (!parametros) return texto;
  return texto.replace(/\{(\w+)\}/g, (inteiro, nome: string) => {
    const valor = parametros[nome];
    return valor === undefined ? inteiro : String(valor);
  });
}
