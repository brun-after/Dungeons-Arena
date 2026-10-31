// O chão e a escuridão de cada tema (marco 31, 31/10/2026, D-130). Dado de src/data/temas.json: as texturas CC0 do
// chão (src/assets/texturas, render/solo/) e o quanto a fase é escura fora da luz (render/escuridao.ts). Puro.

import type { Leitor, Objeto } from '../core/validar';

/** As texturas do chão (uma por arquivo em src/assets/texturas/; licenças em LICENCAS.md). */
export const TEXTURAS_SOLO = ['lajes', 'rocha', 'blocos', 'terra', 'grama', 'lama', 'neve', 'areia', 'estrada', 'basalto'] as const;
export type TexturaSolo = (typeof TEXTURAS_SOLO)[number];

export interface SoloTema {
  /** O chão das salas. */
  base: TexturaSolo;
  /** As manchas que quebram a repetição da base (terra entre as lajes, musgo). */
  variacao: TexturaSolo;
  /** A pedra das paredes (o topo, de cima, e as faces, no isométrico). */
  parede: TexturaSolo;
  /** Multiplica as texturas: o tom do tema. */
  tinta: number;
  /** Quantas células cobre uma repetição da textura (512 px). */
  escala: number;
  /** O mato do exterior do Mundo neste tema (a neve da tundra, a grama do resto). */
  mato: TexturaSolo;
}

export interface EscuridaoTema {
  /** A cor do escuro fora da luz. */
  ambiente: number;
  /** 0 = sem escuridão; 1 = preto fora da luz. */
  nivel: number;
}

/** As fases sem tema (as antigas e o exterior sem tema). */
export const SOLO_PADRAO: SoloTema = { base: 'lajes', variacao: 'terra', parede: 'blocos', tinta: 0x9a94a8, escala: 3, mato: 'grama' };
export const ESCURIDAO_PADRAO: EscuridaoTema = { ambiente: 0x120f1a, nivel: 0.8 };

function cor(l: Leitor, o: Objeto, campo: string): number {
  const v = l.texto(o, campo);
  if (!/^#[0-9a-f]{6}$/i.test(v)) l.erro(`${campo} precisa ser #rrggbb ("${v}")`);
  return Number.parseInt(v.slice(1), 16);
}

/** Lê o `solo` do tema; sem o campo, o padrão. */
export function lerSolo(l: Leitor, v: unknown): SoloTema {
  if (v === undefined) return SOLO_PADRAO;
  const o = l.objeto(v, 'solo');
  return {
    base: l.opcao(o, 'base', TEXTURAS_SOLO),
    variacao: l.opcao(o, 'variacao', TEXTURAS_SOLO),
    parede: l.opcao(o, 'parede', TEXTURAS_SOLO),
    tinta: cor(l, o, 'tinta'),
    escala: l.numero(o, 'escala', { min: 1, max: 12 }),
    mato: o.mato === undefined ? 'grama' : l.opcao(o, 'mato', TEXTURAS_SOLO),
  };
}

/** Lê a `escuridao` do tema; sem o campo, o padrão. */
export function lerEscuridao(l: Leitor, v: unknown): EscuridaoTema {
  if (v === undefined) return ESCURIDAO_PADRAO;
  const o = l.objeto(v, 'escuridao');
  return { ambiente: cor(l, o, 'ambiente'), nivel: l.numero(o, 'nivel', { min: 0, max: 1 }) };
}
