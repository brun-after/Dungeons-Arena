// Aventura do jogador (§3.10): uma lista ordenada de fases. Marco 11A (16/10/2026), D-066. Puro: criar, duplicar,
// reordenar e excluir fases, a herança de tileset entre elas, o JSON de cada fase pronto para o jogo e a validação da
// aventura inteira (toda fase válida; o erro diz a fase).

import type { ItensConhecidos } from '../world/validacao-fase';
import { validarFase, type ResultadoValidacao } from '../world/validacao-fase';
import { tilesetHerdado } from '../world/tileset';
import type { FaseJson } from '../world/fase';
import { clonarFaseEditavel, novaFaseEditavel, paraFaseJson, type FaseEditavel } from './grade';

export const MAX_FASES_AVENTURA = 12;

export interface Aventura {
  id: string;
  nome: string;
  fases: FaseEditavel[];
}

/** O JSON da fase `indice`, com a ordem da aventura e o tileset herdado resolvido (§2.16). */
export function faseJsonDaAventura(a: Aventura, indice: number): FaseJson | null {
  const f = a.fases[indice];
  if (!f) return null;
  const json = paraFaseJson(f, indice + 1);
  const atlas = tilesetHerdado(
    a.fases.map((x) => x.tilesetId),
    indice,
  );
  return atlas ? { ...json, tileset: { atlasId: atlas } } : json;
}

/** Id novo de fase dentro de uma aventura (a primeira fase tem o id da aventura, como antes do 11A). */
export function novoIdDeFase(a: Aventura, sorteio: () => number): string {
  for (;;) {
    const id = `${a.id}-f${Math.floor(sorteio() * 1e6).toString(36)}`;
    if (!a.fases.some((f) => f.id === id)) return id;
  }
}

export function adicionarFase(a: Aventura, f: FaseEditavel, depoisDe = a.fases.length - 1): boolean {
  if (a.fases.length >= MAX_FASES_AVENTURA) return false;
  a.fases.splice(Math.max(0, Math.min(a.fases.length, depoisDe + 1)), 0, f);
  return true;
}

export function faseEmBranco(a: Aventura, nome: string, sorteio: () => number, largura = 24, altura = 16): FaseEditavel {
  return novaFaseEditavel(novoIdDeFase(a, sorteio), nome, largura, altura);
}

export function duplicarFase(a: Aventura, indice: number, nome: string, sorteio: () => number): boolean {
  const f = a.fases[indice];
  if (!f) return false;
  return adicionarFase(a, { ...clonarFaseEditavel(f), id: novoIdDeFase(a, sorteio), nome }, indice);
}

/** Troca a fase de lugar com a vizinha (`sentido` −1 sobe, +1 desce). */
export function moverFase(a: Aventura, indice: number, sentido: -1 | 1): boolean {
  const j = indice + sentido;
  const f = a.fases[indice];
  const g = a.fases[j];
  if (!f || !g) return false;
  a.fases[indice] = g;
  a.fases[j] = f;
  return true;
}

/** Exclui uma fase; a aventura nunca fica sem nenhuma. */
export function removerFase(a: Aventura, indice: number): boolean {
  if (a.fases.length <= 1 || !a.fases[indice]) return false;
  a.fases.splice(indice, 1);
  return true;
}

export interface ValidacaoDaAventura {
  ok: boolean;
  /** Uma validação por fase, na ordem. */
  fases: ResultadoValidacao[];
  /** A primeira fase com erro (para o editor abrir nela). */
  primeiraComErro: number | null;
}

export function validarAventura(a: Aventura, presets: ReadonlySet<string>, itens?: ItensConhecidos): ValidacaoDaAventura {
  const fases = a.fases.map((_, i) => validarFase(faseJsonDaAventura(a, i), presets, itens));
  const primeira = fases.findIndex((r) => !r.ok);
  return { ok: primeira < 0, fases, primeiraComErro: primeira < 0 ? null : primeira };
}
