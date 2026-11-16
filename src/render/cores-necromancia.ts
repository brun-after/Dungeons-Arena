// 02/11/2026: identidade das invocações, sem alterar relações de combate ou cores das barras.
import type { EstadoJogo } from '../core/estado';
import type { Entidade } from '../entities/entidade';

/**
 * 15/11/2026 (D-179): a marca dos mortos do Necromante jogador. O sprite não usa este valor como `tint`: com ele, o
 * render liga o filtro do tom único (render/tom-dos-mortos.ts).
 */
export const TOM_DOS_MORTOS = 0xff332b;

export function tintaDaInvocacao(e: Entidade, estado: EstadoJogo, doPreset?: string): number | null {
  const inv = e.invocacao;
  if (!inv) return null;
  const dono = estado.entidades.find(x => x.id === inv.donoId);
  if (inv.exercitoBoss || dono?.preset === 'necromante_ancestral') return 0x37333d;
  if (inv.necromancia || (dono?.bolsa?.classeId ?? dono?.classeId) === 'necromante') return TOM_DOS_MORTOS;
  // Preset próprio preserva a identidade quando o dono saiu do recorte de rede.
  if (e.preset === 'esqueleto_do_ossuario') return 0x37333d;
  // D-173: a criatura própria da classe (a tinta do preset).
  return doPreset ? Number.parseInt(doPreset.slice(1), 16) : null;
}
