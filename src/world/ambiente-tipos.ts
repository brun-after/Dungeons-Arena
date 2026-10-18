// 17/10/2026: áreas pequenas de terreno, sem mudar a navegação das salas.
export const TIPOS_AMBIENTE = ['agua', 'brasas', 'miasma'] as const;
export type TipoAmbiente = (typeof TIPOS_AMBIENTE)[number];
export interface AreaAmbiente { tipo: TipoAmbiente; x: number; y: number; raio: number }
export const CORES_AMBIENTE: Readonly<Record<TipoAmbiente, number>> = { agua: 0x428ba0, brasas: 0xd46a35, miasma: 0x6c9962 };
export function dentroDaArea(a: AreaAmbiente, x: number, y: number): boolean {
  return (x - a.x) ** 2 + (y - a.y) ** 2 <= a.raio ** 2;
}
