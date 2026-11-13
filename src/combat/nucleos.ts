// Marco 40 (12/11/2026, D-158): os núcleos das skills comuns (data/nucleos.json). Cada núcleo tem um verbo, um papel,
// os eixos que os estilos leem e o molde da skill; cada variante elementar troca o nome, o visual e o que o elemento
// muda no molde. A expansão gera as entradas cruas que `lerHabilidades` lê, com id `<núcleo>_<elemento>`. O Físico não
// tem `elemento` na skill (a ponta física do vínculo vem da ausência). O `legado` diz para onde vai cada geral antiga.

import { ehObjeto, type Objeto } from '../core/validar';
import { ELEMENTOS, type Elemento } from './elementos';

type PontaElemental = 'fisico' | Elemento;
const PONTAS: readonly PontaElemental[] = ['fisico', ...ELEMENTOS];

export interface NucleosExpandidos {
  /** As skills comuns, no formato do skills.json. */
  habilidades: Objeto[];
  /** Geral antiga -> skill comum que a substitui (saves e livros). */
  legado: ReadonlyMap<string, string>;
  /** Núcleo de cada skill comum gerada (id -> núcleo). */
  nucleoDe: ReadonlyMap<string, string>;
  erros: string[];
}

const CAMPOS_NUCLEO = ['id', 'papel', 'eixos', 'base', 'variantes'];
const CAMPOS_VARIANTE = ['elemento', 'nome', 'icone', 'visual', 'sobre'];

/** O id da skill comum de um núcleo num elemento. */
export const idDaVariante = (nucleo: string, ponta: PontaElemental): string => `${nucleo}_${ponta}`;

export function expandirNucleos(json: unknown): NucleosExpandidos {
  const erros: string[] = [];
  const habilidades: Objeto[] = [];
  const nucleoDe = new Map<string, string>();
  const legado = new Map<string, string>();
  if (!ehObjeto(json) || !Array.isArray(json.nucleos)) return { habilidades, legado, nucleoDe, erros: ['nucleos.json: falta a lista "nucleos"'] };
  for (const n of json.nucleos) {
    if (!ehObjeto(n) || typeof n.id !== 'string' || !ehObjeto(n.base) || !Array.isArray(n.variantes)) {
      erros.push('nucleos.json: núcleo sem id, base ou variantes');
      continue;
    }
    for (const k of Object.keys(n)) if (!CAMPOS_NUCLEO.includes(k)) erros.push(`nucleos.json: ${n.id}: campo desconhecido "${k}"`);
    for (const k of ['id', 'nome', 'elemento', 'nucleo', 'papel', 'eixos']) if (k in n.base) erros.push(`nucleos.json: ${n.id}: "${k}" não vai na base`);
    const vistos = new Set<string>();
    for (const v of n.variantes) {
      if (!ehObjeto(v) || typeof v.elemento !== 'string' || typeof v.nome !== 'string') {
        erros.push(`nucleos.json: ${n.id}: variante sem elemento ou nome`);
        continue;
      }
      for (const k of Object.keys(v)) if (!CAMPOS_VARIANTE.includes(k)) erros.push(`nucleos.json: ${n.id}_${v.elemento}: campo desconhecido "${k}"`);
      const ponta = PONTAS.find((p) => p === v.elemento);
      if (!ponta) { erros.push(`nucleos.json: ${n.id}: elemento desconhecido "${v.elemento}"`); continue; }
      if (vistos.has(ponta)) erros.push(`nucleos.json: ${n.id}: elemento repetido "${ponta}"`);
      vistos.add(ponta);
      const sobre = ehObjeto(v.sobre) ? v.sobre : {};
      const id = idDaVariante(n.id, ponta);
      const skill: Objeto = {
        ...n.base,
        ...sobre,
        id,
        nome: v.nome,
        nucleo: n.id,
        papel: n.papel,
        eixos: n.eixos,
        ...(v.icone !== undefined && { icone: v.icone }),
        ...(v.visual !== undefined && { visual: v.visual }),
        ...(ponta !== 'fisico' && { elemento: ponta }),
      };
      habilidades.push(skill);
      nucleoDe.set(id, n.id);
    }
  }
  if (ehObjeto(json.legado)) {
    for (const [antiga, nova] of Object.entries(json.legado)) {
      if (typeof nova !== 'string' || !nucleoDe.has(nova)) erros.push(`nucleos.json: legado "${antiga}" aponta para skill desconhecida`);
      else legado.set(antiga, nova);
    }
  }
  return { habilidades, legado, nucleoDe, erros };
}
