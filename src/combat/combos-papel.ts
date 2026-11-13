// Marco 40 (13/11/2026, D-163): os combos de papel, a camada genérica dos combos. Usar uma skill de um papel (dano,
// controle, cura, defesa, mobilidade, invocação) até `janelaMs` depois de outra de um papel fecha um combo. O combo muda
// a segunda skill no lançamento (dano, duração do controle, efeitos a mais), e tudo segue pelo caminho normal do golpe.
// O eixo mais forte da segunda skill desdobra o bônus (área espalha, alvos salta, eco repete…). Dados em
// data/combos-papel.json; os combos assinados de cada classe continuam em data/combos.json.

import type { Celula } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import { Leitor } from '../core/validar';
import { vivo, type Entidade } from '../entities/entidade';
import { podeAjudar, podeFerir } from '../modos/relacao';
import { aplicarEfeito } from './efeitos';
import { aplicarEspeciais, lerEspeciais, type EspecialDeCombo } from './combos-especiais';
import { EIXOS, ESTADOS_DE_CONTROLE, PAPEIS, eixoDaForma, type Eixo, type Papel } from './eixos';
import { chebyshev } from './geometria';
import type { Habilidade } from './habilidades';
import { normalizarEfeitos } from './normalizar-efeito';
import { construirEfeito, REGISTRO_EFEITOS, type EfeitoCanonico } from './registro-efeitos';

const CONDICOES = ['alvo_controlado', 'mesmo_alvo', 'abateu'] as const;
type Condicao = (typeof CONDICOES)[number];

export interface ComboDePapel {
  id: string;
  nome: string;
  antes: Papel;
  depois: Papel;
  condicao: Condicao | null;
  texto: string;
  danoPct: number;
  /** Multiplicador em % das durações de controle da segunda skill (100 = igual). */
  controlePct: number;
  /** Multiplicador em % dos escudos da segunda skill. */
  escudoPct: number;
  /** A cura cresce este % por inimigo que a primeira atingiu. */
  curaPorAtingidoPct: number;
  efeitos: readonly EfeitoCanonico[];
  especiais: readonly EspecialDeCombo[];
  visual: string;
}

export interface Desdobramento {
  texto: string;
  raio: number;
  atrasoMs: number;
  pct: number;
  maisMs: number;
  vizinhoDesde: number;
}

export interface CombosDePapel {
  janelaMs: number;
  combos: ReadonlyMap<string, ComboDePapel>;
  desdobramentos: Readonly<Partial<Record<Eixo, Desdobramento>>>;
}

export function lerCombosDePapel(json: unknown): { combosDePapel: CombosDePapel; erros: string[] } {
  const l = new Leitor('combos-papel.json');
  const raiz = l.objeto(json, 'raiz');
  const combos = new Map<string, ComboDePapel>();
  for (const bruto of l.lista(raiz, 'combos')) {
    const o = l.objeto(bruto, 'combo');
    const id = l.texto(o, 'id');
    if (combos.has(id)) l.erro(`combo de papel "${id}" repetido`);
    const n = (k: string, min: number, max: number, padrao: number) => (o[k] === undefined ? padrao : l.numero(o, k, { min, max }));
    combos.set(id, {
      id,
      nome: l.texto(o, 'nome'),
      antes: l.opcao(o, 'antes', PAPEIS),
      depois: l.opcao(o, 'depois', PAPEIS),
      condicao: o.condicao === undefined ? null : l.opcao(o, 'condicao', CONDICOES),
      texto: l.texto(o, 'texto'),
      danoPct: n('danoPct', 0, 200, 0),
      controlePct: n('controlePct', 50, 400, 100),
      escudoPct: n('escudoPct', 50, 400, 100),
      curaPorAtingidoPct: n('curaPorAtingidoPct', 0, 100, 0),
      efeitos: o.efeitos === undefined ? [] : normalizarEfeitos(l.lista(o, 'efeitos'), l),
      especiais: lerEspeciais(l, o, id),
      visual: o.visual === undefined ? 'elo' : l.texto(o, 'visual'),
    });
  }
  const desdobramentos: Partial<Record<Eixo, Desdobramento>> = {};
  const d = l.objeto(raiz.desdobramentos ?? {}, 'desdobramentos');
  for (const [eixo, bruto] of Object.entries(d)) {
    if (!(EIXOS as readonly string[]).includes(eixo)) {
      l.erro(`desdobramento: eixo desconhecido "${eixo}"`);
      continue;
    }
    const x = l.objeto(bruto, `desdobramento ${eixo}`);
    const n = (k: string, padrao: number) => (x[k] === undefined ? padrao : l.numero(x, k, { min: 0, max: 5000 }));
    desdobramentos[eixo as Eixo] = { texto: l.texto(x, 'texto'), raio: n('raio', 1), atrasoMs: n('atrasoMs', 600), pct: n('pct', 30), maisMs: n('maisMs', 300), vizinhoDesde: n('vizinhoDesde', 5) };
  }
  return { combosDePapel: { janelaMs: l.numero(raiz, 'janelaMs', { min: 200, max: 10_000 }), combos, desdobramentos }, erros: l.erros };
}

const temEfeito = (h: Habilidade, pred: (e: EfeitoCanonico) => boolean) => h.efeitos.some(pred);

/** O papel da skill: o do núcleo, ou o que os efeitos dela dizem. */
export function papelDe(h: Habilidade): Papel {
  if (h.papel) return h.papel;
  if (temEfeito(h, (e) => e.tipo === 'invocar' || e.tipo === 'invocar_temporario')) return 'invocacao';
  if (temEfeito(h, (e) => REGISTRO_EFEITOS[e.tipo].deslocaConjurador || e.tipo === 'passo_sombrio')) return 'mobilidade';
  if (!h.formulaDano && (h.formulaCura || temEfeito(h, (e) => e.tipo === 'cura' || e.tipo === 'cura_periodica'))) return 'cura';
  if (!h.formulaDano && temEfeito(h, (e) => REGISTRO_EFEITOS[e.tipo].escudo)) return 'defesa';
  if (temEfeito(h, (e) => e.em === 'alvo' && ESTADOS_DE_CONTROLE.includes(e.tipo) && e.duracaoMs >= 800)) return 'controle';
  return 'dano';
}

/** O eixo mais forte da skill (a forma de maior faixa; sem forma, o primeiro eixo dela). */
export function eixoMaisForte(ctx: ContextoSimulacao, h: Habilidade): { eixo: Eixo; faixa: number } | null {
  const forte = [...(h.formas ?? [])].sort((a, b) => b.faixa - a.faixa)[0];
  if (forte) return { eixo: eixoDaForma(forte.mod), faixa: forte.faixa };
  const e = ctx.conteudo.definicoes.get(h.id)?.eixos?.[0];
  return e ? { eixo: e, faixa: 1 } : null;
}

const controlado = (e: Entidade, tick: number) => e.efeitos.some((f) => f.ateTick > tick && ESTADOS_DE_CONTROLE.includes(f.tipo));

/** O combo que a skill de agora fecha com a anterior, se fecha. */
export function comboDePapelDe(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, hab: Habilidade, alvo: Entidade | null): ComboDePapel | null {
  const u = ator.ultimaDePapel;
  const c = ctx.conteudo.combosDePapel;
  if (!u || u.id === hab.id || estado.tick - u.tick > ticksDe(c.janelaMs)) return null;
  const agora = papelDe(hab);
  for (const k of c.combos.values()) {
    if (k.antes !== u.papel || k.depois !== agora) continue;
    if (k.condicao === 'alvo_controlado' && !(alvo && controlado(alvo, estado.tick))) continue;
    if (k.condicao === 'mesmo_alvo' && !(alvo && u.alvoId === alvo.id)) continue;
    if (k.condicao === 'abateu' && !u.abateu) continue;
    return k;
  }
  return null;
}

const durar = (e: EfeitoCanonico, f: (ms: number) => number): EfeitoCanonico => (e.em !== 'conjurador' && ESTADOS_DE_CONTROLE.includes(e.tipo) ? { ...e, duracaoMs: Math.round(f(e.duracaoMs)) } : e);

/**
 * Lança o combo de papel sobre a skill de agora: devolve a skill mudada (o que segue pelo golpe) e aplica na hora o que
 * não cabe nela (os especiais e o desdobramento nos vizinhos). Sem combo, devolve a skill igual.
 */
export function comComboDePapel(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, hab: Habilidade, alvo: Entidade | null, mira: Celula, saida: EventoSimulacao[]): Habilidade {
  const k = comboDePapelDe(estado, ctx, ator, hab, alvo);
  if (!k) return hab;
  const tick = estado.tick;
  const atingidos = ator.ultimaDePapel?.atingidos ?? 0;
  let h: Habilidade = { ...hab, efeitos: hab.efeitos.map((e) => durar(e, (ms) => (ms * k.controlePct) / 100)) };
  if (k.danoPct > 0) h.multDano = h.multDano * (1 + k.danoPct / 100);
  if (k.curaPorAtingidoPct > 0 && atingidos > 0) h.multCura = h.multCura * (1 + (k.curaPorAtingidoPct * atingidos) / 100);
  if (k.escudoPct !== 100) h.efeitos = h.efeitos.map((e) => (REGISTRO_EFEITOS[e.tipo].escudo ? { ...e, valor: Math.round((e.valor * k.escudoPct) / 100) } : e));
  const extras: EfeitoCanonico[] = [...k.efeitos];
  aplicarEspeciais(estado, ctx, ator, hab, h, k.especiais, extras, alvo, mira, saida);
  h = desdobrar(estado, ctx, ator, h, k, extras, alvo, mira, saida);
  h.efeitos = [...h.efeitos, ...extras];
  saida.push({ t: 'comboFeito', tick, id: ator.id, combo: k.id, alvoId: alvo?.id ?? null, ...(alvo && { x: alvo.x, y: alvo.y }) });
  return h;
}

/** O desdobramento do combo pelo eixo mais forte da skill de agora. */
function desdobrar(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, h: Habilidade, k: ComboDePapel, extras: EfeitoCanonico[], alvo: Entidade | null, mira: Celula, saida: EventoSimulacao[]): Habilidade {
  const forte = eixoMaisForte(ctx, h);
  const d = forte ? ctx.conteudo.combosDePapel.desdobramentos[forte.eixo] : undefined;
  if (!forte || !d) return h;
  const origem = { id: ator.id, x: ator.x, y: ator.y };
  // O que o combo põe no alvo (e, com dano a mais, um golpe pequeno) passa adiante.
  const doAlvo = [...extras.filter((e) => e.em === 'alvo'), ...(k.danoPct > 0 ? [construirEfeito('dano_direto', { valor: Math.max(1, Math.round(k.danoPct / 10)) })] : [])];
  const centro = alvo ?? { x: mira.x, y: mira.y };
  const hostis = estado.entidades.filter((e) => e !== ator && e !== alvo && vivo(e) && podeFerir(ator, e, ctx.modo)).sort((a, b) => chebyshev(a, centro) - chebyshev(b, centro) || (a.id < b.id ? -1 : 1));
  const passar = (quem: readonly Entidade[]) => { for (const e of quem) for (const ef of doAlvo) aplicarEfeito(estado, ctx, e, ef, origem, { x: e.x, y: e.y }, saida); };
  switch (forte.eixo) {
    case 'area': passar(hostis.filter((e) => chebyshev(e, centro) <= d.raio)); break;
    case 'alvos': passar(hostis.filter((e) => chebyshev(e, centro) <= d.raio).slice(0, 1)); break;
    case 'perfuracao': {
      const atras = { x: centro.x + Math.sign(centro.x - ator.x), y: centro.y + Math.sign(centro.y - ator.y) };
      passar(hostis.filter((e) => e.x === atras.x && e.y === atras.y));
      break;
    }
    case 'eco': {
      const eco = doAlvo[0];
      if (eco) extras.push({ ...construirEfeito('efeito_atrasado', { duracaoMs: d.atrasoMs }), interno: { ...eco, valor: Math.max(1, Math.round((eco.valor * d.pct) / 100)), duracaoMs: Math.round((eco.duracaoMs * d.pct) / 100) } });
      break;
    }
    case 'controle': {
      const s = { ...h, efeitos: h.efeitos.map((e) => durar(e, (ms) => ms + d.maisMs)) };
      if (forte.faixa >= d.vizinhoDesde && !s.controleVizinho) s.controleVizinho = { raio: 2, duracaoPct: 50 };
      return s;
    }
    case 'sustento': extras.push({ ...construirEfeito('escudo', { valor: Math.max(2, Math.round((k.danoPct * d.pct) / 100)), duracaoMs: 3000 }), em: 'conjurador' }); break;
    case 'marca': extras.push(construirEfeito('marca_estilo', { valor: 1, pct: 4, duracaoMs: 6000 })); break;
    case 'grupo': {
      const aliado = estado.entidades.filter((e) => e !== ator && vivo(e) && podeAjudar(ator, e, ctx.modo) && !e.invocacao).sort((a, b) => chebyshev(a, ator) - chebyshev(b, ator) || (a.id < b.id ? -1 : 1))[0];
      if (aliado) aplicarEfeito(estado, ctx, aliado, construirEfeito('bonus_dano', { pct: Math.max(5, Math.round((Math.max(k.danoPct, 20) * d.pct) / 100)), duracaoMs: 3000 }), origem, { x: aliado.x, y: aliado.y }, saida);
      break;
    }
    case 'invocacao': extras.push({ ...construirEfeito('comandar_mortos', { pct: 15, duracaoMs: 3000 }), em: 'conjurador' }); break;
  }
  return h;
}
