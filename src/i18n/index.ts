import { ptBR, type ChaveTexto } from './pt-BR';

export type { ChaveTexto };

export function t(chave: ChaveTexto): string {
  return ptBR[chave];
}
