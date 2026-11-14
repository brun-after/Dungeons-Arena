// Os fios da ultimate de quem usa (marco 40, 13/11/2026, D-160): o elemento de cada skill do par, com a faixa da
// sintonia, e a fusão dos dois estilos mais fortes. A aplicação na skill compilada fica em fios-ultimate.ts. Puro.

import type { ContextoSimulacao } from '../core/contexto';
import type { Entidade } from '../entities/entidade';
import { formasDosEstilos } from '../progression/estilos';
import { vinculoDe, type PontaElemental } from '../progression/vinculo';
import { parDaUltimate } from './ultimate-do-par';
import { EIXOS, type Eixo } from './eixos';
import type { FioDeElemento, FiosDaUltimate } from './fios-ultimate';
import { FAIXAS_DE_VINCULO, runaDoAtor } from './runas';

type Ctx = Pick<ContextoSimulacao, 'conteudo' | 'balance'>;

const faixaDe = (v: number) => Math.max(0, Math.min(FAIXAS_DE_VINCULO, Math.round(v * FAIXAS_DE_VINCULO)));

/** O elemento com que uma skill do par entra na ultimate: a runa dela, se tem encaixe; senão, o elemento do catálogo. */
function elementoDaSkill(ctx: Ctx, ator: Entidade, id: string, tick: number): PontaElemental {
  return runaDoAtor(ctx, ator, id, tick)?.runa ?? ctx.conteudo.definicoes.get(id)?.base.elemento ?? 'fisico';
}

/** Os fios de elemento e a fusão de quem usa (null sem par, como nos inimigos). */
export function fiosDoAtor(ctx: Ctx, ator: Entidade, tick: number): FiosDaUltimate | null {
  const par = parDaUltimate(ator);
  if (!par || !ator.bolsa) return null;
  const v = vinculoDe(ctx, ator, tick);
  const fio = (id: string): FioDeElemento => {
    const el = elementoDaSkill(ctx, ator, id, tick);
    return { el, faixa: faixaDe(v[el]) };
  };
  // Os dois estilos mais fortes com eixos principais diferentes.
  const fortes = [...formasDosEstilos(ctx, ator)].sort((a, b) => b.faixa - a.faixa);
  const primeiro = fortes[0];
  const segundo = fortes.find((f) => primeiro && f.estilo.eixos[0] !== primeiro.estilo.eixos[0]);
  const fusao = primeiro && segundo ? ordenar(primeiro.estilo.eixos[0], segundo.estilo.eixos[0], segundo.faixa) : undefined;
  // D-161: a classe dá o veículo (as criaturas e, no Necromante, as lanças dos mortos).
  return { par: [fio(par[0]), fio(par[1])], ...(fusao && { fusao }), classe: ator.bolsa.classeId };
}

function ordenar(a: Eixo, b: Eixo, faixa: number): { eixos: readonly [Eixo, Eixo]; faixa: number } {
  return { eixos: EIXOS.indexOf(a) <= EIXOS.indexOf(b) ? [a, b] : [b, a], faixa };
}
