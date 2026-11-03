// 02/11/2026: identidade das invocações, sem alterar relações de combate ou cores das barras.
import type { EstadoJogo } from '../core/estado';
import type { Entidade } from '../entities/entidade';

export function tintaDaInvocacao(e: Entidade, estado: EstadoJogo): number | null {
  const inv = e.invocacao;
  if (!inv) return null;
  const dono = estado.entidades.find(x => x.id === inv.donoId);
  if (inv.exercitoBoss || dono?.preset === 'necromante_ancestral') return 0x37333d;
  if (inv.necromancia || (dono?.bolsa?.classeId ?? dono?.classeId) === 'necromante') return 0xff7777;
  // Preset próprio preserva a identidade quando o dono saiu do recorte de rede.
  if (e.preset === 'esqueleto_do_ossuario') return 0x37333d;
  return null;
}
