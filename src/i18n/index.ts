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

/** D-175 (15/11/2026): o texto de uma chave montada em tempo de execução, ou a reserva quando ela não existe. */
export function tOu(chave: string, reserva: string, parametros?: Readonly<Record<string, string | number>>): string {
  return chave in ptBR ? t(chave as ChaveTexto, parametros) : reserva;
}
