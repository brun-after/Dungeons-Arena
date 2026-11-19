// O visual das peças vestidas (marco 46, 16/11/2026, D-188): o propósito, o estilo e a marca de cada peça saem da
// aparência pública (`vestes`, `<propósito>.<estilo>.<marca>`). Sem eles (a aparência de antes, o inimigo, o retrato
// sem ficha), a peça usa o propósito que veio do kit da classe do corpo, no estilo simples. As listas vêm de
// data/pecas.json (as mesmas do núcleo); nada é repetido aqui.

import elementosJson from '../data/elementos.json';
import pecasJson from '../data/pecas.json';
import type { AparenciaEquipada } from '../entities/entidade';
import { grauVisual, type PecaDeArmadura } from '../progression/graus';
import { lerCodigoVisual, lerPecas, propositoDaClasse } from '../progression/pecas';

const REGRAS = lerPecas(pecasJson).pecas;

/** Os propósitos (na ordem dos dados) e os estilos. */
export const PROPOSITOS: readonly string[] = [...REGRAS.propositos.keys()];
export const ESTILOS: readonly string[] = [...REGRAS.estilos.keys()];

/** O propósito do kit da classe (o corpo do modelo); o primeiro propósito para quem não é de classe. */
export const propositoDoModelo = (modelo: string): string => propositoDaClasse(REGRAS, modelo) ?? PROPOSITOS[0] ?? 'baluarte';

export interface VesteVisual {
  proposito: string;
  estilo: string;
  marca: string;
  /** O grau que a peça mostra (o membro arredonda para baixo, de 2 em 2). */
  grau: number;
}

/** O visual da peça vestida (o grau real vem da raridade; o membro mostra o grau par abaixo dele). */
export function vesteDe(aparencia: AparenciaEquipada | null | undefined, peca: PecaDeArmadura, grau: number, modelo: string): VesteVisual {
  const v = lerCodigoVisual(aparencia?.vestes?.[peca]);
  const proposito = v && REGRAS.propositos.has(v.proposito) ? v.proposito : propositoDoModelo(modelo);
  return { proposito, estilo: v?.estilo ?? 'simples', marca: v?.marca ?? 'placas', grau: grauVisual(peca, grau) };
}

/** A camada do atlas da peça: `<propósito>.<peça>-<grau>` (o estilo, a marca e o elemento não mudam o atlas). */
export const camadaDaPeca = (peca: PecaDeArmadura, v: Pick<VesteVisual, 'proposito' | 'grau'>): string => `${v.proposito}.${peca}-${String(v.grau)}`;

/** A cor do elemento (data/elementos.json), para os veios e as partículas da veste; null se não houver. */
export function corDoElementoDaVeste(elemento: string): number | null {
  const cor = elementosJson.elementos.find((e) => e.id === elemento)?.cor;
  return cor ? Number.parseInt(cor.slice(1), 16) : null;
}

/**
 * Conjunto completo: as 6 peças do mesmo propósito (o destaque extra). Devolve o propósito do conjunto, ou null.
 */
export function conjuntoDe(vestes: readonly (VesteVisual | null)[]): string | null {
  const primeiro = vestes[0]?.proposito;
  return vestes.length === 6 && primeiro && vestes.every((v) => v?.proposito === primeiro) ? primeiro : null;
}
