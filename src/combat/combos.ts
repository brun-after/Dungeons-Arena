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
import { ehTipoEfeito, type EfeitoCanonico, type TipoEfeito } from './registro-efeitos';

/** O que um combo ou uma regra de buff faz no lançamento. */
export interface BonusDeLancamento {
  danoPct: number;
  /** O d20 do golpe não sai abaixo disto (20 = crítico garantido); 0 = sem mínimo. */
  d20Minimo: number;
  noAlvo: EfeitoCanonico[];
  /** Marco 18 (camada 6): em quem lança (o escudo do Curar sob o refúgio). */
  noProprio: EfeitoCanonico[];
  emVolta: { raio: number; efeitos: EfeitoCanonico[] } | null;
  naMira: { raio: number; efeitos: EfeitoCanonico[] } | null;
}

/** Marco 18 (D-068, camada 6): com o buff ativo, a habilidade (ou a etiqueta) ganha o bônus. */
export interface RegraDeBuff extends BonusDeLancamento {
  id: string;
  nome: string;
  buff: TipoEfeito;
  habilidade: string | null;
  tag: string | null;
  texto: string;
}

export interface Combo extends BonusDeLancamento {
  id: string;
  nome: string;
  antes: string;
  depois: string;
  janelaMs: number;
  /** Exige o mesmo alvo (só vale quando as duas habilidades têm alvo). */
  mesmoAlvo: boolean;
  texto: string;
}

function lerBonus(l: Leitor, o: Record<string, unknown>): BonusDeLancamento {
  const area = (campo: 'emVolta' | 'naMira') => {
    if (o[campo] === undefined) return null;
    const a = l.objeto(o[campo], campo);
    return { raio: l.numero(a, 'raio', { min: 1, max: 6, inteiro: true }), efeitos: normalizarEfeitos(l.lista(a, 'efeitos'), l) };
  };
  return {
    danoPct: o.danoPct === undefined ? 0 : l.numero(o, 'danoPct', { min: 0, max: 200 }),
    d20Minimo: o.d20Minimo === undefined ? 0 : l.numero(o, 'd20Minimo', { min: 0, max: 20, inteiro: true }),
    noAlvo: o.noAlvo === undefined ? [] : normalizarEfeitos(l.lista(o, 'noAlvo'), l),
    noProprio: o.noProprio === undefined ? [] : normalizarEfeitos(l.lista(o, 'noProprio'), l),
    emVolta: area('emVolta'),
    naMira: area('naMira'),
  };
}

export function lerRegrasDeBuff(json: unknown): { regras: Map<string, RegraDeBuff>; erros: string[] } {
  const l = new Leitor('interacoes-buff.json');
  const regras = new Map<string, RegraDeBuff>();
  for (const bruto of l.lista(l.objeto(json, 'raiz'), 'regras')) {
    const o = l.objeto(bruto, 'regra');
    const id = l.texto(o, 'id');
    const buff = l.texto(o, 'buff');
    if (!ehTipoEfeito(buff)) l.erro(`${id}: buff desconhecido "${buff}"`);
    if (regras.has(id)) l.erro(`regra "${id}" repetida`);
    regras.set(id, {
      id,
      nome: l.texto(o, 'nome'),
      buff: ehTipoEfeito(buff) ? buff : 'bonus_dano',
      habilidade: o.habilidade === undefined ? null : l.texto(o, 'habilidade'),
      tag: o.tag === undefined ? null : l.texto(o, 'tag'),
      texto: l.texto(o, 'texto'),
      ...lerBonus(l, o),
    });
  }
  return { regras, erros: l.erros };
}

export function lerCombos(json: unknown): { combos: Map<string, Combo>; erros: string[] } {
  const l = new Leitor('combos.json');
  const combos = new Map<string, Combo>();
  for (const bruto of l.lista(l.objeto(json, 'raiz'), 'combos')) {
    const o = l.objeto(bruto, 'combo');
    const id = l.texto(o, 'id');
    if (combos.has(id)) l.erro(`combo "${id}" repetido`);
    combos.set(id, {
      id,
      nome: l.texto(o, 'nome'),
      antes: l.texto(o, 'antes'),
      depois: l.texto(o, 'depois'),
      janelaMs: l.numero(o, 'janelaMs', { min: 200, max: 10_000 }),
      mesmoAlvo: o.mesmoAlvo === undefined ? true : l.booleano(o, 'mesmoAlvo'),
      texto: l.texto(o, 'texto'),
      ...lerBonus(l, o),
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
  let total: EfeitoDoCombo | null = null;
  const somar = (b: BonusDeLancamento) => {
    aplicarBonus(estado, ctx, ator, b, alvo, mira, saida);
    total = { danoPct: (total?.danoPct ?? 0) + b.danoPct, d20Minimo: Math.max(total?.d20Minimo ?? 0, b.d20Minimo) };
  };
  const u = ator.ultimaHabilidade;
  const combo = u ? [...ctx.conteudo.combos.values()].find((c) => c.antes === u.id && c.depois === hab.id) : undefined;
  if (u && combo && estado.tick - u.tick <= ticksDe(combo.janelaMs) && !(combo.mesmoAlvo && alvo && u.alvoId && u.alvoId !== alvo.id)) {
    somar(combo);
    saida.push({ t: 'comboFeito', tick: estado.tick, id: ator.id, combo: combo.id, alvoId: alvo?.id ?? null });
  }
  // Marco 18 (camada 6): com o buff certo ativo, a habilidade ganha o bônus da regra.
  for (const r of ctx.conteudo.regrasDeBuff.values()) {
    if (r.habilidade !== null && r.habilidade !== hab.id) continue;
    if (r.tag !== null && !hab.tags.includes(r.tag)) continue;
    if (!ator.efeitos.some((f) => f.tipo === r.buff && f.ateTick > estado.tick)) continue;
    somar(r);
    saida.push({ t: 'buffInteragiu', tick: estado.tick, id: ator.id, regra: r.id });
  }
  return total;
}

function aplicarBonus(
  estado: EstadoJogo,
  ctx: ContextoSimulacao,
  ator: Entidade,
  b: BonusDeLancamento,
  alvo: Entidade | null,
  mira: Celula,
  saida: EventoSimulacao[],
): void {
  const origem = { id: ator.id, x: ator.x, y: ator.y };
  const aplicar = (x: Entidade, ef: EfeitoCanonico) => {
    aplicarEfeito(estado, ctx, x, ef, origem, { x: x.x, y: x.y }, saida);
  };
  if (alvo && vivo(alvo)) for (const ef of b.noAlvo) aplicar(alvo, ef);
  for (const ef of b.noProprio) aplicar(ator, ef);
  const hostis = (centro: Celula, raio: number) =>
    estado.entidades.filter((x) => x !== ator && vivo(x) && chebyshev(x, centro) <= raio && podeFerir(ator, x, ctx.modo));
  if (b.emVolta) for (const x of hostis(ator, b.emVolta.raio)) for (const ef of b.emVolta.efeitos) aplicar(x, ef);
  if (b.naMira) for (const x of hostis(mira, b.naMira.raio)) for (const ef of b.naMira.efeitos) aplicar(x, ef);
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
