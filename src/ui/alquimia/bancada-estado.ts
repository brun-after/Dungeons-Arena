// Marco 50 (21/11/2026, D-196): o que está na bancada (as skills nos vértices, as runas e o material) e a mistura
// provisória que a prévia e o círculo leem. A mistura ignora a compreensão (a prévia mostra a magia mesmo antes); quem
// diz se dá para transmutar é `montarFusao`, o mesmo que a simulação usa. Só lê.

import { definicaoDe } from '../../combat/compilar-habilidade';
import type { Elemento } from '../../combat/elementos';
import { misturar, type Mistura } from '../../combat/fusao/fundir';
import { achatar, herancaDasFusoes, idDaFusao, type Receita } from '../../combat/fusao/receita';
import type { DefinicaoHabilidade } from '../../combat/habilidades';
import type { ContextoSimulacao } from '../../core/contexto';
import type { Bolsa } from '../../entities/entidade';
import { elementoDaRuna, ID_RUNA_CURINGA } from '../../progression/alquimia';

export interface EstadoBancada {
  /** As skills nos vértices: núcleo, forma e eco (null = vazio). */
  vertices: (string | null)[];
  /** As runas e o material, por invId. */
  runas: string[];
  material: string | null;
}

export const bancadaVazia = (): EstadoBancada => ({ vertices: [null, null, null], runas: [], material: null });

/** As partes na ordem, sem os vértices vazios. */
export const partesDa = (b: EstadoBancada): string[] => b.vertices.filter((v): v is string => v !== null);

export interface Provisoria {
  receita: Receita;
  id: string;
  mistura: Mistura;
  defs: DefinicaoHabilidade[];
}

/** A mistura do que está na bancada (null com menos de 2 partes ou quando ela não fecha). */
export function misturaProvisoria(ctx: ContextoSimulacao, bolsa: Bolsa, b: EstadoBancada): Provisoria | null {
  const ids = partesDa(b);
  const partes = ids.length >= 2 ? achatar(ids) : null;
  if (!partes) return null;
  const defs = partes.map((p) => definicaoDe(ctx, p));
  if (!defs.every((d): d is DefinicaoHabilidade => !!d)) return null;
  const heranca = herancaDasFusoes(ids);
  const nucleo = defs[0]?.base.elemento ?? defs.map((d) => d.base.elemento).find((x) => !!x) ?? null;
  const runas: Elemento[] = [...heranca.runas];
  for (const invId of b.runas) {
    const item = bolsa.mochila.find((i) => i.invId === invId);
    const el = item ? (item.itemId === ID_RUNA_CURINGA ? nucleo : elementoDaRuna(item.itemId)) : null;
    if (el) runas.push(el);
  }
  const material = heranca.material ?? (b.material ? bolsa.mochila.find((i) => i.invId === b.material)?.itemId ?? null : null);
  const receita: Receita = { partes, runas, material };
  const id = idDaFusao(receita);
  if (!definicaoDe(ctx, id)) return null;
  return { receita, id, mistura: misturar(ctx, receita, defs), defs };
}

/** Tira da bancada o que saiu da bolsa (a skill consumida, a runa gasta). */
export function conferirBancada(bolsa: Bolsa, b: EstadoBancada): void {
  b.vertices = b.vertices.map((v) => (v && bolsa.conhecidas.some((c) => c.id === v) ? v : null));
  const tem = (invId: string) => bolsa.mochila.some((i) => i.invId === invId && i.qtd > 0);
  b.runas = b.runas.filter(tem);
  if (b.material && !tem(b.material)) b.material = null;
}
