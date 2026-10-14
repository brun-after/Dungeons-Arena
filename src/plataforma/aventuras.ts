// Fases do jogador no store `aventuras` (§3.5, §3.10). Marco 6C (13/10/2026): uma fase por
// aventura. Grava-se o rascunho como está (inclusive inválido, para nunca perder trabalho);
// jogar e exportar exigem a fase válida.

import { TAMANHO_MAX, TAMANHO_MIN } from '../world/validacao-fase';
import type { FaseEditavel } from '../editor/grade';
import { apagarDoBanco, gravarNoBanco, lerDoBanco, listarDoBanco } from './banco';

export interface RegistroAventura extends FaseEditavel {
  atualizadoEm: number;
}

function ehInteiro(v: unknown, min: number, max: number): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;
}

/** Confere a forma de um registro vindo do banco. */
export function lerRegistroAventura(bruto: unknown): RegistroAventura | null {
  if (typeof bruto !== 'object' || bruto === null) return null;
  const r = bruto as Partial<Record<keyof RegistroAventura, unknown>>;
  if (typeof r.id !== 'string' || typeof r.nome !== 'string') return null;
  if (!ehInteiro(r.largura, TAMANHO_MIN, TAMANHO_MAX) || !ehInteiro(r.altura, TAMANHO_MIN, TAMANHO_MAX)) return null;
  if (!(r.celulas instanceof Uint8Array) || r.celulas.length !== r.largura * r.altura) return null;
  const spawn = r.spawn;
  const spawnOk = spawn === null || (typeof spawn === 'object' && typeof (spawn as { x?: unknown }).x === 'number');
  if (!spawnOk || !Array.isArray(r.inimigos)) return null;
  return {
    id: r.id,
    nome: r.nome,
    largura: r.largura,
    altura: r.altura,
    celulas: r.celulas,
    spawn: spawn as FaseEditavel['spawn'],
    inimigos: r.inimigos as FaseEditavel['inimigos'],
    atualizadoEm: typeof r.atualizadoEm === 'number' ? r.atualizadoEm : 0,
  };
}

export async function listarAventuras(): Promise<RegistroAventura[]> {
  const brutos = await listarDoBanco('aventuras');
  return brutos
    .map(lerRegistroAventura)
    .filter((r): r is RegistroAventura => r !== null)
    .sort((a, b) => b.atualizadoEm - a.atualizadoEm);
}

export async function carregarAventura(id: string): Promise<RegistroAventura | null> {
  return lerRegistroAventura(await lerDoBanco('aventuras', id));
}

export async function gravarAventura(f: FaseEditavel): Promise<void> {
  const registro: RegistroAventura = {
    id: f.id,
    nome: f.nome,
    largura: f.largura,
    altura: f.altura,
    celulas: new Uint8Array(f.celulas),
    spawn: f.spawn ? { ...f.spawn } : null,
    inimigos: f.inimigos.map((i) => ({ ...i })),
    atualizadoEm: Date.now(),
  };
  await gravarNoBanco('aventuras', registro);
}

export async function apagarAventura(id: string): Promise<void> {
  await apagarDoBanco('aventuras', id);
}

/** Id novo e estável para uma fase do jogador. */
export function novoIdDeAventura(): string {
  return `minha-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}
