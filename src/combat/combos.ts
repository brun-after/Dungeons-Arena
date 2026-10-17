// Combos de sequência (marco 18, 17/10/2026, D-068, camada 3 do grimório): usar a habilidade B até `janelaMs` depois da
// A (no mesmo alvo, quando as duas têm alvo) fortalece B — dano a mais (crescendo com a potência da Inteligência), um
// d20 mínimo, efeitos no alvo, em volta de quem lança ou na área mirada. Tudo em data/combos.json.

import type { Celula } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import { Leitor } from '../core/validar';
import { vivo, type Entidade } from '../entities/entidade';
import { podeFerir } from '../modos/relacao';
import type { FonteDeDano } from './dano';
import { aplicarEfeito } from './efeitos';
import { chebyshev } from './geometria';
import type { Habilidade } from './habilidades';
import { normalizarEfeitos } from './normalizar-efeito';
import type { EfeitoCanonico } from './registro-efeitos';

export interface Combo {
  id: string;
  nome: string;
  antes: string;
  depois: string;
  janelaMs: number;
  /** Exige o mesmo alvo (só vale quando as duas habilidades têm alvo). */
  mesmoAlvo: boolean;
  texto: string;
  danoPct: number;
  /** O d20 do golpe não sai abaixo disto (20 = crítico garantido); 0 = sem mínimo. */
  d20Minimo: number;
  noAlvo: EfeitoCanonico[];
  emVolta: { raio: number; efeitos: EfeitoCanonico[] } | null;
  naMira: { raio: number; efeitos: EfeitoCanonico[] } | null;
}

export function lerCombos(json: unknown): { combos: Map<string, Combo>; erros: string[] } {
  const l = new Leitor('combos.json');
  const combos = new Map<string, Combo>();
  for (const bruto of l.lista(l.objeto(json, 'raiz'), 'combos')) {
    const o = l.objeto(bruto, 'combo');
    const id = l.texto(o, 'id');
    const area = (campo: 'emVolta' | 'naMira') => {
      if (o[campo] === undefined) return null;
      const a = l.objeto(o[campo], campo);
      return { raio: l.numero(a, 'raio', { min: 1, max: 6, inteiro: true }), efeitos: normalizarEfeitos(l.lista(a, 'efeitos'), l) };
    };
    if (combos.has(id)) l.erro(`combo "${id}" repetido`);
    combos.set(id, {
      id,
      nome: l.texto(o, 'nome'),
      antes: l.texto(o, 'antes'),
      depois: l.texto(o, 'depois'),
      janelaMs: l.numero(o, 'janelaMs', { min: 200, max: 10_000 }),
      mesmoAlvo: o.mesmoAlvo === undefined ? true : l.booleano(o, 'mesmoAlvo'),
      texto: l.texto(o, 'texto'),
      danoPct: o.danoPct === undefined ? 0 : l.numero(o, 'danoPct', { min: 0, max: 200 }),
      d20Minimo: o.d20Minimo === undefined ? 0 : l.numero(o, 'd20Minimo', { min: 0, max: 20, inteiro: true }),
      noAlvo: o.noAlvo === undefined ? [] : normalizarEfeitos(l.lista(o, 'noAlvo'), l),
      emVolta: area('emVolta'),
      naMira: area('naMira'),
    });
  }
  return { combos, erros: l.erros };
}

/** O que o combo muda no lançamento (null: não houve combo). */
export interface EfeitoDoCombo {
  danoPct: number;
  d20Minimo: number;
}

/**
 * No lançamento de `hab`: se a última habilidade do ator e o tempo fecham um combo, aplica os efeitos dele (no alvo,
 * em volta, na mira), avisa (`comboFeito`) e devolve o bônus para o golpe.
 */
export function fazerCombo(
  estado: EstadoJogo,
  ctx: ContextoSimulacao,
  ator: Entidade,
  hab: Habilidade,
  alvo: Entidade | null,
  mira: Celula,
  saida: EventoSimulacao[],
): EfeitoDoCombo | null {
  const u = ator.ultimaHabilidade;
  if (!u) return null;
  const combo = [...ctx.conteudo.combos.values()].find((c) => c.antes === u.id && c.depois === hab.id);
  if (!combo || estado.tick - u.tick > ticksDe(combo.janelaMs)) return null;
  if (combo.mesmoAlvo && alvo && u.alvoId && u.alvoId !== alvo.id) return null;
  const origem = { id: ator.id, x: ator.x, y: ator.y };
  const aplicar = (x: Entidade, ef: EfeitoCanonico) => {
    aplicarEfeito(estado, ctx, x, ef, origem, { x: x.x, y: x.y }, saida);
  };
  if (alvo && vivo(alvo)) for (const ef of combo.noAlvo) aplicar(alvo, ef);
  const hostis = (centro: Celula, raio: number) =>
    estado.entidades.filter((x) => x !== ator && vivo(x) && chebyshev(x, centro) <= raio && podeFerir(ator, x, ctx.modo));
  if (combo.emVolta) for (const x of hostis(ator, combo.emVolta.raio)) for (const ef of combo.emVolta.efeitos) aplicar(x, ef);
  if (combo.naMira) for (const x of hostis(mira, combo.naMira.raio)) for (const ef of combo.naMira.efeitos) aplicar(x, ef);
  saida.push({ t: 'comboFeito', tick: estado.tick, id: ator.id, combo: combo.id, alvoId: alvo?.id ?? null });
  return { danoPct: combo.danoPct, d20Minimo: combo.d20Minimo };
}

/** A fonte do golpe com o combo: o dano extra cresce com a potência (Inteligência). */
export function comCombo(fonte: FonteDeDano, combo: EfeitoDoCombo | null): FonteDeDano {
  if (!combo) return fonte;
  return {
    ...fonte,
    multDano: fonte.multDano * (1 + (combo.danoPct * fonte.potencia) / 100),
    ...(combo.d20Minimo > 0 && { d20Minimo: combo.d20Minimo }),
  };
}
