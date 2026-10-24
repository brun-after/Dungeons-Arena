// Missões e origens raras (marco 18, 17/10/2026, D-070). Missões contam o que acontece no jogo (abates com certas
// habilidades, reações, refúgios gastos, habilidades no nível máximo) e dão uma recompensa única por personagem.
// Origens raras são drops que só existem numa situação (o chefe morto por fogo, o inimigo morto por estilhaçar nas
// Catacumbas…) e têm chance própria (5%, 20%…). Tudo em dados (data/missoes.json, data/origens.json); as chances
// usam o RNG da simulação.

import { resolverHabilidade } from '../combat/compilar-habilidade';
import { ehElemento, type Elemento } from '../combat/elementos';
import type { Habilidade } from '../combat/habilidades';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { aleatorio, hashTexto, inteiro, criarRng } from '../core/rng';
import { Leitor, type Objeto } from '../core/validar';
import type { Bolsa, Entidade } from '../entities/entidade';
import { largarItem, largarPerto } from '../world/objetos';
import { EFEITOS_OFENSIVOS } from './buffs';
import { ehForma, idItemBase, type FormaItem } from './gerar-item-base';
import { guardarItem } from './inventario';

/** O item de uma recompensa ou origem: um id fixo, ou uma variação de item base (gerada no nível de quem recebe). */
export type ItemDeRecompensa = { id: string } | { base: string; forma: FormaItem; elemento: Elemento | null };

export interface Missao {
  id: string;
  nome: string;
  texto: string;
  conta: { evento: 'abate' | 'sinergia' | 'refugio' | 'duasEscolas'; preset: string | null; tag: string | null; sinergia: string | null };
  meta: number;
  /** A contagem zera ao levar dano e/ou ao começar uma fase nova. */
  zeraAo: ('dano_recebido' | 'fase_nova')[];
  recompensa: ItemDeRecompensa;
}

export interface OrigemRara {
  id: string;
  nome: string;
  texto: string;
  item: ItemDeRecompensa;
  chancePct: number;
  se: {
    chefe: boolean | null;
    nivelMin: number;
    elementoDoGolpe: Elemento | null;
    sinergia: string | null;
    fase: string | null;
    comBuffOfensivo: boolean;
    comEco: boolean;
  };
}

function lerItem(l: Leitor, v: unknown): ItemDeRecompensa {
  const o = l.objeto(v, 'item');
  if (typeof o.id === 'string') return { id: o.id };
  const forma = o.forma;
  const elemento = o.elemento === undefined ? null : o.elemento;
  if (!ehForma(forma)) l.erro(`item: forma desconhecida ${JSON.stringify(forma)}`);
  if (elemento !== null && !ehElemento(elemento)) l.erro(`item: elemento desconhecido ${JSON.stringify(elemento)}`);
  return { base: l.texto(o, 'base'), forma: ehForma(forma) ? forma : 'comum', elemento: ehElemento(elemento) ? elemento : null };
}

export function lerMissoes(json: unknown): { missoes: Map<string, Missao>; erros: string[] } {
  const l = new Leitor('missoes.json');
  const missoes = new Map<string, Missao>();
  for (const bruto of l.lista(l.objeto(json, 'raiz'), 'missoes')) {
    const o = l.objeto(bruto, 'missao');
    const id = l.texto(o, 'id');
    const c: Objeto = l.objeto(o.conta, `${id}.conta`);
    missoes.set(id, {
      id,
      nome: l.texto(o, 'nome'),
      texto: l.texto(o, 'texto'),
      conta: {
        evento: l.opcao(c, 'evento', ['abate', 'sinergia', 'refugio', 'duasEscolas'] as const),
        preset: c.preset === undefined ? null : l.texto(c, 'preset'),
        tag: c.tag === undefined ? null : l.texto(c, 'tag'),
        sinergia: c.sinergia === undefined ? null : l.texto(c, 'sinergia'),
      },
      meta: l.numero(o, 'meta', { min: 1, max: 1000, inteiro: true }),
      zeraAo: o.zeraAo === undefined ? [] : l.listaDeTextos(o, 'zeraAo').filter((z): z is 'dano_recebido' | 'fase_nova' => z === 'dano_recebido' || z === 'fase_nova'),
      recompensa: lerItem(l, o.recompensa),
    });
  }
  return { missoes, erros: l.erros };
}

export function lerOrigens(json: unknown): { origens: Map<string, OrigemRara>; erros: string[] } {
  const l = new Leitor('origens.json');
  const origens = new Map<string, OrigemRara>();
  for (const bruto of l.lista(l.objeto(json, 'raiz'), 'origens')) {
    const o = l.objeto(bruto, 'origem');
    const id = l.texto(o, 'id');
    const se: Objeto = o.se === undefined ? {} : l.objeto(o.se, `${id}.se`);
    const el = se.elementoDoGolpe === undefined ? null : se.elementoDoGolpe;
    if (el !== null && !ehElemento(el)) l.erro(`${id}: elemento desconhecido ${JSON.stringify(el)}`);
    origens.set(id, {
      id,
      nome: l.texto(o, 'nome'),
      texto: l.texto(o, 'texto'),
      item: lerItem(l, o.item),
      chancePct: l.numero(o, 'chancePct', { min: 0.1, max: 100 }),
      se: {
        chefe: se.chefe === undefined ? null : l.booleano(se, 'chefe'),
        nivelMin: se.nivelMin === undefined ? 1 : l.numero(se, 'nivelMin', { min: 1, max: 30, inteiro: true }),
        elementoDoGolpe: ehElemento(el) ? el : null,
        sinergia: se.sinergia === undefined ? null : l.texto(se, 'sinergia'),
        fase: se.fase === undefined ? null : l.texto(se, 'fase'),
        comBuffOfensivo: se.comBuffOfensivo === undefined ? false : l.booleano(se, 'comBuffOfensivo'),
        comEco: se.comEco === undefined ? false : l.booleano(se, 'comEco'),
      },
    });
  }
  return { origens, erros: l.erros };
}

/** O id concreto do item (a variação de item base sai no nível de quem recebe, com semente do momento). */
export function idDaRecompensa(r: ItemDeRecompensa, nivel: number, semente: string): string {
  if ('id' in r) return r.id;
  const rng = criarRng(hashTexto(semente));
  return idItemBase(r.base, r.forma, r.elemento, Math.max(1, Math.min(30, nivel)), inteiro(rng, 0, 0x7fffffff));
}

/** Entrega o item na mochila; sem espaço, cai ao lado. */
function entregar(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, itemId: string, saida: EventoSimulacao[]): void {
  const item = ctx.conteudo.itens.get(itemId);
  if (!item || !e.bolsa) return;
  if (!guardarItem(e.bolsa, item, 1, ctx.balance.inventario)) largarPerto(ctx, e.x, e.y, (x, y) => largarItem(estado, itemId, x, y, saida));
}

const temEco = (h: Habilidade | undefined) => !!h?.efeitos.some((f) => f.tipo === 'efeito_atrasado' && f.interno?.tipo === 'dano_direto');

/** O que a morte conta (lido no momento da queda, antes de a entidade sair do mundo). */
export interface Abate {
  quem: Entidade;
  morto: Entidade;
  golpe: Habilidade | undefined;
}

export function abateDe(ctx: ContextoSimulacao, quem: Entidade, morto: Entidade): Abate {
  const golpe = morto.ultimoGolpe?.fonteId === quem.id ? resolverHabilidade(ctx, morto.ultimoGolpe.chave) : undefined;
  return { quem, morto, golpe };
}

/** Na queda: as origens raras cujas condições batem sorteiam o drop (ao lado do morto). */
export function sortearOrigensRaras(estado: EstadoJogo, ctx: ContextoSimulacao, a: Abate, saida: EventoSimulacao[]): void {
  if (!a.quem.bolsa) return;
  for (const o of ctx.conteudo.origens.values()) {
    const se = o.se;
    if (se.chefe !== null && (a.morto.arquetipo === 'boss') !== se.chefe) continue;
    if (a.morto.nivel < se.nivelMin) continue;
    if (se.elementoDoGolpe !== null && a.golpe?.elemento !== se.elementoDoGolpe) continue;
    if (se.sinergia !== null && a.morto.ultimaSinergia !== se.sinergia) continue;
    if (se.fase !== null && estado.faseId !== se.fase) continue;
    if (se.comBuffOfensivo && !a.quem.efeitos.some((f) => f.ateTick > estado.tick && EFEITOS_OFENSIVOS.has(f.tipo))) continue;
    if (se.comEco && !temEco(a.golpe)) continue;
    if (aleatorio(estado.rng) * 100 >= o.chancePct) continue;
    const itemId = idDaRecompensa(o.item, a.quem.nivel, `${o.id}:${estado.tick}:${a.morto.id}`);
    largarPerto(ctx, a.morto.x, a.morto.y, (x, y) => largarItem(estado, itemId, x, y, saida));
    saida.push({ t: 'origemRara', tick: estado.tick, id: a.quem.id, origem: o.id, itemId });
  }
}

/** A contagem de uma missão (as que zeram por fase guardam a fase na chave). */
function chave(m: Missao, faseId: string): string {
  return m.zeraAo.includes('fase_nova') ? `${m.id}@${faseId}` : m.id;
}

function avancar(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, m: Missao, n: number, saida: EventoSimulacao[]): void {
  const bolsa = e.bolsa;
  if (!bolsa || bolsa.missoesConcluidas.includes(m.id)) return;
  const k = chave(m, estado.faseId);
  const valor = (bolsa.missoes[k] ?? 0) + n;
  bolsa.missoes[k] = valor;
  if (valor < m.meta) return;
  bolsa.missoesConcluidas.push(m.id);
  bolsa.missoes = semChaves(bolsa.missoes, (k) => k === m.id || k.startsWith(`${m.id}@`));
  const itemId = idDaRecompensa(m.recompensa, e.nivel, `${m.id}:${e.id}`);
  entregar(estado, ctx, e, itemId, saida);
  saida.push({ t: 'missaoConcluida', tick: estado.tick, id: e.id, missao: m.id, itemId });
}

/** Cópia sem as chaves que o filtro aponta (sem `delete` dinâmico). */
function semChaves(o: Record<string, number>, tirar: (k: string) => boolean): Record<string, number> {
  return Object.fromEntries(Object.entries(o).filter(([k]) => !tirar(k)));
}

/** Duas escolas: uma habilidade da classe e outra de fora dela, as duas no nível máximo. */
function duasEscolas(ctx: ContextoSimulacao, bolsa: Bolsa): boolean {
  const classe = ctx.conteudo.classes.get(bolsa.classeId);
  if (!classe) return false;
  const daClasse = new Set(classe.exclusivas);
  const max = bolsa.conhecidas.filter((c) => c.rank >= ctx.balance.habilidades.rankMax);
  return max.some((c) => daClasse.has(c.id)) && max.some((c) => !daClasse.has(c.id));
}

/** Etapa do tick: as missões leem os eventos deste tick. */
export function processarMissoes(estado: EstadoJogo, ctx: ContextoSimulacao, eventos: readonly EventoSimulacao[], abates: readonly Abate[], saida: EventoSimulacao[]): void {
  if (ctx.conteudo.missoes.size === 0) return;
  for (const e of estado.entidades) {
    const bolsa = e.bolsa;
    if (!bolsa) continue;
    for (const m of ctx.conteudo.missoes.values()) {
      if (bolsa.missoesConcluidas.includes(m.id)) continue;
      if (m.zeraAo.includes('dano_recebido') && eventos.some((ev) => ev.t === 'impacto' && ev.alvoId === e.id && ev.dano > 0)) {
        const k = chave(m, estado.faseId);
        bolsa.missoes = semChaves(bolsa.missoes, (x) => x === k);
        continue;
      }
      const c = m.conta;
      let n = 0;
      if (c.evento === 'abate') {
        n = abates.filter((a) => a.quem === e && (c.preset === null || a.morto.preset === c.preset) && (c.tag === null || !!a.golpe?.tags.includes(c.tag))).length;
      } else if (c.evento === 'sinergia') {
        n = eventos.filter((ev) => ev.t === 'impacto' && ev.fonteId === e.id && c.sinergia !== null && ev.sinergias.includes(c.sinergia)).length;
      } else if (c.evento === 'refugio') {
        n = eventos.filter((ev) => ev.t === 'refugioUsado' && ev.id === e.id).length;
      } else if (eventos.some((ev) => (ev.t === 'habilidadeMudou' || ev.t === 'estudoConcluido') && ev.id === e.id) && duasEscolas(ctx, bolsa)) {
        n = m.meta;
      }
      if (n > 0) avancar(estado, ctx, e, m, n, saida);
    }
  }
}
