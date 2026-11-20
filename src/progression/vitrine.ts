// A vitrine de armadura das lojas (marco 47, 20/11/2026, D-190). Puro.
//
// O ferreiro (e a loja sem ofício da campanha) mostra, além da lista fixa, peças de armadura geradas (`gi_`, marco 17)
// com o perfil do marco 46 (propósito, estilo, grau, elemento e efeitos). A vitrine nasce da semente da loja e da
// RODADA: no Mundo, a sala posta no objeto o dia do ciclo (a vila) ou a semana (a dungeon), com o nível do lugar; fora
// dele, a rodada conta em ticks, um ciclo do dia do Mundo por rodada, e o nível é o dos inimigos da fase. Não usa o RNG
// do combate: cliente e servidor chegam à mesma vitrine. Pelo menos uma peça de cada propósito, quando cabe.
// O preço da peça sobe com a raridade, o grau e o número de efeitos (`precoDaPeca`). Tudo em data/lojas.json.

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo, ObjetoNoMundo } from '../core/estado';
import { aleatorio, criarRng, hashTexto, inteiro, type EstadoRng } from '../core/rng';
import { ticksDe } from '../core/tempo';
import { Leitor } from '../core/validar';
import { RARIDADES, type Raridade } from '../modos/modo';
import { duracaoDoCiclo } from '../mundo/ciclo';
import { ehPecaDeArmadura } from './graus';
import { ehCatalogoDeItens, idItemGerado } from './gerar-item';
import type { Item } from './itens';

export interface PerfilDeVitrine {
  quantidade: number;
  /** O nível de cada peça: o da loja mais um sorteio entre [min, max]. */
  folgaNivel: readonly [number, number];
  pesoRaridade: Readonly<Record<Raridade, number>>;
  /** Teto de sorteios (a garantia de propósitos pode recusar alguns). */
  tentativas: number;
}

export interface RegrasDeLoja {
  /** Os ofícios (`ref` da loja) com vitrine; `semOficio`: também a loja sem ref (a da campanha). */
  oficios: readonly string[];
  semOficio: boolean;
  /** O perfil das lojas que a sala não marcou (a campanha). */
  perfilPadrao: string;
  /** O perfil da loja semanal das dungeons do Mundo. */
  perfilDungeon: string;
  perfis: ReadonlyMap<string, PerfilDeVitrine>;
  preco: { multRaridade: Readonly<Record<Raridade, number>>; porGrauPct: number; porEfeitoPct: number };
}

export function lerLojas(json: unknown): { lojas: RegrasDeLoja; erros: string[] } {
  const l = new Leitor('lojas.json');
  const o = l.objeto(json, 'raiz');
  const porRaridade = (v: unknown, campo: string) => {
    const r = l.objeto(v, campo);
    return Object.fromEntries(RARIDADES.map((x) => [x, l.numero(r, x, { min: 0 })])) as Record<Raridade, number>;
  };
  const perfis = new Map<string, PerfilDeVitrine>();
  const p = l.objeto(o.perfis, 'perfis');
  for (const [id, v] of Object.entries(p)) {
    const x = l.objeto(v, `perfis.${id}`);
    const folga = l.lista(x, 'folgaNivel').filter((n): n is number => typeof n === 'number' && Number.isInteger(n));
    const [min = 0, max = 0] = folga;
    if (folga.length !== 2 || min > max) l.erro(`perfis.${id}.folgaNivel: [min, max] inteiros`);
    const pesoRaridade = porRaridade(x.pesoRaridade, `perfis.${id}.pesoRaridade`);
    if (RARIDADES.every((r) => pesoRaridade[r] <= 0)) l.erro(`perfis.${id}.pesoRaridade: algum peso acima de 0`);
    perfis.set(id, {
      quantidade: l.numero(x, 'quantidade', { min: 1, max: 40, inteiro: true }),
      folgaNivel: [min, max],
      pesoRaridade,
      tentativas: l.numero(x, 'tentativas', { min: 1, max: 1000, inteiro: true }),
    });
  }
  const perfilPadrao = l.texto(o, 'perfilPadrao');
  const perfilDungeon = l.texto(o, 'perfilDungeon');
  for (const x of [perfilPadrao, perfilDungeon]) if (!perfis.has(x)) l.erro(`perfil "${x}" não existe em perfis`);
  const pr = l.objeto(o.preco, 'preco');
  return {
    lojas: {
      oficios: l.listaDeTextos(o, 'oficios'),
      semOficio: l.booleano(o, 'semOficio'),
      perfilPadrao,
      perfilDungeon,
      perfis,
      preco: { multRaridade: porRaridade(pr.multRaridade, 'preco.multRaridade'), porGrauPct: l.numero(pr, 'porGrauPct', { min: 0 }), porEfeitoPct: l.numero(pr, 'porEfeitoPct', { min: 0 }) },
    },
    erros: l.erros,
  };
}

/** O que basta para sortear: a semente da loja, a rodada, o nível e o perfil. */
export interface AlvoDaVitrine {
  semente: string;
  rodada: number;
  nivel: number;
  perfil: PerfilDeVitrine;
}

/** A loja tem vitrine pelo ofício? (a sala do Mundo marca as dela; esta é a regra das que ela não marca) */
export const oficioComVitrine = (r: RegrasDeLoja, loja: Pick<ObjetoNoMundo, 'ref'>): boolean => (loja.ref === null ? r.semOficio : r.oficios.includes(loja.ref));

/** O período da rodada fora do Mundo, em ticks: um ciclo do dia do Mundo. */
export const periodoDaRodada = (ctx: ContextoSimulacao): number => Math.max(1, ticksDe(duracaoDoCiclo(ctx.balance.mundo.ciclo)));

const deslocamentoDaLoja = (estado: EstadoJogo, loja: ObjetoNoMundo, periodo: number): number => hashTexto(`${estado.faseId}/${loja.objetoId}/vitrine`) % periodo;

/** Quantos ticks faltam para a vitrine renovar (null: a rodada vem da sala do Mundo, pelo relógio). */
export function ticksAteRenovar(estado: EstadoJogo, ctx: ContextoSimulacao, loja: ObjetoNoMundo): number | null {
  if (loja.vitrine !== undefined || ctx.fase.exterior) return null;
  const periodo = periodoDaRodada(ctx);
  return periodo - ((estado.tick + deslocamentoDaLoja(estado, loja, periodo)) % periodo);
}

/** O nível da fase para a vitrine: a média dos níveis dos inimigos (1 sem inimigos). */
function nivelDaFase(ctx: ContextoSimulacao): number {
  const lista = ctx.fase.inimigos;
  if (lista.length === 0) return 1;
  return Math.max(1, Math.round(lista.reduce((s, i) => s + (i.nivel ?? 1), 0) / lista.length));
}

/** O alvo da vitrine desta loja agora (null: a loja não tem vitrine, ou a sala ainda não postou a rodada). */
export function alvoDaVitrine(estado: EstadoJogo, ctx: ContextoSimulacao, loja: ObjetoNoMundo): AlvoDaVitrine | null {
  const r = ctx.conteudo.lojas;
  const semente = `${estado.faseId}/${loja.objetoId}`;
  if (loja.vitrine !== undefined) {
    const perfil = r.perfis.get(loja.vitrine);
    return perfil && loja.rodadaVitrine !== undefined ? { semente, rodada: loja.rodadaVitrine, nivel: loja.nivelVitrine ?? 1, perfil } : null;
  }
  // O exterior do Mundo espera a sala (ela marca as lojas da vila a cada segundo).
  if (ctx.fase.exterior || !oficioComVitrine(r, loja)) return null;
  const perfil = r.perfis.get(r.perfilPadrao);
  if (!perfil) return null;
  const periodo = periodoDaRodada(ctx);
  return { semente, rodada: Math.floor((estado.tick + deslocamentoDaLoja(estado, loja, periodo)) / periodo), nivel: nivelDaFase(ctx), perfil };
}

function raridadePorPeso(rng: EstadoRng, pesos: Readonly<Record<Raridade, number>>): Raridade {
  const total = RARIDADES.reduce((s, r) => s + Math.max(0, pesos[r]), 0);
  let sorteio = aleatorio(rng) * total;
  for (const r of RARIDADES) {
    sorteio -= Math.max(0, pesos[r]);
    if (pesos[r] > 0 && sorteio < 0) return r;
  }
  return RARIDADES.find((r) => pesos[r] > 0) ?? 'comum';
}

/**
 * As peças da vitrine (ids `gi_`), determinísticas pelo alvo. Cada sorteio escolhe a raridade pelo peso, uma base de
 * armadura e o nível; a garantia recusa um propósito repetido quando as vagas que sobram só bastam para os que faltam.
 */
export function sortearVitrine(ctx: ContextoSimulacao, alvo: AlvoDaVitrine): string[] {
  const itens = ctx.conteudo.itens;
  if (!ehCatalogoDeItens(itens)) return [];
  const regras = itens.regrasDeItem;
  const bases = [...itens.basesDeItem.bases.values()].filter((b) => ehPecaDeArmadura(b.slot)).map((b) => b.base);
  if (bases.length === 0) return [];
  const rng = criarRng(hashTexto(`vitrine:${alvo.semente}:${alvo.rodada}`));
  const faltam = new Set(ctx.conteudo.pecas.propositos.keys());
  const { perfil } = alvo;
  const saida: string[] = [];
  for (let i = 0; i < perfil.tentativas && saida.length < perfil.quantidade; i++) {
    const raridade = raridadePorPeso(rng, perfil.pesoRaridade);
    const base = bases[inteiro(rng, 0, bases.length - 1)] ?? bases[0] ?? '';
    const nivel = Math.max(1, Math.min(regras.nivelMax, alvo.nivel + inteiro(rng, perfil.folgaNivel[0], perfil.folgaNivel[1])));
    const id = idItemGerado(base, nivel, raridade, inteiro(rng, 0, 0x7fffffff));
    const proposito = itens.get(id)?.peca?.proposito;
    if (!proposito || saida.includes(id)) continue;
    const vagas = perfil.quantidade - saida.length;
    if (!faltam.has(proposito) && vagas <= faltam.size) continue;
    faltam.delete(proposito);
    saida.push(id);
  }
  return saida;
}

/** A vitrine desta loja agora (vazia quando ela não tem). */
export function vitrineDaLoja(estado: EstadoJogo, ctx: ContextoSimulacao, loja: ObjetoNoMundo): string[] {
  const alvo = alvoDaVitrine(estado, ctx, loja);
  return alvo ? sortearVitrine(ctx, alvo) : [];
}

/** O preço-base de uma peça de armadura: o valor do item pela raridade, pelo grau e pelos efeitos. */
export function precoDaPeca(r: RegrasDeLoja, item: Item): number {
  if (!item.peca) return item.valorBase;
  const p = r.preco;
  const mult = p.multRaridade[item.raridade] * (1 + (p.porGrauPct * item.peca.grau) / 100) * (1 + (p.porEfeitoPct * item.peca.efeitos.length) / 100);
  return Math.round(item.valorBase * mult);
}
