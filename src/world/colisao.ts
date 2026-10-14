// Colisão contra entidades (§2.3), resolvida na integração do movimento.
// Cada entidade reserva a célula onde está e a célula de destino do passo em curso.

import { REGISTRO_EFEITOS } from '../combat/registro-efeitos';
import type { Entidade } from '../entities/entidade';

/** `fantasma` (§2.8): presença do efeito; os expirados saem na etapa 4 de cada tick. */
const semColisao = (e: Entidade) => e.efeitos.some((f) => REGISTRO_EFEITOS[f.tipo].semColisao);

/** Regras de colisão do modo (§2.3, itens 8 e 9). Vêm de dados. */
export interface RegrasColisao {
  jogadorBloqueiaJogador: boolean;
  jogadorBloqueiaInimigo: boolean;
}

/**
 * Se `a` e `b` não podem dividir uma célula. Segue a ordem da §2.3; os itens que dependem de
 * sistemas ainda inexistentes (escondida, fantasma, fora de combate, invocação aliada) entram
 * com esses sistemas. A comparação de célula (item 4) é feita por quem chama.
 */
export function bloqueia(a: Entidade, b: Entidade, regras: RegrasColisao): boolean {
  if (a.id === b.id) return false; // 1
  if (semColisao(a) || semColisao(b)) return false; // `fantasma` (§2.8, marco 8A)
  if ((a.tipo === 'jogador' && a.hp <= 0) || (b.tipo === 'jogador' && b.hp <= 0)) return false; // 3
  if (a.tipo === 'avatar' || b.tipo === 'avatar') return true; // 5
  // Marco 10A-3: invocação não bloqueia aliado da própria equipe (§2.9).
  if ((a.invocacao || b.invocacao) && a.equipe === b.equipe) return false;
  const jogadores = Number(a.tipo === 'jogador') + Number(b.tipo === 'jogador');
  const inimigos = Number(a.tipo === 'inimigo') + Number(b.tipo === 'inimigo');
  if (jogadores === 2) return regras.jogadorBloqueiaJogador; // 8
  if (jogadores === 1 && inimigos === 1) return regras.jogadorBloqueiaInimigo; // 9
  if (inimigos === 2) return true; // 10
  return false;
}

export function reservaCelula(e: Entidade, x: number, y: number): boolean {
  return (e.x === x && e.y === y) || (e.destinoX === x && e.destinoY === y);
}

/** A célula está livre para `quem`, considerando as reservas de todas as outras entidades? */
export function celulaLivrePara(
  quem: Entidade,
  x: number,
  y: number,
  entidades: readonly Entidade[],
  regras: RegrasColisao,
): boolean {
  for (const outra of entidades) {
    if (reservaCelula(outra, x, y) && bloqueia(quem, outra, regras)) return false;
  }
  return true;
}

/**
 * Ordem de processamento do tick: IDs estáveis, começando num ponto que gira a cada tick.
 * Nenhuma entidade tem prioridade fixa por ordem de entrada ou por ser o criador (§2.3).
 */
export function ordemRotativa<T extends { id: string }>(itens: readonly T[], tick: number): T[] {
  const ordenados = [...itens].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  if (ordenados.length === 0) return ordenados;
  const inicio = tick % ordenados.length;
  return [...ordenados.slice(inicio), ...ordenados.slice(0, inicio)];
}
