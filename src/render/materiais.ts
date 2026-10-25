// Que material de partícula cada coisa usa (marco 24, 25/10/2026). Puro: o elemento da habilidade dá a matéria da
// conjuração e do impacto; o estado no alvo dá a aura; a fúria do Guerreiro dá a cor do rastro da lâmina (cinza, vermelho
// da metade em diante, laranja com brasas no Frenesi).

import type { Elemento } from '../combat/elementos';
import type { TipoEfeito } from '../combat/registro-efeitos';
import type { Material } from './presets-elementos';
import type { NomePreset } from './presets-particula';

/** A matéria de cada elemento do jogo (o sagrado é a luz). */
export const MATERIAL_DO_ELEMENTO: Readonly<Record<Elemento, Material>> = {
  fogo: 'fogo',
  gelo: 'gelo',
  raio: 'raio',
  veneno: 'veneno',
  psiquico: 'psiquico',
  terra: 'terra',
  trevas: 'trevas',
  sagrado: 'luz',
};

/** A aura de cada estado no alvo; os que faltam usam a aura genérica na cor do registro. */
export const AURA_DO_ESTADO: Readonly<Partial<Record<TipoEfeito, NomePreset>>> = {
  dano_periodico: 'brasas',
  atordoar: 'estrelas',
  imune_dano: 'anel',
  sem_movimento: 'fumaca',
  queimando: 'aura_queimando',
  resfriado: 'aura_geada',
  congelado: 'aura_congelado',
  eletrizado: 'aura_eletrizado',
  envenenado: 'aura_envenenado',
  molhado: 'aura_molhado',
  atolado: 'aura_atolado',
  definhando: 'aura_definhando',
  consagrado: 'aura_consagrado',
  sangrando: 'aura_sangrando',
  cego: 'aura_cego',
  aterrorizado: 'aura_medo',
  confuso: 'aura_confuso',
  marcado: 'aura_marca',
  marca_cacador: 'aura_marca',
  desafiado: 'aura_marca',
  enraizado: 'aura_enraizado',
  frenesi: 'frenesi',
};

export const presetDeImpacto = (el: Elemento): NomePreset => `mat_${MATERIAL_DO_ELEMENTO[el]}`;
export const presetDeConjuracao = (el: Elemento): NomePreset => `con_${MATERIAL_DO_ELEMENTO[el]}`;

export const COR_FURIA_BAIXA = 0xc8ccd2;
export const COR_FURIA_ALTA = 0xe8452c;
export const COR_FRENESI = 0xff8a1f;

/** A cor do rastro da lâmina pela fração da fúria (0 a 1) e pelo Frenesi. */
export function corDaFuria(fracao: number, frenesi: boolean): number {
  if (frenesi) return COR_FRENESI;
  return fracao >= 0.5 ? COR_FURIA_ALTA : COR_FURIA_BAIXA;
}

/** Cores das auras de vertente: uma por vertente, estável pelo id (o jogador reconhece a dele). */
const CORES_VERTENTE = [0x9b59b6, 0x1abc9c, 0xe67e22, 0x3498db, 0xe74c3c, 0xf1c40f, 0x2ecc71, 0xecf0f1];

export function corDaVertente(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return CORES_VERTENTE[h % CORES_VERTENTE.length] ?? 0xffffff;
}
