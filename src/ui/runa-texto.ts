// As runas como caracteres da fonte do jogo, Runas de Filo (25/11/2026). A fonte (tools/fonte) põe cada runa na área de
// uso privado do Unicode, nesta ordem; a interface escreve a runa no meio do texto com `caractereDaRuna`. Os traços são
// os de render/runas.ts e render/runas-elementos.ts, então o caractere e o desenho no Pixi são a mesma figura.

export const ELEMENTOS_DA_FONTE = ['fogo', 'gelo', 'vento', 'raio', 'veneno', 'psiquico', 'terra', 'trevas', 'sagrado', 'arcano'] as const;
export const CLASSES_DA_FONTE = ['guerreiro', 'mago', 'arqueiro', 'necromante', 'aventureiro'] as const;
export const PRIMEIRA_RUNA = 0xe000;
export const PRIMEIRA_CLASSE = 0xe010;

/** A família da fonte, como o CSS e o Pixi a pedem. */
export const FONTE_DO_JOGO = 'Runas de Filo';

/** O caractere da runa de um elemento ou de uma classe; vazio se a fonte não a tem. */
export function caractereDaRuna(id: string): string {
  const e = (ELEMENTOS_DA_FONTE as readonly string[]).indexOf(id);
  if (e >= 0) return String.fromCodePoint(PRIMEIRA_RUNA + e);
  const c = (CLASSES_DA_FONTE as readonly string[]).indexOf(id);
  return c >= 0 ? String.fromCodePoint(PRIMEIRA_CLASSE + c) : '';
}
