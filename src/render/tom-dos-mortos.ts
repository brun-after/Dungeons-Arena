// 15/11/2026 (D-179): o tom único dos mortos do Necromante jogador. O `tint` do Pixi multiplica a cor original, então
// um modelo escuro saía vinho e um claro saía vermelho vivo, e os dois se confundiam com os demais. Este filtro tira a
// cor de baixo (fica só a luminosidade, com o contraste comprimido) e pinta tudo do mesmo vermelho. Um filtro só,
// compartilhado por todos os mortos. Só apresentação.

import { ColorMatrixFilter, type Container } from 'pixi.js';
import { TOM_DOS_MORTOS } from './cores-necromancia';

/** O vermelho dos mortos (0 a 1 por canal). */
const COR = { r: 1, g: 0.2, b: 0.17 } as const;
/** A luminosidade final vai de PISO (o mais escuro) a PISO + FAIXA (o mais claro): perto, para o tom ser um só. */
const PISO = 0.55;
const FAIXA = 0.5;

let filtro: ColorMatrixFilter | null = null;

function filtroDosMortos(): ColorMatrixFilter {
  if (filtro) return filtro;
  const f = new ColorMatrixFilter();
  const k = (c: number) => ({ r: c * FAIXA * 0.299, g: c * FAIXA * 0.587, b: c * FAIXA * 0.114, o: c * PISO });
  const r = k(COR.r), g = k(COR.g), b = k(COR.b);
  f.matrix = [r.r, r.g, r.b, 0, r.o, g.r, g.g, g.b, 0, g.o, b.r, b.g, b.b, 0, b.o, 0, 0, 0, 1, 0];
  filtro = f;
  return f;
}

/** Liga ou desliga o tom dos mortos num objeto da cena (sem trocar a lista de filtros a cada quadro). */
function aplicarTom(obj: Container, ativo: boolean): void {
  const tem = Array.isArray(obj.filters) ? obj.filters.length > 0 : !!obj.filters;
  if (ativo && !tem) obj.filters = [filtroDosMortos()];
  else if (!ativo && tem) obj.filters = [];
}

/**
 * A cor da invocação no corpo: o tom único dos mortos (filtro) ou a tinta comum. O rig só recebe a tinta quando há
 * uma (ele tem a própria cor por baixo).
 */
export function pintarInvocacao(partes: readonly (Container | null | undefined)[], rig: Container | null | undefined, tinta: number | null): void {
  const unico = tinta === TOM_DOS_MORTOS;
  const comum = unico ? null : tinta;
  for (const p of partes) {
    if (!p) continue;
    p.tint = comum ?? 0xffffff;
    aplicarTom(p, unico);
  }
  if (!rig) return;
  if (comum !== null) rig.tint = comum;
  else if (unico) rig.tint = 0xffffff;
  aplicarTom(rig, unico);
}
