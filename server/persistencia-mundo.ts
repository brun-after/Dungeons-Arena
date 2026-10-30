// Persistência dos personagens do Mundo (marco 29, 30/10/2026, D-128). Duas implementações:
// - Supabase, com a chave de serviço (`SUPABASE_SERVICE_KEY`, segredo do GitHub que só o servidor conhece): confere
//   o token da conta (o JWT do login Google) e lê e grava a tabela `personagens_mundo`;
// - memória, para os testes e o desenvolvimento sem nuvem: a "conta" é o próprio token, que precisa começar com
//   `local:` (nunca vale em produção, onde a chave de serviço existe).

import { createClient } from '@supabase/supabase-js';
import { ehObjeto } from '../src/core/validar';
import { lerFichaDoMundo, SLOTS_DO_MUNDO, type FichaDoMundo } from '../src/mundo/ficha-mundo';
import type { Reino } from '../src/mundo/reino';

export interface ResumoDoMundo {
  slot: number;
  nome: string;
  classeId: string;
  nivel: number;
  vilaSalva: string;
}

export interface PersistenciaMundo {
  /** A conta do token, ou null se não confere. */
  autenticar(token: string): Promise<string | null>;
  listar(conta: string): Promise<ResumoDoMundo[]>;
  carregar(conta: string, slot: number): Promise<FichaDoMundo | null>;
  gravar(conta: string, slot: number, ficha: FichaDoMundo): Promise<void>;
}

export function slotValido(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= SLOTS_DO_MUNDO;
}

export function resumoDaFicha(slot: number, f: FichaDoMundo): ResumoDoMundo {
  const p = f.personagem;
  return { slot, nome: p.nome, classeId: p.bolsa.classeId, nivel: p.nivel, vilaSalva: f.vilaSalva };
}

export class PersistenciaEmMemoria implements PersistenciaMundo {
  private readonly fichas = new Map<string, FichaDoMundo>();

  autenticar(token: string): Promise<string | null> {
    return Promise.resolve(/^local:[\w-]{1,40}$/.test(token) ? token : null);
  }

  listar(conta: string): Promise<ResumoDoMundo[]> {
    const lista: ResumoDoMundo[] = [];
    for (let slot = 1; slot <= SLOTS_DO_MUNDO; slot++) {
      const f = this.fichas.get(`${conta}#${String(slot)}`);
      if (f) lista.push(resumoDaFicha(slot, f));
    }
    return Promise.resolve(lista);
  }

  carregar(conta: string, slot: number): Promise<FichaDoMundo | null> {
    const f = this.fichas.get(`${conta}#${String(slot)}`);
    return Promise.resolve(f ? structuredClone(f) : null);
  }

  gravar(conta: string, slot: number, ficha: FichaDoMundo): Promise<void> {
    this.fichas.set(`${conta}#${String(slot)}`, structuredClone(ficha));
    return Promise.resolve();
  }
}

export class PersistenciaSupabase implements PersistenciaMundo {
  private readonly cliente;

  constructor(
    url: string,
    chaveServico: string,
    private readonly reino: Reino,
  ) {
    this.cliente = createClient(url, chaveServico, { auth: { persistSession: false, autoRefreshToken: false } });
  }

  async autenticar(token: string): Promise<string | null> {
    const { data, error } = await this.cliente.auth.getUser(token);
    return error ? null : data.user.id;
  }

  async listar(conta: string): Promise<ResumoDoMundo[]> {
    const { data, error } = await this.cliente.from('personagens_mundo').select('slot, resumo').eq('user_id', conta);
    if (error) throw new Error(`personagens_mundo: ${error.message}`);
    return (data as { slot: number; resumo: ResumoDoMundo }[]).map((l) => ({ ...l.resumo, slot: l.slot }));
  }

  async carregar(conta: string, slot: number): Promise<FichaDoMundo | null> {
    const { data, error } = await this.cliente.from('personagens_mundo').select('ficha').eq('user_id', conta).eq('slot', slot).maybeSingle();
    if (error) throw new Error(`personagens_mundo: ${error.message}`);
    const linha: unknown = data;
    return ehObjeto(linha) ? lerFichaDoMundo(linha.ficha, this.reino) : null;
  }

  async gravar(conta: string, slot: number, ficha: FichaDoMundo): Promise<void> {
    const linha = { user_id: conta, slot, ficha, resumo: resumoDaFicha(slot, ficha), vila_salva: ficha.vilaSalva, atualizado_em: new Date().toISOString() };
    const { error } = await this.cliente.from('personagens_mundo').upsert(linha);
    if (error) throw new Error(`personagens_mundo: ${error.message}`);
  }
}
