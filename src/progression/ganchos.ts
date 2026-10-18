// Ganchos (marco 18, 17/10/2026, D-069): o formato único com que itens, conjuntos e ressonâncias conversam com o
// combate. Um gancho diz QUANDO (ao acertar, no crítico, ao abater, ao levar golpe, ao gastar o refúgio, ao usar uma
// habilidade, ou passivo), SE (etiqueta, habilidade, elemento, tipo de ataque, estado do alvo e chance) e O QUÊ
// (aplicar um efeito pelo dispatcher único, curar % da vida, devolver mana, ou um passivo que outro sistema consulta).
// Tudo em dados; as chances usam o RNG da simulação (determinístico).

import { ehElemento, type Elemento } from '../combat/elementos';
import type { Habilidade, TipoAtaque } from '../combat/habilidades';
import { normalizarEfeito } from '../combat/normalizar-efeito';
import { construirEfeito, ehTipoEfeito, REGISTRO_EFEITOS, type EfeitoCanonico, type TipoEfeito } from '../combat/registro-efeitos';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { aleatorio } from '../core/rng';
import { Leitor, type Objeto } from '../core/validar';
import { vivo, type Entidade } from '../entities/entidade';

export const MOMENTOS_GANCHO = ['aoAcertar', 'aoCritico', 'aoMatar', 'aoReceberGolpe', 'aoGastarRefugio', 'aoUsarHabilidade', 'aoCruzarInimigo', 'passivo'] as const;
export type MomentoGancho = (typeof MOMENTOS_GANCHO)[number];

export interface CondicaoGancho {
  tag: string | null;
  habilidade: string | null;
  elemento: Elemento | null;
  tipoAtaque: TipoAtaque | null;
  estadoDoAlvo: TipoEfeito | null;
  chancePct: number;
}

/** O que um gancho passivo dá (somado entre todos os ganchos do portador). */
export interface PassivosDeGancho {
  inamovivel: boolean;
  estudoPct: number;
  revelarPct: number;
  desarmarPct: number;
  /** Resistência a todo elemento (`elemento` ausente) ou a um só. */
  resistencias: { elemento: Elemento | null; pct: number }[];
  refugioMaisPct: number;
  buffArmadoPrazoPct: number;
  buffArmadoDuracaoPct: number;
  renascerPct: number;
  /** Escudos recebidos duram e absorvem tanto % a mais. */
  escudoPct: number;
  /** Aliados a até 3 células levam tanto % menos dano (bastião). */
  auraDefesaPct: number;
  /** Potência dos efeitos (soma à da Inteligência). */
  potenciaPct: number;
}

export type EfeitoGancho =
  | { tipo: 'aplicar'; efeito: EfeitoCanonico; em: 'alvo' | 'portador' }
  | { tipo: 'curarPct'; pct: number }
  | { tipo: 'mana'; valor: number }
  /** Nos hostis a até `raio` células do portador. */
  | { tipo: 'aplicarEmVolta'; efeito: EfeitoCanonico; raio: number }
  /** No hostil mais perto do outro lado (o ricochete), a até `raio` células. */
  | { tipo: 'aplicarNoProximo'; efeito: EfeitoCanonico; raio: number }
  /** Tira até `n` efeitos negativos do portador. */
  | { tipo: 'purificar'; n: number }
  /** Aplica no outro o estado do elemento da última magia do portador, se foi há até `janelaMs`. */
  | { tipo: 'herdarElemento'; janelaMs: number }
  | { tipo: 'passivo'; passivo: Partial<PassivosDeGancho> };

export interface Gancho {
  quando: MomentoGancho;
  se: CondicaoGancho;
  efeito: EfeitoGancho;
}

const CONDICAO_LIVRE: CondicaoGancho = { tag: null, habilidade: null, elemento: null, tipoAtaque: null, estadoDoAlvo: null, chancePct: 100 };

export const PASSIVOS_NEUTROS: PassivosDeGancho = {
  inamovivel: false,
  estudoPct: 0,
  revelarPct: 0,
  desarmarPct: 0,
  resistencias: [],
  refugioMaisPct: 0,
  buffArmadoPrazoPct: 0,
  buffArmadoDuracaoPct: 0,
  renascerPct: 0,
  escudoPct: 0,
  auraDefesaPct: 0,
  potenciaPct: 0,
};

function lerCondicao(l: Leitor, v: unknown): CondicaoGancho {
  if (v === undefined) return CONDICAO_LIVRE;
  const o = l.objeto(v, 'se');
  const elemento = o.elemento === undefined ? null : o.elemento;
  if (elemento !== null && !ehElemento(elemento)) l.erro(`gancho: elemento desconhecido ${JSON.stringify(elemento)}`);
  const estado = o.estadoDoAlvo === undefined ? null : o.estadoDoAlvo;
  if (estado !== null && !ehTipoEfeito(estado)) l.erro(`gancho: estado desconhecido ${JSON.stringify(estado)}`);
  return {
    tag: o.tag === undefined ? null : l.texto(o, 'tag'),
    habilidade: o.habilidade === undefined ? null : l.texto(o, 'habilidade'),
    elemento: ehElemento(elemento) ? elemento : null,
    tipoAtaque: o.tipoAtaque === undefined ? null : l.opcao(o, 'tipoAtaque', ['fisico', 'magico'] as const),
    estadoDoAlvo: ehTipoEfeito(estado) ? estado : null,
    chancePct: o.chancePct === undefined ? 100 : l.numero(o, 'chancePct', { min: 0, max: 100 }),
  };
}

function lerPassivo(l: Leitor, o: Objeto): Partial<PassivosDeGancho> {
  const p: Partial<PassivosDeGancho> = {};
  const num = (campo: keyof PassivosDeGancho) => (o[campo] === undefined ? undefined : l.numero(o, campo, { min: -100, max: 300 }));
  if (o.inamovivel !== undefined) p.inamovivel = l.booleano(o, 'inamovivel');
  const campos = [
    'estudoPct', 'revelarPct', 'desarmarPct', 'refugioMaisPct', 'buffArmadoPrazoPct', 'buffArmadoDuracaoPct', 'renascerPct',
    'escudoPct', 'auraDefesaPct', 'potenciaPct',
  ] as const;
  for (const c of campos) {
    const v = num(c);
    if (v !== undefined) p[c] = v;
  }
  if (o.resistenciaPct !== undefined) {
    const elemento = o.elemento === undefined ? null : o.elemento;
    if (elemento !== null && !ehElemento(elemento)) l.erro(`gancho: elemento desconhecido ${JSON.stringify(elemento)}`);
    p.resistencias = [{ elemento: ehElemento(elemento) ? elemento : null, pct: l.numero(o, 'resistenciaPct', { min: -100, max: 100 }) }];
  }
  const conhecidos = new Set<string>([...campos, 'inamovivel', 'resistenciaPct', 'elemento']);
  for (const k of Object.keys(o)) if (!conhecidos.has(k)) l.erro(`gancho passivo: campo desconhecido "${k}"`);
  return p;
}

/** Lê uma lista de ganchos (de item, conjunto ou ressonância); erros vão para o `Leitor`. */
export function lerGanchos(l: Leitor, v: unknown): Gancho[] {
  if (v === undefined) return [];
  const lista = Array.isArray(v) ? v : [];
  if (!Array.isArray(v)) l.erro('ganchos: precisa ser uma lista');
  return lista.flatMap((bruto): Gancho[] => {
    const o = l.objeto(bruto, 'gancho');
    const quando = l.opcao(o, 'quando', MOMENTOS_GANCHO);
    const se = lerCondicao(l, o.se);
    const e = l.objeto(o.efeito, 'efeito');
    let efeito: EfeitoGancho;
    if (quando === 'passivo') efeito = { tipo: 'passivo', passivo: lerPassivo(l, e) };
    else if (e.aplicar !== undefined) {
      const [ef] = normalizarEfeito(e.aplicar, l);
      if (!ef) return [];
      efeito = { tipo: 'aplicar', efeito: ef, em: e.em === undefined ? 'alvo' : l.opcao(e, 'em', ['alvo', 'portador'] as const) };
    } else if (e.aplicarEmVolta !== undefined || e.aplicarNoProximo !== undefined) {
      const campo = e.aplicarEmVolta !== undefined ? 'aplicarEmVolta' : 'aplicarNoProximo';
      const [ef] = normalizarEfeito(e[campo], l);
      if (!ef) return [];
      efeito = { tipo: campo, efeito: ef, raio: e.raio === undefined ? 2 : l.numero(e, 'raio', { min: 1, max: 6, inteiro: true }) };
    } else if (e.purificar !== undefined) efeito = { tipo: 'purificar', n: l.numero(e, 'purificar', { min: 1, max: 5, inteiro: true }) };
    else if (e.herdarElemento !== undefined) efeito = { tipo: 'herdarElemento', janelaMs: l.numero(e, 'herdarElemento', { min: 100, max: 60_000 }) };
    else if (e.curarPct !== undefined) efeito = { tipo: 'curarPct', pct: l.numero(e, 'curarPct', { min: 0, max: 100 }) };
    else if (e.mana !== undefined) efeito = { tipo: 'mana', valor: l.numero(e, 'mana', { min: 0, max: 100, inteiro: true }) };
    else {
      l.erro('gancho: efeito precisa de "aplicar", "aplicarEmVolta", "aplicarNoProximo", "purificar", "herdarElemento", "curarPct" ou "mana"');
      return [];
    }
    return [{ quando, se, efeito }];
  });
}

/** Junta os passivos de uma lista de ganchos. */
export function somarPassivos(ganchos: readonly Gancho[]): PassivosDeGancho {
  const s: PassivosDeGancho = { ...PASSIVOS_NEUTROS, resistencias: [] };
  for (const g of ganchos) {
    if (g.efeito.tipo !== 'passivo') continue;
    const p = g.efeito.passivo;
    if (p.inamovivel) s.inamovivel = true;
    s.estudoPct += p.estudoPct ?? 0;
    s.revelarPct += p.revelarPct ?? 0;
    s.desarmarPct += p.desarmarPct ?? 0;
    s.refugioMaisPct += p.refugioMaisPct ?? 0;
    s.buffArmadoPrazoPct += p.buffArmadoPrazoPct ?? 0;
    s.buffArmadoDuracaoPct += p.buffArmadoDuracaoPct ?? 0;
    s.renascerPct = Math.max(s.renascerPct, p.renascerPct ?? 0);
    s.escudoPct += p.escudoPct ?? 0;
    s.auraDefesaPct = Math.max(s.auraDefesaPct, p.auraDefesaPct ?? 0);
    s.potenciaPct += p.potenciaPct ?? 0;
    s.resistencias.push(...(p.resistencias ?? []));
  }
  return s;
}

/** O que o gancho precisa saber do momento. */
export interface MomentoDoGancho {
  /** O outro lado: o alvo atingido (aoAcertar, aoCritico, aoMatar) ou o agressor (aoReceberGolpe). */
  outro?: Entidade | null;
  hab?: Habilidade | null;
  /** Os estados do outro antes do golpe (o estado que o próprio golpe aplica não conta). */
  estadosDoOutro?: readonly TipoEfeito[];
}

function condicaoVale(c: CondicaoGancho, m: MomentoDoGancho): boolean {
  const h = m.hab ?? null;
  if (c.tag !== null && !h?.tags.includes(c.tag)) return false;
  if (c.habilidade !== null && h?.id !== c.habilidade) return false;
  if (c.elemento !== null && h?.elemento !== c.elemento) return false;
  if (c.tipoAtaque !== null && h?.tipoAtaque !== c.tipoAtaque) return false;
  if (c.estadoDoAlvo !== null && !(m.estadosDoOutro ?? []).includes(c.estadoDoAlvo)) return false;
  return true;
}

/** Quem aplica efeitos: o dispatcher único (injetado, para este módulo não depender do combate inteiro). */
export type AplicarDoGancho = (alvo: Entidade, ef: EfeitoCanonico, portador: Entidade) => void;

/** O que o disparo pede ao mundo (injetado): hostis perto, o estado do elemento da última magia. */
export interface MundoDoGancho {
  aplicar: AplicarDoGancho;
  /** Hostis do portador a até `raio` células de `centro`, do mais perto ao mais longe. */
  hostisPerto: (portador: Entidade, centro: Entidade, raio: number) => Entidade[];
  /** O estado do elemento da última magia do portador, se foi há até `janelaMs` (null: nenhuma). */
  elementoRecente: (portador: Entidade, janelaMs: number) => EfeitoCanonico | null;
}

/**
 * Dispara os ganchos de `portador` no momento. As condições olham a habilidade e o outro lado; a chance sai do RNG da
 * simulação. Efeitos `aplicar` passam pelo dispatcher; a cura e a mana mexem direto no portador.
 */
export function dispararGanchos(
  estado: EstadoJogo,
  ganchos: readonly Gancho[],
  portador: Entidade,
  momento: Exclude<MomentoGancho, 'passivo'>,
  m: MomentoDoGancho,
  mundo: MundoDoGancho,
  saida: EventoSimulacao[],
): void {
  if (!vivo(portador)) return;
  const aplicar = mundo.aplicar;
  for (const g of ganchos) {
    if (g.quando !== momento || !condicaoVale(g.se, m)) continue;
    if (g.se.chancePct < 100 && aleatorio(estado.rng) * 100 >= g.se.chancePct) continue;
    const ef = g.efeito;
    if (ef.tipo === 'aplicar') {
      const alvo = ef.em === 'portador' ? portador : m.outro;
      if (alvo && vivo(alvo)) aplicar(alvo, ef.efeito, portador);
    } else if (ef.tipo === 'aplicarEmVolta') {
      for (const x of mundo.hostisPerto(portador, portador, ef.raio)) aplicar(x, ef.efeito, portador);
    } else if (ef.tipo === 'aplicarNoProximo') {
      const centro = m.outro ?? portador;
      const proximo = mundo.hostisPerto(portador, centro, ef.raio).find((x) => x !== centro && vivo(x));
      if (proximo) aplicar(proximo, ef.efeito, portador);
    } else if (ef.tipo === 'purificar') {
      let n = ef.n;
      portador.efeitos = portador.efeitos.filter((f) => {
        if (n > 0 && !REGISTRO_EFEITOS[f.tipo].positivo && f.ateTick > estado.tick) {
          n--;
          return false;
        }
        return true;
      });
    } else if (ef.tipo === 'herdarElemento') {
      const recente = mundo.elementoRecente(portador, ef.janelaMs);
      if (recente && m.outro && vivo(m.outro)) aplicar(m.outro, recente, portador);
    } else if (ef.tipo === 'curarPct') {
      aplicar(portador, construirEfeito('cura', { valor: Math.max(1, Math.round((portador.hpMax * ef.pct) / 100)) }), portador);
    } else if (ef.tipo === 'mana') {
      const antes = portador.mana;
      portador.mana = Math.min(portador.manaMax, portador.mana + ef.valor);
      if (portador.mana > antes) saida.push({ t: 'efeitoResultado', tick: estado.tick, alvoId: portador.id, origemId: portador.id, tipo: 'recuperar_recurso', dano: 0, cura: 0, mana: portador.mana - antes });
    }
  }
}

/** Fonte dos ganchos de uma entidade (itens equipados, conjuntos e ressonâncias), injetada pelo conteúdo. */
export type FonteDeGanchos = (ctx: ContextoSimulacao, e: Entidade) => readonly Gancho[];
