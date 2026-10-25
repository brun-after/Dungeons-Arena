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
export const ELEMENTO_DO_AMBIENTE: Readonly<Record<TipoAmbiente, Elemento | null>> = {
  agua: null, brasas: 'fogo', miasma: 'veneno', gelo_fino: 'gelo', campo_eletrico: 'raio', lama: 'terra', nevoa_sombria: 'trevas', luz_sagrada: 'sagrado',
};
export const AMBIENTE_FERE: Readonly<Record<TipoAmbiente, boolean>> = {
  agua: false, brasas: true, miasma: true, gelo_fino: true, campo_eletrico: true, lama: true, nevoa_sombria: true, luz_sagrada: false,
};
export function dentroDaArea(a: AreaAmbiente, x: number, y: number): boolean {
  return (x - a.x) ** 2 + (y - a.y) ** 2 <= a.raio ** 2;
}
