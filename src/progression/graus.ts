// Os graus e as peças de armadura (marco 46, 16/11/2026, D-185). Saíram de render/equipamento-3d.ts para o núcleo: o
// motor dos efeitos de peça (combat/efeitos-de-peca.ts) e o perfil da peça (progression/pecas.ts) também leem o grau.
// O render e tools/sprites reexportam daqui; nenhuma lista fica duplicada. Puro.

export const GRAUS = ['comum', 'incomum', 'raro', 'epico', 'lendario', 'ultima'] as const;
export const PECAS_DE_ARMADURA = ['capa', 'corpo', 'pernas', 'pes', 'maos', 'cabeca'] as const;
export type PecaDeArmadura = (typeof PECAS_DE_ARMADURA)[number];

export const ehPecaDeArmadura = (v: unknown): v is PecaDeArmadura => typeof v === 'string' && (PECAS_DE_ARMADURA as readonly string[]).includes(v);

/** Mãos, pernas e pés têm 3 variações (o grau arredondado para baixo, de 2 em 2); as outras, 6. */
export const pecaDeMembro = (peca: PecaDeArmadura): boolean => peca === 'maos' || peca === 'pernas' || peca === 'pes';

/** O grau que a peça mostra: o membro arredonda para baixo, de 2 em 2. */
export const grauVisual = (peca: PecaDeArmadura, grau: number): number => (pecaDeMembro(peca) ? grau - (grau % 2) : grau);

/** As formas (D-069) contam como raridade: a épica, a lendária e a última puxam o grau para cima. */
const GRAU_DA_FORMA: Readonly<Record<string, number>> = { epica: 3, lendaria: 4, ultima: 5 };

/** O grau (0 a 5) pela raridade e pela forma, o maior dos dois. */
export function grauDe(raridade: string | null | undefined, forma: string | null | undefined = null): number {
  const r = raridade ? (GRAUS as readonly string[]).indexOf(raridade) : -1;
  const f = forma ? (GRAU_DA_FORMA[forma] ?? -1) : -1;
  return Math.max(0, r, f);
}

/** O nível do grau (0–1, 2–3, 4–5): a silhueta da peça e quantos efeitos ela libera. */
export const nivelDoGrau = (grau: number): number => (grau <= 1 ? 0 : grau <= 3 ? 1 : 2);
