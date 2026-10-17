// Aventuras do jogador no store `aventuras` (§3.5, §3.10). Marco 6C (13/10/2026): uma fase por
// aventura. Grava-se o rascunho como está (inclusive inválido, para nunca perder trabalho);
// jogar e exportar exigem a fase válida.
// Marco 11A (16/10/2026, D-066): a aventura tem várias fases (`fases`, até 12). O registro antigo (uma fase solta,
// com os orbes no formato do 8A) é lido como uma aventura de uma fase.

import { MAX_FASES_AVENTURA, type Aventura } from '../editor/aventura';
import { clonarFaseEditavel, type FaseEditavel, type ObjetoEditavel } from '../editor/grade';
import type { InimigoPosicionado, PortaInterna } from '../world/fase';
import { TAMANHO_MAX, TAMANHO_MIN } from '../world/validacao-fase';
import { apagarDoBanco, gravarNoBanco, lerDoBanco, listarDoBanco } from './banco';

export interface RegistroAventura extends Aventura {
  versao: 2;
  atualizadoEm: number;
}

type Bruto = Record<string, unknown>;

const ehObjeto = (v: unknown): v is Bruto => typeof v === 'object' && v !== null && !Array.isArray(v);

function ehInteiro(v: unknown, min: number, max: number): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;
}

const VALOR_ORBE_ANTIGO: Readonly<Record<string, number>> = { orbe_hp: 30, orbe_recurso: 50 };

/** Objetos do rascunho; os orbes de antes do 11A (`{x, y, tipo, efeito}`) ganham valor e modo. */
function lerObjetos(v: unknown): ObjetoEditavel[] {
  if (!Array.isArray(v)) return [];
  return v.filter(ehObjeto).flatMap((o): ObjetoEditavel[] => {
    if (typeof o.tipo !== 'string' || typeof o.x !== 'number' || typeof o.y !== 'number') return [];
    const antigo = o.valor === undefined && (o.tipo === 'orbe_hp' || o.tipo === 'orbe_recurso' || o.tipo === 'orbe_efeito');
    if (!antigo) return [o as unknown as ObjetoEditavel];
    const efeito = ehObjeto(o.efeito) ? o.efeito : null;
    return o.tipo === 'orbe_efeito'
      ? efeito
        ? [{ tipo: 'orbe_efeito', x: o.x, y: o.y, valor: 1, modo: 'abs', efeito: efeito as never }]
        : []
      : [{ tipo: o.tipo as 'orbe_hp' | 'orbe_recurso', x: o.x, y: o.y, valor: VALOR_ORBE_ANTIGO[o.tipo] ?? 30, modo: 'pct' }];
  });
}

/** Uma fase do rascunho (confere a forma; o conteúdo é validado ao jogar). */
export function lerFaseEditavel(r: Bruto): FaseEditavel | null {
  if (typeof r.id !== 'string' || typeof r.nome !== 'string') return null;
  if (!ehInteiro(r.largura, TAMANHO_MIN, TAMANHO_MAX) || !ehInteiro(r.altura, TAMANHO_MIN, TAMANHO_MAX)) return null;
  if (!(r.celulas instanceof Uint8Array) || r.celulas.length !== r.largura * r.altura) return null;
  const spawn = r.spawn;
  const spawnOk = spawn === null || (ehObjeto(spawn) && typeof spawn.x === 'number' && typeof spawn.y === 'number');
  if (!spawnOk || !Array.isArray(r.inimigos)) return null;
  const saida = ehObjeto(r.portaSaida) ? r.portaSaida : null;
  return clonarFaseEditavel({
    id: r.id,
    nome: r.nome,
    largura: r.largura,
    altura: r.altura,
    celulas: r.celulas,
    spawn: spawn as FaseEditavel['spawn'],
    inimigos: r.inimigos.filter(ehObjeto) as unknown as InimigoPosicionado[],
    objetos: lerObjetos(r.objetos),
    portaSaida: saida as FaseEditavel['portaSaida'],
    portasInternas: Array.isArray(r.portasInternas) ? (r.portasInternas.filter(ehObjeto) as unknown as PortaInterna[]) : [],
    matizGraus: ehInteiro(r.matizGraus, 0, 359) ? r.matizGraus : 0,
    tilesetId: typeof r.tilesetId === 'string' ? r.tilesetId : null,
    pecas: ehObjeto(r.pecas) ? (Object.fromEntries(Object.entries(r.pecas).filter(([, v]) => typeof v === 'string')) as Record<string, string>) : {},
  });
}

/** Confere a forma de um registro vindo do banco; o formato de uma fase só (antes do 11A) vira aventura de uma fase. */
export function lerRegistroAventura(bruto: unknown): RegistroAventura | null {
  if (!ehObjeto(bruto) || typeof bruto.id !== 'string' || typeof bruto.nome !== 'string') return null;
  const atualizadoEm = typeof bruto.atualizadoEm === 'number' ? bruto.atualizadoEm : 0;
  if (!Array.isArray(bruto.fases)) {
    const unica = lerFaseEditavel(bruto);
    return unica ? { id: bruto.id, nome: bruto.nome, fases: [unica], versao: 2, atualizadoEm } : null;
  }
  const fases = bruto.fases.slice(0, MAX_FASES_AVENTURA).map((f) => (ehObjeto(f) ? lerFaseEditavel(f) : null));
  if (fases.length === 0 || fases.some((f) => f === null)) return null;
  return { id: bruto.id, nome: bruto.nome, fases: fases as FaseEditavel[], versao: 2, atualizadoEm };
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

export async function gravarAventura(a: Aventura): Promise<void> {
  const registro: RegistroAventura = {
    id: a.id,
    nome: a.nome,
    fases: a.fases.map(clonarFaseEditavel),
    versao: 2,
    atualizadoEm: Date.now(),
  };
  await gravarNoBanco('aventuras', registro);
}

export async function apagarAventura(id: string): Promise<void> {
  await apagarDoBanco('aventuras', id);
}

/** Id novo e estável para uma aventura do jogador. */
export function novoIdDeAventura(): string {
  return `minha-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}
