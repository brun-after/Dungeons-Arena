// D-175 (15/11/2026): o visual das skills comuns. Cada uma tem o núcleo (que dá o gesto, vfx/nucleo-no-visual.ts) e,
// quando divide a assinatura com outra skill comum, sai na matéria do próprio elemento (vfx/transmutacao.ts), para
// nenhuma repetir o visual de outra. Só leitura do conteúdo.

import type { Conteudo } from '../core/conteudo';
import { assinaturaDe } from './vfx/resolver';

export interface VisualComum {
  nucleo: string;
  /** Divide a assinatura com outra skill comum: o desenho sai no elemento desta. */
  trocar: boolean;
}

export function visualDasComuns(conteudo: Pick<Conteudo, 'definicoes'>): Map<string, VisualComum> {
  const comuns = [...conteudo.definicoes.values()].filter((d) => d.nucleo && !d.interna);
  const vezes = new Map<string, number>();
  for (const d of comuns) vezes.set(assinaturaDe(d.base), (vezes.get(assinaturaDe(d.base)) ?? 0) + 1);
  return new Map(comuns.map((d) => [d.base.id, { nucleo: d.nucleo ?? '', trocar: (vezes.get(assinaturaDe(d.base)) ?? 0) > 1 }]));
}
