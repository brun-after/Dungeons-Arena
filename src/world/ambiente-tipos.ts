import type { Elemento } from '../combat/elementos';
// 17/10/2026: áreas pequenas de terreno, sem mudar a navegação das salas.
// Marco 23 (24/10/2026, D-092): uma área por elemento — gelo fino (resfria), campo elétrico (eletriza), lama (atola),
// névoa sombria (definha) e luz sagrada (cura e limpa o veneno). As fases sem tema sorteiam só as três clássicas,
// na ordem de sempre (a mesma semente dá a mesma fase de antes).
export const TIPOS_AMBIENTE_CLASSICOS = ['agua', 'brasas', 'miasma'] as const;
export const TIPOS_AMBIENTE = [...TIPOS_AMBIENTE_CLASSICOS, 'gelo_fino', 'campo_eletrico', 'lama', 'nevoa_sombria', 'luz_sagrada'] as const;
export type TipoAmbiente = (typeof TIPOS_AMBIENTE)[number];
export interface AreaAmbiente { tipo: TipoAmbiente; x: number; y: number; raio: number }
export const CORES_AMBIENTE: Readonly<Record<TipoAmbiente, number>> = {
  agua: 0x428ba0, brasas: 0xd46a35, miasma: 0x6c9962,
  gelo_fino: 0xa8d8f0, campo_eletrico: 0xd9c94a, lama: 0x7a6040, nevoa_sombria: 0x5a3f80, luz_sagrada: 0xf2e2a0,
};
/**
 * Marco 25 (25/10/2026, D-100): o elemento de cada área (a água e a luz não ferem; as demais, sim). O inimigo afim ao
 * elemento não se fere nela e se cura (world/ambientes.ts); a IA dos outros a evita (world/perigos.ts).
 */
export const ELEMENTO_DO_AMBIENTE: Readonly<Record<TipoTerrenoVivo, Elemento | null>> = {
  agua: null, brasas: 'fogo', miasma: 'veneno', gelo_fino: 'gelo', campo_eletrico: 'raio', lama: 'terra', nevoa_sombria: 'trevas', luz_sagrada: 'sagrado',
  vapor: null, seco: null,
};
export const AMBIENTE_FERE: Readonly<Record<TipoTerrenoVivo, boolean>> = {
  agua: false, brasas: true, miasma: true, gelo_fino: true, campo_eletrico: true, lama: true, nevoa_sombria: true, luz_sagrada: false,
  vapor: true, seco: false,
};

/**
 * 08/11/2026 (D-138): os terrenos vivos (world/terrenos-vivos.ts): os das áreas, o vapor (a água com o fogo: cega por um
 * instante) e o seco (a área apagada por um tempo, sem efeito).
 */
export const TIPOS_TERRENO_VIVO = [...TIPOS_AMBIENTE, 'vapor', 'seco'] as const;
export type TipoTerrenoVivo = (typeof TIPOS_TERRENO_VIVO)[number];
export const CORES_TERRENO_VIVO: Readonly<Record<TipoTerrenoVivo, number>> = { ...CORES_AMBIENTE, vapor: 0xdfe8ee, seco: 0x9a8a70 };

/** Uma área com prazo, no estado: a reação de um elemento (cobrindo a área fixa `cobre`) ou o foco do Mundo. */
export interface TerrenoVivo {
  id: number;
  tipo: TipoTerrenoVivo;
  x: number;
  y: number;
  raio: number;
  ateTick: number;
  /** O índice da área fixa da fase que este vivo cobre (até o prazo). */
  cobre?: number;
  /** O foco do Mundo que o acendeu (somem juntos). */
  foco?: string;
}

export function dentroDaArea(a: Pick<AreaAmbiente, 'x' | 'y' | 'raio'>, x: number, y: number): boolean {
  return (x - a.x) ** 2 + (y - a.y) ** 2 <= a.raio ** 2;
}
