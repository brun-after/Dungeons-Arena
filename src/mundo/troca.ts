// A troca direta do Mundo (marco 30, 30/10/2026, D-129): dois jogadores perto, na mesma sala.
// - Um propõe, o outro aceita: a janela abre para os dois.
// - Cada um põe na oferta pilhas da mochila (até `mundo.troca.maxItens`) e ouro. Toda mudança de oferta desfaz as
//   confirmações (ninguém confirma uma oferta e recebe outra).
// - Com as duas confirmações, a troca acontece de uma vez: tudo é feito em cópias das duas mochilas e só vale se as
//   duas ofertas ainda existirem e os dois lados couberem; senão nada muda.
// Puro.

import type { ContextoSimulacao } from '../core/contexto';
import type { EntidadeId } from '../core/comandos';
import type { Bolsa, ItemNaMochila } from '../entities/entidade';
import { guardarItem } from '../progression/inventario';
import type { OfertaDeItem } from './acoes';
import type { MotivoDoMundo, OfertaVista } from './avisos';

export interface LadoDaTroca {
  id: EntidadeId;
  itens: OfertaDeItem[];
  ouro: number;
  confirmou: boolean;
}

export interface Troca {
  /** Quem propôs. */
  a: LadoDaTroca;
  b: LadoDaTroca;
  /** false enquanto `b` não aceitou. */
  aberta: boolean;
}

const lado = (id: EntidadeId): LadoDaTroca => ({ id, itens: [], ouro: 0, confirmou: false });

export class TrocasDaSala {
  private readonly trocas: Troca[] = [];

  de(id: EntidadeId): Troca | undefined {
    return this.trocas.find((t) => t.a.id === id || t.b.id === id);
  }

  propor(de: EntidadeId, para: EntidadeId): MotivoDoMundo | null {
    if (de === para) return 'troca_invalida';
    // Quem propõe de novo desfaz o convite antigo dele; quem já está numa troca aberta não recebe outro.
    const minha = this.de(de);
    if (minha?.aberta) return 'troca_ocupado';
    if (minha) this.remover(minha);
    if (this.de(para)?.aberta) return 'troca_ocupado';
    this.trocas.push({ a: lado(de), b: lado(para), aberta: false });
    return null;
  }

  aceitar(quem: EntidadeId, de: EntidadeId): Troca | MotivoDoMundo {
    const t = this.trocas.find((x) => !x.aberta && x.a.id === de && x.b.id === quem);
    if (!t) return 'convite_expirado';
    // Os outros convites para quem aceitou caem.
    for (const x of [...this.trocas]) if (x !== t && !x.aberta && (x.b.id === quem || x.a.id === quem)) this.remover(x);
    t.aberta = true;
    return t;
  }

  oferecer(quem: EntidadeId, itens: OfertaDeItem[], ouro: number, maxItens: number): Troca | MotivoDoMundo {
    const t = this.de(quem);
    if (!t?.aberta || itens.length > maxItens) return 'troca_invalida';
    const meu = t.a.id === quem ? t.a : t.b;
    meu.itens = itens.map((i) => ({ ...i }));
    meu.ouro = ouro;
    t.a.confirmou = false;
    t.b.confirmou = false;
    return t;
  }

  /** Confirma; com as duas confirmações devolve a troca pronta (a sala executa e a remove). */
  confirmar(quem: EntidadeId): { troca: Troca; pronta: boolean } | MotivoDoMundo {
    const t = this.de(quem);
    if (!t?.aberta) return 'troca_invalida';
    (t.a.id === quem ? t.a : t.b).confirmou = true;
    return { troca: t, pronta: t.a.confirmou && t.b.confirmou };
  }

  /** Desfaz a troca (ou o convite) de quem pediu, saiu ou morreu; devolve a que caiu. */
  cancelar(quem: EntidadeId): Troca | undefined {
    const t = this.de(quem);
    if (t) this.remover(t);
    return t;
  }

  remover(t: Troca): void {
    const i = this.trocas.indexOf(t);
    if (i >= 0) this.trocas.splice(i, 1);
  }

  /** As trocas e convites que envolvem as entidades (para limpar quem saiu). */
  todas(): readonly Troca[] {
    return this.trocas;
  }
}

/** A oferta como o outro a vê (o item de cada pilha, pela mochila de quem oferece). */
export function ofertaVista(l: LadoDaTroca, bolsa: Bolsa | null): OfertaVista {
  const itens = l.itens.flatMap((o) => {
    const m = bolsa?.mochila.find((x) => x.invId === o.invId);
    return m ? [{ itemId: m.itemId, qtd: Math.min(o.qtd, m.qtd) }] : [];
  });
  return { itens, ouro: l.ouro };
}

interface Copia {
  bolsa: Bolsa;
  saem: ItemNaMochila[];
}

/** Tira a oferta de uma cópia da bolsa; null se a oferta não existe mais (pilha sumiu, quantidade, ouro). */
function tirarOferta(bolsa: Bolsa, l: LadoDaTroca): Copia | null {
  const copia: Bolsa = { ...bolsa, mochila: bolsa.mochila.map((i) => ({ ...i })) };
  if (copia.ouro < l.ouro) return null;
  copia.ouro -= l.ouro;
  const saem: ItemNaMochila[] = [];
  for (const o of l.itens) {
    const m = copia.mochila.find((x) => x.invId === o.invId);
    if (!m || m.qtd < o.qtd) return null;
    m.qtd -= o.qtd;
    saem.push({ ...m, qtd: o.qtd });
  }
  copia.mochila = copia.mochila.filter((m) => m.qtd > 0);
  return { bolsa: copia, saem };
}

function receber(ctx: ContextoSimulacao, c: Copia, vem: readonly ItemNaMochila[], ouro: number): boolean {
  c.bolsa.ouro += ouro;
  for (const m of vem) {
    const item = ctx.conteudo.itens.get(m.itemId);
    if (!item || !guardarItem(c.bolsa, item, m.qtd, ctx.balance.inventario, m.ref)) return false;
  }
  return true;
}

/** Executa a troca nas duas bolsas, de uma vez; null se deu certo, senão o motivo (e nada muda). */
export function executarTroca(ctx: ContextoSimulacao, t: Troca, bolsaA: Bolsa, bolsaB: Bolsa): MotivoDoMundo | null {
  const a = tirarOferta(bolsaA, t.a);
  const b = tirarOferta(bolsaB, t.b);
  if (!a || !b) return 'troca_invalida';
  if (!receber(ctx, a, b.saem, t.b.ouro) || !receber(ctx, b, a.saem, t.a.ouro)) return 'mochila_cheia';
  for (const [real, copia] of [[bolsaA, a.bolsa], [bolsaB, b.bolsa]] as const) {
    real.mochila = copia.mochila;
    real.ouro = copia.ouro;
    real.proximoInv = copia.proximoInv;
  }
  return null;
}
