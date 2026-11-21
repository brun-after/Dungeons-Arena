// Marco 50 (21/11/2026, D-196): a receita de uma fusão aberta. A fusão não guarda nada na ficha além do id: o id É a
// receita (como o `g_` das skills geradas), e qualquer lado (cliente, servidor, certificado) refaz a definição dele.
//   f__<parte1>__<parte2>[__<parte3>][__rr_<el>_<el>][__mm_<material>]
// As partes são sempre skills de base (a fusão de fusão é achatada: (A+B)+C vira A+B+C), na ordem núcleo, forma e eco.
// As runas são elementos (até 2), e o material, um só.
// Marco 52 (21/11/2026, D-198): a raridade da fusão fecha o id, `__g2` ou `__g1` (o 2º e o 1º nível); sem ela, a fusão
// é do 3º nível, o comum (as fusões de antes continuam valendo). Puro.

import { ehElemento, type Elemento } from '../elementos';

export const PREFIXO_FUSAO = 'f__';
const SEP = '__';
const RUNAS = 'rr_';
const MATERIAL = 'mm_';
const RARIDADE = /^g([12])$/;

/** O nível de raridade da fusão: 3 é o comum, 1 o mais raro. */
export type RaridadeFusao = 1 | 2 | 3;
export const RARIDADES_FUSAO: readonly RaridadeFusao[] = [3, 2, 1];

export interface Receita {
  /** 2 ou 3 skills de base, na ordem: núcleo, forma e eco. */
  partes: readonly string[];
  runas: readonly Elemento[];
  material: string | null;
  /** Ausente = 3º nível. */
  raridade?: RaridadeFusao;
}

export const ehFusao = (id: string): boolean => id.startsWith(PREFIXO_FUSAO);

/** A parte cabe numa receita? (id de skill sem os separadores da receita) */
const parteValida = (id: string): boolean => /^[a-z0-9_]+$/.test(id) && !id.includes(SEP) && !id.startsWith('_') && !id.endsWith('_') && !id.startsWith(RUNAS) && !id.startsWith(MATERIAL) && !RARIDADE.test(id);

/** O id da fusão (as runas em ordem, para a mesma mistura dar o mesmo id). */
export function idDaFusao(r: Receita): string {
  let s = PREFIXO_FUSAO + r.partes.join(SEP);
  if (r.runas.length > 0) s += `${SEP}${RUNAS}${[...r.runas].sort().join('_')}`;
  if (r.material) s += `${SEP}${MATERIAL}${r.material}`;
  if (r.raridade !== undefined && r.raridade !== 3) s += `${SEP}g${String(r.raridade)}`;
  return s;
}

/** A receita lida do id (null quando o id não é de fusão ou não fecha). */
export function lerIdDaFusao(id: string): Receita | null {
  if (!ehFusao(id)) return null;
  const pedacos = id.slice(PREFIXO_FUSAO.length).split(SEP);
  const partes: string[] = [];
  let runas: Elemento[] = [];
  let material: string | null = null;
  let raridade: RaridadeFusao | null = null;
  for (const p of pedacos) {
    // A raridade é sempre o último pedaço.
    if (raridade !== null) return null;
    const g = RARIDADE.exec(p);
    if (g) {
      raridade = g[1] === '1' ? 1 : 2;
    } else if (p.startsWith(RUNAS)) {
      if (runas.length > 0) return null;
      const els = p.slice(RUNAS.length).split('_');
      if (!els.every(ehElemento) || els.length === 0 || els.length > 2) return null;
      runas = els;
    } else if (p.startsWith(MATERIAL)) {
      if (material !== null) return null;
      material = p.slice(MATERIAL.length);
      if (!/^[a-z0-9_]+$/.test(material)) return null;
    } else {
      if (runas.length > 0 || material !== null || !parteValida(p)) return null;
      partes.push(p);
    }
  }
  if (partes.length < 2 || partes.length > 3) return null;
  return { partes, runas, material, ...(raridade !== null && { raridade }) };
}

/** O nível de raridade de uma fusão pelo id (3 para a comum, ou para o que não é fusão). */
export const raridadeDaFusao = (id: string): RaridadeFusao => lerIdDaFusao(id)?.raridade ?? 3;

/** O id da mesma receita sem a raridade (duas fusões são a mesma fórmula quando isto bate). */
export function formulaDaFusao(id: string): string | null {
  const r = lerIdDaFusao(id);
  return r ? idDaFusao({ partes: r.partes, runas: r.runas, material: r.material }) : null;
}

/**
 * As partes de uma mistura, achatadas: uma fusão entra com as partes dela (a fusão de fusão). Devolve null quando
 * passa de 3 skills.
 */
export function achatar(ids: readonly string[]): string[] | null {
  const partes: string[] = [];
  for (const id of ids) {
    const r = lerIdDaFusao(id);
    if (r) partes.push(...r.partes);
    else partes.push(id);
  }
  return partes.length >= 2 && partes.length <= 3 ? partes : null;
}

/** As runas e o material que já vêm dentro das fusões que entram de novo (somam aos novos). */
export function herancaDasFusoes(ids: readonly string[]): { runas: Elemento[]; material: string | null } {
  const runas: Elemento[] = [];
  let material: string | null = null;
  for (const id of ids) {
    const r = lerIdDaFusao(id);
    if (!r) continue;
    runas.push(...r.runas);
    material ??= r.material;
  }
  return { runas, material };
}
