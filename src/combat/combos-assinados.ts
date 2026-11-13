// Marco 40 (13/11/2026, D-163): os combos assinados das classes — seis por classe, cada um um par de skills de classe
// (a anterior e a de agora, até `janelaMs`). Como os combos de papel, mudam a skill de agora no lançamento (os ajustes
// das leituras de estilo, efeitos a mais, os especiais) e podem agendar etapas internas; o que pede a conjuração (sair
// sem conjuração) entra no início da ação. Quando o assinado fecha, o de papel não entra junto.

import type { Celula } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import { Leitor } from '../core/validar';
import { vivo, type Entidade } from '../entities/entidade';
import { aplicarEfeito } from './efeitos';
import { aplicarEspeciais, lerEspeciais, type EspecialDeCombo } from './combos-especiais';
import { comComboDePapel } from './combos-papel';
import { agendarFase } from './fases';
import type { Habilidade } from './habilidades';
import { ajustar, lerAjustes, type AjustesLeitura } from './leituras';
import { normalizarEfeitos } from './normalizar-efeito';
import type { EfeitoCanonico } from './registro-efeitos';
import { runaDoAtor } from './runas';

const ONDES = ['alvo', 'mira', 'mira_anterior'] as const;

export interface ComboAssinado {
  id: string;
  classe: string;
  nome: string;
  antes: string;
  depois: string;
  /** `mesmo_alvo`: as duas no mesmo alvo. */
  condicao: 'mesmo_alvo' | null;
  texto: string;
  ajustes: AjustesLeitura | null;
  efeitos: readonly EfeitoCanonico[];
  /** Os efeitos em quem a skill anterior atingiu. */
  nosAnteriores: readonly EfeitoCanonico[];
  especiais: readonly EspecialDeCombo[];
  fases: readonly { ref: string; onde: (typeof ONDES)[number]; atrasoMs: number; vezes: number; intervaloMs: number }[];
  semConjuracao: boolean;
}

export function lerAssinados(json: unknown): { assinados: Map<string, ComboAssinado>; erros: string[] } {
  const l = new Leitor('combos-papel.json (assinados)');
  const raiz = l.objeto(json, 'raiz');
  const saida = new Map<string, ComboAssinado>();
  for (const bruto of raiz.assinados === undefined ? [] : l.lista(raiz, 'assinados')) {
    const o = l.objeto(bruto, 'assinado');
    const id = l.texto(o, 'id');
    if (saida.has(id)) l.erro(`combo assinado "${id}" repetido`);
    saida.set(id, {
      id,
      classe: l.texto(o, 'classe'),
      nome: l.texto(o, 'nome'),
      antes: l.texto(o, 'antes'),
      depois: l.texto(o, 'depois'),
      condicao: o.condicao === undefined ? null : l.opcao(o, 'condicao', ['mesmo_alvo'] as const),
      texto: l.texto(o, 'texto'),
      ajustes: o.ajustes === undefined ? null : lerAjustes(l, o.ajustes, id),
      efeitos: o.efeitos === undefined ? [] : normalizarEfeitos(l.lista(o, 'efeitos'), l),
      nosAnteriores: o.nosAnteriores === undefined ? [] : normalizarEfeitos(l.lista(o, 'nosAnteriores'), l),
      especiais: lerEspeciais(l, o, id),
      fases: o.fases === undefined ? [] : l.lista(o, 'fases').map((f) => {
        const x = l.objeto(f, `${id}.fase`);
        const n = (k: string, padrao: number, max: number) => (x[k] === undefined ? padrao : l.numero(x, k, { min: 0, max }));
        return { ref: l.texto(x, 'ref'), onde: l.opcao(x, 'onde', ONDES), atrasoMs: n('atrasoMs', 0, 5000), vezes: n('vezes', 1, 6), intervaloMs: n('intervaloMs', 1000, 5000) };
      }),
      semConjuracao: o.semConjuracao === undefined ? false : l.booleano(o, 'semConjuracao'),
    });
  }
  return { assinados: saida, erros: l.erros };
}

/** O assinado que a skill de agora fecha com a anterior (sem olhar o alvo). */
function assinadoDe(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, habId: string): ComboAssinado | null {
  const u = ator.ultimaDePapel;
  if (!u || estado.tick - u.tick > ticksDe(ctx.conteudo.combosDePapel.janelaMs)) return null;
  for (const k of ctx.conteudo.combosAssinados.values()) if (k.antes === u.id && k.depois === habId) return k;
  return null;
}

/** No início da ação: a skill que fecha um assinado "sem conjuração" sai na hora (0), senão inteira (1). */
export function fatorDeConjuracaoDoCombo(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, hab: Habilidade): number {
  return assinadoDe(estado, ctx, ator, hab.id)?.semConjuracao ? 0 : 1;
}

/** No lançamento: o combo assinado, ou, sem ele, o de papel. Devolve a skill de agora mudada. */
export function comCombosDoLancamento(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, hab: Habilidade, alvo: Entidade | null, mira: Celula, saida: EventoSimulacao[]): Habilidade {
  const k = assinadoDe(estado, ctx, ator, hab.id);
  const u = ator.ultimaDePapel;
  if (!k || !u || (k.condicao === 'mesmo_alvo' && !(alvo && u.alvoId === alvo.id))) return comComboDePapel(estado, ctx, ator, hab, alvo, mira, saida);
  let h: Habilidade = k.ajustes ? ajustar({ ...hab }, k.ajustes) : { ...hab };
  // Marco 39 (D-151): as duas pontas com a mesma runa batem `parComboPct` a mais.
  if (hab.runa && runaDoAtor(ctx, ator, k.antes, estado.tick)?.runa === hab.runa) h.multDano = h.multDano * (1 + ctx.balance.habilidades.runas.parComboPct / 100);
  h = { ...h, efeitos: [...h.efeitos] };
  const extras: EfeitoCanonico[] = [...k.efeitos];
  aplicarEspeciais(estado, ctx, ator, hab, h, k.especiais, extras, alvo, mira, saida);
  const origem = { id: ator.id, x: ator.x, y: ator.y };
  for (const id of u.alvos) {
    const e = estado.entidades.find((x) => x.id === id && vivo(x));
    if (e) for (const ef of k.nosAnteriores) aplicarEfeito(estado, ctx, e, ef, origem, { x: e.x, y: e.y }, saida);
  }
  for (const f of k.fases) {
    const onde = f.onde === 'alvo' && alvo ? alvo : f.onde === 'mira_anterior' ? { x: u.miraX, y: u.miraY } : mira;
    for (let i = 0; i < f.vezes; i++) agendarFase(estado, ator, f.ref, onde, f.atrasoMs + i * f.intervaloMs);
  }
  h.efeitos = [...h.efeitos, ...extras];
  saida.push({ t: 'comboFeito', tick: estado.tick, id: ator.id, combo: k.id, alvoId: alvo?.id ?? null, ...(alvo && { x: alvo.x, y: alvo.y }) });
  return h;
}
