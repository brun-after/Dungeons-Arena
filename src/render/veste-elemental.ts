// A camada elemental da armadura no Pixi (marco 46, 16/11/2026, D-189). Vale no 3D em tempo real e no atlas (as
// partículas ficam por cima de qualquer um). Lê só a aparência pública e os estados da entidade:
// - o elemento dominante do vínculo solta partículas leves nos pontos de destaque, mais densas com mais vínculo;
// - as reações ao vivo: queimando solta brasa da capa, congelado cobre de geada, molhado com eletrizado solta faíscas.
// Nenhum atlas por elemento.

import type { Entidade } from '../entities/entidade';
import type { NomePreset } from './presets-particula';
import { corDoElementoDaVeste } from './vestes';

/** O intervalo das partículas do vínculo pelo degrau (1 a 4): mais vínculo, mais partículas. */
const INTERVALO_POR_DEGRAU_MS = [0, 1400, 1000, 700, 450] as const;
const INTERVALO_REACAO_MS = 260;
const GEADA = 0xdff4ff;
const FAISCA = 0xfff07a;
const BRASA = 0xffb347;

export type Emitir = (preset: NomePreset, dx: number, dy: number, cor: number) => void;

const ativo = (e: Pick<Entidade, 'efeitos'>, tipo: string, tick: number) => e.efeitos.some((f) => f.tipo === tipo && f.ateTick > tick);

/**
 * As partículas da veste de `e` neste quadro. `ultima` guarda quando cada fonte soltou pela última vez (por entidade);
 * `emitir` recebe o deslocamento em px a partir dos pés.
 */
export function particulasDaVeste(e: Pick<Entidade, 'id' | 'aparencia' | 'efeitos' | 'morto'>, tick: number, agoraMs: number, ultima: Map<string, number>, emitir: Emitir): void {
  const ap = e.aparencia;
  if (e.morto || !ap || ap.skin) return;
  const vez = (fonte: string, intervalo: number): boolean => {
    const chave = `veste:${fonte}:${e.id}`;
    if (agoraMs - (ultima.get(chave) ?? -Infinity) < intervalo) return false;
    ultima.set(chave, agoraMs);
    return true;
  };
  const vestida = Object.keys(ap.vestes ?? {}).length > 0;
  const degrau = ap.vinculoVeste ?? 0;
  const cor = ap.elementoVeste ? corDoElementoDaVeste(ap.elementoVeste) : null;
  // os veios: brilho sutil na cor do elemento, nos ombros e no gorjal
  if (vestida && cor !== null && degrau > 0 && vez('vinculo', INTERVALO_POR_DEGRAU_MS[degrau] ?? 1400)) {
    emitir('aura_sutil', (agoraMs % 2 === 0 ? -1 : 1) * 6, -26, cor);
  }
  if (!vestida) return;
  // as reações aos estados
  if (ativo(e, 'queimando', tick) && ap.capa && vez('queimando', INTERVALO_REACAO_MS)) emitir('brasas', 0, -14, BRASA);
  if (ativo(e, 'congelado', tick) && vez('congelado', INTERVALO_REACAO_MS * 2)) emitir('cristais', 0, -20, GEADA);
  if (ativo(e, 'molhado', tick) && ativo(e, 'eletrizado', tick) && vez('faiscas', INTERVALO_REACAO_MS)) emitir('faiscas', 0, -22, FAISCA);
}
