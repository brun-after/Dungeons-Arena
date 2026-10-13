// Código curto de sala (§2.13, "Convidar"): 6 caracteres de um alfabeto sem ambiguidades
// (sem 0/O, 1/I/L). 31^6 ≈ 890 milhões de combinações. O código é o próprio roomId do Colyseus,
// então entrar por código é um `joinById` (D-036).

import { randomInt } from 'node:crypto';

export const ALFABETO_CODIGO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const TAMANHO_CODIGO = 6;

export function gerarCodigo(sortear: (max: number) => number = randomInt): string {
  let codigo = '';
  for (let i = 0; i < TAMANHO_CODIGO; i++) codigo += ALFABETO_CODIGO.charAt(sortear(ALFABETO_CODIGO.length));
  return codigo;
}

const PADRAO_CODIGO = new RegExp(`^[${ALFABETO_CODIGO}]{${TAMANHO_CODIGO}}$`);

export function codigoValido(texto: string): boolean {
  return PADRAO_CODIGO.test(texto);
}

/** Normaliza o que a pessoa digitou: maiúsculas, sem espaços. */
export function normalizarCodigo(texto: string): string {
  return texto.trim().toUpperCase().replace(/\s+/g, '');
}

/**
 * Limite de tentativas por origem (§2.13): janela deslizante simples em memória. Protege a busca de
 * sala por código contra adivinhação em massa.
 */
export class LimiteDeTentativas {
  private readonly janelas = new Map<string, number[]>();

  constructor(
    private readonly maximo: number,
    private readonly janelaMs: number,
  ) {}

  permitir(origem: string, agoraMs: number): boolean {
    const recentes = (this.janelas.get(origem) ?? []).filter((t) => agoraMs - t < this.janelaMs);
    if (recentes.length >= this.maximo) {
      this.janelas.set(origem, recentes);
      return false;
    }
    recentes.push(agoraMs);
    this.janelas.set(origem, recentes);
    // Limpeza preguiçosa para o mapa não crescer sem fim.
    if (this.janelas.size > 10_000) {
      for (const [k, v] of this.janelas) if (v.every((t) => agoraMs - t >= this.janelaMs)) this.janelas.delete(k);
    }
    return true;
  }
}
