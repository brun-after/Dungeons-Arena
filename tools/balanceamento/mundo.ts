// Metas do Mundo (marco 30, 30/10/2026, D-129): o ritmo de cada região e o tempo dos covis de boss, medidos com as
// mesmas lutas do simulador (simulador.ts) e o reino em dados (src/data/mundo/reino-central.json).

import { BALANCE_PADRAO } from '../../src/core/contexto';
import { xpParaProximo } from '../../src/progression/nivel';
import { CONTEUDO } from './cenarios';
import { CLASSES, chefe, economiaPorMinuto, equipar, mediana, sequencia } from './simulador';

export interface RitmoDaRegiao {
  regiao: string;
  nivel: number;
  vitoriasPct: number;
  xpPorHora: number;
  /** Minutos de combate para subir do nível do meio da faixa. */
  minPorNivel: number;
}

export interface TempoDoCovil {
  covil: string;
  boss: string;
  nivel: number;
  grupo: number;
  tempoS: number;
  vitoriasPct: number;
}

const reino = () => {
  const r = CONTEUDO.reinos.get('reino_central');
  if (!r) throw new Error('reino_central ausente');
  return r;
};

/** Cada região (fora as sem inimigos), com o jogador típico no meio da faixa e equipamento incomum. */
export function ritmoDasRegioes(sementes: readonly number[]): RitmoDaRegiao[] {
  return reino().regioes.filter((r) => r.inimigos.length > 0).map((r) => {
    const nivel = Math.round((r.nivel[0] + r.nivel[1]) / 2);
    const lutas = CLASSES.flatMap((c) => sementes.slice(0, 2).flatMap((s) => sequencia(c, nivel, r.inimigos, s, 'normal', equipar('incomum'))));
    const xpMin = mediana(CLASSES.map((c) => economiaPorMinuto(c, nivel, sementes[0] ?? 1000, r.inimigos, 'normal', equipar('incomum')).xp));
    return {
      regiao: r.id,
      nivel,
      vitoriasPct: (100 * lutas.filter((l) => l.venceu).length) / Math.max(1, lutas.length),
      xpPorHora: xpMin * 60,
      minPorNivel: xpParaProximo(nivel, BALANCE_PADRAO.xp) / Math.max(1, xpMin),
    };
  });
}

/** Cada covil com um grupo de N no nível do covil (classes misturadas). */
export function tempoDosCovis(sementes: readonly number[], n: number): TempoDoCovil[] {
  return reino().covis.map((c) => {
    const r = sementes.map((s) => chefe('guerreiro', c.nivel, s, n, 'normal', c.nivel, c.boss));
    const vitorias = r.filter((x) => x.venceu);
    return {
      covil: c.id,
      boss: c.boss,
      nivel: c.nivel,
      grupo: n,
      tempoS: mediana(vitorias.map((x) => x.tempoS)),
      vitoriasPct: (100 * vitorias.length) / Math.max(1, r.length),
    };
  });
}
