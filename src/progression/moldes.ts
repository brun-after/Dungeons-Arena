// Marco 51 (21/11/2026, D-197): a forja aprofundada. As receitas viram loot (o item `receita_<id>`), que cai das
// criaturas pela dimensão, pelo preset ou pelo chefe, e o jogador leva ao ferreiro. Toda receita parte de uma peça
// pronta (a base: o slot e, na arma, a família) e pede mais materiais, às vezes uma segunda peça e uma runa elemental. O
// resultado é a própria base transformada: a Última forma (ascender), a fusão com o elemento (`fu_`) e os materiais já
// engastados (`en_`), sem passar dos engastes da peça. No ferreiro, sem receita, também se engasta, extrai e refunde.
// Tudo por comando, com a loja do ferreiro aberta (ou a da campanha). Puro.

import { ehElemento, type Elemento } from '../combat/elementos';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { aleatorio, inteiro, type EstadoRng } from '../core/rng';
import { Leitor } from '../core/validar';
import type { Entidade, ItemNaMochila } from '../entities/entidade';
import { RARIDADES, SLOTS_DE_EQUIPAMENTO, type Raridade, type Slot } from '../modos/modo';
import { FAMILIAS_DE_ARMA, type FamiliaDeArma } from './armas';
import { engastavel, engastesDaPeca, idEngastado, semEngastes } from './engaste';
import { ehIdFundido, idFundido } from './fusao-elemental';
import { idItemBase, lerIdItemBase } from './gerar-item-base';
import { guardarItem, recusarItem } from './inventario';
import type { Item } from './itens';
import { lojaAberta } from './loja';

export const PREFIXO_RECEITA = 'receita_';

export interface ExigenciaDePeca {
  slot: Slot;
  /** Na arma, a família (lâmina, arco, tomo, cajado, arremesso); null = qualquer. */
  familia: FamiliaDeArma | null;
  /** A raridade mínima da peça. */
  raridadeMin: Raridade;
}

export interface Molde {
  id: string;
  nome: string;
  texto: string;
  /** I a V: quanto mais alto, mais rara a receita e mais caro o trabalho. */
  grau: number;
  base: ExigenciaDePeca;
  /** A segunda peça consumida (null = nenhuma). */
  segunda: ExigenciaDePeca | null;
  materiais: readonly { item: string; qtd: number }[];
  /** A runa elemental pedida (o item `runa_<elemento>`). */
  runa: Elemento | null;
  ouro: number;
  resultado: { ascender: boolean; elemento: Elemento | null; grauFusao: number; engastes: readonly string[] };
  /** De onde a receita cai. */
  cai: { dimensoes: readonly string[]; presets: readonly string[]; chefes: boolean };
}

export function lerMoldes(json: unknown, itens: ReadonlySet<string>, materiais: ReadonlySet<string>): { moldes: Map<string, Molde>; erros: string[] } {
  const l = new Leitor('forja.json (moldes)');
  const moldes = new Map<string, Molde>();
  const raiz = l.objeto(json, 'raiz');
  if (raiz.moldes === undefined) return { moldes, erros: [] };
  const exigencia = (v: unknown, onde: string): ExigenciaDePeca => {
    const o = l.objeto(v, onde);
    return {
      slot: l.opcao(o, 'slot', SLOTS_DE_EQUIPAMENTO),
      familia: o.familia === undefined ? null : l.opcao(o, 'familia', FAMILIAS_DE_ARMA),
      raridadeMin: o.raridadeMin === undefined ? 'comum' : l.opcao(o, 'raridadeMin', RARIDADES),
    };
  };
  for (const bruto of l.lista(raiz, 'moldes')) {
    const o = l.objeto(bruto, 'molde');
    const id = l.texto(o, 'id');
    const r = l.objeto(o.resultado, `${id}.resultado`);
    const el = r.elemento;
    if (el !== undefined && !ehElemento(el)) l.erro(`${id}: elemento desconhecido`);
    const runa = o.runa;
    if (runa !== undefined && !ehElemento(runa)) l.erro(`${id}: runa desconhecida`);
    const engastes = r.engastes === undefined ? [] : l.listaDeTextos(r, 'engastes');
    for (const m of engastes) if (!materiais.has(m)) l.erro(`${id}: material de engaste desconhecido "${m}"`);
    const mats = (o.materiais === undefined ? [] : l.lista(o, 'materiais')).map((x) => {
      const m = l.objeto(x, 'materiais[]');
      return { item: l.texto(m, 'item'), qtd: m.qtd === undefined ? 1 : l.numero(m, 'qtd', { min: 1, max: 9, inteiro: true }) };
    });
    for (const m of mats) if (!itens.has(m.item)) l.erro(`${id}: item desconhecido "${m.item}"`);
    if (!itens.has(`${PREFIXO_RECEITA}${id}`)) l.erro(`${id}: falta o item "${PREFIXO_RECEITA}${id}"`);
    const c = o.cai === undefined ? {} : l.objeto(o.cai, `${id}.cai`);
    moldes.set(id, {
      id,
      nome: l.texto(o, 'nome'),
      texto: l.texto(o, 'texto'),
      grau: l.numero(o, 'grau', { min: 1, max: 5, inteiro: true }),
      base: exigencia(o.base, `${id}.base`),
      segunda: o.segunda === undefined ? null : exigencia(o.segunda, `${id}.segunda`),
      materiais: mats,
      runa: ehElemento(runa) ? runa : null,
      ouro: o.ouro === undefined ? 0 : l.numero(o, 'ouro', { min: 0, max: 100_000, inteiro: true }),
      resultado: {
        ascender: r.ascender === true,
        elemento: ehElemento(el) ? el : null,
        grauFusao: r.grauFusao === undefined ? 1 : l.numero(r, 'grauFusao', { min: 1, max: 3, inteiro: true }),
        engastes,
      },
      cai: {
        dimensoes: c.dimensoes === undefined ? [] : l.listaDeTextos(c, 'dimensoes'),
        presets: c.presets === undefined ? [] : l.listaDeTextos(c, 'presets'),
        chefes: c.chefes === true,
      },
    });
  }
  return { moldes, erros: l.erros };
}

type Ctx = Pick<ContextoSimulacao, 'conteudo' | 'balance'>;

/** A peça atende à exigência? */
export function atende(ctx: Ctx, item: Item | undefined, x: ExigenciaDePeca): boolean {
  if (!engastavel(item) || item.slotPadrao !== x.slot) return false;
  if (RARIDADES.indexOf(item.raridade) < RARIDADES.indexOf(x.raridadeMin)) return false;
  if (x.familia === null) return true;
  return !!item.arma && ctx.conteudo.armas.familias.get(item.arma) === x.familia;
}

/** O id que a receita dá a partir da peça base (null quando não fecha). */
export function resultadoDoMolde(ctx: Ctx, m: Molde, baseId: string): string | null {
  const { base, materiais } = semEngastes(baseId);
  let id = base;
  if (m.resultado.ascender) {
    const p = lerIdItemBase(id);
    if (p?.forma !== 'lendaria') return null;
    id = idItemBase(p.base, 'ultima', p.elemento, p.nivel, p.semente);
  }
  if (m.resultado.elemento && !ehIdFundido(id)) id = idFundido(m.resultado.elemento, m.resultado.grauFusao, id);
  const item = ctx.conteudo.itens.get(id);
  if (!engastavel(item)) return null;
  const todos = [...materiais, ...m.resultado.engastes].slice(0, engastesDaPeca(item, ctx.balance.engaste));
  if (todos.length > 0) id = idEngastado(todos, id);
  return ctx.conteudo.itens.get(id) ? id : null;
}

const quantidade = (e: Entidade, itemId: string): number => (e.bolsa?.mochila ?? []).filter((i) => i.itemId === itemId).reduce((s, i) => s + i.qtd, 0);

function gastarItem(e: Entidade, itemId: string, qtd: number): void {
  const bolsa = e.bolsa;
  if (!bolsa) return;
  let resta = qtd;
  for (const i of bolsa.mochila) {
    if (i.itemId !== itemId || resta === 0) continue;
    const tira = Math.min(resta, i.qtd);
    i.qtd -= tira;
    resta -= tira;
  }
  bolsa.mochila = bolsa.mochila.filter((i) => i.qtd > 0);
}

/** A forja do ferreiro está aberta? (o ferreiro do Mundo, ou a loja da campanha, sem papel) */
export function ferreiroAberto(estado: EstadoJogo, e: Entidade): boolean {
  const loja = lojaAberta(estado, e);
  return !!loja && (loja.ref === 'ferreiro' || loja.ref === null);
}

export type MotivoForja = 'loja_fechada' | 'nao_encontrado' | 'sem_ouro' | 'sem_material' | 'slot_invalido';

/** Por que não dá para forjar com esta receita (null = dá). */
export function motivoDoMolde(estado: EstadoJogo, ctx: Ctx, e: Entidade, receitaInvId: string, baseInvId: string, segundaInvId: string | null): { motivo: MotivoForja } | { molde: Molde; base: ItemNaMochila; segunda: ItemNaMochila | null; resultado: string } {
  const bolsa = e.bolsa;
  if (!bolsa || !ferreiroAberto(estado, e)) return { motivo: 'loja_fechada' };
  const receita = bolsa.mochila.find((i) => i.invId === receitaInvId);
  const molde = receita?.itemId.startsWith(PREFIXO_RECEITA) ? ctx.conteudo.moldes.get(receita.itemId.slice(PREFIXO_RECEITA.length)) : undefined;
  if (!molde) return { motivo: 'nao_encontrado' };
  const base = bolsa.mochila.find((i) => i.invId === baseInvId);
  if (!base || !atende(ctx, ctx.conteudo.itens.get(base.itemId), molde.base)) return { motivo: 'slot_invalido' };
  let segunda: ItemNaMochila | null = null;
  if (molde.segunda) {
    segunda = bolsa.mochila.find((i) => i.invId === segundaInvId && i.invId !== baseInvId) ?? null;
    if (!segunda || !atende(ctx, ctx.conteudo.itens.get(segunda.itemId), molde.segunda)) return { motivo: 'slot_invalido' };
  }
  if (bolsa.ouro < molde.ouro) return { motivo: 'sem_ouro' };
  if (molde.materiais.some((m) => quantidade(e, m.item) < m.qtd)) return { motivo: 'sem_material' };
  if (molde.runa && quantidade(e, `runa_${molde.runa}`) < 1) return { motivo: 'sem_material' };
  const resultado = resultadoDoMolde(ctx, molde, base.itemId);
  if (!resultado) return { motivo: 'nao_encontrado' };
  return { molde, base, segunda, resultado };
}

/** O comando `forjarMolde`: a peça base vira o resultado (no mesmo lugar da mochila); o resto é consumido. */
export function forjarMolde(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, receitaInvId: string, baseInvId: string, segundaInvId: string | null, saida: EventoSimulacao[]): boolean {
  const m = motivoDoMolde(estado, ctx, e, receitaInvId, baseInvId, segundaInvId);
  const bolsa = e.bolsa;
  if ('motivo' in m || !bolsa) {
    recusarItem(e, 'motivo' in m ? m.motivo : 'sem_mochila', estado.tick, saida);
    return false;
  }
  m.base.itemId = m.resultado;
  m.base.qtd = 1;
  if (m.segunda) bolsa.mochila = bolsa.mochila.filter((i) => i !== m.segunda);
  for (const x of m.molde.materiais) gastarItem(e, x.item, x.qtd);
  if (m.molde.runa) gastarItem(e, `runa_${m.molde.runa}`, 1);
  gastarItem(e, `${PREFIXO_RECEITA}${m.molde.id}`, 1);
  bolsa.ouro -= m.molde.ouro;
  saida.push({ t: 'forjou', tick: estado.tick, id: e.id, receita: m.molde.id, itemId: m.resultado });
  return true;
}

/** O preço de mexer num engaste (pelo nível da peça). */
export const precoDoEngaste = (ctx: Ctx, item: Item): number => ctx.balance.engaste.ouroBase + item.nivelMinimo * ctx.balance.engaste.ouroPorNivel;

/** O comando `engastar`: põe o material num engaste livre da peça. */
export function engastar(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, invId: string, materialInvId: string, saida: EventoSimulacao[]): boolean {
  const bolsa = e.bolsa;
  const recusar = (motivo: MotivoForja | 'mochila_cheia') => {
    recusarItem(e, motivo, estado.tick, saida);
    return false;
  };
  if (!bolsa || !ferreiroAberto(estado, e)) return recusar('loja_fechada');
  const peca = bolsa.mochila.find((i) => i.invId === invId);
  const material = bolsa.mochila.find((i) => i.invId === materialInvId && i.qtd > 0);
  if (!peca || !material || !ctx.conteudo.alquimia.materiais.has(material.itemId)) return recusar('nao_encontrado');
  const { base, materiais } = semEngastes(peca.itemId);
  const item = ctx.conteudo.itens.get(base);
  if (!engastavel(item) || materiais.length >= engastesDaPeca(item, ctx.balance.engaste)) return recusar('slot_invalido');
  const preco = precoDoEngaste(ctx, item);
  if (bolsa.ouro < preco) return recusar('sem_ouro');
  const novo = idEngastado([...materiais, material.itemId], base);
  if (!ctx.conteudo.itens.get(novo)) return recusar('nao_encontrado');
  bolsa.ouro -= preco;
  material.qtd--;
  bolsa.mochila = bolsa.mochila.filter((i) => i.qtd > 0);
  peca.itemId = novo;
  saida.push({ t: 'forjou', tick: estado.tick, id: e.id, receita: 'engastar', itemId: novo });
  return true;
}

/** O comando `extrair`: tira o material do engaste (`indice`); ele volta com a chance de `extrairVoltaPct`. */
export function extrair(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, invId: string, indice: number, saida: EventoSimulacao[]): boolean {
  const bolsa = e.bolsa;
  if (!bolsa || !ferreiroAberto(estado, e)) {
    recusarItem(e, 'loja_fechada', estado.tick, saida);
    return false;
  }
  const peca = bolsa.mochila.find((i) => i.invId === invId);
  const { base, materiais } = peca ? semEngastes(peca.itemId) : { base: '', materiais: [] };
  const item = ctx.conteudo.itens.get(base);
  const material = materiais[indice];
  if (!peca || !item || material === undefined) {
    recusarItem(e, 'nao_encontrado', estado.tick, saida);
    return false;
  }
  const preco = precoDoEngaste(ctx, item);
  if (bolsa.ouro < preco) {
    recusarItem(e, 'sem_ouro', estado.tick, saida);
    return false;
  }
  bolsa.ouro -= preco;
  const resto = materiais.filter((_, i) => i !== indice);
  peca.itemId = resto.length > 0 ? idEngastado(resto, base) : base;
  const volta = aleatorio(estado.rng) * 100 < ctx.balance.engaste.extrairVoltaPct;
  const devolvido = volta ? ctx.conteudo.itens.get(material) : undefined;
  if (devolvido) guardarItem(bolsa, devolvido, 1, ctx.balance.inventario);
  saida.push({ t: 'forjou', tick: estado.tick, id: e.id, receita: devolvido ? 'extrair_volta' : 'extrair', itemId: peca.itemId });
  return true;
}

/**
 * O que a forja deixa no abate (os ids): a receita que a criatura guarda (pelo preset, pela dimensão ou, no chefe,
 * as de chefe) e um material alquímico da dimensão dela. O RNG é o da instância (não desloca o do combate).
 */
export function dropsDaForja(ctx: Ctx, preset: string, boss: boolean, rng: EstadoRng, noNinho = false): string[] {
  const r = ctx.balance.engaste;
  const dimensao = ctx.conteudo.presets.get(preset)?.dimensao ?? null;
  const saida: string[] = [];
  const guardadas = [...ctx.conteudo.moldes.values()].filter((m) => m.cai.presets.includes(preset) || (dimensao !== null && m.cai.dimensoes.includes(dimensao)) || (boss && m.cai.chefes));
  // Marco 53 (22/11/2026, D-203): no ninho dela, a criatura guarda a receita mais vezes (world/ninhos.ts).
  const pct = (boss ? r.dropReceitaChefePct : r.dropReceitaPct) * (noNinho ? r.ninho.receitaMult : 1);
  if (guardadas.length > 0 && aleatorio(rng) * 100 < pct) {
    const m = guardadas[inteiro(rng, 0, guardadas.length - 1)];
    if (m) saida.push(`${PREFIXO_RECEITA}${m.id}`);
  }
  if (dimensao !== null && aleatorio(rng) * 100 < (boss ? r.dropMaterialChefePct : r.dropMaterialPct)) {
    const daDimensao = [...ctx.conteudo.alquimia.materiais].filter(([, m]) => m.dimensao === dimensao).map(([id]) => id);
    const id = daDimensao[inteiro(rng, 0, daDimensao.length - 1)];
    if (id) saida.push(id);
  }
  return saida;
}
