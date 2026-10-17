// Mochila, equipamento e pontos de atributo (§2.10, §2.12). Marco 6 (13/10/2026).
// Tudo chega por comando (§3.3); cada recusa sai como evento com motivo, para a interface explicar.

import { aplicarEfeito } from '../combat/efeitos';
import { excedeLimite } from '../combat/efeitos-fluxo';
import { REGISTRO_EFEITOS, type EfeitoCanonico } from '../combat/registro-efeitos';
import type { Balance, ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao, MotivoItem } from '../core/eventos-simulacao';
import { SLOTS_BARRA, type Bolsa, type Entidade, type ItemNaMochila } from '../entities/entidade';
import type { ClasseJogador } from '../entities/presets';
import { SLOTS_DE_EQUIPAMENTO, type Slot } from '../modos/modo';
import { recalcularFicha } from './derivados';
import { aplicarItemDeProgressao } from './itens-progressao';
import { aprenderPorLivro } from './habilidades-personagem';
import { NOMES_ATRIBUTOS, type Item, type NomeAtributo } from './itens';

export function criarBolsa(classe: ClasseJogador, ouroInicial = 0): Bolsa {
  const bolsa: Bolsa = {
    atributosBase: { ...classe.atributos },
    defesaBase: classe.defesa,
    hpBase: classe.hpBase,
    equipamento: Object.fromEntries(SLOTS_DE_EQUIPAMENTO.map((s) => [s, null])) as Record<Slot, ItemNaMochila | null>,
    mochila: [],
    pontosAtributo: 0,
    proximoInv: 1,
    ouro: ouroInicial,
    // Marco 14: começa com as habilidades da classe no rank 1, as 4 primeiras na barra.
    classeId: classe.id,
    conhecidas: classe.habilidades.map((id) => ({ id, rank: 1, caminhos: [] })),
    barra: Array.from({ length: SLOTS_BARRA }, (_, i) => classe.habilidades[i] ?? null),
    pontosHabilidade: 0,
    personagemId: '',
    estudo: null,
    missoes: {},
    missoesConcluidas: [],
    diario: [],
  };
  for (const { id, qtd } of classe.itensIniciais) bolsa.mochila.push({ invId: `i${bolsa.proximoInv++}`, itemId: id, qtd, ref: null });
  return bolsa;
}

/**
 * Guarda `qtd` unidades: consumíveis empilham até `pilhaMax`; o resto ocupa novas entradas. Marco 14: `ref` é o
 * conteúdo do livro raro; só empilha com o mesmo `ref`.
 */
export function guardarItem(bolsa: Bolsa, item: Item, qtd: number, regras: Balance['inventario'], ref: string | null = null): boolean {
  if (!cabeNaMochila(bolsa, item, qtd, regras)) return false;
  let restante = qtd;
  if (empilha(item)) {
    for (const entrada of bolsa.mochila) {
      if (entrada.itemId !== item.id || entrada.ref !== ref || restante === 0) continue;
      const cabe = Math.min(restante, regras.pilhaMax - entrada.qtd);
      entrada.qtd += cabe;
      restante -= cabe;
    }
  }
  const porEntrada = empilha(item) ? regras.pilhaMax : 1;
  while (restante > 0) {
    const n = Math.min(restante, porEntrada);
    bolsa.mochila.push({ invId: `i${bolsa.proximoInv++}`, itemId: item.id, qtd: n, ref });
    restante -= n;
  }
  return true;
}

/** Consumíveis e livros empilham (marco 14: livros também; marco 18: chaves e materiais da forja também). */
export function empilha(item: Item): boolean {
  return item.tipo === 'consumivel' || item.tipo === 'livro' || item.tipo === 'chave';
}

export function cabeNaMochila(bolsa: Bolsa, item: Item, qtd: number, regras: Balance['inventario']): boolean {
  const porEntrada = empilha(item) ? regras.pilhaMax : 1;
  const sobraEmPilhas =
    item.tipo === 'consumivel'
      ? bolsa.mochila.filter((i) => i.itemId === item.id).reduce((s, i) => s + (regras.pilhaMax - i.qtd), 0)
      : 0;
  const novasEntradas = Math.ceil(Math.max(0, qtd - sobraEmPilhas) / porEntrada);
  return bolsa.mochila.length + novasEntradas <= regras.capacidade;
}

type Resultado = { ok: true } | { ok: false; motivo: MotivoItem };
const recusa = (motivo: MotivoItem): Resultado => ({ ok: false, motivo });
const OK: Resultado = { ok: true };

function relatar(e: Entidade, r: Resultado, tick: number, saida: EventoSimulacao[]): void {
  if (!r.ok) recusarItem(e, r.motivo, tick, saida);
}

/** Recusa com motivo, para a interface explicar (mochila, loja, baú). */
export function recusarItem(e: Entidade, motivo: MotivoItem, tick: number, saida: EventoSimulacao[]): void {
  saida.push({ t: 'itemRecusado', tick, id: e.id, motivo });
}

/** Atalhos de consumível (§2.10, D-050): as teclas 5–9 e 0, na ordem da mochila. */
export const ATALHOS_DE_CONSUMIVEL = 6;

/** As entradas que os atalhos usam: os primeiros consumíveis da mochila, na ordem dela. */
export function consumiveisComAtalho(bolsa: Bolsa, itens: ReadonlyMap<string, Item>): ItemNaMochila[] {
  return bolsa.mochila.filter((i) => itens.get(i.itemId)?.tipo === 'consumivel' && !itens.get(i.itemId)?.progressao).slice(0, ATALHOS_DE_CONSUMIVEL);
}

/** Ordenação manual da mochila (§2.10, marco 9A): leva a entrada para `posicao` (limitada à lista). */
export function moverItem(e: Entidade, invId: string, posicao: number, tick: number, saida: EventoSimulacao[]): void {
  const r = ((): Resultado => {
    const bolsa = e.bolsa;
    if (!bolsa) return recusa('sem_mochila');
    const indice = bolsa.mochila.findIndex((i) => i.invId === invId);
    const entrada = bolsa.mochila[indice];
    if (!entrada) return recusa('nao_encontrado');
    const destino = Math.max(0, Math.min(bolsa.mochila.length - 1, Math.trunc(posicao)));
    bolsa.mochila.splice(indice, 1);
    bolsa.mochila.splice(destino, 0, entrada);
    return OK;
  })();
  relatar(e, r, tick, saida);
}

export function equipar(e: Entidade, ctx: ContextoSimulacao, invId: string, slot: Slot, tick: number, saida: EventoSimulacao[]): void {
  const r = ((): Resultado => {
    const bolsa = e.bolsa;
    if (!bolsa) return recusa('sem_mochila');
    const indice = bolsa.mochila.findIndex((i) => i.invId === invId);
    const entrada = bolsa.mochila[indice];
    const item = entrada ? ctx.conteudo.itens.get(entrada.itemId) : undefined;
    if (!entrada || !item) return recusa('nao_encontrado');
    if (item.tipo !== 'equipamento' || item.slotPadrao !== slot) return recusa('slot_invalido');
    if (e.nivel < item.nivelMinimo) return recusa('nivel_insuficiente');
    // Tira da mochila e troca com o que estava no slot: a troca sempre cabe.
    bolsa.mochila.splice(indice, 1);
    const anterior = bolsa.equipamento[slot];
    if (anterior) bolsa.mochila.push(anterior);
    bolsa.equipamento[slot] = entrada;
    recalcularFicha(e, ctx);
    saida.push({ t: 'equipou', tick, id: e.id, itemId: item.id, slot });
    return OK;
  })();
  relatar(e, r, tick, saida);
}

export function desequipar(e: Entidade, ctx: ContextoSimulacao, slot: Slot, tick: number, saida: EventoSimulacao[]): void {
  const r = ((): Resultado => {
    const bolsa = e.bolsa;
    if (!bolsa) return recusa('sem_mochila');
    const entrada = bolsa.equipamento[slot];
    if (!entrada) return recusa('nao_encontrado');
    if (bolsa.mochila.length >= ctx.balance.inventario.capacidade) return recusa('mochila_cheia');
    bolsa.equipamento[slot] = null;
    bolsa.mochila.push(entrada);
    recalcularFicha(e, ctx);
    return OK;
  })();
  relatar(e, r, tick, saida);
}

/** O efeito faria algo agora? Cura e recurso instantâneos não servem com a barra cheia. */
function serviria(e: Entidade, ef: EfeitoCanonico): boolean {
  const d = REGISTRO_EFEITOS[ef.tipo];
  const restaura = d.instantaneo ?? (ef.duracaoMs <= 0 ? d.periodico : null);
  if (restaura === 'cura') return e.hp < e.hpMax;
  if (restaura === 'recurso') return e.mana < e.manaMax;
  return true;
}

/**
 * Consumível: aplica os efeitos pelo dispatcher único (§2.8, marco 8A) e gasta uma unidade. Se
 * nenhum efeito serviria agora, recusa sem gastar.
 */
export function usarItem(estado: EstadoJogo, e: Entidade, ctx: ContextoSimulacao, invId: string, saida: EventoSimulacao[]): void {
  const tick = estado.tick;
  const r = ((): Resultado => {
    const bolsa = e.bolsa;
    if (!bolsa) return recusa('sem_mochila');
    const indice = bolsa.mochila.findIndex((i) => i.invId === invId);
    const entrada = bolsa.mochila[indice];
    const item = entrada ? ctx.conteudo.itens.get(entrada.itemId) : undefined;
    if (!entrada || !item) return recusa('nao_encontrado');
    // Marco 14: o livro ensina a habilidade (a do catálogo, ou a gerada guardada no `ref`) e some.
    if (item.tipo === 'livro') {
      const ensina = item.ensina ?? entrada.ref;
      if (!ensina) return recusa('ja_conhece');
      // Marco 18 (D-068): o livro começa um estudo; com outro em andamento, é recusado sem gastar.
      const r = aprenderPorLivro(e, ctx, ensina, tick, saida);
      if (r !== 'ok') return recusa(r);
      entrada.qtd--;
      if (entrada.qtd <= 0) bolsa.mochila.splice(indice, 1);
      saida.push({ t: 'usouItem', tick, id: e.id, itemId: item.id, hp: 0, mana: 0 });
      return OK;
    }
    if (item.tipo !== 'consumivel') return recusa('nao_consumivel');
    if (item.progressao) {
      if (!aplicarItemDeProgressao(e, ctx, item)) return recusa('sem_efeito');
      entrada.qtd--;
      if (entrada.qtd <= 0) bolsa.mochila.splice(indice, 1);
      saida.push({ t: 'usouItem', tick, id: e.id, itemId: item.id, hp: 0, mana: 0 });
      return OK;
    }
    // Marco 10A-3: pergaminho de invocação acima do limite do modo é recusado sem gastar (§5.6).
    if (excedeLimite(estado, ctx, e, item.efeitos)) return recusa('limite');
    if (!item.efeitos.some((ef) => serviria(e, ef))) return recusa('sem_efeito');
    const [hpAntes, manaAntes] = [e.hp, e.mana];
    for (const ef of item.efeitos) aplicarEfeito(estado, ctx, e, ef, { id: e.id, x: e.x, y: e.y }, null, saida);
    const [hp, mana] = [e.hp - hpAntes, e.mana - manaAntes];
    entrada.qtd--;
    if (entrada.qtd <= 0) bolsa.mochila.splice(indice, 1);
    saida.push({ t: 'usouItem', tick, id: e.id, itemId: item.id, hp, mana });
    return OK;
  })();
  relatar(e, r, tick, saida);
}

export function distribuirPonto(e: Entidade, ctx: ContextoSimulacao, atributo: NomeAtributo, tick: number, saida: EventoSimulacao[]): void {
  const r = ((): Resultado => {
    const bolsa = e.bolsa;
    if (!bolsa) return recusa('sem_mochila');
    if (!NOMES_ATRIBUTOS.includes(atributo)) return recusa('nao_encontrado');
    if (bolsa.pontosAtributo <= 0) return recusa('sem_pontos');
    if (bolsa.atributosBase[atributo] >= ctx.balance.atributos.maximo) return recusa('atributo_no_maximo');
    bolsa.pontosAtributo--;
    bolsa.atributosBase[atributo]++;
    recalcularFicha(e, ctx);
    return OK;
  })();
  relatar(e, r, tick, saida);
}
