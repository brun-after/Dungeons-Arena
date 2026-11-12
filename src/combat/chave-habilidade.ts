// Chave de habilidade (D-059). Marco 14 (14/10/2026). Pura.
// A chave descreve sozinha tudo o que muda a habilidade compilada: `id@rank/caminho,caminho+mod,mod`.
//   `bola_de_fogo`                         -> rank 1, sem caminhos nem modificadores (inimigos e arena);
//   `bola_de_fogo@4/eco,brutal+atravessar` -> rank 4, caminhos escolhidos e modificador do equipamento.
// A ação e o projétil guardam a chave: o projétil se resolve mesmo depois que o conjurador morre.
// Habilidades geradas por semente têm id `g_<semente base 36>_<nível>`; o código curto de compartilhar é a
// semente em maiúsculas.

// Marco 24 (24/10/2026): `~variante` no fim — a variante que o estado de quem usa liga (`redemoinho@3~frenesi`).
// Marco 39 (12/11/2026, D-151): `!runaN` no fim — a runa do encaixe e a faixa do vínculo com ela (`chamas@2!gelo7`).
// D-156: `^modN` antes da runa — as formas dos estilos e a faixa de cada uma (`chamas@2^ecoar4,encadear7!gelo7`).
import { MODIFICADORES, VARIANTES, type Modificador, type Variante } from './habilidades';
import type { Elemento } from './elementos';

const RUNAS = ['fisico', 'fogo', 'gelo', 'raio', 'veneno', 'psiquico', 'terra', 'trevas', 'sagrado'] as const;

export interface PartesChave {
  id: string;
  rank: number;
  caminhos: readonly string[];
  mods: readonly Modificador[];
  variantes?: readonly Variante[];
  runa?: { runa: 'fisico' | Elemento; faixa: number };
  formas?: readonly { mod: Modificador; faixa: number }[];
}

export function formatarChave(p: PartesChave): string {
  let s = p.id;
  if (p.rank > 1) s += `@${p.rank}`;
  if (p.caminhos.length > 0) s += `/${p.caminhos.join(',')}`;
  const mods = [...new Set(p.mods)].sort();
  if (mods.length > 0) s += `+${mods.join(',')}`;
  const variantes = [...new Set(p.variantes ?? [])].sort();
  if (variantes.length > 0) s += `~${variantes.join(',')}`;
  const formas = [...(p.formas ?? [])].filter((f) => f.faixa > 0).sort((a, b) => a.mod.localeCompare(b.mod));
  if (formas.length > 0) s += `^${formas.map((f) => `${f.mod}${String(Math.min(10, Math.round(f.faixa)))}`).join(',')}`;
  if (p.runa) s += `!${p.runa.runa}${String(Math.max(0, Math.min(10, Math.round(p.runa.faixa))))}`;
  return s;
}

const ehModificador = (v: string): v is Modificador => (MODIFICADORES as readonly string[]).includes(v);
const ehVariante = (v: string): v is Variante => (VARIANTES as readonly string[]).includes(v);

export function lerChave(chave: string): PartesChave | null {
  const m = /^([a-z0-9_]+)(?:@(\d+))?(?:\/([a-z0-9_,]+))?(?:\+([a-z_,]+))?(?:~([a-z_,]+))?(?:\^([a-z_0-9,]+))?(?:!([a-z]+)(\d+))?$/.exec(chave);
  if (!m?.[1]) return null;
  const mods = (m[4] ?? '').split(',').filter((x) => x !== '');
  if (!mods.every(ehModificador)) return null;
  const variantes = (m[5] ?? '').split(',').filter((x) => x !== '');
  if (!variantes.every(ehVariante)) return null;
  const rank = m[2] === undefined ? 1 : Number(m[2]);
  if (!Number.isInteger(rank) || rank < 1) return null;
  let runa: PartesChave['runa'];
  const formas: { mod: Modificador; faixa: number }[] = [];
  for (const parte of (m[6] ?? '').split(',').filter((x) => x !== '')) {
    const f = /^([a-z_]+?)(\d+)$/.exec(parte);
    const mod = f?.[1];
    const faixa = Number(f?.[2]);
    if (!mod || !ehModificador(mod) || !(faixa >= 1 && faixa <= 10)) return null;
    formas.push({ mod, faixa });
  }
  if (m[7] !== undefined) {
    const r = RUNAS.find((x) => x === m[7]);
    const faixa = Number(m[8]);
    if (!r || faixa > 10) return null;
    runa = { runa: r, faixa };
  }
  return { id: m[1], rank, caminhos: (m[3] ?? '').split(',').filter((x) => x !== ''), mods, ...(variantes.length > 0 && { variantes }), ...(formas.length > 0 && { formas }), ...(runa && { runa }) };
}

const PREFIXO_GERADA = 'g_';

export function ehGerada(id: string): boolean {
  return id.startsWith(PREFIXO_GERADA);
}

/** Id de uma habilidade gerada: a semente (inteiro sem sinal de 32 bits) e o nível que dá o orçamento. */
export function idGerada(semente: number, nivel: number): string {
  return `${PREFIXO_GERADA}${(semente >>> 0).toString(36)}_${Math.max(1, Math.floor(nivel))}`;
}

/** 12/11/2026 (marco 39): o id aceita o nível 100 (antes recusava acima de 99). */
const NIVEL_MAX_GERADA = 999;

export function lerIdGerada(id: string): { semente: number; nivel: number } | null {
  const m = /^g_([0-9a-z]+)_(\d+)$/.exec(id);
  if (!m?.[1] || !m[2]) return null;
  const semente = Number.parseInt(m[1], 36);
  const nivel = Number(m[2]);
  if (!Number.isFinite(semente) || semente < 0 || semente > 0xffffffff || nivel < 1 || nivel > NIVEL_MAX_GERADA) return null;
  return { semente, nivel };
}

/** O código curto de compartilhar (D-057): a semente em base 36, em maiúsculas, com o nível. */
export function codigoDaGerada(id: string): string | null {
  const g = lerIdGerada(id);
  return g ? `${g.semente.toString(36).toUpperCase()}-${g.nivel}` : null;
}
