// Os fios da ultimate (marco 40, 13/11/2026, D-160). A ultimate lê sempre o estilo e a sintonia de quem usa, aos poucos,
// em 10 faixas, como a forma do estilo (D-156) e as runas (D-151). Os fios de estilo são as formas (perfil.ts, cada estilo
// empurra o eixo principal dele); aqui ficam os outros:
// - fio de elemento: o elemento de cada skill do par entra na ultimate com o estado dele e a função secundária do papel,
//   na faixa da sintonia com ele (a runa da ultimate já entra por runas.ts);
// - par de elementos: dois elementos diferentes no par reagem; o dano cresce `parPorFaixaPct` por faixa do mais fraco
//   (até +15% na faixa 10) e, quando a runa é um dos dois, cresce até o dobro pela menor faixa entre a runa e o mais forte;
// - par de estilos: os eixos dos dois estilos mais fortes se fundem (ultimates.json, campo fusoes), na faixa do mais fraco.
// Tudo entra na chave (`#a6.b3*area.eco3`), para a memória das skills compiladas continuar valendo. O que cada ator
// tem fica em fios-do-ator.ts. Puro.

import type { PontaElemental } from '../progression/vinculo';
import type { Eixo } from './eixos';
import type { DefinicaoElemento, Elemento } from './elementos';
import type { Habilidade } from './habilidades';
import { aplicarSecundario, cabeNaSkill, naFaixa, type TabelaDePapeis } from './papeis';
import { FAIXAS_DE_VINCULO, type RegrasRunas } from './runas';
import { chaveDaFusao, type Fusao } from './ultimates';

export interface FioDeElemento {
  el: PontaElemental;
  faixa: number;
}

export interface FiosDaUltimate {
  /** Os elementos das duas skills do par, na ordem da barra. */
  par: readonly [FioDeElemento, FioDeElemento];
  /** A fusão dos dois estilos mais fortes (eixos na ordem de EIXOS) e a faixa do mais fraco. */
  fusao?: { eixos: readonly [Eixo, Eixo]; faixa: number };
}

export interface FontesDosFios {
  elementos: ReadonlyMap<Elemento, DefinicaoElemento>;
  papeis?: TabelaDePapeis;
  fusoes?: ReadonlyMap<string, Fusao>;
}

/** A ultimate compilada com os fios (depois da runa, que já deu o elemento principal e a parte elemental). */
export function aplicarFios(h: Habilidade, fios: FiosDaUltimate, fontes: FontesDosFios, r: Pick<RegrasRunas, 'duracaoMinPct' | 'parPorFaixaPct'>): Habilidade {
  let saida: Habilidade = { ...h, efeitos: [...h.efeitos] };
  const vistos = new Set<PontaElemental>([h.runa ?? 'fisico']);
  for (const f of fios.par) {
    if (vistos.has(f.el) || f.faixa <= 0) continue;
    vistos.add(f.el);
    // O estado do elemento entra no golpe que fere, com a duração pela faixa (como a runa).
    const estado = f.el === 'fisico' ? undefined : fontes.elementos.get(f.el)?.estado;
    if (estado && saida.formulaDano !== null && !saida.efeitos.some((e) => e.tipo === estado.tipo)) {
      const k = (r.duracaoMinPct + ((100 - r.duracaoMinPct) * f.faixa) / FAIXAS_DE_VINCULO) / 100;
      const e = { ...estado, duracaoMs: Math.round(estado.duracaoMs * k) };
      if (cabeNaSkill(saida, e)) saida.efeitos.push(e);
    }
    saida = aplicarSecundario(saida, fontes.papeis, f.el, f.faixa);
  }
  const [a, b] = fios.par;
  if (a.el !== b.el) {
    const menor = Math.min(a.faixa, b.faixa);
    let bonus = r.parPorFaixaPct * menor;
    // A runa no par: a reação cresce até o dobro, pela menor faixa entre a runa e o elemento mais forte do par.
    if (h.runa && (h.runa === a.el || h.runa === b.el)) bonus *= 1 + Math.min(h.faixaRuna ?? 0, Math.max(a.faixa, b.faixa)) / FAIXAS_DE_VINCULO;
    if (bonus > 0) saida.bonusFiosPct = bonus;
    saida.reacaoPar = [a.el, b.el].sort().join('+');
  }
  if (fios.fusao && fios.fusao.faixa > 0) {
    const fusao = fontes.fusoes?.get(chaveDaFusao(fios.fusao.eixos[0], fios.fusao.eixos[1]));
    for (const s of fusao?.efeitos ?? []) {
      const e = naFaixa(s, fios.fusao.faixa);
      if (e && cabeNaSkill(saida, e) && !saida.efeitos.some((x) => x.tipo === e.tipo && x.em === e.em)) saida.efeitos.push(e);
    }
    if (fusao) saida.fusao = chaveDaFusao(fios.fusao.eixos[0], fios.fusao.eixos[1]);
  }
  return saida;
}
