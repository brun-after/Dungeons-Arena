// Os anúncios do mercado do Mundo (marco 30, 30/10/2026, D-129), no servidor. Duas implementações, como a dos
// personagens: o Supabase (tabela `mercado_mundo`, só a chave de serviço lê e grava) e a memória (testes e
// desenvolvimento sem nuvem). As operações que disputam o mesmo anúncio (comprar, cancelar, receber) mudam o estado
// só se ele ainda for o esperado, numa operação só: dois compradores ao mesmo tempo, um leva e o outro é recusado.

import { createClient } from '@supabase/supabase-js';
import { ehObjeto } from '../src/core/validar';
import { anuncioAtivo, aReceber, type Anuncio, type EstadoDoAnuncio } from '../src/mundo/mercado';

/** Quantos anúncios ativos o quadro carrega de uma vez (a busca e a página são feitas sobre eles). */
export const MAX_ATIVOS = 500;

export interface LojaDoMercado {
  /** Os anúncios ativos, os mais novos primeiro (até `MAX_ATIVOS`). */
  ativos(agora: number): Promise<Anuncio[]>;
  /** Os do vendedor que ainda não foram recebidos (abertos, vendidos, vencidos). */
  doVendedor(vendedor: string): Promise<Anuncio[]>;
  anunciar(a: Anuncio): Promise<void>;
  /** Vende o anúncio ativo, com o preço esperado e a outro que não o vendedor; null se não deu. */
  comprar(id: string, preco: number, comprador: string, agora: number): Promise<Anuncio | null>;
  /** Tira do mercado o anúncio aberto do vendedor (o item volta na hora); null se não deu. */
  cancelar(id: string, vendedor: string): Promise<Anuncio | null>;
  /** Marca como recebidos os vendidos e os vencidos do vendedor e os devolve. */
  receber(vendedor: string, agora: number): Promise<Anuncio[]>;
}

export class MercadoEmMemoria implements LojaDoMercado {
  private readonly anuncios = new Map<string, Anuncio>();

  ativos(agora: number): Promise<Anuncio[]> {
    const lista = [...this.anuncios.values()].filter((a) => anuncioAtivo(a, agora)).sort((a, b) => b.criadoEm - a.criadoEm);
    return Promise.resolve(lista.slice(0, MAX_ATIVOS).map((a) => ({ ...a, item: { ...a.item } })));
  }

  doVendedor(vendedor: string): Promise<Anuncio[]> {
    return Promise.resolve([...this.anuncios.values()].filter((a) => a.vendedor === vendedor && a.estado !== 'recebido').map((a) => ({ ...a, item: { ...a.item } })));
  }

  anunciar(a: Anuncio): Promise<void> {
    this.anuncios.set(a.id, { ...a, item: { ...a.item } });
    return Promise.resolve();
  }

  comprar(id: string, preco: number, comprador: string, agora: number): Promise<Anuncio | null> {
    const a = this.anuncios.get(id);
    if (!a || !anuncioAtivo(a, agora) || a.preco !== preco || a.vendedor === comprador) return Promise.resolve(null);
    a.estado = 'vendido';
    return Promise.resolve({ ...a, item: { ...a.item } });
  }

  cancelar(id: string, vendedor: string): Promise<Anuncio | null> {
    const a = this.anuncios.get(id);
    if (a?.vendedor !== vendedor || a.estado !== 'aberto') return Promise.resolve(null);
    a.estado = 'recebido';
    return Promise.resolve({ ...a, item: { ...a.item } });
  }

  receber(vendedor: string, agora: number): Promise<Anuncio[]> {
    const lista: Anuncio[] = [];
    for (const a of this.anuncios.values()) {
      if (a.vendedor !== vendedor || !aReceber(a, agora)) continue;
      lista.push({ ...a, item: { ...a.item } });
      a.estado = 'recebido';
    }
    return Promise.resolve(lista);
  }
}

const ESTADOS: readonly EstadoDoAnuncio[] = ['aberto', 'vendido', 'cancelado', 'recebido'];

/** A linha da tabela como Anuncio (null se veio torta). */
function lerLinha(v: unknown): Anuncio | null {
  if (!ehObjeto(v) || !ehObjeto(v.item)) return null;
  const { id, vendedor, vendedor_nome: nome, preco, liquido, criado_em: criado, expira_em: expira, estado } = v;
  const it = v.item;
  if (typeof id !== 'string' || typeof vendedor !== 'string' || typeof nome !== 'string' || typeof preco !== 'number' || typeof liquido !== 'number') return null;
  if (typeof criado !== 'string' || typeof expira !== 'string' || !ESTADOS.includes(estado as EstadoDoAnuncio)) return null;
  if (typeof it.itemId !== 'string' || typeof it.qtd !== 'number' || typeof it.invId !== 'string') return null;
  return {
    id,
    vendedor,
    vendedorNome: nome,
    item: { invId: it.invId, itemId: it.itemId, qtd: it.qtd, ref: typeof it.ref === 'string' ? it.ref : null },
    preco,
    liquido,
    criadoEm: Date.parse(criado),
    expiraEm: Date.parse(expira),
    estado: estado as EstadoDoAnuncio,
  };
}

const linhas = (data: unknown): Anuncio[] => (Array.isArray(data) ? data.map(lerLinha).filter((a): a is Anuncio => a !== null) : []);
const iso = (ms: number): string => new Date(ms).toISOString();

export class MercadoSupabase implements LojaDoMercado {
  private readonly cliente;

  constructor(url: string, chaveServico: string) {
    this.cliente = createClient(url, chaveServico, { auth: { persistSession: false, autoRefreshToken: false } });
  }

  private tabela() {
    return this.cliente.from('mercado_mundo');
  }

  private static conferir(error: { message: string } | null): void {
    if (error) throw new Error(`mercado_mundo: ${error.message}`);
  }

  async ativos(agora: number): Promise<Anuncio[]> {
    const { data, error } = await this.tabela().select('*').eq('estado', 'aberto').gt('expira_em', iso(agora)).order('criado_em', { ascending: false }).limit(MAX_ATIVOS);
    MercadoSupabase.conferir(error);
    return linhas(data);
  }

  async doVendedor(vendedor: string): Promise<Anuncio[]> {
    const { data, error } = await this.tabela().select('*').eq('vendedor', vendedor).neq('estado', 'recebido').limit(100);
    MercadoSupabase.conferir(error);
    return linhas(data);
  }

  async anunciar(a: Anuncio): Promise<void> {
    const { error } = await this.tabela().insert({
      id: a.id,
      vendedor: a.vendedor,
      vendedor_nome: a.vendedorNome,
      item: a.item,
      preco: a.preco,
      liquido: a.liquido,
      criado_em: iso(a.criadoEm),
      expira_em: iso(a.expiraEm),
      estado: a.estado,
    });
    MercadoSupabase.conferir(error);
  }

  async comprar(id: string, preco: number, comprador: string, agora: number): Promise<Anuncio | null> {
    const { data, error } = await this.tabela()
      .update({ estado: 'vendido', comprador })
      .eq('id', id)
      .eq('estado', 'aberto')
      .eq('preco', preco)
      .neq('vendedor', comprador)
      .gt('expira_em', iso(agora))
      .select();
    MercadoSupabase.conferir(error);
    return linhas(data)[0] ?? null;
  }

  async cancelar(id: string, vendedor: string): Promise<Anuncio | null> {
    const { data, error } = await this.tabela().update({ estado: 'recebido' }).eq('id', id).eq('vendedor', vendedor).eq('estado', 'aberto').select();
    MercadoSupabase.conferir(error);
    return linhas(data)[0] ?? null;
  }

  async receber(vendedor: string, agora: number): Promise<Anuncio[]> {
    const vendidos = await this.tabela().update({ estado: 'recebido' }).eq('vendedor', vendedor).eq('estado', 'vendido').select();
    MercadoSupabase.conferir(vendidos.error);
    const vencidos = await this.tabela().update({ estado: 'recebido' }).eq('vendedor', vendedor).eq('estado', 'aberto').lte('expira_em', iso(agora)).select();
    MercadoSupabase.conferir(vencidos.error);
    // O estado que volta já é "recebido": o que importa é o que era (vendido dá ouro; vencido, o item).
    return [...linhas(vendidos.data).map((a) => ({ ...a, estado: 'vendido' as const })), ...linhas(vencidos.data).map((a) => ({ ...a, estado: 'aberto' as const }))];
  }
}
