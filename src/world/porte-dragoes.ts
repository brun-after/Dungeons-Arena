// 03/11/2026: uma regra de porte para render, folga do terreno e interiores gerados.
import type { Balance } from '../core/contexto';
export const ehDragao = (preset: string): boolean => preset.startsWith('dragao_');
export function porteDoDragao(nivel: number, balance: Balance) {
  const r=balance.dragoes;
  const progresso=Math.min(1,Math.max(0,(nivel-1)/(r.nivelMax-1)));
  const altura=r.alturaMin+(r.alturaMax-r.alturaMin)*progresso;
  const escala=altura/r.alturaAtlas;
  const largura=r.larguraAtlas*escala;
  const corredor=2*Math.ceil((largura+r.folgaCorredor-1)/2)+1;
  return {altura,escala,largura,raio:largura/2,corredor,sala:Math.max(r.salaMin,corredor*r.salaPorCorredor)};
}
