// Chave de habilidade (D-059). Marco 14 (14/10/2026). Pura.
// A chave descreve sozinha tudo o que muda a habilidade compilada: `id@rank/caminho,caminho+mod,mod`.
//   `bola_de_fogo`                         -> rank 1, sem caminhos nem modificadores (inimigos e arena);
//   `bola_de_fogo@4/eco,brutal+atravessar` -> rank 4, caminhos escolhidos e modificador do equipamento.
// A ação e o projétil guardam a chave: o projétil se resolve mesmo depois que o conjurador morre.
// Habilidades geradas por semente têm id `g_<semente base 36>_<nível>`; o código curto de compartilhar é a
// semente em maiúsculas.

import { MODIFICADORES, type Modificador } from './habilidades';

export interface PartesChave {
  id: string;
  rank: number;
  caminhos: readonly string[];
  mods: readonly Modificador[];
}

export function formatarChave(p: PartesChave): string {
  let s = p.id;
  if (p.rank > 1) s += `@${p.rank}`;
  if (p.caminhos.length > 0) s += `/${p.caminhos.join(',')}`;
  const mods = [...new Set(p.mods)].sort();
  if (mods.length > 0) s += `+${mods.join(',')}`;
  return s;
}

const ehModificador = (v: string): v is Modificador => (MODIFICADORES as readonly string[]).includes(v);

export function lerChave(chave: string): PartesChave | null {
  const m = /^([a-z0-9_]+)(?:@(\d+))?(?:\/([a-z0-9_,]+))?(?:\+([a-z_,]+))?$/.exec(chave);
  if (!m?.[1]) return null;
  const mods = (m[4] ?? '').split(',').filter((x) => x !== '');
  if (!mods.every(ehModificador)) return null;
  const rank = m[2] === undefined ? 1 : Number(m[2]);
  if (!Number.isInteger(rank) || rank < 1) return null;
  return { id: m[1], rank, caminhos: (m[3] ?? '').split(',').filter((x) => x !== ''), mods };
}

const PREFIXO_GERADA = 'g_';

export function ehGerada(id: string): boolean {
  return id.startsWith(PREFIXO_GERADA);
}

/** Id de uma habilidade gerada: a semente (inteiro sem sinal de 32 bits) e o nível que dá o orçamento. */
export function idGerada(semente: number, nivel: number): string {
  return `${PREFIXO_GERADA}${(semente >>> 0).toString(36)}_${Math.max(1, Math.floor(nivel))}`;
}

export function lerIdGerada(id: string): { semente: number; nivel: number } | null {
  const m = /^g_([0-9a-z]+)_(\d+)$/.exec(id);
  if (!m?.[1] || !m[2]) return null;
  const semente = Number.parseInt(m[1], 36);
  const nivel = Number(m[2]);
  if (!Number.isFinite(semente) || semente < 0 || semente > 0xffffffff || nivel < 1 || nivel > 99) return null;
  return { semente, nivel };
}

/** O código curto de compartilhar (D-057): a semente em base 36, em maiúsculas, com o nível. */
export function codigoDaGerada(id: string): string | null {
  const g = lerIdGerada(id);
  return g ? `${g.semente.toString(36).toUpperCase()}-${g.nivel}` : null;
}
