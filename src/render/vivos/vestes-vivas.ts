// As peças vestidas no 3D em tempo real (marco 46, 16/11/2026, D-185). O pedido de cada ator leva, por peça, o
// propósito, o estilo, a marca e o grau (`<propósito>.<estilo>.<marca>.<grau>`); a peça é montada uma vez por base
// (o kit do propósito, o estilo e a marca, vivos/enfeites-de-peca.ts) e o realce é por ator:
// - o destaque emissivo cresce com o grau (nada nos graus 0–1, fraco no 2, forte no 5) e o conjunto completo (as 6
//   peças do mesmo propósito) acende um pouco mais;
// - os veios do elemento: os materiais de destaque (sombrio-base.ts `destacar`) tomam a cor do elemento dominante do
//   vínculo, mais fortes com mais vínculo. Nenhum atlas nem peça por elemento.

import * as THREE from 'three';
import type { AparenciaEquipada } from '../../entities/entidade';
import { grauDe, ehPecaDeArmadura, PECAS_DE_ARMADURA, type PecaDeArmadura } from '../../progression/graus';
import { conjuntoDe, corDoElementoDaVeste, vesteDe } from '../vestes';
import { KITS_POR_PROPOSITO } from './armaduras-sombrias';
import { estilizar, marcar } from './enfeites-de-peca';
import { Corpo, type Ossos, type PecaSombria } from './sombrio-base';

/** O realce do ator: a cor do elemento do vínculo (null: nenhum), a força (0 a 4) e o conjunto completo. */
export interface Realce {
  cor: number | null;
  forca: number;
  conjunto: boolean;
}

/** O destaque emissivo por grau (0 a 5). */
const ACENDE_POR_GRAU = [0, 0, 0.18, 0.32, 0.55, 1] as const;
const ACENDE_DO_CONJUNTO = 0.25;
const MORNO = 0xffa040;

/** As peças do pedido (`<propósito>.<estilo>.<marca>.<grau>`); `forcar` veste todas no grau (revisão em dev). */
export function pecasDoPedido(aparencia: AparenciaEquipada | null | undefined, modelo: string, forcar?: number): Partial<Record<PecaDeArmadura, string>> {
  const pecas: Partial<Record<PecaDeArmadura, string>> = {};
  for (const peca of PECAS_DE_ARMADURA) {
    const raridade = aparencia?.[peca];
    if (!raridade && forcar === undefined) continue;
    const v = vesteDe(aparencia, peca, forcar ?? grauDe(raridade), modelo);
    pecas[peca] = `${v.proposito}.${v.estilo}.${v.marca}.${String(v.grau)}`;
  }
  return pecas;
}

/** O realce do ator pela aparência (null: sem nada para acender). */
export function realceDe(aparencia: AparenciaEquipada | null | undefined, modelo: string): Realce | undefined {
  const vestes = PECAS_DE_ARMADURA.map((p) => (aparencia?.[p] ? vesteDe(aparencia, p, 0, modelo) : null));
  const conjunto = conjuntoDe(vestes) !== null;
  const cor = aparencia?.elementoVeste ? corDoElementoDaVeste(aparencia.elementoVeste) : null;
  const forca = cor === null ? 0 : (aparencia?.vinculoVeste ?? 0);
  return cor === null && !conjunto ? undefined : { cor, forca, conjunto };
}

/** Lê a chave da peça montada (`<peça>|<propósito>.<estilo>.<marca>.<grau>`). */
export function lerChaveDaVeste(chave: string): { peca: PecaDeArmadura; proposito: string; estilo: string; marca: string; grau: number } | null {
  const [peca, resto = ''] = chave.split('|');
  const [proposito = '', estilo = '', marca = '', grauTexto = ''] = resto.split('.');
  const grau = Number(grauTexto);
  if (!ehPecaDeArmadura(peca) || !Object.hasOwn(KITS_POR_PROPOSITO, proposito) || !Number.isInteger(grau) || grau < 0 || grau > 5) return null;
  return { peca, proposito, estilo, marca, grau };
}

/** Monta a peça da chave nos ossos (em repouso): o kit do propósito, o estilo e a marca. */
export function montarVesteViva(ossos: Ossos, chave: string): PecaSombria | null {
  const v = lerChaveDaVeste(chave);
  const kit = v ? KITS_POR_PROPOSITO[v.proposito] : undefined;
  if (!v || !kit) return null;
  const base = kit(ossos, v.peca, v.grau);
  const c = new Corpo(ossos);
  base.extras.push(...estilizar(c, v.peca, v.estilo, chave, base), ...marcar(c, v.peca, v.marca, v.grau, null));
  return base;
}

/** O grau da peça montada pela chave (0 sem chave válida). */
export const grauDaChave = (chave: string): number => lerChaveDaVeste(chave)?.grau ?? 0;

/**
 * O material com o realce do ator: só os de destaque mudam (clonados; o clone vai para `guardar`, que o ator libera ao
 * trocar de roupa). Sem grau que acenda e sem elemento, o próprio material.
 */
export function realcar(m: THREE.Material, grau: number, r: Realce | undefined, guardar: THREE.Material[]): THREE.Material {
  if (!m.userData.destaque || !(m instanceof THREE.MeshStandardMaterial)) return m;
  const k = (ACENDE_POR_GRAU[grau] ?? 0) + (r?.conjunto ? ACENDE_DO_CONJUNTO : 0);
  const veio = r?.cor !== null && r?.cor !== undefined ? 0.15 + 0.12 * r.forca : 0;
  if (k === 0 && veio === 0) return m;
  const novo = m.clone();
  const cor = new THREE.Color(r?.cor ?? MORNO);
  if (novo.emissiveIntensity > 0 && novo.emissive.getHex() !== 0) {
    novo.emissiveIntensity *= 1 + k;
    if (veio > 0) novo.emissive.lerp(cor, 0.5);
  } else {
    novo.emissive.copy(cor);
    novo.emissiveIntensity = Math.max(k * 0.6, veio);
  }
  guardar.push(novo);
  return novo;
}
